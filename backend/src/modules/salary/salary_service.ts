import { pool } from '../../database/connectDatabase';
import { sendNotificationToUser } from '../notifications/notification_service';
export const generateSalaryForUser = async (
  userId: string,
  cycleId: string,
  bypassLock: boolean = false
) => {
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

    if (cycle.is_locked && !bypassLock) throw new Error('SALARY_CYCLE_LOCKED');

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

    let totalIncentives = 0;
    let totalPenalties = 0;

    // 3️⃣ Role-based calculations
    if (user.role === 'cleaner') {
      // Get cleaner profile
      const cleanerRes = await client.query(`SELECT id FROM cleaners WHERE user_id = $1`, [userId]);
      if (!cleanerRes.rowCount) throw new Error('CLEANER_PROFILE_NOT_FOUND');
      const cleanerProfileId = cleanerRes.rows[0].id;

      // Tasks
      await client.query(
        `SELECT COUNT(*) AS total_tasks FROM tasks
         WHERE cleaner_id = $1 AND status = 'completed'
         AND created_at BETWEEN $2 AND $3`,
        [cleanerProfileId, start_date, end_date]
      );

      // 1. Performance Incentives (from daily_incentive_breakdown)
      const perfRes = await client.query(
        `SELECT COALESCE(SUM(dib.amount), 0) AS total
         FROM daily_work_records dwr
         JOIN daily_incentive_breakdown dib ON dwr.id = dib.daily_work_record_id
         WHERE dwr.cleaner_id = $1 AND dwr.date BETWEEN $2 AND $3`,
        [cleanerProfileId, start_date, end_date]
      );

      // 2. Milestone Achievements
      const milRes = await client.query(
        `SELECT COALESCE(SUM(amount), 0) AS total FROM milestone_achievements
         WHERE cleaner_id = $1 AND achieved_at BETWEEN $2 AND $3`,
        [cleanerProfileId, start_date, end_date]
      );

      // 3. Manual Cleaner Incentives
      const manRes = await client.query(
        `SELECT COALESCE(SUM(amount), 0) AS total FROM cleaner_incentives
         WHERE cleaner_id = $1 AND created_at BETWEEN $2 AND $3`,
        [cleanerProfileId, start_date, end_date]
      );

      totalIncentives =
        Number(perfRes.rows[0].total) + Number(milRes.rows[0].total) + Number(manRes.rows[0].total);

      // Penalties
      const penaltyRes = await client.query(
        `SELECT COALESCE(SUM(amount), 0) AS total FROM penalties
         WHERE cleaner_id = $1 AND created_at BETWEEN $2 AND $3`,
        [cleanerProfileId, start_date, end_date]
      );
      totalPenalties = Number(penaltyRes.rows[0].total);
    } else {
      // For supervisors and other roles, incentives/penalties are currently 0 unless logic is added later
      totalIncentives = 0;
      totalPenalties = 0;
    }

    // 4️⃣ Final Values
    const baseSalary = Number(user.base_salary);
    const netSalary = baseSalary + totalIncentives - totalPenalties;

    const salaryRes = await client.query(
      `INSERT INTO salaries (
        user_id, salary_cycle_id, base_salary,
        incentives, penalties, final_salary, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, 'pending')
      ON CONFLICT (user_id, salary_cycle_id)
      DO UPDATE SET
        base_salary = EXCLUDED.base_salary,
        incentives = EXCLUDED.incentives,
        penalties = EXCLUDED.penalties,
        final_salary = EXCLUDED.final_salary,
        status = CASE WHEN salaries.status = 'paid' THEN 'paid' ELSE 'pending' END
      RETURNING *`,
      [userId, cycleId, baseSalary, totalIncentives, totalPenalties, netSalary]
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

export const getLatestOpenCycle = async () => {
  const result = await pool.query(`
    SELECT id FROM salary_cycles
    WHERE is_locked = false
    ORDER BY year DESC, month DESC
    LIMIT 1
  `);
  return result.rows[0]?.id;
};

/* ================= GET ALL SALARIES ================= */
export const getAllSalaries = async (limit?: number, offset?: number) => {
  const params: any[] = [];
  let pagination = '';

  if (limit !== undefined && offset !== undefined) {
    pagination = `LIMIT $1 OFFSET $2`;
    params.push(limit, offset);
  }

  const query = `
    SELECT
      s.id,
      s.user_id,
      u.full_name,
      u.role,
      CONCAT(sc.year, '-', LPAD(sc.month::text, 2, '0')) AS salary_month,
      u.base_salary,
      CASE 
        WHEN sc.is_locked = true THEN COALESCE(s.incentives, 0)
        WHEN u.role = 'cleaner' THEN COALESCE(live.incentives, 0)
        ELSE 0 
      END AS incentives,
      CASE 
        WHEN sc.is_locked = true THEN COALESCE(s.penalties, 0)
        WHEN u.role = 'cleaner' THEN COALESCE(live.penalties, 0)
        ELSE 0 
      END AS penalties,
      CASE
        WHEN sc.is_locked = true THEN COALESCE(s.final_salary, u.base_salary)
        WHEN u.role = 'cleaner' THEN (COALESCE(u.base_salary, 0) + COALESCE(live.incentives, 0) - COALESCE(live.penalties, 0))
        ELSE COALESCE(u.base_salary, 0)
      END AS final_salary,
      s.payout_date,
      s.status,
      COUNT(*) OVER() as total_count
    FROM salaries s
    LEFT JOIN salary_cycles sc ON sc.id = s.salary_cycle_id
    JOIN users u ON u.id = s.user_id
    LEFT JOIN cleaners c ON c.user_id = u.id
    LEFT JOIN LATERAL (
      SELECT
        CASE WHEN sc.is_locked = false THEN
          (SELECT COALESCE(SUM(amount), 0) FROM cleaner_incentives WHERE cleaner_id = c.id AND created_at BETWEEN sc.start_date AND sc.end_date)
          + (SELECT COALESCE(SUM(dib.amount), 0) FROM daily_work_records dwr JOIN daily_incentive_breakdown dib ON dwr.id = dib.daily_work_record_id WHERE dwr.cleaner_id = c.id AND dwr.date BETWEEN sc.start_date AND sc.end_date)
          + (SELECT COALESCE(SUM(amount), 0) FROM milestone_achievements WHERE cleaner_id = c.id AND achieved_at BETWEEN sc.start_date AND sc.end_date)
        ELSE 0 END AS incentives,
        CASE WHEN sc.is_locked = false THEN
          (SELECT COALESCE(SUM(amount), 0) FROM penalties WHERE cleaner_id = c.id AND created_at BETWEEN sc.start_date AND sc.end_date)
        ELSE 0 END AS penalties
    ) live ON u.role = 'cleaner'
    ORDER BY sc.year DESC NULLS LAST, sc.month DESC NULLS LAST, u.full_name ASC
    ${pagination}
  `;

  const result = await pool.query(query, params);
  const totalCount = result.rows.length > 0 ? parseInt(result.rows[0].total_count) : 0;

  return {
    rows: result.rows,
    totalCount,
  };
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

    // 3️⃣ Ensure all records are finalized before locking
    const unfinalizedRes = await client.query(
      `
      SELECT COUNT(*) AS count
      FROM salaries
      WHERE salary_cycle_id = $1
        AND status NOT IN ('finalized', 'locked', 'paid')
      `,
      [cycleId]
    );

    if (Number(unfinalizedRes.rows[0].count) > 0) {
      throw new Error('SALARIES_NOT_FINALIZED');
    }

    // 4️⃣ Lock salary cycle
    await client.query(
      `
      UPDATE salary_cycles
      SET is_locked = true,
          locked_at = now()
      WHERE id = $1
      `,
      [cycleId]
    );

    // 5️⃣ Update salary status
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

    // Send notifications to all affected users (non-blocking)
    (async () => {
      try {
        const salaryMonthRes = await pool.query(
          'SELECT month, year FROM salary_cycles WHERE id = $1',
          [cycleId]
        );
        const { month, year } = salaryMonthRes.rows[0];
        const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long' });

        const usersRes = await pool.query(
          'SELECT user_id FROM salaries WHERE salary_cycle_id = $1',
          [cycleId]
        );

        for (const row of usersRes.rows) {
          await sendNotificationToUser(
            row.user_id,
            'Salary Finalized',
            `Your salary for ${monthName} ${year} has been finalized and locked.`
          );
        }
      } catch (notifyErr) {
        console.error('Error sending salary finalization notifications:', notifyErr);
      }
    })();

    return { message: 'Salary cycle locked successfully' };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

export const markSalaryAsPaid = async (salaryId: string) => {
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
          payout_date = now()
      WHERE id = $1
      RETURNING *
      `,
      [salaryId]
    );

    await client.query('COMMIT');

    // Send notification (non-blocking)
    (async () => {
      try {
        const salary = updateRes.rows[0];
        await sendNotificationToUser(
          salary.user_id,
          'Salary Paid',
          `Your salary payment of ${salary.final_salary} has been processed.`
        );
      } catch (notifyErr) {
        console.error('Error sending salary payment notification:', notifyErr);
      }
    })();

    return updateRes.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

export const finalizeSalaryRecord = async (salaryId: string) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const salaryRes = await client.query(
      `
      SELECT s.id, s.status, sc.is_locked
      FROM salaries s
      LEFT JOIN salary_cycles sc ON sc.id = s.salary_cycle_id
      WHERE s.id = $1
      `,
      [salaryId]
    );

    if (!salaryRes.rowCount) {
      throw new Error('SALARY_NOT_FOUND');
    }

    const salary = salaryRes.rows[0];

    if (salary.is_locked) {
      throw new Error('SALARY_CYCLE_LOCKED');
    }

    if (salary.status === 'paid') {
      throw new Error('SALARY_ALREADY_PAID');
    }

    if (salary.status === 'locked') {
      throw new Error('SALARY_ALREADY_LOCKED');
    }

    if (salary.status === 'finalized') {
      await client.query('COMMIT');
      return salary;
    }

    let updateRes;
    try {
      updateRes = await client.query(
        `
        UPDATE salaries
        SET status = 'finalized',
            finalized_at = now()
        WHERE id = $1
        RETURNING *
        `,
        [salaryId]
      );
    } catch (err: any) {
      // Backward compatibility: older enum definitions may not include "finalized".
      if (err?.code === '22P02') {
        updateRes = await client.query(
          `
          UPDATE salaries
          SET status = 'locked',
              finalized_at = now()
          WHERE id = $1
          RETURNING *
          `,
          [salaryId]
        );
      } else {
        throw err;
      }
    }

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

  const baseRes = await pool.query(`SELECT base_salary FROM users WHERE id = $1`, [cleanerId]);

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

export const getSalariesByCycleId = async (cycleId: string) => {
  const result = await pool.query(
    `
    SELECT 
      u.id              AS user_id,
      u.full_name       AS cleaner_name,
      u.role            AS role,
      u.base_salary     AS base_salary,
      CASE 
        WHEN sc.is_locked = true THEN COALESCE(s.incentives, 0)
        WHEN u.role = 'cleaner' THEN COALESCE(live.incentives, 0)
        ELSE 0 
      END AS incentives,
      CASE 
        WHEN sc.is_locked = true THEN COALESCE(s.penalties, 0)
        WHEN u.role = 'cleaner' THEN COALESCE(live.penalties, 0)
        ELSE 0 
      END AS penalties,
      CASE
        WHEN sc.is_locked = true THEN COALESCE(s.final_salary, u.base_salary)
        WHEN u.role = 'cleaner' THEN (COALESCE(u.base_salary, 0) + COALESCE(live.incentives, 0) - COALESCE(live.penalties, 0))
        ELSE COALESCE(u.base_salary, 0)
      END AS final_salary,
      COALESCE(s.status, 'pending') AS status,
      s.id              AS id
    FROM users u
    JOIN salary_cycles sc ON sc.id = $1
    LEFT JOIN salaries s ON s.user_id = u.id AND s.salary_cycle_id = sc.id
    LEFT JOIN cleaners c ON c.user_id = u.id
    LEFT JOIN LATERAL (
      SELECT
        (SELECT COALESCE(SUM(amount), 0) FROM cleaner_incentives WHERE cleaner_id = c.id AND created_at BETWEEN sc.start_date AND sc.end_date)
        + (SELECT COALESCE(SUM(dib.amount), 0) FROM daily_work_records dwr JOIN daily_incentive_breakdown dib ON dwr.id = dib.daily_work_record_id WHERE dwr.cleaner_id = c.id AND dwr.date BETWEEN sc.start_date AND sc.end_date)
        + (SELECT COALESCE(SUM(amount), 0) FROM milestone_achievements WHERE cleaner_id = c.id AND achieved_at BETWEEN sc.start_date AND sc.end_date)
        AS incentives,
        (SELECT COALESCE(SUM(amount), 0) FROM penalties WHERE cleaner_id = c.id AND created_at BETWEEN sc.start_date AND sc.end_date)
        AS penalties
    ) live ON u.role = 'cleaner'
    WHERE u.role IN ('cleaner', 'supervisor')
    ORDER BY u.full_name ASC
    `,
    [cycleId]
  );
  return result.rows;
};

export const getSalariesByUserId = async (userId: string) => {
  const result = await pool.query(
    `
    SELECT 
      s.id,
      CONCAT(sc.year, '-', LPAD(sc.month::text, 2, '0')) AS salary_month,
      u.base_salary,
      CASE 
        WHEN sc.is_locked = true THEN COALESCE(s.incentives, 0)
        WHEN u.role = 'cleaner' THEN COALESCE(live.incentives, 0)
        ELSE 0 
      END AS incentives,
      CASE 
        WHEN sc.is_locked = true THEN COALESCE(s.penalties, 0)
        WHEN u.role = 'cleaner' THEN COALESCE(live.penalties, 0)
        ELSE 0 
      END AS penalties,
      CASE
        WHEN sc.is_locked = true THEN COALESCE(s.final_salary, u.base_salary)
        WHEN u.role = 'cleaner' THEN (COALESCE(u.base_salary, 0) + COALESCE(live.incentives, 0) - COALESCE(live.penalties, 0))
        ELSE COALESCE(u.base_salary, 0)
      END AS final_salary,
      s.status,
      s.created_at,
      u.role
    FROM salaries s
    LEFT JOIN salary_cycles sc ON sc.id = s.salary_cycle_id
    JOIN users u ON u.id = s.user_id
    LEFT JOIN cleaners c ON c.user_id = u.id
    LEFT JOIN LATERAL (
      SELECT
        (SELECT COALESCE(SUM(amount), 0) FROM cleaner_incentives WHERE cleaner_id = c.id AND created_at BETWEEN sc.start_date AND sc.end_date)
        + (SELECT COALESCE(SUM(dib.amount), 0) FROM daily_work_records dwr JOIN daily_incentive_breakdown dib ON dwr.id = dib.daily_work_record_id WHERE dwr.cleaner_id = c.id AND dwr.date BETWEEN sc.start_date AND sc.end_date)
        + (SELECT COALESCE(SUM(amount), 0) FROM milestone_achievements WHERE cleaner_id = c.id AND achieved_at BETWEEN sc.start_date AND sc.end_date)
        AS incentives,
        (SELECT COALESCE(SUM(amount), 0) FROM penalties WHERE cleaner_id = c.id AND created_at BETWEEN sc.start_date AND sc.end_date)
        AS penalties
    ) live ON u.role = 'cleaner'
    WHERE s.user_id = $1
    ORDER BY sc.year DESC NULLS LAST, sc.month DESC NULLS LAST
    `,
    [userId]
  );
  return result.rows;
};

/* ================= SALARY TIMELINE (mobile calendar view) ================= */
export const getSalaryTimeline = async (userId: string) => {
  const userRes = await pool.query(
    `SELECT u.id, u.role, u.base_salary,
            COALESCE(u.joining_date, u.created_at) AS joining_date
     FROM users u
     WHERE u.id = $1`,
    [userId]
  );
  if (!userRes.rowCount) throw new Error('USER_NOT_FOUND');
  const user = userRes.rows[0];

  // Always try to find a cleaners row — incentives/penalties are keyed on cleaners.id
  let cleanerId: string | null = null;
  const cRes = await pool.query(`SELECT id FROM cleaners WHERE user_id = $1`, [userId]);
  if (cRes.rowCount) cleanerId = cRes.rows[0].id;

  const salaryRes = await pool.query(
    `SELECT s.id, sc.year, sc.month, s.incentives,
            s.penalties, s.final_salary, s.status, sc.is_locked, s.payout_date
     FROM salaries s
     LEFT JOIN salary_cycles sc ON sc.id = s.salary_cycle_id
     WHERE s.user_id = $1`,
    [userId]
  );
  const salaryMap = new Map<string, any>();
  for (const row of salaryRes.rows) {
    salaryMap.set(`${row.year}-${String(row.month).padStart(2, '0')}`, row);
  }

  const joiningDate = new Date(user.joining_date);
  const now = new Date();
  const timeline: any[] = [];
  const cursor = new Date(joiningDate.getFullYear(), joiningDate.getMonth(), 1);
  const endCursor = new Date(now.getFullYear(), now.getMonth(), 1);

  while (cursor <= endCursor) {
    const year = cursor.getFullYear();
    const month = cursor.getMonth() + 1;
    const key = `${year}-${String(month).padStart(2, '0')}`;
    // Use open-ended range: >= first day of month AND < first day of NEXT month
    // This reliably captures every record regardless of timestamp precision
    const monthStart = new Date(year, month - 1, 1); // e.g. 2025-02-01 00:00:00
    const nextMonthStart = new Date(year, month, 1); // e.g. 2025-03-01 00:00:00
    const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;

    let liveIncentives = 0;
    let livePenalties = 0;
    if (cleanerId) {
      // 1. Performance (Daily)
      const perfRes = await pool.query(
        `SELECT COALESCE(SUM(dib.amount), 0) AS total
         FROM daily_work_records dwr
         JOIN daily_incentive_breakdown dib ON dwr.id = dib.daily_work_record_id
         WHERE dwr.cleaner_id = $1 AND dwr.date >= $2::date AND dwr.date < $3::date`,
        [cleanerId, monthStart, nextMonthStart]
      );

      // 2. Milestones
      const milRes = await pool.query(
        `SELECT COALESCE(SUM(amount), 0) AS total 
         FROM milestone_achievements
         WHERE cleaner_id = $1 AND achieved_at >= $2 AND achieved_at < $3`,
        [cleanerId, monthStart, nextMonthStart]
      );

      // 3. Manual/Other
      const manRes = await pool.query(
        `SELECT COALESCE(SUM(amount), 0) AS total 
         FROM cleaner_incentives
         WHERE cleaner_id = $1 AND created_at >= $2 AND created_at < $3`,
        [cleanerId, monthStart, nextMonthStart]
      );

      liveIncentives =
        Number(perfRes.rows[0].total) + Number(milRes.rows[0].total) + Number(manRes.rows[0].total);
      // Penalties stay on the penalties table (keyed by cleaner_id)
      const pRes = await pool.query(
        `SELECT COALESCE(SUM(amount), 0) AS total
         FROM penalties
         WHERE cleaner_id = $1
           AND created_at >= $2
           AND created_at <  $3`,
        [cleanerId, monthStart, nextMonthStart]
      );
      livePenalties = Number(pRes.rows[0].total);
    }

    const existing = salaryMap.get(key);
    const baseSalary = Number(user.base_salary) || 0;
    const finalSalary = baseSalary + liveIncentives - livePenalties;

    timeline.push({
      salary_month: key,
      year,
      month,
      base_salary: baseSalary,
      incentives: liveIncentives,
      penalties: livePenalties,
      final_salary: finalSalary,
      status: existing
        ? existing.is_locked
          ? 'locked'
          : existing.status
        : isCurrentMonth
          ? 'in_progress'
          : 'pending',
      is_current_month: isCurrentMonth,
      salary_id: existing?.id ?? null,
    });

    cursor.setMonth(cursor.getMonth() + 1);
  }

  return timeline.reverse();
};

/**
 * Role-based salary summary for the web admin dashboard.
 * Returns all salary records (or filtered by cycle) with full user, role,
 * and building context for a role-wise split table.
 */
export const getRoleBasedSalaries = async (cycleId?: string) => {
  const params: any[] = [];

  if (cycleId) {
    params.push(cycleId);
  } else {
    // If no cycleId, we'll join on the latest cycle for each user effectively
    // But usually this is called with a cycleId from the dashboard.
    // If it's null, we'll return all records.
  }

  const result = await pool.query(
    `SELECT
      u.id              AS user_id,
      u.full_name,
      u.role,
      u.email,
      COALESCE(b_c.building_name, b_s.building_name, 'N/A') AS building_name,
      COALESCE(u.base_salary, 0) AS base_salary,
      CASE 
        WHEN sc.is_locked = true THEN COALESCE(s.incentives, 0)
        WHEN u.role = 'cleaner' THEN COALESCE(live.incentives, 0)
        ELSE 0 
      END AS incentives,
      CASE 
        WHEN sc.is_locked = true THEN COALESCE(s.penalties, 0)
        WHEN u.role = 'cleaner' THEN COALESCE(live.penalties, 0)
        ELSE 0 
      END AS penalties,
      CASE
        WHEN sc.is_locked = true THEN COALESCE(s.final_salary, u.base_salary)
        WHEN u.role = 'cleaner' THEN (COALESCE(u.base_salary, 0) + COALESCE(live.incentives, 0) - COALESCE(live.penalties, 0))
        ELSE COALESCE(u.base_salary, 0)
      END AS final_salary,
      COALESCE(s.status, CASE WHEN sc.id IS NOT NULL THEN 'pending' ELSE 'not_generated' END) AS status,
      s.payout_date,
      s.id AS salary_id,
      CONCAT(sc.year, '-', LPAD(sc.month::text, 2, '0')) AS salary_month
    FROM users u
    LEFT JOIN cleaners cl ON cl.user_id = u.id
    LEFT JOIN buildings b_c ON b_c.id = cl.building_id
    LEFT JOIN supervisors sv ON sv.user_id = u.id
    LEFT JOIN buildings b_s ON b_s.id = sv.building_id
    -- Dynamic join based on cycle filter
    LEFT JOIN salary_cycles sc ON (1=1 ${cycleId ? 'AND sc.id = $1' : 'AND sc.is_locked = false'})
    LEFT JOIN salaries s ON s.user_id = u.id AND s.salary_cycle_id = sc.id
    LEFT JOIN LATERAL (
      SELECT
        CASE WHEN sc.is_locked = false THEN
          (SELECT COALESCE(SUM(amount), 0) FROM cleaner_incentives WHERE cleaner_id = cl.id AND created_at BETWEEN sc.start_date AND sc.end_date)
          + (SELECT COALESCE(SUM(dib.amount), 0) FROM daily_work_records dwr JOIN daily_incentive_breakdown dib ON dwr.id = dib.daily_work_record_id WHERE dwr.cleaner_id = cl.id AND dwr.date BETWEEN sc.start_date AND sc.end_date)
          + (SELECT COALESCE(SUM(amount), 0) FROM milestone_achievements WHERE cleaner_id = cl.id AND achieved_at BETWEEN sc.start_date AND sc.end_date)
        ELSE 0 END AS incentives,
        CASE WHEN sc.is_locked = false THEN
          (SELECT COALESCE(SUM(amount), 0) FROM penalties WHERE cleaner_id = cl.id AND created_at BETWEEN sc.start_date AND sc.end_date)
        ELSE 0 END AS penalties
    ) live ON u.role = 'cleaner'
    WHERE u.role IN ('cleaner', 'supervisor')
    ORDER BY u.role, u.full_name`,
    params
  );

  return result.rows;
};

/**
 * Monthly Report Summary for the Accountant Dashboard.
 * Returns aggregated totals per month and per building for the latest cycle.
 */
export const getMonthlyReport = async () => {
  // 1. Monthly History (Last 12 cycles)
  const historyRes = await pool.query(`
    SELECT
      CONCAT(sc.year, '-', LPAD(sc.month::text, 2, '0')) AS month_key,
      SUM(u.base_salary) as base_salary,
      SUM(
        CASE 
          WHEN sc.is_locked = true THEN COALESCE(s.incentives, 0)
          ELSE COALESCE(live.incentives, 0)
        END
      ) as incentives,
      SUM(
        CASE 
          WHEN sc.is_locked = true THEN COALESCE(s.penalties, 0)
          ELSE COALESCE(live.penalties, 0)
        END
      ) as penalties,
      SUM(
        CASE 
          WHEN sc.is_locked = true THEN COALESCE(s.final_salary, u.base_salary)
          ELSE (COALESCE(u.base_salary, 0) + COALESCE(live.incentives, 0) - COALESCE(live.penalties, 0))
        END
      ) as net_payout,
      CASE WHEN sc.is_locked THEN 'finalized' ELSE 'current' END as status
    FROM salary_cycles sc
    CROSS JOIN users u
    LEFT JOIN salaries s ON s.user_id = u.id AND s.salary_cycle_id = sc.id
    LEFT JOIN cleaners c ON c.user_id = u.id
    LEFT JOIN LATERAL (
      SELECT
        CASE WHEN sc.is_locked = false THEN
          (SELECT COALESCE(SUM(amount), 0) FROM cleaner_incentives WHERE cleaner_id = c.id AND created_at BETWEEN sc.start_date AND sc.end_date)
          + (SELECT COALESCE(SUM(dib.amount), 0) FROM daily_work_records dwr JOIN daily_incentive_breakdown dib ON dwr.id = dib.daily_work_record_id WHERE dwr.cleaner_id = c.id AND dwr.date BETWEEN sc.start_date AND sc.end_date)
          + (SELECT COALESCE(SUM(amount), 0) FROM milestone_achievements WHERE cleaner_id = c.id AND achieved_at BETWEEN sc.start_date AND sc.end_date)
        ELSE 0 END AS incentives,
        CASE WHEN sc.is_locked = false THEN
          (SELECT COALESCE(SUM(amount), 0) FROM penalties WHERE cleaner_id = c.id AND created_at BETWEEN sc.start_date AND sc.end_date)
        ELSE 0 END AS penalties
    ) live ON u.role = 'cleaner'
    WHERE u.role IN ('cleaner', 'supervisor')
    GROUP BY sc.id, sc.year, sc.month, sc.is_locked
    ORDER BY sc.year DESC, sc.month DESC
    LIMIT 12
  `);

  // 2. Building Breakdown (Latest Cycle)
  const buildingRes = await pool.query(`
    WITH latest_cycle AS (
      SELECT id FROM salary_cycles ORDER BY year DESC, month DESC LIMIT 1
    )
    SELECT
      b.id,
      b.building_name as name,
      COUNT(DISTINCT s.user_id)::int as cleaners_count,
      SUM(s.final_salary) as total_salary,
      SUM(s.incentives) as incentives,
      SUM(s.penalties) as penalties
    FROM salaries s
    JOIN latest_cycle lc ON s.salary_cycle_id = lc.id
    JOIN cleaners cl ON cl.user_id = s.user_id
    JOIN buildings b ON b.id = cl.building_id
    GROUP BY b.id, b.building_name
  `);

  const result = {
    history: historyRes.rows,
    buildings: buildingRes.rows,
  };

  return result;
};

export const getSalaryBreakdown = async (salaryId: string) => {
  const salaryRes = await pool.query(
    `SELECT user_id, salary_cycle_id FROM salaries WHERE id = $1`,
    [salaryId]
  );
  if (!salaryRes.rowCount) throw new Error('SALARY_NOT_FOUND');
  const { user_id, salary_cycle_id } = salaryRes.rows[0];

  const cycleRes = await pool.query(
    `SELECT start_date, end_date FROM salary_cycles WHERE id = $1`,
    [salary_cycle_id]
  );
  const { start_date, end_date } = cycleRes.rows[0];

  const cleanerRes = await pool.query(`SELECT id FROM cleaners WHERE user_id = $1`, [user_id]);
  if (!cleanerRes.rowCount) return [];
  const cleanerProfileId = cleanerRes.rows[0].id;

  const incentives = await pool.query(
    `SELECT 'Incentive' as type, description, amount FROM cleaner_incentives 
     WHERE cleaner_id = $1 AND created_at BETWEEN $2 AND $3`,
    [cleanerProfileId, start_date, end_date]
  );

  const penalties = await pool.query(
    `SELECT 'Penalty' as type, description, amount FROM penalties 
     WHERE cleaner_id = $1 AND created_at BETWEEN $2 AND $3`,
    [cleanerProfileId, start_date, end_date]
  );

  return [...incentives.rows, ...penalties.rows];
};
