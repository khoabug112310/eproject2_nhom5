// Express App - Khởi tạo ứng dụng
const express = require('express');
const cors = require('cors');
const { connectDatabase } = require('./config/database');
const config = require('./config/env');
const { errorHandler } = require('./middlewares/errorHandler');

// Import routes
const authRoutes = require('./modules/auth/routes');
const profilesRoutes = require('./modules/profiles/routes');
const schedulingRoutes = require('./modules/scheduling/routes');
const bookingRoutes = require('./modules/booking/routes');
const clinicalRoutes = require('./modules/clinical/routes');
const billingRoutes = require('./modules/billing/routes');
const cmsRoutes = require('./modules/cms/routes');

const app = express();

// Connect Database
connectDatabase();

// Middleware
// Allow CORS from frontend origin; in development allow any origin
app.use(cors({
  origin: config.NODE_ENV === 'development' ? true : config.FRONTEND_URL,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/profiles', profilesRoutes);
app.use('/api/scheduling', schedulingRoutes);
app.use('/api/booking', bookingRoutes);
app.use('/api/clinical', clinicalRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/cms', cmsRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ message: 'API endpoint not found' });
});

// Error Handler
app.use(errorHandler);

module.exports = app;
