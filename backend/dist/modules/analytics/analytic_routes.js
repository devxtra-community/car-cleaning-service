"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const analytics_controller_1 = require("./analytics_controller");
const router = (0, express_1.Router)();
router.get('/daily', analytics_controller_1.dailyProgressController);
router.get('/weekly', analytics_controller_1.weeklyProgressController);
router.get('/monthly', analytics_controller_1.monthlyProgressController);
exports.default = router;
