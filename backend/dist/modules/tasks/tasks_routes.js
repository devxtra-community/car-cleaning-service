"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../../middlewares/authMiddleware");
const roleMiddleware_1 = require("../../middlewares/roleMiddleware");
const tasks_controller_1 = require("./tasks_controller");
const router = express_1.default.Router();
router.post('/', authMiddleware_1.protect, (0, roleMiddleware_1.allowRoles)('worker', 'admin', 'cleaner', 'super_admin'), tasks_controller_1.createTaskController);
router.get('/my', authMiddleware_1.protect, (0, roleMiddleware_1.allowRoles)('worker', 'cleaner', 'admin', 'super_admin'), tasks_controller_1.GetTaskpending);
router.patch('/:id/complete', authMiddleware_1.protect, (0, roleMiddleware_1.allowRoles)('worker', 'cleaner', 'admin', 'super_admin'), tasks_controller_1.completeTaskController);
exports.default = router;
