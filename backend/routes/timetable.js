const express = require('express');
const Timetable = require('../models/Timetable');
const { authenticate, authorize } = require('../middleware/auth');
const { validateObjectId } = require('../middleware/validation');

const router = express.Router();

// @route   GET /api/timetable
// @desc    Get timetables
// @access  Private
router.get('/', authenticate, async (req, res) => {
  try {
    const { academicYear, semester, department, program, section } = req.query;
    
    const filter = { isActive: true };
    
    // Role-based filtering
    if (req.user.role === 'student') {
      filter.department = req.user.department;
      filter.program = req.user.program;
      filter.semester = req.user.semester;
    } else {
      if (academicYear) filter.academicYear = academicYear;
      if (semester) filter.semester = parseInt(semester);
      if (department) filter.department = department;
      if (program) filter.program = program;
      if (section) filter.section = section;
    }
    
    const timetables = await Timetable.find(filter)
      .populate('schedule.periods.course', 'courseCode courseName')
      .populate('schedule.periods.faculty', 'firstName lastName')
      .populate('createdBy', 'firstName lastName')
      .sort({ effectiveFrom: -1 });
    
    res.json({
      success: true,
      data: { timetables }
    });
  } catch (error) {
    console.error('Get timetables error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch timetables'
    });
  }
});

// @route   GET /api/timetable/:id
// @desc    Get timetable by ID
// @access  Private
router.get('/:id', authenticate, validateObjectId('id'), async (req, res) => {
  try {
    const timetable = await Timetable.findById(req.params.id)
      .populate('schedule.periods.course', 'courseCode courseName credits')
      .populate('schedule.periods.faculty', 'firstName lastName designation')
      .populate('examSchedule.course', 'courseCode courseName')
      .populate('createdBy', 'firstName lastName');
    
    if (!timetable) {
      return res.status(404).json({
        success: false,
        message: 'Timetable not found'
      });
    }
    
    res.json({
      success: true,
      data: { timetable }
    });
  } catch (error) {
    console.error('Get timetable error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch timetable'
    });
  }
});

// @route   POST /api/timetable
// @desc    Create timetable
// @access  Private/Admin
router.post('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const {
      academicYear,
      semester,
      department,
      program,
      section,
      schedule,
      effectiveFrom,
      effectiveTo,
      examSchedule,
      holidays
    } = req.body;
    
    // Check if timetable already exists
    const existingTimetable = await Timetable.findOne({
      academicYear,
      semester,
      department,
      program,
      section
    });
    
    if (existingTimetable) {
      return res.status(400).json({
        success: false,
        message: 'Timetable already exists for this combination'
      });
    }
    
    const timetable = new Timetable({
      academicYear,
      semester,
      department,
      program,
      section,
      schedule,
      effectiveFrom: new Date(effectiveFrom),
      effectiveTo: effectiveTo ? new Date(effectiveTo) : null,
      examSchedule,
      holidays,
      createdBy: req.user._id
    });
    
    // Check for conflicts
    const conflicts = timetable.checkConflicts();
    if (conflicts.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Timetable has conflicts',
        conflicts
      });
    }
    
    await timetable.save();
    await timetable.populate('schedule.periods.course', 'courseCode courseName');
    await timetable.populate('schedule.periods.faculty', 'firstName lastName');
    
    res.status(201).json({
      success: true,
      message: 'Timetable created successfully',
      data: { timetable }
    });
  } catch (error) {
    console.error('Create timetable error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create timetable'
    });
  }
});

// @route   PUT /api/timetable/:id
// @desc    Update timetable
// @access  Private/Admin
router.put('/:id', authenticate, authorize('admin'), validateObjectId('id'), async (req, res) => {
  try {
    const timetable = await Timetable.findById(req.params.id);
    
    if (!timetable) {
      return res.status(404).json({
        success: false,
        message: 'Timetable not found'
      });
    }
    
    const allowedUpdates = [
      'schedule', 'effectiveFrom', 'effectiveTo', 'examSchedule', 
      'holidays', 'isActive'
    ];
    
    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });
    
    // If schedule is being updated, check for conflicts
    if (updates.schedule) {
      const tempTimetable = { ...timetable.toObject(), ...updates };
      const conflicts = Timetable.prototype.checkConflicts.call(tempTimetable);
      if (conflicts.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Updated timetable has conflicts',
          conflicts
        });
      }
    }
    
    const updatedTimetable = await Timetable.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    )
    .populate('schedule.periods.course', 'courseCode courseName')
    .populate('schedule.periods.faculty', 'firstName lastName');
    
    res.json({
      success: true,
      message: 'Timetable updated successfully',
      data: { timetable: updatedTimetable }
    });
  } catch (error) {
    console.error('Update timetable error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update timetable'
    });
  }
});

// @route   GET /api/timetable/my/schedule
// @desc    Get current user's timetable
// @access  Private
router.get('/my/schedule', authenticate, async (req, res) => {
  try {
    let timetable;
    
    if (req.user.role === 'student') {
      timetable = await Timetable.findOne({
        department: req.user.department,
        program: req.user.program,
        semester: req.user.semester,
        isActive: true,
        effectiveFrom: { $lte: new Date() },
        $or: [
          { effectiveTo: { $exists: false } },
          { effectiveTo: { $gte: new Date() } }
        ]
      })
      .populate('schedule.periods.course', 'courseCode courseName')
      .populate('schedule.periods.faculty', 'firstName lastName');
    } else if (req.user.role === 'faculty') {
      // Get faculty timetable
      const facultySchedule = await Timetable.getFacultyTimetable(
        req.user._id,
        new Date().getFullYear() + '-' + (new Date().getFullYear() + 1).toString().slice(-2),
        req.query.semester || 1
      );
      
      return res.json({
        success: true,
        data: { schedule: facultySchedule }
      });
    }
    
    if (!timetable) {
      return res.status(404).json({
        success: false,
        message: 'No active timetable found'
      });
    }
    
    res.json({
      success: true,
      data: { timetable }
    });
  } catch (error) {
    console.error('Get my timetable error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch timetable'
    });
  }
});

// @route   GET /api/timetable/faculty/:facultyId
// @desc    Get faculty timetable
// @access  Private/Admin
router.get('/faculty/:facultyId', authenticate, authorize('admin'), validateObjectId('facultyId'), async (req, res) => {
  try {
    const { academicYear, semester } = req.query;
    
    if (!academicYear || !semester) {
      return res.status(400).json({
        success: false,
        message: 'Academic year and semester are required'
      });
    }
    
    const facultySchedule = await Timetable.getFacultyTimetable(
      req.params.facultyId,
      academicYear,
      parseInt(semester)
    );
    
    res.json({
      success: true,
      data: { schedule: facultySchedule }
    });
  } catch (error) {
    console.error('Get faculty timetable error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch faculty timetable'
    });
  }
});

// @route   GET /api/timetable/room/:room
// @desc    Get room schedule
// @access  Private/Admin
router.get('/room/:room', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { room } = req.params;
    const { academicYear, semester } = req.query;
    
    if (!academicYear || !semester) {
      return res.status(400).json({
        success: false,
        message: 'Academic year and semester are required'
      });
    }
    
    const roomSchedule = await Timetable.getRoomSchedule(
      room,
      academicYear,
      parseInt(semester)
    );
    
    res.json({
      success: true,
      data: { schedule: roomSchedule }
    });
  } catch (error) {
    console.error('Get room schedule error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch room schedule'
    });
  }
});

// @route   GET /api/timetable/:id/current-period
// @desc    Get current period for timetable
// @access  Private
router.get('/:id/current-period', authenticate, validateObjectId('id'), async (req, res) => {
  try {
    const timetable = await Timetable.findById(req.params.id)
      .populate('schedule.periods.course', 'courseCode courseName')
      .populate('schedule.periods.faculty', 'firstName lastName');
    
    if (!timetable) {
      return res.status(404).json({
        success: false,
        message: 'Timetable not found'
      });
    }
    
    const now = new Date();
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
    
    const currentPeriod = timetable.getCurrentPeriod(currentDay, currentTime);
    const nextPeriod = timetable.getNextPeriod(currentDay, currentTime);
    
    res.json({
      success: true,
      data: {
        currentPeriod,
        nextPeriod,
        currentTime,
        currentDay
      }
    });
  } catch (error) {
    console.error('Get current period error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch current period'
    });
  }
});

module.exports = router;