"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../../middlewares/authMiddleware");
const workers_controller_1 = require("./workers_controller");
const roleMiddleware_1 = require("../../middlewares/roleMiddleware");
const router = express_1.default.Router();
router.get('/dashboard', authMiddleware_1.protect, workers_controller_1.getWorkerDashboard);
router.get('/wallet', authMiddleware_1.protect, workers_controller_1.getWorkerWalletStats);
router.get('/task-logs', authMiddleware_1.protect, workers_controller_1.getWorkerTaskLogs);
router.get('/cleaners/:cleanerId', authMiddleware_1.protect, (0, roleMiddleware_1.allowRoles)('admin'), workers_controller_1.getCleanerFullDetailsController);
exports.default = router;
