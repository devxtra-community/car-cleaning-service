import { pool } from '../../database/connectDatabase';

/**
 * CREATE salary (no accountant required yet)
 */
export const createSalary = async (data: {
  user_id: string;
  salary_month: string;
  base_salary: number;
  total_work?: number;
  incentive_amount?: number;
  penalty_amount?: number;
  generated_by?: string | null;
}) => {
  const result = await pool.query(
    `
    INSERT INTO salaries (
      user_id,
      salary_month,
      base_salary,
      total_work,
      incentive_amount,
      penalty_amount,
      generated_by
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7)
    RETURNING *
    `,
    [
      data.user_id,
      data.salary_month,
      data.base_salary,
      data.total_work ?? 0,
      data.incentive_amount ?? 0,
      data.penalty_amount ?? 0,
      data.generated_by ?? null,
    ]
  );

  return result.rows[0];
};

/**
 * GET all salaries (admin / accountant view)
 */
export const getAllSalaries = async () => {
  const result = await pool.query(`
    SELECT
      s.id,
      s.user_id,
      u.full_name,
      s.salary_month,
      s.base_salary,
      s.total_work,
      s.incentive_amount,
      s.penalty_amount,
      s.final_salary,
      s.status,
      s.generated_at,
      s.finalized_at,
      s.paid_at
    FROM salaries s
    JOIN users u ON u.id = s.user_id
    ORDER BY s.salary_month DESC
  `);

  return result.rows;
};

/**
 * GET salary for one cleaner
 */
export const getSalaryByUser = async (userId: string) => {
  const result = await pool.query(
    `
    SELECT
      id,
      salary_month,
      base_salary,
      total_work,
      incentive_amount,
      penalty_amount,
      final_salary,
      status,
      generated_at,
      finalized_at,
      paid_at
    FROM salaries
    WHERE user_id = $1
    ORDER BY salary_month DESC
    `,
    [userId]
  );

  return result.rows;
};

/**
 * UPDATE salary (only when draft)
 */
export const updateSalary = async (
  salaryId: string,
  data: {
    base_salary?: number;
    incentive_amount?: number;
    penalty_amount?: number;
  }
) => {
  const check = await pool.query(`SELECT status FROM salaries WHERE id = $1`, [salaryId]);

  if (check.rows[0]?.status !== 'draft') {
    throw new Error('SALARY_LOCKED');
  }

  const result = await pool.query(
    `
    UPDATE salaries
    SET
      base_salary = COALESCE($2, base_salary),
      incentive_amount = COALESCE($3, incentive_amount),
      penalty_amount = COALESCE($4, penalty_amount)
    WHERE id = $1
    RETURNING *
    `,
    [salaryId, data.base_salary, data.incentive_amount, data.penalty_amount]
  );

  return result.rows[0];
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
