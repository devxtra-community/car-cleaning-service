import express from 'express';
import { createReview, getReviewsByWorker, getReviewByTask, getMyReviews } from './review_controller';
import { authMiddleware } from '../../middlewares/authMiddleware';

const router = express.Router();

// Get reviews for current authenticated worker
router.get('/my', authMiddleware, getMyReviews);

// Public endpoint - no auth required for submitting reviews
router.post('/', createReview);

// Get reviews by worker
router.get('/worker/:workerId', getReviewsByWorker);

// Get review by task
router.get('/task/:taskId', getReviewByTask);

export default router;
