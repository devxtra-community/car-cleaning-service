"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const floor_controller_1 = require("./floor_controller");
// Import your auth middleware if needed
// import { authenticate } from '../middleware/auth';
const router = express_1.default.Router();
// Get floors by building ID
// Route: GET /api/buildings/:buildingId/floors
router.get('/buildings/:buildingId/floors', floor_controller_1.getFloorsByBuilding);
// Alternative: Get all floors with optional filter
// Route: GET /api/floors?building_id=xxx
router.get('/floors', floor_controller_1.getAllFloors);
exports.default = router;
// ============================================
// DON'T FORGET TO ADD THIS TO YOUR MAIN APP
// ============================================
/*
In your main app.ts or server.ts file:

import floorsRoutes from './routes/floorsRoutes';

app.use('/api', floorsRoutes);
*/
