const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const SimpleUser = require('../models/SimpleUser');
const SimpleCourse = require('../models/SimpleCourse');
const SimpleNotice = require('../models/SimpleNotice');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected for seeding'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

const seedData = async () => {
  try {
    console.log('🌱 Starting data seeding...');

    // Clear existing data
    await SimpleUser.deleteMany({});
    await SimpleCourse.deleteMany({});
    await SimpleNotice.deleteMany({});
    console.log('🗑️  Cleared existing data');

    // Create Admin User
    const adminUser = new SimpleUser({
      name: 'System Administrator',
      email: 'admin@vitbhopal.ac.in',
      password: 'admin123',
      role: 'admin'
    });
    await adminUser.save();
    console.log('👤 Created admin user');

    // Create Faculty Users
    const facultyUsers = [
      {
        name: 'John Doe',
        email: 'john.doe@vitbhopal.ac.in',
        password: 'faculty123',
        role: 'faculty'
      },
      {
        name: 'Jane Smith',
        email: 'jane.smith@vitbhopal.ac.in',
        password: 'faculty123',
        role: 'faculty'
      }
    ];

    for (const userData of facultyUsers) {
      const user = new SimpleUser(userData);
      await user.save();
    }
    console.log('👨‍🏫 Created faculty users');

    // Create Student Users
    const studentUsers = [
      {
        name: 'Alice Wilson',
        email: 'alice.wilson@student.vitbhopal.ac.in',
        password: 'student123',
        role: 'student',
        registrationNumber: '22BCE10405'
      },
      {
        name: 'Neha Ajay Babel',
        email: 'neha.24bcy10007@vitbhopal.ac.in',
        password: 'nehababel@2026',
        role: 'student',
        registrationNumber: '24BCY10007'
      }
    ];

    for (const userData of studentUsers) {
      const user = new SimpleUser(userData);
      await user.save();
    }
    console.log('👨‍🎓 Created student users');

    // Create Sample Courses
    const courses = [
      {
        courseCode: 'CSE101',
        courseName: 'Introduction to Programming',
        credits: 4,
        facultyId: (await SimpleUser.findOne({ email: 'john.doe@vitbhopal.ac.in' }))._id,
        studentsEnrolled: []
      },
      {
        courseCode: 'CSE201',
        courseName: 'Data Structures and Algorithms',
        credits: 4,
        facultyId: (await SimpleUser.findOne({ email: 'jane.smith@vitbhopal.ac.in' }))._id,
        studentsEnrolled: []
      }
    ];

    const createdCourses = [];
    for (const courseData of courses) {
      const course = new SimpleCourse(courseData);
      await course.save();
      createdCourses.push(course);
    }

    // Enroll students in courses
    const students = await SimpleUser.find({ role: 'student' });
    for (const course of createdCourses) {
      course.studentsEnrolled = students.map(s => s._id);
      await course.save();
    }
    console.log('📚 Created courses and enrolled students');

    // Create Sample Notices
    const notices = [
      {
        title: 'Welcome to VTOP Portal',
        content: 'Welcome to the new VTOP academic portal. Please update your profile information.',
        category: 'general',
        priority: 'high',
        targetAudience: {
          roles: ['student', 'faculty', 'admin']
        },
        isPublished: true,
        publishedAt: new Date(),
        createdBy: adminUser._id
      },
      {
        title: 'Semester Registration Open',
        content: 'Course registration for the upcoming semester is now open. Please register before the deadline.',
        category: 'academic',
        priority: 'high',
        targetAudience: {
          roles: ['student']
        },
        isPublished: true,
        publishedAt: new Date(),
        createdBy: adminUser._id
      }
    ];

    for (const noticeData of notices) {
      const notice = new SimpleNotice(noticeData);
      await notice.save();
    }
    console.log('📢 Created sample notices');

    // Create Sample Results
    const sampleResults = [
      {
        studentId: students[0]._id, // Alice Wilson (22BCE10405)
        courseId: createdCourses[0]._id,
        facultyId: (await SimpleUser.findOne({ email: 'john.doe@vitbhopal.ac.in' }))._id,
        academicYear: '2024-25',
        semester: 1,
        assessments: {
          internal: {
            midterm: { maxMarks: 50, obtainedMarks: 35, weightage: 20 },
            assignments: { maxMarks: 30, obtainedMarks: 25, weightage: 10 },
            quiz: { maxMarks: 20, obtainedMarks: 18, weightage: 10 }
          },
          external: {
            endterm: { maxMarks: 100, obtainedMarks: 68, weightage: 60 }
          }
        },
        status: 'Published'
      },
      {
        studentId: students[1]._id, // Bob Johnson (24BCY10007)
        courseId: createdCourses[1]._id,
        facultyId: (await SimpleUser.findOne({ email: 'jane.smith@vitbhopal.ac.in' }))._id,
        academicYear: '2024-25',
        semester: 1,
        assessments: {
          internal: {
            midterm: { maxMarks: 50, obtainedMarks: 40, weightage: 20 },
            assignments: { maxMarks: 30, obtainedMarks: 28, weightage: 10 },
            quiz: { maxMarks: 20, obtainedMarks: 16, weightage: 10 }
          },
          external: {
            endterm: { maxMarks: 100, obtainedMarks: 74, weightage: 60 }
          }
        },
        status: 'Published'
      }
    ];

    // Create results and calculate grades
    const SimpleResult = require('./models/SimpleResult');
    for (const resultData of sampleResults) {
      const result = new SimpleResult(resultData);
      await result.calculateTotalAndGrade();
    }
    console.log('📊 Created sample results');

    console.log('✅ Data seeding completed successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('Admin: admin@vitbhopal.ac.in / admin123');
    console.log('Faculty: john.doe@vitbhopal.ac.in / faculty123');
    console.log('Student: alice.wilson@student.vitbhopal.ac.in / student123');
    console.log('Student: neha.24bcy10007@vitbhopal.ac.in / nehababel@2026');
    console.log('Student (Reg No): 22BCE10405 / student123');
    console.log('Student (Reg No): 24BCY10007 / nehababel@2026');

  } catch (error) {
    console.error('❌ Seeding error:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

seedData();