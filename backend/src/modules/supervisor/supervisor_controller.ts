import { RequestHandler } from 'express';
import {
  getAllSupervisorsService,
  getUnassignedSupervisorsService,
  getSupervisorDetailsService,
  updateSupervisorService,
  toggleSupervisorStatusService,
  deleteSupervisorService,
  getAvailableCleanersService,
  assignCleanerToSupervisorService,
  removeCleanerFromSupervisorService,
} from './supervisor_services';
import { getAllBuildingsService } from '../buildings/buildings_service';
import { logger } from 'src/config/logger';

// ── GET /api/supervisors ───────────────────────────────────────────────────────

export const getAllSupervisors: RequestHandler = async (_req, res, next) => {
  try {
    const data = await getAllSupervisorsService();
    res.status(200).json({ success: true, data });
  } catch (err) {
    logger.error('getAllSupervisors error', err);
    next(err);
  }
};

// ── GET /api/supervisors/unassigned ───────────────────────────────────────────

export const getUnassignedSupervisors: RequestHandler = async (_req, res, next) => {
  try {
    const data = await getUnassignedSupervisorsService();
    res.status(200).json({ success: true, data });
  } catch (err) {
    logger.error('getUnassignedSupervisors error', err);
    next(err);
  }
};

// ── GET /api/supervisors/buildings ────────────────────────────────────────────
// Simple building list for the edit modal dropdown

export const getBuildingsForDropdown: RequestHandler = async (_req, res, next) => {
  try {
    const data = await getAllBuildingsService();
    res.status(200).json({ success: true, data });
  } catch (err) {
    logger.error('getBuildingsForDropdown error', err);
    next(err);
  }
};

// ── GET /api/supervisors/:id ──────────────────────────────────────────────────

export const getSupervisorById: RequestHandler = async (req, res, next) => {
  try {
    const data = await getSupervisorDetailsService(req.params['id'] as string);
    if (!data) {
      res.status(404).json({ success: false, message: 'Supervisor not found' });
      return;
    }
    res.status(200).json({ success: true, data });
  } catch (err) {
    logger.error('getSupervisorById error', err);
    next(err);
  }
};

// ── PUT /api/supervisors/:id ──────────────────────────────────────────────────

export const updateSupervisor: RequestHandler = async (req, res, next) => {
  try {
    const updated = await updateSupervisorService(req.params['id'] as string, req.body);
    if (!updated) {
      res.status(404).json({ success: false, message: 'Supervisor not found' });
      return;
    }
    res.status(200).json({
      success: true,
      message: 'Supervisor updated successfully',
      data: updated,
    });
  } catch (err) {
    logger.error('updateSupervisor error', err);
    next(err);
  }
};

// ── PATCH /api/supervisors/:id/toggle-status ──────────────────────────────────
// Sets is_active. Auth service checks this flag on login and returns 403 if false.

export const toggleSupervisorStatus: RequestHandler = async (req, res, next) => {
  try {
    const body = req.body as { is_active?: unknown };
    if (typeof body.is_active !== 'boolean') {
      res.status(400).json({ success: false, message: 'is_active (boolean) is required' });
      return;
    }
    const result = await toggleSupervisorStatusService(req.params['id'] as string, body.is_active);
    if (!result) {
      res.status(404).json({ success: false, message: 'Supervisor not found' });
      return;
    }
    res.status(200).json({
      success: true,
      message: `Supervisor ${result.is_active ? 'activated' : 'deactivated'} successfully`,
      data: result,
    });
  } catch (err) {
    logger.error('toggleSupervisorStatus error', err);
    next(err);
  }
};

// ── DELETE /api/supervisors/:id ───────────────────────────────────────────────

export const deleteSupervisor: RequestHandler = async (req, res, next) => {
  try {
    const result = await deleteSupervisorService(req.params['id'] as string);
    if (!result) {
      res.status(404).json({ success: false, message: 'Supervisor not found' });
      return;
    }
    res.status(200).json({ success: true, message: 'Supervisor deleted successfully' });
  } catch (err) {
    logger.error('deleteSupervisor error', err);
    next(err);
  }
};

// ── GET /api/supervisors/:id/available-cleaners ───────────────────────────────

export const getAvailableCleaners: RequestHandler = async (_req, res, next) => {
  try {
    const data = await getAvailableCleanersService();
    res.status(200).json({ success: true, data });
  } catch (err) {
    logger.error('getAvailableCleaners error', err);
    next(err);
  }
};

// ── POST /api/supervisors/:id/assign-cleaner ──────────────────────────────────

export const assignCleanerToSupervisor: RequestHandler = async (req, res, next) => {
  try {
    const body = req.body as { cleanerId?: unknown };
    if (typeof body.cleanerId !== 'string' || !body.cleanerId) {
      res.status(400).json({ success: false, message: 'cleanerId is required' });
      return;
    }
    const data = await assignCleanerToSupervisorService(req.params['id'] as string, body.cleanerId);
    res.status(200).json({
      success: true,
      message: 'Cleaner assigned successfully',
      data,
    });
  } catch (err) {
    logger.error('assignCleanerToSupervisor error', err);
    next(err);
  }
};

// ── DELETE /api/supervisors/:id/cleaners/:cleanerId ───────────────────────────

export const removeCleanerFromSupervisor: RequestHandler = async (req, res, next) => {
  try {
    await removeCleanerFromSupervisorService(
      req.params['id'] as string,
      req.params['cleanerId'] as string
    );
    res.status(200).json({ success: true, message: 'Cleaner removed from supervisor' });
  } catch (err) {
    logger.error('removeCleanerFromSupervisor error', err);
    next(err);
  }
};
