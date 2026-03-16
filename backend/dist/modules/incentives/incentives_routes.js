"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/incentive.routes.ts
const express_1 = require("express");
const incentives_controller_1 = require("./incentives_controller");
const router = (0, express_1.Router)();
/* ================= INCENTIVE TARGETS ================= */
router.get('/targets', incentives_controller_1.getAllIncentiveTargetsController);
router.post('/targets', incentives_controller_1.createIncentiveTargetController);
router.put('/targets/:id', incentives_controller_1.updateIncentiveTargetController);
router.delete('/targets/:id', incentives_controller_1.deleteIncentiveTargetController);
/* ================= INCENTIVE TYPES ================= */
router.post('/types', incentives_controller_1.createIncentiveTypeController);
router.get('/types', incentives_controller_1.getAllIncentiveTypesController);
router.get('/types/active', incentives_controller_1.getActiveIncentiveTypesController);
router.put('/types/:id', incentives_controller_1.updateIncentiveTypeController);
router.delete('/types/:id', incentives_controller_1.deleteIncentiveTypeController);
/* ================= INCENTIVE RULES ================= */
router.post('/rules', incentives_controller_1.createIncentiveRuleController);
router.get('/rules', incentives_controller_1.getAllIncentiveRulesController);
router.get('/rules/active', incentives_controller_1.getActiveIncentiveRulesController);
router.get('/rules/type/:typeId', incentives_controller_1.getIncentiveRulesByTypeController);
router.put('/rules/:id', incentives_controller_1.updateIncentiveRuleController);
router.delete('/rules/:id', incentives_controller_1.deleteIncentiveRuleController);
/* ================= DAILY WORK & RECORDS ================= */
router.post('/daily-work', incentives_controller_1.recordDailyWorkController);
router.get('/daily-work/:cleanerId', incentives_controller_1.getDailyWorkRecordsController);
router.get('/monthly-summary/:cleanerId/:month', incentives_controller_1.getMonthlyIncentiveSummaryController);
exports.default = router;
