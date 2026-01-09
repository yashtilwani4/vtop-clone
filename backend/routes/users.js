const express = require('express');
const User = require('../models/User');
const { 
  authenticate, 
  requireAdmin, 
  requireFacultyOrAdmin,
  authorizeOwnerOrPrivileged,
  authorizeDepartment 
} = require('../middleware/auth');
const { validateUserUpdate, validatePagination, validateObjectId } = require('../middleware/validation');

const router = express.Router();

// @route   GET /api/users
// @desc    Get all users (Admin only)
// @access  Private/Admin
router.get('/', authenticate, requireAdmin, validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const { role, department, search } = req.query;
    
    // Build filter
    const filter = {};
    if (role) filter.role = role;
    if (department) filter.department = department;
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { userId: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await User.countDocuments(filter);
    
    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private (Own profile or Admin)
router.get('/:id', authenticate, authorizeOwnerOrPrivileged(), validateObjectId('id'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('enrolledCourses', 'courseCode courseName credits')
      .populate('assignedCourses', 'courseCode courseName credits');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   PUT /api/users/:id
// @desc    Update user profile
// @access  Private (Own profile or Admin)
router.put('/:id', authenticate, authorizeOwnerOrPrivileged(), validateObjectId('id'), validateUserUpdate, async (req, res) => {
  try {
    const userId = req.params.id;
    
    const allowedUpdates = [
      'firstName', 'lastName', 'phone', 'dateOfBirth', 'gender',
      'address', 'profilePicture'
    ];
    
    // Admin can update additional fields
    if (req.user.role === 'admin') {
      allowedUpdates.push('isActive', 'department', 'program', 'semester', 'designation', 'specialization');
    }
    
    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });
    
    const user = await User.findByIdAndUpdate(
      userId,
      updates,
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user }
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   DELETE /api/users/:id
// @desc    Delete user (Admin only)
// @access  Private/Admin
router.delete('/:id', authenticate, requireAdmin, validateObjectId('id'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Soft delete by deactivating
    user.isActive = false;
    await user.save();
    
    res.json({
      success: true,
      message: 'User deactivated successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/users/students/by-department/:department
// @desc    Get students by department
// @access  Private/Faculty/Admin
router.get('/students/by-department/:department', authenticate, requireFacultyOrAdmin, authorizeDepartment, async (req, res) => {
  try {
    const { department } = req.params;
    const { semester, program } = req.query;
    
    const filter = {
      role: 'student',
      department,
      isActive: true
    };
    
    if (semester) filter.semester = parseInt(semester);
    if (program) filter.program = program;
    
    const students = await User.find(filter)
      .select('userId firstName lastName email program semester registrationNumber')
      .sort({ firstName: 1 });
    
    res.json({
      success: true,
      data: { students }
    });
  } catch (error) {
    console.error('Get students by department error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch students',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/users/faculty/by-department/:department
// @desc    Get faculty by department
// @access  Private/Admin
router.get('/faculty/by-department/:department', authenticate, requireAdmin, async (req, res) => {
  try {
    const { department } = req.params;
    
    const faculty = await User.find({
      role: 'faculty',
      department,
      isActive: true
    })
    .select('userId firstName lastName email designation specialization employeeId')
    .sort({ firstName: 1 });
    
    res.json({
      success: true,
      data: { faculty }
    });
  } catch (error) {
    console.error('Get faculty by department error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch faculty',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/users/stats
// @desc    Get user statistics (Admin only)
// @access  Private/Admin
router.get('/stats/overview', authenticate, requireAdmin, async (req, res) => {
  try {
    const stats = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
          active: {
            $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
          }
        }
      }
    ]);
    
    const departmentStats = await User.aggregate([
      {
        $match: { isActive: true }
      },
      {
        $group: {
          _id: '$department',
          students: {
            $sum: { $cond: [{ $eq: ['$role', 'student'] }, 1, 0] }
          },
          faculty: {
            $sum: { $cond: [{ $eq: ['$role', 'faculty'] }, 1, 0] }
          }
        }
      }
    ]);
    
    res.json({
      success: true,
      data: {
        roleStats: stats,
        departmentStats
      }
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;