import { Request, Response } from 'express';
import { pool } from '../../database/connectDatabase';

/*
ADMIN creates incentive
Applies to ALL cleaners
Resets progress
Only ONE active incentive
*/

export const createIncentive = async (req: Request, res: Response) => {
  try {
    const { target_jobs, incentive_amount } = req.body;

    // Disable previous incentives
    await pool.query(`UPDATE incentives SET active=false`);

    // Create new incentive
    const result = await pool.query(
      `
      INSERT INTO incentives (target_jobs, incentive_amount, active)
      VALUES ($1,$2,true)
      RETURNING *
      `,
      [target_jobs, incentive_amount]
    );

    // Reset all cleaner progress
    await pool.query(`
      UPDATE workers
      SET completed_jobs=0,
          incentive_earned=0
      WHERE role='cleaner'
    `);

    res.json(result.rows[0]);
  } catch (err) {
    console.error('INCENTIVE CREATE ERROR:', err);
    res.status(500).json({ message: 'Failed to create incentive' });
  }
};

/* GET ACTIVE INCENTIVE */

export const getIncentives = async (_: Request, res: Response) => {
  try {
    const result = await pool.query(`SELECT * FROM incentives WHERE active=true LIMIT 1`);

    res.json(result.rows[0] || null);
  } catch {
    res.status(500).json({ message: 'Failed' });
  }
};

/* UPDATE ACTIVE INCENTIVE */

export const updateIncentive = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { target_jobs, incentive_amount } = req.body;

    await pool.query(
      `
      UPDATE incentives
      SET target_jobs=$1,
          incentive_amount=$2
      WHERE id=$3
      `,
      [target_jobs, incentive_amount, id]
    );

    // Reset all cleaners again
    await pool.query(`
      UPDATE workers
      SET completed_jobs=0,
          incentive_earned=0
      WHERE role='cleaner'
    `);

    res.json({ success: true });
  } catch {
    res.status(500).json({ message: 'Update failed' });
  }
};

/* DELETE INCENTIVE */

export const deleteIncentive = async (req: Request, res: Response) => {
  try {
    await pool.query(`DELETE FROM incentives WHERE id=$1`, [req.params.id]);
    res.json({ success: true });
  } catch {
    res.status(500).json({ message: 'Delete failed' });
  }
};
