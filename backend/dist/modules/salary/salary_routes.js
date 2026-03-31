"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const salary_controller_1 = require("./salary_controller");
const authMiddleware_1 = require("../../middlewares/authMiddleware");
const roleMiddleware_1 = require("../../middlewares/roleMiddleware");
const router = express_1.default.Router();
router.use(authMiddleware_1.authMiddleware);
// Get ALL salary records (used by SalaryFinalization page)
router.get('/', salary_controller_1.getAllSalariesController);
// Role-based salary view (web admin panel)
router.get('/role-summary', salary_controller_1.getRoleBasedSalariesController);
// Monthly report summary (accountant dashboard)
router.get('/monthly-report', salary_controller_1.getMonthlyReportController);
router.get('/breakdown/:salaryId', salary_controller_1.getSalaryBreakdownController);
router.get('/summary/:mode', salary_controller_1.getSalarySummaryController);
router.get('/salary-cycles', salary_controller_1.getSalaryCyclesController);
// Get salaries by cycle
router.get('/cycle/:cycleId', salary_controller_1.getSalariesByCycleIdController);
// Get salary history for a user
router.get('/user/:userId', salary_controller_1.getSalariesByUserIdController);
// Get salary timeline (calendar view for mobile app)
router.get('/user/:userId/timeline', salary_controller_1.getSalaryTimelineController);
// Generate salary for all cleaners in cycle
router.post('/generate/:cycleId', salary_controller_1.generateSalaryForAllController);
// Generate salary for one cleaner
router.post('/generate/:cycleId/:cleanerId', salary_controller_1.generateSalaryForCleanerController);
router.post('/lock/:cycleId', (0, roleMiddleware_1.allowRoles)('admin', 'accountant'), salary_controller_1.lockSalaryController);
router.patch('/finalize/:salaryId', (0, roleMiddleware_1.allowRoles)('admin', 'accountant'), salary_controller_1.finalizeSalaryController);
exports.default = router;
