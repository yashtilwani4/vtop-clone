const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const SimpleUser = require('../models/SimpleUser');
const SimpleCourse = require('../models/SimpleCourse');
const SimpleResult = require('../models/SimpleResult');

const updateWinterSemester = async () => {
  try {
    console.log('🔄 Updating Winter Semester data...');

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

    console.log('🗑️ Clearing existing Winter Semester data...');
    
    // Delete existing semester 2 courses and results
    await SimpleResult.deleteMany({ semester: 2 });
    await SimpleCourse.deleteMany({ 
      courseCode: { $in: ['MAT2001', 'PHY2001', 'CSE2001', 'CSE2002', 'ENG2001', 'MAT2002', 'CSE2003', 'GEN2001'] }
    });

    console.log('📚 Creating new Winter Semester courses...');

    // New Winter Semester Courses
    const newWinterCourses = [
      { courseCode: 'CSD1001', courseName: 'Principles Of Digital Forensics', credits: 3 },
      { courseCode: 'CSE1021', courseName: 'Introduction to Problem Solving and Programming', credits: 4 },
      { courseCode: 'ECE2002', courseName: 'Digital Logic Design', credits: 4 },
      { courseCode: 'ENG2005', courseName: 'Advanced Technical Communication', credits: 2 },
      { courseCode: 'HUM0002', courseName: 'Swachh Bharat', credits: 1 },
      { courseCode: 'HUM1002', courseName: 'Emotional Intelligence', credits: 3 },
      { courseCode: 'MAT2002', courseName: 'Discrete Mathematics and Graph Theory', credits: 4 },
      { courseCode: 'PHY1003', courseName: 'Introduction to Computational Physics', credits: 4 }
    ];

    const createdCourses = {};

    for (const courseData of newWinterCourses) {
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

    console.log('📊 Creating new Winter Semester results...');

    // New Winter Semester Results
    const newWinterResults = [
      { courseCode: 'CSD1001', grade: 'D', gradePoints: 6, marks: 58 },
      { courseCode: 'CSE1021', grade: 'C', gradePoints: 7, marks: 67 },
      { courseCode: 'ECE2002', grade: 'F', gradePoints: 0, marks: 40 }, // Failed course
      { courseCode: 'ENG2005', grade: 'C', gradePoints: 7, marks: 72 },
      { courseCode: 'HUM0002', grade: 'P', gradePoints: 0, marks: 92 }, // Pass grade, no points
      { courseCode: 'HUM1002', grade: 'B', gradePoints: 8, marks: 65 },
      { courseCode: 'MAT2002', grade: 'D', gradePoints: 6, marks: 67 },
      { courseCode: 'PHY1003', grade: 'D', gradePoints: 6, marks: 58 }
    ];

    for (const resultData of newWinterResults) {
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
          academicYear: '2024-25',
          semester: 2,
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
    
    // Calculate semester GPA for Winter semester
    const semesterData = await SimpleResult.getSemesterSummary(student._id, '2024-25', 2);
    
    console.log('✅ Winter Semester update completed successfully!');
    console.log('📊 Updated Results:');
    console.log(`   - Courses: ${newWinterCourses.length}`);
    console.log(`   - Results: ${newWinterResults.length}`);
    console.log(`   - Winter Semester GPA: ${semesterData.summary.sgpa}`);
    console.log(`   - New Overall CGPA: ${cgpaData.cgpa}`);
    console.log(`   - Total Credits (for GPA): ${cgpaData.totalCredits}`);
    
    console.log('\n📋 New Winter Semester Courses:');
    newWinterResults.forEach(result => {
      const course = newWinterCourses.find(c => c.courseCode === result.courseCode);
      console.log(`   ${result.courseCode}: ${course.courseName} - Grade ${result.grade} (${result.marks}%)`);
    });

    return {
      success: true,
      message: 'Winter Semester updated successfully',
      data: {
        coursesUpdated: newWinterCourses.length,
        resultsUpdated: newWinterResults.length,
        semesterGPA: semesterData.summary.sgpa,
        newCGPA: cgpaData.cgpa,
        totalCredits: cgpaData.totalCredits
      }
    };

  } catch (error) {
    console.error('❌ Error updating Winter Semester:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log('📊 Database connection closed');
  }
};

// Export for use in other files
module.exports = updateWinterSemester;

// Run directly if this file is executed
if (require.main === module) {
  updateWinterSemester()
    .then((result) => {
      console.log('🎉 Update completed!');
      console.log(`Winter Semester GPA: ${result.data.semesterGPA}`);
      console.log(`New Overall CGPA: ${result.data.newCGPA}`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Update failed:', error);
      process.exit(1);
    });
}