import express from 'express';
import { createReview, getReviewsByWorker, getReviewByTask } from './review_controller';

const router = express.Router();

// Public endpoint - no auth required for submitting reviews
router.post('/', createReview);

// Get reviews by worker
router.get('/worker/:workerId', getReviewsByWorker);

// Get review by task
router.get('/task/:taskId', getReviewByTask);

export default router;
