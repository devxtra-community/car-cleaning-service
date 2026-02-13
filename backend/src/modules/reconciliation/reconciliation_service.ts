import { pool } from 'src/database/connectDatabase';

export const getBuildingReconciliation = async (cycleId: string) => {
  const cycleRes = await pool.query(
    `SELECT start_date, end_date FROM salary_cycles WHERE id = $1`,
    [cycleId]
  );

  if (!cycleRes.rowCount) throw new Error('CYCLE_NOT_FOUND');

  const { start_date, end_date } = cycleRes.rows[0];

  const result = await pool.query(
    `
    SELECT 
      b.id,
      b.name AS building_name,

      COALESCE(SUM(t.task_amount),0) AS expected_collection,

      (
        SELECT COALESCE(SUM(c.amount),0)
        FROM collections c
        WHERE c.building_id = b.id
        AND c.collected_at BETWEEN $1 AND $2
      ) AS actual_collection

    FROM buildings b
    LEFT JOIN tasks t 
      ON t.building_id = b.id
      AND t.completed_at BETWEEN $1 AND $2

    GROUP BY b.id
    `,
    [start_date, end_date]
  );

  return result.rows.map((row) => {
    const expected = Number(row.expected_collection);
    const actual = Number(row.actual_collection);
    const variance = actual - expected;

    let status = 'Matched';

    if (variance < 0 && variance > -1000) status = 'Variance';
    if (variance <= -3000) status = 'Critical';
    if (variance > 0) status = 'Over Collected';

    return {
      ...row,
      variance,
      status,
    };
  });
};
export const getCompanyReconciliationSummary = async (cycleId: string) => {
  const cycleRes = await pool.query(
    `SELECT start_date, end_date FROM salary_cycles WHERE id = $1`,
    [cycleId]
  );

  if (!cycleRes.rowCount) throw new Error('CYCLE_NOT_FOUND');

  const { start_date, end_date } = cycleRes.rows[0];

  // Total Expected
  const expectedRes = await pool.query(
    `
    SELECT COALESCE(SUM(task_amount),0) AS total_expected
    FROM tasks
    WHERE completed_at BETWEEN $1 AND $2
    `,
    [start_date, end_date]
  );

  // Total Actual
  const actualRes = await pool.query(
    `
    SELECT COALESCE(SUM(amount),0) AS total_actual
    FROM collections
    WHERE collected_at BETWEEN $1 AND $2
    `,
    [start_date, end_date]
  );

  // Total Salary Expense
  const salaryRes = await pool.query(
    `
    SELECT COALESCE(SUM(net_salary),0) AS total_salary
    FROM salaries
    WHERE salary_cycle_id = $1
    `,
    [cycleId]
  );

  const totalExpected = Number(expectedRes.rows[0].total_expected);
  const totalActual = Number(actualRes.rows[0].total_actual);
  const totalSalary = Number(salaryRes.rows[0].total_salary);

  const profit = totalActual - totalSalary;

  return {
    totalExpected,
    totalActual,
    totalSalary,
    profit,
  };
};
