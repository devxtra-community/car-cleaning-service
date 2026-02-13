import { Response } from 'express';
import { AuthRequest } from '../../middlewares/authMiddleware';
import { pool } from '../../database/connectDatabase';

/* ================= CREATE REVIEW ================= */

export const createReview = async (req: AuthRequest, res: Response) => {
  try {
    const { task_id, rating, comment } = req.body;

    if (!task_id || !rating) {
      return res.status(400).json({ success: false, message: 'Missing task_id or rating' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
    }

    // Get cleaner_id from task
    const taskRes = await pool.query('SELECT cleaner_id FROM tasks WHERE id = $1', [task_id]);

    if (!taskRes.rows.length) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const cleaner_id = taskRes.rows[0].cleaner_id;

    // Check if review already exists for this task
    const existingReview = await pool.query('SELECT id FROM reviews WHERE task_id = $1', [task_id]);

    if (existingReview.rows.length > 0) {
      return res
        .status(400)
        .json({ success: false, message: 'Review already exists for this task' });
    }

    // Insert review
    const result = await pool.query(
      `
      INSERT INTO reviews (task_id, cleaner_id, rating, comment)
      VALUES ($1, $2, $3, $4)
      RETURNING *
      `,
      [task_id, cleaner_id, rating, comment || null]
    );

    return res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('CREATE REVIEW ERROR:', err);
    return res.status(500).json({ success: false, message: 'Failed to create review' });
  }
};

/* ================= GET REVIEWS BY WORKER ================= */

export const getReviewsByWorker = async (req: AuthRequest, res: Response) => {
  try {
    const { workerId } = req.params;

    const result = await pool.query(
      `
      SELECT 
        r.*,
        t.car_model,
        t.car_type,
        t.owner_name
      FROM reviews r
      LEFT JOIN tasks t ON r.task_id = t.id
      WHERE r.cleaner_id = $1
      ORDER BY r.created_at DESC
      `,
      [workerId]
    );

    return res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('GET REVIEWS ERROR:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch reviews' });
  }
};

/* ================= GET REVIEW BY TASK ================= */

export const getReviewByTask = async (req: AuthRequest, res: Response) => {
  try {
    const { taskId } = req.params;

    const result = await pool.query(
      `
      SELECT 
        r.*,
        t.car_model,
        t.car_type,
        t.owner_name
      FROM reviews r
      LEFT JOIN tasks t ON r.task_id = t.id
      WHERE r.task_id = $1
      `,
      [taskId]
    );

    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    return res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('GET REVIEW ERROR:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch review' });
  }
};
