const jwt = require('jsonwebtoken');
const User = require('../models/User');
const SimpleUser = require('../models/SimpleUser');

// Token blacklist (in production, use Redis or database)
const tokenBlacklist = new Set();

// Verify JWT token
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access denied. No valid token provided.',
        code: 'NO_TOKEN'
      });
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    // Check if token is blacklisted
    if (tokenBlacklist.has(token)) {
      return res.status(401).json({ 
        success: false, 
        message: 'Token has been revoked.',
        code: 'TOKEN_REVOKED'
      });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Try SimpleUser first, then fallback to User
    let user = await SimpleUser.findById(decoded.userId).select('-password');
    if (!user) {
      user = await User.findById(decoded.userId).select('-password');
    }
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token. User not found.',
        code: 'USER_NOT_FOUND'
      });
    }
    
    if (user.isActive !== undefined && !user.isActive) {
      return res.status(401).json({ 
        success: false, 
        message: 'Account is deactivated. Contact administrator.',
        code: 'ACCOUNT_DEACTIVATED'
      });
    }
    
    // Add token to request for potential blacklisting
    req.token = token;
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token format.',
        code: 'INVALID_TOKEN'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token expired. Please login again.',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    console.error('Authentication error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Authentication error.',
      code: 'AUTH_ERROR'
    });
  }
};

// Role-based authorization with detailed permissions
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required.',
        code: 'AUTH_REQUIRED'
      });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: `Access denied. Required roles: ${roles.join(', ')}. Your role: ${req.user.role}`,
        code: 'INSUFFICIENT_PERMISSIONS',
        requiredRoles: roles,
        userRole: req.user.role
      });
    }
    
    next();
  };
};

// Admin-only authorization
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false, 
      message: 'Authentication required.',
      code: 'AUTH_REQUIRED'
    });
  }
  
  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      success: false, 
      message: 'Admin access required.',
      code: 'ADMIN_REQUIRED'
    });
  }
  
  next();
};

// Faculty or Admin authorization
const requireFacultyOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false, 
      message: 'Authentication required.',
      code: 'AUTH_REQUIRED'
    });
  }
  
  if (!['faculty', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ 
      success: false, 
      message: 'Faculty or Admin access required.',
      code: 'FACULTY_OR_ADMIN_REQUIRED'
    });
  }
  
  next();
};

// Student-only authorization
const requireStudent = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false, 
      message: 'Authentication required.',
      code: 'AUTH_REQUIRED'
    });
  }
  
  if (req.user.role !== 'student') {
    return res.status(403).json({ 
      success: false, 
      message: 'Student access required.',
      code: 'STUDENT_REQUIRED'
    });
  }
  
  next();
};

// Faculty-only authorization
const requireFaculty = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false, 
      message: 'Authentication required.',
      code: 'AUTH_REQUIRED'
    });
  }
  
  if (req.user.role !== 'faculty') {
    return res.status(403).json({ 
      success: false, 
      message: 'Faculty access required.',
      code: 'FACULTY_REQUIRED'
    });
  }
  
  next();
};

// Check if user owns resource or has admin/faculty privileges
const authorizeOwnerOrPrivileged = (resourceUserField = 'user') => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required.',
        code: 'AUTH_REQUIRED'
      });
    }
    
    // Admin can access everything
    if (req.user.role === 'admin') {
      return next();
    }
    
    // Get resource user ID from different sources
    let resourceUserId = req.params.userId || req.params.studentId || req.body[resourceUserField];
    
    // If resource is loaded in middleware, get from there
    if (req.resource && req.resource[resourceUserField]) {
      resourceUserId = req.resource[resourceUserField];
    }
    
    // Check if user owns the resource
    if (resourceUserId && resourceUserId.toString() === req.user._id.toString()) {
      return next();
    }
    
    // Faculty can access students in their courses/department
    if (req.user.role === 'faculty') {
      // Check if faculty teaches the student or same department
      if (req.user.department === req.params.department || 
          req.user.assignedCourses?.length > 0) {
        return next();
      }
    }
    
    return res.status(403).json({ 
      success: false, 
      message: 'Access denied. You can only access your own resources.',
      code: 'RESOURCE_ACCESS_DENIED'
    });
  };
};

// Department-based authorization with enhanced logic
const authorizeDepartment = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false, 
      message: 'Authentication required.',
      code: 'AUTH_REQUIRED'
    });
  }
  
  // Admin can access all departments
  if (req.user.role === 'admin') {
    return next();
  }
  
  // Get requested department from various sources
  const requestedDepartment = req.params.department || 
                             req.body.department || 
                             req.query.department;
  
  if (requestedDepartment && requestedDepartment !== req.user.department) {
    return res.status(403).json({ 
      success: false, 
      message: 'Access denied. You can only access your department resources.',
      code: 'DEPARTMENT_ACCESS_DENIED',
      userDepartment: req.user.department,
      requestedDepartment
    });
  }
  
  next();
};

// Course-based authorization (for faculty teaching specific courses)
const authorizeCourse = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false, 
      message: 'Authentication required.',
      code: 'AUTH_REQUIRED'
    });
  }
  
  // Admin can access all courses
  if (req.user.role === 'admin') {
    return next();
  }
  
  const courseId = req.params.courseId || req.body.course;
  
  if (!courseId) {
    return res.status(400).json({ 
      success: false, 
      message: 'Course ID is required.',
      code: 'COURSE_ID_REQUIRED'
    });
  }
  
  // Faculty can only access courses they teach
  if (req.user.role === 'faculty') {
    const assignedCourses = req.user.assignedCourses || [];
    if (!assignedCourses.some(course => course.toString() === courseId)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. You can only access courses you teach.',
        code: 'COURSE_ACCESS_DENIED'
      });
    }
  }
  
  // Students can only access courses they are enrolled in
  if (req.user.role === 'student') {
    const enrolledCourses = req.user.enrolledCourses || [];
    if (!enrolledCourses.some(course => course.toString() === courseId)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. You can only access courses you are enrolled in.',
        code: 'COURSE_ENROLLMENT_REQUIRED'
      });
    }
  }
  
  next();
};

// Semester-based authorization (for academic records)
const authorizeSemester = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false, 
      message: 'Authentication required.',
      code: 'AUTH_REQUIRED'
    });
  }
  
  // Admin and faculty can access all semesters
  if (['admin', 'faculty'].includes(req.user.role)) {
    return next();
  }
  
  const requestedSemester = parseInt(req.params.semester || req.body.semester);
  
  // Students can only access their current and previous semesters
  if (req.user.role === 'student' && requestedSemester) {
    if (requestedSemester > req.user.semester) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. You can only access current and previous semester data.',
        code: 'SEMESTER_ACCESS_DENIED',
        userSemester: req.user.semester,
        requestedSemester
      });
    }
  }
  
  next();
};

// Optional authentication (for public endpoints that benefit from user context)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      
      if (!tokenBlacklist.has(token)) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId).select('-password');
        
        if (user && user.isActive) {
          req.user = user;
          req.token = token;
        }
      }
    }
    
    next();
  } catch (error) {
    // Continue without authentication for optional auth
    next();
  }
};

// Blacklist token (for logout)
const blacklistToken = (token) => {
  tokenBlacklist.add(token);
  
  // Clean up old tokens periodically (in production, use proper cleanup)
  if (tokenBlacklist.size > 10000) {
    const tokensArray = Array.from(tokenBlacklist);
    tokenBlacklist.clear();
    // Keep only recent tokens (this is a simple cleanup, improve in production)
    tokensArray.slice(-5000).forEach(t => tokenBlacklist.add(t));
  }
};

// Rate limiting by user role
const rateLimitByRole = (limits = {}) => {
  const defaultLimits = {
    admin: 1000,
    faculty: 500,
    student: 100,
    guest: 50
  };
  
  const finalLimits = { ...defaultLimits, ...limits };
  
  return (req, res, next) => {
    const userRole = req.user?.role || 'guest';
    const limit = finalLimits[userRole];
    
    // Simple in-memory rate limiting (use Redis in production)
    const key = `${req.ip}_${userRole}`;
    
    // This is a placeholder - implement proper rate limiting
    req.rateLimit = { limit, remaining: limit - 1 };
    
    next();
  };
};

module.exports = {
  authenticate,
  authorize,
  requireAdmin,
  requireFacultyOrAdmin,
  requireFaculty,
  requireStudent,
  authorizeOwnerOrPrivileged,
  authorizeDepartment,
  authorizeCourse,
  authorizeSemester,
  optionalAuth,
  blacklistToken,
  rateLimitByRole,
  
  // Legacy exports for backward compatibility
  authorizeOwnerOrAdmin: authorizeOwnerOrPrivileged
};