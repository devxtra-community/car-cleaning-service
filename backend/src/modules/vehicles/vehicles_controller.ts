import { Response } from 'express';
import { AuthRequest } from '../../middlewares/authMiddleware';
import {
  createVehicleService,
  getAllVehiclesService,
  getVehicleByIdService,
  updateVehicleService,
  deleteVehicleService,
} from './vehicles_service';

/* CREATE */

export const createVehicle = async (req: AuthRequest, res: Response) => {
  try {
    const { type, brand, model, base_price } = req.body;

    const vehicle = await createVehicleService({
      type,
      brand,
      model,
      base_price,
      created_by: req.user?.userId || '',
    });

    res.status(201).json(vehicle);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Create vehicle failed' });
  }
};

/* GET ALL */

export const getVehicles = async (_req: AuthRequest, res: Response) => {
  try {
    const vehicles = await getAllVehiclesService();
    res.json(vehicles);
  } catch {
    res.status(500).json({ message: 'Fetch failed' });
  }
};

/* GET ONE */

export const getVehicleById = async (req: AuthRequest, res: Response) => {
  try {
    const vehicle = await getVehicleByIdService(req.params.id as string);
    res.json(vehicle);
  } catch {
    res.status(500).json({ message: 'Fetch failed' });
  }
};

/* UPDATE */

export const updateVehicle = async (req: AuthRequest, res: Response) => {
  try {
    const vehicle = await updateVehicleService(req.params.id as string, req.body);
    res.json(vehicle);
  } catch {
    res.status(500).json({ message: 'Update failed' });
  }
};

/* DELETE */

export const deleteVehicle = async (req: AuthRequest, res: Response) => {
  try {
    await deleteVehicleService(req.params.id as string);
    res.json({ success: true });
  } catch {
    res.status(500).json({ message: 'Delete failed' });
  }
};
