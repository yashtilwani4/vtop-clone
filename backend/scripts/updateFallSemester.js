const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const SimpleUser = require('../models/SimpleUser');
const SimpleCourse = require('../models/SimpleCourse');
const SimpleResult = require('../models/SimpleResult');

const updateFallSemester = async () => {
  try {
    console.log('🔄 Updating Fall Semester data...');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('📊 Connected to MongoDB');

    // Find the student
    const student = await SimpleUser.findOne({ registrationNumber: '24BCY10007' });
    if (!student) {
      throw new Error('Student not found');
    }

    // Find faculty
    const faculty = await SimpleUser.findOne({ role: 'faculty' });
    if (!faculty) {
      throw new Error('Faculty not found');
    }

    console.log('🗑️ Clearing existing Fall Semester data...');
    
    // Delete existing semester 3 courses and results
    await SimpleResult.deleteMany({ semester: 3 });
    await SimpleCourse.deleteMany({ 
      courseCode: { $in: ['CSE3001', 'CSE3002', 'CSE3003', 'MAT3001', 'CSE3004', 'CSE3005', 'GEN3001', 'CSE3006'] }
    });

    console.log('📚 Creating new Fall Semester courses...');

    // New Fall Semester Courses
    const newFallCourses = [
      { courseCode: 'SST1003', courseName: 'Professional Communication Skills for Engineers', credits: 3 },
      { courseCode: 'HUM0003', courseName: 'INDIAN CONSTITUTION', credits: 4 },
      { courseCode: 'CHY1006', courseName: 'Environmental Sustainability', credits: 4 },
      { courseCode: 'MAT3003', courseName: 'Probability, Statistics and Reliability', credits: 2 },
      { courseCode: 'UHV0002', courseName: 'Universal Human Values - II', credits: 1 },
      { courseCode: 'CSE2003', courseName: 'Computer Architecture and Organization', credits: 3 },
      { courseCode: 'CSE2001', courseName: 'Object Oriented Programming with C++', credits: 4 },
      { courseCode: 'DSN2098', courseName: 'Project Exhibition – I', credits: 4 }
    ];

    const createdCourses = {};

    for (const courseData of newFallCourses) {
      const course = new SimpleCourse({
        courseCode: courseData.courseCode,
        courseName: courseData.courseName,
        credits: courseData.credits,
        facultyId: faculty._id,
        studentsEnrolled: [student._id]
      });
      const savedCourse = await course.save();
      createdCourses[courseData.courseCode] = savedCourse;
      console.log(`   ✅ Created: ${courseData.courseCode} - ${courseData.courseName}`);
    }

    console.log('📊 Creating new Fall Semester results...');

    // New Fall Semester Results
    const newFallResults = [
      { courseCode: 'SST1003', grade: 'B', gradePoints: 8, marks: 76 },
      { courseCode: 'HUM0003', grade: 'P', gradePoints: 0, marks: 90 }, // Pass grade, no points
      { courseCode: 'CHY1006', grade: 'B', gradePoints: 8, marks: 68 },
      { courseCode: 'MAT3003', grade: 'C', gradePoints: 7, marks: 67 },
      { courseCode: 'UHV0002', grade: 'P', gradePoints: 0, marks: 84 }, // Pass grade, no points
      { courseCode: 'CSE2003', grade: 'C', gradePoints: 7, marks: 65 },
      { courseCode: 'CSE2001', grade: 'C', gradePoints: 7, marks: 67 },
      { courseCode: 'DSN2098', grade: 'B', gradePoints: 8, marks: 78 }
    ];

    for (const resultData of newFallResults) {
      const course = createdCourses[resultData.courseCode];
      if (course) {
        // Calculate component marks based on total marks
        const midtermMarks = Math.floor(resultData.marks * 0.4);
        const assignmentMarks = Math.floor(resultData.marks * 0.2);
        const quizMarks = Math.floor(resultData.marks * 0.2);
        const endtermMarks = Math.floor(resultData.marks * 0.6);
        
        const result = new SimpleResult({
          studentId: student._id,
          courseId: course._id,
          facultyId: faculty._id,
          academicYear: '2025-26',
          semester: 3,
          assessments: {
            internal: {
              midterm: {
                maxMarks: 50,
                obtainedMarks: Math.min(midtermMarks, 50),
                weightage: 20
              },
              assignments: {
                maxMarks: 30,
                obtainedMarks: Math.min(assignmentMarks, 30),
                weightage: 10
              },
              quiz: {
                maxMarks: 20,
                obtainedMarks: Math.min(quizMarks, 20),
                weightage: 10
              }
            },
            external: {
              endterm: {
                maxMarks: 100,
                obtainedMarks: Math.min(endtermMarks, 100),
                weightage: 60
              }
            }
          },
          totalMarks: resultData.marks,
          grade: resultData.grade,
          gradePoints: resultData.gradePoints,
          status: 'Published'
        });
        await result.save();
        console.log(`   ✅ Created result: ${resultData.courseCode} - Grade ${resultData.grade} (${resultData.marks}%)`);
      }
    }

    // Calculate new CGPA
    console.log('🎯 Calculating updated CGPA...');
    const cgpaData = await SimpleResult.calculateCGPA(student._id);
    
    // Calculate semester GPA for Fall semester
    const semesterData = await SimpleResult.getSemesterSummary(student._id, '2025-26', 3);
    
    console.log('✅ Fall Semester update completed successfully!');
    console.log('📊 Updated Results:');
    console.log(`   - Courses: ${newFallCourses.length}`);
    console.log(`   - Results: ${newFallResults.length}`);
    console.log(`   - Fall Semester GPA: ${semesterData.summary.sgpa}`);
    console.log(`   - New Overall CGPA: ${cgpaData.cgpa}`);
    console.log(`   - Total Credits (for GPA): ${cgpaData.totalCredits}`);
    
    console.log('\n📋 New Fall Semester Courses:');
    newFallResults.forEach(result => {
      const course = newFallCourses.find(c => c.courseCode === result.courseCode);
      console.log(`   ${result.courseCode}: ${course.courseName} - Grade ${result.grade} (${result.marks}%)`);
    });

    return {
      success: true,
      message: 'Fall Semester updated successfully',
      data: {
        coursesUpdated: newFallCourses.length,
        resultsUpdated: newFallResults.length,
        semesterGPA: semesterData.summary.sgpa,
        newCGPA: cgpaData.cgpa,
        totalCredits: cgpaData.totalCredits
      }
    };

  } catch (error) {
    console.error('❌ Error updating Fall Semester:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log('📊 Database connection closed');
  }
};

// Export for use in other files
module.exports = updateFallSemester;

// Run directly if this file is executed
if (require.main === module) {
  updateFallSemester()
    .then((result) => {
      console.log('🎉 Update completed!');
      console.log(`Fall Semester GPA: ${result.data.semesterGPA}`);
      console.log(`New Overall CGPA: ${result.data.newCGPA}`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Update failed:', error);
      process.exit(1);
    });
}