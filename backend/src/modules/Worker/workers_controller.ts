import { Response } from 'express';
import { AuthRequest } from '../../middlewares/authMiddleware';
import { pool } from '../../database/connectDatabase';
import { getCleanerFullDetailsService } from './worker_service';
import { RequestHandler } from 'express';
import {
  getAllCleanersService,
  getCleanerByIdService,
  updateCleanerService,
  toggleCleanerActiveService,
  deleteCleanerService,
  getFloorsByBuildingIdService,
  getSupervisorsByBuildingIdService,
} from './worker_service';
import { getAllBuildingsService } from '../buildings/buildings_service';
import { logger } from 'src/config/logger';

export const getWorkerDashboard = async (req: AuthRequest, res: Response) => {
  try {
    const workerId = req.user?.userId;

    const worker = await pool.query(`SELECT id, full_name FROM users WHERE id=$1`, [workerId]);

    const jobsDone = await pool.query(
      `SELECT COUNT(*) FROM tasks WHERE worker_id=$1 AND status='completed'`,
      [workerId]
    );

    const wallet = await pool.query(`SELECT balance FROM wallets WHERE worker_id=$1`, [workerId]);

    res.json({
      name: worker.rows[0].full_name,
      empId: worker.rows[0].id,
      jobsDone: Number(jobsDone.rows[0].count),
      totalRevenue: wallet.rows[0]?.balance || 0,
    });
  } catch {
    res.status(500).json({ message: 'Dashboard failed' });
  }
};

export const getCleanerFullDetailsController: RequestHandler = async (req, res) => {
  try {
    const param = req.params.cleanerId;

    if (!param || Array.isArray(param)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid cleaner ID',
      });
    }

    const cleanerId: string = param;

    if (!cleanerId) {
      return res.status(400).json({
        success: false,
        message: 'Cleaner ID is required',
      });
    }

    const { date } = req.query;

    const data = await getCleanerFullDetailsService(pool, cleanerId, {
      date: typeof date === 'string' ? date : undefined,
    });

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const getAllCleaners: RequestHandler = async (_req, res, next) => {
  try {
    const data = await getAllCleanersService();
    res.json({ success: true, count: data.length, data });
  } catch (err) {
    logger.error('getAllCleaners', err);
    next(err);
  }
};

export const getCleanerById: RequestHandler = async (req, res, next) => {
  try {
    const id = req.params['id'] as string;
    const date = (req.query as { date?: string }).date;
    const data = await getCleanerByIdService(id, date);
    if (!data) {
      res.status(404).json({ success: false, message: 'Cleaner not found' });
      return;
    }
    res.json({ success: true, data });
  } catch (err) {
    logger.error('getCleanerById', err);
    next(err);
  }
};

export const updateCleaner: RequestHandler = async (req, res, next) => {
  try {
    const id = req.params['id'] as string;
    const updated = await updateCleanerService(id, req.body);
    if (!updated) {
      res.status(404).json({ success: false, message: 'Cleaner not found' });
      return;
    }
    res.json({ success: true, message: 'Cleaner updated successfully', data: updated });
  } catch (err) {
    logger.error('updateCleaner', err);
    next(err);
  }
};

export const toggleCleanerStatus: RequestHandler = async (req, res, next) => {
  try {
    const id = req.params['id'] as string;
    const body = req.body as { is_active?: unknown };
    if (typeof body.is_active !== 'boolean') {
      res.status(400).json({ success: false, message: 'is_active (boolean) required' });
      return;
    }
    const r = await toggleCleanerActiveService(id, body.is_active);
    if (!r) {
      res.status(404).json({ success: false, message: 'Cleaner not found' });
      return;
    }
    res.json({
      success: true,
      message: `Cleaner ${r.is_active ? 'activated' : 'deactivated'}`,
      data: r,
    });
  } catch (err) {
    logger.error('toggleCleanerStatus', err);
    next(err);
  }
};

export const deleteCleaner: RequestHandler = async (req, res, next) => {
  try {
    const id = req.params['id'] as string;
    const r = await deleteCleanerService(id);
    if (!r) {
      res.status(404).json({ success: false, message: 'Cleaner not found' });
      return;
    }
    res.json({ success: true, message: 'Cleaner deleted successfully' });
  } catch (err) {
    logger.error('deleteCleaner', err);
    next(err);
  }
};

export const getBuildingsDropdown: RequestHandler = async (_req, res, next) => {
  try {
    const data = await getAllBuildingsService();
    res.json({ success: true, data });
  } catch (err) {
    logger.error('getBuildingsDropdown', err);
    next(err);
  }
};

export const getFloorsForBuilding: RequestHandler = async (req, res, next) => {
  try {
    const data = await getFloorsByBuildingIdService(req.params['buildingId'] as string);
    res.json({ success: true, data });
  } catch (err) {
    logger.error('getFloorsForBuilding', err);
    next(err);
  }
};

export const getSupervisorsForBuilding: RequestHandler = async (req, res, next) => {
  try {
    const data = await getSupervisorsByBuildingIdService(req.params['buildingId'] as string);
    res.json({ success: true, data });
  } catch (err) {
    logger.error('getSupervisorsForBuilding', err);
    next(err);
  }
};
