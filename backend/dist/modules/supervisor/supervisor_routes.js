"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../../middlewares/authMiddleware");
const roleMiddleware_1 = require("../../middlewares/roleMiddleware");
const supervisor_controller_1 = require("./supervisor_controller");
const penalties_controller_1 = require("../penalties/penalties_controller");
const router = express_1.default.Router();
// ── Supervisor-role routes ────────────────────────────────────────────────────
router.get('/workers', authMiddleware_1.protect, (0, roleMiddleware_1.allowRoles)('supervisor', 'super_admin'), supervisor_controller_1.getSupervisorWorkers);
router.get('/workers/live', authMiddleware_1.protect, (0, roleMiddleware_1.allowRoles)('supervisor', 'super_admin'), supervisor_controller_1.getLiveWorkers);
router.get('/workers/attendance', authMiddleware_1.protect, (0, roleMiddleware_1.allowRoles)('supervisor'), supervisor_controller_1.getCleanersAttendance);
router.post('/workers/assignment', authMiddleware_1.protect, (0, roleMiddleware_1.allowRoles)('supervisor'), supervisor_controller_1.updateCleanerAssignment);
router.get('/report', authMiddleware_1.protect, (0, roleMiddleware_1.allowRoles)('supervisor'), supervisor_controller_1.supervisorReport);
router.get('/tasks', authMiddleware_1.protect, (0, roleMiddleware_1.allowRoles)('supervisor'), supervisor_controller_1.getSupervisorTasks);
router.post('/tasks', authMiddleware_1.protect, (0, roleMiddleware_1.allowRoles)('supervisor'), supervisor_controller_1.assignTaskToWorker);
router.patch('/tasks/:id', authMiddleware_1.protect, (0, roleMiddleware_1.allowRoles)('supervisor'), supervisor_controller_1.updateTask);
// Profile (supervisor self-update)
router.patch('/profile', authMiddleware_1.protect, (0, roleMiddleware_1.allowRoles)('supervisor'), supervisor_controller_1.updateSupervisorProfile);
console.log(' Supervisor profile route registered: PATCH /api/supervisor/profile');
// Penalties
router.post('/penalties', authMiddleware_1.protect, (0, roleMiddleware_1.allowRoles)('supervisor'), penalties_controller_1.addPenalty);
router.get('/penalties', authMiddleware_1.protect, (0, roleMiddleware_1.allowRoles)('supervisor'), penalties_controller_1.getSupervisorPenalties);
// ── Admin CRUD routes ─────────────────────────────────────────────────────────
router.get('/:id', authMiddleware_1.protect, (0, roleMiddleware_1.allowRoles)('admin', 'super_admin'), supervisor_controller_1.getAdminSupervisorDetails);
router.put('/:id', authMiddleware_1.protect, (0, roleMiddleware_1.allowRoles)('admin', 'super_admin'), supervisor_controller_1.updateAdminSupervisor);
router.patch('/:id/status', authMiddleware_1.protect, (0, roleMiddleware_1.allowRoles)('admin', 'super_admin'), supervisor_controller_1.toggleAdminSupervisorStatus);
router.delete('/:id', authMiddleware_1.protect, (0, roleMiddleware_1.allowRoles)('admin', 'super_admin'), supervisor_controller_1.deleteAdminSupervisor);
exports.default = router;
