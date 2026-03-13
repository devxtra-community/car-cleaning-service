// src/services/tasks/tasks_service.ts
import { pool } from '../../database/connectDatabase';

interface TaskInput {
  owner_name: string;
  owner_phone: string;
  car_number: string;
  car_model: string;
  car_type: string;
  car_color: string;
  car_image_url: string | null;
  car_location?: string | null;
  latitude?: number;
  longitude?: number;
  cleaner_id: string;
  task_amount?: number;
  amount_charged?: number;
}

export const createTaskService = async (data: TaskInput) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 2. Insert Task (Merged logic)
    const query = `
      INSERT INTO tasks (
        owner_name, owner_phone, car_number, car_model, car_type, car_color, 
        car_image_url, car_location, cleaner_id, task_amount, amount_charged, status,
        latitude, longitude
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'pending', $12, $13)
      RETURNING *;
    `;

    const values = [
      data.owner_name,
      data.owner_phone,
      data.car_number,
      data.car_model,
      data.car_type,
      data.car_color,
      data.car_image_url,
      data.car_location || null,
      data.cleaner_id,
      data.task_amount || 0,
      data.amount_charged || data.task_amount || 0, // Fallback to task_amount if amount_charged is missing
      data.latitude || null,
      data.longitude || null,
    ];

    const result = await client.query(query, values);

    await client.query('COMMIT');
    return result.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

/* ================= INCENTIVE CALCULATION HELPERS ================= */

interface IncentiveRule {
  id: string;
  incentive_type_id: string;
  rule_name: string;
  base_amount: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  criteria: any;
  priority: number;
  category: string;
}

// src/modules/tasks/tasks_service.ts

// Find this function and replace it:
const calculatePerformanceIncentive = (
  tasksCompleted: number,
  rule: IncentiveRule
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): { amount: number; details: any } | null => {
  // Parse criteria values as numbers to avoid string concatenation
  const targetTasks = Number(rule.criteria.target_tasks);
  const bonusPerExtra = Number(rule.criteria.bonus_per_extra);
  const baseAmount = Number(rule.base_amount);

  if (tasksCompleted < targetTasks) {
    return null; // Didn't meet target
  }

  const extraTasks = tasksCompleted - targetTasks;
  const bonusAmount = extraTasks > 0 ? extraTasks * bonusPerExtra : 0;
  const totalAmount = baseAmount + bonusAmount; // This will now correctly add numbers

  return {
    amount: totalAmount,
    details: {
      target_tasks: targetTasks,
      tasks_completed: tasksCompleted,
      base_incentive: baseAmount, // Now a number
      bonus_incentive: bonusAmount, // Now a number
      extra_tasks: extraTasks,
    },
  };
};

// Calculate milestone incentive
const calculateMilestoneIncentive = (
  totalTasks: number,
  rule: IncentiveRule
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): { amount: number; details: any } | null => {
  const { total_tasks } = rule.criteria;

  if (total_tasks && totalTasks >= total_tasks) {
    return {
      amount: rule.base_amount,
      details: {
        milestone: `${total_tasks} tasks completed`,
        total_tasks: totalTasks,
      },
    };
  }

  return null;
};

export const updateDailyWorkRecord = async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client: any,
  cleanerId: string,
  tasksCompletedToday: number,
  todayDate: string
) => {
  // Get all active performance rules
  const rulesRes = await client.query(
    `
    SELECT 
      ir.id,
      ir.incentive_type_id,
      ir.rule_name,
      ir.base_amount,
      ir.criteria,
      ir.priority,
      it.category
    FROM incentive_rules ir
    JOIN incentive_types it ON ir.incentive_type_id = it.id
    WHERE ir.active = true 
      AND it.active = true
      AND it.category = 'performance'
    ORDER BY ir.priority
    `
  );

  let totalIncentive = 0;
  const incentivesEarned = [];

  // Check if daily work record exists
  const existingRecord = await client.query(
    `
    SELECT id FROM daily_work_records
    WHERE cleaner_id = $1 AND date = $2
    `,
    [cleanerId, todayDate]
  );

  let workRecordId;

  if (existingRecord.rows.length > 0) {
    // Update existing record
    workRecordId = existingRecord.rows[0].id;
    await client.query(
      `
      UPDATE daily_work_records
      SET tasks_completed = $1,
          updated_at = NOW()
      WHERE id = $2
      `,
      [tasksCompletedToday, workRecordId]
    );

    // Delete old incentive breakdown
    await client.query(
      `
      DELETE FROM daily_incentive_breakdown
      WHERE daily_work_record_id = $1
      `,
      [workRecordId]
    );
  } else {
    // Create new record
    const newRecord = await client.query(
      `
      INSERT INTO daily_work_records (cleaner_id, date, tasks_completed)
      VALUES ($1, $2, $3)
      RETURNING id
      `,
      [cleanerId, todayDate, tasksCompletedToday]
    );
    workRecordId = newRecord.rows[0].id;
  }

  // Calculate incentives for each rule
  for (const rule of rulesRes.rows) {
    const calculation = calculatePerformanceIncentive(tasksCompletedToday, rule);

    if (calculation) {
      // Record in daily_incentive_breakdown
      await client.query(
        `
        INSERT INTO daily_incentive_breakdown (
          daily_work_record_id,
          incentive_rule_id,
          amount,
          calculation_details
        )
        VALUES ($1, $2, $3, $4)
        `,
        [workRecordId, rule.id, calculation.amount, JSON.stringify(calculation.details)]
      );

      totalIncentive += calculation.amount;
      incentivesEarned.push({
        rule_name: rule.rule_name,
        category: rule.category,
        amount: calculation.amount,
        details: calculation.details,
      });
    }
  }

  return {
    incentivesEarned,
    totalIncentive,
  };
};

export const checkMilestoneIncentives = async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client: any,
  cleanerId: string,
  totalTasks: number
) => {
  // Get all active milestone rules
  const rulesRes = await client.query(
    `
    SELECT 
      ir.id,
      ir.rule_name,
      ir.base_amount,
      ir.criteria
    FROM incentive_rules ir
    JOIN incentive_types it ON ir.incentive_type_id = it.id
    WHERE ir.active = true 
      AND it.active = true
      AND it.category = 'milestone'
    ORDER BY ir.priority
    `
  );

  const milestonesEarned = [];

  for (const rule of rulesRes.rows) {
    const calculation = calculateMilestoneIncentive(totalTasks, rule);

    if (calculation) {
      // Check if milestone already awarded
      const existing = await client.query(
        `
        SELECT id FROM milestone_achievements
        WHERE cleaner_id = $1 AND incentive_rule_id = $2
        `,
        [cleanerId, rule.id]
      );

      if (existing.rows.length === 0) {
        // Award milestone
        await client.query(
          `
          INSERT INTO milestone_achievements (
            cleaner_id,
            incentive_rule_id,
            amount,
            achievement_details,
            achieved_at
          )
          VALUES ($1, $2, $3, $4, NOW())
          `,
          [cleanerId, rule.id, calculation.amount, JSON.stringify(calculation.details)]
        );

        milestonesEarned.push({
          rule_name: rule.rule_name,
          amount: calculation.amount,
          details: calculation.details,
        });
      }
    }
  }

  return milestonesEarned;
};
