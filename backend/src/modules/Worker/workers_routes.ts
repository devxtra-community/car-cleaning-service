import express from 'express';
import { protect } from '../../middlewares/authMiddleware';
import {
    getWorkerDashboard,
    getWorkerWalletStats,
    getWorkerTaskLogs,
    getCleanerFullDetailsController,
} from './workers_controller';
import {
    assignVehicleController,
    unassignVehicleController,
    getAssignedVehiclesController,
    getMyAssignedVehiclesController
} from './assignment_controller';
import { allowRoles } from '../../middlewares/roleMiddleware';

const router = express.Router();

// Worker App Endpoints
router.get('/dashboard', protect, getWorkerDashboard);
router.get('/wallet', protect, getWorkerWalletStats);
router.get('/task-logs', protect, getWorkerTaskLogs);
router.get('/my-vehicles', protect, getMyAssignedVehiclesController);

// Admin Portal Endpoints
router.get('/cleaners/:cleanerId', protect, allowRoles('admin'), getCleanerFullDetailsController);
router.post('/assignments/vehicle', protect, allowRoles('admin'), assignVehicleController);
router.delete('/assignments/vehicle/:id', protect, allowRoles('admin'), unassignVehicleController);
router.get('/assignments/vehicle/:cleanerId', protect, allowRoles('admin'), getAssignedVehiclesController);

export default router;
