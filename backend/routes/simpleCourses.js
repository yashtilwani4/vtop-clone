const express = require('express');
const SimpleCourse = require('../models/SimpleCourse');
const SimpleUser = require('../models/SimpleUser');

const router = express.Router();

// @route   POST /api/simple-courses
// @desc    Create a new course
// @access  Public (for demo purposes)
router.post('/', async (req, res) => {
  try {
    const { courseCode, courseName, credits, facultyId, studentsEnrolled = [] } = req.body;

    // Check if course code already exists
    const existingCourse = await SimpleCourse.findOne({ courseCode });
    if (existingCourse) {
      return res.status(400).json({
        success: false,
        message: 'Course with this code already exists'
      });
    }

    // Verify faculty exists and has correct role
    const faculty = await SimpleUser.findById(facultyId);
    if (!faculty) {
      return res.status(400).json({
        success: false,
        message: 'Faculty not found'
      });
    }

    if (faculty.role !== 'faculty' && faculty.role !== 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Only faculty or admin users can be assigned to courses'
      });
    }

    // Create course
    const course = new SimpleCourse({
      courseCode,
      courseName,
      credits,
      facultyId,
      studentsEnrolled
    });

    await course.save();

    // Populate the response
    await course.populate('facultyId', 'name email role');
    await course.populate('studentsEnrolled', 'name email registrationNumber');

    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      data: {
        course: {
          id: course._id,
          courseCode: course.courseCode,
          courseName: course.courseName,
          credits: course.credits,
          faculty: course.facultyId,
          studentsEnrolled: course.studentsEnrolled,
          enrollmentCount: course.enrollmentCount,
          createdAt: course.createdAt
        }
      }
    });

  } catch (error) {
    console.error('Create course error:', error);
    
    // Handle validation errors
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
      message: 'Failed to create course',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/simple-courses
// @desc    Get all courses
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { facultyId, studentId, credits, limit = 20, page = 1 } = req.query;
    
    // Build filter
    const filter = {};
    if (facultyId) filter.facultyId = facultyId;
    if (studentId) filter.studentsEnrolled = studentId;
    if (credits) filter.credits = parseInt(credits);

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const courses = await SimpleCourse.find(filter)
      .populate('facultyId', 'name email role')
      .populate('studentsEnrolled', 'name email registrationNumber')
      .sort({ courseCode: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await SimpleCourse.countDocuments(filter);

    res.json({
      success: true,
      data: {
        courses: courses.map(course => ({
          id: course._id,
          courseCode: course.courseCode,
          courseName: course.courseName,
          credits: course.credits,
          faculty: course.facultyId,
          studentsEnrolled: course.studentsEnrolled,
          enrollmentCount: course.enrollmentCount,
          createdAt: course.createdAt
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
    console.error('Get courses error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get courses',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/simple-courses/:id
// @desc    Get course by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const course = await SimpleCourse.findById(req.params.id)
      .populate('facultyId', 'name email role')
      .populate('studentsEnrolled', 'name email registrationNumber');

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    res.json({
      success: true,
      data: {
        course: {
          id: course._id,
          courseCode: course.courseCode,
          courseName: course.courseName,
          credits: course.credits,
          faculty: course.facultyId,
          studentsEnrolled: course.studentsEnrolled,
          enrollmentCount: course.enrollmentCount,
          isFull: course.isFull,
          createdAt: course.createdAt,
          updatedAt: course.updatedAt
        }
      }
    });

  } catch (error) {
    console.error('Get course error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get course',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   PUT /api/simple-courses/:id
// @desc    Update course
// @access  Public (for demo purposes)
router.put('/:id', async (req, res) => {
  try {
    const { courseCode, courseName, credits, facultyId } = req.body;
    
    const course = await SimpleCourse.findById(req.params.id);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check if new course code conflicts with existing courses
    if (courseCode && courseCode !== course.courseCode) {
      const existingCourse = await SimpleCourse.findOne({ courseCode });
      if (existingCourse) {
        return res.status(400).json({
          success: false,
          message: 'Course code already exists'
        });
      }
    }

    // Verify new faculty if provided
    if (facultyId && facultyId !== course.facultyId.toString()) {
      const faculty = await SimpleUser.findById(facultyId);
      if (!faculty) {
        return res.status(400).json({
          success: false,
          message: 'Faculty not found'
        });
      }
      if (faculty.role !== 'faculty' && faculty.role !== 'admin') {
        return res.status(400).json({
          success: false,
          message: 'Only faculty or admin users can be assigned to courses'
        });
      }
    }

    // Update fields
    if (courseCode) course.courseCode = courseCode;
    if (courseName) course.courseName = courseName;
    if (credits) course.credits = credits;
    if (facultyId) course.facultyId = facultyId;

    await course.save();

    // Populate the response
    await course.populate('facultyId', 'name email role');
    await course.populate('studentsEnrolled', 'name email registrationNumber');

    res.json({
      success: true,
      message: 'Course updated successfully',
      data: {
        course: {
          id: course._id,
          courseCode: course.courseCode,
          courseName: course.courseName,
          credits: course.credits,
          faculty: course.facultyId,
          studentsEnrolled: course.studentsEnrolled,
          enrollmentCount: course.enrollmentCount,
          updatedAt: course.updatedAt
        }
      }
    });

  } catch (error) {
    console.error('Update course error:', error);
    
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
      message: 'Failed to update course',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   DELETE /api/simple-courses/:id
// @desc    Delete course
// @access  Public (for demo purposes)
router.delete('/:id', async (req, res) => {
  try {
    const course = await SimpleCourse.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    await SimpleCourse.findByIdAndDelete(req.params.id);

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

// @route   POST /api/simple-courses/:id/enroll
// @desc    Enroll student in course
// @access  Public (for demo purposes)
router.post('/:id/enroll', async (req, res) => {
  try {
    const { studentId } = req.body;
    
    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: 'Student ID is required'
      });
    }

    const course = await SimpleCourse.findById(req.params.id);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check if student exists and is actually a student
    const student = await SimpleUser.findById(studentId);
    if (!student) {
      return res.status(400).json({
        success: false,
        message: 'Student not found'
      });
    }

    if (student.role !== 'student') {
      return res.status(400).json({
        success: false,
        message: 'Only students can be enrolled in courses'
      });
    }

    // Check if already enrolled
    if (course.isStudentEnrolled(studentId)) {
      return res.status(400).json({
        success: false,
        message: 'Student is already enrolled in this course'
      });
    }

    // Enroll student
    await course.enrollStudent(studentId);
    await course.populate('studentsEnrolled', 'name email registrationNumber');

    res.json({
      success: true,
      message: 'Student enrolled successfully',
      data: {
        course: {
          id: course._id,
          courseCode: course.courseCode,
          courseName: course.courseName,
          enrollmentCount: course.enrollmentCount,
          studentsEnrolled: course.studentsEnrolled
        }
      }
    });

  } catch (error) {
    console.error('Enroll student error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to enroll student',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/simple-courses/:id/unenroll
// @desc    Unenroll student from course
// @access  Public (for demo purposes)
router.post('/:id/unenroll', async (req, res) => {
  try {
    const { studentId } = req.body;
    
    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: 'Student ID is required'
      });
    }

    const course = await SimpleCourse.findById(req.params.id);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Unenroll student
    await course.unenrollStudent(studentId);
    await course.populate('studentsEnrolled', 'name email registrationNumber');

    res.json({
      success: true,
      message: 'Student unenrolled successfully',
      data: {
        course: {
          id: course._id,
          courseCode: course.courseCode,
          courseName: course.courseName,
          enrollmentCount: course.enrollmentCount,
          studentsEnrolled: course.studentsEnrolled
        }
      }
    });

  } catch (error) {
    console.error('Unenroll student error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to unenroll student',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/simple-courses/faculty/:facultyId
// @desc    Get courses by faculty
// @access  Public
router.get('/faculty/:facultyId', async (req, res) => {
  try {
    const courses = await SimpleCourse.findByFaculty(req.params.facultyId);

    res.json({
      success: true,
      data: {
        courses: courses.map(course => ({
          id: course._id,
          courseCode: course.courseCode,
          courseName: course.courseName,
          credits: course.credits,
          faculty: course.facultyId,
          enrollmentCount: course.enrollmentCount,
          createdAt: course.createdAt
        })),
        count: courses.length
      }
    });

  } catch (error) {
    console.error('Get courses by faculty error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get courses by faculty',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/simple-courses/student/:studentId
// @desc    Get courses by student
// @access  Public
router.get('/student/:studentId', async (req, res) => {
  try {
    const courses = await SimpleCourse.findByStudent(req.params.studentId);

    res.json({
      success: true,
      data: {
        courses: courses.map(course => ({
          id: course._id,
          courseCode: course.courseCode,
          courseName: course.courseName,
          credits: course.credits,
          faculty: course.facultyId,
          enrollmentCount: course.enrollmentCount,
          createdAt: course.createdAt
        })),
        count: courses.length
      }
    });

  } catch (error) {
    console.error('Get courses by student error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get courses by student',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/simple-courses/stats/overview
// @desc    Get course statistics
// @access  Public
router.get('/stats/overview', async (req, res) => {
  try {
    const stats = await SimpleCourse.getStatistics();

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Get course stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get course statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;