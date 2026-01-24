import { Response } from 'express';
import { AuthRequest } from '../../middlewares/authMiddleware';
import { createTaskService } from './tasks_service';
import { logger } from '../../config/logger'; // ✅ use your logger

export const createTaskController = async (req: AuthRequest, res: Response) => {
  try {
    const workerId = req.user?.userId;

    // ✅ Auth check
    if (!workerId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // ✅ Extract body fields
    const { owner_name, owner_phone, car_number, car_model, car_type, car_color } = req.body;

    // ✅ Required validation
    if (!owner_name || !owner_phone || !car_number || !car_model || !car_type || !car_color) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // ✅ Multer-S3 file typing
    const file = req.file as Express.MulterS3.File | undefined;

    // ✅ Create Task
    const task = await createTaskService({
      owner_name,
      owner_phone,
      car_number,
      car_model,
      car_type,
      car_color,
      car_image_url: file?.location ?? null,
      car_image_key: file?.key ?? null,
      worker_id: workerId,
    });

    return res.status(201).json({ success: true, data: task });
  } catch (err) {
    // ✅ FIX: use err so eslint won't warn + helps debugging
    logger.error('createTaskController failed', { err });

    return res.status(500).json({ success: false, message: 'Failed to create task' });
  }
};
