const express = require('express');
const jwt = require('jsonwebtoken');
const SimpleUser = require('../models/SimpleUser');
const PasswordReset = require('../models/PasswordReset');
const emailService = require('../utils/emailService');

const router = express.Router();

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { userId }, 
    process.env.JWT_SECRET || 'fallback_secret',
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// @route   POST /api/simple-auth/register
// @desc    Register a new user with simplified schema
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, registrationNumber } = req.body;

    // Check if user already exists
    const existingUser = await SimpleUser.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Check if registration number already exists (for students)
    if (role === 'student' && registrationNumber) {
      const existingRegNum = await SimpleUser.findOne({ registrationNumber });
      if (existingRegNum) {
        return res.status(400).json({
          success: false,
          message: 'Registration number already exists'
        });
      }
    }

    // Create user data
    const userData = {
      name,
      email,
      password,
      role: role || 'student'
    };

    // Add registration number for students
    if (userData.role === 'student') {
      userData.registrationNumber = registrationNumber;
    }

    // Create and save user
    const user = new SimpleUser(userData);
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
          name: user.name,
          email: user.email,
          role: user.role,
          registrationNumber: user.registrationNumber,
          createdAt: user.createdAt
        }
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    
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
      message: 'Registration failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/simple-auth/login
// @desc    Login user with email or registration number
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body; // identifier can be email or registration number

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email/Registration number and password are required'
      });
    }

    // Find user by email or registration number
    const user = await SimpleUser.findByEmailOrRegNumber(identifier);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          registrationNumber: user.registrationNumber,
          createdAt: user.createdAt
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

// @route   GET /api/simple-auth/me
// @desc    Get current user profile
// @access  Private
router.get('/me', async (req, res) => {
  try {
    // Simple token verification
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    const user = await SimpleUser.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          registrationNumber: user.registrationNumber,
          createdAt: user.createdAt
        }
      }
    });

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }

    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/simple-auth/users
// @desc    Get all users (basic endpoint)
// @access  Public (for demo purposes)
router.get('/users', async (req, res) => {
  try {
    const { role, limit = 10 } = req.query;
    
    const filter = {};
    if (role) filter.role = role;

    const users = await SimpleUser.find(filter)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        users: users.map(user => ({
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          registrationNumber: user.registrationNumber,
          createdAt: user.createdAt
        })),
        count: users.length
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get users',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/simple-auth/validate-registration
// @desc    Validate registration number format
// @access  Public
router.post('/validate-registration', (req, res) => {
  try {
    const { registrationNumber } = req.body;

    if (!registrationNumber) {
      return res.status(400).json({
        success: false,
        message: 'Registration number is required'
      });
    }

    const parsed = SimpleUser.parseRegistrationNumber(registrationNumber);
    
    if (!parsed) {
      return res.status(400).json({
        success: false,
        message: 'Invalid registration number format. Use YYBBB##### (e.g., 22BCE10405)'
      });
    }

    res.json({
      success: true,
      message: 'Registration number is valid',
      data: {
        registrationNumber: registrationNumber.toUpperCase(),
        parsed
      }
    });

  } catch (error) {
    console.error('Validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Validation failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/simple-auth/forgot-password
// @desc    Request password reset OTP
// @access  Public
router.post('/forgot-password', async (req, res) => {
  try {
    const { identifier } = req.body; // email or registration number
    
    if (!identifier) {
      return res.status(400).json({
        success: false,
        message: 'Email or registration number is required'
      });
    }

    // Find user by email or registration number
    const user = await SimpleUser.findByEmailOrRegNumber(identifier);
    
    if (!user) {
      // Don't reveal if user exists or not for security
      return res.json({
        success: true,
        message: 'If an account with this identifier exists, you will receive a password reset email shortly.'
      });
    }

    // Get client IP and user agent for security
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    // Create password reset request
    const resetRequest = await PasswordReset.createResetRequest(
      user._id,
      user.email,
      ipAddress,
      userAgent
    );

    // Send OTP email
    await emailService.sendOTPEmail(user.email, resetRequest.otp, user.name);

    res.json({
      success: true,
      message: 'Password reset OTP has been sent to your email address.',
      data: {
        resetId: resetRequest._id,
        expiresIn: 600, // 10 minutes in seconds
        attemptsRemaining: 3
      }
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process password reset request. Please try again later.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/simple-auth/verify-otp
// @desc    Verify OTP for password reset
// @access  Public
router.post('/verify-otp', async (req, res) => {
  try {
    const { resetId, otp } = req.body;

    if (!resetId || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Reset ID and OTP are required'
      });
    }

    // Find reset request
    const resetRequest = await PasswordReset.findById(resetId);
    
    if (!resetRequest) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset request'
      });
    }

    // Verify OTP
    await resetRequest.verifyOTP(otp);

    res.json({
      success: true,
      message: 'OTP verified successfully. You can now reset your password.',
      data: {
        resetId: resetRequest._id,
        verified: true
      }
    });

  } catch (error) {
    console.error('OTP verification error:', error);
    
    if (error.message.includes('Invalid OTP') || 
        error.message.includes('expired') || 
        error.message.includes('attempts')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to verify OTP. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/simple-auth/reset-password
// @desc    Reset password with verified OTP
// @access  Public
router.post('/reset-password', async (req, res) => {
  try {
    const { resetId, newPassword } = req.body;

    if (!resetId || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Reset ID and new password are required'
      });
    }

    // Validate password strength
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Find and validate reset request
    const resetRequest = await PasswordReset.findById(resetId);
    
    if (!resetRequest) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset request'
      });
    }

    if (!resetRequest.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'OTP must be verified before resetting password'
      });
    }

    if (resetRequest.usedAt) {
      return res.status(400).json({
        success: false,
        message: 'This reset token has already been used'
      });
    }

    // Find user and update password
    const user = await SimpleUser.findById(resetRequest.userId);
    
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Mark reset request as used
    await resetRequest.markAsUsed();

    // Send confirmation email
    try {
      await emailService.sendPasswordResetConfirmation(user.email, user.name);
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError);
      // Don't fail the request if confirmation email fails
    }

    res.json({
      success: true,
      message: 'Password reset successfully. You can now log in with your new password.'
    });

  } catch (error) {
    console.error('Password reset error:', error);
    
    if (error.message.includes('verified') || 
        error.message.includes('used') || 
        error.message.includes('expired')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to reset password. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/simple-auth/reset-status/:resetId
// @desc    Get password reset request status
// @access  Public
router.get('/reset-status/:resetId', async (req, res) => {
  try {
    const { resetId } = req.params;

    const resetRequest = await PasswordReset.findById(resetId);
    
    if (!resetRequest) {
      return res.status(404).json({
        success: false,
        message: 'Reset request not found'
      });
    }

    res.json({
      success: true,
      data: {
        resetId: resetRequest._id,
        isExpired: resetRequest.isExpired,
        isVerified: resetRequest.isVerified,
        isUsed: !!resetRequest.usedAt,
        attemptsRemaining: Math.max(0, 3 - resetRequest.attempts),
        remainingTime: resetRequest.remainingTime,
        createdAt: resetRequest.createdAt
      }
    });

  } catch (error) {
    console.error('Reset status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get reset status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;