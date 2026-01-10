const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const SimpleUser = require('../models/SimpleUser');
const SimpleCourse = require('../models/SimpleCourse');
const SimpleResult = require('../models/SimpleResult');

const seedAcademicData = async () => {
  try {
    console.log('🌱 Starting academic data seeding...');

    // Connect to MongoDB if not already connected
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('📊 Connected to MongoDB');
    }

    // Clear existing data (optional - comment out if you want to keep existing data)
    console.log('🧹 Clearing existing academic data...');
    await SimpleResult.deleteMany({});
    await SimpleCourse.deleteMany({});
    
    // Keep users but ensure our student exists
    const existingStudent = await SimpleUser.findOne({ registrationNumber: '24BCY10007' });
    
    let student;
    if (!existingStudent) {
      console.log('👤 Creating student user...');
      const hashedPassword = await bcrypt.hash('nehababel@2026', 12);
      
      student = new SimpleUser({
        name: 'Neha Ajay Babel',
        email: 'neha.24bcy10007@vitbhopal.ac.in',
        password: hashedPassword,
        role: 'student',
        registrationNumber: '24BCY10007',
        department: 'CSE',
        program: 'B.Tech',
        semester: 3,
        academicYear: '2024-25',
        isActive: true,
        isVerified: true
      });
      await student.save();
    } else {
      student = existingStudent;
      console.log('👤 Using existing student user');
    }

    // Create faculty user if not exists
    let faculty = await SimpleUser.findOne({ email: 'faculty@vitbhopal.ac.in' });
    if (!faculty) {
      console.log('👨‍🏫 Creating faculty user...');
      const hashedPassword = await bcrypt.hash('faculty123', 12);
      
      faculty = new SimpleUser({
        name: 'Dr. Faculty Member',
        email: 'faculty@vitbhopal.ac.in',
        password: hashedPassword,
        role: 'faculty',
        department: 'CSE',
        isActive: true,
        isVerified: true
      });
      await faculty.save();
    }

    console.log('📚 Creating courses...');

    // Interim Semester Courses (Semester 1)
    const interimCourses = [
      { courseCode: 'CHY1007', courseName: 'Forensic Chemistry and Applications', credits: 4, semester: 1 },
      { courseCode: 'CSA2001', courseName: 'Fundamentals in AI & ML', credits: 4, semester: 1 },
      { courseCode: 'CSE0001', courseName: 'Digital Literacy', credits: 1, semester: 1 },
      { courseCode: 'EEE1001', courseName: 'Electric Circuits and Systems', credits: 4, semester: 1 },
      { courseCode: 'ENG1004', courseName: 'Effective Technical Communication', credits: 2, semester: 1 },
      { courseCode: 'MAT1003', courseName: 'Calculus', credits: 4, semester: 1 },
      { courseCode: 'UHV0001', courseName: 'Universal Human Values - I', credits: 1, semester: 1 }
    ];

    // Winter Semester Courses (Semester 2)
    const winterCourses = [
      { courseCode: 'MAT2001', courseName: 'Linear Algebra and Calculus', credits: 4, semester: 2 },
      { courseCode: 'PHY2001', courseName: 'Engineering Physics Lab', credits: 1, semester: 2 },
      { courseCode: 'CSE2001', courseName: 'Data Structures and Algorithms', credits: 4, semester: 2 },
      { courseCode: 'CSE2002', courseName: 'Digital Logic Design', credits: 3, semester: 2 },
      { courseCode: 'ENG2001', courseName: 'Professional Communication', credits: 2, semester: 2 },
      { courseCode: 'MAT2002', courseName: 'Discrete Mathematics', credits: 3, semester: 2 },
      { courseCode: 'CSE2003', courseName: 'Computer Organization', credits: 3, semester: 2 },
      { courseCode: 'GEN2001', courseName: 'Environmental Science', credits: 2, semester: 2 }
    ];

    // Fall Semester Courses (Semester 3)
    const fallCourses = [
      { courseCode: 'CSE3001', courseName: 'Object Oriented Programming', credits: 4, semester: 3 },
      { courseCode: 'CSE3002', courseName: 'Database Management Systems', credits: 4, semester: 3 },
      { courseCode: 'CSE3003', courseName: 'Computer Networks', credits: 3, semester: 3 },
      { courseCode: 'MAT3001', courseName: 'Probability and Statistics', credits: 3, semester: 3 },
      { courseCode: 'CSE3004', courseName: 'Operating Systems', credits: 4, semester: 3 },
      { courseCode: 'CSE3005', courseName: 'Software Engineering', credits: 3, semester: 3 },
      { courseCode: 'GEN3001', courseName: 'Indian Constitution', credits: 1, semester: 3 },
      { courseCode: 'CSE3006', courseName: 'Web Technologies', credits: 3, semester: 3 }
    ];

    // Create all courses
    const allCourses = [...interimCourses, ...winterCourses, ...fallCourses];
    const createdCourses = {};

    for (const courseData of allCourses) {
      const course = new SimpleCourse({
        courseCode: courseData.courseCode,
        courseName: courseData.courseName,
        credits: courseData.credits,
        facultyId: faculty._id,
        studentsEnrolled: [student._id] // Enroll the student in all courses
      });
      const savedCourse = await course.save();
      createdCourses[courseData.courseCode] = savedCourse;
    }

    console.log('📊 Creating academic results...');

    // Interim Semester Results (Semester 1)
    const interimResults = [
      { courseCode: 'CHY1007', grade: 'C', gradePoints: 7, marks: 68 },
      { courseCode: 'CSA2001', grade: 'D', gradePoints: 6, marks: 74 },
      { courseCode: 'CSE0001', grade: 'P', gradePoints: 0, marks: 93 }, // Pass grade, no points
      { courseCode: 'EEE1001', grade: 'D', gradePoints: 6, marks: 65 },
      { courseCode: 'ENG1004', grade: 'C', gradePoints: 7, marks: 75 },
      { courseCode: 'MAT1003', grade: 'E', gradePoints: 5, marks: 52 },
      { courseCode: 'UHV0001', grade: 'P', gradePoints: 0, marks: 91 } // Pass grade, no points
    ];

    // Winter Semester Results (Semester 2)
    const winterResults = [
      { courseCode: 'MAT2001', grade: 'A', gradePoints: 9, marks: 86 },
      { courseCode: 'PHY2001', grade: 'S', gradePoints: 10, marks: 95 },
      { courseCode: 'CSE2001', grade: 'A', gradePoints: 9, marks: 89 },
      { courseCode: 'CSE2002', grade: 'B', gradePoints: 8, marks: 79 },
      { courseCode: 'ENG2001', grade: 'A', gradePoints: 9, marks: 87 },
      { courseCode: 'MAT2002', grade: 'B', gradePoints: 8, marks: 76 },
      { courseCode: 'CSE2003', grade: 'A', gradePoints: 9, marks: 84 },
      { courseCode: 'GEN2001', grade: 'S', gradePoints: 10, marks: 93 }
    ];

    // Fall Semester Results (Semester 3)
    const fallResults = [
      { courseCode: 'CSE3001', grade: 'B', gradePoints: 8, marks: 77 },
      { courseCode: 'CSE3002', grade: 'A', gradePoints: 9, marks: 83 },
      { courseCode: 'CSE3003', grade: 'C', gradePoints: 7, marks: 69 },
      { courseCode: 'MAT3001', grade: 'B', gradePoints: 8, marks: 74 },
      { courseCode: 'CSE3004', grade: 'F', gradePoints: 0, marks: 42 },
      { courseCode: 'CSE3005', grade: 'C', gradePoints: 7, marks: 65 },
      { courseCode: 'GEN3001', grade: 'S', gradePoints: 10, marks: 90 },
      { courseCode: 'CSE3006', grade: 'F', gradePoints: 0, marks: 38 }
    ];

    // Create results for each semester
    const allResults = [
      ...interimResults.map(r => ({ ...r, semester: 1, academicYear: '2024-25' })),
      ...winterResults.map(r => ({ ...r, semester: 2, academicYear: '2024-25' })),
      ...fallResults.map(r => ({ ...r, semester: 3, academicYear: '2025-26' }))
    ];

    for (const resultData of allResults) {
      const course = createdCourses[resultData.courseCode];
      if (course) {
        // Calculate component marks based on total marks
        const midtermMarks = Math.floor(resultData.marks * 0.4); // 40% for midterm
        const assignmentMarks = Math.floor(resultData.marks * 0.2); // 20% for assignments
        const quizMarks = Math.floor(resultData.marks * 0.2); // 20% for quiz
        const endtermMarks = Math.floor(resultData.marks * 0.6); // 60% for endterm
        
        const result = new SimpleResult({
          studentId: student._id,
          courseId: course._id,
          facultyId: faculty._id,
          academicYear: resultData.academicYear,
          semester: resultData.semester,
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
      }
    }

    console.log('✅ Academic data seeding completed successfully!');
    console.log('📊 Created:');
    console.log(`   - ${allCourses.length} courses`);
    console.log(`   - ${allResults.length} results`);
    console.log(`   - Student: ${student.name} (${student.registrationNumber})`);
    console.log('🎯 Overall CGPA should now be approximately 6.27');

    return {
      success: true,
      message: 'Academic data seeded successfully',
      data: {
        coursesCreated: allCourses.length,
        resultsCreated: allResults.length,
        student: {
          name: student.name,
          registrationNumber: student.registrationNumber,
          email: student.email
        }
      }
    };

  } catch (error) {
    console.error('❌ Error seeding academic data:', error);
    throw error;
  }
};

// Export for use in other files
module.exports = seedAcademicData;

// Run directly if this file is executed
if (require.main === module) {
  seedAcademicData()
    .then(() => {
      console.log('🎉 Seeding completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Seeding failed:', error);
      process.exit(1);
    });
}