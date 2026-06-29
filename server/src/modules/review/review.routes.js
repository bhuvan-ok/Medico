import { Router } from 'express';
import { getDoctorReviews } from './review.controller.js';

const router = Router();

// Public
router.get('/doctors/:id/reviews', getDoctorReviews);

export default router;
