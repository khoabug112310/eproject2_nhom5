const express = require('express');
const { createBooking } = require('./controller');

const router = express.Router();

// Public quick booking endpoint
router.post('/', createBooking);

module.exports = router;
