const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

// Import models
const SimpleResult = require('../models/SimpleResult');
const SimpleCourse = require('../models/SimpleCourse');
const SimpleUser = require('../models/SimpleUser');

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

const createInterimResults = async () => {
  try {
    console.log('📊 Creating interim semester results...');
    
    // Get Neha's student record
    const student = await SimpleUser.findOne({ registrationNumber: '24BCY10007' });
    if (!student) {
      console.log('❌ Student Neha not found');
      return;
    }
    
    // Get admin user to act as faculty for these results
    const admin = await SimpleUser.findOne({ role: 'admin' });
    if (!admin) {
      console.log('❌ Admin user not found');
      return;
    }
    
    // Clear any existing results and courses
    await SimpleResult.deleteMany({});
    await SimpleCourse.deleteMany({});
    console.log('🗑️  Cleared existing results and courses');
    
    // Course data from the provided JSON
    const coursesData = [
      {
        courseCode: 'CHY1007',
        courseName: 'Forensic Chemistry and Applications',
        credits: 4,
        grandTotal: 68,
        grade: 'D'
      },
      {
        courseCode: 'CSA2001',
        courseName: 'Fundamentals in AI & ML',
        credits: 4,
        grandTotal: 74,
        grade: 'C'
      },
      {
        courseCode: 'CSE0001',
        courseName: 'Digital Literacy',
        credits: 1,
        grandTotal: 93,
        grade: 'P'
      },
      {
        courseCode: 'EEE1001',
        courseName: 'Electric Circuits and Systems',
        credits: 4,
        grandTotal: 55,
        grade: 'E'
      },
      {
        courseCode: 'ENG1004',
        courseName: 'Effective Technical Communication',
        credits: 2,
        grandTotal: 75,
        grade: 'D'
      },
      {
        courseCode: 'MAT1003',
        courseName: 'Calculus',
        credits: 4,
        grandTotal: 52,
        grade: 'E'
      },
      {
        courseCode: 'UHV0001',
        courseName: 'Universal Human Values - I',
        credits: 1,
        grandTotal: 91,
        grade: 'P'
      }
    ];
    
    // Create courses and results
    const createdResults = [];
    
    for (const courseData of coursesData) {
      // Create course
      const course = new SimpleCourse({
        courseCode: courseData.courseCode,
        courseName: courseData.courseName,
        credits: courseData.credits,
        facultyId: admin._id,
        studentsEnrolled: [student._id],
        academicYear: '2024-25',
        semester: 1, // Use 1 for Interim Semester
        department: 'General'
      });
      
      await course.save();
      console.log(`✅ Created course: ${course.courseCode}`);
      
      // Calculate grade points
      const gradePoints = {
        'S': 10, 'A': 9, 'B': 8, 'C': 7, 'D': 6, 'E': 5, 'F': 0, 'P': 0
      };
      
      // Create result
      const result = new SimpleResult({
        courseId: course._id,
        studentId: student._id,
        facultyId: admin._id,
        academicYear: '2024-25',
        semester: 1, // Use 1 for Interim Semester
        totalMarks: courseData.grandTotal,
        grade: courseData.grade,
        gradePoints: gradePoints[courseData.grade] || 0,
        status: 'Published',
        publishedAt: new Date(),
        assessments: {
          internal: {
            midterm: {
              maxMarks: 50,
              obtainedMarks: Math.round(courseData.grandTotal * 0.2), // 20% weightage
              weightage: 20
            },
            assignments: {
              maxMarks: 30,
              obtainedMarks: Math.round(courseData.grandTotal * 0.1), // 10% weightage
              weightage: 10
            },
            quiz: {
              maxMarks: 20,
              obtainedMarks: Math.round(courseData.grandTotal * 0.1), // 10% weightage
              weightage: 10
            }
          },
          external: {
            endterm: {
              maxMarks: 100,
              obtainedMarks: Math.round(courseData.grandTotal * 0.6), // 60% weightage
              weightage: 60
            }
          }
        }
      });
      
      await result.save();
      createdResults.push(result);
      console.log(`✅ Created result: ${courseData.courseCode} - ${courseData.grade} (${courseData.grandTotal}%)`);
    }
    
    // Calculate overall GPA
    let totalGradePoints = 0;
    let totalCredits = 0;
    
    for (const courseData of coursesData) {
      const gradePoints = {
        'S': 10, 'A': 9, 'B': 8, 'C': 7, 'D': 6, 'E': 5, 'F': 0, 'P': 0
      };
      
      const credits = courseData.credits;
      const points = gradePoints[courseData.grade] || 0;
      
      // Only count graded courses (not P grades) for GPA calculation
      if (courseData.grade !== 'P') {
        totalGradePoints += points * credits;
        totalCredits += credits;
      }
    }
    
    const gpa = totalCredits > 0 ? (totalGradePoints / totalCredits).toFixed(2) : 0;
    
    console.log('\n🎉 Interim semester results created successfully!');
    console.log(`📊 GPA: ${gpa}`);
    console.log(`📚 Total courses: ${coursesData.length}`);
    console.log(`🎯 Total credits: ${coursesData.reduce((sum, c) => sum + c.credits, 0)}`);
    
    console.log('\n📋 Course Summary:');
    coursesData.forEach(course => {
      console.log(`  ${course.courseCode}: ${course.grade} (${course.grandTotal}%) - ${course.credits} credits`);
    });
    
  } catch (error) {
    console.error('❌ Error creating interim results:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

createInterimResults();