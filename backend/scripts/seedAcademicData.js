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
      { code: 'MAT1001', name: 'Calculus for Engineers', credits: 4, semester: 1 },
      { code: 'PHY1001', name: 'Engineering Physics', credits: 3, semester: 1 },
      { code: 'CHE1001', name: 'Engineering Chemistry', credits: 3, semester: 1 },
      { code: 'ENG1001', name: 'Technical English', credits: 2, semester: 1 },
      { code: 'CSE1001', name: 'Programming for Problem Solving', credits: 4, semester: 1 },
      { code: 'EEE1001', name: 'Basic Electrical Engineering', credits: 3, semester: 1 },
      { code: 'MEC1001', name: 'Engineering Graphics', credits: 2, semester: 1 }
    ];

    // Winter Semester Courses (Semester 2)
    const winterCourses = [
      { code: 'MAT2001', name: 'Linear Algebra and Calculus', credits: 4, semester: 2 },
      { code: 'PHY2001', name: 'Engineering Physics Lab', credits: 1, semester: 2 },
      { code: 'CSE2001', name: 'Data Structures and Algorithms', credits: 4, semester: 2 },
      { code: 'CSE2002', name: 'Digital Logic Design', credits: 3, semester: 2 },
      { code: 'ENG2001', name: 'Professional Communication', credits: 2, semester: 2 },
      { code: 'MAT2002', name: 'Discrete Mathematics', credits: 3, semester: 2 },
      { code: 'CSE2003', name: 'Computer Organization', credits: 3, semester: 2 },
      { code: 'GEN2001', name: 'Environmental Science', credits: 2, semester: 2 }
    ];

    // Fall Semester Courses (Semester 3)
    const fallCourses = [
      { code: 'CSE3001', name: 'Object Oriented Programming', credits: 4, semester: 3 },
      { code: 'CSE3002', name: 'Database Management Systems', credits: 4, semester: 3 },
      { code: 'CSE3003', name: 'Computer Networks', credits: 3, semester: 3 },
      { code: 'MAT3001', name: 'Probability and Statistics', credits: 3, semester: 3 },
      { code: 'CSE3004', name: 'Operating Systems', credits: 4, semester: 3 },
      { code: 'CSE3005', name: 'Software Engineering', credits: 3, semester: 3 },
      { code: 'GEN3001', name: 'Indian Constitution', credits: 1, semester: 3 },
      { code: 'CSE3006', name: 'Web Technologies', credits: 3, semester: 3 }
    ];

    // Create all courses
    const allCourses = [...interimCourses, ...winterCourses, ...fallCourses];
    const createdCourses = {};

    for (const courseData of allCourses) {
      const course = new SimpleCourse({
        ...courseData,
        department: 'CSE',
        facultyId: faculty._id,
        academicYear: '2024-25',
        isActive: true
      });
      const savedCourse = await course.save();
      createdCourses[courseData.code] = savedCourse;
    }

    console.log('📊 Creating academic results...');

    // Interim Semester Results (Semester 1)
    const interimResults = [
      { courseCode: 'MAT1001', grade: 'A', gradePoints: 9, marks: 85 },
      { courseCode: 'PHY1001', grade: 'B', gradePoints: 8, marks: 78 },
      { courseCode: 'CHE1001', grade: 'A', gradePoints: 9, marks: 82 },
      { courseCode: 'ENG1001', grade: 'S', gradePoints: 10, marks: 92 },
      { courseCode: 'CSE1001', grade: 'A', gradePoints: 9, marks: 88 },
      { courseCode: 'EEE1001', grade: 'B', gradePoints: 8, marks: 75 },
      { courseCode: 'MEC1001', grade: 'C', gradePoints: 7, marks: 68 }
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
        const result = new SimpleResult({
          studentId: student._id,
          courseId: course._id,
          facultyId: faculty._id,
          academicYear: resultData.academicYear,
          semester: resultData.semester,
          assessments: {
            internal: {
              cat1: Math.floor(resultData.marks * 0.3),
              cat2: Math.floor(resultData.marks * 0.35),
              assignments: Math.floor(resultData.marks * 0.15),
              total: Math.floor(resultData.marks * 0.8)
            },
            external: {
              endSemExam: Math.floor(resultData.marks * 0.2),
              total: Math.floor(resultData.marks * 0.2)
            }
          },
          totalMarks: resultData.marks,
          grade: resultData.grade,
          gradePoints: resultData.gradePoints,
          credits: course.credits,
          status: 'Published',
          isActive: true
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