import { RequestHandler } from 'express';
import {
  createFloorService,
  deleteFloorService,
  getFloorsByBuildingService,
  updateFloorService,
} from './floor_Service';

// ── GET /api/buildings/:id/floors ─────────────────────────────────────────────

export const getFloorsByBuilding: RequestHandler = async (req, res, next) => {
  try {
    const floors = await getFloorsByBuildingService(req.params['id'] as string);
    res.status(200).json({ success: true, data: floors });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/buildings/:id/floors ────────────────────────────────────────────

export const createFloor: RequestHandler = async (req, res, next) => {
  try {
    const { floor_number, floor_name, notes } = req.body as {
      floor_number: number;
      floor_name: string;
      notes?: string;
    };

    if (!floor_number) {
      res.status(400).json({ success: false, message: 'floor_number is required' });
      return;
    }
    if (!floor_name?.trim()) {
      res.status(400).json({ success: false, message: 'floor_name is required' });
      return;
    }

    const floor = await createFloorService(req.params['id'] as string, {
      floor_number: Number(floor_number),
      floor_name: floor_name.trim(),
      notes,
    });

    res.status(201).json({
      success: true,
      message: 'Floor added successfully',
      data: floor,
    });
  } catch (err) {
    next(err);
  }
};

// ── PUT /api/buildings/:id/floors/:floorId ────────────────────────────────────

export const updateFloor: RequestHandler = async (req, res, next) => {
  try {
    const { floor_number, floor_name, notes } = req.body as {
      floor_number?: number;
      floor_name?: string;
      notes?: string;
    };

    const floor = await updateFloorService(
      req.params['id'] as string,
      req.params['floorId'] as string,
      {
        floor_number: floor_number !== undefined ? Number(floor_number) : undefined,
        floor_name: floor_name?.trim(),
        notes,
      }
    );

    res.status(200).json({
      success: true,
      message: 'Floor updated successfully',
      data: floor,
    });
  } catch (err) {
    next(err);
  }
};

// ── DELETE /api/buildings/:id/floors/:floorId ─────────────────────────────────

export const deleteFloor: RequestHandler = async (req, res, next) => {
  try {
    await deleteFloorService(req.params['id'] as string, req.params['floorId'] as string);
    res.status(200).json({ success: true, message: 'Floor deleted successfully' });
  } catch (err) {
    next(err);
  }
};
