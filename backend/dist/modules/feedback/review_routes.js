"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const review_controller_1 = require("./review_controller");
const authMiddleware_1 = require("../../middlewares/authMiddleware");
const router = express_1.default.Router();
// Get reviews for current authenticated worker
router.get('/my', authMiddleware_1.authMiddleware, review_controller_1.getMyReviews);
// Public endpoint - no auth required for submitting reviews
router.post('/', review_controller_1.createReview);
// Get reviews by worker
router.get('/worker/:workerId', review_controller_1.getReviewsByWorker);
// Get review by task
router.get('/task/:taskId', review_controller_1.getReviewByTask);
exports.default = router;
