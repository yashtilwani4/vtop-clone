const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  academicYear: {
    type: String,
    required: true // e.g., "2023-24"
  },
  semester: {
    type: Number,
    required: true,
    min: 1,
    max: 8
  },
  
  // Assessment Scores
  assessments: {
    midterm: {
      maxMarks: { type: Number, default: 30 },
      obtainedMarks: { type: Number, default: 0 },
      conductedDate: Date,
      isCompleted: { type: Boolean, default: false }
    },
    endterm: {
      maxMarks: { type: Number, default: 50 },
      obtainedMarks: { type: Number, default: 0 },
      conductedDate: Date,
      isCompleted: { type: Boolean, default: false }
    },
    assignments: {
      maxMarks: { type: Number, default: 10 },
      obtainedMarks: { type: Number, default: 0 },
      submissions: [{
        title: String,
        maxMarks: Number,
        obtainedMarks: Number,
        submissionDate: Date,
        dueDate: Date,
        feedback: String
      }]
    },
    attendance: {
      maxMarks: { type: Number, default: 10 },
      obtainedMarks: { type: Number, default: 0 },
      attendancePercentage: { type: Number, default: 0 }
    }
  },
  
  // Final Results
  totalMarks: {
    type: Number,
    default: 0
  },
  maxTotalMarks: {
    type: Number,
    default: 100
  },
  percentage: {
    type: Number,
    default: 0
  },
  grade: {
    type: String,
    enum: ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F', 'I', 'W'],
    default: 'I' // I = Incomplete, W = Withdrawn
  },
  gradePoints: {
    type: Number,
    default: 0,
    min: 0,
    max: 10
  },
  
  // Status and Metadata
  status: {
    type: String,
    enum: ['In Progress', 'Completed', 'Failed', 'Withdrawn'],
    default: 'In Progress'
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  publishedDate: Date,
  publishedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Additional Information
  remarks: {
    type: String,
    trim: true
  },
  supplementaryExam: {
    isEligible: { type: Boolean, default: false },
    isCompleted: { type: Boolean, default: false },
    marks: { type: Number, default: 0 },
    conductedDate: Date
  }
}, {
  timestamps: true
});

// Indexes
resultSchema.index({ student: 1, academicYear: 1, semester: 1 });
resultSchema.index({ course: 1, academicYear: 1 });
resultSchema.index({ student: 1, course: 1 }, { unique: true });

// Grade calculation based on percentage
const gradeScale = [
  { min: 90, grade: 'A+', points: 10 },
  { min: 80, grade: 'A', points: 9 },
  { min: 70, grade: 'B+', points: 8 },
  { min: 60, grade: 'B', points: 7 },
  { min: 50, grade: 'C+', points: 6 },
  { min: 40, grade: 'C', points: 5 },
  { min: 35, grade: 'D', points: 4 },
  { min: 0, grade: 'F', points: 0 }
];

// Pre-save middleware to calculate totals and grades
resultSchema.pre('save', function(next) {
  // Calculate total marks
  const assessments = this.assessments;
  this.totalMarks = 
    assessments.midterm.obtainedMarks +
    assessments.endterm.obtainedMarks +
    assessments.assignments.obtainedMarks +
    assessments.attendance.obtainedMarks;
  
  // Calculate percentage
  this.percentage = Math.round((this.totalMarks / this.maxTotalMarks) * 100);
  
  // Calculate grade and grade points
  const gradeInfo = gradeScale.find(scale => this.percentage >= scale.min);
  if (gradeInfo) {
    this.grade = gradeInfo.grade;
    this.gradePoints = gradeInfo.points;
  }
  
  // Update status based on grade
  if (this.grade === 'F') {
    this.status = 'Failed';
  } else if (this.isPublished && this.grade !== 'I') {
    this.status = 'Completed';
  }
  
  next();
});

// Method to calculate attendance marks based on percentage
resultSchema.methods.calculateAttendanceMarks = function(attendancePercentage) {
  this.assessments.attendance.attendancePercentage = attendancePercentage;
  
  // Attendance marking scheme
  if (attendancePercentage >= 90) {
    this.assessments.attendance.obtainedMarks = this.assessments.attendance.maxMarks;
  } else if (attendancePercentage >= 80) {
    this.assessments.attendance.obtainedMarks = Math.round(this.assessments.attendance.maxMarks * 0.8);
  } else if (attendancePercentage >= 75) {
    this.assessments.attendance.obtainedMarks = Math.round(this.assessments.attendance.maxMarks * 0.6);
  } else {
    this.assessments.attendance.obtainedMarks = 0;
  }
  
  return this.save();
};

// Static method to get semester results for a student
resultSchema.statics.getSemesterResults = async function(studentId, academicYear, semester) {
  return await this.find({
    student: studentId,
    academicYear,
    semester,
    isPublished: true
  }).populate('course', 'courseCode courseName credits');
};

// Static method to calculate CGPA
resultSchema.statics.calculateCGPA = async function(studentId, upToSemester = null) {
  const matchStage = {
    student: new mongoose.Types.ObjectId(studentId),
    isPublished: true,
    status: 'Completed'
  };
  
  if (upToSemester) {
    matchStage.semester = { $lte: upToSemester };
  }
  
  const pipeline = [
    { $match: matchStage },
    {
      $lookup: {
        from: 'courses',
        localField: 'course',
        foreignField: '_id',
        as: 'courseDetails'
      }
    },
    { $unwind: '$courseDetails' },
    {
      $group: {
        _id: null,
        totalCredits: { $sum: '$courseDetails.credits' },
        totalGradePoints: {
          $sum: { $multiply: ['$gradePoints', '$courseDetails.credits'] }
        }
      }
    },
    {
      $addFields: {
        cgpa: {
          $round: [
            { $divide: ['$totalGradePoints', '$totalCredits'] },
            2
          ]
        }
      }
    }
  ];
  
  const result = await this.aggregate(pipeline);
  return result.length > 0 ? result[0].cgpa : 0;
};

// Static method to get class rank
resultSchema.statics.getClassRank = async function(studentId, academicYear, semester) {
  const pipeline = [
    {
      $match: {
        academicYear,
        semester,
        isPublished: true,
        status: 'Completed'
      }
    },
    {
      $group: {
        _id: '$student',
        totalPercentage: { $avg: '$percentage' }
      }
    },
    { $sort: { totalPercentage: -1 } },
    {
      $group: {
        _id: null,
        students: { $push: { student: '$_id', percentage: '$totalPercentage' } }
      }
    }
  ];
  
  const result = await this.aggregate(pipeline);
  if (result.length === 0) return { rank: 0, totalStudents: 0 };
  
  const students = result[0].students;
  const studentIndex = students.findIndex(
    s => s.student.toString() === studentId.toString()
  );
  
  return {
    rank: studentIndex + 1,
    totalStudents: students.length,
    percentage: studentIndex >= 0 ? students[studentIndex].percentage : 0
  };
};

module.exports = mongoose.model('Result', resultSchema);