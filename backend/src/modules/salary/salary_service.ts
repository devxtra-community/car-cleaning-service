// src/services/salary_service.ts
import { pool } from '../../database/connectDatabase';
import { getActiveIncentive } from '../incentives/incentives_service';

interface CreateSalaryInput {
  user_id: string;
  month: string;
  base_salary: number;
  total_tasks?: number;
  penalty_amount?: number;
  monthly_review?: string;
  payment_method?: string;
  bank_account?: string;
}

export const createSalary = async (data: CreateSalaryInput) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1️⃣ Validate user
    const userRes = await client.query(`SELECT id FROM users WHERE id = $1`, [data.user_id]);

    if (userRes.rowCount === 0) {
      throw new Error('USER_NOT_FOUND');
    }

    const totalTasks = data.total_tasks ?? 0;
    const penalty = data.penalty_amount ?? 0;

    // 2️⃣ Fetch active incentive
    let incentiveAmount = 0;
    let incentiveApplied = false;

    if (totalTasks > 0) {
      const incentive = await getActiveIncentive();

      if (incentive && totalTasks >= incentive.target_tasks) {
        incentiveAmount = Number(incentive.incentive_amount);
        incentiveApplied = true;
      }
    }

    // 3️⃣ Calculate final salary
    const finalSalary = data.base_salary + incentiveAmount - penalty;

    // 4️⃣ Insert salary
    const res = await client.query(
      `
      INSERT INTO salaries (
        user_id,
        month,
        base_salary,
        total_tasks,
        incentive_amount,
        penalty_amount,
        final_salary,
        incentive_applied,
        monthly_review,
        payment_method,
        bank_account
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      RETURNING *
      `,
      [
        data.user_id,
        data.month,
        data.base_salary,
        totalTasks,
        incentiveAmount,
        penalty,
        finalSalary,
        incentiveApplied,
        data.monthly_review,
        data.payment_method,
        data.bank_account,
      ]
    );

    await client.query('COMMIT');
    return res.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

export const getAllSalaries = async () => {
  const result = await pool.query(`
    SELECT
      s.id,
      s.user_id,
      u.full_name,
      u.role,
      s.month,
      s.base_salary,
      s.total_tasks,
      s.incentive_amount,
      s.penalty_amount,
      s.final_salary,
      s.status,
      s.monthly_review,
      s.payment_method,
      s.bank_account,
      s.created_at
    FROM salaries s
    JOIN users u ON u.id = s.user_id
    ORDER BY s.month DESC, u.full_name ASC
  `);

  return result.rows;
};

export const getSalariesByUser = async (userId: string) => {
  const result = await pool.query(
    `
    SELECT
      id,
      month,
      base_salary,
      incentive_amount,
      penalty_amount,
      final_salary,
      status,
      created_at
    FROM salaries
    WHERE user_id = $1
    ORDER BY month DESC
    `,
    [userId]
  );

  return result.rows;
};

/**
 * GET user details with monthly incentive summary
 */
export const getUserSalaryDetails = async (userId: string, month: string) => {
  const client = await pool.connect();

  try {
    // Get user info
    const userResult = await client.query(
      `
  SELECT 
    id, 
    full_name, 
    email, 
    role, 
    base_salary
  FROM users 
  WHERE id = $1
  `,
      [userId]
    );

    if (userResult.rows.length === 0) {
      throw new Error('USER_NOT_FOUND');
    }

    const user = userResult.rows[0];
    let monthlyIncentives = [];
    const penalties: never[] = [];

    // For cleaners, get daily work records for the month
    if (user.role === 'cleaner' && month) {
      const [year, monthNum] = month.split('-');

      const incentivesResult = await client.query(
        `
        SELECT 
          date,
          tasks_completed,
          target_tasks,
          base_incentive,
          bonus_incentive,
          total_incentive,
          notes
        FROM daily_work_records
        WHERE cleaner_id = $1
          AND EXTRACT(YEAR FROM date) = $2
          AND EXTRACT(MONTH FROM date) = $3
        ORDER BY date DESC
        `,
        [userId, parseInt(year), parseInt(monthNum)]
      );

      monthlyIncentives = incentivesResult.rows;
    }

    return {
      user,
      monthlyIncentives,
      penalties,
    };
  } finally {
    client.release();
  }
};

/**
 * UPDATE salary (only when draft)
 */
export const updateSalary = async (
  salaryId: string,
  data: {
    base_salary?: number;
    penalty_amount?: number;
    monthly_review?: string;
    payment_method?: string;
    bank_account?: string;
  }
) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const check = await client.query(
      `SELECT status, user_id, salary_month, incentive_amount FROM salaries WHERE id = $1`,
      [salaryId]
    );

    if (check.rows.length === 0) {
      throw new Error('SALARY_NOT_FOUND');
    }

    if (check.rows[0]?.status !== 'draft') {
      throw new Error('SALARY_LOCKED');
    }

    const currentSalary = check.rows[0];

    // Recalculate final salary
    const baseSalary = data.base_salary ?? currentSalary.base_salary;
    const penaltyAmount = data.penalty_amount ?? currentSalary.penalty_amount;
    const incentiveAmount = currentSalary.incentive_amount;

    const finalSalary = baseSalary + incentiveAmount - penaltyAmount;

    const result = await client.query(
      `
      UPDATE salaries
      SET
        base_salary = $2,
        penalty_amount = $3,
        final_salary = $4,
        monthly_review = COALESCE($5, monthly_review),
        payment_method = COALESCE($6, payment_method),
        bank_account = COALESCE($7, bank_account)
      WHERE id = $1
      RETURNING *
      `,
      [
        salaryId,
        baseSalary,
        penaltyAmount,
        finalSalary,
        data.monthly_review,
        data.payment_method,
        data.bank_account,
      ]
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

/**
 * FINALIZE salary (lock it)
 */
export const finalizeSalary = async (salaryId: string) => {
  const result = await pool.query(
    `
    UPDATE salaries
    SET status = 'finalized',
        finalized_at = NOW()
    WHERE id = $1
      AND status = 'draft'
    RETURNING *
    `,
    [salaryId]
  );

  return result.rows[0];
};

/**
 * Get users by role for salary management
 */
export const getUsersByRole = async (role: string) => {
  const result = await pool.query(
    `
    SELECT 
      id, 
      full_name, 
      email, 
      role, 
      base_salary
    FROM users 
    WHERE role = $1
    ORDER BY full_name ASC
    `,
    [role]
  );

  return result.rows;
};
