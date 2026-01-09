# Timetable APIs Documentation

## Overview
This document describes the Timetable APIs for the VTOP Academic Portal, providing functionality for administrators to create timetables, students to fetch their timetables, and faculty to see their assigned slots.

## Features
- ✅ **Admin Creates Timetable** (Complete timetable management)
- ✅ **Students Fetch Timetable** (View class schedules with current slot info)
- ✅ **Faculty Sees Assigned Slots** (View teaching assignments and statistics)
- ✅ **Room Utilization Tracking** (Monitor room usage across departments)
- ✅ **Conflict Detection** (Automatic detection of scheduling conflicts)
- ✅ **Statistics and Analytics** (Comprehensive timetable insights)

## Authentication
All endpoints require JWT authentication via the `Authorization` header:
```
Authorization: Bearer <jwt_token>
```

## Timetable Structure

### Weekly Schedule Format
```json
{
  "weeklySchedule": [
    {
      "day": "Monday",
      "slots": [
        {
          "slotNumber": 1,
          "startTime": "09:00",
          "endTime": "10:00",
          "courseId": "course_object_id",
          "facultyId": "faculty_object_id",
          "room": "A101",
          "slotType": "Lecture",
          "isBreak": false,
          "duration": 60
        }
      ]
    }
  ]
}
```

### Slot Types
- **Lecture**: Regular class lectures
- **Lab**: Laboratory sessions
- **Tutorial**: Tutorial sessions
- **Practical**: Practical sessions
- **Break**: Break periods (tea/lunch)
- **Free**: Free periods

### Timetable Status
- **Draft**: Under creation, not visible to students
- **Active**: Currently active and visible to all users
- **Inactive**: Temporarily disabled
- **Archived**: Historical timetables

## API Endpoints

### 1. Create Timetable (Admin Only)
**POST** `/api/simple-timetable/create`

Create a new timetable for a specific class.

#### Request Body
```json
{
  "academicYear": "2023-24",
  "semester": 5,
  "department": "CSE",
  "program": "B.Tech",
  "section": "A",
  "effectiveFrom": "2024-01-15",
  "effectiveTo": "2024-05-15",
  "notes": "Regular semester timetable",
  "weeklySchedule": [
    {
      "day": "Monday",
      "slots": [
        {
          "slotNumber": 1,
          "startTime": "09:00",
          "endTime": "10:00",
          "courseId": "507f1f77bcf86cd799439011",
          "facultyId": "507f1f77bcf86cd799439012",
          "room": "A101",
          "slotType": "Lecture",
          "isBreak": false,
          "duration": 60
        },
        {
          "slotNumber": 2,
          "startTime": "10:00",
          "endTime": "11:00",
          "courseId": "507f1f77bcf86cd799439013",
          "facultyId": "507f1f77bcf86cd799439014",
          "room": "A101",
          "slotType": "Lecture",
          "isBreak": false,
          "duration": 60
        },
        {
          "slotNumber": 3,
          "startTime": "11:00",
          "endTime": "11:15",
          "room": "BREAK",
          "slotType": "Break",
          "isBreak": true,
          "duration": 15
        }
      ]
    },
    {
      "day": "Tuesday",
      "slots": [
        {
          "slotNumber": 1,
          "startTime": "09:00",
          "endTime": "11:00",
          "courseId": "507f1f77bcf86cd799439015",
          "facultyId": "507f1f77bcf86cd799439016",
          "room": "LAB1",
          "slotType": "Lab",
          "isBreak": false,
          "duration": 120
        }
      ]
    }
  ]
}
```

#### Response
```json
{
  "success": true,
  "message": "Timetable created successfully",
  "data": {
    "timetable": {
      "id": "timetable_id",
      "academicYear": "2023-24",
      "semester": 5,
      "department": "CSE",
      "program": "B.Tech",
      "section": "A",
      "status": "Draft",
      "totalHours": 25.5,
      "weeklyHours": 25.5,
      "effectiveFrom": "2024-01-15T00:00:00.000Z",
      "effectiveTo": "2024-05-15T00:00:00.000Z",
      "notes": "Regular semester timetable",
      "weeklySchedule": [
        {
          "day": "Monday",
          "slots": [
            {
              "slotNumber": 1,
              "startTime": "09:00",
              "endTime": "10:00",
              "courseId": {
                "_id": "course_id",
                "courseCode": "CSE301",
                "courseName": "Data Structures",
                "credits": 4
              },
              "facultyId": {
                "_id": "faculty_id",
                "name": "Dr. John Smith",
                "email": "john.smith@university.edu"
              },
              "room": "A101",
              "slotType": "Lecture",
              "duration": 60
            }
          ]
        }
      ],
      "createdBy": {
        "_id": "admin_id",
        "name": "Admin User"
      },
      "createdAt": "2024-01-15T10:00:00.000Z"
    }
  }
}
```

---

### 2. Get Student Timetable (Student Only)
**GET** `/api/simple-timetable/student`

Fetch the student's class timetable with current slot information.

#### Query Parameters
- `academicYear` (optional) - Filter by academic year (e.g., "2023-24")
- `semester` (optional) - Filter by semester (1-8)

#### Response
```json
{
  "success": true,
  "data": {
    "student": {
      "id": "student_id",
      "name": "Alice Johnson",
      "registrationNumber": "22BCE10405",
      "department": "CSE",
      "program": "B.Tech",
      "semester": 5,
      "section": "A"
    },
    "timetable": {
      "id": "timetable_id",
      "academicYear": "2023-24",
      "semester": 5,
      "department": "CSE",
      "program": "B.Tech",
      "section": "A",
      "totalHours": 25.5,
      "weeklyHours": 25.5,
      "effectiveFrom": "2024-01-15T00:00:00.000Z",
      "effectiveTo": "2024-05-15T00:00:00.000Z",
      "weeklySchedule": [
        {
          "day": "Monday",
          "slots": [
            {
              "slotNumber": 1,
              "startTime": "09:00",
              "endTime": "10:00",
              "courseId": {
                "_id": "course_id",
                "courseCode": "CSE301",
                "courseName": "Data Structures and Algorithms",
                "credits": 4
              },
              "facultyId": {
                "_id": "faculty_id",
                "name": "Dr. John Smith",
                "email": "john.smith@university.edu"
              },
              "room": "A101",
              "slotType": "Lecture",
              "duration": 60
            }
          ]
        }
      ]
    },
    "currentInfo": {
      "currentDay": "Monday",
      "currentTime": "09:30",
      "currentSlot": {
        "slotNumber": 1,
        "startTime": "09:00",
        "endTime": "10:00",
        "courseId": {
          "courseCode": "CSE301",
          "courseName": "Data Structures and Algorithms"
        },
        "facultyId": {
          "name": "Dr. John Smith"
        },
        "room": "A101",
        "slotType": "Lecture"
      },
      "nextSlot": {
        "slotNumber": 2,
        "startTime": "10:00",
        "endTime": "11:00",
        "courseId": {
          "courseCode": "CSE302",
          "courseName": "Database Management Systems"
        },
        "room": "A102"
      }
    }
  }
}
```

---

### 3. Get Faculty Assigned Slots (Faculty Only)
**GET** `/api/simple-timetable/faculty`

Fetch faculty's teaching assignments and statistics.

#### Query Parameters
- `academicYear` (optional) - Filter by academic year
- `semester` (optional) - Filter by semester

#### Response
```json
{
  "success": true,
  "data": {
    "faculty": {
      "id": "faculty_id",
      "name": "Dr. John Smith",
      "email": "john.smith@university.edu",
      "department": "CSE"
    },
    "schedule": [
      {
        "_id": {
          "day": "Monday",
          "academicYear": "2023-24",
          "semester": 5
        },
        "slots": [
          {
            "slotNumber": 1,
            "startTime": "09:00",
            "endTime": "10:00",
            "course": {
              "_id": "course_id",
              "courseCode": "CSE301",
              "courseName": "Data Structures and Algorithms",
              "credits": 4
            },
            "room": "A101",
            "slotType": "Lecture",
            "duration": 60,
            "department": "CSE",
            "program": "B.Tech",
            "section": "A"
          },
          {
            "slotNumber": 3,
            "startTime": "11:15",
            "endTime": "12:15",
            "course": {
              "_id": "course_id_2",
              "courseCode": "CSE302",
              "courseName": "Database Management Systems",
              "credits": 3
            },
            "room": "A102",
            "slotType": "Lecture",
            "duration": 60,
            "department": "CSE",
            "program": "B.Tech",
            "section": "B"
          }
        ]
      }
    ],
    "statistics": {
      "totalSlots": 15,
      "totalHours": 18.5,
      "coursesAssigned": 3,
      "courseStats": {
        "CSE301": {
          "courseName": "Data Structures and Algorithms",
          "credits": 4,
          "slots": 6,
          "hours": 6.0,
          "sections": ["CSE-B.Tech-A", "CSE-B.Tech-B"]
        },
        "CSE302": {
          "courseName": "Database Management Systems",
          "credits": 3,
          "slots": 5,
          "hours": 7.5,
          "sections": ["CSE-B.Tech-A"]
        }
      },
      "dayStats": {
        "Monday": 3,
        "Tuesday": 2,
        "Wednesday": 4,
        "Thursday": 3,
        "Friday": 2,
        "Saturday": 1
      }
    },
    "filters": {
      "academicYear": "2023-24",
      "semester": "5"
    }
  }
}
```

---

### 4. Get All Timetables (Admin Only)
**GET** `/api/simple-timetable/admin/all`

Fetch all timetables with filtering and pagination.

#### Query Parameters
- `academicYear` (optional) - Filter by academic year
- `semester` (optional) - Filter by semester
- `department` (optional) - Filter by department
- `program` (optional) - Filter by program
- `section` (optional) - Filter by section
- `status` (optional) - Filter by status
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Items per page (default: 10)

#### Response
```json
{
  "success": true,
  "data": {
    "timetables": [
      {
        "id": "timetable_id",
        "academicYear": "2023-24",
        "semester": 5,
        "department": "CSE",
        "program": "B.Tech",
        "section": "A",
        "status": "Active",
        "totalHours": 25.5,
        "weeklyHours": 25.5,
        "effectiveFrom": "2024-01-15T00:00:00.000Z",
        "effectiveTo": "2024-05-15T00:00:00.000Z",
        "createdBy": {
          "_id": "admin_id",
          "name": "Admin User",
          "email": "admin@university.edu"
        },
        "createdAt": "2024-01-15T10:00:00.000Z",
        "weeklySchedule": [...]
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalTimetables": 25,
      "hasNextPage": true,
      "hasPrevPage": false
    },
    "filters": {
      "academicYear": "2023-24",
      "semester": "5",
      "department": "CSE",
      "program": null,
      "section": null,
      "status": "Active"
    }
  }
}
```

---

### 5. Activate Timetable (Admin Only)
**PUT** `/api/simple-timetable/:id/activate`

Activate a timetable and deactivate others for the same class.

#### Response
```json
{
  "success": true,
  "message": "Timetable activated successfully",
  "data": {
    "timetable": {
      "id": "timetable_id",
      "academicYear": "2023-24",
      "semester": 5,
      "department": "CSE",
      "program": "B.Tech",
      "section": "A",
      "status": "Active",
      "weeklySchedule": [...],
      "updatedAt": "2024-01-15T15:00:00.000Z"
    }
  }
}
```

---

### 6. Update Timetable (Admin Only)
**PUT** `/api/simple-timetable/:id`

Update an existing timetable.

#### Request Body
```json
{
  "weeklySchedule": [...],
  "effectiveTo": "2024-06-15",
  "notes": "Updated timetable with new lab sessions",
  "status": "Active"
}
```

#### Response
```json
{
  "success": true,
  "message": "Timetable updated successfully",
  "data": {
    "timetable": {
      "id": "timetable_id",
      "academicYear": "2023-24",
      "semester": 5,
      "department": "CSE",
      "program": "B.Tech",
      "section": "A",
      "status": "Active",
      "weeklySchedule": [...],
      "totalHours": 27.0,
      "weeklyHours": 27.0,
      "effectiveFrom": "2024-01-15T00:00:00.000Z",
      "effectiveTo": "2024-06-15T00:00:00.000Z",
      "notes": "Updated timetable with new lab sessions",
      "updatedAt": "2024-01-15T16:00:00.000Z"
    }
  }
}
```

---

### 7. Get Room Utilization (Admin Only)
**GET** `/api/simple-timetable/room/:room`

Get room utilization statistics and schedule.

#### Query Parameters
- `academicYear` (optional) - Filter by academic year
- `semester` (optional) - Filter by semester

#### Response
```json
{
  "success": true,
  "data": {
    "room": "A101",
    "schedule": [
      {
        "_id": "Monday",
        "slots": [
          {
            "slotNumber": 1,
            "startTime": "09:00",
            "endTime": "10:00",
            "course": {
              "_id": "course_id",
              "courseCode": "CSE301",
              "courseName": "Data Structures"
            },
            "faculty": {
              "_id": "faculty_id",
              "name": "Dr. John Smith"
            },
            "slotType": "Lecture",
            "department": "CSE",
            "program": "B.Tech",
            "section": "A"
          }
        ]
      }
    ],
    "statistics": {
      "totalSlots": 25,
      "totalHours": 30.5,
      "utilizationPercentage": 64,
      "dayStats": {
        "Monday": 5,
        "Tuesday": 4,
        "Wednesday": 6,
        "Thursday": 5,
        "Friday": 3,
        "Saturday": 2
      },
      "departmentStats": {
        "CSE": {
          "slots": 15,
          "hours": 18.5
        },
        "ECE": {
          "slots": 10,
          "hours": 12.0
        }
      }
    },
    "filters": {
      "academicYear": "2023-24",
      "semester": "5"
    }
  }
}
```

---

### 8. Get Timetable Statistics (Admin Only)
**GET** `/api/simple-timetable/stats`

Get comprehensive timetable statistics and analytics.

#### Query Parameters
- `academicYear` (optional) - Filter by academic year
- `semester` (optional) - Filter by semester

#### Response
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalTimetables": 45,
      "activeTimetables": 25,
      "inactiveTimetables": 20,
      "totalSlots": 1250,
      "totalHours": 1875.5,
      "totalDepartments": 8,
      "totalPrograms": 12,
      "totalRooms": 45,
      "totalFaculty": 85,
      "totalCourses": 120,
      "slotTypeDistribution": {
        "Lecture": 800,
        "Lab": 300,
        "Tutorial": 100,
        "Practical": 50
      }
    },
    "statusDistribution": {
      "Active": 25,
      "Draft": 15,
      "Inactive": 5
    },
    "filters": {
      "academicYear": "2023-24",
      "semester": "All"
    }
  }
}
```

---

### 9. Delete Timetable (Admin Only)
**DELETE** `/api/simple-timetable/:id`

Delete a timetable (only if not active).

#### Response
```json
{
  "success": true,
  "message": "Timetable deleted successfully",
  "data": {
    "deletedTimetable": {
      "id": "timetable_id",
      "academicYear": "2023-24",
      "semester": 5,
      "department": "CSE",
      "program": "B.Tech",
      "section": "A"
    }
  }
}
```

## Conflict Detection

The system automatically detects and prevents the following conflicts:

### 1. Time Overlaps
- Slots with overlapping time periods in the same day
- Prevents double-booking of time slots

### 2. Room Conflicts
- Multiple classes assigned to the same room at the same time
- Ensures room availability

### 3. Faculty Conflicts
- Faculty assigned to multiple slots at the same time
- Prevents faculty double-booking

### Example Conflict Response
```json
{
  "success": false,
  "message": "Timetable has scheduling conflicts",
  "conflicts": [
    {
      "day": "Monday",
      "type": "Room Conflict",
      "room": "A101",
      "slots": [
        {
          "slotNumber": 1,
          "startTime": "09:00",
          "endTime": "10:00"
        },
        {
          "slotNumber": 2,
          "startTime": "09:30",
          "endTime": "10:30"
        }
      ],
      "message": "Room A101 is double-booked"
    }
  ]
}
```

## Usage Examples

### Admin Creating a Timetable
```javascript
const createTimetable = async () => {
  const timetableData = {
    academicYear: '2023-24',
    semester: 5,
    department: 'CSE',
    program: 'B.Tech',
    section: 'A',
    effectiveFrom: '2024-01-15',
    weeklySchedule: [
      {
        day: 'Monday',
        slots: [
          {
            slotNumber: 1,
            startTime: '09:00',
            endTime: '10:00',
            courseId: 'course_id_1',
            facultyId: 'faculty_id_1',
            room: 'A101',
            slotType: 'Lecture',
            duration: 60
          }
        ]
      }
    ]
  };

  const response = await fetch('/api/simple-timetable/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify(timetableData)
  });

  const result = await response.json();
  console.log('Timetable created:', result);
};
```

### Student Fetching Timetable
```javascript
const getMyTimetable = async () => {
  const response = await fetch('/api/simple-timetable/student', {
    headers: {
      'Authorization': `Bearer ${studentToken}`
    }
  });

  const result = await response.json();
  console.log('My timetable:', result.data.timetable);
  console.log('Current slot:', result.data.currentInfo.currentSlot);
};
```

### Faculty Checking Assignments
```javascript
const getMyAssignments = async () => {
  const response = await fetch('/api/simple-timetable/faculty?academicYear=2023-24&semester=5', {
    headers: {
      'Authorization': `Bearer ${facultyToken}`
    }
  });

  const result = await response.json();
  console.log('My teaching schedule:', result.data.schedule);
  console.log('Teaching statistics:', result.data.statistics);
};
```

## Frontend Integration Examples

### Timetable Grid Component
```javascript
const TimetableGrid = ({ timetable }) => {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const timeSlots = generateTimeSlots('09:00', '17:00', 60); // Helper function

  return (
    <div className="timetable-grid">
      <div className="grid grid-cols-7 gap-1">
        <div className="font-bold">Time</div>
        {days.map(day => (
          <div key={day} className="font-bold text-center">{day}</div>
        ))}
        
        {timeSlots.map(time => (
          <React.Fragment key={time}>
            <div className="text-sm p-2 bg-gray-100">{time}</div>
            {days.map(day => {
              const slot = findSlotForTime(timetable, day, time);
              return (
                <div key={`${day}-${time}`} className="border p-2 min-h-16">
                  {slot && (
                    <div className={`p-2 rounded text-xs ${getSlotColor(slot.slotType)}`}>
                      <div className="font-semibold">{slot.courseId?.courseCode}</div>
                      <div>{slot.facultyId?.name}</div>
                      <div>{slot.room}</div>
                    </div>
                  )}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
```

### Current Slot Indicator
```javascript
const CurrentSlotIndicator = ({ currentInfo }) => {
  const { currentSlot, nextSlot, currentTime } = currentInfo;

  return (
    <div className="current-slot-info bg-blue-50 p-4 rounded-lg">
      <h3 className="font-bold text-lg mb-2">Current Status</h3>
      <p className="text-sm text-gray-600">Time: {currentTime}</p>
      
      {currentSlot ? (
        <div className="mt-2 p-3 bg-green-100 rounded">
          <h4 className="font-semibold text-green-800">Current Class</h4>
          <p>{currentSlot.courseId?.courseName}</p>
          <p>Faculty: {currentSlot.facultyId?.name}</p>
          <p>Room: {currentSlot.room}</p>
          <p>Time: {currentSlot.startTime} - {currentSlot.endTime}</p>
        </div>
      ) : (
        <div className="mt-2 p-3 bg-yellow-100 rounded">
          <h4 className="font-semibold text-yellow-800">Free Period</h4>
        </div>
      )}
      
      {nextSlot && (
        <div className="mt-2 p-3 bg-blue-100 rounded">
          <h4 className="font-semibold text-blue-800">Next Class</h4>
          <p>{nextSlot.courseId?.courseName}</p>
          <p>Room: {nextSlot.room}</p>
          <p>Time: {nextSlot.startTime} - {nextSlot.endTime}</p>
        </div>
      )}
    </div>
  );
};
```

### Faculty Statistics Dashboard
```javascript
const FacultyStatsDashboard = ({ statistics }) => {
  return (
    <div className="faculty-stats grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="stat-card bg-white p-4 rounded-lg shadow">
        <h3 className="font-bold text-lg">Teaching Load</h3>
        <p className="text-2xl font-bold text-blue-600">{statistics.totalHours} hrs/week</p>
        <p className="text-sm text-gray-600">{statistics.totalSlots} slots</p>
      </div>
      
      <div className="stat-card bg-white p-4 rounded-lg shadow">
        <h3 className="font-bold text-lg">Courses</h3>
        <p className="text-2xl font-bold text-green-600">{statistics.coursesAssigned}</p>
        <p className="text-sm text-gray-600">courses assigned</p>
      </div>
      
      <div className="stat-card bg-white p-4 rounded-lg shadow">
        <h3 className="font-bold text-lg">Peak Day</h3>
        <p className="text-2xl font-bold text-purple-600">
          {Object.entries(statistics.dayStats).reduce((a, b) => 
            statistics.dayStats[a] > statistics.dayStats[b[0]] ? a : b[0]
          )}
        </p>
        <p className="text-sm text-gray-600">busiest day</p>
      </div>
    </div>
  );
};
```

## Error Handling

### Common Error Responses

#### Validation Error
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    "Academic year must be in YYYY-YY format",
    "Start time must be in HH:MM format",
    "Faculty not found for slot 1 on Monday"
  ]
}
```

#### Conflict Error
```json
{
  "success": false,
  "message": "Timetable has scheduling conflicts",
  "conflicts": [
    {
      "day": "Monday",
      "type": "Faculty Conflict",
      "facultyId": "faculty_id",
      "message": "Faculty is assigned to multiple slots at the same time"
    }
  ]
}
```

#### Authorization Error
```json
{
  "success": false,
  "message": "Admin access required"
}
```

## Security Features

### 1. Role-Based Access Control
- **Admin**: Full timetable management capabilities
- **Faculty**: View only assigned teaching slots
- **Students**: View only their class timetable

### 2. Data Validation
- Time format validation (HH:MM)
- Academic year format validation (YYYY-YY)
- Reference validation for courses and faculty
- Conflict detection before saving

### 3. Status Management
- Draft timetables not visible to students
- Only one active timetable per class at a time
- Cannot delete active timetables

## File Locations

- **Schema**: `server/models/SimpleTimetable.js`
- **Routes**: `server/routes/simpleTimetable.js`
- **Documentation**: `server/TIMETABLE_API_DOCS.md`

## Integration Notes

1. **Database Relationships**: Timetables reference SimpleCourse and SimpleUser models
2. **Conflict Prevention**: Automatic validation prevents scheduling conflicts
3. **Real-time Updates**: Current slot information updates based on system time
4. **Statistics**: Comprehensive analytics for administrative insights
5. **Scalability**: Efficient aggregation pipelines for large datasets

The Timetable API system provides complete functionality for academic schedule management with robust conflict detection, role-based access control, and comprehensive analytics capabilities.