"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../../middlewares/authMiddleware");
const roleMiddleware_1 = require("../../middlewares/roleMiddleware");
const supervisor_controller_1 = require("./supervisor_controller");
const router = express_1.default.Router();
router.get('/supervisor/workers', authMiddleware_1.protect, (0, roleMiddleware_1.allowRoles)('supervisor'), supervisor_controller_1.getSupervisorWorkers);
router.get('/supervisor/report', authMiddleware_1.protect, (0, roleMiddleware_1.allowRoles)('supervisor'), supervisor_controller_1.supervisorReport);
exports.default = router;
