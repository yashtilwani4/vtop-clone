/**
 * Example usage of Results APIs
 * This demonstrates how to use the results endpoints
 */

// Base URL for the API (adjust as needed)
const BASE_URL = 'http://localhost:5000/api';

// Example tokens (in real usage, get these from login)
const FACULTY_TOKEN = 'your_faculty_jwt_token_here';
const STUDENT_TOKEN = 'your_student_jwt_token_here';

// Note: This example shows API usage patterns without making actual HTTP requests
// In a real application, use fetch() or axios to make these requests

// Example 1: Upload Marks (Faculty)
const uploadMarksExample = () => {
  console.log('📝 Example 1: Upload Marks (Faculty)\n');

  const marksData = {
    courseId: '507f1f77bcf86cd799439011', // Replace with actual course ID
    academicYear: '2023-24',
    semester: 5,
    results: [
      {
        studentId: '507f1f77bcf86cd799439012', // Replace with actual student ID
        assessments: {
          internal: {
            midterm: {
              maxMarks: 50,
              obtainedMarks: 42,
              weightage: 20
            },
            assignments: {
              maxMarks: 30,
              obtainedMarks: 28,
              weightage: 10
            },
            quiz: {
              maxMarks: 20,
              obtainedMarks: 18,
              weightage: 10
            }
          },
          external: {
            endterm: {
              maxMarks: 100,
              obtainedMarks: 75,
              weightage: 60
            }
          }
        },
        remarks: 'Good performance overall'
      },
      {
        studentId: '507f1f77bcf86cd799439013', // Replace with actual student ID
        assessments: {
          internal: {
            midterm: {
              maxMarks: 50,
              obtainedMarks: 38,
              weightage: 20
            },
            assignments: {
              maxMarks: 30,
              obtainedMarks: 25,
              weightage: 10
            },
            quiz: {
              maxMarks: 20,
              obtainedMarks: 16,
              weightage: 10
            }
          },
          external: {
            endterm: {
              maxMarks: 100,
              obtainedMarks: 68,
              weightage: 60
            }
          }
        },
        remarks: 'Needs improvement in assignments'
      }
    ]
  };

  console.log('Request Data:', JSON.stringify(marksData, null, 2));
  console.log('✅ Example request structure shown');
  console.log('📡 Endpoint: POST /api/simple-results/upload');
  console.log('🔑 Authorization: Bearer ' + FACULTY_TOKEN);
  
  // Calculate expected total for first student
  const student1 = marksData.results[0];
  const midtermScore = (student1.assessments.internal.midterm.obtainedMarks / student1.assessments.internal.midterm.maxMarks) * 20;
  const assignmentScore = (student1.assessments.internal.assignments.obtainedMarks / student1.assessments.internal.assignments.maxMarks) * 10;
  const quizScore = (student1.assessments.internal.quiz.obtainedMarks / student1.assessments.internal.quiz.maxMarks) * 10;
  const endtermScore = (student1.assessments.external.endterm.obtainedMarks / student1.assessments.external.endterm.maxMarks) * 60;
  
  const totalMarks = midtermScore + assignmentScore + quizScore + endtermScore;
  console.log(`💯 Expected total for first student: ${totalMarks.toFixed(2)}%`);
};

// Example 2: Calculate Grades (Faculty)
const calculateGradesExample = () => {
  console.log('\n🎯 Example 2: Calculate Grades (Faculty)\n');

  const gradeData = {
    courseId: '507f1f77bcf86cd799439011', // Replace with actual course ID
    academicYear: '2023-24',
    semester: 5
  };

  console.log('Request Data:', JSON.stringify(gradeData, null, 2));
  console.log('📡 Endpoint: POST /api/simple-results/calculate-grades');
  console.log('🔑 Authorization: Bearer ' + FACULTY_TOKEN);
  console.log('✅ Calculates grades for all uploaded marks');
  console.log('📊 Returns class statistics and grade distribution');
};

// Example 3: Fetch Student Results Securely
const fetchStudentResultsExample = () => {
  console.log('\n📊 Example 3: Fetch Student Results Securely\n');

  // Student fetching their own results
  console.log('3a. Student fetching own results:');
  console.log('📡 Endpoint: GET /api/simple-results/my-results');
  console.log('🔑 Authorization: Bearer ' + STUDENT_TOKEN);
  console.log('✅ Shows only published results');
  console.log('📈 Includes CGPA calculation');

  // Faculty/Admin fetching specific student's results
  console.log('\n3b. Faculty fetching student results:');
  const specificStudentId = '507f1f77bcf86cd799439012'; // Replace with actual student ID
  console.log(`📡 Endpoint: GET /api/simple-results/student/${specificStudentId}`);
  console.log('🔑 Authorization: Bearer ' + FACULTY_TOKEN);
  console.log('✅ Faculty can view any student\'s results');

  // With filters
  console.log('\n3c. Filtered results:');
  console.log(`📡 Endpoint: GET /api/simple-results/student/${specificStudentId}?academicYear=2023-24&semester=5`);
  console.log('🔑 Authorization: Bearer ' + FACULTY_TOKEN);
  console.log('✅ Filter by academic year and semester');
};

// Example 4: Publish Results (Faculty)
const publishResultsExample = () => {
  console.log('\n📢 Example 4: Publish Results (Faculty)\n');

  const publishData = {
    resultIds: [
      '507f1f77bcf86cd799439015', // Replace with actual result IDs
      '507f1f77bcf86cd799439016',
      '507f1f77bcf86cd799439017'
    ]
  };

  console.log('Request Data:', JSON.stringify(publishData, null, 2));
  console.log('📡 Endpoint: POST /api/simple-results/publish');
  console.log('🔑 Authorization: Bearer ' + FACULTY_TOKEN);
  console.log('✅ Makes results visible to students');
  console.log('🔒 Changes status from Draft to Published');
};

// Example 5: Update Result (Faculty)
const updateResultExample = () => {
  console.log('\n✏️  Example 5: Update Result (Faculty)\n');

  const resultId = '507f1f77bcf86cd799439015'; // Replace with actual result ID
  
  const updateData = {
    assessments: {
      internal: {
        midterm: {
          obtainedMarks: 45 // Updated from 42 to 45
        }
      }
    },
    remarks: 'Updated after re-evaluation'
  };

  console.log('Update Data:', JSON.stringify(updateData, null, 2));
  console.log(`📡 Endpoint: PUT /api/simple-results/${resultId}`);
  console.log('🔑 Authorization: Bearer ' + FACULTY_TOKEN);
  console.log('✅ Recalculates grades automatically');
  console.log('⚠️  Only works for non-locked results');
};

// Example 6: Course Results Overview (Faculty)
const courseResultsExample = () => {
  console.log('\n📋 Example 6: Course Results Overview (Faculty)\n');

  const courseId = '507f1f77bcf86cd799439011'; // Replace with actual course ID

  console.log('6a. All course results:');
  console.log(`📡 Endpoint: GET /api/simple-results/course/${courseId}`);
  console.log('🔑 Authorization: Bearer ' + FACULTY_TOKEN);
  console.log('✅ Shows all students\' results with statistics');

  console.log('\n6b. Filtered course results:');
  console.log(`📡 Endpoint: GET /api/simple-results/course/${courseId}?academicYear=2023-24&semester=5&status=Published`);
  console.log('🔑 Authorization: Bearer ' + FACULTY_TOKEN);
  console.log('✅ Filter by academic year, semester, and status');
};

// Grade calculation demonstration
const gradeCalculationDemo = () => {
  console.log('\n🧮 Grade Calculation Demonstration\n');

  const sampleAssessments = {
    internal: {
      midterm: { maxMarks: 50, obtainedMarks: 42, weightage: 20 },
      assignments: { maxMarks: 30, obtainedMarks: 28, weightage: 10 },
      quiz: { maxMarks: 20, obtainedMarks: 18, weightage: 10 }
    },
    external: {
      endterm: { maxMarks: 100, obtainedMarks: 75, weightage: 60 }
    }
  };

  console.log('Sample Assessment Marks:');
  console.log('- Midterm: 42/50 (20% weightage)');
  console.log('- Assignments: 28/30 (10% weightage)');
  console.log('- Quiz: 18/20 (10% weightage)');
  console.log('- End Term: 75/100 (60% weightage)');

  // Calculate weighted scores
  const midtermScore = (42 / 50) * 20; // 16.8
  const assignmentScore = (28 / 30) * 10; // 9.33
  const quizScore = (18 / 20) * 10; // 9.0
  const endtermScore = (75 / 100) * 60; // 45.0

  const totalMarks = midtermScore + assignmentScore + quizScore + endtermScore;

  console.log('\nWeighted Calculation:');
  console.log(`- Midterm Score: (42/50) × 20 = ${midtermScore.toFixed(2)}`);
  console.log(`- Assignment Score: (28/30) × 10 = ${assignmentScore.toFixed(2)}`);
  console.log(`- Quiz Score: (18/20) × 10 = ${quizScore.toFixed(2)}`);
  console.log(`- End Term Score: (75/100) × 60 = ${endtermScore.toFixed(2)}`);
  console.log(`- Total Marks: ${totalMarks.toFixed(2)}%`);

  // Determine grade
  let grade, gradePoints;
  if (totalMarks >= 90) { grade = 'A+'; gradePoints = 10; }
  else if (totalMarks >= 80) { grade = 'A'; gradePoints = 9; }
  else if (totalMarks >= 70) { grade = 'B+'; gradePoints = 8; }
  else if (totalMarks >= 60) { grade = 'B'; gradePoints = 7; }
  else if (totalMarks >= 55) { grade = 'C+'; gradePoints = 6; }
  else if (totalMarks >= 50) { grade = 'C'; gradePoints = 5; }
  else if (totalMarks >= 40) { grade = 'D'; gradePoints = 4; }
  else { grade = 'F'; gradePoints = 0; }

  console.log(`\nFinal Grade: ${grade} (${gradePoints} points)`);
};

// CGPA calculation example
const cgpaCalculationDemo = () => {
  console.log('\n📈 CGPA Calculation Example\n');

  const sampleResults = [
    { course: 'CSE301', credits: 4, grade: 'A', gradePoints: 9 },
    { course: 'CSE302', credits: 3, grade: 'B+', gradePoints: 8 },
    { course: 'MATH201', credits: 4, grade: 'A+', gradePoints: 10 },
    { course: 'PHY101', credits: 2, grade: 'B', gradePoints: 7 }
  ];

  console.log('Sample Course Results:');
  sampleResults.forEach(result => {
    console.log(`- ${result.course}: ${result.grade} (${result.gradePoints} points, ${result.credits} credits)`);
  });

  let totalGradePoints = 0;
  let totalCredits = 0;

  sampleResults.forEach(result => {
    const courseGradePoints = result.gradePoints * result.credits;
    totalGradePoints += courseGradePoints;
    totalCredits += result.credits;
    console.log(`  Grade Points: ${result.gradePoints} × ${result.credits} = ${courseGradePoints}`);
  });

  const cgpa = totalGradePoints / totalCredits;

  console.log('\nCGPA Calculation:');
  console.log(`Total Grade Points: ${totalGradePoints}`);
  console.log(`Total Credits: ${totalCredits}`);
  console.log(`CGPA: ${totalGradePoints} ÷ ${totalCredits} = ${cgpa.toFixed(2)}`);
};

// Example API responses and data structures
const showExampleResponses = () => {
  console.log('\n📄 Example API Responses\n');

  console.log('1. Upload Marks Response:');
  console.log(`{
  "success": true,
  "message": "Marks uploaded successfully",
  "data": {
    "courseId": "507f1f77bcf86cd799439011",
    "academicYear": "2023-24",
    "semester": 5,
    "totalStudents": 2,
    "uploadedRecords": 2,
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
        "status": "Draft"
      }
    ]
  }
}`);

  console.log('\n2. Student Results Response:');
  console.log(`{
  "success": true,
  "data": {
    "student": {
      "name": "Alice Johnson",
      "registrationNumber": "22BCE10405"
    },
    "cgpa": {
      "cgpa": 8.5,
      "totalCredits": 45,
      "coursesCompleted": 12
    },
    "results": [
      {
        "course": {
          "code": "CSE301",
          "name": "Data Structures",
          "credits": 4
        },
        "totalMarks": 81.6,
        "grade": "A",
        "gradePoints": 9,
        "status": "Pass"
      }
    ]
  }
}`);

  console.log('\n3. Grade Calculation Response:');
  console.log(`{
  "success": true,
  "data": {
    "statistics": {
      "totalStudents": 25,
      "passedStudents": 23,
      "passPercentage": 92,
      "averageMarks": 76.5,
      "gradeDistribution": {
        "A+": 5,
        "A": 8,
        "B+": 6,
        "B": 4,
        "F": 2
      }
    }
  }
}`);
};

// Usage scenarios for different roles
const usageScenarios = () => {
  console.log('\n🎯 Usage Scenarios\n');

  console.log('Scenario 1: Faculty Uploading and Publishing Results');
  console.log('- Faculty uploads marks for all students in course');
  console.log('- System calculates grades automatically using weighted formula');
  console.log('- Faculty reviews calculated grades and statistics');
  console.log('- Faculty publishes results to make them visible to students');

  console.log('\nScenario 2: Student Checking Results');
  console.log('- Student logs in to portal');
  console.log('- Views overall CGPA and semester summaries');
  console.log('- Checks detailed results for specific courses');
  console.log('- Downloads result transcripts (if implemented)');

  console.log('\nScenario 3: Faculty Monitoring Class Performance');
  console.log('- Faculty views course results overview');
  console.log('- Analyzes grade distribution and pass percentage');
  console.log('- Identifies students needing additional support');
  console.log('- Updates marks if re-evaluation is needed');

  console.log('\nScenario 4: Academic Administration');
  console.log('- Admin can view all course results across departments');
  console.log('- Generates semester-wise performance reports');
  console.log('- Monitors overall academic performance trends');
  console.log('- Ensures result publication deadlines are met');
};

// Security and validation features
const securityFeatures = () => {
  console.log('\n🔒 Security Features\n');

  console.log('1. Role-based Access Control:');
  console.log('   - Faculty can only upload marks for assigned courses');
  console.log('   - Students can only view their own published results');
  console.log('   - Admin has full access to all results');

  console.log('\n2. Result Status System:');
  console.log('   - Draft: Visible only to faculty, can be edited');
  console.log('   - Published: Visible to students, limited editing');
  console.log('   - Locked: No editing allowed, final results');

  console.log('\n3. Data Validation:');
  console.log('   - Marks cannot exceed maximum marks');
  console.log('   - Students must be enrolled in courses');
  console.log('   - Faculty must be assigned to courses');
  console.log('   - Academic year format validation');

  console.log('\n4. Audit Trail:');
  console.log('   - All mark uploads are logged with faculty ID');
  console.log('   - Result updates track modification timestamps');
  console.log('   - Publication events are recorded');
};

// Run all examples
const runExamples = () => {
  console.log('🚀 Results API Examples\n');
  console.log('=' .repeat(60));
  
  console.log('⚠️  Note: Replace example IDs and tokens with actual values\n');
  
  uploadMarksExample();
  calculateGradesExample();
  fetchStudentResultsExample();
  publishResultsExample();
  updateResultExample();
  courseResultsExample();
  
  gradeCalculationDemo();
  cgpaCalculationDemo();
  showExampleResponses();
  usageScenarios();
  securityFeatures();
  
  console.log('\n' + '='.repeat(60));
  console.log('📖 API Endpoints Summary:');
  console.log('   POST /api/simple-results/upload - Upload marks (Faculty)');
  console.log('   POST /api/simple-results/calculate-grades - Calculate grades (Faculty)');
  console.log('   GET  /api/simple-results/student/:id - Fetch student results');
  console.log('   GET  /api/simple-results/my-results - Get own results (Student)');
  console.log('   GET  /api/simple-results/course/:id - Course results (Faculty)');
  console.log('   POST /api/simple-results/publish - Publish results (Faculty)');
  console.log('   PUT  /api/simple-results/:id - Update result (Faculty)');
  console.log('\n💡 Use: node examples/resultsApiExample.js');
};

// Export for use in other files
module.exports = {
  uploadMarksExample,
  calculateGradesExample,
  fetchStudentResultsExample,
  publishResultsExample,
  updateResultExample,
  courseResultsExample,
  gradeCalculationDemo,
  cgpaCalculationDemo,
  runExamples
};

// Run if this file is executed directly
if (require.main === module) {
  runExamples();
}