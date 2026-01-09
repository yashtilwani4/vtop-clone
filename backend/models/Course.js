const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  courseCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  courseName: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  credits: {
    type: Number,
    required: true,
    min: 1,
    max: 6
  },
  department: {
    type: String,
    required: true
  },
  semester: {
    type: Number,
    required: true,
    min: 1,
    max: 8
  },
  program: {
    type: String,
    required: true // e.g., "B.Tech", "M.Tech"
  },
  courseType: {
    type: String,
    enum: ['Core', 'Elective', 'Lab', 'Project'],
    required: true
  },
  
  // Faculty Information
  faculty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Course Schedule
  schedule: [{
    day: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      required: true
    },
    startTime: {
      type: String,
      required: true // Format: "09:00"
    },
    endTime: {
      type: String,
      required: true // Format: "10:00"
    },
    room: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['Lecture', 'Lab', 'Tutorial'],
      default: 'Lecture'
    }
  }],
  
  // Enrollment Information
  maxStudents: {
    type: Number,
    default: 60
  },
  enrolledStudents: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    enrollmentDate: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['Enrolled', 'Dropped', 'Completed'],
      default: 'Enrolled'
    }
  }],
  
  // Course Status
  isActive: {
    type: Boolean,
    default: true
  },
  academicYear: {
    type: String,
    required: true // e.g., "2023-24"
  },
  
  // Prerequisites
  prerequisites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  }],
  
  // Assessment Structure
  assessmentStructure: {
    midterm: {
      type: Number,
      default: 30 // percentage
    },
    endterm: {
      type: Number,
      default: 50 // percentage
    },
    assignments: {
      type: Number,
      default: 10 // percentage
    },
    attendance: {
      type: Number,
      default: 10 // percentage
    }
  }
}, {
  timestamps: true
});

// Indexes
courseSchema.index({ courseCode: 1 });
courseSchema.index({ department: 1, semester: 1 });
courseSchema.index({ faculty: 1 });
courseSchema.index({ academicYear: 1 });

// Virtual for enrolled count
courseSchema.virtual('enrolledCount').get(function() {
  return this.enrolledStudents.filter(enrollment => 
    enrollment.status === 'Enrolled'
  ).length;
});

// Virtual for available seats
courseSchema.virtual('availableSeats').get(function() {
  return this.maxStudents - this.enrolledCount;
});

// Method to check if student can enroll
courseSchema.methods.canEnroll = function(studentId) {
  const isAlreadyEnrolled = this.enrolledStudents.some(
    enrollment => enrollment.student.toString() === studentId.toString() && 
    enrollment.status === 'Enrolled'
  );
  
  return !isAlreadyEnrolled && this.availableSeats > 0 && this.isActive;
};

// Method to enroll student
courseSchema.methods.enrollStudent = function(studentId) {
  if (!this.canEnroll(studentId)) {
    throw new Error('Cannot enroll student in this course');
  }
  
  this.enrolledStudents.push({
    student: studentId,
    enrollmentDate: new Date(),
    status: 'Enrolled'
  });
  
  return this.save();
};

// Method to drop student
courseSchema.methods.dropStudent = function(studentId) {
  const enrollment = this.enrolledStudents.find(
    enrollment => enrollment.student.toString() === studentId.toString()
  );
  
  if (enrollment) {
    enrollment.status = 'Dropped';
    return this.save();
  }
  
  throw new Error('Student not found in course enrollment');
};

module.exports = mongoose.model('Course', courseSchema);