import { Request, Response } from 'express';
import * as floorsService from './floors_service';
import { logger } from '../../config/logger';

export const getFloors = async (req: Request, res: Response) => {
  try {
    const { buildingId } = req.params as { buildingId: string };
    const floors = await floorsService.getFloorsByBuilding(buildingId);
    res.status(200).json({ success: true, data: floors });
  } catch (error) {
    logger.error('Failed to get floors', { error });
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const addFloor = async (req: Request, res: Response) => {
  try {
    const { building_id, floor_name } = req.body as { building_id: string; floor_name: string };
    if (!building_id || !floor_name) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    const floor = await floorsService.createFloor(building_id, floor_name);
    res.status(201).json({ success: true, data: floor });
  } catch (error) {
    logger.error('Failed to add floor', { error });
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const editFloor = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const { floor_name } = req.body as { floor_name: string };
    const floor = await floorsService.updateFloor(id, floor_name);
    if (!floor) {
      return res.status(404).json({ success: false, message: 'Floor not found' });
    }
    res.status(200).json({ success: true, data: floor });
  } catch (error) {
    logger.error('Failed to edit floor', { error });
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const removeFloor = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const floor = await floorsService.deleteFloor(id);
    if (!floor) {
      return res.status(404).json({ success: false, message: 'Floor not found' });
    }
    res.status(200).json({ success: true, data: floor });
  } catch (error) {
    logger.error('Failed to remove floor', { error });
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
