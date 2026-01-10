const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();

// Import security and route protection
const { applySecurity } = require('./middleware/security');
const { applyRouteProtection, authorizationErrorHandler, authorizationLogger } = require('./middleware/routeProtection');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const courseRoutes = require('./routes/courses');
const attendanceRoutes = require('./routes/attendance');
const resultRoutes = require('./routes/results');
const timetableRoutes = require('./routes/timetable');
const noticeRoutes = require('./routes/notices');

// Import simple API routes
const simpleAuthRoutes = require('./routes/simpleAuth');
const simpleCourseRoutes = require('./routes/simpleCourses');
const simpleAttendanceRoutes = require('./routes/simpleAttendance');
const simpleResultRoutes = require('./routes/simpleResults');
const simpleTimetableRoutes = require('./routes/simpleTimetable');
const simpleNoticeRoutes = require('./routes/simpleNotices');
const seedRoutes = require('./routes/seed');

const app = express();

// Trust proxy for accurate IP addresses
app.set('trust proxy', 1);

// Apply comprehensive security middleware
applySecurity(app);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Authorization logging (optional, for monitoring)
if (process.env.NODE_ENV === 'development') {
  app.use(authorizationLogger);
}

// Apply route protection
applyRouteProtection(app);

// Health check endpoint (public)
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: '1.0.0'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/results', resultRoutes);
app.use('/api/timetable', timetableRoutes);
app.use('/api/notices', noticeRoutes);

// Simple API Routes (Enhanced versions)
app.use('/api/simple-auth', simpleAuthRoutes);
app.use('/api/simple-courses', simpleCourseRoutes);
app.use('/api/simple-attendance', simpleAttendanceRoutes);
app.use('/api/simple-results', simpleResultRoutes);
app.use('/api/simple-timetable', simpleTimetableRoutes);
app.use('/api/simple-notices', simpleNoticeRoutes);

// Seed routes (production only)
app.use('/api/seed', seedRoutes);

// Authorization error handler
app.use(authorizationErrorHandler);

// General error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err.stack);
  
  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: Object.values(err.errors).map(e => e.message)
    });
  }
  
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format'
    });
  }
  
  if (err.code === 11000) {
    return res.status(400).json({
      success: false,
      message: 'Duplicate field value'
    });
  }
  
  res.status(500).json({ 
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false,
    message: 'API endpoint not found',
    path: req.originalUrl
  });
});

// MongoDB connection with enhanced options
const mongoOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000
};

mongoose.connect(process.env.MONGODB_URI, mongoOptions)
  .then(() => {
    console.log('✅ MongoDB connected successfully');
    console.log(`📊 Database: ${mongoose.connection.name}`);
    console.log(`🔒 Security middleware applied`);
    console.log(`🛡️  Route protection enabled`);
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  mongoose.connection.close(() => {
    console.log('MongoDB connection closed.');
    process.exit(0);
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔐 JWT Authentication: Enabled`);
  console.log(`👥 Role-based Authorization: Active`);
  console.log(`⚡ Rate Limiting: Applied`);
});