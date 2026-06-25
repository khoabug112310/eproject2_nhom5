const express = require('express');
const { createReview, getDoctorReviews, checkReviewEligibility } = require('./controller');
const { authenticateToken } = require('../../middlewares/auth');

const router = express.Router();

// Submit a new review (requires authentication)
router.post('/', authenticateToken, createReview);

// Check if user is eligible to review (requires authentication)
router.get('/eligibility/:doctorId', authenticateToken, checkReviewEligibility);

// Fetch all reviews for a doctor (public)
router.get('/doctor/:doctorId', getDoctorReviews);

module.exports = router;
