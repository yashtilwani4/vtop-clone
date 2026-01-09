# MongoDB Database Design for VTOP Academic Portal

## Overview
This document outlines the complete MongoDB database design for the VTOP Academic Portal, including all collections, relationships, indexes, and data modeling strategies.

## Database Architecture

### Design Principles
1. **Denormalization for Performance**: Strategic denormalization for frequently accessed data
2. **Reference vs Embedding**: References for large, frequently changing data; embedding for small, stable data
3. **Indexing Strategy**: Compound indexes for common query patterns
4. **Scalability**: Designed to handle thousands of users and millions of records
5. **Data Integrity**: Validation rules and constraints at application level

## Collections Overview

```
vtop_portal (Database)
├── users                 # User accounts and profiles
├── courses               # Course catalog and information
├── enrollments          # Student course enrollments (separate collection)
├── attendance           # Attendance records
├── results              # Academic results and grades
├── timetables           # Class schedules and timetables
├── notices              # Announcements and notifications
├── departments          # Department information
├── academic_years       # Academic year configurations
└── audit_logs          # System audit trail
```

---

## 1. Users Collection

### Schema Design
```javascript
{
  _id: ObjectId,
  
  // Basic Information
  name: String,                    // Full name
  email: String,                   // Unique email address
  password: String,                // Hashed password
  registrationNumber: String,      // Unique: YYBBB##### format
  
  // Role and Access
  role: String,                    // 'student', 'faculty', 'admin'
  isActive: Boolean,               // Account status
  isVerified: Boolean,             // Email verification status
  
  // Academic Information
  department: String,              // Department code (CSE, ECE, etc.)
  program: String,                 // B.Tech, M.Tech, etc.
  semester: Number,                // Current semester (for students)
  batch: String,                   // Admission batch (2022, 2023, etc.)
  section: String,                 // Class section (A, B, C, etc.)
  
  // Personal Information
  profile: {
    firstName: String,
    lastName: String,
    dateOfBirth: Date,
    gender: String,               // 'Male', 'Female', 'Other'
    phoneNumber: String,
    address: {
      street: String,
      city: String,
      state: String,
      pinCode: String,
      country: String
    },
    emergencyContact: {
      name: String,
      relationship: String,
      phoneNumber: String
    }
  },
  
  // Faculty-specific Information
  facultyInfo: {
    employeeId: String,
    designation: String,           // Professor, Associate Professor, etc.
    specialization: [String],      // Areas of expertise
    experience: Number,            // Years of experience
    qualifications: [String]       // Educational qualifications
  },
  
  // Student-specific Information
  studentInfo: {
    admissionDate: Date,
    feeStatus: String,            // 'Paid', 'Pending', 'Overdue'
    hostelResident: Boolean,
    transportUser: Boolean,
    parentInfo: {
      fatherName: String,
      motherName: String,
      guardianName: String,
      occupation: String,
      annualIncome: Number
    }
  },
  
  // System Information
  lastLogin: Date,
  loginAttempts: Number,
  accountLocked: Boolean,
  lockUntil: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  
  // Preferences
  preferences: {
    language: String,             // 'en', 'hi', etc.
    timezone: String,
    notifications: {
      email: Boolean,
      sms: Boolean,
      push: Boolean
    },
    theme: String                 // 'light', 'dark'
  },
  
  // Metadata
  createdAt: Date,
  updatedAt: Date,
  createdBy: ObjectId,            // Reference to admin who created
  lastModifiedBy: ObjectId
}
```

### Indexes
```javascript
// Primary indexes
db.users.createIndex({ "email": 1 }, { unique: true })
db.users.createIndex({ "registrationNumber": 1 }, { unique: true })

// Query optimization indexes
db.users.createIndex({ "role": 1, "isActive": 1 })
db.users.createIndex({ "department": 1, "program": 1, "semester": 1 })
db.users.createIndex({ "role": 1, "department": 1 })
db.users.createIndex({ "batch": 1, "department": 1 })

// Authentication indexes
db.users.createIndex({ "email": 1, "isActive": 1 })
db.users.createIndex({ "passwordResetToken": 1 })

// Text search index
db.users.createIndex({ 
  "name": "text", 
  "email": "text", 
  "registrationNumber": "text" 
})
```

---

## 2. Courses Collection

### Schema Design
```javascript
{
  _id: ObjectId,
  
  // Basic Information
  courseCode: String,              // Unique: CSE301, ECE201, etc.
  courseName: String,              // Full course name
  courseTitle: String,             // Short title
  description: String,             // Course description
  
  // Academic Information
  credits: Number,                 // Credit hours
  courseType: String,              // 'Core', 'Elective', 'Lab', 'Project'
  category: String,                // 'Theory', 'Practical', 'Both'
  
  // Department and Program
  department: String,              // Offering department
  programs: [String],              // Applicable programs
  semesters: [Number],             // Applicable semesters
  
  // Prerequisites and Corequisites
  prerequisites: [{
    courseId: ObjectId,            // Reference to courses collection
    courseCode: String,            // Denormalized for quick access
    mandatory: Boolean             // Is this prerequisite mandatory?
  }],
  
  corequisites: [{
    courseId: ObjectId,
    courseCode: String
  }],
  
  // Faculty Assignment
  facultyAssigned: [{
    facultyId: ObjectId,           // Reference to users collection
    facultyName: String,           // Denormalized
    role: String,                  // 'Primary', 'Secondary', 'Lab'
    sections: [String]             // Assigned sections
  }],
  
  // Course Structure
  syllabus: {
    units: [{
      unitNumber: Number,
      title: String,
      topics: [String],
      hours: Number
    }],
    totalHours: {
      theory: Number,
      practical: Number,
      tutorial: Number
    }
  },
  
  // Assessment Structure
  assessmentPattern: {
    internal: {
      midterm: { marks: Number, weightage: Number },
      assignments: { marks: Number, weightage: Number },
      quiz: { marks: Number, weightage: Number },
      attendance: { marks: Number, weightage: Number }
    },
    external: {
      endterm: { marks: Number, weightage: Number },
      practical: { marks: Number, weightage: Number }
    }
  },
  
  // Resources
  resources: {
    textbooks: [{
      title: String,
      author: String,
      publisher: String,
      isbn: String,
      type: String                 // 'Primary', 'Reference'
    }],
    onlineResources: [{
      title: String,
      url: String,
      type: String                 // 'Video', 'Article', 'Website'
    }]
  },
  
  // Enrollment Information
  enrollmentInfo: {
    maxCapacity: Number,
    currentEnrollment: Number,
    waitlistCapacity: Number,
    enrollmentStatus: String       // 'Open', 'Closed', 'Waitlist'
  },
  
  // Status and Metadata
  isActive: Boolean,
  academicYear: String,            // When course is offered
  effectiveFrom: Date,
  effectiveTo: Date,
  
  // Metadata
  createdAt: Date,
  updatedAt: Date,
  createdBy: ObjectId,
  lastModifiedBy: ObjectId
}
```

### Indexes
```javascript
// Primary indexes
db.courses.createIndex({ "courseCode": 1 }, { unique: true })

// Query optimization indexes
db.courses.createIndex({ "department": 1, "isActive": 1 })
db.courses.createIndex({ "programs": 1, "semesters": 1 })
db.courses.createIndex({ "courseType": 1, "category": 1 })
db.courses.createIndex({ "facultyAssigned.facultyId": 1 })
db.courses.createIndex({ "academicYear": 1, "department": 1 })

// Text search index
db.courses.createIndex({ 
  "courseCode": "text", 
  "courseName": "text", 
  "description": "text" 
})
```

---

## 3. Enrollments Collection

### Schema Design
```javascript
{
  _id: ObjectId,
  
  // References
  studentId: ObjectId,             // Reference to users collection
  courseId: ObjectId,              // Reference to courses collection
  
  // Denormalized Data (for performance)
  studentInfo: {
    registrationNumber: String,
    name: String,
    department: String,
    program: String,
    semester: Number,
    section: String
  },
  
  courseInfo: {
    courseCode: String,
    courseName: String,
    credits: Number,
    department: String
  },
  
  // Enrollment Details
  academicYear: String,            // 2023-24
  semester: Number,                // Enrollment semester
  enrollmentType: String,          // 'Regular', 'Backlog', 'Improvement'
  enrollmentStatus: String,        // 'Enrolled', 'Dropped', 'Completed'
  
  // Enrollment Dates
  enrolledDate: Date,
  dropDate: Date,
  completionDate: Date,
  
  // Academic Performance
  attendance: {
    totalClasses: Number,
    attendedClasses: Number,
    percentage: Number,
    status: String                 // 'Good', 'Warning', 'Critical'
  },
  
  grades: {
    internal: {
      midterm: Number,
      assignments: Number,
      quiz: Number,
      attendance: Number,
      total: Number
    },
    external: {
      endterm: Number,
      practical: Number,
      total: Number
    },
    finalGrade: String,            // A+, A, B+, etc.
    gradePoints: Number,
    status: String                 // 'Pass', 'Fail', 'Incomplete'
  },
  
  // Fee Information
  feeDetails: {
    courseFee: Number,
    labFee: Number,
    totalFee: Number,
    paidAmount: Number,
    pendingAmount: Number,
    paymentStatus: String          // 'Paid', 'Partial', 'Pending'
  },
  
  // Metadata
  createdAt: Date,
  updatedAt: Date,
  enrolledBy: ObjectId             // Admin who processed enrollment
}
```

### Indexes
```javascript
// Primary indexes
db.enrollments.createIndex({ "studentId": 1, "courseId": 1, "academicYear": 1 }, { unique: true })

// Query optimization indexes
db.enrollments.createIndex({ "studentId": 1, "academicYear": 1 })
db.enrollments.createIndex({ "courseId": 1, "academicYear": 1 })
db.enrollments.createIndex({ "enrollmentStatus": 1 })
db.enrollments.createIndex({ "studentInfo.department": 1, "studentInfo.program": 1 })
db.enrollments.createIndex({ "courseInfo.department": 1 })
```

---

## 4. Attendance Collection

### Schema Design
```javascript
{
  _id: ObjectId,
  
  // References
  studentId: ObjectId,             // Reference to users collection
  courseId: ObjectId,              // Reference to courses collection
  facultyId: ObjectId,             // Reference to users collection
  
  // Denormalized Data
  studentInfo: {
    registrationNumber: String,
    name: String,
    department: String,
    program: String,
    semester: Number,
    section: String
  },
  
  courseInfo: {
    courseCode: String,
    courseName: String,
    department: String
  },
  
  facultyInfo: {
    name: String,
    employeeId: String
  },
  
  // Attendance Details
  academicYear: String,
  semester: Number,
  date: Date,
  
  // Class Information
  classDetails: {
    period: Number,                // Period number (1-8)
    startTime: String,             // "09:00"
    endTime: String,               // "10:00"
    classType: String,             // 'Lecture', 'Lab', 'Tutorial'
    room: String,                  // Room number
    topic: String                  // Topic covered
  },
  
  // Attendance Status
  status: String,                  // 'Present', 'Absent', 'Late', 'Excused'
  markedAt: Date,                  // When attendance was marked
  markedBy: ObjectId,              // Faculty who marked
  
  // Additional Information
  remarks: String,                 // Optional remarks
  isModified: Boolean,             // Was attendance modified after initial marking?
  modificationHistory: [{
    modifiedAt: Date,
    modifiedBy: ObjectId,
    previousStatus: String,
    newStatus: String,
    reason: String
  }],
  
  // Geolocation (for mobile attendance)
  location: {
    latitude: Number,
    longitude: Number,
    accuracy: Number
  },
  
  // Metadata
  createdAt: Date,
  updatedAt: Date
}
```

### Indexes
```javascript
// Primary indexes
db.attendance.createIndex({ "studentId": 1, "courseId": 1, "date": 1 }, { unique: true })

// Query optimization indexes
db.attendance.createIndex({ "studentId": 1, "academicYear": 1 })
db.attendance.createIndex({ "courseId": 1, "date": 1 })
db.attendance.createIndex({ "facultyId": 1, "date": 1 })
db.attendance.createIndex({ "date": 1, "status": 1 })
db.attendance.createIndex({ "studentInfo.department": 1, "academicYear": 1 })
db.attendance.createIndex({ "courseInfo.courseCode": 1, "academicYear": 1 })
```

---

## 5. Results Collection

### Schema Design
```javascript
{
  _id: ObjectId,
  
  // References
  studentId: ObjectId,             // Reference to users collection
  courseId: ObjectId,              // Reference to courses collection
  facultyId: ObjectId,             // Faculty who uploaded results
  
  // Denormalized Data
  studentInfo: {
    registrationNumber: String,
    name: String,
    department: String,
    program: String,
    semester: Number,
    section: String
  },
  
  courseInfo: {
    courseCode: String,
    courseName: String,
    credits: Number,
    department: String,
    courseType: String
  },
  
  facultyInfo: {
    name: String,
    employeeId: String
  },
  
  // Academic Information
  academicYear: String,
  semester: Number,
  examType: String,                // 'Regular', 'Supplementary', 'Improvement'
  
  // Assessment Breakdown
  assessments: {
    internal: {
      midterm: {
        maxMarks: Number,
        obtainedMarks: Number,
        weightage: Number
      },
      assignments: {
        maxMarks: Number,
        obtainedMarks: Number,
        weightage: Number
      },
      quiz: {
        maxMarks: Number,
        obtainedMarks: Number,
        weightage: Number
      },
      attendance: {
        maxMarks: Number,
        obtainedMarks: Number,
        weightage: Number
      }
    },
    external: {
      endterm: {
        maxMarks: Number,
        obtainedMarks: Number,
        weightage: Number
      },
      practical: {
        maxMarks: Number,
        obtainedMarks: Number,
        weightage: Number
      }
    }
  },
  
  // Calculated Results
  totalMarks: Number,              // Out of 100
  percentage: Number,
  grade: String,                   // A+, A, B+, B, C+, C, D, F
  gradePoints: Number,             // 10, 9, 8, 7, 6, 5, 4, 0
  status: String,                  // 'Pass', 'Fail', 'Incomplete'
  
  // Result Status
  resultStatus: String,            // 'Draft', 'Published', 'Locked'
  publishedAt: Date,
  lockedAt: Date,
  
  // Additional Information
  remarks: String,
  isRevaluation: Boolean,
  revaluationDetails: {
    requestedAt: Date,
    previousGrade: String,
    newGrade: String,
    feesPaid: Number
  },
  
  // Metadata
  createdAt: Date,
  updatedAt: Date,
  version: Number                  // For result modifications
}
```

### Indexes
```javascript
// Primary indexes
db.results.createIndex({ "studentId": 1, "courseId": 1, "academicYear": 1, "examType": 1 }, { unique: true })

// Query optimization indexes
db.results.createIndex({ "studentId": 1, "academicYear": 1 })
db.results.createIndex({ "courseId": 1, "academicYear": 1 })
db.results.createIndex({ "resultStatus": 1, "publishedAt": 1 })
db.results.createIndex({ "studentInfo.department": 1, "academicYear": 1 })
db.results.createIndex({ "grade": 1, "status": 1 })
db.results.createIndex({ "facultyId": 1, "academicYear": 1 })
```

---

## 6. Timetables Collection

### Schema Design
```javascript
{
  _id: ObjectId,
  
  // Academic Information
  academicYear: String,
  semester: Number,
  
  // Class Information
  department: String,
  program: String,
  section: String,
  
  // Weekly Schedule
  weeklySchedule: [{
    day: String,                   // 'Monday', 'Tuesday', etc.
    slots: [{
      slotNumber: Number,          // 1, 2, 3, etc.
      startTime: String,           // "09:00"
      endTime: String,             // "10:00"
      duration: Number,            // Duration in minutes
      
      // Course and Faculty
      courseId: ObjectId,          // Reference to courses collection
      facultyId: ObjectId,         // Reference to users collection
      
      // Denormalized Data
      courseInfo: {
        courseCode: String,
        courseName: String,
        credits: Number,
        courseType: String
      },
      
      facultyInfo: {
        name: String,
        employeeId: String
      },
      
      // Class Details
      room: String,
      building: String,
      slotType: String,            // 'Lecture', 'Lab', 'Tutorial', 'Break'
      isBreak: Boolean,
      
      // Additional Information
      topic: String,               // Planned topic
      resources: [String],         // Required resources
      notes: String
    }]
  }],
  
  // Special Schedules
  examSchedule: [{
    date: Date,
    courseId: ObjectId,
    courseCode: String,
    examType: String,              // 'Midterm', 'Endterm', 'Quiz'
    startTime: String,
    endTime: String,
    room: String,
    instructions: String
  }],
  
  // Holidays and Events
  holidays: [{
    date: Date,
    name: String,
    type: String,                  // 'National', 'Festival', 'University'
    description: String
  }],
  
  // Status and Metadata
  status: String,                  // 'Draft', 'Active', 'Inactive', 'Archived'
  effectiveFrom: Date,
  effectiveTo: Date,
  
  // Statistics
  totalHours: Number,              // Total weekly hours
  totalSlots: Number,              // Total slots per week
  
  // Metadata
  createdAt: Date,
  updatedAt: Date,
  createdBy: ObjectId,
  lastModifiedBy: ObjectId,
  version: Number
}
```

### Indexes
```javascript
// Primary indexes
db.timetables.createIndex({ 
  "academicYear": 1, 
  "semester": 1, 
  "department": 1, 
  "program": 1, 
  "section": 1 
}, { unique: true })

// Query optimization indexes
db.timetables.createIndex({ "status": 1, "effectiveFrom": 1 })
db.timetables.createIndex({ "weeklySchedule.slots.facultyId": 1 })
db.timetables.createIndex({ "weeklySchedule.slots.courseId": 1 })
db.timetables.createIndex({ "department": 1, "academicYear": 1 })
db.timetables.createIndex({ "weeklySchedule.slots.room": 1 })
```

---

## 7. Notices Collection

### Schema Design
```javascript
{
  _id: ObjectId,
  
  // Basic Information
  title: String,
  content: String,                 // Full content
  summary: String,                 // Auto-generated or manual summary
  
  // Classification
  category: String,                // 'Academic', 'Examination', 'Event', etc.
  priority: String,                // 'Low', 'Medium', 'High', 'Urgent'
  tags: [String],                  // For better searchability
  
  // Targeting
  targetAudience: String,          // 'All', 'Students', 'Faculty', 'Admin'
  targetDepartments: [String],     // Specific departments
  targetPrograms: [String],        // Specific programs
  targetSemesters: [Number],       // Specific semesters
  targetSections: [String],        // Specific sections
  
  // Publishing Information
  publishedBy: ObjectId,           // Reference to users collection
  publisherInfo: {
    name: String,
    role: String,
    department: String
  },
  
  // Status and Scheduling
  status: String,                  // 'Draft', 'Published', 'Archived'
  publishedDate: Date,
  expiryDate: Date,
  scheduledPublishDate: Date,
  
  // Attachments
  attachments: [{
    fileName: String,
    fileUrl: String,
    fileSize: Number,
    fileType: String,
    uploadedAt: Date
  }],
  
  // Engagement Tracking
  viewCount: Number,
  views: [{
    userId: ObjectId,
    viewedAt: Date,
    ipAddress: String
  }],
  
  // SEO and Search
  slug: String,                    // URL-friendly version of title
  readingTime: Number,             // Estimated reading time in minutes
  
  // Metadata
  createdAt: Date,
  updatedAt: Date,
  lastModifiedBy: ObjectId,
  version: Number
}
```

### Indexes
```javascript
// Primary indexes
db.notices.createIndex({ "slug": 1 }, { unique: true, sparse: true })

// Query optimization indexes
db.notices.createIndex({ "status": 1, "publishedDate": -1 })
db.notices.createIndex({ "category": 1, "priority": 1 })
db.notices.createIndex({ "targetAudience": 1 })
db.notices.createIndex({ "targetDepartments": 1 })
db.notices.createIndex({ "publishedBy": 1 })
db.notices.createIndex({ "expiryDate": 1 })
db.notices.createIndex({ "tags": 1 })

// Text search index
db.notices.createIndex({ 
  "title": "text", 
  "content": "text", 
  "summary": "text", 
  "tags": "text" 
}, {
  weights: {
    "title": 10,
    "summary": 5,
    "content": 2,
    "tags": 3
  }
})
```

---

## 8. Departments Collection

### Schema Design
```javascript
{
  _id: ObjectId,
  
  // Basic Information
  departmentCode: String,          // 'CSE', 'ECE', 'MECH', etc.
  departmentName: String,          // Full name
  shortName: String,               // Abbreviated name
  description: String,
  
  // Administrative Information
  hodId: ObjectId,                 // Head of Department reference
  hodInfo: {
    name: String,
    employeeId: String,
    email: String,
    phoneNumber: String
  },
  
  // Programs Offered
  programs: [{
    programCode: String,           // 'BTECH', 'MTECH', etc.
    programName: String,
    duration: Number,              // Duration in years
    totalSemesters: Number,
    intake: Number,                // Student intake capacity
    isActive: Boolean
  }],
  
  // Faculty Information
  faculty: [{
    facultyId: ObjectId,
    name: String,
    designation: String,
    specialization: [String],
    isActive: Boolean
  }],
  
  // Infrastructure
  infrastructure: {
    classrooms: Number,
    laboratories: Number,
    facultyRooms: Number,
    totalArea: Number,             // In square feet
    facilities: [String]
  },
  
  // Contact Information
  contact: {
    email: String,
    phoneNumber: String,
    faxNumber: String,
    address: String,
    website: String
  },
  
  // Statistics
  statistics: {
    totalStudents: Number,
    totalFaculty: Number,
    totalCourses: Number,
    placementRate: Number          // Percentage
  },
  
  // Status and Metadata
  isActive: Boolean,
  establishedYear: Number,
  accreditation: [String],
  
  // Metadata
  createdAt: Date,
  updatedAt: Date,
  lastModifiedBy: ObjectId
}
```

### Indexes
```javascript
// Primary indexes
db.departments.createIndex({ "departmentCode": 1 }, { unique: true })

// Query optimization indexes
db.departments.createIndex({ "isActive": 1 })
db.departments.createIndex({ "hodId": 1 })
db.departments.createIndex({ "faculty.facultyId": 1 })
```

---

## 9. Academic Years Collection

### Schema Design
```javascript
{
  _id: ObjectId,
  
  // Academic Year Information
  academicYear: String,            // '2023-24'
  startDate: Date,
  endDate: Date,
  
  // Semester Information
  semesters: [{
    semesterNumber: Number,        // 1, 2, 3, etc.
    semesterType: String,          // 'Odd', 'Even', 'Summer'
    startDate: Date,
    endDate: Date,
    
    // Important Dates
    importantDates: [{
      event: String,               // 'Registration', 'Classes Begin', etc.
      date: Date,
      description: String
    }],
    
    // Examination Schedule
    examinations: [{
      examType: String,            // 'Midterm', 'Endterm'
      startDate: Date,
      endDate: Date,
      resultDate: Date
    }]
  }],
  
  // Holidays
  holidays: [{
    date: Date,
    name: String,
    type: String,                  // 'National', 'Festival', 'University'
    isOptional: Boolean
  }],
  
  // Fee Structure
  feeStructure: [{
    program: String,
    semester: Number,
    tuitionFee: Number,
    labFee: Number,
    libraryFee: Number,
    examFee: Number,
    totalFee: Number
  }],
  
  // Status
  status: String,                  // 'Current', 'Past', 'Future'
  isActive: Boolean,
  
  // Metadata
  createdAt: Date,
  updatedAt: Date,
  createdBy: ObjectId
}
```

### Indexes
```javascript
// Primary indexes
db.academic_years.createIndex({ "academicYear": 1 }, { unique: true })

// Query optimization indexes
db.academic_years.createIndex({ "status": 1, "isActive": 1 })
db.academic_years.createIndex({ "startDate": 1, "endDate": 1 })
```

---

## 10. Audit Logs Collection

### Schema Design
```javascript
{
  _id: ObjectId,
  
  // Action Information
  action: String,                  // 'CREATE', 'UPDATE', 'DELETE', 'LOGIN', etc.
  resource: String,                // 'users', 'courses', 'results', etc.
  resourceId: ObjectId,            // ID of the affected resource
  
  // User Information
  userId: ObjectId,                // User who performed the action
  userInfo: {
    name: String,
    email: String,
    role: String,
    registrationNumber: String
  },
  
  // Request Information
  requestInfo: {
    method: String,                // HTTP method
    url: String,                   // Request URL
    userAgent: String,
    ipAddress: String,
    sessionId: String
  },
  
  // Change Details
  changes: {
    before: Object,                // Previous state
    after: Object,                 // New state
    fields: [String]               // Changed fields
  },
  
  // Additional Context
  description: String,             // Human-readable description
  severity: String,                // 'Low', 'Medium', 'High', 'Critical'
  category: String,                // 'Security', 'Data', 'System', 'User'
  
  // Status
  status: String,                  // 'Success', 'Failed', 'Partial'
  errorMessage: String,            // If action failed
  
  // Metadata
  timestamp: Date,
  processingTime: Number           // Time taken in milliseconds
}
```

### Indexes
```javascript
// Query optimization indexes
db.audit_logs.createIndex({ "timestamp": -1 })
db.audit_logs.createIndex({ "userId": 1, "timestamp": -1 })
db.audit_logs.createIndex({ "resource": 1, "action": 1 })
db.audit_logs.createIndex({ "severity": 1, "timestamp": -1 })
db.audit_logs.createIndex({ "requestInfo.ipAddress": 1 })

// TTL index for automatic cleanup (optional)
db.audit_logs.createIndex({ "timestamp": 1 }, { expireAfterSeconds: 31536000 }) // 1 year
```

---

## Relationships and Data Flow

### 1. User-Centric Relationships
```
Users (Students)
├── Enrollments (1:N) → Courses
├── Attendance (1:N) → Courses + Faculty
├── Results (1:N) → Courses + Faculty
├── Timetables (N:1) → Department/Program/Section
└── Notices (N:N) → Targeted based on profile

Users (Faculty)
├── Courses (1:N) → Teaching assignments
├── Attendance (1:N) → Classes conducted
├── Results (1:N) → Results uploaded
├── Timetables (N:N) → Teaching schedule
└── Notices (1:N) → Created notices
```

### 2. Course-Centric Relationships
```
Courses
├── Enrollments (1:N) → Students enrolled
├── Attendance (1:N) → Class attendance records
├── Results (1:N) → Student results
├── Timetables (N:N) → Scheduled classes
├── Prerequisites (N:N) → Other courses
└── Faculty (N:N) → Assigned teachers
```

### 3. Academic Structure
```
Departments
├── Users (1:N) → Students and Faculty
├── Courses (1:N) → Offered courses
├── Programs (1:N) → Academic programs
└── Timetables (1:N) → Department schedules

Academic Years
├── Enrollments (1:N) → Year-wise enrollments
├── Results (1:N) → Year-wise results
├── Attendance (1:N) → Year-wise attendance
└── Timetables (1:N) → Year-wise schedules
```

## Query Patterns and Optimization

### 1. Common Query Patterns
```javascript
// Student Dashboard Queries
db.enrollments.find({ 
  "studentId": ObjectId("..."), 
  "academicYear": "2023-24",
  "enrollmentStatus": "Enrolled" 
})

db.attendance.aggregate([
  { $match: { "studentId": ObjectId("..."), "academicYear": "2023-24" } },
  { $group: { 
    _id: "$courseId", 
    totalClasses: { $sum: 1 },
    attendedClasses: { $sum: { $cond: [{ $eq: ["$status", "Present"] }, 1, 0] } }
  }}
])

// Faculty Dashboard Queries
db.courses.find({ 
  "facultyAssigned.facultyId": ObjectId("..."),
  "isActive": true 
})

db.timetables.find({
  "weeklySchedule.slots.facultyId": ObjectId("..."),
  "status": "Active"
})

// Admin Analytics Queries
db.results.aggregate([
  { $match: { "academicYear": "2023-24", "resultStatus": "Published" } },
  { $group: { 
    _id: "$grade", 
    count: { $sum: 1 } 
  }},
  { $sort: { "_id": 1 } }
])
```

### 2. Performance Optimization Strategies

#### Indexing Strategy
- **Compound Indexes**: For multi-field queries
- **Text Indexes**: For search functionality
- **Sparse Indexes**: For optional unique fields
- **TTL Indexes**: For automatic data cleanup

#### Data Modeling Decisions
- **Denormalization**: Store frequently accessed data redundantly
- **Reference vs Embedding**: References for large, changing data
- **Aggregation Pipelines**: For complex analytical queries

#### Caching Strategy
- **Application-level Caching**: Redis for frequently accessed data
- **Database-level Caching**: MongoDB's built-in caching
- **Query Result Caching**: Cache expensive aggregation results

## Data Integrity and Validation

### 1. Application-Level Validation
```javascript
// User Registration Number Format
const registrationNumberRegex = /^\d{2}[A-Z]{3}\d{5}$/;

// Email Validation
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Academic Year Format
const academicYearRegex = /^\d{4}-\d{2}$/;
```

### 2. Database Constraints
- **Unique Constraints**: Email, registration number, course code
- **Required Fields**: Essential data that cannot be null
- **Enum Validation**: Predefined values for status fields
- **Date Validation**: Logical date relationships

### 3. Referential Integrity
- **Cascade Updates**: Update denormalized data when source changes
- **Orphan Prevention**: Validate references before deletion
- **Consistency Checks**: Regular data consistency audits

## Backup and Recovery Strategy

### 1. Backup Strategy
- **Daily Incremental Backups**: Changes since last backup
- **Weekly Full Backups**: Complete database snapshot
- **Monthly Archive**: Long-term storage
- **Real-time Replication**: Secondary servers for high availability

### 2. Recovery Procedures
- **Point-in-Time Recovery**: Restore to specific timestamp
- **Selective Recovery**: Restore specific collections
- **Disaster Recovery**: Complete system restoration
- **Data Validation**: Verify data integrity after recovery

## Security Considerations

### 1. Access Control
- **Role-Based Access**: Different permissions for different roles
- **Field-Level Security**: Restrict access to sensitive fields
- **IP Whitelisting**: Limit database access by IP
- **Connection Encryption**: SSL/TLS for all connections

### 2. Data Protection
- **Password Hashing**: bcrypt with salt rounds
- **Sensitive Data Encryption**: Encrypt PII at rest
- **Audit Logging**: Track all data access and modifications
- **Data Masking**: Hide sensitive data in non-production environments

## Monitoring and Maintenance

### 1. Performance Monitoring
- **Query Performance**: Slow query identification
- **Index Usage**: Monitor index effectiveness
- **Resource Utilization**: CPU, memory, disk usage
- **Connection Pooling**: Optimize database connections

### 2. Maintenance Tasks
- **Index Optimization**: Regular index analysis and optimization
- **Data Archival**: Move old data to archive collections
- **Statistics Update**: Keep query optimizer statistics current
- **Cleanup Jobs**: Remove expired or unnecessary data

This comprehensive database design provides a solid foundation for the VTOP Academic Portal, ensuring scalability, performance, and data integrity while maintaining flexibility for future enhancements.