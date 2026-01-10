const express = require('express');
const router = express.Router();

// Import the academic data seed script
const seedAcademicData = require('../scripts/seedAcademicData');

// Temporary endpoint to seed production database with academic data only
router.post('/seed-production', async (req, res) => {
  try {
    console.log('🌱 Starting production database seeding...');
    
    // Check if this is production environment
    if (process.env.NODE_ENV !== 'production') {
      return res.status(403).json({
        success: false,
        message: 'This endpoint is only available in production'
      });
    }
    
    // Run the academic data seed script
    const result = await seedAcademicData();
    
    console.log('✅ Production database seeded successfully');
    
    res.json({
      success: true,
      message: 'Production database seeded successfully with academic data',
      timestamp: new Date().toISOString(),
      data: result.data
    });
    
  } catch (error) {
    console.error('❌ Error seeding production database:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to seed production database',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Health check for seed endpoint
router.get('/seed-status', (req, res) => {
  res.json({
    success: true,
    message: 'Seed endpoint is available',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;