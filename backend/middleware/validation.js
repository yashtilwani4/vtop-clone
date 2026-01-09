const { body, param, query, validationResult } = require('express-validator');

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }
  
  next();
};

// User validation rules
const validateUserRegistration = [
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  
  body('role')
    .isIn(['student', 'faculty', 'admin'])
    .withMessage('Role must be student, faculty, or admin'),
  
  body('department')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Department is required'),
  
  body('phone')
    .optional()
    .isMobilePhone('en-IN')
    .withMessage('Please provide a valid Indian phone number'),
  
  // Registration number validation for students
  body('registrationNumber')
    .optional()
    .custom((value, { req }) => {
      if (req.body.role === 'student' && value) {
        if (!/^[0-9]{2}[A-Z]{3}[0-9]{5}$/.test(value)) {
          throw new Error('Registration number must be in format YYBBB##### (e.g., 22BCE10405)');
        }
      }
      return true;
    }),
  
  // Batch validation for students
  body('batch')
    .optional()
    .custom((value, { req }) => {
      if (req.body.role === 'student' && value && !req.body.registrationNumber) {
        if (!/^[0-9]{4}$/.test(value.toString())) {
          throw new Error('Batch must be a 4-digit year (e.g., 2022)');
        }
        const year = parseInt(value);
        const currentYear = new Date().getFullYear();
        if (year < currentYear - 10 || year > currentYear + 5) {
          throw new Error('Batch year must be within reasonable range');
        }
      }
      return true;
    }),
  
  handleValidationErrors
];

const validateUserLogin = [
  body('userId')
    .trim()
    .notEmpty()
    .withMessage('User ID, Registration Number, or Email is required')
    .custom((value) => {
      // Allow email format, user ID format, or registration number format
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      const isRegistrationNumber = /^[0-9]{2}[A-Z]{3}[0-9]{5}$/.test(value.toUpperCase());
      const isUserId = /^[A-Z0-9]+$/.test(value.toUpperCase());
      
      if (!isEmail && !isRegistrationNumber && !isUserId) {
        throw new Error('Please enter a valid email, registration number (YYBBB#####), or user ID');
      }
      return true;
    }),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  handleValidationErrors
];

const validateUserUpdate = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  
  body('phone')
    .optional()
    .isMobilePhone('en-IN')
    .withMessage('Please provide a valid Indian phone number'),
  
  body('dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid date'),
  
  body('gender')
    .optional()
    .isIn(['Male', 'Female', 'Other'])
    .withMessage('Gender must be Male, Female, or Other'),
  
  handleValidationErrors
];

// Course validation rules
const validateCourse = [
  body('courseCode')
    .trim()
    .isLength({ min: 3, max: 10 })
    .withMessage('Course code must be between 3 and 10 characters')
    .matches(/^[A-Z0-9]+$/)
    .withMessage('Course code must contain only uppercase letters and numbers'),
  
  body('courseName')
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage('Course name must be between 5 and 100 characters'),
  
  body('credits')
    .isInt({ min: 1, max: 6 })
    .withMessage('Credits must be between 1 and 6'),
  
  body('department')
    .trim()
    .notEmpty()
    .withMessage('Department is required'),
  
  body('semester')
    .isInt({ min: 1, max: 8 })
    .withMessage('Semester must be between 1 and 8'),
  
  body('program')
    .trim()
    .notEmpty()
    .withMessage('Program is required'),
  
  body('courseType')
    .isIn(['Core', 'Elective', 'Lab', 'Project'])
    .withMessage('Course type must be Core, Elective, Lab, or Project'),
  
  body('maxStudents')
    .optional()
    .isInt({ min: 1, max: 200 })
    .withMessage('Max students must be between 1 and 200'),
  
  handleValidationErrors
];

// Attendance validation rules
const validateAttendance = [
  body('course')
    .isMongoId()
    .withMessage('Valid course ID is required'),
  
  body('date')
    .isISO8601()
    .withMessage('Valid date is required'),
  
  body('session.startTime')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Start time must be in HH:MM format'),
  
  body('session.endTime')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('End time must be in HH:MM format'),
  
  body('session.type')
    .optional()
    .isIn(['Lecture', 'Lab', 'Tutorial'])
    .withMessage('Session type must be Lecture, Lab, or Tutorial'),
  
  body('attendanceRecords')
    .isArray({ min: 1 })
    .withMessage('Attendance records are required'),
  
  body('attendanceRecords.*.student')
    .isMongoId()
    .withMessage('Valid student ID is required'),
  
  body('attendanceRecords.*.status')
    .isIn(['Present', 'Absent', 'Late'])
    .withMessage('Status must be Present, Absent, or Late'),
  
  handleValidationErrors
];

// Result validation rules
const validateResult = [
  body('student')
    .isMongoId()
    .withMessage('Valid student ID is required'),
  
  body('course')
    .isMongoId()
    .withMessage('Valid course ID is required'),
  
  body('academicYear')
    .matches(/^\d{4}-\d{2}$/)
    .withMessage('Academic year must be in YYYY-YY format (e.g., 2023-24)'),
  
  body('semester')
    .isInt({ min: 1, max: 8 })
    .withMessage('Semester must be between 1 and 8'),
  
  body('assessments.midterm.obtainedMarks')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Midterm marks must be a positive number'),
  
  body('assessments.endterm.obtainedMarks')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Endterm marks must be a positive number'),
  
  body('assessments.assignments.obtainedMarks')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Assignment marks must be a positive number'),
  
  handleValidationErrors
];

// Notice validation rules
const validateNotice = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),
  
  body('content')
    .trim()
    .isLength({ min: 10 })
    .withMessage('Content must be at least 10 characters long'),
  
  body('category')
    .isIn(['Academic', 'Examination', 'Admission', 'Fee', 'Event', 'Holiday', 'Emergency', 'General', 'Placement', 'Research'])
    .withMessage('Invalid category'),
  
  body('priority')
    .optional()
    .isIn(['Low', 'Medium', 'High', 'Urgent'])
    .withMessage('Priority must be Low, Medium, High, or Urgent'),
  
  body('targetAudience.roles')
    .isArray({ min: 1 })
    .withMessage('At least one target role is required'),
  
  body('targetAudience.roles.*')
    .isIn(['student', 'faculty', 'admin', 'all'])
    .withMessage('Invalid target role'),
  
  body('expiryDate')
    .optional()
    .isISO8601()
    .withMessage('Expiry date must be a valid date'),
  
  handleValidationErrors
];

// Parameter validation
const validateObjectId = (paramName) => [
  param(paramName)
    .isMongoId()
    .withMessage(`Invalid ${paramName} ID`),
  
  handleValidationErrors
];

// Query validation
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  handleValidationErrors
];

const validateDateRange = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid date'),
  
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateUserRegistration,
  validateUserLogin,
  validateUserUpdate,
  validateCourse,
  validateAttendance,
  validateResult,
  validateNotice,
  validateObjectId,
  validatePagination,
  validateDateRange
};