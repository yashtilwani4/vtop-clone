const express = require('express');
const Course = require('../models/Course');
const User = require('../models/User');
const { 
  authenticate, 
  requireAdmin, 
  requireFacultyOrAdmin,
  requireFaculty,
  requireStudent,
  authorizeCourse,
  authorizeDepartment 
} = require('../middleware/auth');
const { validateCourse, validatePagination, validateObjectId } = require('../middleware/validation');

const router = express.Router();

// @route   GET /api/courses
// @desc    Get all courses
// @access  Private
router.get('/', authenticate, validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const { department, semester, program, search, academicYear } = req.query;
    
    // Build filter
    const filter = { isActive: true };
    if (department) filter.department = department;
    if (semester) filter.semester = parseInt(semester);
    if (program) filter.program = program;
    if (academicYear) filter.academicYear = academicYear;
    if (search) {
      filter.$or = [
        { courseCode: { $regex: search, $options: 'i' } },
        { courseName: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Role-based filtering
    if (req.user.role === 'student') {
      filter.department = req.user.department;
      filter.program = req.user.program;
    } else if (req.user.role === 'faculty') {
      filter.department = req.user.department;
    }
    
    const courses = await Course.find(filter)
      .populate('faculty', 'firstName lastName designation')
      .sort({ courseCode: 1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Course.countDocuments(filter);
    
    res.json({
      success: true,
      data: {
        courses,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch courses',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/courses/:id
// @desc    Get course by ID
// @access  Private
router.get('/:id', authenticate, validateObjectId('id'), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('faculty', 'firstName lastName designation email')
      .populate('enrolledStudents.student', 'firstName lastName userId registrationNumber')
      .populate('prerequisites', 'courseCode courseName');
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }
    
    res.json({
      success: true,
      data: { course }
    });
  } catch (error) {
    console.error('Get course error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch course',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/courses
// @desc    Create new course
// @access  Private/Admin
router.post('/', authenticate, requireAdmin, validateCourse, async (req, res) => {
  try {
    const {
      courseCode,
      courseName,
      description,
      credits,
      department,
      semester,
      program,
      courseType,
      faculty,
      schedule,
      maxStudents,
      academicYear,
      prerequisites,
      assessmentStructure
    } = req.body;
    
    // Check if course code already exists
    const existingCourse = await Course.findOne({ courseCode: courseCode.toUpperCase() });
    if (existingCourse) {
      return res.status(400).json({
        success: false,
        message: 'Course with this code already exists'
      });
    }
    
    // Verify faculty exists
    const facultyUser = await User.findById(faculty);
    if (!facultyUser || facultyUser.role !== 'faculty') {
      return res.status(400).json({
        success: false,
        message: 'Invalid faculty ID'
      });
    }
    
    const course = new Course({
      courseCode: courseCode.toUpperCase(),
      courseName,
      description,
      credits,
      department,
      semester,
      program,
      courseType,
      faculty,
      schedule,
      maxStudents,
      academicYear,
      prerequisites,
      assessmentStructure
    });
    
    await course.save();
    
    // Add course to faculty's assigned courses
    await User.findByIdAndUpdate(faculty, {
      $addToSet: { assignedCourses: course._id }
    });
    
    await course.populate('faculty', 'firstName lastName designation');
    
    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      data: { course }
    });
  } catch (error) {
    console.error('Create course error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create course',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   PUT /api/courses/:id
// @desc    Update course
// @access  Private/Admin/Faculty
router.put('/:id', authenticate, validateObjectId('id'), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }
    
    // Check authorization
    if (req.user.role !== 'admin' && course.faculty.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    const allowedUpdates = [
      'courseName', 'description', 'schedule', 'assessmentStructure'
    ];
    
    // Admin can update additional fields
    if (req.user.role === 'admin') {
      allowedUpdates.push(
        'courseCode', 'credits', 'department', 'semester', 'program',
        'courseType', 'faculty', 'maxStudents', 'isActive', 'prerequisites'
      );
    }
    
    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });
    
    const updatedCourse = await Course.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate('faculty', 'firstName lastName designation');
    
    res.json({
      success: true,
      message: 'Course updated successfully',
      data: { course: updatedCourse }
    });
  } catch (error) {
    console.error('Update course error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update course',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   DELETE /api/courses/:id
// @desc    Delete course
// @access  Private/Admin
router.delete('/:id', authenticate, requireAdmin, validateObjectId('id'), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }
    
    // Soft delete
    course.isActive = false;
    await course.save();
    
    res.json({
      success: true,
      message: 'Course deleted successfully'
    });
  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete course',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/courses/:id/enroll
// @desc    Enroll student in course
// @access  Private/Student
router.post('/:id/enroll', authenticate, requireStudent, validateObjectId('id'), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }
    
    // Check if student can enroll
    if (!course.canEnroll(req.user._id)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot enroll in this course. Course may be full or you are already enrolled.'
      });
    }
    
    // Enroll student
    await course.enrollStudent(req.user._id);
    
    // Add course to student's enrolled courses
    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { enrolledCourses: course._id }
    });
    
    res.json({
      success: true,
      message: 'Successfully enrolled in course'
    });
  } catch (error) {
    console.error('Course enrollment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to enroll in course',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/courses/:id/drop
// @desc    Drop student from course
// @access  Private/Student
router.post('/:id/drop', authenticate, requireStudent, validateObjectId('id'), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }
    
    // Drop student
    await course.dropStudent(req.user._id);
    
    // Remove course from student's enrolled courses
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { enrolledCourses: course._id }
    });
    
    res.json({
      success: true,
      message: 'Successfully dropped from course'
    });
  } catch (error) {
    console.error('Course drop error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to drop from course',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/courses/my/enrolled
// @desc    Get student's enrolled courses
// @access  Private/Student
router.get('/my/enrolled', authenticate, requireStudent, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate({
        path: 'enrolledCourses',
        populate: {
          path: 'faculty',
          select: 'firstName lastName designation'
        }
      });
    
    res.json({
      success: true,
      data: { courses: user.enrolledCourses }
    });
  } catch (error) {
    console.error('Get enrolled courses error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch enrolled courses',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/courses/my/assigned
// @desc    Get faculty's assigned courses
// @access  Private/Faculty
router.get('/my/assigned', authenticate, requireFaculty, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('assignedCourses');
    
    res.json({
      success: true,
      data: { courses: user.assignedCourses }
    });
  } catch (error) {
    console.error('Get assigned courses error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch assigned courses',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;