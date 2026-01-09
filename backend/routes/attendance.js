const express = require('express');
const Attendance = require('../models/Attendance');
const Course = require('../models/Course');
const { authenticate, authorize } = require('../middleware/auth');
const { validateAttendance, validateObjectId, validateDateRange } = require('../middleware/validation');

const router = express.Router();

// @route   GET /api/attendance
// @desc    Get attendance records
// @access  Private/Faculty/Admin
router.get('/', authenticate, authorize('faculty', 'admin'), validateDateRange, async (req, res) => {
  try {
    const { course, startDate, endDate, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;
    
    const filter = {};
    if (course) filter.course = course;
    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    // Faculty can only see their own courses
    if (req.user.role === 'faculty') {
      filter.faculty = req.user._id;
    }
    
    const attendanceRecords = await Attendance.find(filter)
      .populate('course', 'courseCode courseName')
      .populate('faculty', 'firstName lastName')
      .populate('attendanceRecords.student', 'firstName lastName userId')
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Attendance.countDocuments(filter);
    
    res.json({
      success: true,
      data: {
        attendanceRecords,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch attendance records'
    });
  }
});

// @route   POST /api/attendance
// @desc    Create attendance record
// @access  Private/Faculty
router.post('/', authenticate, authorize('faculty'), validateAttendance, async (req, res) => {
  try {
    const {
      course,
      date,
      session,
      attendanceRecords
    } = req.body;
    
    // Verify course exists and faculty is assigned
    const courseDoc = await Course.findById(course);
    if (!courseDoc) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }
    
    if (courseDoc.faculty.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not assigned to this course'
      });
    }
    
    // Check if attendance already exists for this date and session
    const existingAttendance = await Attendance.findOne({
      course,
      date: new Date(date),
      'session.startTime': session.startTime,
      'session.endTime': session.endTime
    });
    
    if (existingAttendance) {
      return res.status(400).json({
        success: false,
        message: 'Attendance already recorded for this session'
      });
    }
    
    const attendance = new Attendance({
      course,
      faculty: req.user._id,
      date: new Date(date),
      session,
      attendanceRecords: attendanceRecords.map(record => ({
        ...record,
        markedBy: req.user._id
      })),
      totalStudents: attendanceRecords.length,
      isCompleted: true
    });
    
    await attendance.save();
    await attendance.populate('course', 'courseCode courseName');
    
    res.status(201).json({
      success: true,
      message: 'Attendance recorded successfully',
      data: { attendance }
    });
  } catch (error) {
    console.error('Create attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record attendance'
    });
  }
});

// @route   PUT /api/attendance/:id
// @desc    Update attendance record
// @access  Private/Faculty
router.put('/:id', authenticate, authorize('faculty'), validateObjectId('id'), async (req, res) => {
  try {
    const attendance = await Attendance.findById(req.params.id);
    
    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found'
      });
    }
    
    // Check if faculty owns this attendance record
    if (attendance.faculty.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    const { attendanceRecords, session } = req.body;
    
    if (attendanceRecords) {
      attendance.attendanceRecords = attendanceRecords.map(record => ({
        ...record,
        markedBy: req.user._id,
        markedAt: new Date()
      }));
    }
    
    if (session) {
      attendance.session = { ...attendance.session, ...session };
    }
    
    await attendance.save();
    
    res.json({
      success: true,
      message: 'Attendance updated successfully',
      data: { attendance }
    });
  } catch (error) {
    console.error('Update attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update attendance'
    });
  }
});

// @route   GET /api/attendance/student/:studentId
// @desc    Get student attendance summary
// @access  Private
router.get('/student/:studentId', authenticate, validateObjectId('studentId'), async (req, res) => {
  try {
    const { studentId } = req.params;
    const { courseId } = req.query;
    
    // Check authorization
    if (req.user.role === 'student' && req.user._id.toString() !== studentId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    const attendanceSummary = await Attendance.getStudentAttendanceSummary(studentId, courseId);
    
    res.json({
      success: true,
      data: { attendanceSummary }
    });
  } catch (error) {
    console.error('Get student attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch student attendance'
    });
  }
});

// @route   GET /api/attendance/course/:courseId/stats
// @desc    Get course attendance statistics
// @access  Private/Faculty/Admin
router.get('/course/:courseId/stats', authenticate, authorize('faculty', 'admin'), validateObjectId('courseId'), async (req, res) => {
  try {
    const { courseId } = req.params;
    const { startDate, endDate } = req.query;
    
    // Verify course access
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }
    
    if (req.user.role === 'faculty' && course.faculty.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    const stats = await Attendance.getCourseAttendanceStats(courseId, startDate, endDate);
    
    res.json({
      success: true,
      data: { stats: stats[0] || {} }
    });
  } catch (error) {
    console.error('Get course attendance stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch attendance statistics'
    });
  }
});

// @route   GET /api/attendance/my/summary
// @desc    Get current user's attendance summary
// @access  Private/Student
router.get('/my/summary', authenticate, authorize('student'), async (req, res) => {
  try {
    const attendanceSummary = await Attendance.getStudentAttendanceSummary(req.user._id);
    
    res.json({
      success: true,
      data: { attendanceSummary }
    });
  } catch (error) {
    console.error('Get my attendance summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch attendance summary'
    });
  }
});

module.exports = router;