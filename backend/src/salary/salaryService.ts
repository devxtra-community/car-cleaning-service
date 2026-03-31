import { pool } from '../db';
import { Salary } from './salaryTypes';

/**
 * Generates or updates a salary record for a single user for a given cycle.
 */
export const generateSalaryForUser = async (userId: string, cycleId: string): Promise<Salary> => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    // 1. Fetch Cycle & Check Lock Status
    const cycleRes = await client.query(
      `SELECT start_date, end_date, is_locked FROM salary_cycles WHERE id = $1`,
      [cycleId]
    );
    if (!cycleRes.rowCount) throw new Error('CYCLE_NOT_FOUND');
    if (cycleRes.rows[0].is_locked) throw new Error('SALARY_CYCLE_LOCKED');

    const { start_date, end_date } = cycleRes.rows[0];
    // 2. Fetch User Data
    const userRes = await client.query(`SELECT id, role, base_salary FROM users WHERE id = $1`, [
      userId,
    ]);
    if (!userRes.rowCount) throw new Error('USER_NOT_FOUND');

    const user = userRes.rows[0];
    const baseSalary = Number(user.base_salary);
    let totalIncentives = 0;
    let totalPenalties = 0;
    // 3. Process incentives and penalties (Strictly for cleaners)
    if (user.role === 'cleaner') {
      const cleanerRes = await client.query(`SELECT id FROM cleaners WHERE user_id = $1`, [userId]);
      if (!cleanerRes.rowCount) throw new Error('CLEANER_PROFILE_NOT_FOUND');

      const cleanerId = cleanerRes.rows[0].id;
      // Query A: Daily Incentive Breakdown
      const dailyIncRes = await client.query(
        `
        SELECT COALESCE(SUM(dib.amount), 0) AS total
        FROM daily_incentive_breakdown dib
        JOIN daily_work_records dwr ON dib.daily_work_record_id = dwr.id
        JOIN incentive_rules ir ON dib.incentive_rule_id = ir.id
        WHERE dwr.cleaner_id = $1 
          AND dwr.date BETWEEN $2 AND $3
          AND ir.active = true
      `,
        [cleanerId, start_date, end_date]
      );
      // Query B: Milestone Achievements
      const milestoneRes = await client.query(
        `
        SELECT COALESCE(SUM(ma.amount), 0) AS total
        FROM milestone_achievements ma
        JOIN incentive_rules ir ON ma.incentive_rule_id = ir.id
        WHERE ma.cleaner_id = $1 
          AND ma.achieved_at BETWEEN $2 AND $3
          AND ir.active = true
      `,
        [cleanerId, start_date, end_date]
      );
      // Query C: Cleaner Incentives (Manual)
      const manualIncRes = await client.query(
        `
        SELECT COALESCE(SUM(ci.amount), 0) AS total
        FROM cleaner_incentives ci
        JOIN incentive_rules ir ON ci.incentive_rule_id = ir.id
        WHERE ci.cleaner_id = $1 
          AND ci.created_at BETWEEN $2 AND $3
          AND ir.active = true
      `,
        [cleanerId, start_date, end_date]
      );
      // Query D: Penalties (Manual Table Only)
      const penaltyRes = await client.query(
        `
        SELECT COALESCE(SUM(p.amount), 0) AS total
        FROM penalties p
        WHERE p.cleaner_id = $1 
          AND p.created_at BETWEEN $2 AND $3
      `,
        [cleanerId, start_date, end_date]
      );
      // Aggregate
      totalIncentives =
        Number(dailyIncRes.rows[0].total) +
        Number(milestoneRes.rows[0].total) +
        Number(manualIncRes.rows[0].total);

      totalPenalties = Number(penaltyRes.rows[0].total);
    }
    // Supervisors and Admins naturally bypass and retain totalIncentives = 0, totalPenalties = 0
    // 4. Calculate Final Salary (floor at 0 to prevent negative pay)
    const finalSalary = Math.max(0, baseSalary + totalIncentives - totalPenalties);
    // 5. UPSERT Salary Record
    const upsertRes = await client.query(
      `
      INSERT INTO salaries (
        user_id, salary_cycle_id, base_salary, incentives, penalties, final_salary, status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, 'pending', NOW())
      ON CONFLICT (user_id, salary_cycle_id) DO UPDATE SET
        base_salary = EXCLUDED.base_salary,
        incentives = EXCLUDED.incentives,
        penalties = EXCLUDED.penalties,
        final_salary = EXCLUDED.final_salary
      RETURNING *
    `,
      [userId, cycleId, baseSalary, totalIncentives, totalPenalties, finalSalary]
    );
    await client.query('COMMIT');
    return upsertRes.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};
/**
 * Loops over all users to generate salaries. Collects successes and failures.
 */
export const generateSalaryForAllUsers = async (cycleId: string) => {
  // Fetch all users (No is_active column on users per your instructions)
  const usersRes = await pool.query(`SELECT id FROM users`);
  const success: Salary[] = [];
  const failed: { userId: string; error: string }[] = [];
  for (const user of usersRes.rows) {
    try {
      const salary = await generateSalaryForUser(user.id, cycleId);
      success.push(salary);
    } catch (err: any) {
      // Hard halt if locked, otherwise log the localized failure and continue
      if (err.message === 'SALARY_CYCLE_LOCKED') throw err;
      failed.push({ userId: user.id, error: err.message });
    }
  }
  return { success, failed };
};
/**
 * Permanently locks a cycle and all its generated salaries.
 */
export const lockCycle = async (cycleId: string, adminUserId: string) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const cycleCheck = await client.query(`SELECT is_locked FROM salary_cycles WHERE id = $1`, [
      cycleId,
    ]);
    if (!cycleCheck.rowCount) throw new Error('CYCLE_NOT_FOUND');
    if (cycleCheck.rows[0].is_locked) throw new Error('SALARY_CYCLE_LOCKED');
    // Lock the Cycle payload
    const cycleRes = await client.query(
      `
      UPDATE salary_cycles 
      SET is_locked = true, locked_at = NOW(), locked_by = $1
      WHERE id = $2
      RETURNING *
    `,
      [adminUserId, cycleId]
    );
    // Cascade lock to all associated child salaries
    await client.query(
      `
      UPDATE salaries 
      SET status = 'locked', finalized_at = NOW()
      WHERE salary_cycle_id = $1
    `,
      [cycleId]
    );
    await client.query('COMMIT');
    return cycleRes.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};
/**
 * Marks a locked cycle's salaries strictly as paid.
 */
export const markCycleAsPaid = async (cycleId: string) => {
  const result = await pool.query(
    `
    UPDATE salaries 
    SET status = 'paid', payout_date = NOW()
    WHERE salary_cycle_id = $1 AND status = 'locked'
    RETURNING *
  `,
    [cycleId]
  );
  if (!result.rowCount) throw new Error('NO_LOCKED_SALARIES_FOUND_FOR_PAYOUT');
  return result.rows;
};

/**
 * Fetches a detailed breakdown of all incentives and penalties that formed a salary.
 */
export const getSalaryBreakdown = async (salaryId: string) => {
  const salaryRes = await pool.query(
    `
    SELECT s.*, c.start_date, c.end_date, u.role
    FROM salaries s
    JOIN salary_cycles c ON s.salary_cycle_id = c.id
    JOIN users u ON s.user_id = u.id
    WHERE s.id = $1
  `,
    [salaryId]
  );

  if (!salaryRes.rowCount) throw new Error('SALARY_RECORD_NOT_FOUND');
  const salary = salaryRes.rows[0];

  if (salary.role !== 'cleaner') {
    return []; // Only cleaners have incentives/penalties in this system
  }

  const cleanerRes = await pool.query(`SELECT id FROM cleaners WHERE user_id = $1`, [
    salary.user_id,
  ]);
  if (!cleanerRes.rowCount) return [];
  const cleanerId = cleanerRes.rows[0].id;

  const breakdown: { type: 'Incentive' | 'Penalty'; description: string; amount: number }[] = [];

  // 1. Daily Incentives
  const daily = await pool.query(
    `
    SELECT dib.amount, ir.name as description
    FROM daily_incentive_breakdown dib
    JOIN daily_work_records dwr ON dib.daily_work_record_id = dwr.id
    JOIN incentive_rules ir ON dib.incentive_rule_id = ir.id
    WHERE dwr.cleaner_id = $1 AND dwr.date BETWEEN $2 AND $3
  `,
    [cleanerId, salary.start_date, salary.end_date]
  );
  daily.rows.forEach((r) =>
    breakdown.push({
      type: 'Incentive',
      description: `Daily: ${r.description}`,
      amount: Number(r.amount),
    })
  );

  // 2. Milestones
  const milestones = await pool.query(
    `
    SELECT ma.amount, ir.name as description
    FROM milestone_achievements ma
    JOIN incentive_rules ir ON ma.incentive_rule_id = ir.id
    WHERE ma.cleaner_id = $1 AND ma.achieved_at BETWEEN $2 AND $3
  `,
    [cleanerId, salary.start_date, salary.end_date]
  );
  milestones.rows.forEach((r) =>
    breakdown.push({
      type: 'Incentive',
      description: `Milestone: ${r.description}`,
      amount: Number(r.amount),
    })
  );

  // 3. Manual Incentives
  const manual = await pool.query(
    `
    SELECT ci.amount, ir.name as description
    FROM cleaner_incentives ci
    JOIN incentive_rules ir ON ci.incentive_rule_id = ir.id
    WHERE ci.cleaner_id = $1 AND ci.created_at BETWEEN $2 AND $3
  `,
    [cleanerId, salary.start_date, salary.end_date]
  );
  manual.rows.forEach((r) =>
    breakdown.push({
      type: 'Incentive',
      description: `Manual: ${r.description}`,
      amount: Number(r.amount),
    })
  );

  // 4. Penalties
  const penalties = await pool.query(
    `
    SELECT amount, reason as description
    FROM penalties
    WHERE cleaner_id = $1 AND created_at BETWEEN $2 AND $3
  `,
    [cleanerId, salary.start_date, salary.end_date]
  );
  penalties.rows.forEach((r) =>
    breakdown.push({
      type: 'Penalty',
      description: r.description || 'Penalty',
      amount: Number(r.amount),
    })
  );

  return breakdown;
};
