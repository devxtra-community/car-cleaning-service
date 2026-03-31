import { Router, Request, Response, NextFunction } from 'express';
import { pool } from '../db';
import {
  generateSalaryForUser,
  generateSalaryForAllUsers,
  lockCycle,
  markCycleAsPaid,
  getSalaryBreakdown,
} from './salaryService';
const router = Router();

// GET: List all salary cycles
router.get('/salary-cycles', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await pool.query(`
      SELECT * FROM salary_cycles 
      ORDER BY year DESC, month DESC, created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// POST: Create a new salary cycle
router.post('/salary-cycles', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { month, year, start_date, end_date } = req.body;
    const result = await pool.query(
      `
      INSERT INTO salary_cycles (month, year, start_date, end_date, is_locked)
      VALUES ($1, $2, $3, $4, false) RETURNING *
    `,
      [month, year, start_date, end_date]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});
// POST: Generate salaries for all users in a cycle
router.post(
  '/salary-cycles/:id/generate',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await generateSalaryForAllUsers(req.params.id as string);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);
// POST: Generate salary for a single unique user
router.post(
  '/salary-cycles/:id/generate/:uid',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await generateSalaryForUser(req.params.uid as string, req.params.id as string);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);
// POST: Lock a cycle to seal current salary amounts
router.post('/salary-cycles/:id/lock', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const adminUserId = (req as any).user?.userId;

    if (!adminUserId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const result = await lockCycle(req.params.id as string, adminUserId);
    res.json({ message: 'Cycle locked successfully', cycle: result });
  } catch (err) {
    next(err);
  }
});
// POST: Process payout marker for a locked cycle
router.post('/salary-cycles/:id/pay', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await markCycleAsPaid(req.params.id as string);
    res.json({ message: 'Salaries marked as paid', count: result.length });
  } catch (err) {
    next(err);
  }
});
// GET: View full details of a specific cycle with its payroll
router.get('/salary-cycles/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cycle = await pool.query(`SELECT * FROM salary_cycles WHERE id = $1`, [
      req.params.id as string,
    ]);
    if (!cycle.rowCount) throw new Error('CYCLE_NOT_FOUND');

    const salaries = await pool.query(
      `
      SELECT s.*, u.full_name, u.role
      FROM salaries s
      JOIN users u ON s.user_id = u.id
      WHERE s.salary_cycle_id = $1
    `,
      [req.params.id as string]
    );
    res.json({ cycle: cycle.rows[0], salaries: salaries.rows });
  } catch (err) {
    next(err);
  }
});
// GET: View the entire historical salary payout timeline for one user
router.get('/salaries/user/:userId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const salaries = await pool.query(
      `
      SELECT s.*, c.month, c.year, c.start_date, c.end_date
      FROM salaries s
      JOIN salary_cycles c ON s.salary_cycle_id = c.id
      WHERE s.user_id = $1
      ORDER BY c.year DESC, c.month DESC
    `,
      [req.params.userId as string]
    );
    res.json(salaries.rows);
  } catch (err) {
    next(err);
  }
});

// GET: View breakdown of a specific salary record
router.get('/salaries/:id/breakdown', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await getSalaryBreakdown(req.params.id as string);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
