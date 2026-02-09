import { Response } from 'express';
import { AuthRequest } from '../../middlewares/authMiddleware';
import { pool } from '../../database/connectDatabase';

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const role = req.user?.role;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    let query = `
      SELECT 
        u.id, 
        u.email, 
        u.full_name, 
        u.role, 
        u.document_id, 
        u.age, 
        u.nationality, 
        u.document,
        u.profile_image
      FROM users u
      WHERE u.id = $1
    `;

    // If supervisor, join with supervisors table to get building info
    if (role === 'supervisor') {
      query = `
        SELECT 
          u.id, 
          u.email, 
          u.full_name, 
          u.role, 
          u.document_id, 
          u.age, 
          u.nationality, 
          u.document,
          u.profile_image,
          s.id as supervisor_id,
          b.building_name,
          b.id as building_id
        FROM users u
        LEFT JOIN supervisors s ON u.id = s.user_id
        LEFT JOIN buildings b ON s.building_id = b.id
        WHERE u.id = $1
      `;
    }

    // If cleaner, join with cleaners table
    if (role === 'cleaner') {
      query = `
        SELECT 
          u.id, 
          u.email, 
          u.full_name, 
          u.role, 
          u.document_id, 
          u.age, 
          u.nationality, 
          u.document,
          c.id as cleaner_id,
          c.total_tasks,
          c.total_earning,
          b.building_name
        FROM users u
        LEFT JOIN cleaners c ON u.id = c.user_id
        LEFT JOIN buildings b ON c.building_id = b.id
        WHERE u.id = $1
      `;
    }

    const result = await pool.query(query, [userId]);

    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (err) {
    console.error('getMe error', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch user details' });
  }
};
