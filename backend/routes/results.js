const express = require('express');
const Result = require('../models/Result');
const Course = require('../models/Course');
const { authenticate, authorize } = require('../middleware/auth');
const { validateResult, validateObjectId } = require('../middleware/validation');

const router = express.Router();

// @route   GET /api/results
// @desc    Get results (Admin/Faculty can see all, Students see their own)
// @access  Private
router.get('/', authenticate, async (req, res) => {
  try {
    const { student, course, academicYear, semester, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;
    
    const filter = {};
    
    // Role-based filtering
    if (req.user.role === 'student') {
      filter.student = req.user._id;
    } else {
      if (student) filter.student = student;
    }
    
    if (course) filter.course = course;
    if (academicYear) filter.academicYear = academicYear;
    if (semester) filter.semester = parseInt(semester);
    
    // Students can only see published results
    if (req.user.role === 'student') {
      filter.isPublished = true;
    }
    
    const results = await Result.find(filter)
      .populate('student', 'firstName lastName userId registrationNumber')
      .populate('course', 'courseCode courseName credits')
      .sort({ academicYear: -1, semester: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Result.countDocuments(filter);
    
    res.json({
      success: true,
      data: {
        results,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get results error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch results'
    });
  }
});

// @route   POST /api/results
// @desc    Create result record
// @access  Private/Faculty/Admin
router.post('/', authenticate, authorize('faculty', 'admin'), validateResult, async (req, res) => {
  try {
    const {
      student,
      course,
      academicYear,
      semester,
      assessments
    } = req.body;
    
    // Check if result already exists
    const existingResult = await Result.findOne({ student, course });
    if (existingResult) {
      return res.status(400).json({
        success: false,
        message: 'Result already exists for this student and course'
      });
    }
    
    // Verify course exists
    const courseDoc = await Course.findById(course);
    if (!courseDoc) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }
    
    // Faculty can only create results for their courses
    if (req.user.role === 'faculty' && courseDoc.faculty.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only create results for your assigned courses'
      });
    }
    
    const result = new Result({
      student,
      course,
      academicYear,
      semester,
      assessments
    });
    
    await result.save();
    await result.populate('student', 'firstName lastName userId');
    await result.populate('course', 'courseCode courseName credits');
    
    res.status(201).json({
      success: true,
      message: 'Result created successfully',
      data: { result }
    });
  } catch (error) {
    console.error('Create result error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create result'
    });
  }
});

// @route   PUT /api/results/:id
// @desc    Update result
// @access  Private/Faculty/Admin
router.put('/:id', authenticate, authorize('faculty', 'admin'), validateObjectId('id'), async (req, res) => {
  try {
    const result = await Result.findById(req.params.id).populate('course');
    
    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Result not found'
      });
    }
    
    // Faculty can only update results for their courses
    if (req.user.role === 'faculty' && result.course.faculty.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    const allowedUpdates = ['assessments', 'remarks'];
    
    // Admin can update additional fields
    if (req.user.role === 'admin') {
      allowedUpdates.push('isPublished', 'status');
    }
    
    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });
    
    if (updates.isPublished && !result.publishedDate) {
      updates.publishedDate = new Date();
      updates.publishedBy = req.user._id;
    }
    
    const updatedResult = await Result.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    )
    .populate('student', 'firstName lastName userId')
    .populate('course', 'courseCode courseName credits');
    
    res.json({
      success: true,
      message: 'Result updated successfully',
      data: { result: updatedResult }
    });
  } catch (error) {
    console.error('Update result error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update result'
    });
  }
});

// @route   GET /api/results/student/:studentId/semester
// @desc    Get semester results for student
// @access  Private
router.get('/student/:studentId/semester', authenticate, validateObjectId('studentId'), async (req, res) => {
  try {
    const { studentId } = req.params;
    const { academicYear, semester } = req.query;
    
    // Check authorization
    if (req.user.role === 'student' && req.user._id.toString() !== studentId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    if (!academicYear || !semester) {
      return res.status(400).json({
        success: false,
        message: 'Academic year and semester are required'
      });
    }
    
    const results = await Result.getSemesterResults(studentId, academicYear, parseInt(semester));
    
    // Calculate semester statistics
    const totalCredits = results.reduce((sum, result) => sum + result.course.credits, 0);
    const totalGradePoints = results.reduce((sum, result) => sum + (result.gradePoints * result.course.credits), 0);
    const sgpa = totalCredits > 0 ? (totalGradePoints / totalCredits).toFixed(2) : 0;
    
    res.json({
      success: true,
      data: {
        results,
        statistics: {
          totalCredits,
          sgpa,
          totalSubjects: results.length,
          passedSubjects: results.filter(r => r.grade !== 'F').length
        }
      }
    });
  } catch (error) {
    console.error('Get semester results error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch semester results'
    });
  }
});

// @route   GET /api/results/student/:studentId/cgpa
// @desc    Get CGPA for student
// @access  Private
router.get('/student/:studentId/cgpa', authenticate, validateObjectId('studentId'), async (req, res) => {
  try {
    const { studentId } = req.params;
    const { upToSemester } = req.query;
    
    // Check authorization
    if (req.user.role === 'student' && req.user._id.toString() !== studentId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    const cgpa = await Result.calculateCGPA(studentId, upToSemester ? parseInt(upToSemester) : null);
    
    res.json({
      success: true,
      data: { cgpa }
    });
  } catch (error) {
    console.error('Get CGPA error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate CGPA'
    });
  }
});

// @route   GET /api/results/student/:studentId/rank
// @desc    Get class rank for student
// @access  Private
router.get('/student/:studentId/rank', authenticate, validateObjectId('studentId'), async (req, res) => {
  try {
    const { studentId } = req.params;
    const { academicYear, semester } = req.query;
    
    // Check authorization
    if (req.user.role === 'student' && req.user._id.toString() !== studentId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    if (!academicYear || !semester) {
      return res.status(400).json({
        success: false,
        message: 'Academic year and semester are required'
      });
    }
    
    const rankInfo = await Result.getClassRank(studentId, academicYear, parseInt(semester));
    
    res.json({
      success: true,
      data: { rankInfo }
    });
  } catch (error) {
    console.error('Get class rank error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch class rank'
    });
  }
});

// @route   POST /api/results/:id/publish
// @desc    Publish result
// @access  Private/Admin
router.post('/:id/publish', authenticate, authorize('admin'), validateObjectId('id'), async (req, res) => {
  try {
    const result = await Result.findById(req.params.id);
    
    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Result not found'
      });
    }
    
    result.isPublished = true;
    result.publishedDate = new Date();
    result.publishedBy = req.user._id;
    
    await result.save();
    
    res.json({
      success: true,
      message: 'Result published successfully'
    });
  } catch (error) {
    console.error('Publish result error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to publish result'
    });
  }
});

// @route   GET /api/results/my/summary
// @desc    Get current student's results summary
// @access  Private/Student
router.get('/my/summary', authenticate, authorize('student'), async (req, res) => {
  try {
    const results = await Result.find({
      student: req.user._id,
      isPublished: true
    })
    .populate('course', 'courseCode courseName credits')
    .sort({ academicYear: -1, semester: -1 });
    
    // Group by semester
    const semesterResults = {};
    results.forEach(result => {
      const key = `${result.academicYear}-S${result.semester}`;
      if (!semesterResults[key]) {
        semesterResults[key] = [];
      }
      semesterResults[key].push(result);
    });
    
    // Calculate CGPA
    const cgpa = await Result.calculateCGPA(req.user._id);
    
    res.json({
      success: true,
      data: {
        semesterResults,
        cgpa,
        totalResults: results.length
      }
    });
  } catch (error) {
    console.error('Get my results summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch results summary'
    });
  }
});

module.exports = router;