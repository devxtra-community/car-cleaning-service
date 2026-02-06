import { Router } from 'express';
import * as buildingController from './buildings_controller';
import { protect } from '../../middlewares/authMiddleware';

const router = Router();

// All routes require authentication
router.use(protect);

// GET all buildings
router.get('/', buildingController.getAllBuildings);

// GET single building by ID
router.get('/:id', buildingController.getBuildingById);

// CREATE new building
router.post('/', buildingController.createBuilding);

// UPDATE building
router.put('/:id', buildingController.updateBuilding);

// DELETE building
router.delete('/:id', buildingController.deleteBuilding);

export default router;
