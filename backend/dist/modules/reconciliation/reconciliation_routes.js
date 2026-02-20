"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const reconciliation_controller_1 = require("./reconciliation_controller");
const router = (0, express_1.Router)();
router.get('/reconciliation/:cycleId', reconciliation_controller_1.getReconciliationController);
exports.default = router;
