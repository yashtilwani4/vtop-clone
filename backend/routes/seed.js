const express = require('express');
const router = express.Router();

// Import the academic data seed script
const seedAcademicData = require('../scripts/seedAcademicData');
const updateInterimSemester = require('../scripts/updateInterimSemester');
const updateWinterSemester = require('../scripts/updateWinterSemester');
const updateFallSemester = require('../scripts/updateFallSemester');
const updateStudentProfile = require('../scripts/updateStudentProfile');

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

// Update Interim Semester with new course data
router.post('/update-interim-semester', async (req, res) => {
  try {
    console.log('🔄 Starting Interim Semester update...');
    
    // Check if this is production environment
    if (process.env.NODE_ENV !== 'production') {
      return res.status(403).json({
        success: false,
        message: 'This endpoint is only available in production'
      });
    }
    
    // Run the interim semester update script
    const result = await updateInterimSemester();
    
    console.log('✅ Interim Semester updated successfully');
    
    res.json({
      success: true,
      message: 'Interim Semester updated successfully with new course data',
      timestamp: new Date().toISOString(),
      data: result.data
    });
    
  } catch (error) {
    console.error('❌ Error updating Interim Semester:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to update Interim Semester',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Update Winter Semester with new course data
router.post('/update-winter-semester', async (req, res) => {
  try {
    console.log('🔄 Starting Winter Semester update...');
    
    // Check if this is production environment
    if (process.env.NODE_ENV !== 'production') {
      return res.status(403).json({
        success: false,
        message: 'This endpoint is only available in production'
      });
    }
    
    // Run the winter semester update script
    const result = await updateWinterSemester();
    
    console.log('✅ Winter Semester updated successfully');
    
    res.json({
      success: true,
      message: 'Winter Semester updated successfully with new course data',
      timestamp: new Date().toISOString(),
      data: result.data
    });
    
  } catch (error) {
    console.error('❌ Error updating Winter Semester:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to update Winter Semester',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Update Fall Semester with new course data
router.post('/update-fall-semester', async (req, res) => {
  try {
    console.log('🔄 Starting Fall Semester update...');
    
    // Check if this is production environment
    if (process.env.NODE_ENV !== 'production') {
      return res.status(403).json({
        success: false,
        message: 'This endpoint is only available in production'
      });
    }
    
    // Run the fall semester update script
    const result = await updateFallSemester();
    
    console.log('✅ Fall Semester updated successfully');
    
    res.json({
      success: true,
      message: 'Fall Semester updated successfully with new course data',
      timestamp: new Date().toISOString(),
      data: result.data
    });
    
  } catch (error) {
    console.error('❌ Error updating Fall Semester:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to update Fall Semester',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Update student profile with complete personal information
router.post('/update-student-profile', async (req, res) => {
  try {
    console.log('👤 Starting student profile update...');
    
    // Check if this is production environment
    if (process.env.NODE_ENV !== 'production') {
      return res.status(403).json({
        success: false,
        message: 'This endpoint is only available in production'
      });
    }
    
    // Run the student profile update script
    const result = await updateStudentProfile();
    
    console.log('✅ Student profile updated successfully');
    
    res.json({
      success: true,
      message: 'Student profile updated successfully with complete information',
      timestamp: new Date().toISOString(),
      data: result.data
    });
    
  } catch (error) {
    console.error('❌ Error updating student profile:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to update student profile',
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