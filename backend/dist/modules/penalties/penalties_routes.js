"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../../middlewares/authMiddleware");
const penalties_controller_1 = require("./penalties_controller");
const router = express_1.default.Router();
router.get('/my', authMiddleware_1.protect, penalties_controller_1.getMyPenalties);
exports.default = router;
