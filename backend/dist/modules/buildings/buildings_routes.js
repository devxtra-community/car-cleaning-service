"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// building.routes.ts
const express_1 = require("express");
const buildings_controller_1 = require("./buildings_controller");
const authMiddleware_1 = require("src/middlewares/authMiddleware");
const roleMiddleware_1 = require("src/middlewares/roleMiddleware");
const router = (0, express_1.Router)();
router.post('/', authMiddleware_1.protect, (0, roleMiddleware_1.allowRoles)('admin', 'super_admin'), buildings_controller_1.createBuilding);
router.get('/', authMiddleware_1.protect, (0, roleMiddleware_1.allowRoles)('admin', 'super_admin'), buildings_controller_1.getAllBuildings);
router.get('/:id', authMiddleware_1.protect, (0, roleMiddleware_1.allowRoles)('admin', 'super_admin'), buildings_controller_1.getBuildingById);
router.delete('/:id', authMiddleware_1.protect, (0, roleMiddleware_1.allowRoles)('admin', 'super_admin'), buildings_controller_1.deleteBuilding);
exports.default = router;
