const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

// Import models
const SimpleUser = require('../models/SimpleUser');
const SimpleCourse = require('../models/SimpleCourse');
const SimpleAttendance = require('../models/SimpleAttendance');
const SimpleTimetable = require('../models/SimpleTimetable');
const SimpleResult = require('../models/SimpleResult');
const SimpleNotice = require('../models/SimpleNotice');

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

const clearAllDataExceptAccounts = async () => {
  try {
    console.log('🗑️  Clearing all data except user accounts...');
    
    // Delete all results
    const resultsResult = await SimpleResult.deleteMany({});
    console.log(`✅ Deleted ${resultsResult.deletedCount} result records`);
    
    // Delete all notices
    const noticesResult = await SimpleNotice.deleteMany({});
    console.log(`✅ Deleted ${noticesResult.deletedCount} notices`);
    
    // Delete all attendance records
    const attendanceResult = await SimpleAttendance.deleteMany({});
    console.log(`✅ Deleted ${attendanceResult.deletedCount} attendance records`);
    
    // Delete all timetable entries
    const timetableResult = await SimpleTimetable.deleteMany({});
    console.log(`✅ Deleted ${timetableResult.deletedCount} timetable entries`);
    
    // Delete all courses
    const courseResult = await SimpleCourse.deleteMany({});
    console.log(`✅ Deleted ${courseResult.deletedCount} courses`);
    
    // Delete all faculty users (keep only students and admin)
    const facultyResult = await SimpleUser.deleteMany({ role: 'faculty' });
    console.log(`✅ Deleted ${facultyResult.deletedCount} faculty members`);
    
    // Check remaining users
    const remainingUsers = await SimpleUser.find({}, 'name email role registrationNumber');
    console.log('\n👥 Remaining users:');
    remainingUsers.forEach(user => {
      console.log(`  - ${user.name} (${user.email}) - ${user.role} ${user.registrationNumber ? `- ${user.registrationNumber}` : ''}`);
    });
    
    console.log('\n🎉 Successfully cleared all data except user accounts!');
    console.log('📋 Summary:');
    console.log(`  - Results deleted: ${resultsResult.deletedCount}`);
    console.log(`  - Notices deleted: ${noticesResult.deletedCount}`);
    console.log(`  - Attendance records deleted: ${attendanceResult.deletedCount}`);
    console.log(`  - Timetable entries deleted: ${timetableResult.deletedCount}`);
    console.log(`  - Courses deleted: ${courseResult.deletedCount}`);
    console.log(`  - Faculty deleted: ${facultyResult.deletedCount}`);
    console.log(`  - Users remaining: ${remainingUsers.length}`);
    
    console.log('\n✨ Database is now clean with only user accounts remaining.');
    
  } catch (error) {
    console.error('❌ Error clearing data:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

clearAllDataExceptAccounts();