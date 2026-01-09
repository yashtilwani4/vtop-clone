const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const SimpleUser = require('../models/SimpleUser');
const SimpleCourse = require('../models/SimpleCourse');
const SimpleResult = require('../models/SimpleResult');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected for results creation'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

const createSampleResults = async () => {
  try {
    console.log('📊 Creating comprehensive sample results...');

    // Find the student with registration number 24BCY10007
    const student = await SimpleUser.findOne({ registrationNumber: '24BCY10007' });
    if (!student) {
      console.log('❌ Student with registration number 24BCY10007 not found');
      return;
    }

    // Create sample courses for the interim semester
    const interimCourses = [
      {
        courseCode: 'CHY1007',
        courseName: 'Forensic Chemistry and Applications',
        credits: 4,
        facultyId: (await SimpleUser.findOne({ role: 'faculty' }))._id,
        studentsEnrolled: [student._id]
      },
      {
        courseCode: 'CSA2001',
        courseName: 'Fundamentals in AI & ML',
        credits: 4,
        facultyId: (await SimpleUser.findOne({ role: 'faculty' }))._id,
        studentsEnrolled: [student._id]
      },
      {
        courseCode: 'CSE0001',
        courseName: 'Digital Literacy',
        credits: 1,
        facultyId: (await SimpleUser.findOne({ role: 'faculty' }))._id,
        studentsEnrolled: [student._id]
      },
      {
        courseCode: 'EEE1001',
        courseName: 'Electric Circuits and Systems',
        credits: 4,
        facultyId: (await SimpleUser.findOne({ role: 'faculty' }))._id,
        studentsEnrolled: [student._id]
      },
      {
        courseCode: 'ENG1004',
        courseName: 'Effective Technical Communication',
        credits: 2,
        facultyId: (await SimpleUser.findOne({ role: 'faculty' }))._id,
        studentsEnrolled: [student._id]
      },
      {
        courseCode: 'MAT1003',
        courseName: 'Calculus',
        credits: 4,
        facultyId: (await SimpleUser.findOne({ role: 'faculty' }))._id,
        studentsEnrolled: [student._id]
      },
      {
        courseCode: 'UHV0001',
        courseName: 'Universal Human Values - I',
        credits: 1,
        facultyId: (await SimpleUser.findOne({ role: 'faculty' }))._id,
        studentsEnrolled: [student._id]
      }
    ];

    // Create courses
    const createdCourses = [];
    for (const courseData of interimCourses) {
      // Check if course already exists
      let course = await SimpleCourse.findOne({ courseCode: courseData.courseCode });
      if (!course) {
        course = new SimpleCourse(courseData);
        await course.save();
      }
      createdCourses.push(course);
    }
    console.log('📚 Created interim semester courses');

    // Sample results data matching the format you provided
    const resultsData = [
      { courseCode: 'CHY1007', grandTotal: 68, grade: 'D' },
      { courseCode: 'CSA2001', grandTotal: 74, grade: 'C' },
      { courseCode: 'CSE0001', grandTotal: 93, grade: 'P' },
      { courseCode: 'EEE1001', grandTotal: 55, grade: 'E' },
      { courseCode: 'ENG1004', grandTotal: 75, grade: 'C' },
      { courseCode: 'MAT1003', grandTotal: 52, grade: 'E' },
      { courseCode: 'UHV0001', grandTotal: 91, grade: 'P' }
    ];

    // Create results
    const faculty = await SimpleUser.findOne({ role: 'faculty' });
    
    for (const resultData of resultsData) {
      const course = createdCourses.find(c => c.courseCode === resultData.courseCode);
      if (!course) continue;

      // Check if result already exists
      const existingResult = await SimpleResult.findOne({
        studentId: student._id,
        courseId: course._id,
        academicYear: '2024-25',
        semester: 1 // First semester
      });

      if (existingResult) {
        console.log(`Result for ${resultData.courseCode} already exists, skipping...`);
        continue;
      }

      // Calculate component marks based on total
      const total = resultData.grandTotal;
      const internalMarks = Math.round(total * 0.4); // 40% internal
      const externalMarks = Math.round(total * 0.6); // 60% external

      const result = new SimpleResult({
        studentId: student._id,
        courseId: course._id,
        facultyId: faculty._id,
        academicYear: '2024-25',
        semester: 1, // First semester
        assessments: {
          internal: {
            midterm: { maxMarks: 50, obtainedMarks: Math.round(internalMarks * 0.5), weightage: 20 },
            assignments: { maxMarks: 30, obtainedMarks: Math.round(internalMarks * 0.25), weightage: 10 },
            quiz: { maxMarks: 20, obtainedMarks: Math.round(internalMarks * 0.25), weightage: 10 }
          },
          external: {
            endterm: { maxMarks: 100, obtainedMarks: externalMarks, weightage: 60 }
          }
        },
        totalMarks: total,
        grade: resultData.grade,
        gradePoints: getGradePoints(resultData.grade),
        status: 'Published',
        publishedAt: new Date()
      });

      await result.save();
      console.log(`✅ Created result for ${resultData.courseCode}: ${total} marks, Grade ${resultData.grade}`);
    }

    // Calculate and display GPA
    const gpaData = await SimpleResult.calculateCGPA(student._id, '2024-25', 1);
    console.log(`\n📊 Student Results Summary:`);
    console.log(`Student: ${student.name} (${student.registrationNumber})`);
    console.log(`Semester: First Semester (Interim)`);  
    console.log(`GPA: ${gpaData.cgpa}`);
    console.log(`Total Credits: ${gpaData.totalCredits}`);
    console.log(`Courses Completed: ${gpaData.coursesCompleted}/${gpaData.totalCourses}`);

    console.log('\n✅ Sample results created successfully!');

  } catch (error) {
    console.error('❌ Error creating results:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

// Helper function to get grade points
function getGradePoints(grade) {
  const gradePoints = {
    'S': 10, 'A': 9, 'B': 8, 'C': 7, 'D': 6, 'E': 5, 'F': 0, 'P': 0, 'I': 0, 'W': 0
  };
  return gradePoints[grade] || 0;
}

createSampleResults();