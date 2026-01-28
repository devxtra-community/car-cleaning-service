import { pool } from '../../database/connectDatabase';

export const createSalary = async (data: {
  cleaner_id: string;
  salary_month: string;
  base_salary: number;
  total_jobs?: number;
  present_days?: number;
  absent_days?: number;
  incentive_amount?: number;
  penalty_amount?: number;
  generated_by: string;
}) => {
  const result = await pool.query(
    `
    INSERT INTO salaries (
      cleaner_id,
      salary_month,
      base_salary,
      total_jobs,
      present_days,
      absent_days,
      incentive_amount,
      penalty_amount,
      generated_by
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
    RETURNING *
    `,
    [
      data.cleaner_id,
      data.salary_month,
      data.base_salary,
      data.total_jobs ?? 0,
      data.present_days ?? 0,
      data.absent_days ?? 0,
      data.incentive_amount ?? 0,
      data.penalty_amount ?? 0,
      data.generated_by,
    ]
  );

  return result.rows[0];
};

export const getAllSalaries = async () => {
  const result = await pool.query(`
    SELECT s.*, u.full_name
    FROM salaries s
    JOIN users u ON u.id = s.cleaner_id
    ORDER BY s.salary_month DESC
  `);

  return result.rows;
};

export const getSalaryByCleaner = async (cleanerId: string) => {
  const result = await pool.query(
    `
    SELECT *
    FROM salaries
    WHERE cleaner_id = $1
    ORDER BY salary_month DESC
    `,
    [cleanerId]
  );

  return result.rows;
};

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

export const finalizeSalary = async (salaryId: string, finalizedBy: string) => {
  const result = await pool.query(
    `
    UPDATE salaries
    SET
      status = 'finalized',
      finalized_at = NOW(),
      finalized_by = $2
    WHERE id = $1 AND status = 'draft'
    RETURNING *
    `,
    [salaryId, finalizedBy]
  );

  return result.rows[0];
};
