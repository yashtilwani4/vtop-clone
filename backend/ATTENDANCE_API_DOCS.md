# Attendance APIs Documentation

## Overview
This document describes the Attendance APIs for the VTOP Academic Portal, providing functionality for faculty to mark attendance and students to fetch their attendance records with automatic percentage calculation.

## Features
- ✅ **Mark Attendance** (Faculty only)
- ✅ **Fetch Attendance** (Students can view own, Faculty/Admin can view any)
- ✅ **Calculate Percentage Automatically**
- ✅ **Course-wise Attendance Overview**
- ✅ **Bulk Attendance Marking**
- ✅ **Attendance Status Tracking** (Present/Absent/Late)
- ✅ **Date Range Filtering**
- ✅ **Real-time Statistics**

## Authentication
All endpoints require JWT authentication via the `Authorization` header:
```
Authorization: Bearer <jwt_token>
```

## API Endpoints

### 1. Mark Attendance (Faculty Only)
**POST** `/api/simple-attendance/mark`

Mark attendance for multiple students in a course session.

#### Request Body
```json
{
  "courseId": "507f1f77bcf86cd799439011",
  "date": "2024-01-15",
  "session": {
    "startTime": "09:00",
    "endTime": "10:00",
    "type": "Lecture"
  },
  "attendanceList": [
    {
      "studentId": "507f1f77bcf86cd799439012",
      "status": "Present",
      "remarks": "Active participation"
    },
    {
      "studentId": "507f1f77bcf86cd799439013",
      "status": "Absent",
      "remarks": "Medical leave"
    },
    {
      "studentId": "507f1f77bcf86cd799439014",
      "status": "Late",
      "remarks": "Arrived 10 minutes late"
    }
  ]
}
```

#### Response
```json
{
  "success": true,
  "message": "Attendance marked successfully",
  "data": {
    "courseId": "507f1f77bcf86cd799439011",
    "date": "2024-01-15T00:00:00.000Z",
    "session": {
      "startTime": "09:00",
      "endTime": "10:00",
      "type": "Lecture"
    },
    "totalStudents": 3,
    "markedRecords": 3,
    "attendance": [
      {
        "studentId": "507f1f77bcf86cd799439012",
        "studentName": "Alice Johnson",
        "registrationNumber": "22BCE10405",
        "status": "Present",
        "remarks": "Active participation",
        "markedAt": "2024-01-15T09:30:00.000Z"
      }
    ]
  }
}
```

#### Validation Rules
- Faculty must be assigned to the course (or be admin)
- All students must be enrolled in the course
- Status must be: `Present`, `Absent`, or `Late`
- Session times must be in HH:MM format
- End time must be after start time
- Date cannot be in the future

---

### 2. Fetch Student Attendance
**GET** `/api/simple-attendance/student/:studentId?`

Fetch attendance records for a student. Students can only view their own attendance.

#### Query Parameters
- `courseId` (optional) - Filter by specific course
- `startDate` (optional) - Start date for filtering (YYYY-MM-DD)
- `endDate` (optional) - End date for filtering (YYYY-MM-DD)
- `limit` (optional) - Number of records per page (default: 50)
- `page` (optional) - Page number (default: 1)

#### Response
```json
{
  "success": true,
  "data": {
    "student": {
      "id": "507f1f77bcf86cd799439012",
      "name": "Alice Johnson",
      "registrationNumber": "22BCE10405"
    },
    "overallStats": {
      "totalClasses": 45,
      "attendedClasses": 42,
      "absentClasses": 3,
      "percentage": 93,
      "status": "Good"
    },
    "courseWiseSummary": [
      {
        "courseCode": "CSE301",
        "courseName": "Data Structures and Algorithms",
        "totalClasses": 20,
        "attendedClasses": 19,
        "absentClasses": 1,
        "lateClasses": 0,
        "percentage": 95,
        "status": "Good"
      }
    ],
    "recentAttendance": [
      {
        "id": "attendance_record_id",
        "course": {
          "id": "course_id",
          "code": "CSE301",
          "name": "Data Structures and Algorithms"
        },
        "date": "2024-01-15T00:00:00.000Z",
        "status": "Present",
        "session": {
          "startTime": "09:00",
          "endTime": "10:00",
          "type": "Lecture"
        },
        "faculty": "Prof. John Smith",
        "remarks": "Active participation",
        "markedAt": "2024-01-15T09:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 45,
      "pages": 1
    }
  }
}
```

---

### 3. Get My Attendance (Student Only)
**GET** `/api/simple-attendance/my-attendance`

Simplified endpoint for students to get their own attendance summary.

#### Query Parameters
- `startDate` (optional) - Start date for filtering
- `endDate` (optional) - End date for filtering

#### Response
```json
{
  "success": true,
  "data": {
    "student": {
      "id": "507f1f77bcf86cd799439012",
      "name": "Alice Johnson",
      "registrationNumber": "22BCE10405"
    },
    "dateRange": {
      "startDate": "All time",
      "endDate": "All time"
    },
    "overallStats": {
      "totalClasses": 45,
      "attendedClasses": 42,
      "absentClasses": 3,
      "percentage": 93,
      "status": "Good"
    },
    "courseWiseAttendance": [
      {
        "courseCode": "CSE301",
        "courseName": "Data Structures and Algorithms",
        "totalClasses": 20,
        "attendedClasses": 19,
        "percentage": 95,
        "status": "Good"
      }
    ]
  }
}
```

---

### 4. Calculate Attendance Percentage
**GET** `/api/simple-attendance/percentage/:studentId/:courseId`

Calculate attendance percentage for a specific student in a specific course.

#### Query Parameters
- `startDate` (optional) - Start date for calculation
- `endDate` (optional) - End date for calculation

#### Response
```json
{
  "success": true,
  "data": {
    "student": {
      "id": "507f1f77bcf86cd799439012",
      "name": "Alice Johnson",
      "registrationNumber": "22BCE10405"
    },
    "course": {
      "id": "507f1f77bcf86cd799439011",
      "courseCode": "CSE301",
      "courseName": "Data Structures and Algorithms"
    },
    "dateRange": {
      "startDate": "All time",
      "endDate": "All time"
    },
    "attendance": {
      "totalClasses": 20,
      "attendedClasses": 19,
      "absentClasses": 1,
      "percentage": 95,
      "status": "Good"
    }
  }
}
```

---

### 5. Course Attendance Overview (Faculty Only)
**GET** `/api/simple-attendance/course/:courseId`

Get attendance overview for a course. Faculty can only view courses they teach.

#### Query Parameters
- `date` (optional) - Get attendance for specific date (YYYY-MM-DD)
- `startDate` (optional) - Start date for range filtering
- `endDate` (optional) - End date for range filtering

#### Response (Overall Stats)
```json
{
  "success": true,
  "data": {
    "course": {
      "id": "507f1f77bcf86cd799439011",
      "courseCode": "CSE301",
      "courseName": "Data Structures and Algorithms",
      "faculty": "Prof. John Smith",
      "totalStudents": 25
    },
    "attendanceStats": [
      {
        "student": {
          "id": "507f1f77bcf86cd799439012",
          "name": "Alice Johnson",
          "registrationNumber": "22BCE10405"
        },
        "totalClasses": 20,
        "attendedClasses": 19,
        "absentClasses": 1,
        "percentage": 95,
        "status": "Good"
      }
    ]
  }
}
```

#### Response (Specific Date)
```json
{
  "success": true,
  "data": {
    "course": {
      "id": "507f1f77bcf86cd799439011",
      "courseCode": "CSE301",
      "courseName": "Data Structures and Algorithms",
      "faculty": "Prof. John Smith",
      "totalStudents": 25
    },
    "date": "2024-01-15",
    "dailyAttendance": [
      {
        "studentName": "Alice Johnson",
        "registrationNumber": "22BCE10405",
        "status": "Present",
        "session": {
          "startTime": "09:00",
          "endTime": "10:00",
          "type": "Lecture"
        },
        "remarks": "Active participation"
      }
    ]
  }
}
```

---

### 6. Update Attendance Record (Faculty Only)
**PUT** `/api/simple-attendance/:id`

Update an existing attendance record.

#### Request Body
```json
{
  "status": "Present",
  "remarks": "Updated: Student provided medical certificate"
}
```

#### Response
```json
{
  "success": true,
  "message": "Attendance updated successfully",
  "data": {
    "id": "attendance_record_id",
    "student": {
      "id": "507f1f77bcf86cd799439012",
      "name": "Alice Johnson",
      "registrationNumber": "22BCE10405"
    },
    "course": {
      "id": "507f1f77bcf86cd799439011",
      "code": "CSE301",
      "name": "Data Structures and Algorithms"
    },
    "date": "2024-01-15T00:00:00.000Z",
    "status": "Present",
    "session": {
      "startTime": "09:00",
      "endTime": "10:00",
      "type": "Lecture"
    },
    "remarks": "Updated: Student provided medical certificate",
    "markedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

## Attendance Status Categories

### Status Values
- **Present** - Student attended the class
- **Absent** - Student did not attend the class
- **Late** - Student arrived late but attended

### Percentage Status
- **Good** - 85% and above (Green)
- **Warning** - 75% to 84% (Yellow)
- **Critical** - Below 75% (Red)

## Automatic Percentage Calculation

The system automatically calculates attendance percentages using the following logic:

```javascript
// Attended classes include both "Present" and "Late" status
attendedClasses = Present + Late
percentage = (attendedClasses / totalClasses) * 100

// Status determination
if (percentage >= 85) status = "Good"
else if (percentage >= 75) status = "Warning"
else status = "Critical"
```

## Usage Examples

### Faculty Marking Attendance
```javascript
// 1. Get course and enrolled students
const course = await getCourse(courseId);
const students = course.studentsEnrolled;

// 2. Prepare attendance data
const attendanceData = {
  courseId: courseId,
  date: '2024-01-15',
  session: {
    startTime: '09:00',
    endTime: '10:00',
    type: 'Lecture'
  },
  attendanceList: students.map(student => ({
    studentId: student._id,
    status: 'Present', // or 'Absent', 'Late'
    remarks: ''
  }))
};

// 3. Mark attendance
const response = await markAttendance(attendanceData);
```

### Student Checking Attendance
```javascript
// 1. Get own attendance summary
const myAttendance = await getMyAttendance();

// 2. Check overall percentage
console.log('Overall attendance:', myAttendance.overallStats.percentage + '%');

// 3. Check course-wise breakdown
myAttendance.courseWiseAttendance.forEach(course => {
  console.log(`${course.courseCode}: ${course.percentage}% (${course.status})`);
});
```

### Faculty Monitoring Course
```javascript
// 1. Get course attendance overview
const courseStats = await getCourseAttendance(courseId);

// 2. Identify students with poor attendance
const poorAttendance = courseStats.attendanceStats.filter(
  student => student.status === 'Critical'
);

// 3. Generate reports
console.log(`${poorAttendance.length} students need attention`);
```

## Error Handling

### Common Error Responses

#### Authentication Error
```json
{
  "success": false,
  "message": "Access denied. No token provided."
}
```

#### Authorization Error
```json
{
  "success": false,
  "message": "Faculty or admin access required"
}
```

#### Validation Error
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    "Status must be Present, Absent, or Late",
    "Student is not enrolled in this course"
  ]
}
```

#### Not Found Error
```json
{
  "success": false,
  "message": "Course not found"
}
```

## Security Features

1. **Role-based Access Control**
   - Faculty can only mark attendance for assigned courses
   - Students can only view their own attendance
   - Admin can access all attendance data

2. **Data Validation**
   - Validates student enrollment in courses
   - Prevents duplicate attendance for same date
   - Validates session times and dates

3. **Reference Integrity**
   - Ensures all referenced users and courses exist
   - Validates user roles (student/faculty)
   - Maintains data consistency

## Performance Considerations

1. **Database Indexes**
   - Compound index on (courseId, studentId, date)
   - Indexes on courseId, studentId, and date fields
   - Optimized for common query patterns

2. **Bulk Operations**
   - Bulk attendance marking for efficiency
   - Aggregation pipelines for statistics
   - Pagination for large datasets

3. **Caching Opportunities**
   - Course enrollment data
   - User role information
   - Attendance statistics

## Integration Examples

### Frontend Integration
```javascript
// React component for marking attendance
const MarkAttendance = ({ courseId, students }) => {
  const [attendance, setAttendance] = useState(
    students.map(student => ({
      studentId: student._id,
      status: 'Present',
      remarks: ''
    }))
  );

  const handleSubmit = async () => {
    const data = {
      courseId,
      date: new Date().toISOString().split('T')[0],
      session: {
        startTime: '09:00',
        endTime: '10:00',
        type: 'Lecture'
      },
      attendanceList: attendance
    };

    await markAttendance(data);
  };

  return (
    <form onSubmit={handleSubmit}>
      {students.map((student, index) => (
        <div key={student._id}>
          <span>{student.name}</span>
          <select 
            value={attendance[index].status}
            onChange={(e) => updateAttendance(index, 'status', e.target.value)}
          >
            <option value="Present">Present</option>
            <option value="Absent">Absent</option>
            <option value="Late">Late</option>
          </select>
        </div>
      ))}
      <button type="submit">Mark Attendance</button>
    </form>
  );
};
```

### Mobile App Integration
```javascript
// React Native component for student attendance view
const AttendanceScreen = () => {
  const [attendance, setAttendance] = useState(null);

  useEffect(() => {
    fetchMyAttendance().then(setAttendance);
  }, []);

  return (
    <ScrollView>
      <Text>Overall Attendance: {attendance?.overallStats.percentage}%</Text>
      {attendance?.courseWiseAttendance.map(course => (
        <View key={course.courseCode}>
          <Text>{course.courseCode}: {course.percentage}%</Text>
          <ProgressBar 
            progress={course.percentage / 100}
            color={getStatusColor(course.status)}
          />
        </View>
      ))}
    </ScrollView>
  );
};
```

## Testing

Run the example file to test the APIs:
```bash
cd server
node examples/attendanceApiExample.js
```

## File Locations

- **Schema**: `server/models/SimpleAttendance.js`
- **Routes**: `server/routes/simpleAttendance.js`
- **Examples**: `server/examples/attendanceApiExample.js`
- **Documentation**: `server/ATTENDANCE_API_DOCS.md`