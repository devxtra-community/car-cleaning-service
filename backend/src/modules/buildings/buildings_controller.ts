import { Request, Response } from 'express';
import * as buildingService from './buildings_service';

export const getAllBuildings = async (req: Request, res: Response) => {
  try {
    const buildings = await buildingService.getAllBuildings();
    return res.status(200).json({
      success: true,
      data: buildings,
    });
  } catch (error) {
    console.error('Error fetching buildings:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch buildings',
    });
  }
};

export const getBuildingById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const building = await buildingService.getBuildingById(id);

    if (!building) {
      return res.status(404).json({
        success: false,
        message: 'Building not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: building,
    });
  } catch (error) {
    console.error('Error fetching building:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch building',
    });
  }
};

export const createBuilding = async (req: Request, res: Response) => {
  try {
    const { building_id, building_name, location } = req.body;

    if (!building_id) {
      return res.status(400).json({
        success: false,
        message: 'Building ID is required',
      });
    }

    if (!building_name) {
      return res.status(400).json({
        success: false,
        message: 'Building name is required',
      });
    }

    const building = await buildingService.createBuilding({
      building_id,
      building_name,
      location,
    });

    return res.status(201).json({
      success: true,
      message: 'Building created successfully',
      data: building,
    });
  } catch (error) {
    console.error('Error creating building:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create building',
    });
  }
};

export const updateBuilding = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const { building_id, building_name, location } = req.body;

    const building = await buildingService.updateBuilding(id, {
      building_id,
      building_name,
      location,
    });

    if (!building) {
      return res.status(404).json({
        success: false,
        message: 'Building not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Building updated successfully',
      data: building,
    });
  } catch (error) {
    console.error('Error updating building:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update building',
    });
  }
};

export const deleteBuilding = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const building = await buildingService.deleteBuilding(id);

    if (!building) {
      return res.status(404).json({
        success: false,
        message: 'Building not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Building deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting building:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete building',
    });
  }
};
