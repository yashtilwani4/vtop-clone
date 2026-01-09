const express = require('express');
const SimpleTimetable = require('../models/SimpleTimetable');
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

// Authorization middleware for admin
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }
  next();
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

// @route   POST /api/simple-timetable/create
// @desc    Create timetable (Admin only)
// @access  Private/Admin
router.post('/create', authenticate, requireAdmin, async (req, res) => {
  try {
    const {
      academicYear,
      semester,
      department,
      program,
      section,
      weeklySchedule,
      effectiveFrom,
      effectiveTo,
      notes
    } = req.body;

    // Validate required fields
    if (!academicYear || !semester || !department || !program || !weeklySchedule || !effectiveFrom) {
      return res.status(400).json({
        success: false,
        message: 'Academic year, semester, department, program, weekly schedule, and effective from date are required'
      });
    }

    // Check if timetable already exists for this combination
    const existingTimetable = await SimpleTimetable.findOne({
      academicYear,
      semester,
      department,
      program,
      section: section || 'A'
    });

    if (existingTimetable) {
      return res.status(400).json({
        success: false,
        message: 'Timetable already exists for this academic year, semester, department, program, and section combination'
      });
    }

    // Create new timetable
    const timetable = new SimpleTimetable({
      academicYear,
      semester,
      department,
      program,
      section: section || 'A',
      weeklySchedule,
      effectiveFrom: new Date(effectiveFrom),
      effectiveTo: effectiveTo ? new Date(effectiveTo) : null,
      notes,
      createdBy: req.user._id,
      status: 'Draft'
    });

    // Check for conflicts
    const conflicts = timetable.checkConflicts();
    if (conflicts.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Timetable has scheduling conflicts',
        conflicts
      });
    }

    await timetable.save();

    // Populate the saved timetable
    await timetable.populate('weeklySchedule.slots.courseId', 'courseCode courseName credits');
    await timetable.populate('weeklySchedule.slots.facultyId', 'name email');
    await timetable.populate('createdBy', 'name');

    res.status(201).json({
      success: true,
      message: 'Timetable created successfully',
      data: {
        timetable: {
          id: timetable._id,
          academicYear: timetable.academicYear,
          semester: timetable.semester,
          department: timetable.department,
          program: timetable.program,
          section: timetable.section,
          weeklySchedule: timetable.weeklySchedule,
          status: timetable.status,
          totalHours: timetable.totalHours,
          weeklyHours: timetable.weeklyHours,
          effectiveFrom: timetable.effectiveFrom,
          effectiveTo: timetable.effectiveTo,
          notes: timetable.notes,
          createdBy: timetable.createdBy,
          createdAt: timetable.createdAt
        }
      }
    });

  } catch (error) {
    console.error('Create timetable error:', error);
    
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
      message: error.message || 'Failed to create timetable',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/simple-timetable/student
// @desc    Get student's timetable (Student only)
// @access  Private/Student
router.get('/student', authenticate, requireStudent, async (req, res) => {
  try {
    const { academicYear, semester } = req.query;

    // Use current user's details if not provided
    const queryAcademicYear = academicYear || new Date().getFullYear() + '-' + (new Date().getFullYear() + 1).toString().slice(-2);
    const querySemester = semester ? parseInt(semester) : req.user.semester || 1;

    // Get student's timetable based on their profile
    const timetable = await SimpleTimetable.getStudentTimetable(
      req.user.department,
      req.user.program || 'B.Tech',
      querySemester,
      queryAcademicYear,
      req.user.section || 'A'
    );

    if (!timetable) {
      return res.status(404).json({
        success: false,
        message: 'No active timetable found for your class'
      });
    }

    // Get current day and time info
    const now = new Date();
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format

    const currentSlot = timetable.getCurrentSlot(currentDay, currentTime);
    const nextSlot = timetable.getNextSlot(currentDay, currentTime);

    res.json({
      success: true,
      data: {
        student: {
          id: req.user._id,
          name: req.user.name,
          registrationNumber: req.user.registrationNumber,
          department: req.user.department,
          program: req.user.program,
          semester: req.user.semester,
          section: req.user.section
        },
        timetable: {
          id: timetable._id,
          academicYear: timetable.academicYear,
          semester: timetable.semester,
          department: timetable.department,
          program: timetable.program,
          section: timetable.section,
          weeklySchedule: timetable.weeklySchedule,
          totalHours: timetable.totalHours,
          weeklyHours: timetable.weeklyHours,
          effectiveFrom: timetable.effectiveFrom,
          effectiveTo: timetable.effectiveTo
        },
        currentInfo: {
          currentDay,
          currentTime,
          currentSlot,
          nextSlot
        }
      }
    });

  } catch (error) {
    console.error('Get student timetable error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch timetable',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/simple-timetable/faculty
// @desc    Get faculty's assigned slots (Faculty only)
// @access  Private/Faculty
router.get('/faculty', authenticate, requireFaculty, async (req, res) => {
  try {
    const { academicYear, semester } = req.query;

    // Get faculty's timetable
    const facultySchedule = await SimpleTimetable.getFacultyTimetable(
      req.user._id,
      academicYear,
      semester ? parseInt(semester) : null
    );

    // Calculate statistics
    let totalSlots = 0;
    let totalHours = 0;
    const courseStats = {};
    const dayStats = {};

    facultySchedule.forEach(dayGroup => {
      const day = dayGroup._id.day;
      dayStats[day] = dayGroup.slots.length;
      
      dayGroup.slots.forEach(slot => {
        totalSlots++;
        totalHours += (slot.duration || 60) / 60;
        
        if (slot.course) {
          const courseCode = slot.course.courseCode;
          if (!courseStats[courseCode]) {
            courseStats[courseCode] = {
              courseName: slot.course.courseName,
              credits: slot.course.credits,
              slots: 0,
              hours: 0,
              sections: new Set()
            };
          }
          courseStats[courseCode].slots++;
          courseStats[courseCode].hours += (slot.duration || 60) / 60;
          courseStats[courseCode].sections.add(`${slot.department}-${slot.program}-${slot.section}`);
        }
      });
    });

    // Convert sets to arrays for JSON serialization
    Object.keys(courseStats).forEach(courseCode => {
      courseStats[courseCode].sections = Array.from(courseStats[courseCode].sections);
      courseStats[courseCode].hours = Math.round(courseStats[courseCode].hours * 100) / 100;
    });

    res.json({
      success: true,
      data: {
        faculty: {
          id: req.user._id,
          name: req.user.name,
          email: req.user.email,
          department: req.user.department
        },
        schedule: facultySchedule,
        statistics: {
          totalSlots,
          totalHours: Math.round(totalHours * 100) / 100,
          coursesAssigned: Object.keys(courseStats).length,
          courseStats,
          dayStats
        },
        filters: {
          academicYear: academicYear || 'All',
          semester: semester || 'All'
        }
      }
    });

  } catch (error) {
    console.error('Get faculty timetable error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch faculty timetable',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/simple-timetable/admin/all
// @desc    Get all timetables (Admin only)
// @access  Private/Admin
router.get('/admin/all', authenticate, requireAdmin, async (req, res) => {
  try {
    const { 
      academicYear, 
      semester, 
      department, 
      program, 
      section, 
      status,
      page = 1, 
      limit = 10 
    } = req.query;

    // Build filter
    const filter = {};
    if (academicYear) filter.academicYear = academicYear;
    if (semester) filter.semester = parseInt(semester);
    if (department) filter.department = department;
    if (program) filter.program = program;
    if (section) filter.section = section;
    if (status) filter.status = status;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get timetables with pagination
    const timetables = await SimpleTimetable.find(filter)
      .populate('weeklySchedule.slots.courseId', 'courseCode courseName credits')
      .populate('weeklySchedule.slots.facultyId', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalTimetables = await SimpleTimetable.countDocuments(filter);
    const totalPages = Math.ceil(totalTimetables / parseInt(limit));

    res.json({
      success: true,
      data: {
        timetables: timetables.map(timetable => ({
          id: timetable._id,
          academicYear: timetable.academicYear,
          semester: timetable.semester,
          department: timetable.department,
          program: timetable.program,
          section: timetable.section,
          status: timetable.status,
          totalHours: timetable.totalHours,
          weeklyHours: timetable.weeklyHours,
          effectiveFrom: timetable.effectiveFrom,
          effectiveTo: timetable.effectiveTo,
          createdBy: timetable.createdBy,
          createdAt: timetable.createdAt,
          weeklySchedule: timetable.weeklySchedule
        })),
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalTimetables,
          hasNextPage: parseInt(page) < totalPages,
          hasPrevPage: parseInt(page) > 1
        },
        filters: {
          academicYear,
          semester,
          department,
          program,
          section,
          status
        }
      }
    });

  } catch (error) {
    console.error('Get all timetables error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch timetables',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   PUT /api/simple-timetable/:id/activate
// @desc    Activate timetable (Admin only)
// @access  Private/Admin
router.put('/:id/activate', authenticate, requireAdmin, async (req, res) => {
  try {
    const timetable = await SimpleTimetable.findById(req.params.id);

    if (!timetable) {
      return res.status(404).json({
        success: false,
        message: 'Timetable not found'
      });
    }

    // Check for conflicts before activating
    const conflicts = timetable.checkConflicts();
    if (conflicts.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot activate timetable with conflicts',
        conflicts
      });
    }

    // Deactivate other timetables for the same class
    await SimpleTimetable.updateMany(
      {
        academicYear: timetable.academicYear,
        semester: timetable.semester,
        department: timetable.department,
        program: timetable.program,
        section: timetable.section,
        _id: { $ne: timetable._id }
      },
      { status: 'Inactive' }
    );

    // Activate this timetable
    timetable.status = 'Active';
    await timetable.save();

    await timetable.populate('weeklySchedule.slots.courseId', 'courseCode courseName');
    await timetable.populate('weeklySchedule.slots.facultyId', 'name');

    res.json({
      success: true,
      message: 'Timetable activated successfully',
      data: {
        timetable: {
          id: timetable._id,
          academicYear: timetable.academicYear,
          semester: timetable.semester,
          department: timetable.department,
          program: timetable.program,
          section: timetable.section,
          status: timetable.status,
          weeklySchedule: timetable.weeklySchedule,
          updatedAt: timetable.updatedAt
        }
      }
    });

  } catch (error) {
    console.error('Activate timetable error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to activate timetable',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   PUT /api/simple-timetable/:id
// @desc    Update timetable (Admin only)
// @access  Private/Admin
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const timetable = await SimpleTimetable.findById(req.params.id);

    if (!timetable) {
      return res.status(404).json({
        success: false,
        message: 'Timetable not found'
      });
    }

    const allowedUpdates = [
      'weeklySchedule', 'effectiveFrom', 'effectiveTo', 'notes', 'status'
    ];

    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    // If schedule is being updated, check for conflicts
    if (updates.weeklySchedule) {
      const tempTimetable = { ...timetable.toObject(), ...updates };
      const conflicts = SimpleTimetable.prototype.checkConflicts.call(tempTimetable);
      if (conflicts.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Updated timetable has conflicts',
          conflicts
        });
      }
    }

    const updatedTimetable = await SimpleTimetable.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    )
    .populate('weeklySchedule.slots.courseId', 'courseCode courseName')
    .populate('weeklySchedule.slots.facultyId', 'name');

    res.json({
      success: true,
      message: 'Timetable updated successfully',
      data: {
        timetable: {
          id: updatedTimetable._id,
          academicYear: updatedTimetable.academicYear,
          semester: updatedTimetable.semester,
          department: updatedTimetable.department,
          program: updatedTimetable.program,
          section: updatedTimetable.section,
          status: updatedTimetable.status,
          weeklySchedule: updatedTimetable.weeklySchedule,
          totalHours: updatedTimetable.totalHours,
          weeklyHours: updatedTimetable.weeklyHours,
          effectiveFrom: updatedTimetable.effectiveFrom,
          effectiveTo: updatedTimetable.effectiveTo,
          notes: updatedTimetable.notes,
          updatedAt: updatedTimetable.updatedAt
        }
      }
    });

  } catch (error) {
    console.error('Update timetable error:', error);
    
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
      message: 'Failed to update timetable',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/simple-timetable/room/:room
// @desc    Get room utilization (Admin only)
// @access  Private/Admin
router.get('/room/:room', authenticate, requireAdmin, async (req, res) => {
  try {
    const { room } = req.params;
    const { academicYear, semester } = req.query;

    const roomSchedule = await SimpleTimetable.getRoomUtilization(
      room,
      academicYear,
      semester ? parseInt(semester) : null
    );

    // Calculate room utilization statistics
    let totalSlots = 0;
    let totalHours = 0;
    const dayStats = {};
    const departmentStats = {};

    roomSchedule.forEach(dayGroup => {
      const day = dayGroup._id;
      dayStats[day] = dayGroup.slots.length;
      
      dayGroup.slots.forEach(slot => {
        totalSlots++;
        totalHours += (slot.duration || 60) / 60;
        
        const dept = slot.department;
        if (!departmentStats[dept]) {
          departmentStats[dept] = { slots: 0, hours: 0 };
        }
        departmentStats[dept].slots++;
        departmentStats[dept].hours += (slot.duration || 60) / 60;
      });
    });

    // Round hours for better display
    Object.keys(departmentStats).forEach(dept => {
      departmentStats[dept].hours = Math.round(departmentStats[dept].hours * 100) / 100;
    });

    res.json({
      success: true,
      data: {
        room,
        schedule: roomSchedule,
        statistics: {
          totalSlots,
          totalHours: Math.round(totalHours * 100) / 100,
          utilizationPercentage: Math.round((totalHours / (6 * 8)) * 100), // Assuming 6 days, 8 hours per day
          dayStats,
          departmentStats
        },
        filters: {
          academicYear: academicYear || 'All',
          semester: semester || 'All'
        }
      }
    });

  } catch (error) {
    console.error('Get room utilization error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch room utilization',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/simple-timetable/stats
// @desc    Get timetable statistics (Admin only)
// @access  Private/Admin
router.get('/stats', authenticate, requireAdmin, async (req, res) => {
  try {
    const { academicYear, semester } = req.query;

    const stats = await SimpleTimetable.getTimetableStats(
      academicYear,
      semester ? parseInt(semester) : null
    );

    // Get additional statistics
    const totalTimetables = await SimpleTimetable.countDocuments({
      ...(academicYear && { academicYear }),
      ...(semester && { semester: parseInt(semester) })
    });

    const activeTimetables = await SimpleTimetable.countDocuments({
      status: 'Active',
      ...(academicYear && { academicYear }),
      ...(semester && { semester: parseInt(semester) })
    });

    const statusDistribution = await SimpleTimetable.aggregate([
      {
        $match: {
          ...(academicYear && { academicYear }),
          ...(semester && { semester: parseInt(semester) })
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const statusStats = {};
    statusDistribution.forEach(item => {
      statusStats[item._id] = item.count;
    });

    res.json({
      success: true,
      data: {
        overview: {
          totalTimetables,
          activeTimetables,
          inactiveTimetables: totalTimetables - activeTimetables,
          ...stats
        },
        statusDistribution: statusStats,
        filters: {
          academicYear: academicYear || 'All',
          semester: semester || 'All'
        }
      }
    });

  } catch (error) {
    console.error('Get timetable stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch timetable statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   DELETE /api/simple-timetable/:id
// @desc    Delete timetable (Admin only)
// @access  Private/Admin
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const timetable = await SimpleTimetable.findById(req.params.id);

    if (!timetable) {
      return res.status(404).json({
        success: false,
        message: 'Timetable not found'
      });
    }

    // Check if timetable is currently active
    if (timetable.status === 'Active') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete active timetable. Please deactivate it first.'
      });
    }

    await SimpleTimetable.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Timetable deleted successfully',
      data: {
        deletedTimetable: {
          id: timetable._id,
          academicYear: timetable.academicYear,
          semester: timetable.semester,
          department: timetable.department,
          program: timetable.program,
          section: timetable.section
        }
      }
    });

  } catch (error) {
    console.error('Delete timetable error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete timetable',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;