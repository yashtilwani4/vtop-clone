const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

// Import models
const SimpleUser = require('../models/SimpleUser');
const SimpleCourse = require('../models/SimpleCourse');
const SimpleAttendance = require('../models/SimpleAttendance');
const SimpleTimetable = require('../models/SimpleTimetable');

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

const createRealData = async () => {
  try {
    console.log('📚 Creating real course and attendance data...');
    
    // Get Neha's student record
    const student = await SimpleUser.findOne({ registrationNumber: '24BCY10007' });
    if (!student) {
      console.log('❌ Student Neha not found');
      return;
    }
    
    // Create faculty members
    const facultyData = [
      {
        name: 'Dr. Sarah Johnson',
        email: 'sarah.johnson@vitbhopal.ac.in',
        password: 'faculty123',
        role: 'faculty'
      },
      {
        name: 'Prof. Lisa Davis',
        email: 'lisa.davis@vitbhopal.ac.in',
        password: 'faculty123',
        role: 'faculty'
      },
      {
        name: 'Prof. David Lee',
        email: 'david.lee@vitbhopal.ac.in',
        password: 'faculty123',
        role: 'faculty'
      },
      {
        name: 'Dr. Robert Wilson',
        email: 'robert.wilson@vitbhopal.ac.in',
        password: 'faculty123',
        role: 'faculty'
      },
      {
        name: 'Dr. Michael Brown',
        email: 'michael.brown@vitbhopal.ac.in',
        password: 'faculty123',
        role: 'faculty'
      }
    ];
    
    const createdFaculty = [];
    for (const facultyInfo of facultyData) {
      // Check if faculty already exists
      let faculty = await SimpleUser.findOne({ email: facultyInfo.email });
      if (!faculty) {
        faculty = new SimpleUser(facultyInfo);
        await faculty.save();
        console.log(`✅ Created faculty: ${faculty.name}`);
      } else {
        console.log(`ℹ️  Faculty already exists: ${faculty.name}`);
      }
      createdFaculty.push(faculty);
    }
    
    // Create courses with the provided data
    const coursesData = [
      {
        courseCode: 'CSE402',
        courseName: 'Database Management Systems',
        credits: 4,
        facultyId: createdFaculty[0]._id, // Dr. Sarah Johnson
        studentsEnrolled: [student._id]
      },
      {
        courseCode: 'CSE404',
        courseName: 'Web Development',
        credits: 3,
        facultyId: createdFaculty[1]._id, // Prof. Lisa Davis
        studentsEnrolled: [student._id]
      },
      {
        courseCode: 'CSE407',
        courseName: 'Software Engineering Lab',
        credits: 2,
        facultyId: createdFaculty[2]._id, // Prof. David Lee
        studentsEnrolled: [student._id]
      },
      {
        courseCode: 'MAT401',
        courseName: 'Advanced Mathematics',
        credits: 4,
        facultyId: createdFaculty[3]._id, // Dr. Robert Wilson
        studentsEnrolled: [student._id]
      },
      {
        courseCode: 'CSE403',
        courseName: 'Machine Learning',
        credits: 4,
        facultyId: createdFaculty[4]._id, // Dr. Michael Brown
        studentsEnrolled: [student._id]
      }
    ];
    
    const createdCourses = [];
    for (const courseData of coursesData) {
      // Check if course already exists
      let course = await SimpleCourse.findOne({ courseCode: courseData.courseCode });
      if (!course) {
        course = new SimpleCourse(courseData);
        await course.save();
        console.log(`✅ Created course: ${course.courseCode} - ${course.courseName}`);
      } else {
        console.log(`ℹ️  Course already exists: ${course.courseCode} - ${course.courseName}`);
        // Update the course to ensure student is enrolled
        if (!course.studentsEnrolled.includes(student._id)) {
          course.studentsEnrolled.push(student._id);
          await course.save();
          console.log(`✅ Added student to existing course: ${course.courseCode}`);
        }
      }
      createdCourses.push(course);
    }
    
    // Create attendance data based on the provided information
    const attendanceData = [
      {
        courseCode: 'CSE402',
        totalClasses: 45,
        attendedClasses: 42,
        percentage: 93.3,
        status: 'Good',
        lastFiveClasses: ['P', 'P', 'A', 'P', 'P'],
        lastClassTime: '04:00 PM',
        lastClassDate: 'Jan 8'
      },
      {
        courseCode: 'CSE404',
        totalClasses: 38,
        attendedClasses: 30,
        percentage: 79.0,
        status: 'Warning',
        lastFiveClasses: ['P', 'A', 'A', 'P', 'P'],
        lastClassTime: '07:45 PM',
        lastClassDate: 'Jan 8'
      },
      {
        courseCode: 'CSE407',
        totalClasses: 20,
        attendedClasses: 19,
        percentage: 95.0,
        status: 'Good',
        lastFiveClasses: ['P', 'P', 'P', 'A', 'P'],
        lastClassTime: '10:15 PM',
        lastClassDate: 'Jan 7'
      },
      {
        courseCode: 'MAT401',
        totalClasses: 42,
        attendedClasses: 28,
        percentage: 66.7,
        status: 'Critical',
        lastFiveClasses: ['A', 'A', 'P', 'A', 'P'],
        lastClassTime: '02:30 PM',
        lastClassDate: 'Jan 8'
      },
      {
        courseCode: 'CSE403',
        totalClasses: 35,
        attendedClasses: 26,
        percentage: 74.3,
        status: 'Warning',
        lastFiveClasses: ['P', 'P', 'A', 'A', 'P'],
        lastClassTime: '04:50 PM',
        lastClassDate: 'Jan 7'
      }
    ];
    
    // Create attendance records
    for (const attData of attendanceData) {
      const course = createdCourses.find(c => c.courseCode === attData.courseCode);
      if (!course) continue;
      
      // Generate individual attendance records for each class
      const attendanceRecords = generateAttendanceRecords(
        attData.totalClasses, 
        attData.attendedClasses, 
        attData.lastFiveClasses,
        student._id,
        course._id,
        course.facultyId
      );
      
      // Save each attendance record individually
      for (const record of attendanceRecords) {
        const attendance = new SimpleAttendance(record);
        await attendance.save();
      }
      
      console.log(`✅ Created ${attendanceRecords.length} attendance records for ${attData.courseCode}: ${attData.percentage}% (${attData.status})`);
    }
    
    // Create basic timetable entries
    const timetableData = [
      {
        courseCode: 'CSE402',
        dayOfWeek: 'Monday',
        startTime: '09:00',
        endTime: '10:00',
        room: 'CSE-201',
        type: 'Lecture'
      },
      {
        courseCode: 'CSE404',
        dayOfWeek: 'Tuesday',
        startTime: '14:00',
        endTime: '17:00',
        room: 'CSE-Lab1',
        type: 'Lab'
      },
      {
        courseCode: 'CSE407',
        dayOfWeek: 'Wednesday',
        startTime: '10:00',
        endTime: '13:00',
        room: 'CSE-Lab2',
        type: 'Lab'
      },
      {
        courseCode: 'MAT401',
        dayOfWeek: 'Thursday',
        startTime: '11:00',
        endTime: '12:00',
        room: 'MATH-101',
        type: 'Lecture'
      },
      {
        courseCode: 'CSE403',
        dayOfWeek: 'Friday',
        startTime: '15:00',
        endTime: '16:00',
        room: 'CSE-301',
        type: 'Lecture'
      }
    ];
    
    for (const ttData of timetableData) {
      const course = createdCourses.find(c => c.courseCode === ttData.courseCode);
      if (!course) continue;
      
      const timetable = new SimpleTimetable({
        courseId: course._id,
        facultyId: course.facultyId,
        academicYear: '2024-25',
        semester: 5,
        dayOfWeek: ttData.dayOfWeek,
        startTime: ttData.startTime,
        endTime: ttData.endTime,
        room: ttData.room,
        classType: ttData.type,
        studentsEnrolled: [student._id]
      });
      
      await timetable.save();
      console.log(`✅ Created timetable for ${ttData.courseCode}: ${ttData.dayOfWeek} ${ttData.startTime}-${ttData.endTime}`);
    }
    
    console.log('\n🎉 Real data created successfully!');
    console.log('\n📊 Summary:');
    console.log(`👥 Faculty: ${createdFaculty.length}`);
    console.log(`📚 Courses: ${createdCourses.length}`);
    console.log(`📋 Attendance Records: ${attendanceData.length}`);
    console.log(`🗓️  Timetable Entries: ${timetableData.length}`);
    
    console.log('\n📋 Course Summary:');
    for (const attData of attendanceData) {
      console.log(`${attData.courseCode}: ${attData.percentage}% attendance (${attData.status})`);
    }
    
  } catch (error) {
    console.error('❌ Error creating real data:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

// Helper function to generate attendance records
function generateAttendanceRecords(totalClasses, attendedClasses, lastFiveClasses, studentId, courseId, facultyId) {
  const records = [];
  const absentClasses = totalClasses - attendedClasses;
  
  // Calculate how many of the first (totalClasses - 5) should be absent
  const earlierAbsences = Math.max(0, absentClasses - lastFiveClasses.filter(status => status === 'A').length);
  
  // Generate records for all classes except the last 5
  for (let i = 0; i < totalClasses - 5; i++) {
    const isPresent = i >= earlierAbsences; // First 'earlierAbsences' classes are absent, rest are present
    const classDate = new Date();
    classDate.setDate(classDate.getDate() - (totalClasses - i)); // Go back in time
    
    records.push({
      courseId: courseId,
      studentId: studentId,
      facultyId: facultyId,
      date: classDate,
      status: isPresent ? 'Present' : 'Absent',
      session: {
        startTime: '09:00',
        endTime: '10:00',
        type: 'Lecture'
      },
      remarks: ''
    });
  }
  
  // Add the last 5 classes based on provided data
  lastFiveClasses.forEach((status, index) => {
    const classDate = new Date();
    classDate.setDate(classDate.getDate() - (5 - index)); // Last 5 days
    
    records.push({
      courseId: courseId,
      studentId: studentId,
      facultyId: facultyId,
      date: classDate,
      status: status === 'P' ? 'Present' : 'Absent',
      session: {
        startTime: '09:00',
        endTime: '10:00',
        type: 'Lecture'
      },
      remarks: ''
    });
  });
  
  return records;
}

createRealData();