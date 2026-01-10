const { 
  authenticate, 
  requireAdmin, 
  requireFacultyOrAdmin, 
  requireStudent,
  authorizeCourse,
  authorizeDepartment,
  authorizeSemester,
  authorizeOwnerOrPrivileged 
} = require('./auth');

/**
 * Route Protection Configuration
 * This file defines the authorization rules for different API endpoints
 */

// Admin-only routes
const adminOnlyRoutes = [
  // User management
  'POST /api/users',
  'DELETE /api/users/:id',
  'GET /api/users/stats/*',
  'GET /api/users/faculty/*',
  
  // System management
  'POST /api/courses',
  'PUT /api/courses/:id',
  'DELETE /api/courses/:id',
  'GET /api/system/*',
  
  // Notice management (create/edit)
  'POST /api/notices',
  'PUT /api/notices/:id',
  'DELETE /api/notices/:id'
];

// Faculty or Admin routes
const facultyOrAdminRoutes = [
  // Course management
  'GET /api/courses/faculty/*',
  'POST /api/attendance',
  'PUT /api/attendance/:id',
  'POST /api/results',
  'PUT /api/results/:id',
  
  // Student data access
  'GET /api/users/students/*',
  'GET /api/attendance/course/:courseId',
  'GET /api/results/course/:courseId'
];

// Student-only routes
const studentOnlyRoutes = [
  // Course registration
  'POST /api/courses/enroll',
  'DELETE /api/courses/drop',
  
  // Personal academic data
  'GET /api/attendance/my-attendance',
  'GET /api/results/my-results',
  'GET /api/timetable/my-timetable'
];

// Routes requiring course authorization
const courseProtectedRoutes = [
  'GET /api/attendance/course/:courseId',
  'POST /api/attendance/course/:courseId',
  'GET /api/results/course/:courseId',
  'POST /api/results/course/:courseId'
];

// Routes requiring department authorization
const departmentProtectedRoutes = [
  'GET /api/users/students/by-department/:department',
  'GET /api/courses/by-department/:department',
  'GET /api/notices/by-department/:department'
];

// Routes requiring semester authorization
const semesterProtectedRoutes = [
  'GET /api/results/semester/:semester',
  'GET /api/timetable/semester/:semester'
];

/**
 * Apply route protection middleware based on route patterns
 */
const applyRouteProtection = (app) => {
  // Apply authentication to all protected routes
  app.use('/api', (req, res, next) => {
    // Skip authentication for public routes
    const publicRoutes = [
      '/auth/login',
      '/auth/register',
      '/auth/validate-registration',
      '/simple-auth/login',
      '/simple-auth/register',
      '/simple-auth/validate-registration',
      '/simple-auth/forgot-password',
      '/simple-auth/verify-otp',
      '/simple-auth/reset-password',
      '/simple-auth/reset-status',
      '/health',
      '/seed/seed-status',
      '/seed/seed-production'
    ];
    
    console.log('Route protection check:', req.method, req.path);
    
    if (publicRoutes.includes(req.path)) {
      return next();
    }
    
    // Apply authentication middleware
    authenticate(req, res, next);
  });
  
  // Apply admin-only protection
  adminOnlyRoutes.forEach(route => {
    const [method, path] = route.split(' ');
    const routePath = path.replace(/:\w+/g, '*'); // Convert :id to * for matching
    
    app.use(routePath, (req, res, next) => {
      if (req.method === method || method === 'ALL') {
        return requireAdmin(req, res, next);
      }
      next();
    });
  });
  
  // Apply faculty or admin protection
  facultyOrAdminRoutes.forEach(route => {
    const [method, path] = route.split(' ');
    const routePath = path.replace(/:\w+/g, '*');
    
    app.use(routePath, (req, res, next) => {
      if (req.method === method || method === 'ALL') {
        return requireFacultyOrAdmin(req, res, next);
      }
      next();
    });
  });
  
  // Apply student-only protection
  studentOnlyRoutes.forEach(route => {
    const [method, path] = route.split(' ');
    const routePath = path.replace(/:\w+/g, '*');
    
    app.use(routePath, (req, res, next) => {
      if (req.method === method || method === 'ALL') {
        return requireStudent(req, res, next);
      }
      next();
    });
  });
};

/**
 * Route-specific middleware combinations
 */
const routeMiddleware = {
  // User routes
  getUserById: [authenticate, authorizeOwnerOrPrivileged()],
  updateUser: [authenticate, authorizeOwnerOrPrivileged()],
  deleteUser: [authenticate, requireAdmin],
  
  // Course routes
  createCourse: [authenticate, requireAdmin],
  updateCourse: [authenticate, requireAdmin],
  deleteCourse: [authenticate, requireAdmin],
  getCourseDetails: [authenticate, authorizeCourse],
  
  // Attendance routes
  markAttendance: [authenticate, requireFacultyOrAdmin, authorizeCourse],
  viewAttendance: [authenticate, authorizeCourse],
  
  // Results routes
  addResults: [authenticate, requireFacultyOrAdmin, authorizeCourse],
  viewResults: [authenticate, authorizeCourse],
  
  // Notice routes
  createNotice: [authenticate, requireFacultyOrAdmin],
  updateNotice: [authenticate, requireFacultyOrAdmin],
  deleteNotice: [authenticate, requireAdmin],
  
  // Department-specific routes
  departmentData: [authenticate, authorizeDepartment],
  
  // Semester-specific routes
  semesterData: [authenticate, authorizeSemester]
};

/**
 * Error handler for authorization failures
 */
const authorizationErrorHandler = (err, req, res, next) => {
  if (err.name === 'UnauthorizedError' || err.status === 401) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
      code: 'AUTH_REQUIRED'
    });
  }
  
  if (err.status === 403) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Insufficient permissions.',
      code: 'ACCESS_DENIED',
      userRole: req.user?.role,
      requiredPermissions: err.requiredPermissions
    });
  }
  
  next(err);
};

/**
 * Logging middleware for authorization events
 */
const authorizationLogger = (req, res, next) => {
  if (req.user) {
    console.log(`[AUTH] ${req.user.role} (${req.user.userId}) accessing ${req.method} ${req.path}`);
  }
  next();
};

module.exports = {
  applyRouteProtection,
  routeMiddleware,
  authorizationErrorHandler,
  authorizationLogger,
  adminOnlyRoutes,
  facultyOrAdminRoutes,
  studentOnlyRoutes,
  courseProtectedRoutes,
  departmentProtectedRoutes,
  semesterProtectedRoutes
};