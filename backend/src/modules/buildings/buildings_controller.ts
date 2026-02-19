import { Request, Response } from 'express';
import * as buildingService from './buildings_service';

export const createBuilding = async (req: Request, res: Response) => {
  try {
    const { building_name, latitude, longitude, radius, floors } = req.body;

    if (!building_name) {
      return res.status(400).json({
        success: false,
        message: 'Building name is required',
      });
    }

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Building GPS location is required',
      });
    }

    if (!floors || !Array.isArray(floors) || floors.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one floor is required',
      });
    }

    const building = await buildingService.createBuilding({
      building_name,
      latitude,
      longitude,
      radius,
      floors,
    });

    return res.status(201).json({
      success: true,
      message: 'Building and floors created successfully',
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

// Get all buildings with their floors
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

// Get building by ID with floors
export const getBuildingById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const building = await buildingService.getBuildingById(id as string);

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

// Delete building (cascades to floors in database)
export const deleteBuilding = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const building = await buildingService.deleteBuilding(id as string);

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
