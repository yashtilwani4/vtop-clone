const mongoose = require('mongoose');
require('dotenv').config();

// Import all models
const SimpleUser = require('../models/SimpleUser');
const SimpleCourse = require('../models/SimpleCourse');
const SimpleResult = require('../models/SimpleResult');
const SimpleAttendance = require('../models/SimpleAttendance');
const SimpleTimetable = require('../models/SimpleTimetable');
const SimpleNotice = require('../models/SimpleNotice');

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

const clearMockData = async () => {
  try {
    console.log('🗑️  Clearing all mock data from database...');
    
    // Clear all collections except the updated student (Neha)
    await SimpleCourse.deleteMany({});
    console.log('✅ Cleared courses');
    
    await SimpleResult.deleteMany({});
    console.log('✅ Cleared results');
    
    await SimpleAttendance.deleteMany({});
    console.log('✅ Cleared attendance');
    
    await SimpleTimetable.deleteMany({});
    console.log('✅ Cleared timetable');
    
    await SimpleNotice.deleteMany({});
    console.log('✅ Cleared notices');
    
    // Keep only Neha and admin, remove other mock users
    await SimpleUser.deleteMany({ 
      registrationNumber: { $ne: '24BCY10007' },
      role: { $ne: 'admin' }
    });
    console.log('✅ Cleared mock users (kept Neha and admin)');
    
    console.log('🎉 All mock data cleared successfully!');
    console.log('📋 Remaining users:');
    
    const remainingUsers = await SimpleUser.find({});
    remainingUsers.forEach(user => {
      console.log(`  - ${user.name} (${user.email}) - ${user.role}`);
    });
    
  } catch (error) {
    console.error('❌ Error clearing mock data:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

clearMockData();