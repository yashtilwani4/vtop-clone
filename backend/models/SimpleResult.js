const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
  // Course reference
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SimpleCourse',
    required: [true, 'Course ID is required'],
    validate: {
      validator: function(v) {
        return mongoose.Types.ObjectId.isValid(v);
      },
      message: 'Course ID must be a valid ObjectId'
    }
  },
  
  // Student reference
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SimpleUser',
    required: [true, 'Student ID is required'],
    validate: {
      validator: function(v) {
        return mongoose.Types.ObjectId.isValid(v);
      },
      message: 'Student ID must be a valid ObjectId'
    }
  },
  
  // Faculty who uploaded the marks
  facultyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SimpleUser',
    required: [true, 'Faculty ID is required'],
    validate: {
      validator: function(v) {
        return mongoose.Types.ObjectId.isValid(v);
      },
      message: 'Faculty ID must be a valid ObjectId'
    }
  },
  
  // Academic details
  academicYear: {
    type: String,
    required: [true, 'Academic year is required'],
    match: [/^\d{4}-\d{2}$/, 'Academic year must be in YYYY-YY format (e.g., 2023-24)']
  },
  
  semester: {
    type: Number,
    required: [true, 'Semester is required'],
    min: [1, 'Semester must be at least 1'],
    max: [8, 'Semester cannot exceed 8']
  },
  
  // Assessment components
  assessments: {
    // Internal assessments (40% weightage)
    internal: {
      midterm: {
        maxMarks: { type: Number, default: 50, min: 0 },
        obtainedMarks: { type: Number, default: 0, min: 0 },
        weightage: { type: Number, default: 20 } // 20% of total
      },
      assignments: {
        maxMarks: { type: Number, default: 30, min: 0 },
        obtainedMarks: { type: Number, default: 0, min: 0 },
        weightage: { type: Number, default: 10 } // 10% of total
      },
      quiz: {
        maxMarks: { type: Number, default: 20, min: 0 },
        obtainedMarks: { type: Number, default: 0, min: 0 },
        weightage: { type: Number, default: 10 } // 10% of total
      }
    },
    
    // External assessment (60% weightage)
    external: {
      endterm: {
        maxMarks: { type: Number, default: 100, min: 0 },
        obtainedMarks: { type: Number, default: 0, min: 0 },
        weightage: { type: Number, default: 60 } // 60% of total
      }
    }
  },
  
  // Calculated fields
  totalMarks: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  
  grade: {
    type: String,
    enum: ['S', 'A', 'B', 'C', 'D', 'E', 'F', 'P', 'I', 'W'],
    default: 'F'
  },
  
  gradePoints: {
    type: Number,
    default: 0,
    min: 0,
    max: 10
  },
  
  // Status and metadata
  status: {
    type: String,
    enum: ['Draft', 'Published', 'Locked'],
    default: 'Draft'
  },
  
  remarks: {
    type: String,
    maxlength: [500, 'Remarks cannot exceed 500 characters'],
    trim: true
  },
  
  // Timestamps
  publishedAt: {
    type: Date
  },
  
  lockedAt: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.__v;
      return ret;
    }
  }
});

// Compound indexes for better performance
resultSchema.index({ courseId: 1, studentId: 1, academicYear: 1, semester: 1 }, { unique: true });
resultSchema.index({ studentId: 1, academicYear: 1, semester: 1 });
resultSchema.index({ courseId: 1, academicYear: 1, semester: 1 });
resultSchema.index({ facultyId: 1, academicYear: 1 });
resultSchema.index({ status: 1 });
resultSchema.index({ grade: 1 });

// Virtual for pass/fail status
resultSchema.virtual('isPassed').get(function() {
  return this.grade !== 'F' && this.grade !== 'I' && this.grade !== 'W';
});

// Virtual for percentage
resultSchema.virtual('percentage').get(function() {
  return Math.round(this.totalMarks);
});

// Static method to calculate grade based on marks
resultSchema.statics.calculateGrade = function(totalMarks) {
  if (totalMarks >= 90) return { grade: 'S', points: 10 };
  if (totalMarks >= 80) return { grade: 'A', points: 9 };
  if (totalMarks >= 70) return { grade: 'B', points: 8 };
  if (totalMarks >= 60) return { grade: 'C', points: 7 };
  if (totalMarks >= 50) return { grade: 'D', points: 6 };
  if (totalMarks >= 40) return { grade: 'E', points: 5 };
  return { grade: 'F', points: 0 };
};

// Static method to calculate CGPA for a student
resultSchema.statics.calculateCGPA = async function(studentId, academicYear = null, semester = null) {
  const filter = { studentId, status: 'Published' };
  
  if (academicYear) filter.academicYear = academicYear;
  if (semester) filter.semester = semester;
  
  const results = await this.find(filter).populate('courseId', 'credits');
  
  if (results.length === 0) {
    return {
      cgpa: 0,
      totalCredits: 0,
      totalGradePoints: 0,
      coursesCompleted: 0
    };
  }
  
  let totalGradePoints = 0;
  let totalCredits = 0;
  let coursesCompleted = 0;
  
  results.forEach(result => {
    if (result.isPassed) {
      const credits = result.courseId.credits;
      totalGradePoints += result.gradePoints * credits;
      totalCredits += credits;
      coursesCompleted++;
    }
  });
  
  const cgpa = totalCredits > 0 ? (totalGradePoints / totalCredits).toFixed(2) : 0;
  
  return {
    cgpa: parseFloat(cgpa),
    totalCredits,
    totalGradePoints,
    coursesCompleted,
    totalCourses: results.length
  };
};

// Static method to get semester results summary
resultSchema.statics.getSemesterSummary = async function(studentId, academicYear, semester) {
  const results = await this.find({
    studentId,
    academicYear,
    semester,
    status: 'Published'
  }).populate('courseId', 'courseCode courseName credits');
  
  if (results.length === 0) {
    return {
      results: [],
      summary: {
        totalCourses: 0,
        totalCredits: 0,
        sgpa: 0,
        status: 'No Results'
      }
    };
  }
  
  let totalGradePoints = 0;
  let totalCredits = 0;
  let passedCourses = 0;
  
  results.forEach(result => {
    const credits = result.courseId.credits;
    totalCredits += credits;
    
    if (result.isPassed) {
      totalGradePoints += result.gradePoints * credits;
      passedCourses++;
    }
  });
  
  const sgpa = totalCredits > 0 ? (totalGradePoints / totalCredits).toFixed(2) : 0;
  
  return {
    results: results.map(result => ({
      course: {
        id: result.courseId._id,
        code: result.courseId.courseCode,
        name: result.courseId.courseName,
        credits: result.courseId.credits
      },
      totalMarks: result.totalMarks,
      grade: result.grade,
      gradePoints: result.gradePoints,
      status: result.isPassed ? 'Pass' : 'Fail',
      assessments: result.assessments
    })),
    summary: {
      totalCourses: results.length,
      passedCourses,
      failedCourses: results.length - passedCourses,
      totalCredits,
      earnedCredits: passedCourses * (totalCredits / results.length), // Simplified calculation
      sgpa: parseFloat(sgpa),
      status: passedCourses === results.length ? 'Pass' : 'Fail'
    }
  };
};

// Static method for bulk marks upload
resultSchema.statics.bulkUploadMarks = async function(uploadData) {
  const { courseId, facultyId, academicYear, semester, results } = uploadData;
  
  const bulkOps = results.map(result => ({
    updateOne: {
      filter: {
        courseId,
        studentId: result.studentId,
        academicYear,
        semester
      },
      update: {
        $set: {
          courseId,
          studentId: result.studentId,
          facultyId,
          academicYear,
          semester,
          assessments: result.assessments,
          remarks: result.remarks || '',
          status: 'Draft'
        }
      },
      upsert: true
    }
  }));
  
  const bulkResult = await this.bulkWrite(bulkOps);
  
  // Calculate grades for all updated results
  const updatedResults = await this.find({
    courseId,
    academicYear,
    semester,
    studentId: { $in: results.map(r => r.studentId) }
  });
  
  // Update each result with calculated totals and grades
  for (const result of updatedResults) {
    await result.calculateTotalAndGrade();
  }
  
  return bulkResult;
};

// Instance method to calculate total marks and grade
resultSchema.methods.calculateTotalAndGrade = async function() {
  const assessments = this.assessments;
  
  // Calculate weighted total
  let totalMarks = 0;
  
  // Internal assessments
  const midtermScore = (assessments.internal.midterm.obtainedMarks / assessments.internal.midterm.maxMarks) * assessments.internal.midterm.weightage;
  const assignmentScore = (assessments.internal.assignments.obtainedMarks / assessments.internal.assignments.maxMarks) * assessments.internal.assignments.weightage;
  const quizScore = (assessments.internal.quiz.obtainedMarks / assessments.internal.quiz.maxMarks) * assessments.internal.quiz.weightage;
  
  // External assessment
  const endtermScore = (assessments.external.endterm.obtainedMarks / assessments.external.endterm.maxMarks) * assessments.external.endterm.weightage;
  
  totalMarks = midtermScore + assignmentScore + quizScore + endtermScore;
  
  // Handle NaN values
  if (isNaN(totalMarks)) totalMarks = 0;
  
  // Calculate grade
  const gradeInfo = this.constructor.calculateGrade(totalMarks);
  
  // Update the document
  this.totalMarks = Math.round(totalMarks * 100) / 100; // Round to 2 decimal places
  this.grade = gradeInfo.grade;
  this.gradePoints = gradeInfo.points;
  
  return this.save();
};

// Instance method to publish result
resultSchema.methods.publishResult = async function() {
  if (this.status === 'Locked') {
    throw new Error('Cannot publish a locked result');
  }
  
  this.status = 'Published';
  this.publishedAt = new Date();
  
  return this.save();
};

// Instance method to lock result
resultSchema.methods.lockResult = async function() {
  if (this.status !== 'Published') {
    throw new Error('Can only lock published results');
  }
  
  this.status = 'Locked';
  this.lockedAt = new Date();
  
  return this.save();
};

// Pre-save middleware to validate marks
resultSchema.pre('save', function(next) {
  const assessments = this.assessments;
  
  // Validate internal assessments
  if (assessments.internal.midterm.obtainedMarks > assessments.internal.midterm.maxMarks) {
    return next(new Error('Midterm obtained marks cannot exceed maximum marks'));
  }
  
  if (assessments.internal.assignments.obtainedMarks > assessments.internal.assignments.maxMarks) {
    return next(new Error('Assignment obtained marks cannot exceed maximum marks'));
  }
  
  if (assessments.internal.quiz.obtainedMarks > assessments.internal.quiz.maxMarks) {
    return next(new Error('Quiz obtained marks cannot exceed maximum marks'));
  }
  
  // Validate external assessment
  if (assessments.external.endterm.obtainedMarks > assessments.external.endterm.maxMarks) {
    return next(new Error('Endterm obtained marks cannot exceed maximum marks'));
  }
  
  next();
});

// Pre-save middleware to validate references
resultSchema.pre('save', async function(next) {
  try {
    const SimpleUser = mongoose.model('SimpleUser');
    const SimpleCourse = mongoose.model('SimpleCourse');
    
    // Validate course exists
    const course = await SimpleCourse.findById(this.courseId);
    if (!course) {
      return next(new Error('Course not found'));
    }
    
    // Validate student exists and is a student
    const student = await SimpleUser.findById(this.studentId);
    if (!student) {
      return next(new Error('Student not found'));
    }
    if (student.role !== 'student') {
      return next(new Error('Referenced user is not a student'));
    }
    
    // Validate faculty exists and is faculty/admin
    const faculty = await SimpleUser.findById(this.facultyId);
    if (!faculty) {
      return next(new Error('Faculty not found'));
    }
    if (!['faculty', 'admin'].includes(faculty.role)) {
      return next(new Error('Referenced user is not faculty or admin'));
    }
    
    // Validate student is enrolled in the course
    if (!course.studentsEnrolled.includes(this.studentId)) {
      return next(new Error('Student is not enrolled in this course'));
    }
    
    // Validate faculty is assigned to the course (admin can upload for any course)
    if (course.facultyId.toString() !== this.facultyId.toString() && faculty.role !== 'admin') {
      return next(new Error('Faculty is not assigned to this course'));
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model('SimpleResult', resultSchema);