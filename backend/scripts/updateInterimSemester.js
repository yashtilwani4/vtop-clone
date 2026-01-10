const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const SimpleUser = require('../models/SimpleUser');
const SimpleCourse = require('../models/SimpleCourse');
const SimpleResult = require('../models/SimpleResult');

const updateInterimSemester = async () => {
  try {
    console.log('🔄 Updating Interim Semester data...');

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

    console.log('🗑️ Clearing existing Interim Semester data...');
    
    // Delete existing semester 1 courses and results
    await SimpleResult.deleteMany({ semester: 1 });
    await SimpleCourse.deleteMany({ 
      courseCode: { $in: ['MAT1001', 'PHY1001', 'CHE1001', 'ENG1001', 'CSE1001', 'EEE1001', 'MEC1001'] }
    });

    console.log('📚 Creating new Interim Semester courses...');

    // New Interim Semester Courses
    const newInterimCourses = [
      { courseCode: 'CHY1007', courseName: 'Forensic Chemistry and Applications', credits: 4 },
      { courseCode: 'CSA2001', courseName: 'Fundamentals in AI & ML', credits: 4 },
      { courseCode: 'CSE0001', courseName: 'Digital Literacy', credits: 1 },
      { courseCode: 'EEE1001', courseName: 'Electric Circuits and Systems', credits: 4 },
      { courseCode: 'ENG1004', courseName: 'Effective Technical Communication', credits: 2 },
      { courseCode: 'MAT1003', courseName: 'Calculus', credits: 4 },
      { courseCode: 'UHV0001', courseName: 'Universal Human Values - I', credits: 1 }
    ];

    const createdCourses = {};

    for (const courseData of newInterimCourses) {
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

    console.log('📊 Creating new Interim Semester results...');

    // New Interim Semester Results
    const newInterimResults = [
      { courseCode: 'CHY1007', grade: 'C', gradePoints: 7, marks: 68 },
      { courseCode: 'CSA2001', grade: 'D', gradePoints: 6, marks: 74 },
      { courseCode: 'CSE0001', grade: 'P', gradePoints: 0, marks: 93 }, // Pass grade, no points
      { courseCode: 'EEE1001', grade: 'D', gradePoints: 6, marks: 65 },
      { courseCode: 'ENG1004', grade: 'C', gradePoints: 7, marks: 75 },
      { courseCode: 'MAT1003', grade: 'E', gradePoints: 5, marks: 52 },
      { courseCode: 'UHV0001', grade: 'P', gradePoints: 0, marks: 91 } // Pass grade, no points
    ];

    for (const resultData of newInterimResults) {
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
          semester: 1,
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
    
    console.log('✅ Interim Semester update completed successfully!');
    console.log('📊 Updated Results:');
    console.log(`   - Courses: ${newInterimCourses.length}`);
    console.log(`   - Results: ${newInterimResults.length}`);
    console.log(`   - New Overall CGPA: ${cgpaData.cgpa}`);
    console.log(`   - Total Credits (for GPA): ${cgpaData.totalCredits}`);
    
    console.log('\n📋 New Interim Semester Courses:');
    newInterimResults.forEach(result => {
      const course = newInterimCourses.find(c => c.courseCode === result.courseCode);
      console.log(`   ${result.courseCode}: ${course.courseName} - Grade ${result.grade} (${result.marks}%)`);
    });

    return {
      success: true,
      message: 'Interim Semester updated successfully',
      data: {
        coursesUpdated: newInterimCourses.length,
        resultsUpdated: newInterimResults.length,
        newCGPA: cgpaData.cgpa,
        totalCredits: cgpaData.totalCredits
      }
    };

  } catch (error) {
    console.error('❌ Error updating Interim Semester:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log('📊 Database connection closed');
  }
};

// Export for use in other files
module.exports = updateInterimSemester;

// Run directly if this file is executed
if (require.main === module) {
  updateInterimSemester()
    .then((result) => {
      console.log('🎉 Update completed!');
      console.log(`New CGPA: ${result.data.newCGPA}`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Update failed:', error);
      process.exit(1);
    });
}