"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const vehicles_controller_1 = require("./vehicles_controller");
const pricing_controller_1 = require("./pricing_controller");
const authMiddleware_1 = require("../../middlewares/authMiddleware");
const roleMiddleware_1 = require("../../middlewares/roleMiddleware");
const router = (0, express_1.Router)();
/* ADMIN ONLY */
router.post('/', authMiddleware_1.protect, (0, roleMiddleware_1.allowRoles)('admin'), vehicles_controller_1.createVehicle);
router.get('/', authMiddleware_1.protect, vehicles_controller_1.getVehicles);
router.get('/:type/pricing', authMiddleware_1.protect, pricing_controller_1.getVehiclePricingByType); // Get pricing by type
router.get('/:id', authMiddleware_1.protect, vehicles_controller_1.getVehicleById);
router.put('/:id', authMiddleware_1.protect, (0, roleMiddleware_1.allowRoles)('admin'), vehicles_controller_1.updateVehicle);
router.delete('/:id', authMiddleware_1.protect, (0, roleMiddleware_1.allowRoles)('admin'), vehicles_controller_1.deleteVehicle);
exports.default = router;
