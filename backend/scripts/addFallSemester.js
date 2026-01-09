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

const addFallSemester = async () => {
  try {
    console.log('📊 Adding Fall Semester 2025-26 results...');
    
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
    
    // Course data from the provided JSON (fixed the lowercase "c" to "C")
    const coursesData = [
      {
        courseCode: 'SST1003',
        courseName: 'Professional Communication Skills for Engineers',
        credits: 3,
        grandTotal: 76,
        grade: 'B'
      },
      {
        courseCode: 'HUM0003',
        courseName: 'INDIAN CONSTITUTION',
        credits: 4,
        grandTotal: 90,
        grade: 'P'
      },
      {
        courseCode: 'CHY1006',
        courseName: 'Environmental Sustainability',
        credits: 4,
        grandTotal: 68,
        grade: 'B'
      },
      {
        courseCode: 'MAT3003',
        courseName: 'Probability, Statistics and Reliability',
        credits: 2,
        grandTotal: 27,
        grade: 'F'
      },
      {
        courseCode: 'UHV0002',
        courseName: 'Universal Human Values - II',
        credits: 1,
        grandTotal: 84,
        grade: 'P'
      },
      {
        courseCode: 'CSE2003',
        courseName: 'Computer Architecture and Organization',
        credits: 3,
        grandTotal: 65,
        grade: 'C' // Fixed from lowercase "c"
      },
      {
        courseCode: 'CSE2001',
        courseName: 'Object Oriented Programming with C++',
        credits: 4,
        grandTotal: 47,
        grade: 'F'
      },
      {
        courseCode: 'DSN2098',
        courseName: 'Project Exhibition – I',
        credits: 4,
        grandTotal: 78,
        grade: 'B'
      }
    ];
    
    // Create courses and results for Fall Semester (semester 3)
    const createdResults = [];
    
    for (const courseData of coursesData) {
      // Create course
      const course = new SimpleCourse({
        courseCode: courseData.courseCode,
        courseName: courseData.courseName,
        credits: courseData.credits,
        facultyId: admin._id,
        studentsEnrolled: [student._id],
        academicYear: '2025-26',
        semester: 3, // Fall Semester
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
        academicYear: '2025-26',
        semester: 3, // Fall Semester
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
    
    // Calculate overall GPA for Fall Semester
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
    
    console.log('\n🎉 Fall Semester 2025-26 results added successfully!');
    console.log(`📊 Fall Semester GPA: ${gpa}`);
    console.log(`📚 Total courses: ${coursesData.length}`);
    console.log(`🎯 Total credits: ${coursesData.reduce((sum, c) => sum + c.credits, 0)}`);
    
    console.log('\n📋 Fall Semester Course Summary:');
    coursesData.forEach(course => {
      console.log(`  ${course.courseCode}: ${course.grade} (${course.grandTotal}%) - ${course.credits} credits`);
    });
    
    // Calculate overall CGPA across all semesters
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
    
    console.log(`\n🎯 Overall CGPA (all semesters): ${overallCGPA}`);
    console.log(`📊 Total courses completed: ${allResults.length}`);
    console.log(`🎓 Total credits earned: ${overallCredits}`);
    
    // Show semester-wise breakdown
    console.log('\n📈 Semester-wise GPA Breakdown:');
    
    // Interim Semester (Semester 1)
    const interimResults = allResults.filter(r => r.semester === 1);
    let interimGP = 0, interimCredits = 0;
    interimResults.forEach(r => {
      if (r.grade !== 'P') {
        interimGP += r.gradePoints * r.courseId.credits;
        interimCredits += r.courseId.credits;
      }
    });
    const interimGPA = interimCredits > 0 ? (interimGP / interimCredits).toFixed(2) : 0;
    console.log(`  Interim Semester: ${interimGPA} GPA`);
    
    // Winter Semester (Semester 2)
    const winterResults = allResults.filter(r => r.semester === 2);
    let winterGP = 0, winterCredits = 0;
    winterResults.forEach(r => {
      if (r.grade !== 'P') {
        winterGP += r.gradePoints * r.courseId.credits;
        winterCredits += r.courseId.credits;
      }
    });
    const winterGPA = winterCredits > 0 ? (winterGP / winterCredits).toFixed(2) : 0;
    console.log(`  Winter Semester 2024-25: ${winterGPA} GPA`);
    
    // Fall Semester (Semester 3)
    console.log(`  Fall Semester 2025-26: ${gpa} GPA`);
    
  } catch (error) {
    console.error('❌ Error adding fall semester results:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

addFallSemester();