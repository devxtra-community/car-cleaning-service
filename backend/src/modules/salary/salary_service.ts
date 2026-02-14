// src/services/salary_service.ts
import { pool } from '../../database/connectDatabase';

export const generateSalaryForUser = async (userId: string, cycleId: string) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1️⃣ Get cycle
    const cycleRes = await client.query(
      `SELECT start_date, end_date, is_locked
       FROM salary_cycles
       WHERE id = $1`,
      [cycleId]
    );

    if (!cycleRes.rowCount) throw new Error('CYCLE_NOT_FOUND');

    const cycle = cycleRes.rows[0];

    if (cycle.is_locked) throw new Error('SALARY_CYCLE_LOCKED');

    const { start_date, end_date } = cycle;

    // 2️⃣ Get user
    const userRes = await client.query(`SELECT id, role, base_salary FROM users WHERE id = $1`, [
      userId,
    ]);

    if (!userRes.rowCount) throw new Error('USER_NOT_FOUND');

    const user = userRes.rows[0];

    // ❌ Skip SuperAdmin
    if (user.role === 'superAdmin') {
      await client.query('ROLLBACK');
      return null;
    }

    let totalTasks = 0;
    let totalIncentives = 0;
    let totalPenalties = 0;

    // 3️⃣ If cleaner → dynamic calculation
    if (user.role === 'cleaner') {
      // Get cleaner_id
      const cleanerRes = await client.query(`SELECT id FROM cleaners WHERE user_id = $1`, [userId]);

      if (!cleanerRes.rowCount) throw new Error('CLEANER_NOT_FOUND');

      const cleanerId = cleanerRes.rows[0].id;

      // Tasks
      const taskRes = await client.query(
        `
  SELECT COUNT(*) AS total_tasks
  FROM tasks
  WHERE cleaner_id = $1
  AND status = 'completed'
  AND created_at BETWEEN $2 AND $3
  `,
        [cleanerId, start_date, end_date]
      );

      totalTasks = Number(taskRes.rows[0].total_tasks);

      // Incentives
      const incentiveRes = await client.query(
        `
        SELECT COALESCE(SUM(amount),0) AS total
        FROM cleaner_incentives
        WHERE cleaner_id = $1
        AND created_at BETWEEN $2 AND $3
        `,
        [cleanerId, start_date, end_date]
      );

      totalIncentives = Number(incentiveRes.rows[0].total);

      // Penalties
      const penaltyRes = await client.query(
        `
        SELECT COALESCE(SUM(amount),0) AS total
        FROM penalties
        WHERE cleaner_id = $1
        AND created_at BETWEEN $2 AND $3
        `,
        [cleanerId, start_date, end_date]
      );

      totalPenalties = Number(penaltyRes.rows[0].total);
    }

    // 4️⃣ Calculate salary
    const baseSalary = Number(user.base_salary);
    const grossSalary = baseSalary + totalIncentives - totalPenalties;
    const netSalary = grossSalary;

    const salaryRes = await client.query(
      `
  INSERT INTO salaries (
    cleaner_id,
    salary_cycle_id,
    base_salary,
    total_tasks,
    total_incentives,
    total_penalties,
    gross_salary,
    net_salary,
    status
  )
  VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'pending')
  ON CONFLICT (cleaner_id, salary_cycle_id)
  DO UPDATE SET
    base_salary = EXCLUDED.base_salary,
    total_tasks = EXCLUDED.total_tasks,
    total_incentives = EXCLUDED.total_incentives,
    total_penalties = EXCLUDED.total_penalties,
    gross_salary = EXCLUDED.gross_salary,
    net_salary = EXCLUDED.net_salary,
    status = 'pending'
  RETURNING *
  `,
      [
        userId, // this goes into cleaner_id column (FK → users.id)
        cycleId,
        baseSalary,
        totalTasks,
        totalIncentives,
        totalPenalties,
        grossSalary,
        netSalary,
      ]
    );

    await client.query('COMMIT');

    return salaryRes.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

export const generateSalaryForAllUsers = async (cycleId: string) => {
  const usersRes = await pool.query(`SELECT id FROM users WHERE role != 'superAdmin'`);

  const users = usersRes.rows;

  const results = [];

  for (const user of users) {
    const salary = await generateSalaryForUser(user.id, cycleId);
    if (salary) results.push(salary);
  }

  return results;
};
export const getAllSalaryCycles = async () => {
  const result = await pool.query(`
    SELECT id, month, year, start_date, end_date, is_locked
    FROM salary_cycles
    ORDER BY year DESC, month DESC
  `);

  return result.rows;
};
export const lockSalaryCycle = async (cycleId: string) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1️⃣ Check cycle exists
    const cycleRes = await client.query(`SELECT id, is_locked FROM salary_cycles WHERE id = $1`, [
      cycleId,
    ]);

    if (!cycleRes.rowCount) {
      throw new Error('CYCLE_NOT_FOUND');
    }

    if (cycleRes.rows[0].is_locked) {
      throw new Error('SALARY_ALREADY_LOCKED');
    }

    // 2️⃣ Ensure salaries exist
    const salaryRes = await client.query(
      `SELECT COUNT(*) FROM salaries WHERE salary_cycle_id = $1`,
      [cycleId]
    );

    if (Number(salaryRes.rows[0].count) === 0) {
      throw new Error('NO_SALARIES_GENERATED');
    }

    // 3️⃣ Lock salary cycle
    await client.query(
      `
      UPDATE salary_cycles
      SET is_locked = true,
          locked_at = now()
      WHERE id = $1
      `,
      [cycleId]
    );

    // 4️⃣ Update salary status
    await client.query(
      `
      UPDATE salaries
      SET status = 'locked',
          finalized_at = now()
      WHERE salary_cycle_id = $1
      `,
      [cycleId]
    );

    await client.query('COMMIT');

    return { message: 'Salary cycle locked successfully' };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

export const markSalaryAsPaid = async (salaryId: string, paymentMethod?: string) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const salaryRes = await client.query(`SELECT id, status FROM salaries WHERE id = $1`, [
      salaryId,
    ]);

    if (!salaryRes.rowCount) {
      throw new Error('SALARY_NOT_FOUND');
    }

    if (salaryRes.rows[0].status !== 'locked') {
      throw new Error('SALARY_MUST_BE_LOCKED_BEFORE_PAYMENT');
    }

    const updateRes = await client.query(
      `
      UPDATE salaries
      SET status = 'paid',
          paid_at = now(),
          payment_method = $2
      WHERE id = $1
      RETURNING *
      `,
      [salaryId, paymentMethod || null]
    );

    await client.query('COMMIT');

    return updateRes.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

export const previewSalaryForCleaner = async (cleanerId: string, cycleId: string) => {
  const cycleRes = await pool.query(
    `SELECT start_date, end_date FROM salary_cycles WHERE id = $1`,
    [cycleId]
  );

  if (!cycleRes.rowCount) throw new Error('CYCLE_NOT_FOUND');

  const { start_date, end_date } = cycleRes.rows[0];

  const baseRes = await pool.query(`SELECT base_salary FROM cleaners WHERE id = $1`, [cleanerId]);

  const incentiveRes = await pool.query(
    `
    SELECT COALESCE(SUM(amount),0) AS total
    FROM cleaner_incentives
    WHERE cleaner_id = $1
    AND created_at BETWEEN $2 AND $3
    `,
    [cleanerId, start_date, end_date]
  );

  const penaltyRes = await pool.query(
    `
    SELECT COALESCE(SUM(amount),0) AS total
    FROM penalties
    WHERE cleaner_id = $1
    AND created_at BETWEEN $2 AND $3
    `,
    [cleanerId, start_date, end_date]
  );

  const base = Number(baseRes.rows[0].base_salary);
  const incentive = Number(incentiveRes.rows[0].total);
  const penalty = Number(penaltyRes.rows[0].total);

  return {
    base_salary: base,
    total_incentives: incentive,
    total_penalties: penalty,
    net_salary: base + incentive - penalty,
  };
};
export const getSalarySummary = async (mode: 'daily' | 'weekly' | 'monthly') => {
  let dateCondition = '';

  if (mode === 'daily') {
    dateCondition = 'DATE(t.created_at) = CURRENT_DATE';
  } else if (mode === 'weekly') {
    dateCondition = "DATE_TRUNC('week', t.created_at) = DATE_TRUNC('week', CURRENT_DATE)";
  } else {
    dateCondition = "DATE_TRUNC('month', t.created_at) = DATE_TRUNC('month', CURRENT_DATE)";
  }

  const result = await pool.query(`
    SELECT 
      u.id AS cleaner_id,
      u.full_name,
      COUNT(t.id) AS total_tasks,
      COALESCE(SUM(ci.amount),0) AS total_incentives,
      COALESCE(SUM(p.amount),0) AS total_penalties,
      COALESCE(SUM(t.amount_charged),0) AS total_collections
    FROM users u
    LEFT JOIN cleaners c ON c.user_id = u.id
    LEFT JOIN tasks t ON t.cleaner_id = c.id
      AND ${dateCondition}
    LEFT JOIN cleaner_incentives ci ON ci.cleaner_id = c.id
      AND ${dateCondition.replace('t.created_at', 'ci.created_at')}
    LEFT JOIN penalties p ON p.cleaner_id = c.id
      AND ${dateCondition.replace('t.created_at', 'p.created_at')}
    WHERE u.role = 'cleaner'
    GROUP BY u.id, u.full_name
  `);

  return result.rows;
};
