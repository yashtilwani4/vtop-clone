const express = require('express');
const SimpleAttendance = require('../models/SimpleAttendance');
const SimpleCourse = require('../models/SimpleCourse');
const SimpleUser = require('../models/SimpleUser');

const router = express.Router();

// Simple authentication middleware (for demo purposes)
const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    // For demo purposes, we'll decode without verification
    // In production, use proper JWT verification
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    const user = await SimpleUser.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

// Authorization middleware for faculty
const requireFaculty = (req, res, next) => {
  if (!req.user || !['faculty', 'admin'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Faculty or admin access required'
    });
  }
  next();
};

// Authorization middleware for students
const requireStudent = (req, res, next) => {
  if (!req.user || req.user.role !== 'student') {
    return res.status(403).json({
      success: false,
      message: 'Student access required'
    });
  }
  next();
};

// @route   POST /api/simple-attendance/mark
// @desc    Mark attendance for students (Faculty only)
// @access  Private/Faculty
router.post('/mark', authenticate, requireFaculty, async (req, res) => {
  try {
    const {
      courseId,
      date,
      session,
      attendanceList // Array of { studentId, status, remarks? }
    } = req.body;

    // Validate required fields
    if (!courseId || !date || !session || !attendanceList || !Array.isArray(attendanceList)) {
      return res.status(400).json({
        success: false,
        message: 'Course ID, date, session, and attendance list are required'
      });
    }

    // Validate session structure
    if (!session.startTime || !session.endTime) {
      return res.status(400).json({
        success: false,
        message: 'Session start time and end time are required'
      });
    }

    // Validate course exists and faculty has access
    const course = await SimpleCourse.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check if faculty is assigned to this course (admin can mark for any course)
    if (req.user.role !== 'admin' && course.facultyId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not assigned to this course'
      });
    }

    // Validate attendance list
    if (attendanceList.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Attendance list cannot be empty'
      });
    }

    // Validate all students in the list
    for (const record of attendanceList) {
      if (!record.studentId || !record.status) {
        return res.status(400).json({
          success: false,
          message: 'Each attendance record must have studentId and status'
        });
      }

      if (!['Present', 'Absent', 'Late'].includes(record.status)) {
        return res.status(400).json({
          success: false,
          message: 'Status must be Present, Absent, or Late'
        });
      }

      // Check if student is enrolled in the course
      if (!course.studentsEnrolled.includes(record.studentId)) {
        const student = await SimpleUser.findById(record.studentId);
        return res.status(400).json({
          success: false,
          message: `Student ${student?.name || record.studentId} is not enrolled in this course`
        });
      }
    }

    // Mark bulk attendance
    const result = await SimpleAttendance.markBulkAttendance({
      courseId,
      facultyId: req.user._id,
      date,
      session,
      attendanceList
    });

    // Get the marked attendance records for response
    const markedAttendance = await SimpleAttendance.find({
      courseId,
      date: new Date(date)
    })
    .populate('studentId', 'name registrationNumber')
    .sort({ 'studentId.registrationNumber': 1 });

    res.json({
      success: true,
      message: 'Attendance marked successfully',
      data: {
        courseId,
        date,
        session,
        totalStudents: attendanceList.length,
        markedRecords: result.modifiedCount + result.upsertedCount,
        attendance: markedAttendance.map(record => ({
          studentId: record.studentId._id,
          studentName: record.studentId.name,
          registrationNumber: record.studentId.registrationNumber,
          status: record.status,
          remarks: record.remarks,
          markedAt: record.markedAt
        }))
      }
    });

  } catch (error) {
    console.error('Mark attendance error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Failed to mark attendance',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/simple-attendance/student/:studentId?
// @desc    Fetch attendance for a student (Student can only see own, Faculty/Admin can see any)
// @access  Private
router.get('/student/:studentId?', authenticate, async (req, res) => {
  try {
    let studentId = req.params.studentId;
    
    // If no studentId provided, use current user's ID (for students)
    if (!studentId) {
      if (req.user.role !== 'student') {
        return res.status(400).json({
          success: false,
          message: 'Student ID is required for non-student users'
        });
      }
      studentId = req.user._id;
    }

    // Authorization check: students can only see their own attendance
    if (req.user.role === 'student' && studentId !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Students can only view their own attendance'
      });
    }

    const { courseId, startDate, endDate, limit = 50, page = 1 } = req.query;

    // Validate student exists
    const student = await SimpleUser.findById(studentId);
    if (!student || student.role !== 'student') {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Build filter
    const filter = { studentId };
    if (courseId) filter.courseId = courseId;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    // Get attendance records with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const attendanceRecords = await SimpleAttendance.find(filter)
      .populate('courseId', 'courseCode courseName credits')
      .populate('facultyId', 'name')
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await SimpleAttendance.countDocuments(filter);

    // Get attendance summary by course
    const summary = await SimpleAttendance.getStudentSummary(studentId, startDate, endDate);

    // Calculate overall statistics
    const overallStats = summary.reduce((acc, course) => {
      acc.totalClasses += course.totalClasses;
      acc.attendedClasses += course.attendedClasses;
      acc.absentClasses += course.absentClasses;
      return acc;
    }, { totalClasses: 0, attendedClasses: 0, absentClasses: 0 });

    overallStats.percentage = overallStats.totalClasses > 0 
      ? Math.round((overallStats.attendedClasses / overallStats.totalClasses) * 100)
      : 0;

    overallStats.status = overallStats.percentage < 75 ? 'Critical' 
      : overallStats.percentage < 85 ? 'Warning' : 'Good';

    res.json({
      success: true,
      data: {
        student: {
          id: student._id,
          name: student.name,
          registrationNumber: student.registrationNumber
        },
        overallStats,
        courseWiseSummary: summary,
        recentAttendance: attendanceRecords.map(record => ({
          id: record._id,
          course: {
            id: record.courseId._id,
            code: record.courseId.courseCode,
            name: record.courseId.courseName
          },
          date: record.date,
          status: record.status,
          session: record.session,
          faculty: record.facultyId.name,
          remarks: record.remarks,
          markedAt: record.markedAt
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    console.error('Fetch student attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch attendance',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/simple-attendance/course/:courseId
// @desc    Get attendance overview for a course (Faculty only)
// @access  Private/Faculty
router.get('/course/:courseId', authenticate, requireFaculty, async (req, res) => {
  try {
    const { courseId } = req.params;
    const { date, startDate, endDate } = req.query;

    // Validate course exists and faculty has access
    const course = await SimpleCourse.findById(courseId)
      .populate('facultyId', 'name')
      .populate('studentsEnrolled', 'name registrationNumber');

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check if faculty is assigned to this course (admin can view any course)
    if (req.user.role !== 'admin' && course.facultyId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not assigned to this course'
      });
    }

    let attendanceData;

    if (date) {
      // Get attendance for a specific date
      attendanceData = await SimpleAttendance.getCourseOverview(courseId, date);
    } else {
      // Get attendance summary for date range or all time
      const filter = { courseId };
      if (startDate || endDate) {
        filter.date = {};
        if (startDate) filter.date.$gte = new Date(startDate);
        if (endDate) filter.date.$lte = new Date(endDate);
      }

      // Get attendance statistics
      const stats = await SimpleAttendance.aggregate([
        { $match: filter },
        {
          $group: {
            _id: '$studentId',
            totalClasses: { $sum: 1 },
            attendedClasses: {
              $sum: {
                $cond: [
                  { $in: ['$status', ['Present', 'Late']] },
                  1,
                  0
                ]
              }
            }
          }
        },
        {
          $lookup: {
            from: 'simpleusers',
            localField: '_id',
            foreignField: '_id',
            as: 'student'
          }
        },
        { $unwind: '$student' },
        {
          $addFields: {
            percentage: {
              $round: [
                {
                  $multiply: [
                    { $divide: ['$attendedClasses', '$totalClasses'] },
                    100
                  ]
                },
                0
              ]
            }
          }
        },
        {
          $addFields: {
            status: {
              $switch: {
                branches: [
                  { case: { $lt: ['$percentage', 75] }, then: 'Critical' },
                  { case: { $lt: ['$percentage', 85] }, then: 'Warning' },
                  { case: { $gte: ['$percentage', 85] }, then: 'Good' }
                ],
                default: 'No Data'
              }
            }
          }
        },
        { $sort: { 'student.registrationNumber': 1 } }
      ]);

      attendanceData = stats;
    }

    res.json({
      success: true,
      data: {
        course: {
          id: course._id,
          courseCode: course.courseCode,
          courseName: course.courseName,
          faculty: course.facultyId.name,
          totalStudents: course.studentsEnrolled.length
        },
        ...(date ? {
          date,
          dailyAttendance: attendanceData
        } : {
          attendanceStats: attendanceData.map(stat => ({
            student: {
              id: stat.student._id,
              name: stat.student.name,
              registrationNumber: stat.student.registrationNumber
            },
            totalClasses: stat.totalClasses,
            attendedClasses: stat.attendedClasses,
            absentClasses: stat.totalClasses - stat.attendedClasses,
            percentage: stat.percentage,
            status: stat.status
          }))
        })
      }
    });

  } catch (error) {
    console.error('Fetch course attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch course attendance',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/simple-attendance/percentage/:studentId/:courseId
// @desc    Calculate attendance percentage for a student in a course
// @access  Private
router.get('/percentage/:studentId/:courseId', authenticate, async (req, res) => {
  try {
    const { studentId, courseId } = req.params;
    const { startDate, endDate } = req.query;

    // Authorization check: students can only see their own percentage
    if (req.user.role === 'student' && studentId !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Students can only view their own attendance percentage'
      });
    }

    // Validate student and course exist
    const student = await SimpleUser.findById(studentId);
    const course = await SimpleCourse.findById(courseId);

    if (!student || student.role !== 'student') {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check if student is enrolled in the course
    if (!course.studentsEnrolled.includes(studentId)) {
      return res.status(400).json({
        success: false,
        message: 'Student is not enrolled in this course'
      });
    }

    // Calculate attendance percentage
    const percentage = await SimpleAttendance.calculatePercentage(
      studentId, 
      courseId, 
      startDate, 
      endDate
    );

    res.json({
      success: true,
      data: {
        student: {
          id: student._id,
          name: student.name,
          registrationNumber: student.registrationNumber
        },
        course: {
          id: course._id,
          courseCode: course.courseCode,
          courseName: course.courseName
        },
        dateRange: {
          startDate: startDate || 'All time',
          endDate: endDate || 'All time'
        },
        attendance: percentage
      }
    });

  } catch (error) {
    console.error('Calculate percentage error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate attendance percentage',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/simple-attendance/my-attendance
// @desc    Get current student's attendance summary (Student only)
// @access  Private/Student
router.get('/my-attendance', authenticate, requireStudent, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Get attendance summary for the current student
    const summary = await SimpleAttendance.getStudentSummary(req.user._id, startDate, endDate);

    // Calculate overall statistics
    const overallStats = summary.reduce((acc, course) => {
      acc.totalClasses += course.totalClasses;
      acc.attendedClasses += course.attendedClasses;
      acc.absentClasses += course.absentClasses;
      return acc;
    }, { totalClasses: 0, attendedClasses: 0, absentClasses: 0 });

    overallStats.percentage = overallStats.totalClasses > 0 
      ? Math.round((overallStats.attendedClasses / overallStats.totalClasses) * 100)
      : 0;

    overallStats.status = overallStats.percentage < 75 ? 'Critical' 
      : overallStats.percentage < 85 ? 'Warning' : 'Good';

    res.json({
      success: true,
      data: {
        student: {
          id: req.user._id,
          name: req.user.name,
          registrationNumber: req.user.registrationNumber
        },
        dateRange: {
          startDate: startDate || 'All time',
          endDate: endDate || 'All time'
        },
        overallStats,
        courseWiseAttendance: summary
      }
    });

  } catch (error) {
    console.error('Get my attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch attendance',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   PUT /api/simple-attendance/:id
// @desc    Update attendance record (Faculty only)
// @access  Private/Faculty
router.put('/:id', authenticate, requireFaculty, async (req, res) => {
  try {
    const { status, remarks } = req.body;

    if (!status || !['Present', 'Absent', 'Late'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Valid status (Present, Absent, Late) is required'
      });
    }

    const attendance = await SimpleAttendance.findById(req.params.id)
      .populate('courseId', 'facultyId');

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found'
      });
    }

    // Check if faculty is assigned to this course (admin can update any)
    if (req.user.role !== 'admin' && attendance.courseId.facultyId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only update attendance for your courses'
      });
    }

    attendance.status = status;
    if (remarks !== undefined) attendance.remarks = remarks;
    attendance.markedAt = new Date();

    await attendance.save();

    await attendance.populate('studentId', 'name registrationNumber');
    await attendance.populate('courseId', 'courseCode courseName');

    res.json({
      success: true,
      message: 'Attendance updated successfully',
      data: {
        id: attendance._id,
        student: {
          id: attendance.studentId._id,
          name: attendance.studentId.name,
          registrationNumber: attendance.studentId.registrationNumber
        },
        course: {
          id: attendance.courseId._id,
          code: attendance.courseId.courseCode,
          name: attendance.courseId.courseName
        },
        date: attendance.date,
        status: attendance.status,
        session: attendance.session,
        remarks: attendance.remarks,
        markedAt: attendance.markedAt
      }
    });

  } catch (error) {
    console.error('Update attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update attendance',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;