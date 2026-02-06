import { Request, Response } from 'express';
import { pool } from '../../database/connectDatabase';
export const getAllSupervisors = async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT
        id,
        full_name,
        email
      FROM users
      WHERE role = 'supervisor'
      ORDER BY full_name ASC
    `);

    return res.status(200).json({
      success: true,
      supervisors: result.rows,
    });
  } catch (error) {
    console.error('GET ALL SUPERVISORS ERROR:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch supervisors',
    });
  }
};
