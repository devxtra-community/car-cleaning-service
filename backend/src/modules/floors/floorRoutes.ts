import express from 'express';
import { getFloorsByBuilding, getAllFloors } from './floor_controller';
// Import your auth middleware if needed
// import { authenticate } from '../middleware/auth';

const router = express.Router();

// Get floors by building ID
// Route: GET /api/buildings/:buildingId/floors
router.get('/buildings/:buildingId/floors', getFloorsByBuilding);

// Alternative: Get all floors with optional filter
// Route: GET /api/floors?building_id=xxx
router.get('/floors', getAllFloors);

export default router;

// ============================================
// DON'T FORGET TO ADD THIS TO YOUR MAIN APP
// ============================================
/*
In your main app.ts or server.ts file:

import floorsRoutes from './routes/floorsRoutes';

app.use('/api', floorsRoutes);
*/
