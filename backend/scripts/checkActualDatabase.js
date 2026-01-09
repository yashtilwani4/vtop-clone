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

const checkActualDatabase = async () => {
  try {
    console.log('🔍 Checking actual database contents...');
    console.log(`📊 Database URI: ${process.env.MONGODB_URI}`);
    console.log(`📊 Database Name: ${mongoose.connection.db.databaseName}`);
    
    // Count all collections
    const userCount = await SimpleUser.countDocuments();
    const courseCount = await SimpleCourse.countDocuments();
    const attendanceCount = await SimpleAttendance.countDocuments();
    const timetableCount = await SimpleTimetable.countDocuments();
    const resultCount = await SimpleResult.countDocuments();
    const noticeCount = await SimpleNotice.countDocuments();
    
    console.log('\n📊 Collection Counts:');
    console.log(`👥 Users: ${userCount}`);
    console.log(`📚 Courses: ${courseCount}`);
    console.log(`📋 Attendance: ${attendanceCount}`);
    console.log(`🗓️  Timetable: ${timetableCount}`);
    console.log(`📊 Results: ${resultCount}`);
    console.log(`📢 Notices: ${noticeCount}`);
    
    // List all users
    const users = await SimpleUser.find({}, 'name email role registrationNumber');
    console.log('\n👥 All Users:');
    users.forEach(user => {
      console.log(`  - ${user.name} (${user.email}) - ${user.role} ${user.registrationNumber ? `- ${user.registrationNumber}` : ''}`);
    });
    
    // List all courses
    const courses = await SimpleCourse.find({}, 'courseCode courseName');
    console.log('\n📚 All Courses:');
    courses.forEach(course => {
      console.log(`  - ${course.courseCode}: ${course.courseName}`);
    });
    
    // Check if there are any results for Neha
    const nehaResults = await SimpleResult.find({ studentRegNo: '24BCY10007' });
    console.log(`\n📊 Results for Neha: ${nehaResults.length}`);
    
  } catch (error) {
    console.error('❌ Error checking database:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

checkActualDatabase();