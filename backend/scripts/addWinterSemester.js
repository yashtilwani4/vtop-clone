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

const addWinterSemester = async () => {
  try {
    console.log('📊 Adding Winter Semester 2024-25 results...');
    
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
    
    // Course data from the provided JSON (fixed the syntax error)
    const coursesData = [
      {
        courseCode: 'CSD1001',
        courseName: 'Principles Of Digital Forensics',
        credits: 3,
        grandTotal: 68,
        grade: 'D'
      },
      {
        courseCode: 'CSE1021',
        courseName: 'Introduction to Problem Solving and Programming',
        credits: 4,
        grandTotal: 77,
        grade: 'C'
      },
      {
        courseCode: 'ECE2002',
        courseName: 'Digital Logic Design',
        credits: 4,
        grandTotal: 66,
        grade: 'C'
      },
      {
        courseCode: 'ENG2005',
        courseName: 'Advanced Technical Communication',
        credits: 2,
        grandTotal: 72,
        grade: 'C'
      },
      {
        courseCode: 'HUM0002',
        courseName: 'Swachh Bharat',
        credits: 1,
        grandTotal: 92,
        grade: 'P'
      },
      {
        courseCode: 'HUM1002',
        courseName: 'Emotional Intelligence',
        credits: 3,
        grandTotal: 65,
        grade: 'B'
      },
      {
        courseCode: 'MAT2002',
        courseName: 'Discrete Mathematics and Graph Theory',
        credits: 4,
        grandTotal: 67,
        grade: 'D'
      },
      {
        courseCode: 'PHY1003',
        courseName: 'Introduction to Computational Physics',
        credits: 4,
        grandTotal: 68,
        grade: 'C'
      }
    ];
    
    // Create courses and results for Winter Semester (semester 2)
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
        semester: 2, // Winter Semester
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
        semester: 2, // Winter Semester
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
    
    // Calculate overall GPA for Winter Semester
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
    
    console.log('\n🎉 Winter Semester 2024-25 results added successfully!');
    console.log(`📊 Winter Semester GPA: ${gpa}`);
    console.log(`📚 Total courses: ${coursesData.length}`);
    console.log(`🎯 Total credits: ${coursesData.reduce((sum, c) => sum + c.credits, 0)}`);
    
    console.log('\n📋 Winter Semester Course Summary:');
    coursesData.forEach(course => {
      console.log(`  ${course.courseCode}: ${course.grade} (${course.grandTotal}%) - ${course.credits} credits`);
    });
    
    // Calculate overall CGPA across both semesters
    const allResults = await SimpleResult.find({ 
      studentId: student._id, 
      status: 'Published' 
    }).populate('courseId', 'credits');
    
    let overallGradePoints = 0;
    let overallCredits = 0;
    
    allResults.forEach(result => {
      if (result.grade !== 'P') {
        overallGradePoints += result.gradePoints * result.courseId.credits;
        overallCredits += result.courseId.credits;
      }
    });
    
    const overallCGPA = overallCredits > 0 ? (overallGradePoints / overallCredits).toFixed(2) : 0;
    
    console.log(`\n🎯 Overall CGPA (both semesters): ${overallCGPA}`);
    console.log(`📊 Total courses completed: ${allResults.length}`);
    console.log(`🎓 Total credits earned: ${overallCredits}`);
    
  } catch (error) {
    console.error('❌ Error adding winter semester results:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

addWinterSemester();