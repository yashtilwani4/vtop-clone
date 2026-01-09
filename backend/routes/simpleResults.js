const express = require('express');
const SimpleResult = require('../models/SimpleResult');
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

// @route   POST /api/simple-results/upload
// @desc    Upload marks for students (Faculty only)
// @access  Private/Faculty
router.post('/upload', authenticate, requireFaculty, async (req, res) => {
  try {
    const {
      courseId,
      academicYear,
      semester,
      results // Array of { studentId, assessments, remarks? }
    } = req.body;

    // Validate required fields
    if (!courseId || !academicYear || !semester || !results || !Array.isArray(results)) {
      return res.status(400).json({
        success: false,
        message: 'Course ID, academic year, semester, and results array are required'
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

    // Check if faculty is assigned to this course (admin can upload for any course)
    if (req.user.role !== 'admin' && course.facultyId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not assigned to this course'
      });
    }

    // Validate results array
    if (results.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Results array cannot be empty'
      });
    }

    // Validate each result entry
    for (const result of results) {
      if (!result.studentId || !result.assessments) {
        return res.status(400).json({
          success: false,
          message: 'Each result must have studentId and assessments'
        });
      }

      // Check if student is enrolled in the course
      if (!course.studentsEnrolled.includes(result.studentId)) {
        const student = await SimpleUser.findById(result.studentId);
        return res.status(400).json({
          success: false,
          message: `Student ${student?.name || result.studentId} is not enrolled in this course`
        });
      }
    }

    // Upload marks using bulk operation
    const bulkResult = await SimpleResult.bulkUploadMarks({
      courseId,
      facultyId: req.user._id,
      academicYear,
      semester,
      results
    });

    // Get the uploaded results for response
    const uploadedResults = await SimpleResult.find({
      courseId,
      academicYear,
      semester,
      studentId: { $in: results.map(r => r.studentId) }
    })
    .populate('studentId', 'name registrationNumber')
    .sort({ 'studentId.registrationNumber': 1 });

    res.json({
      success: true,
      message: 'Marks uploaded successfully',
      data: {
        courseId,
        academicYear,
        semester,
        totalStudents: results.length,
        uploadedRecords: bulkResult.modifiedCount + bulkResult.upsertedCount,
        results: uploadedResults.map(result => ({
          student: {
            id: result.studentId._id,
            name: result.studentId.name,
            registrationNumber: result.studentId.registrationNumber
          },
          totalMarks: result.totalMarks,
          grade: result.grade,
          gradePoints: result.gradePoints,
          status: result.status,
          assessments: result.assessments,
          uploadedAt: result.updatedAt
        }))
      }
    });

  } catch (error) {
    console.error('Upload marks error:', error);
    
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
      message: error.message || 'Failed to upload marks',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/simple-results/calculate-grades
// @desc    Calculate grades for uploaded marks (Faculty only)
// @access  Private/Faculty
router.post('/calculate-grades', authenticate, requireFaculty, async (req, res) => {
  try {
    const { courseId, academicYear, semester } = req.body;

    if (!courseId || !academicYear || !semester) {
      return res.status(400).json({
        success: false,
        message: 'Course ID, academic year, and semester are required'
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

    if (req.user.role !== 'admin' && course.facultyId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not assigned to this course'
      });
    }

    // Find all results for the course and semester
    const results = await SimpleResult.find({
      courseId,
      academicYear,
      semester
    }).populate('studentId', 'name registrationNumber');

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No results found for the specified course and semester'
      });
    }

    // Calculate grades for all results
    const calculatedResults = [];
    for (const result of results) {
      await result.calculateTotalAndGrade();
      calculatedResults.push({
        student: {
          id: result.studentId._id,
          name: result.studentId.name,
          registrationNumber: result.studentId.registrationNumber
        },
        totalMarks: result.totalMarks,
        grade: result.grade,
        gradePoints: result.gradePoints,
        status: result.isPassed ? 'Pass' : 'Fail'
      });
    }

    // Calculate class statistics
    const totalStudents = calculatedResults.length;
    const passedStudents = calculatedResults.filter(r => r.status === 'Pass').length;
    const averageMarks = calculatedResults.reduce((sum, r) => sum + r.totalMarks, 0) / totalStudents;
    
    const gradeDistribution = calculatedResults.reduce((acc, r) => {
      acc[r.grade] = (acc[r.grade] || 0) + 1;
      return acc;
    }, {});

    res.json({
      success: true,
      message: 'Grades calculated successfully',
      data: {
        course: {
          id: course._id,
          code: course.courseCode,
          name: course.courseName
        },
        academicYear,
        semester,
        statistics: {
          totalStudents,
          passedStudents,
          failedStudents: totalStudents - passedStudents,
          passPercentage: Math.round((passedStudents / totalStudents) * 100),
          averageMarks: Math.round(averageMarks * 100) / 100,
          gradeDistribution
        },
        results: calculatedResults
      }
    });

  } catch (error) {
    console.error('Calculate grades error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate grades',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/simple-results/student/:studentId?
// @desc    Fetch student results securely (Student can only see own, Faculty/Admin can see any)
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

    // Authorization check: students can only see their own results
    if (req.user.role === 'student' && studentId !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Students can only view their own results'
      });
    }

    const { academicYear, semester, courseId } = req.query;

    // Validate student exists
    const student = await SimpleUser.findById(studentId);
    if (!student || student.role !== 'student') {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Build filter for published results only
    const filter = { 
      studentId, 
      status: 'Published' // Only show published results to maintain security
    };
    
    if (academicYear) filter.academicYear = academicYear;
    if (semester) filter.semester = semester;
    if (courseId) filter.courseId = courseId;

    // Get results with course details
    const results = await SimpleResult.find(filter)
      .populate('courseId', 'courseCode courseName credits')
      .populate('facultyId', 'name')
      .sort({ academicYear: -1, semester: -1 });

    // Calculate CGPA
    const cgpaData = await SimpleResult.calculateCGPA(studentId, academicYear, semester);

    // Get semester-wise summary if no specific filters
    let semesterSummaries = [];
    if (!academicYear && !semester && !courseId) {
      const distinctSemesters = await SimpleResult.distinct('academicYear', { 
        studentId, 
        status: 'Published' 
      });
      
      for (const year of distinctSemesters) {
        const semesters = await SimpleResult.distinct('semester', { 
          studentId, 
          academicYear: year, 
          status: 'Published' 
        });
        
        for (const sem of semesters) {
          const summary = await SimpleResult.getSemesterSummary(studentId, year, sem);
          if (summary.results.length > 0) {
            semesterSummaries.push({
              academicYear: year,
              semester: sem,
              ...summary.summary
            });
          }
        }
      }
    }

    res.json({
      success: true,
      data: {
        student: {
          id: student._id,
          name: student.name,
          registrationNumber: student.registrationNumber
        },
        cgpa: cgpaData,
        semesterSummaries,
        results: results.map(result => ({
          id: result._id,
          course: {
            id: result.courseId._id,
            code: result.courseId.courseCode,
            name: result.courseId.courseName,
            credits: result.courseId.credits
          },
          academicYear: result.academicYear,
          semester: result.semester,
          totalMarks: result.totalMarks,
          percentage: result.percentage,
          grade: result.grade,
          gradePoints: result.gradePoints,
          status: result.isPassed ? 'Pass' : 'Fail',
          assessments: result.assessments,
          faculty: result.facultyId.name,
          publishedAt: result.publishedAt
        }))
      }
    });

  } catch (error) {
    console.error('Fetch student results error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch results',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/simple-results/my-results
// @desc    Get current student's results (Student only)
// @access  Private/Student
router.get('/my-results', authenticate, requireStudent, async (req, res) => {
  try {
    const { academicYear, semester } = req.query;

    // Get published results only
    const filter = { 
      studentId: req.user._id, 
      status: 'Published' 
    };
    
    if (academicYear) filter.academicYear = academicYear;
    if (semester) filter.semester = semester;

    const results = await SimpleResult.find(filter)
      .populate('courseId', 'courseCode courseName credits')
      .sort({ academicYear: -1, semester: -1 });

    // Calculate CGPA
    const cgpaData = await SimpleResult.calculateCGPA(req.user._id, academicYear, semester);

    // Get latest semester results
    const latestResults = await SimpleResult.find({
      studentId: req.user._id,
      status: 'Published'
    })
    .populate('courseId', 'courseCode courseName credits')
    .sort({ academicYear: -1, semester: -1 })
    .limit(5);

    res.json({
      success: true,
      data: {
        student: {
          id: req.user._id,
          name: req.user.name,
          registrationNumber: req.user.registrationNumber
        },
        cgpa: cgpaData,
        totalResults: results.length,
        latestResults: latestResults.map(result => ({
          course: {
            code: result.courseId.courseCode,
            name: result.courseId.courseName,
            credits: result.courseId.credits
          },
          academicYear: result.academicYear,
          semester: result.semester,
          grade: result.grade,
          gradePoints: result.gradePoints,
          totalMarks: result.totalMarks
        })),
        allResults: results.map(result => ({
          id: result._id,
          course: {
            code: result.courseId.courseCode,
            name: result.courseId.courseName,
            credits: result.courseId.credits
          },
          academicYear: result.academicYear,
          semester: result.semester,
          totalMarks: result.totalMarks,
          grade: result.grade,
          gradePoints: result.gradePoints,
          status: result.isPassed ? 'Pass' : 'Fail'
        }))
      }
    });

  } catch (error) {
    console.error('Get my results error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch results',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/simple-results/course/:courseId
// @desc    Get results for a course (Faculty only)
// @access  Private/Faculty
router.get('/course/:courseId', authenticate, requireFaculty, async (req, res) => {
  try {
    const { courseId } = req.params;
    const { academicYear, semester, status = 'all' } = req.query;

    // Validate course exists and faculty has access
    const course = await SimpleCourse.findById(courseId)
      .populate('facultyId', 'name');

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    if (req.user.role !== 'admin' && course.facultyId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not assigned to this course'
      });
    }

    // Build filter
    const filter = { courseId };
    if (academicYear) filter.academicYear = academicYear;
    if (semester) filter.semester = semester;
    if (status !== 'all') filter.status = status;

    const results = await SimpleResult.find(filter)
      .populate('studentId', 'name registrationNumber')
      .sort({ 'studentId.registrationNumber': 1 });

    // Calculate statistics
    const publishedResults = results.filter(r => r.status === 'Published');
    const totalStudents = publishedResults.length;
    const passedStudents = publishedResults.filter(r => r.isPassed).length;
    const averageMarks = totalStudents > 0 
      ? publishedResults.reduce((sum, r) => sum + r.totalMarks, 0) / totalStudents 
      : 0;

    const gradeDistribution = publishedResults.reduce((acc, r) => {
      acc[r.grade] = (acc[r.grade] || 0) + 1;
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        course: {
          id: course._id,
          code: course.courseCode,
          name: course.courseName,
          faculty: course.facultyId.name
        },
        statistics: {
          totalResults: results.length,
          publishedResults: totalStudents,
          draftResults: results.filter(r => r.status === 'Draft').length,
          passedStudents,
          failedStudents: totalStudents - passedStudents,
          passPercentage: totalStudents > 0 ? Math.round((passedStudents / totalStudents) * 100) : 0,
          averageMarks: Math.round(averageMarks * 100) / 100,
          gradeDistribution
        },
        results: results.map(result => ({
          id: result._id,
          student: {
            id: result.studentId._id,
            name: result.studentId.name,
            registrationNumber: result.studentId.registrationNumber
          },
          academicYear: result.academicYear,
          semester: result.semester,
          totalMarks: result.totalMarks,
          grade: result.grade,
          gradePoints: result.gradePoints,
          status: result.status,
          isPassed: result.isPassed,
          assessments: result.assessments,
          updatedAt: result.updatedAt
        }))
      }
    });

  } catch (error) {
    console.error('Get course results error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch course results',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/simple-results/publish
// @desc    Publish results (Faculty only)
// @access  Private/Faculty
router.post('/publish', authenticate, requireFaculty, async (req, res) => {
  try {
    const { resultIds } = req.body;

    if (!resultIds || !Array.isArray(resultIds) || resultIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Result IDs array is required'
      });
    }

    // Find results and validate faculty access
    const results = await SimpleResult.find({ 
      _id: { $in: resultIds } 
    }).populate('courseId', 'facultyId');

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No results found'
      });
    }

    // Check faculty access for each result
    for (const result of results) {
      if (req.user.role !== 'admin' && result.courseId.facultyId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You can only publish results for your courses'
        });
      }
    }

    // Publish all results
    const publishedResults = [];
    for (const result of results) {
      if (result.status === 'Draft') {
        await result.publishResult();
        publishedResults.push(result);
      }
    }

    res.json({
      success: true,
      message: `${publishedResults.length} results published successfully`,
      data: {
        publishedCount: publishedResults.length,
        totalRequested: resultIds.length,
        publishedAt: new Date()
      }
    });

  } catch (error) {
    console.error('Publish results error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to publish results',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   PUT /api/simple-results/:id
// @desc    Update result (Faculty only)
// @access  Private/Faculty
router.put('/:id', authenticate, requireFaculty, async (req, res) => {
  try {
    const { assessments, remarks } = req.body;

    const result = await SimpleResult.findById(req.params.id)
      .populate('courseId', 'facultyId courseCode courseName')
      .populate('studentId', 'name registrationNumber');

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Result not found'
      });
    }

    // Check faculty access
    if (req.user.role !== 'admin' && result.courseId.facultyId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only update results for your courses'
      });
    }

    // Check if result is locked
    if (result.status === 'Locked') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update locked results'
      });
    }

    // Update assessments if provided
    if (assessments) {
      result.assessments = { ...result.assessments, ...assessments };
    }

    // Update remarks if provided
    if (remarks !== undefined) {
      result.remarks = remarks;
    }

    // Recalculate grades
    await result.calculateTotalAndGrade();

    res.json({
      success: true,
      message: 'Result updated successfully',
      data: {
        id: result._id,
        student: {
          id: result.studentId._id,
          name: result.studentId.name,
          registrationNumber: result.studentId.registrationNumber
        },
        course: {
          id: result.courseId._id,
          code: result.courseId.courseCode,
          name: result.courseId.courseName
        },
        totalMarks: result.totalMarks,
        grade: result.grade,
        gradePoints: result.gradePoints,
        status: result.status,
        assessments: result.assessments,
        remarks: result.remarks,
        updatedAt: result.updatedAt
      }
    });

  } catch (error) {
    console.error('Update result error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update result',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;