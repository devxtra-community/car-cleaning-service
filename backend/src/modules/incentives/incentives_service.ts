// src/services/incentives_service.ts
import { pool } from '../../database/connectDatabase';

/* ===================== TYPES ===================== */

type CriteriaValue = string | number | boolean;
export type Criteria = Record<string, CriteriaValue>;

export interface IncentiveType {
  id: string;
  name: string;
  category: 'performance' | 'attendance' | 'quality' | 'overtime' | 'milestone';
  calculation_type: 'fixed' | 'percentage' | 'tiered' | 'per_unit';
  description?: string;
  active: boolean;
  created_at: Date;
  updated_at: Date;
  updated_by?: string;
}

export interface IncentiveRule {
  id: string;
  incentive_type_id: string;
  rule_name: string;
  base_amount: number;
  criteria: Criteria;
  priority: number;
  active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface IncentiveRuleWithType extends IncentiveRule {
  incentive_type_name: string;
  incentive_category: string;
  calculation_type: string;
}

export interface DailyIncentiveBreakdown {
  id: string;
  daily_work_record_id: string;
  incentive_rule_id: string;
  amount: number;
  calculation_details?: Criteria;
  created_at: Date;
}

export interface DailyWorkRecord {
  id: string;
  cleaner_id: string;
  date: string;
  tasks_completed: number;
  hours_worked?: number;
  is_overtime?: boolean;
  is_weekend?: boolean;
  customer_rating?: number;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

export interface IncentiveSummary {
  rule_name: string;
  category: string;
  amount: number;
  calculation_details?: Criteria;
}

/* ===================== INCENTIVE TYPES ===================== */

export const createIncentiveType = async (data: {
  name: string;
  category: string;
  calculation_type: string;
  description?: string;
}): Promise<IncentiveType> => {
  const result = await pool.query(
    `
    INSERT INTO incentive_types (name, category, calculation_type, description)
    VALUES ($1, $2, $3, $4)
    RETURNING *
    `,
    [data.name, data.category, data.calculation_type, data.description || null]
  );

  return result.rows[0];
};

export const getAllIncentiveTypes = async (): Promise<IncentiveType[]> => {
  const result = await pool.query(
    `
    SELECT * FROM incentive_types
    ORDER BY category, name
    `
  );

  return result.rows;
};

export const getActiveIncentiveTypes = async (): Promise<IncentiveType[]> => {
  const result = await pool.query(
    `
    SELECT * FROM incentive_types
    WHERE active = true
    ORDER BY category, name
    `
  );

  return result.rows;
};

export const updateIncentiveType = async (
  id: string,
  data: {
    name?: string;
    category?: string;
    calculation_type?: string;
    description?: string;
    active?: boolean;
  }
): Promise<IncentiveType> => {
  const result = await pool.query(
    `
    UPDATE incentive_types
    SET 
      name = COALESCE($2, name),
      category = COALESCE($3, category),
      calculation_type = COALESCE($4, calculation_type),
      description = COALESCE($5, description),
      active = COALESCE($6, active),
      updated_at = NOW()
    WHERE id = $1
    RETURNING *
    `,
    [
      id,
      data.name ?? null,
      data.category ?? null,
      data.calculation_type ?? null,
      data.description ?? null,
      data.active ?? null,
    ]
  );

  if (!result.rows.length) {
    throw new Error('INCENTIVE_TYPE_NOT_FOUND');
  }

  return result.rows[0];
};

export const deleteIncentiveType = async (id: string): Promise<void> => {
  const result = await pool.query(`DELETE FROM incentive_types WHERE id = $1`, [id]);

  if (!result.rowCount) {
    throw new Error('INCENTIVE_TYPE_NOT_FOUND');
  }
};

/* ===================== INCENTIVE RULES ===================== */

export const createIncentiveRule = async (data: {
  incentive_type_id: string;
  rule_name: string;
  base_amount: number;
  criteria: Criteria;
  priority?: number;
}): Promise<IncentiveRule> => {
  // Ensure criteria values are numbers
  const sanitizedCriteria: Criteria = { ...data.criteria };

  // Convert string numbers to actual numbers in criteria
  Object.keys(sanitizedCriteria).forEach((key) => {
    const value = sanitizedCriteria[key];
    if (typeof value === 'string' && !isNaN(Number(value))) {
      sanitizedCriteria[key] = Number(value);
    }
  });

  const result = await pool.query(
    `
    INSERT INTO incentive_rules 
    (incentive_type_id, rule_name, base_amount, criteria, priority)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
    `,
    [
      data.incentive_type_id,
      data.rule_name,
      Number(data.base_amount),
      JSON.stringify(sanitizedCriteria),
      data.priority || 0,
    ]
  );

  return result.rows[0];
};

export const getAllIncentiveRules = async (): Promise<IncentiveRuleWithType[]> => {
  const result = await pool.query(
    `
    SELECT 
      ir.*,
      it.name as incentive_type_name,
      it.category as incentive_category,
      it.calculation_type
    FROM incentive_rules ir
    JOIN incentive_types it ON ir.incentive_type_id = it.id
    ORDER BY it.category, ir.priority, ir.rule_name
    `
  );

  return result.rows;
};

export const getIncentiveRulesByType = async (
  incentive_type_id: string
): Promise<IncentiveRule[]> => {
  const result = await pool.query(
    `
    SELECT * FROM incentive_rules
    WHERE incentive_type_id = $1 AND active = true
    ORDER BY priority, rule_name
    `,
    [incentive_type_id]
  );

  return result.rows;
};

export const getActiveIncentiveRules = async (): Promise<IncentiveRuleWithType[]> => {
  const result = await pool.query(
    `
    SELECT 
      ir.*,
      it.name as incentive_type_name,
      it.category as incentive_category,
      it.calculation_type
    FROM incentive_rules ir
    JOIN incentive_types it ON ir.incentive_type_id = it.id
    WHERE ir.active = true AND it.active = true
    ORDER BY it.category, ir.priority, ir.rule_name
    `
  );

  return result.rows;
};

export const updateIncentiveRule = async (
  id: string,
  data: {
    rule_name?: string;
    base_amount?: number;
    criteria?: Criteria;
    priority?: number;
    active?: boolean;
  }
): Promise<IncentiveRule> => {
  const result = await pool.query(
    `
    UPDATE incentive_rules
    SET 
      rule_name = COALESCE($2, rule_name),
      base_amount = COALESCE($3, base_amount),
      criteria = COALESCE($4, criteria),
      priority = COALESCE($5, priority),
      active = COALESCE($6, active),
      updated_at = NOW()
    WHERE id = $1
    RETURNING *
    `,
    [
      id,
      data.rule_name ?? null,
      data.base_amount ?? null,
      data.criteria ? JSON.stringify(data.criteria) : null,
      data.priority ?? null,
      data.active ?? null,
    ]
  );

  if (!result.rows.length) {
    throw new Error('INCENTIVE_RULE_NOT_FOUND');
  }

  return result.rows[0];
};

export const deleteIncentiveRule = async (id: string): Promise<void> => {
  const result = await pool.query(`DELETE FROM incentive_rules WHERE id = $1`, [id]);

  if (!result.rowCount) {
    throw new Error('INCENTIVE_RULE_NOT_FOUND');
  }
};

/* ===================== INCENTIVE CALCULATION ===================== */

const calculatePerformanceIncentive = (
  tasksCompleted: number,
  rule: IncentiveRule
): { amount: number; details: Criteria } | null => {
  const target_tasks = rule.criteria['target_tasks'] as number;
  const bonus_per_extra = rule.criteria['bonus_per_extra'] as number;

  if (tasksCompleted < target_tasks) {
    return null;
  }

  const baseAmount = Number(rule.base_amount);
  const extraTasks = tasksCompleted - target_tasks;
  const bonusAmount = extraTasks > 0 ? extraTasks * bonus_per_extra : 0;

  return {
    amount: baseAmount + bonusAmount,
    details: {
      target_tasks,
      tasks_completed: tasksCompleted,
      base_incentive: baseAmount,
      bonus_incentive: bonusAmount,
      extra_tasks: extraTasks,
    },
  };
};

const calculateOvertimeIncentive = (
  hoursWorked: number,
  hourlyRate: number,
  rule: IncentiveRule
): { amount: number; details: Criteria } => {
  const multiplier = rule.criteria['multiplier'] as number;
  const amount = hoursWorked * hourlyRate * multiplier;

  return {
    amount,
    details: {
      hours_worked: hoursWorked,
      hourly_rate: hourlyRate,
      multiplier,
      type: rule.criteria['applies_to'] as string,
    },
  };
};

const calculateQualityIncentive = (
  rating: number,
  rules: IncentiveRule[]
): { amount: number; details: Criteria; rule_id: string } | null => {
  for (const rule of rules) {
    const min_rating = rule.criteria['min_rating'] as number;
    const max_rating = rule.criteria['max_rating'] as number | undefined;

    if (rating >= min_rating && (!max_rating || rating <= max_rating)) {
      return {
        amount: rule.base_amount,
        details: {
          rating,
          min_rating,
          max_rating: max_rating ?? 5.0,
        },
        rule_id: rule.id,
      };
    }
  }

  return null;
};

/* ===================== DAILY WORK ===================== */

export const recordDailyWork = async (data: {
  cleaner_id: string;
  date: string;
  tasks_completed: number;
  hours_worked?: number;
  is_overtime?: boolean;
  is_weekend?: boolean;
  customer_rating?: number;
  hourly_rate?: number;
  notes?: string;
}): Promise<{
  work_record: DailyWorkRecord;
  incentives: IncentiveSummary[];
  total_incentive: number;
}> => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const workResult = await client.query(
      `
      INSERT INTO daily_work_records (
        cleaner_id, date, tasks_completed, hours_worked, 
        is_overtime, is_weekend, customer_rating, notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (cleaner_id, date)
      DO UPDATE SET
        tasks_completed = EXCLUDED.tasks_completed,
        hours_worked = EXCLUDED.hours_worked,
        is_overtime = EXCLUDED.is_overtime,
        is_weekend = EXCLUDED.is_weekend,
        customer_rating = EXCLUDED.customer_rating,
        notes = EXCLUDED.notes,
        updated_at = NOW()
      RETURNING *
      `,
      [
        data.cleaner_id,
        data.date,
        data.tasks_completed,
        data.hours_worked || null,
        data.is_overtime || false,
        data.is_weekend || false,
        data.customer_rating || null,
        data.notes || null,
      ]
    );

    const workRecord = workResult.rows[0];

    await client.query(`DELETE FROM daily_incentive_breakdown WHERE daily_work_record_id = $1`, [
      workRecord.id,
    ]);

    const rulesResult = await client.query(
      `
      SELECT ir.*, it.category, it.calculation_type
      FROM incentive_rules ir
      JOIN incentive_types it ON ir.incentive_type_id = it.id
      WHERE ir.active = true AND it.active = true
      ORDER BY it.category, ir.priority
      `
    );

    const incentives: IncentiveSummary[] = [];
    let totalIncentive = 0;

    for (const rule of rulesResult.rows) {
      let calculation: { amount: number; details: Criteria } | null = null;

      switch (rule.category) {
        case 'performance':
          calculation = calculatePerformanceIncentive(data.tasks_completed, rule);
          break;

        case 'overtime':
          if (data.is_overtime && data.hours_worked && data.hourly_rate) {
            const isWeekend = data.is_weekend || false;
            const ruleAppliesTo = rule.criteria.applies_to;

            if (
              (ruleAppliesTo === 'weekend' && isWeekend) ||
              (ruleAppliesTo === 'weekday' && !isWeekend)
            ) {
              calculation = calculateOvertimeIncentive(data.hours_worked, data.hourly_rate, rule);
            }
          }
          break;
        case 'quality':
          if (data.customer_rating) {
            const qualityRules = rulesResult.rows.filter(
              (r: IncentiveRuleWithType) =>
                r.incentive_category === 'quality' && r.incentive_type_id === rule.incentive_type_id
            );
            const qualityCalc = calculateQualityIncentive(data.customer_rating, qualityRules);
            if (qualityCalc && qualityCalc.rule_id === rule.id) {
              calculation = {
                amount: qualityCalc.amount,
                details: qualityCalc.details,
              };
            }
          }
          break;
      }

      if (calculation && calculation.amount > 0) {
        await client.query(
          `
          INSERT INTO daily_incentive_breakdown 
          (daily_work_record_id, incentive_rule_id, amount, calculation_details)
          VALUES ($1, $2, $3, $4)
          `,
          [workRecord.id, rule.id, calculation.amount, JSON.stringify(calculation.details)]
        );

        incentives.push({
          rule_name: rule.rule_name,
          category: rule.category,
          amount: calculation.amount,
          calculation_details: calculation.details,
        });

        totalIncentive += calculation.amount;
      }
    }

    await client.query('COMMIT');

    return {
      work_record: workRecord,
      incentives,
      total_incentive: totalIncentive,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/* ===================== FETCH RECORDS ===================== */

export const getDailyWorkRecordsWithIncentives = async (
  cleanerId: string,
  filters?: {
    startDate?: string;
    endDate?: string;
    month?: string;
  }
): Promise<DailyWorkRecord[]> => {
  let query = `
    SELECT 
      dwr.*,
      COALESCE(
        json_agg(
          json_build_object(
            'rule_name', ir.rule_name,
            'category', it.category,
            'amount', dib.amount,
            'details', dib.calculation_details
          )
        ) FILTER (WHERE dib.id IS NOT NULL),
        '[]'
      ) as incentives,
      COALESCE(SUM(dib.amount), 0)::float as total_incentive
    FROM daily_work_records dwr
    LEFT JOIN daily_incentive_breakdown dib ON dwr.id = dib.daily_work_record_id
    LEFT JOIN incentive_rules ir ON dib.incentive_rule_id = ir.id
    LEFT JOIN incentive_types it ON ir.incentive_type_id = it.id
    WHERE dwr.cleaner_id = $1
  `;

  const params: (string | number)[] = [cleanerId];
  let index = 2;

  if (filters?.startDate && filters?.endDate) {
    query += ` AND dwr.date BETWEEN $${index} AND $${index + 1}`;
    params.push(filters.startDate, filters.endDate);
    index += 2;
  }

  if (filters?.month) {
    const [year, month] = filters.month.split('-');
    query += ` AND EXTRACT(YEAR FROM dwr.date) = $${index}
               AND EXTRACT(MONTH FROM dwr.date) = $${index + 1}`;
    params.push(Number(year), Number(month));
  }

  query += `
    GROUP BY dwr.id
    ORDER BY dwr.date DESC
  `;

  const result = await pool.query(query, params);
  return result.rows;
};

/* ===================== MONTHLY SUMMARY ===================== */

export interface MonthlyIncentiveSummary {
  cleaner_id: string;
  total_days_worked: number;
  total_tasks_completed: number;
  total_incentive_earned: number;
  average_tasks_per_day: number;
  incentive_by_category: { category: string; total: number }[];
}

export const getMonthlyIncentiveSummary = async (
  cleanerId: string,
  month: string
): Promise<MonthlyIncentiveSummary> => {
  const [year, monthNum] = month.split('-');

  const result = await pool.query(
    `
    SELECT
      dwr.cleaner_id,
      COUNT(DISTINCT dwr.id)::int AS total_days_worked,
      COALESCE(SUM(dwr.tasks_completed), 0)::int AS total_tasks_completed,
      COALESCE(SUM(dib.amount), 0)::float AS total_incentive_earned,
      ROUND(AVG(dwr.tasks_completed), 2)::float AS average_tasks_per_day,
      json_agg(
        DISTINCT jsonb_build_object(
          'category', it.category,
          'total', (
            SELECT COALESCE(SUM(dib2.amount), 0)
            FROM daily_incentive_breakdown dib2
            JOIN incentive_rules ir2 ON dib2.incentive_rule_id = ir2.id
            JOIN incentive_types it2 ON ir2.incentive_type_id = it2.id
            WHERE dib2.daily_work_record_id IN (
              SELECT id FROM daily_work_records
              WHERE cleaner_id = $1
                AND EXTRACT(YEAR FROM date) = $2
                AND EXTRACT(MONTH FROM date) = $3
            )
            AND it2.category = it.category
          )
        )
      ) FILTER (WHERE it.category IS NOT NULL) as incentive_by_category
    FROM daily_work_records dwr
    LEFT JOIN daily_incentive_breakdown dib ON dwr.id = dib.daily_work_record_id
    LEFT JOIN incentive_rules ir ON dib.incentive_rule_id = ir.id
    LEFT JOIN incentive_types it ON ir.incentive_type_id = it.id
    WHERE dwr.cleaner_id = $1
      AND EXTRACT(YEAR FROM dwr.date) = $2
      AND EXTRACT(MONTH FROM dwr.date) = $3
    GROUP BY dwr.cleaner_id
    `,
    [cleanerId, Number(year), Number(monthNum)]
  );

  return (
    result.rows[0] || {
      cleaner_id: cleanerId,
      month,
      total_days_worked: 0,
      total_tasks_completed: 0,
      total_incentive_earned: 0,
      average_tasks_per_day: 0,
      incentive_by_category: [],
    }
  );
};
