"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const salary_controller_1 = require("./salary_controller");
const router = express_1.default.Router();
router.get('/salary-cycles', salary_controller_1.getSalaryCyclesController);
// Generate salary for all cleaners in cycle
router.post('/generate/:cycleId', salary_controller_1.generateSalaryForAllController);
// Generate salary for one cleaner
router.post('/generate/:cycleId/:cleanerId', salary_controller_1.generateSalaryForCleanerController);
router.post('/lock/:cycleId', salary_controller_1.lockSalaryController);
exports.default = router;
