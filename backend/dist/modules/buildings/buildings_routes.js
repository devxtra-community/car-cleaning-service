"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// building.routes.ts
const express_1 = require("express");
const buildings_controller_1 = require("./buildings_controller");
const authMiddleware_1 = require("src/middlewares/authMiddleware");
const roleMiddleware_1 = require("src/middlewares/roleMiddleware");
const router = (0, express_1.Router)();
// Get all buildings with statistics (NEW - for main page with revenue)
router.get('/stats', authMiddleware_1.protect, (0, roleMiddleware_1.allowRoles)('admin', 'super_admin'), buildings_controller_1.getAllBuildingsWithStats);
// Create building
router.post('/', authMiddleware_1.protect, (0, roleMiddleware_1.allowRoles)('admin', 'super_admin'), buildings_controller_1.createBuilding);
// Get all buildings (existing - simple version)
router.get('/', authMiddleware_1.protect, (0, roleMiddleware_1.allowRoles)('admin', 'super_admin'), buildings_controller_1.getAllBuildings);
// Get building details with comprehensive statistics (NEW - for details page)
router.get('/:id/details', authMiddleware_1.protect, (0, roleMiddleware_1.allowRoles)('admin', 'super_admin'), buildings_controller_1.getBuildingDetails);
// Get building by ID (existing)
router.get('/:id', authMiddleware_1.protect, (0, roleMiddleware_1.allowRoles)('admin', 'super_admin'), buildings_controller_1.getBuildingById);
// Update building (NEW)
router.put('/:id', authMiddleware_1.protect, (0, roleMiddleware_1.allowRoles)('admin', 'super_admin'), buildings_controller_1.updateBuilding);
// Delete building (existing)
router.delete('/:id', authMiddleware_1.protect, (0, roleMiddleware_1.allowRoles)('admin', 'super_admin'), buildings_controller_1.deleteBuilding);
exports.default = router;
