import { Response } from 'express';
import { AuthRequest } from '../../middlewares/authMiddleware';
import { pool } from '../../database/connectDatabase';
import {
  assignVehicleService,
  unassignVehicleService,
  getAssignedVehiclesService,
} from './worker_service';
import { AppError } from '../../middlewares/error-handler';

export const assignVehicleController = async (req: AuthRequest, res: Response) => {
  try {
    const { cleaner_id, car_number, car_model, car_type, car_color, owner_name, owner_phone } =
      req.body;

    if (!cleaner_id || !car_number || !car_model || !car_type) {
      throw new AppError('Missing required vehicle fields', 400, 'MISSING_FIELDS');
    }

    const assignment = await assignVehicleService(pool, cleaner_id, {
      car_number,
      car_model,
      car_type,
      car_color,
      owner_name,
      owner_phone,
    });

    return res.status(201).json({
      success: true,
      message: 'Vehicle assigned successfully',
      data: assignment,
    });
  } catch (err) {
    console.error('ASSIGN VEHICLE ERROR:', err);
    return res.status(500).json({ success: false, message: 'Failed to assign vehicle' });
  }
};

export const unassignVehicleController = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      throw new AppError('Assignment ID is required', 400, 'ID_REQUIRED');
    }

    const assignment = await unassignVehicleService(pool, id as string);

    return res.status(200).json({
      success: true,
      message: 'Vehicle unassigned successfully',
      data: assignment,
    });
  } catch (err) {
    console.error('UNASSIGN VEHICLE ERROR:', err);
    return res.status(500).json({ success: false, message: 'Failed to unassign vehicle' });
  }
};

export const getAssignedVehiclesController = async (req: AuthRequest, res: Response) => {
  try {
    const { cleanerId } = req.params;

    if (!cleanerId) {
      throw new AppError('Cleaner ID is required', 400, 'CLEANER_ID_REQUIRED');
    }

    const vehicles = await getAssignedVehiclesService(pool, cleanerId as string);

    return res.status(200).json({
      success: true,
      data: vehicles,
    });
  } catch (err) {
    console.error('GET ASSIGNED VEHICLES ERROR:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch assigned vehicles' });
  }
};

export const getMyAssignedVehiclesController = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    }

    // Get cleaner_id from user_id
    const cleanerRes = await pool.query('SELECT id FROM cleaners WHERE user_id = $1', [userId]);

    if (!cleanerRes.rows.length) {
      return res.status(200).json({ success: true, data: [] });
    }

    const cleanerId = cleanerRes.rows[0].id;
    const vehicles = await getAssignedVehiclesService(pool, cleanerId);

    return res.status(200).json({
      success: true,
      data: vehicles,
    });
  } catch (err) {
    console.error('GET MY ASSIGNED VEHICLES ERROR:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch assigned vehicles' });
  }
};
