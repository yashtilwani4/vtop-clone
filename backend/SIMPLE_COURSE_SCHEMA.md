# MongoDB Course Schema Documentation

## Overview
This document describes the simplified MongoDB Course schema for the VTOP Academic Portal with the requested fields: courseCode, courseName, credits, facultyId, and studentsEnrolled.

## Schema Definition

### Fields

#### 1. `courseCode` (String)
- **Required**: Yes
- **Type**: String
- **Unique**: Yes
- **Validation**: 
  - Minimum length: 3 characters
  - Maximum length: 10 characters
  - Must contain only uppercase letters and numbers
  - Automatically converted to uppercase
  - Automatically trimmed
- **Description**: Unique identifier for the course
- **Example**: `"CSE301"`, `"MATH201"`, `"PHY101"`

#### 2. `courseName` (String)
- **Required**: Yes
- **Type**: String
- **Validation**: 
  - Minimum length: 5 characters
  - Maximum length: 200 characters
  - Automatically trimmed
- **Description**: Full name of the course
- **Example**: `"Data Structures and Algorithms"`, `"Linear Algebra"`

#### 3. `credits` (Number)
- **Required**: Yes
- **Type**: Number (Integer)
- **Validation**: 
  - Minimum value: 1
  - Maximum value: 6
  - Must be a whole number (integer)
- **Description**: Number of credit hours for the course
- **Example**: `3`, `4`, `1`

#### 4. `facultyId` (ObjectId)
- **Required**: Yes
- **Type**: mongoose.Schema.Types.ObjectId
- **Reference**: SimpleUser model
- **Validation**: 
  - Must be a valid MongoDB ObjectId
  - Referenced user must exist
  - Referenced user must have role 'faculty' or 'admin'
- **Description**: Reference to the faculty member teaching the course
- **Example**: `ObjectId("507f1f77bcf86cd799439011")`

#### 5. `studentsEnrolled` (Array of ObjectIds)
- **Required**: No (defaults to empty array)
- **Type**: Array of mongoose.Schema.Types.ObjectId
- **Reference**: SimpleUser model
- **Validation**: 
  - Each element must be a valid MongoDB ObjectId
  - Referenced users must exist
  - Referenced users must have role 'student'
- **Description**: Array of student IDs enrolled in the course
- **Example**: `[ObjectId("507f1f77bcf86cd799439012"), ObjectId("507f1f77bcf86cd799439013")]`

#### 6. `createdAt` / `updatedAt` (Date)
- **Required**: No (auto-generated)
- **Type**: Date
- **Description**: Automatic timestamps for creation and last update
- **Auto-managed**: Yes (via timestamps option)

## Schema Features

### Automatic Timestamps
```javascript
{
  timestamps: true // Adds createdAt and updatedAt
}
```

### Population Support
```javascript
// Populate faculty and students
await course.populate('facultyId', 'name email role');
await course.populate('studentsEnrolled', 'name email registrationNumber');
```

### JSON Transform
```javascript
// Removes version key from JSON responses
toJSON: {
  transform: function(doc, ret) {
    delete ret.__v;
    return ret;
  }
}
```

## Virtual Properties

### `enrollmentCount`
Returns the number of students enrolled in the course.
```javascript
console.log('Enrollment count:', course.enrollmentCount);
```

### `isFull`
Checks if the course has reached maximum capacity (default: 60 students).
```javascript
console.log('Course is full:', course.isFull);
```

## Instance Methods

### `enrollStudent(studentId)`
Enrolls a student in the course.
```javascript
await course.enrollStudent(studentId);
```

### `unenrollStudent(studentId)`
Removes a student from the course.
```javascript
await course.unenrollStudent(studentId);
```

### `isStudentEnrolled(studentId)`
Checks if a student is enrolled in the course.
```javascript
const isEnrolled = course.isStudentEnrolled(studentId);
```

## Static Methods

### `findByFaculty(facultyId)`
Finds all courses taught by a specific faculty member.
```javascript
const courses = await SimpleCourse.findByFaculty(facultyId);
```

### `findByStudent(studentId)`
Finds all courses a student is enrolled in.
```javascript
const courses = await SimpleCourse.findByStudent(studentId);
```

### `findByCredits(credits)`
Finds all courses with a specific credit value.
```javascript
const courses = await SimpleCourse.findByCredits(4);
```

### `getStatistics()`
Returns comprehensive course statistics.
```javascript
const stats = await SimpleCourse.getStatistics();
// Returns: { overview: {...}, creditDistribution: [...] }
```

## Usage Examples

### Creating Courses

#### Basic Course
```javascript
const course = new SimpleCourse({
  courseCode: 'CSE301',
  courseName: 'Data Structures and Algorithms',
  credits: 4,
  facultyId: facultyObjectId,
  studentsEnrolled: []
});
await course.save();
```

#### Course with Students
```javascript
const course = new SimpleCourse({
  courseCode: 'MATH201',
  courseName: 'Linear Algebra and Calculus',
  credits: 3,
  facultyId: facultyObjectId,
  studentsEnrolled: [studentId1, studentId2]
});
await course.save();
```

### Querying Courses

#### Find All Courses
```javascript
const courses = await SimpleCourse.find()
  .populate('facultyId', 'name email')
  .populate('studentsEnrolled', 'name registrationNumber');
```

#### Find by Course Code
```javascript
const course = await SimpleCourse.findOne({ courseCode: 'CSE301' });
```

#### Find Courses with Filters
```javascript
// Find 4-credit courses
const courses = await SimpleCourse.find({ credits: 4 });

// Find courses by faculty
const courses = await SimpleCourse.find({ facultyId: facultyId });

// Find courses with specific student enrolled
const courses = await SimpleCourse.find({ studentsEnrolled: studentId });
```

### Course Management

#### Enroll Student
```javascript
const course = await SimpleCourse.findById(courseId);
await course.enrollStudent(studentId);
console.log('New enrollment count:', course.enrollmentCount);
```

#### Unenroll Student
```javascript
const course = await SimpleCourse.findById(courseId);
await course.unenrollStudent(studentId);
```

#### Check Enrollment
```javascript
const course = await SimpleCourse.findById(courseId);
const isEnrolled = course.isStudentEnrolled(studentId);
console.log('Student enrolled:', isEnrolled);
```

## Validation Rules

### Valid Examples
```javascript
// Valid basic course
{
  courseCode: 'CSE301',
  courseName: 'Data Structures and Algorithms',
  credits: 4,
  facultyId: ObjectId('507f1f77bcf86cd799439011'),
  studentsEnrolled: []
}

// Valid course with students
{
  courseCode: 'MATH201',
  courseName: 'Linear Algebra and Calculus',
  credits: 3,
  facultyId: ObjectId('507f1f77bcf86cd799439011'),
  studentsEnrolled: [
    ObjectId('507f1f77bcf86cd799439012'),
    ObjectId('507f1f77bcf86cd799439013')
  ]
}
```

### Invalid Examples
```javascript
// Missing courseCode
{
  courseName: 'Test Course',
  credits: 3,
  facultyId: ObjectId('507f1f77bcf86cd799439011')
} // Error: Course code is required

// Invalid courseCode format
{
  courseCode: 'cs301', // Should be uppercase
  courseName: 'Test Course',
  credits: 3,
  facultyId: ObjectId('507f1f77bcf86cd799439011')
} // Error: Course code must contain only uppercase letters and numbers

// Invalid credits
{
  courseCode: 'CSE301',
  courseName: 'Test Course',
  credits: 0, // Below minimum
  facultyId: ObjectId('507f1f77bcf86cd799439011')
} // Error: Credits must be at least 1

// Invalid facultyId
{
  courseCode: 'CSE301',
  courseName: 'Test Course',
  credits: 3,
  facultyId: 'invalid-id' // Not a valid ObjectId
} // Error: Faculty ID must be a valid ObjectId
```

## Database Indexes

The schema automatically creates the following indexes:
- `courseCode`: Unique index (from unique: true)
- `facultyId`: Regular index for faculty queries
- `studentsEnrolled`: Regular index for student queries
- `credits`: Regular index for filtering by credits
- `createdAt`: Descending index for sorting

## Pre/Post Middleware

### Pre-save Validation
- Validates that facultyId references a user with 'faculty' or 'admin' role
- Validates that all studentsEnrolled reference users with 'student' role

### Post-save Updates
- Automatically updates user records to maintain course references (if fields exist)

## API Integration

### Simple Course Routes
The schema works with the provided simple course routes:

- `POST /api/simple-courses` - Create new course
- `GET /api/simple-courses` - List courses with filters
- `GET /api/simple-courses/:id` - Get course details
- `PUT /api/simple-courses/:id` - Update course
- `DELETE /api/simple-courses/:id` - Delete course
- `POST /api/simple-courses/:id/enroll` - Enroll student
- `POST /api/simple-courses/:id/unenroll` - Unenroll student
- `GET /api/simple-courses/faculty/:facultyId` - Get courses by faculty
- `GET /api/simple-courses/student/:studentId` - Get courses by student
- `GET /api/simple-courses/stats/overview` - Get course statistics

## Course Statistics

The `getStatistics()` method returns:

```javascript
{
  overview: {
    totalCourses: 25,
    totalCredits: 95,
    averageCredits: 3.8,
    totalEnrollments: 450,
    averageEnrollment: 18
  },
  creditDistribution: [
    { _id: 1, count: 3 },  // 3 courses with 1 credit
    { _id: 3, count: 12 }, // 12 courses with 3 credits
    { _id: 4, count: 10 }  // 10 courses with 4 credits
  ]
}
```

## Testing

Run the example file to test the schema:
```bash
cd server
node examples/courseSchemaExample.js
```

## File Locations

- **Schema**: `server/models/SimpleCourse.js`
- **Routes**: `server/routes/simpleCourses.js`
- **Examples**: `server/examples/courseSchemaExample.js`
- **Documentation**: `server/SIMPLE_COURSE_SCHEMA.md`

## Security Considerations

1. **Reference Validation**: Ensures faculty and students exist and have correct roles
2. **Data Integrity**: Prevents invalid enrollments and assignments
3. **Unique Constraints**: Course codes must be unique
4. **Input Validation**: Comprehensive field validation
5. **Automatic Updates**: Maintains referential integrity with user records

## Common Use Cases

### 1. Course Registration System
```javascript
// Student enrolls in course
const course = await SimpleCourse.findOne({ courseCode: 'CSE301' });
if (!course.isFull) {
  await course.enrollStudent(studentId);
}
```

### 2. Faculty Dashboard
```javascript
// Get all courses taught by faculty
const courses = await SimpleCourse.findByFaculty(facultyId);
const totalStudents = courses.reduce((sum, course) => sum + course.enrollmentCount, 0);
```

### 3. Student Dashboard
```javascript
// Get student's enrolled courses
const courses = await SimpleCourse.findByStudent(studentId);
const totalCredits = courses.reduce((sum, course) => sum + course.credits, 0);
```

### 4. Academic Reports
```javascript
// Get comprehensive statistics
const stats = await SimpleCourse.getStatistics();
console.log(`Total courses: ${stats.overview.totalCourses}`);
console.log(`Average enrollment: ${stats.overview.averageEnrollment}`);
```

## Migration from Complex Schema

If migrating from the complex Course schema:
1. Map existing fields to new simplified structure
2. Extract `faculty` ObjectId to `facultyId`
3. Extract `enrolledStudents` array to `studentsEnrolled`
4. Keep `courseCode`, `courseName`, `credits` as-is
5. Store additional metadata in separate collections if needed