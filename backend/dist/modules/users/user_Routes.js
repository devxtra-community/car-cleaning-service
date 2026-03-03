"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../../middlewares/authMiddleware");
const user_Controller_1 = require("./user_Controller");
const router = express_1.default.Router();
router.get('/me', authMiddleware_1.protect, user_Controller_1.getMe);
router.post('/push-token', authMiddleware_1.protect, user_Controller_1.updatePushToken);
exports.default = router;
