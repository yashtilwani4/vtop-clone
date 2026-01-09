# Results APIs Documentation

## Overview
This document describes the Results APIs for the VTOP Academic Portal, providing functionality for faculty to upload marks, calculate grades automatically, and students to fetch their results securely.

## Features
- ✅ **Upload Marks** (Faculty only)
- ✅ **Calculate Grades Automatically** (Based on weighted assessments)
- ✅ **Fetch Student Results Securely** (Students see only published results)
- ✅ **Bulk Marks Upload**
- ✅ **Grade Distribution Analysis**
- ✅ **CGPA/SGPA Calculation**
- ✅ **Result Publishing System**
- ✅ **Assessment Breakdown** (Internal + External)

## Authentication
All endpoints require JWT authentication via the `Authorization` header:
```
Authorization: Bearer <jwt_token>
```

## Grading System

### Grade Scale
| Marks Range | Grade | Grade Points |
|-------------|-------|--------------|
| 90-100      | A+    | 10           |
| 80-89       | A     | 9            |
| 70-79       | B+    | 8            |
| 60-69       | B     | 7            |
| 55-59       | C+    | 6            |
| 50-54       | C     | 5            |
| 40-49       | D     | 4            |
| Below 40    | F     | 0            |

### Assessment Structure
- **Internal Assessments (40%)**
  - Midterm: 20% (Max: 50 marks)
  - Assignments: 10% (Max: 30 marks)
  - Quiz: 10% (Max: 20 marks)
- **External Assessment (60%)**
  - End Term: 60% (Max: 100 marks)

## API Endpoints

### 1. Upload Marks (Faculty Only)
**POST** `/api/simple-results/upload`

Upload marks for multiple students in a course.

#### Request Body
```json
{
  "courseId": "507f1f77bcf86cd799439011",
  "academicYear": "2023-24",
  "semester": 5,
  "results": [
    {
      "studentId": "507f1f77bcf86cd799439012",
      "assessments": {
        "internal": {
          "midterm": {
            "maxMarks": 50,
            "obtainedMarks": 42,
            "weightage": 20
          },
          "assignments": {
            "maxMarks": 30,
            "obtainedMarks": 28,
            "weightage": 10
          },
          "quiz": {
            "maxMarks": 20,
            "obtainedMarks": 18,
            "weightage": 10
          }
        },
        "external": {
          "endterm": {
            "maxMarks": 100,
            "obtainedMarks": 75,
            "weightage": 60
          }
        }
      },
      "remarks": "Good performance"
    }
  ]
}
```

#### Response
```json
{
  "success": true,
  "message": "Marks uploaded successfully",
  "data": {
    "courseId": "507f1f77bcf86cd799439011",
    "academicYear": "2023-24",
    "semester": 5,
    "totalStudents": 1,
    "uploadedRecords": 1,
    "results": [
      {
        "student": {
          "id": "507f1f77bcf86cd799439012",
          "name": "Alice Johnson",
          "registrationNumber": "22BCE10405"
        },
        "totalMarks": 81.6,
        "grade": "A",
        "gradePoints": 9,
        "status": "Draft",
        "assessments": {
          "internal": {
            "midterm": { "maxMarks": 50, "obtainedMarks": 42, "weightage": 20 },
            "assignments": { "maxMarks": 30, "obtainedMarks": 28, "weightage": 10 },
            "quiz": { "maxMarks": 20, "obtainedMarks": 18, "weightage": 10 }
          },
          "external": {
            "endterm": { "maxMarks": 100, "obtainedMarks": 75, "weightage": 60 }
          }
        },
        "uploadedAt": "2024-01-15T10:30:00.000Z"
      }
    ]
  }
}
```

---

### 2. Calculate Grades (Faculty Only)
**POST** `/api/simple-results/calculate-grades`

Calculate grades for all uploaded marks in a course.

#### Request Body
```json
{
  "courseId": "507f1f77bcf86cd799439011",
  "academicYear": "2023-24",
  "semester": 5
}
```

#### Response
```json
{
  "success": true,
  "message": "Grades calculated successfully",
  "data": {
    "course": {
      "id": "507f1f77bcf86cd799439011",
      "code": "CSE301",
      "name": "Data Structures and Algorithms"
    },
    "academicYear": "2023-24",
    "semester": 5,
    "statistics": {
      "totalStudents": 25,
      "passedStudents": 23,
      "failedStudents": 2,
      "passPercentage": 92,
      "averageMarks": 76.5,
      "gradeDistribution": {
        "A+": 5,
        "A": 8,
        "B+": 6,
        "B": 4,
        "C": 0,
        "D": 0,
        "F": 2
      }
    },
    "results": [
      {
        "student": {
          "id": "507f1f77bcf86cd799439012",
          "name": "Alice Johnson",
          "registrationNumber": "22BCE10405"
        },
        "totalMarks": 81.6,
        "grade": "A",
        "gradePoints": 9,
        "status": "Pass"
      }
    ]
  }
}
```

---

### 3. Fetch Student Results Securely
**GET** `/api/simple-results/student/:studentId?`

Fetch results for a student. Students can only view their own published results.

#### Query Parameters
- `academicYear` (optional) - Filter by academic year (e.g., "2023-24")
- `semester` (optional) - Filter by semester (1-8)
- `courseId` (optional) - Filter by specific course

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
    "cgpa": {
      "cgpa": 8.5,
      "totalCredits": 45,
      "totalGradePoints": 382.5,
      "coursesCompleted": 12,
      "totalCourses": 12
    },
    "semesterSummaries": [
      {
        "academicYear": "2023-24",
        "semester": 5,
        "totalCourses": 6,
        "passedCourses": 6,
        "failedCourses": 0,
        "totalCredits": 24,
        "sgpa": 8.7,
        "status": "Pass"
      }
    ],
    "results": [
      {
        "id": "result_id",
        "course": {
          "id": "course_id",
          "code": "CSE301",
          "name": "Data Structures and Algorithms",
          "credits": 4
        },
        "academicYear": "2023-24",
        "semester": 5,
        "totalMarks": 81.6,
        "percentage": 82,
        "grade": "A",
        "gradePoints": 9,
        "status": "Pass",
        "assessments": {
          "internal": {
            "midterm": { "maxMarks": 50, "obtainedMarks": 42, "weightage": 20 },
            "assignments": { "maxMarks": 30, "obtainedMarks": 28, "weightage": 10 },
            "quiz": { "maxMarks": 20, "obtainedMarks": 18, "weightage": 10 }
          },
          "external": {
            "endterm": { "maxMarks": 100, "obtainedMarks": 75, "weightage": 60 }
          }
        },
        "faculty": "Prof. John Smith",
        "publishedAt": "2024-01-15T15:00:00.000Z"
      }
    ]
  }
}
```

---

### 4. Get My Results (Student Only)
**GET** `/api/simple-results/my-results`

Simplified endpoint for students to get their own results.

#### Query Parameters
- `academicYear` (optional) - Filter by academic year
- `semester` (optional) - Filter by semester

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
    "cgpa": {
      "cgpa": 8.5,
      "totalCredits": 45,
      "totalGradePoints": 382.5,
      "coursesCompleted": 12
    },
    "totalResults": 12,
    "latestResults": [
      {
        "course": {
          "code": "CSE301",
          "name": "Data Structures and Algorithms",
          "credits": 4
        },
        "academicYear": "2023-24",
        "semester": 5,
        "grade": "A",
        "gradePoints": 9,
        "totalMarks": 81.6
      }
    ],
    "allResults": [
      {
        "id": "result_id",
        "course": {
          "code": "CSE301",
          "name": "Data Structures and Algorithms",
          "credits": 4
        },
        "academicYear": "2023-24",
        "semester": 5,
        "totalMarks": 81.6,
        "grade": "A",
        "gradePoints": 9,
        "status": "Pass"
      }
    ]
  }
}
```

---

### 5. Get Course Results (Faculty Only)
**GET** `/api/simple-results/course/:courseId`

Get all results for a course. Faculty can only view courses they teach.

#### Query Parameters
- `academicYear` (optional) - Filter by academic year
- `semester` (optional) - Filter by semester
- `status` (optional) - Filter by status (Draft/Published/Locked, default: all)

#### Response
```json
{
  "success": true,
  "data": {
    "course": {
      "id": "507f1f77bcf86cd799439011",
      "code": "CSE301",
      "name": "Data Structures and Algorithms",
      "faculty": "Prof. John Smith"
    },
    "statistics": {
      "totalResults": 25,
      "publishedResults": 20,
      "draftResults": 5,
      "passedStudents": 18,
      "failedStudents": 2,
      "passPercentage": 90,
      "averageMarks": 76.5,
      "gradeDistribution": {
        "A+": 5,
        "A": 8,
        "B+": 5,
        "B": 0,
        "C": 0,
        "D": 0,
        "F": 2
      }
    },
    "results": [
      {
        "id": "result_id",
        "student": {
          "id": "student_id",
          "name": "Alice Johnson",
          "registrationNumber": "22BCE10405"
        },
        "academicYear": "2023-24",
        "semester": 5,
        "totalMarks": 81.6,
        "grade": "A",
        "gradePoints": 9,
        "status": "Published",
        "isPassed": true,
        "assessments": {
          "internal": {
            "midterm": { "maxMarks": 50, "obtainedMarks": 42, "weightage": 20 },
            "assignments": { "maxMarks": 30, "obtainedMarks": 28, "weightage": 10 },
            "quiz": { "maxMarks": 20, "obtainedMarks": 18, "weightage": 10 }
          },
          "external": {
            "endterm": { "maxMarks": 100, "obtainedMarks": 75, "weightage": 60 }
          }
        },
        "updatedAt": "2024-01-15T10:30:00.000Z"
      }
    ]
  }
}
```

---

### 6. Publish Results (Faculty Only)
**POST** `/api/simple-results/publish`

Publish draft results to make them visible to students.

#### Request Body
```json
{
  "resultIds": [
    "result_id_1",
    "result_id_2",
    "result_id_3"
  ]
}
```

#### Response
```json
{
  "success": true,
  "message": "3 results published successfully",
  "data": {
    "publishedCount": 3,
    "totalRequested": 3,
    "publishedAt": "2024-01-15T15:00:00.000Z"
  }
}
```

---

### 7. Update Result (Faculty Only)
**PUT** `/api/simple-results/:id`

Update an existing result (only if not locked).

#### Request Body
```json
{
  "assessments": {
    "internal": {
      "midterm": {
        "obtainedMarks": 45
      }
    }
  },
  "remarks": "Updated after re-evaluation"
}
```

#### Response
```json
{
  "success": true,
  "message": "Result updated successfully",
  "data": {
    "id": "result_id",
    "student": {
      "id": "student_id",
      "name": "Alice Johnson",
      "registrationNumber": "22BCE10405"
    },
    "course": {
      "id": "course_id",
      "code": "CSE301",
      "name": "Data Structures and Algorithms"
    },
    "totalMarks": 83.2,
    "grade": "A",
    "gradePoints": 9,
    "status": "Draft",
    "assessments": {
      "internal": {
        "midterm": { "maxMarks": 50, "obtainedMarks": 45, "weightage": 20 },
        "assignments": { "maxMarks": 30, "obtainedMarks": 28, "weightage": 10 },
        "quiz": { "maxMarks": 20, "obtainedMarks": 18, "weightage": 10 }
      },
      "external": {
        "endterm": { "maxMarks": 100, "obtainedMarks": 75, "weightage": 60 }
      }
    },
    "remarks": "Updated after re-evaluation",
    "updatedAt": "2024-01-15T16:00:00.000Z"
  }
}
```

## Grade Calculation Formula

### Weighted Total Calculation
```javascript
// Internal Assessments (40%)
midtermScore = (obtainedMarks / maxMarks) * weightage  // 20%
assignmentScore = (obtainedMarks / maxMarks) * weightage  // 10%
quizScore = (obtainedMarks / maxMarks) * weightage  // 10%

// External Assessment (60%)
endtermScore = (obtainedMarks / maxMarks) * weightage  // 60%

// Total Marks (out of 100)
totalMarks = midtermScore + assignmentScore + quizScore + endtermScore
```

### CGPA Calculation
```javascript
// For each course
gradePoints = grade * credits

// Overall CGPA
totalGradePoints = sum(gradePoints for all courses)
totalCredits = sum(credits for all courses)
CGPA = totalGradePoints / totalCredits
```

## Security Features

### 1. Role-based Access Control
- **Faculty**: Can upload marks only for assigned courses
- **Students**: Can view only their own published results
- **Admin**: Can access all results and courses

### 2. Result Status System
- **Draft**: Visible only to faculty, can be edited
- **Published**: Visible to students, limited editing
- **Locked**: No editing allowed, final results

### 3. Data Validation
- Marks cannot exceed maximum marks
- Students must be enrolled in courses
- Faculty must be assigned to courses
- Academic year format validation

### 4. Secure Data Access
- Students see only published results
- Assessment details hidden until published
- Faculty access restricted to assigned courses

## Usage Examples

### Faculty Uploading Marks
```javascript
// 1. Prepare marks data
const marksData = {
  courseId: 'course_id',
  academicYear: '2023-24',
  semester: 5,
  results: students.map(student => ({
    studentId: student._id,
    assessments: {
      internal: {
        midterm: { maxMarks: 50, obtainedMarks: student.midtermMarks, weightage: 20 },
        assignments: { maxMarks: 30, obtainedMarks: student.assignmentMarks, weightage: 10 },
        quiz: { maxMarks: 20, obtainedMarks: student.quizMarks, weightage: 10 }
      },
      external: {
        endterm: { maxMarks: 100, obtainedMarks: student.endtermMarks, weightage: 60 }
      }
    }
  }))
};

// 2. Upload marks
const uploadResponse = await uploadMarks(marksData);

// 3. Calculate grades
const gradesResponse = await calculateGrades({
  courseId: 'course_id',
  academicYear: '2023-24',
  semester: 5
});

// 4. Publish results
const publishResponse = await publishResults({
  resultIds: uploadResponse.data.results.map(r => r.id)
});
```

### Student Checking Results
```javascript
// 1. Get own results
const myResults = await getMyResults();

// 2. Check CGPA
console.log('Current CGPA:', myResults.data.cgpa.cgpa);

// 3. View latest results
myResults.data.latestResults.forEach(result => {
  console.log(`${result.course.code}: ${result.grade} (${result.totalMarks}%)`);
});

// 4. Get specific semester results
const semesterResults = await getMyResults({
  academicYear: '2023-24',
  semester: 5
});
```

## Error Handling

### Common Error Responses

#### Validation Error
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    "Midterm obtained marks cannot exceed maximum marks",
    "Student is not enrolled in this course"
  ]
}
```

#### Authorization Error
```json
{
  "success": false,
  "message": "Students can only view their own results"
}
```

#### Not Found Error
```json
{
  "success": false,
  "message": "Course not found"
}
```

## Integration Examples

### Frontend Grade Calculator
```javascript
const GradeCalculator = ({ assessments }) => {
  const calculateTotal = () => {
    const midterm = (assessments.internal.midterm.obtained / assessments.internal.midterm.max) * 20;
    const assignment = (assessments.internal.assignments.obtained / assessments.internal.assignments.max) * 10;
    const quiz = (assessments.internal.quiz.obtained / assessments.internal.quiz.max) * 10;
    const endterm = (assessments.external.endterm.obtained / assessments.external.endterm.max) * 60;
    
    return midterm + assignment + quiz + endterm;
  };

  const getGrade = (total) => {
    if (total >= 90) return 'A+';
    if (total >= 80) return 'A';
    if (total >= 70) return 'B+';
    if (total >= 60) return 'B';
    if (total >= 55) return 'C+';
    if (total >= 50) return 'C';
    if (total >= 40) return 'D';
    return 'F';
  };

  const total = calculateTotal();
  const grade = getGrade(total);

  return (
    <div>
      <h3>Grade Calculator</h3>
      <p>Total Marks: {total.toFixed(2)}%</p>
      <p>Grade: {grade}</p>
    </div>
  );
};
```

### Result Status Indicator
```javascript
const ResultStatus = ({ status, grade, totalMarks }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'Published': return 'green';
      case 'Draft': return 'orange';
      case 'Locked': return 'blue';
      default: return 'gray';
    }
  };

  const getGradeColor = (grade) => {
    if (['A+', 'A'].includes(grade)) return 'green';
    if (['B+', 'B'].includes(grade)) return 'blue';
    if (['C+', 'C', 'D'].includes(grade)) return 'orange';
    return 'red';
  };

  return (
    <div className="result-status">
      <span 
        className="status-badge" 
        style={{ backgroundColor: getStatusColor(status) }}
      >
        {status}
      </span>
      <span 
        className="grade-badge"
        style={{ color: getGradeColor(grade) }}
      >
        {grade} ({totalMarks}%)
      </span>
    </div>
  );
};
```

## File Locations

- **Schema**: `server/models/SimpleResult.js`
- **Routes**: `server/routes/simpleResults.js`
- **Documentation**: `server/RESULTS_API_DOCS.md`