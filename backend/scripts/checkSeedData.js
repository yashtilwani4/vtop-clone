const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const SimpleUser = require('../models/SimpleUser');
const SimpleCourse = require('../models/SimpleCourse');
const SimpleResult = require('../models/SimpleResult');

const checkSeedData = async () => {
  try {
    console.log('🔍 Checking seeded data...');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('📊 Connected to MongoDB');

    // Check student
    const student = await SimpleUser.findOne({ registrationNumber: '24BCY10007' });
    console.log('\n👤 Student Check:');
    if (student) {
      console.log(`✅ Found: ${student.name} (${student.registrationNumber})`);
      console.log(`📧 Email: ${student.email}`);
      console.log(`🎓 Role: ${student.role}`);
    } else {
      console.log('❌ Student not found');
    }

    // Check courses
    const courses = await SimpleCourse.find({});
    console.log('\n📚 Courses Check:');
    console.log(`✅ Total courses: ${courses.length}`);
    if (courses.length > 0) {
      console.log('📋 Sample courses:');
      courses.slice(0, 3).forEach(course => {
        console.log(`   - ${course.courseCode}: ${course.courseName} (${course.credits} credits)`);
        console.log(`     Students enrolled: ${course.studentsEnrolled.length}`);
      });
    }

    // Check results
    const results = await SimpleResult.find({}).populate('courseId', 'courseCode courseName');
    console.log('\n📊 Results Check:');
    console.log(`✅ Total results: ${results.length}`);
    if (results.length > 0) {
      console.log('📋 Sample results:');
      results.slice(0, 3).forEach(result => {
        console.log(`   - ${result.courseId.courseCode}: Grade ${result.grade} (${result.gradePoints} points)`);
        console.log(`     Total marks: ${result.totalMarks}, Semester: ${result.semester}`);
      });
      
      // Calculate CGPA
      let totalGradePoints = 0;
      let totalCredits = 0;
      
      for (const result of results) {
        const course = await SimpleCourse.findById(result.courseId);
        if (course && result.grade !== 'F') {
          totalGradePoints += result.gradePoints * course.credits;
          totalCredits += course.credits;
        }
      }
      
      const cgpa = totalCredits > 0 ? (totalGradePoints / totalCredits).toFixed(2) : 0;
      console.log(`\n🎯 Calculated CGPA: ${cgpa}`);
      console.log(`📊 Total Credits: ${totalCredits}`);
      console.log(`⭐ Total Grade Points: ${totalGradePoints}`);
    }

    // Check by semester
    console.log('\n📅 Results by Semester:');
    for (let sem = 1; sem <= 3; sem++) {
      const semResults = await SimpleResult.find({ semester: sem }).populate('courseId', 'courseCode');
      console.log(`   Semester ${sem}: ${semResults.length} results`);
      if (semResults.length > 0) {
        const grades = semResults.map(r => r.grade).join(', ');
        console.log(`     Grades: ${grades}`);
      }
    }

    console.log('\n✅ Data check completed!');
    
  } catch (error) {
    console.error('❌ Error checking data:', error);
  } finally {
    await mongoose.connection.close();
    console.log('📊 Database connection closed');
  }
};

// Run the check
checkSeedData();