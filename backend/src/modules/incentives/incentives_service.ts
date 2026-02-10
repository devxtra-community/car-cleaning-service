// src/services/incentives_service.ts (or wherever your service file is)

import { pool } from 'src/database/connectDatabase';

/* ===================== TYPES ===================== */

interface IncentiveTarget {
  id: string;
  target_tasks: number;
  reason: string;
  incentive_amount: number;
  active: boolean;
  created_at: Date;
  updated_at: Date;
}

interface DailyWorkRecord {
  id: string;
  cleaner_id: string;
  date: string;
  tasks_completed: number;
  target_tasks: number;
  base_incentive: number;
  bonus_incentive: number;
  total_incentive: number;
  notes?: string;
  created_at: Date;
}

interface MonthlyIncentiveSummary {
  cleaner_id: string;
  month: string;
  total_days_worked: number;
  total_tasks_completed: number;
  total_incentive_earned: number;
  average_tasks_per_day: number;
}

/* ===================== INCENTIVE TARGETS ===================== */

export const createIncentiveTarget = async (data: {
  target_tasks: number;
  reason: string;
  incentive_amount: number;
}): Promise<IncentiveTarget> => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    await client.query('UPDATE incentives SET active = false');

    const result = await client.query(
      `
      INSERT INTO incentives (target_tasks, reason, incentive_amount, active)
      VALUES ($1, $2, $3, true)
      RETURNING *
      `,
      [data.target_tasks, data.reason, data.incentive_amount]
    );

    await client.query('COMMIT');
    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const getActiveIncentive = async () => {
  const res = await pool.query(
    `
    SELECT target_tasks, incentive_amount
    FROM incentives
    WHERE active = true
    ORDER BY updated_at DESC
    LIMIT 1
    `
  );

  return res.rows[0] || null;
};

export const getAllIncentiveTargets = async (): Promise<IncentiveTarget[]> => {
  const result = await pool.query('SELECT * FROM incentives ORDER BY created_at DESC');
  return result.rows;
};

export const updateIncentiveTarget = async (
  id: string,
  data: {
    target_tasks?: number;
    reason?: string;
    incentive_amount?: number;
  }
): Promise<IncentiveTarget> => {
  const result = await pool.query(
    `
    UPDATE incentives
    SET 
      target_tasks = COALESCE($2, target_tasks),
      reason = COALESCE($3, reason),
      incentive_amount = COALESCE($4, incentive_amount),
      updated_at = NOW()
    WHERE id = $1
    RETURNING *
    `,
    [id, data.target_tasks, data.reason, data.incentive_amount]
  );

  if (result.rows.length === 0) {
    throw new Error('INCENTIVE_TARGET_NOT_FOUND');
  }

  return result.rows[0];
};

export const deleteIncentiveTarget = async (id: string): Promise<void> => {
  const result = await pool.query('DELETE FROM incentives WHERE id = $1', [id]);

  if (result.rowCount === 0) {
    throw new Error('INCENTIVE_TARGET_NOT_FOUND');
  }
};

/* ===================== DAILY WORK RECORDS ===================== */

const calculateIncentive = (
  tasksCompleted: number,
  targetTasks: number,
  baseIncentiveAmount: number
): { base: number; bonus: number; total: number } => {
  if (tasksCompleted < targetTasks) {
    return { base: 0, bonus: 0, total: 0 };
  }

  const baseIncentive = baseIncentiveAmount;
  const extraTasks = tasksCompleted - targetTasks;
  const bonusIncentive = extraTasks > 0 ? baseIncentiveAmount * 0.5 * extraTasks : 0;

  return {
    base: baseIncentive,
    bonus: bonusIncentive,
    total: baseIncentive + bonusIncentive,
  };
};

export const recordDailyWork = async (data: {
  cleaner_id: string;
  date: string;
  tasks_completed: number;
  notes?: string;
}): Promise<DailyWorkRecord> => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const targetResult = await client.query('SELECT * FROM incentives WHERE active = true LIMIT 1');

    if (targetResult.rows.length === 0) {
      throw new Error('NO_ACTIVE_INCENTIVE_TARGET');
    }

    const target = targetResult.rows[0];
    const { base, bonus, total } = calculateIncentive(
      data.tasks_completed,
      target.target_tasks,
      target.incentive_amount
    );

    const workResult = await client.query(
      `
      INSERT INTO daily_work_records (
        cleaner_id,
        date,
        tasks_completed,
        target_tasks,
        base_incentive,
        bonus_incentive,
        total_incentive,
        notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (cleaner_id, date)
      DO UPDATE SET
        tasks_completed = EXCLUDED.tasks_completed,
        target_tasks = EXCLUDED.target_tasks,
        base_incentive = EXCLUDED.base_incentive,
        bonus_incentive = EXCLUDED.bonus_incentive,
        total_incentive = EXCLUDED.total_incentive,
        notes = EXCLUDED.notes,
        updated_at = NOW()
      RETURNING *
      `,
      [
        data.cleaner_id,
        data.date,
        data.tasks_completed,
        target.target_tasks,
        base,
        bonus,
        total,
        data.notes || null,
      ]
    );

    const workDate = new Date(data.date);
    await client.query(
      `
      UPDATE users
      SET 
        current_month_incentive = (
          SELECT COALESCE(SUM(total_incentive), 0)
          FROM daily_work_records
          WHERE cleaner_id = $1
            AND EXTRACT(MONTH FROM date) = $2
            AND EXTRACT(YEAR FROM date) = $3
        ),
        total_incentive_earned = total_incentive_earned + $4
      WHERE id = $1
      `,
      [data.cleaner_id, workDate.getMonth() + 1, workDate.getFullYear(), total]
    );

    await client.query('COMMIT');
    return workResult.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// FIX: Change parameter types to accept undefined
export const getDailyWorkRecords = async (
  cleanerId: string,
  filters?: {
    startDate?: string | undefined;
    endDate?: string | undefined;
    month?: string | undefined;
  }
): Promise<DailyWorkRecord[]> => {
  let query = `
    SELECT * FROM daily_work_records
    WHERE cleaner_id = $1
  `;
  const params: (string | number)[] = [cleanerId];

  if (filters?.startDate && filters?.endDate) {
    query += ' AND date BETWEEN $2 AND $3';
    params.push(filters.startDate, filters.endDate);
  } else if (filters?.month) {
    const [year, month] = filters.month.split('-');
    query += ` AND EXTRACT(YEAR FROM date) = $2 AND EXTRACT(MONTH FROM date) = $3`;
    params.push(parseInt(year, 10), parseInt(month, 10));
  }

  query += ' ORDER BY date DESC';

  const result = await pool.query(query, params);
  return result.rows;
};

// FIX: Ensure month parameter is typed correctly
export const getMonthlyIncentiveSummary = async (
  cleanerId: string,
  month: string
): Promise<MonthlyIncentiveSummary> => {
  const [year, monthNum] = month.split('-');

  const result = await pool.query(
    `
    SELECT
      cleaner_id,
      $2 as month,
      COUNT(*) as total_days_worked,
      SUM(tasks_completed) as total_tasks_completed,
      SUM(total_incentive) as total_incentive_earned,
      ROUND(AVG(tasks_completed), 2) as average_tasks_per_day
    FROM daily_work_records
    WHERE cleaner_id = $1
      AND EXTRACT(YEAR FROM date) = $3
      AND EXTRACT(MONTH FROM date) = $4
    GROUP BY cleaner_id
    `,
    [cleanerId, month, parseInt(year, 10), parseInt(monthNum, 10)]
  );

  return (
    result.rows[0] || {
      cleaner_id: cleanerId,
      month,
      total_days_worked: 0,
      total_tasks_completed: 0,
      total_incentive_earned: 0,
      average_tasks_per_day: 0,
    }
  );
};

// FIX: Ensure month parameter is typed correctly
export const getAllCleanersMonthlyIncentives = async (
  month: string
): Promise<MonthlyIncentiveSummary[]> => {
  const [year, monthNum] = month.split('-');

  const result = await pool.query(
    `
    SELECT
      dwr.cleaner_id,
      u.full_name,
      $1 as month,
      COUNT(*) as total_days_worked,
      SUM(dwr.tasks_completed) as total_tasks_completed,
      SUM(dwr.total_incentive) as total_incentive_earned,
      ROUND(AVG(dwr.tasks_completed), 2) as average_tasks_per_day
    FROM daily_work_records dwr
    JOIN users u ON u.id = dwr.cleaner_id
    WHERE EXTRACT(YEAR FROM dwr.date) = $2
      AND EXTRACT(MONTH FROM dwr.date) = $3
      AND u.role = 'worker'
    GROUP BY dwr.cleaner_id, u.full_name
    ORDER BY total_incentive_earned DESC
    `,
    [month, parseInt(year, 10), parseInt(monthNum, 10)]
  );

  return result.rows;
};

export const deleteDailyWorkRecord = async (id: string, cleanerId: string): Promise<void> => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const recordResult = await client.query(
      'SELECT * FROM daily_work_records WHERE id = $1 AND cleaner_id = $2',
      [id, cleanerId]
    );

    if (recordResult.rows.length === 0) {
      throw new Error('WORK_RECORD_NOT_FOUND');
    }

    const record = recordResult.rows[0];

    await client.query('DELETE FROM daily_work_records WHERE id = $1', [id]);

    const workDate = new Date(record.date);
    await client.query(
      `
      UPDATE users
      SET 
        current_month_incentive = (
          SELECT COALESCE(SUM(total_incentive), 0)
          FROM daily_work_records
          WHERE cleaner_id = $1
            AND EXTRACT(MONTH FROM date) = $2
            AND EXTRACT(YEAR FROM date) = $3
        ),
        total_incentive_earned = total_incentive_earned - $4
      WHERE id = $1
      `,
      [cleanerId, workDate.getMonth() + 1, workDate.getFullYear(), record.total_incentive]
    );

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};
