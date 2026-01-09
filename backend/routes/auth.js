const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authenticate, blacklistToken } = require('../middleware/auth');
const { validateUserLogin, validateUserRegistration } = require('../middleware/validation');

const router = express.Router();

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public (Admin only in production)
router.post('/register', validateUserRegistration, async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      role,
      department,
      phone,
      dateOfBirth,
      gender,
      program,
      semester,
      designation,
      specialization,
      registrationNumber, // For students with existing reg number
      batch // For new students
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // For students, check if registration number already exists
    if (role === 'student' && registrationNumber) {
      const existingStudent = await User.findOne({ registrationNumber });
      if (existingStudent) {
        return res.status(400).json({
          success: false,
          message: 'Student with this registration number already exists'
        });
      }
    }

    // Generate unique user ID
    const userId = await User.generateUserId(role, department);

    // Create user object
    const userData = {
      userId,
      email,
      password,
      firstName,
      lastName,
      role,
      department,
      phone,
      dateOfBirth,
      gender
    };

    // Add role-specific fields
    if (role === 'student') {
      let finalRegistrationNumber = registrationNumber;
      let finalBatch = batch;

      // If registration number is provided, parse it to get batch info
      if (registrationNumber) {
        const parsed = User.parseRegistrationNumber(registrationNumber);
        if (!parsed) {
          return res.status(400).json({
            success: false,
            message: 'Invalid registration number format. Use YYBBB##### (e.g., 22BCE10405)'
          });
        }
        finalBatch = parsed.fullBatch;
      } else if (batch) {
        // Generate new registration number based on batch and department
        const branchCode = department.substring(0, 3).toUpperCase();
        finalRegistrationNumber = User.generateRegistrationNumber(batch, branchCode);
        finalBatch = `${batch}-${batch + 4}`;
      } else {
        // Default to current year
        const currentYear = new Date().getFullYear();
        const branchCode = department.substring(0, 3).toUpperCase();
        finalRegistrationNumber = User.generateRegistrationNumber(currentYear, branchCode);
        finalBatch = `${currentYear}-${currentYear + 4}`;
      }

      userData.registrationNumber = finalRegistrationNumber;
      userData.program = program;
      userData.semester = semester || 1;
      userData.batch = finalBatch;
    } else if (role === 'faculty') {
      userData.employeeId = userId;
      userData.designation = designation;
      userData.specialization = specialization;
    }

    // Create user
    const user = new User(userData);
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        token,
        user: {
          id: user._id,
          userId: user.userId,
          registrationNumber: user.registrationNumber,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          department: user.department,
          batch: user.batch
        }
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', validateUserLogin, async (req, res) => {
  try {
    const { userId, password } = req.body;

    // Find user by userId, registrationNumber, or email
    const user = await User.findOne({
      $or: [
        { userId: userId.toUpperCase() },
        { registrationNumber: userId.toUpperCase() },
        { email: userId.toLowerCase() }
      ]
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact administrator.'
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user._id,
          userId: user.userId,
          registrationNumber: user.registrationNumber,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          department: user.department,
          program: user.program,
          semester: user.semester,
          batch: user.batch,
          profilePicture: user.profilePicture
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user profile
// @access  Private
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('enrolledCourses', 'courseCode courseName credits')
      .populate('assignedCourses', 'courseCode courseName credits');

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/auth/refresh
// @desc    Refresh JWT token
// @access  Private
router.post('/refresh', authenticate, async (req, res) => {
  try {
    const token = generateToken(req.user._id);
    
    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: { token }
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      message: 'Token refresh failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user (blacklist token)
// @access  Private
router.post('/logout', authenticate, async (req, res) => {
  try {
    // Blacklist the current token
    if (req.token) {
      blacklistToken(req.token);
    }
    
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/auth/validate-registration
// @desc    Validate and parse registration number
// @access  Public
router.post('/validate-registration', async (req, res) => {
  try {
    const { registrationNumber } = req.body;

    if (!registrationNumber) {
      return res.status(400).json({
        success: false,
        message: 'Registration number is required'
      });
    }

    // Parse registration number
    const parsed = User.parseRegistrationNumber(registrationNumber.toUpperCase());
    
    if (!parsed) {
      return res.status(400).json({
        success: false,
        message: 'Invalid registration number format. Use YYBBB##### (e.g., 22BCE10405)'
      });
    }

    // Check if registration number already exists
    const existingUser = await User.findOne({ registrationNumber: registrationNumber.toUpperCase() });
    
    res.json({
      success: true,
      message: 'Registration number is valid',
      data: {
        parsed,
        exists: !!existingUser,
        registrationNumber: registrationNumber.toUpperCase()
      }
    });
  } catch (error) {
    console.error('Registration validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Validation failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/auth/change-password
// @desc    Change user password
// @access  Private
router.post('/change-password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    // Get user with password
    const user = await User.findById(req.user._id);

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Password change failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;