import { pool } from 'src/database/connectDatabase';

/* ===================== TYPES ===================== */

export interface IncentiveTarget {
  id: string;
  target_tasks: number;
  reason: string;
  incentive_amount: number;
  active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface DailyWorkRecord {
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

export interface MonthlyIncentiveSummary {
  cleaner_id: string;
  full_name?: string;
  month: string;
  total_days_worked: number;
  total_tasks_completed: number;
  total_incentive_earned: number;
  average_tasks_per_day: number;
}

/* ===================== INCENTIVE TARGETS ===================== */

export const createIncentiveTarget = async ({
  target_tasks,
  reason,
  incentive_amount,
}: {
  target_tasks: number;
  reason: string;
  incentive_amount: number;
}): Promise<IncentiveTarget> => {
  const result = await pool.query(
    `
    INSERT INTO incentives (target_tasks, reason, incentive_amount)
    VALUES ($1, $2, $3)
    RETURNING 
      id,
      target_tasks,
      reason,
      incentive_amount::float AS incentive_amount,
      active,
      created_at,
      updated_at
    `,
    [target_tasks, reason, incentive_amount]
  );

  return result.rows[0];
};

export const getActiveIncentive = async (): Promise<IncentiveTarget | null> => {
  const result = await pool.query(
    `
    SELECT 
      id,
      target_tasks,
      reason,
      incentive_amount::float AS incentive_amount,
      active,
      created_at,
      updated_at,
    FROM incentives
    WHERE active = true
    ORDER BY created_at DESC
    LIMIT 1
    `
  );

  return result.rows[0] || null;
};

export const getAllIncentives = async (): Promise<IncentiveTarget[]> => {
  const result = await pool.query(
    `
    SELECT 
      id,
      target_tasks,
      reason,
      incentive_amount::float AS incentive_amount,
      active,
      created_at,
      updated_at
    FROM incentives
    ORDER BY target_tasks ASC
    `
  );

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
    RETURNING 
      id,
      target_tasks,
      reason,
      incentive_amount::float AS incentive_amount,
      active,
      created_at,
      updated_at
    `,
    [id, data.target_tasks ?? null, data.reason ?? null, data.incentive_amount ?? null]
  );

  if (!result.rows.length) {
    throw new Error('INCENTIVE_TARGET_NOT_FOUND');
  }

  return result.rows[0];
};

export const deleteIncentiveTarget = async (id: string): Promise<void> => {
  const result = await pool.query(`DELETE FROM incentives WHERE id = $1`, [id]);

  if (!result.rowCount) {
    throw new Error('INCENTIVE_TARGET_NOT_FOUND');
  }
};

/* ===================== INCENTIVE CALCULATION ===================== */

const calculateIncentive = (tasksCompleted: number, targetTasks: number, baseAmount: number) => {
  if (tasksCompleted < targetTasks) {
    return { base: 0, bonus: 0, total: 0 };
  }

  const base = baseAmount;
  const extraTasks = tasksCompleted - targetTasks;
  const bonus = extraTasks > 0 ? extraTasks * (baseAmount * 0.5) : 0;

  return {
    base,
    bonus,
    total: base + bonus,
  };
};

/* ===================== DAILY WORK ===================== */

export const recordDailyWork = async (data: {
  cleaner_id: string;
  date: string;
  tasks_completed: number;
  notes?: string;
}): Promise<DailyWorkRecord> => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const targetResult = await client.query(
      `SELECT target_tasks, incentive_amount::float AS incentive_amount
       FROM incentives
       WHERE active = true
       LIMIT 1`
    );

    if (!targetResult.rows.length) {
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
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
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

    await client.query('COMMIT');
    return workResult.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/* ===================== FETCH RECORDS ===================== */

export const getDailyWorkRecords = async (
  cleanerId: string,
  filters?: {
    startDate?: string;
    endDate?: string;
    month?: string;
  }
): Promise<DailyWorkRecord[]> => {
  let query = `SELECT * FROM daily_work_records WHERE cleaner_id = $1`;
  const params: (string | number | boolean | null)[] = [cleanerId];

  let index = 2;

  if (filters?.startDate && filters?.endDate) {
    query += ` AND date BETWEEN $${index} AND $${index + 1}`;
    params.push(filters.startDate, filters.endDate);
    index += 2;
  }

  if (filters?.month) {
    const [year, month] = filters.month.split('-');
    query += ` AND EXTRACT(YEAR FROM date) = $${index}
               AND EXTRACT(MONTH FROM date) = $${index + 1}`;
    params.push(Number(year), Number(month));
  }

  query += ` ORDER BY date DESC`;

  const result = await pool.query(query, params);
  return result.rows;
};

/* ===================== MONTHLY SUMMARY ===================== */

export const getMonthlyIncentiveSummary = async (
  cleanerId: string,
  month: string
): Promise<MonthlyIncentiveSummary> => {
  const [year, monthNum] = month.split('-');

  const result = await pool.query(
    `
    SELECT
      cleaner_id,
      COUNT(*)::int AS total_days_worked,
      COALESCE(SUM(tasks_completed),0)::int AS total_tasks_completed,
      COALESCE(SUM(total_incentive),0)::float AS total_incentive_earned,
      ROUND(AVG(tasks_completed),2)::float AS average_tasks_per_day
    FROM daily_work_records
    WHERE cleaner_id = $1
      AND EXTRACT(YEAR FROM date) = $2
      AND EXTRACT(MONTH FROM date) = $3
    GROUP BY cleaner_id
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
    }
  );
};
