import { Request, Response } from 'express';
import { pool } from '../../database/connectDatabase';

/* ================= CREATE INCENTIVE ================= */

export const createIncentive = async (req: Request, res: Response) => {
  try {
    const { target_tasks, incentive_amount } = req.body;

    if (!target_tasks || !incentive_amount) {
      return res.status(400).json({ message: 'Missing fields' });
    }

    // Disable previous incentive
    await pool.query(`UPDATE incentives SET active=false`);

    const result = await pool.query(
      `
      INSERT INTO incentives (target_tasks,incentive_amount,active)
      VALUES ($1,$2,true)
      RETURNING *
      `,
      [target_tasks, incentive_amount]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.log('CREATE INCENTIVE ERROR:', err);
    res.status(500).json({ message: 'Failed to create incentive' });
  }
};

/* ================= GET ACTIVE INCENTIVE ================= */

export const getActiveIncentive = async (_: Request, res: Response) => {
  try {
    const result = await pool.query(`SELECT * FROM incentives WHERE active=true LIMIT 1`);

    res.json(result.rows[0] || null);
  } catch {
    res.status(500).json({ message: 'Failed' });
  }
};

/* ================= UPDATE INCENTIVE ================= */

export const updateIncentive = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { target_tasks, incentive_amount } = req.body;

    await pool.query(
      `
      UPDATE incentives
      SET target_tasks=$1,
          incentive_amount=$2
      WHERE id=$3
      `,
      [target_tasks, incentive_amount, id]
    );

    res.json({ success: true });
  } catch {
    res.status(500).json({ message: 'Update failed' });
  }
};

/* ================= DELETE INCENTIVE ================= */

export const deleteIncentive = async (req: Request, res: Response) => {
  try {
    await pool.query(`DELETE FROM incentives WHERE id=$1`, [req.params.id]);
    res.json({ success: true });
  } catch {
    res.status(500).json({ message: 'Delete failed' });
  }
};
