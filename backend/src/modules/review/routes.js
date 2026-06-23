const express = require('express');
const { createReview, getDoctorReviews } = require('./controller');
const { authenticateToken } = require('../../middlewares/auth');

const router = express.Router();

// Submit a new review (requires authentication)
router.post('/', authenticateToken, createReview);

// Fetch all reviews for a doctor (public)
router.get('/doctor/:doctorId', getDoctorReviews);

module.exports = router;
