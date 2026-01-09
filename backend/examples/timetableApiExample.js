/**
 * Example usage of Timetable APIs
 * This demonstrates how to use the timetable endpoints for different user roles
 */

// Base URL for the API (adjust as needed)
const BASE_URL = 'http://localhost:5000/api';

// Example tokens (in real usage, get these from login)
const ADMIN_TOKEN = 'your_admin_jwt_token_here';
const FACULTY_TOKEN = 'your_faculty_jwt_token_here';
const STUDENT_TOKEN = 'your_student_jwt_token_here';

// Note: This example shows API usage patterns without making actual HTTP requests
// In a real application, use fetch() or axios to make these requests

// Example 1: Admin Creating a Timetable
const createTimetableExample = () => {
  console.log('📅 Example 1: Admin Creating a Timetable\n');

  const timetableData = {
    academicYear: '2023-24',
    semester: 5,
    department: 'CSE',
    program: 'B.Tech',
    section: 'A',
    effectiveFrom: '2024-01-15',
    effectiveTo: '2024-05-15',
    notes: 'Regular semester timetable for CSE 5th semester',
    weeklySchedule: [
      {
        day: 'Monday',
        slots: [
          {
            slotNumber: 1,
            startTime: '09:00',
            endTime: '10:00',
            courseId: '507f1f77bcf86cd799439011', // Data Structures
            facultyId: '507f1f77bcf86cd799439012', // Dr. John Smith
            room: 'A101',
            slotType: 'Lecture',
            isBreak: false,
            duration: 60
          },
          {
            slotNumber: 2,
            startTime: '10:00',
            endTime: '11:00',
            courseId: '507f1f77bcf86cd799439013', // Database Systems
            facultyId: '507f1f77bcf86cd799439014', // Dr. Jane Doe
            room: 'A102',
            slotType: 'Lecture',
            isBreak: false,
            duration: 60
          },
          {
            slotNumber: 3,
            startTime: '11:00',
            endTime: '11:15',
            room: 'BREAK',
            slotType: 'Break',
            isBreak: true,
            duration: 15
          },
          {
            slotNumber: 4,
            startTime: '11:15',
            endTime: '12:15',
            courseId: '507f1f77bcf86cd799439015', // Operating Systems
            facultyId: '507f1f77bcf86cd799439016', // Dr. Bob Wilson
            room: 'A103',
            slotType: 'Lecture',
            isBreak: false,
            duration: 60
          }
        ]
      },
      {
        day: 'Tuesday',
        slots: [
          {
            slotNumber: 1,
            startTime: '09:00',
            endTime: '11:00',
            courseId: '507f1f77bcf86cd799439017', // Data Structures Lab
            facultyId: '507f1f77bcf86cd799439012', // Dr. John Smith
            room: 'LAB1',
            slotType: 'Lab',
            isBreak: false,
            duration: 120
          },
          {
            slotNumber: 2,
            startTime: '11:00',
            endTime: '11:15',
            room: 'BREAK',
            slotType: 'Break',
            isBreak: true,
            duration: 15
          },
          {
            slotNumber: 3,
            startTime: '11:15',
            endTime: '13:15',
            courseId: '507f1f77bcf86cd799439018', // Database Lab
            facultyId: '507f1f77bcf86cd799439014', // Dr. Jane Doe
            room: 'LAB2',
            slotType: 'Lab',
            isBreak: false,
            duration: 120
          }
        ]
      },
      {
        day: 'Wednesday',
        slots: [
          {
            slotNumber: 1,
            startTime: '09:00',
            endTime: '10:00',
            courseId: '507f1f77bcf86cd799439019', // Computer Networks
            facultyId: '507f1f77bcf86cd799439020', // Dr. Alice Brown
            room: 'A104',
            slotType: 'Lecture',
            isBreak: false,
            duration: 60
          },
          {
            slotNumber: 2,
            startTime: '10:00',
            endTime: '11:00',
            courseId: '507f1f77bcf86cd799439021', // Software Engineering
            facultyId: '507f1f77bcf86cd799439022', // Dr. Charlie Green
            room: 'A105',
            slotType: 'Lecture',
            isBreak: false,
            duration: 60
          }
        ]
      }
    ]
  };

  console.log('Request Data:', JSON.stringify(timetableData, null, 2));
  console.log('📡 Endpoint: POST /api/simple-timetable/create');
  console.log('🔑 Authorization: Bearer ' + ADMIN_TOKEN);
  console.log('✅ Creates complete weekly timetable with conflict detection');
  console.log('📊 Automatically calculates total hours and validates references');
};

// Example 2: Student Fetching Timetable
const studentTimetableExample = () => {
  console.log('\n👨‍🎓 Example 2: Student Fetching Timetable\n');

  console.log('2a. Get current semester timetable:');
  console.log('📡 Endpoint: GET /api/simple-timetable/student');
  console.log('🔑 Authorization: Bearer ' + STUDENT_TOKEN);
  console.log('✅ Shows class timetable with current slot information');
  console.log('📍 Includes current day, time, and next class details');

  console.log('\n2b. Get specific semester timetable:');
  console.log('📡 Endpoint: GET /api/simple-timetable/student?academicYear=2023-24&semester=5');
  console.log('🔑 Authorization: Bearer ' + STUDENT_TOKEN);
  console.log('✅ Filter by specific academic year and semester');

  console.log('\nExpected Response Structure:');
  console.log(`{
  "success": true,
  "data": {
    "student": {
      "name": "Alice Johnson",
      "registrationNumber": "22BCE10405",
      "department": "CSE",
      "semester": 5
    },
    "timetable": {
      "weeklySchedule": [...],
      "totalHours": 25.5,
      "weeklyHours": 25.5
    },
    "currentInfo": {
      "currentDay": "Monday",
      "currentTime": "09:30",
      "currentSlot": {
        "courseId": { "courseCode": "CSE301" },
        "facultyId": { "name": "Dr. John Smith" },
        "room": "A101"
      },
      "nextSlot": { ... }
    }
  }
}`);
};

// Example 3: Faculty Checking Assigned Slots
const facultyTimetableExample = () => {
  console.log('\n👨‍🏫 Example 3: Faculty Checking Assigned Slots\n');

  console.log('3a. Get all teaching assignments:');
  console.log('📡 Endpoint: GET /api/simple-timetable/faculty');
  console.log('🔑 Authorization: Bearer ' + FACULTY_TOKEN);
  console.log('✅ Shows all assigned teaching slots across departments');
  console.log('📊 Includes teaching statistics and course breakdown');

  console.log('\n3b. Get filtered assignments:');
  console.log('📡 Endpoint: GET /api/simple-timetable/faculty?academicYear=2023-24&semester=5');
  console.log('🔑 Authorization: Bearer ' + FACULTY_TOKEN);
  console.log('✅ Filter by specific academic year and semester');

  console.log('\nExpected Response Structure:');
  console.log(`{
  "success": true,
  "data": {
    "faculty": {
      "name": "Dr. John Smith",
      "department": "CSE"
    },
    "schedule": [
      {
        "_id": { "day": "Monday", "academicYear": "2023-24", "semester": 5 },
        "slots": [
          {
            "course": { "courseCode": "CSE301", "courseName": "Data Structures" },
            "room": "A101",
            "startTime": "09:00",
            "endTime": "10:00",
            "department": "CSE",
            "section": "A"
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
          "slots": 6,
          "hours": 6.0,
          "sections": ["CSE-B.Tech-A", "CSE-B.Tech-B"]
        }
      },
      "dayStats": {
        "Monday": 3,
        "Tuesday": 2,
        "Wednesday": 4
      }
    }
  }
}`);
};

// Example 4: Admin Managing Timetables
const adminManagementExample = () => {
  console.log('\n👨‍💼 Example 4: Admin Managing Timetables\n');

  console.log('4a. Get all timetables with pagination:');
  console.log('📡 Endpoint: GET /api/simple-timetable/admin/all?page=1&limit=10&status=Active');
  console.log('🔑 Authorization: Bearer ' + ADMIN_TOKEN);
  console.log('✅ Lists all timetables with filtering and pagination');

  console.log('\n4b. Activate a timetable:');
  const timetableId = '507f1f77bcf86cd799439025';
  console.log(`📡 Endpoint: PUT /api/simple-timetable/${timetableId}/activate`);
  console.log('🔑 Authorization: Bearer ' + ADMIN_TOKEN);
  console.log('✅ Activates timetable and deactivates others for same class');

  console.log('\n4c. Update timetable:');
  const updateData = {
    weeklySchedule: [
      // Updated schedule with new slots
    ],
    notes: 'Updated with additional lab sessions',
    status: 'Active'
  };
  console.log('Update Data:', JSON.stringify(updateData, null, 2));
  console.log(`📡 Endpoint: PUT /api/simple-timetable/${timetableId}`);
  console.log('🔑 Authorization: Bearer ' + ADMIN_TOKEN);
  console.log('✅ Updates timetable with conflict validation');

  console.log('\n4d. Delete timetable:');
  console.log(`📡 Endpoint: DELETE /api/simple-timetable/${timetableId}`);
  console.log('🔑 Authorization: Bearer ' + ADMIN_TOKEN);
  console.log('⚠️  Only works for non-active timetables');
};

// Example 5: Room Utilization Analysis
const roomUtilizationExample = () => {
  console.log('\n🏢 Example 5: Room Utilization Analysis\n');

  const roomNumber = 'A101';
  
  console.log('5a. Get room schedule:');
  console.log(`📡 Endpoint: GET /api/simple-timetable/room/${roomNumber}?academicYear=2023-24&semester=5`);
  console.log('🔑 Authorization: Bearer ' + ADMIN_TOKEN);
  console.log('✅ Shows complete room utilization with statistics');

  console.log('\nExpected Response Structure:');
  console.log(`{
  "success": true,
  "data": {
    "room": "A101",
    "schedule": [
      {
        "_id": "Monday",
        "slots": [
          {
            "course": { "courseCode": "CSE301" },
            "faculty": { "name": "Dr. John Smith" },
            "department": "CSE",
            "program": "B.Tech",
            "section": "A",
            "startTime": "09:00",
            "endTime": "10:00"
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
        "Wednesday": 6
      },
      "departmentStats": {
        "CSE": { "slots": 15, "hours": 18.5 },
        "ECE": { "slots": 10, "hours": 12.0 }
      }
    }
  }
}`);
};

// Example 6: Timetable Statistics and Analytics
const statisticsExample = () => {
  console.log('\n📊 Example 6: Timetable Statistics and Analytics\n');

  console.log('6a. Get overall statistics:');
  console.log('📡 Endpoint: GET /api/simple-timetable/stats');
  console.log('🔑 Authorization: Bearer ' + ADMIN_TOKEN);
  console.log('✅ Comprehensive timetable analytics');

  console.log('\n6b. Get filtered statistics:');
  console.log('📡 Endpoint: GET /api/simple-timetable/stats?academicYear=2023-24&semester=5');
  console.log('🔑 Authorization: Bearer ' + ADMIN_TOKEN);
  console.log('✅ Statistics for specific academic period');

  console.log('\nExpected Response Structure:');
  console.log(`{
  "success": true,
  "data": {
    "overview": {
      "totalTimetables": 45,
      "activeTimetables": 25,
      "totalSlots": 1250,
      "totalHours": 1875.5,
      "totalDepartments": 8,
      "totalRooms": 45,
      "totalFaculty": 85,
      "slotTypeDistribution": {
        "Lecture": 800,
        "Lab": 300,
        "Tutorial": 100
      }
    },
    "statusDistribution": {
      "Active": 25,
      "Draft": 15,
      "Inactive": 5
    }
  }
}`);
};

// Conflict Detection Examples
const conflictDetectionExample = () => {
  console.log('\n⚠️  Example 7: Conflict Detection\n');

  console.log('The system automatically detects and prevents:');
  console.log('1. Time Overlaps - Multiple slots at the same time');
  console.log('2. Room Conflicts - Same room booked twice');
  console.log('3. Faculty Conflicts - Faculty double-booked');

  console.log('\nExample Conflict Response:');
  console.log(`{
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
    },
    {
      "day": "Tuesday",
      "type": "Faculty Conflict",
      "facultyId": "faculty_id",
      "message": "Faculty is assigned to multiple slots at the same time"
    }
  ]
}`);
};

// Real-time Current Slot Detection
const currentSlotExample = () => {
  console.log('\n⏰ Example 8: Real-time Current Slot Detection\n');

  console.log('The system provides real-time information about:');
  console.log('- Current day and time');
  console.log('- Currently ongoing class (if any)');
  console.log('- Next upcoming class');
  console.log('- Free periods');

  console.log('\nExample Current Slot Response:');
  console.log(`{
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
}`);

  console.log('\n💡 Use Cases:');
  console.log('- Student apps showing "You have CSE301 in A101 right now"');
  console.log('- Faculty apps showing "Your next class is in 30 minutes"');
  console.log('- Campus navigation showing current room occupancy');
};

// Frontend Integration Examples
const frontendIntegrationExample = () => {
  console.log('\n🖥️  Example 9: Frontend Integration Patterns\n');

  console.log('9a. Timetable Grid Component:');
  console.log(`const TimetableGrid = ({ timetable }) => {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  return (
    <div className="timetable-grid">
      {days.map(day => (
        <div key={day} className="day-column">
          <h3>{day}</h3>
          {timetable.weeklySchedule
            .find(d => d.day === day)?.slots
            .map(slot => (
              <div key={slot.slotNumber} className="slot-card">
                <div className="course-code">{slot.courseId?.courseCode}</div>
                <div className="faculty">{slot.facultyId?.name}</div>
                <div className="room">{slot.room}</div>
                <div className="time">{slot.startTime} - {slot.endTime}</div>
              </div>
            ))
          }
        </div>
      ))}
    </div>
  );
};`);

  console.log('\n9b. Current Slot Indicator:');
  console.log(`const CurrentSlotIndicator = ({ currentInfo }) => {
  const { currentSlot, nextSlot } = currentInfo;
  
  return (
    <div className="current-status">
      {currentSlot ? (
        <div className="current-class">
          <h4>Current Class</h4>
          <p>{currentSlot.courseId?.courseName}</p>
          <p>Room: {currentSlot.room}</p>
          <p>Faculty: {currentSlot.facultyId?.name}</p>
        </div>
      ) : (
        <div className="free-period">
          <h4>Free Period</h4>
        </div>
      )}
      
      {nextSlot && (
        <div className="next-class">
          <h4>Next Class</h4>
          <p>{nextSlot.courseId?.courseName}</p>
          <p>Room: {nextSlot.room}</p>
          <p>Starts at: {nextSlot.startTime}</p>
        </div>
      )}
    </div>
  );
};`);

  console.log('\n9c. Faculty Statistics Dashboard:');
  console.log(`const FacultyStats = ({ statistics }) => (
  <div className="faculty-stats">
    <div className="stat-card">
      <h3>Weekly Load</h3>
      <p className="stat-value">{statistics.totalHours} hours</p>
      <p className="stat-detail">{statistics.totalSlots} slots</p>
    </div>
    
    <div className="stat-card">
      <h3>Courses</h3>
      <p className="stat-value">{statistics.coursesAssigned}</p>
      <p className="stat-detail">courses assigned</p>
    </div>
    
    <div className="course-breakdown">
      {Object.entries(statistics.courseStats).map(([code, stats]) => (
        <div key={code} className="course-stat">
          <span>{code}</span>
          <span>{stats.hours} hrs</span>
          <span>{stats.sections.length} sections</span>
        </div>
      ))}
    </div>
  </div>
);`);
};

// Usage Scenarios for Different Roles
const usageScenariosExample = () => {
  console.log('\n🎯 Example 10: Usage Scenarios\n');

  console.log('Scenario 1: Academic Administrator');
  console.log('- Creates semester timetables for all departments');
  console.log('- Monitors room utilization and faculty workload');
  console.log('- Resolves scheduling conflicts');
  console.log('- Generates reports for academic planning');

  console.log('\nScenario 2: Student');
  console.log('- Views weekly class schedule');
  console.log('- Checks current and next classes');
  console.log('- Plans study time around free periods');
  console.log('- Gets room and faculty information');

  console.log('\nScenario 3: Faculty Member');
  console.log('- Views teaching assignments across semesters');
  console.log('- Checks room allocations for classes');
  console.log('- Monitors teaching workload distribution');
  console.log('- Plans office hours around teaching schedule');

  console.log('\nScenario 4: Department Head');
  console.log('- Reviews faculty teaching loads');
  console.log('- Optimizes room utilization');
  console.log('- Ensures balanced course distribution');
  console.log('- Plans resource allocation');
};

// Security and Validation Features
const securityFeaturesExample = () => {
  console.log('\n🔒 Example 11: Security and Validation Features\n');

  console.log('1. Role-based Access Control:');
  console.log('   - Admin: Full timetable management');
  console.log('   - Faculty: View only assigned slots');
  console.log('   - Students: View only class timetable');

  console.log('\n2. Data Validation:');
  console.log('   - Time format validation (HH:MM)');
  console.log('   - Academic year format (YYYY-YY)');
  console.log('   - Course and faculty reference validation');
  console.log('   - Conflict detection and prevention');

  console.log('\n3. Status Management:');
  console.log('   - Draft timetables not visible to students');
  console.log('   - Only one active timetable per class');
  console.log('   - Cannot delete active timetables');

  console.log('\n4. Audit Trail:');
  console.log('   - Track timetable creation and modifications');
  console.log('   - Log activation and deactivation events');
  console.log('   - Monitor access patterns');
};

// Performance and Scalability
const performanceExample = () => {
  console.log('\n⚡ Example 12: Performance and Scalability\n');

  console.log('Database Optimization:');
  console.log('- Compound indexes for efficient queries');
  console.log('- Aggregation pipelines for statistics');
  console.log('- Pagination for large datasets');
  console.log('- Selective field population');

  console.log('\nCaching Strategies:');
  console.log('- Cache active timetables');
  console.log('- Cache faculty schedules');
  console.log('- Cache room utilization data');
  console.log('- Invalidate cache on updates');

  console.log('\nAPI Optimization:');
  console.log('- Efficient aggregation queries');
  console.log('- Minimal data transfer');
  console.log('- Batch operations for bulk updates');
  console.log('- Real-time conflict detection');
};

// Run all examples
const runExamples = () => {
  console.log('📅 Timetable API Examples\n');
  console.log('=' .repeat(60));
  
  console.log('⚠️  Note: Replace example IDs and tokens with actual values\n');
  
  createTimetableExample();
  studentTimetableExample();
  facultyTimetableExample();
  adminManagementExample();
  roomUtilizationExample();
  statisticsExample();
  conflictDetectionExample();
  currentSlotExample();
  frontendIntegrationExample();
  usageScenariosExample();
  securityFeaturesExample();
  performanceExample();
  
  console.log('\n' + '='.repeat(60));
  console.log('📖 API Endpoints Summary:');
  console.log('   POST /api/simple-timetable/create - Create timetable (Admin)');
  console.log('   GET  /api/simple-timetable/student - Get student timetable');
  console.log('   GET  /api/simple-timetable/faculty - Get faculty assignments');
  console.log('   GET  /api/simple-timetable/admin/all - Get all timetables (Admin)');
  console.log('   PUT  /api/simple-timetable/:id/activate - Activate timetable (Admin)');
  console.log('   PUT  /api/simple-timetable/:id - Update timetable (Admin)');
  console.log('   GET  /api/simple-timetable/room/:room - Room utilization (Admin)');
  console.log('   GET  /api/simple-timetable/stats - Timetable statistics (Admin)');
  console.log('   DELETE /api/simple-timetable/:id - Delete timetable (Admin)');
  console.log('\n💡 Use: node examples/timetableApiExample.js');
};

// Export for use in other files
module.exports = {
  createTimetableExample,
  studentTimetableExample,
  facultyTimetableExample,
  adminManagementExample,
  roomUtilizationExample,
  statisticsExample,
  conflictDetectionExample,
  currentSlotExample,
  frontendIntegrationExample,
  usageScenariosExample,
  securityFeaturesExample,
  performanceExample,
  runExamples
};

// Run if this file is executed directly
if (require.main === module) {
  runExamples();
}