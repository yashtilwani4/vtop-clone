const express = require('express');
const router = express.Router();

// Import all the seed scripts
const seedData = require('../scripts/seedData');

// Temporary endpoint to seed production database
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
    
    // Run the seed script
    await seedData();
    
    console.log('✅ Production database seeded successfully');
    
    res.json({
      success: true,
      message: 'Production database seeded successfully',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error seeding production database:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to seed production database',
      error: error.message
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