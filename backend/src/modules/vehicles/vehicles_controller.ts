import { Response } from 'express';
import { logger } from '../../config/logger';
import { AuthRequest } from 'src/middlewares/authMiddleware';
import { createVehicleService, getAllVehiclesService } from './vehicles_service';

export const vehicleDetails = async (req: AuthRequest, res: Response) => {
  try {
    const { type, brand, model, price_min, price_max } = req.body;

    if (!type || !brand || !model || !price_min || !price_max) {
      return res.status(400).json({
        success: false,
        message: 'All vehicle fields are required',
      });
    }

    if (price_min >= price_max) {
      return res.status(400).json({
        success: false,
        message: 'price_min must be less than price_max',
      });
    }

    const vehicle = await createVehicleService({
      type,
      brand,
      model,
      price_min,
      price_max,
      created_by: req.user!.userId,
    });

    logger.info('Vehicle added', {
      vehicleId: vehicle.id,
      createdBy: req.user!.userId,
    });

    return res.status(201).json({
      success: true,
      message: 'Vehicle added successfully',
      data: vehicle,
    });
  } catch (err) {
    logger.error('Failed to add vehicle', { err });

    return res.status(500).json({
      success: false,
      message: 'Failed to add vehicle',
    });
  }
};

export const getVehicleDetails = async (_req: AuthRequest, res: Response) => {
  try {
    const vehicles = await getAllVehiclesService();

    return res.status(200).json({
      success: true,
      data: vehicles,
    });
  } catch (err) {
    logger.error('Failed to fetch vehicles', { err });

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch vehicle details',
    });
  }
};
