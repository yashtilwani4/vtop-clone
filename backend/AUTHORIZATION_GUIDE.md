# JWT Authentication & Role-Based Authorization Guide

## Overview
This document outlines the comprehensive JWT authentication and role-based authorization system implemented for the VTOP Academic Portal.

## Authentication Flow

### 1. User Login
```javascript
POST /api/auth/login
{
  "userId": "22BCE10405", // Registration number, user ID, or email
  "password": "password123"
}
```

### 2. Token Generation
- JWT tokens are generated with user ID and expiration
- Tokens include user role and permissions
- Default expiration: 7 days (configurable via JWT_EXPIRE env var)

### 3. Token Usage
```javascript
// Include in request headers
Authorization: Bearer <jwt_token>
```

## Role-Based Access Control

### Roles Hierarchy
1. **Admin** - Full system access
2. **Faculty** - Course and student management
3. **Student** - Personal academic data access

### Role Permissions Matrix

| Resource | Admin | Faculty | Student |
|----------|-------|---------|---------|
| User Management | ✅ Full | ❌ None | 🔒 Own Profile |
| Course Management | ✅ Full | 🔒 Assigned Courses | 🔒 Enrolled Courses |
| Attendance | ✅ All | 🔒 Own Courses | 🔒 Own Records |
| Results | ✅ All | 🔒 Own Courses | 🔒 Own Results |
| Notices | ✅ Full | 🔒 Create/Edit | 📖 Read Only |
| System Stats | ✅ Full | ❌ None | ❌ None |

## Authorization Middleware

### Core Middleware Functions

#### 1. `authenticate`
Verifies JWT token and loads user data
```javascript
const { authenticate } = require('./middleware/auth');
router.get('/protected', authenticate, handler);
```

#### 2. `requireAdmin`
Restricts access to admin users only
```javascript
const { requireAdmin } = require('./middleware/auth');
router.delete('/users/:id', authenticate, requireAdmin, handler);
```

#### 3. `requireFacultyOrAdmin`
Allows faculty and admin access
```javascript
const { requireFacultyOrAdmin } = require('./middleware/auth');
router.post('/attendance', authenticate, requireFacultyOrAdmin, handler);
```

#### 4. `requireStudent`
Restricts access to students only
```javascript
const { requireStudent } = require('./middleware/auth');
router.post('/courses/enroll', authenticate, requireStudent, handler);
```

#### 5. `authorizeOwnerOrPrivileged`
Allows resource owner, faculty, or admin access
```javascript
const { authorizeOwnerOrPrivileged } = require('./middleware/auth');
router.get('/users/:id', authenticate, authorizeOwnerOrPrivileged(), handler);
```

### Specialized Authorization

#### Course-Based Authorization
```javascript
const { authorizeCourse } = require('./middleware/auth');
// Ensures user has access to specific course
router.get('/attendance/course/:courseId', authenticate, authorizeCourse, handler);
```

#### Department-Based Authorization
```javascript
const { authorizeDepartment } = require('./middleware/auth');
// Restricts access to same department (except admin)
router.get('/users/students/by-department/:department', 
  authenticate, requireFacultyOrAdmin, authorizeDepartment, handler);
```

#### Semester-Based Authorization
```javascript
const { authorizeSemester } = require('./middleware/auth');
// Students can only access current/previous semesters
router.get('/results/semester/:semester', authenticate, authorizeSemester, handler);
```

## Route Protection Examples

### Admin-Only Routes
```javascript
// User management
POST /api/users                    // Create user
DELETE /api/users/:id             // Delete user
GET /api/users/stats/*            // System statistics

// System management
POST /api/courses                 // Create course
PUT /api/courses/:id              // Update course
DELETE /api/courses/:id           // Delete course
```

### Faculty/Admin Routes
```javascript
// Academic management
POST /api/attendance              // Mark attendance
PUT /api/attendance/:id           // Update attendance
POST /api/results                 // Add results
GET /api/users/students/*         // View students
```

### Student-Only Routes
```javascript
// Personal academic actions
POST /api/courses/enroll          // Enroll in course
DELETE /api/courses/drop          // Drop course
GET /api/attendance/my-attendance // View own attendance
GET /api/results/my-results       // View own results
```

## Security Features

### 1. Token Blacklisting
```javascript
// Logout blacklists the token
POST /api/auth/logout
// Token becomes invalid immediately
```

### 2. Rate Limiting
- **Authentication**: 5 attempts per 15 minutes
- **API Requests**: 100 requests per 15 minutes
- **Role-based limits**: Admin (1000), Faculty (500), Student (200)

### 3. Request Validation
- Input sanitization
- Suspicious activity detection
- XSS and SQL injection prevention

### 4. Security Headers
- Helmet.js for security headers
- CORS configuration
- Content Security Policy

## Error Codes

### Authentication Errors
- `NO_TOKEN` - No authorization header provided
- `TOKEN_REVOKED` - Token has been blacklisted
- `USER_NOT_FOUND` - Invalid token, user doesn't exist
- `ACCOUNT_DEACTIVATED` - User account is disabled
- `INVALID_TOKEN` - Malformed token
- `TOKEN_EXPIRED` - Token has expired

### Authorization Errors
- `AUTH_REQUIRED` - Authentication needed
- `INSUFFICIENT_PERMISSIONS` - Role doesn't have access
- `ADMIN_REQUIRED` - Admin access only
- `FACULTY_OR_ADMIN_REQUIRED` - Faculty/Admin access
- `STUDENT_REQUIRED` - Student access only
- `RESOURCE_ACCESS_DENIED` - Can't access this resource
- `DEPARTMENT_ACCESS_DENIED` - Wrong department
- `COURSE_ACCESS_DENIED` - Not authorized for course
- `COURSE_ENROLLMENT_REQUIRED` - Must be enrolled

## Implementation Examples

### Protecting a Route
```javascript
const express = require('express');
const { 
  authenticate, 
  requireFacultyOrAdmin, 
  authorizeCourse 
} = require('../middleware/auth');

const router = express.Router();

// Mark attendance - Faculty/Admin only, must teach the course
router.post('/course/:courseId/attendance', 
  authenticate,           // Verify JWT token
  requireFacultyOrAdmin, // Check role
  authorizeCourse,       // Verify course access
  async (req, res) => {
    // Handler logic here
  }
);
```

### Custom Authorization Logic
```javascript
const customAuthorization = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false, 
      message: 'Authentication required',
      code: 'AUTH_REQUIRED'
    });
  }
  
  // Custom logic based on business rules
  if (req.user.role === 'student' && req.user.semester < 3) {
    return res.status(403).json({
      success: false,
      message: 'Access restricted to senior students',
      code: 'SEMESTER_RESTRICTION'
    });
  }
  
  next();
};
```

## Environment Variables

```env
# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRE=7d

# Security
NODE_ENV=production
FRONTEND_URL=https://your-frontend-domain.com

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
```

## Best Practices

### 1. Token Management
- Store tokens securely on client side
- Implement token refresh mechanism
- Handle token expiration gracefully

### 2. Role Checking
- Always check roles on server side
- Don't rely on client-side role checks
- Use middleware for consistent authorization

### 3. Error Handling
- Provide clear error messages
- Log security events
- Don't expose sensitive information

### 4. Testing Authorization
```javascript
// Test with different roles
const testWithRole = async (role, endpoint, expectedStatus) => {
  const token = generateTokenForRole(role);
  const response = await request(app)
    .get(endpoint)
    .set('Authorization', `Bearer ${token}`);
  
  expect(response.status).toBe(expectedStatus);
};
```

## Monitoring & Logging

### Security Events Logged
- Failed authentication attempts
- Authorization failures
- Suspicious activity detection
- Rate limit violations
- Token blacklisting events

### Metrics to Monitor
- Authentication success/failure rates
- Authorization denial patterns
- API endpoint usage by role
- Rate limiting triggers
- Token expiration patterns

## Troubleshooting

### Common Issues

1. **Token Not Working**
   - Check token format (Bearer prefix)
   - Verify token hasn't expired
   - Ensure user account is active

2. **Access Denied**
   - Verify user role permissions
   - Check department/course authorization
   - Confirm resource ownership

3. **Rate Limiting**
   - Check request frequency
   - Verify role-based limits
   - Consider implementing request queuing

### Debug Mode
Set `NODE_ENV=development` for detailed error messages and authorization logging.