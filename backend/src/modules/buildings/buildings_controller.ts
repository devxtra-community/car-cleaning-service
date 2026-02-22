import { RequestHandler } from 'express';
import {
  createBuildingService,
  getAllBuildingsWithStatsService,
  getAllBuildingsService,
  getBuildingByIdService,
  getBuildingDetailsService,
  getFloorsByBuildingService,
  getSupervisorsByBuildingService,
  updateBuildingService,
  assignSupervisorToBuildingService,
  removeSupervisorFromBuildingService,
  toggleSupervisorActiveService,
  deleteBuildingService,
  getUnassignedSupervisorsService,
} from './buildings_service';

// ── POST /api/buildings ────────────────────────────────────────────────────────

export const createBuilding: RequestHandler = async (req, res, next) => {
  try {
    const { building_name, location, latitude, longitude, radius, floors } = req.body;

    if (!building_name) {
      res.status(400).json({ success: false, message: 'Building name is required' });
      return;
    }
    if (!latitude || !longitude) {
      res.status(400).json({ success: false, message: 'Latitude and longitude are required' });
      return;
    }

    const building = await createBuildingService({
      building_name,
      location,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      radius: radius ? parseInt(radius) : 100,
      floors,
    });

    res.status(201).json({
      success: true,
      message: 'Building created successfully',
      data: building,
    });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/buildings/stats ───────────────────────────────────────────────────

export const getAllBuildingsWithStats: RequestHandler = async (_req, res, next) => {
  try {
    const buildings = await getAllBuildingsWithStatsService();
    res.status(200).json({ success: true, data: buildings });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/buildings ─────────────────────────────────────────────────────────

export const getAllBuildings: RequestHandler = async (_req, res, next) => {
  try {
    const buildings = await getAllBuildingsService();
    res.status(200).json({ success: true, data: buildings });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/buildings/:id ─────────────────────────────────────────────────────

export const getBuildingById: RequestHandler = async (req, res, next) => {
  try {
    const building = await getBuildingByIdService(req.params['id'] as string);
    res.status(200).json({ success: true, data: building });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/buildings/:id/details ────────────────────────────────────────────

export const getBuildingDetails: RequestHandler = async (req, res, next) => {
  try {
    const building = await getBuildingDetailsService(req.params['id'] as string);
    res.status(200).json({ success: true, data: building });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/buildings/:id/floors ─────────────────────────────────────────────

export const getFloorsByBuilding: RequestHandler = async (req, res, next) => {
  try {
    const floors = await getFloorsByBuildingService(req.params['id'] as string);
    res.status(200).json({ success: true, data: floors });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/buildings/:id/supervisors ────────────────────────────────────────

export const getSupervisorsByBuilding: RequestHandler = async (req, res, next) => {
  try {
    const supervisors = await getSupervisorsByBuildingService(req.params['id'] as string);
    res.status(200).json({ success: true, data: supervisors });
  } catch (err) {
    next(err);
  }
};

// ── PUT /api/buildings/:id ─────────────────────────────────────────────────────

export const updateBuilding: RequestHandler = async (req, res, next) => {
  try {
    const { building_name, location, latitude, longitude, radius } = req.body;
    const building = await updateBuildingService(req.params['id'] as string, {
      building_name,
      location,
      latitude: latitude !== undefined ? parseFloat(latitude) : undefined,
      longitude: longitude !== undefined ? parseFloat(longitude) : undefined,
      radius: radius !== undefined ? parseInt(radius) : undefined,
    });
    res.status(200).json({
      success: true,
      message: 'Building updated successfully',
      data: building,
    });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/buildings/:id/supervisors ───────────────────────────────────────

export const assignSupervisorToBuilding: RequestHandler = async (req, res, next) => {
  try {
    const { supervisorId } = req.body as { supervisorId: string };
    if (!supervisorId) {
      res.status(400).json({ success: false, message: 'supervisorId is required' });
      return;
    }
    const supervisor = await assignSupervisorToBuildingService(
      req.params['id'] as string,
      supervisorId
    );
    res.status(200).json({
      success: true,
      message: 'Supervisor assigned to building successfully',
      data: supervisor,
    });
  } catch (err) {
    next(err);
  }
};

// ── DELETE /api/buildings/:id/supervisors/:supervisorId ───────────────────────

export const removeSupervisorFromBuilding: RequestHandler = async (req, res, next) => {
  try {
    const supervisor = await removeSupervisorFromBuildingService(
      req.params['id'] as string,
      req.params['supervisorId'] as string
    );
    res.status(200).json({
      success: true,
      message: 'Supervisor removed from building',
      data: supervisor,
    });
  } catch (err) {
    next(err);
  }
};

// ── PATCH /api/buildings/:id/supervisors/:supervisorId/toggle ─────────────────

export const toggleSupervisorActive: RequestHandler = async (req, res, next) => {
  try {
    const supervisor = await toggleSupervisorActiveService(
      req.params['id'] as string,
      req.params['supervisorId'] as string
    );
    res.status(200).json({
      success: true,
      message: `Supervisor ${supervisor.is_active ? 'activated' : 'deactivated'} successfully`,
      data: supervisor,
    });
  } catch (err) {
    next(err);
  }
};

// ── DELETE /api/buildings/:id ─────────────────────────────────────────────────

export const deleteBuilding: RequestHandler = async (req, res, next) => {
  try {
    await deleteBuildingService(req.params['id'] as string);
    res.status(200).json({ success: true, message: 'Building deleted successfully' });
  } catch (err) {
    next(err);
  }
};
export const getUnassignedSupervisors: RequestHandler = async (_req, res, next) => {
  try {
    const supervisors = await getUnassignedSupervisorsService();
    res.status(200).json({ success: true, data: supervisors });
  } catch (err) {
    next(err);
  }
};
