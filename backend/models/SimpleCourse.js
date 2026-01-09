const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  // Course code field
  courseCode: {
    type: String,
    required: [true, 'Course code is required'],
    unique: true,
    uppercase: true,
    trim: true,
    minlength: [3, 'Course code must be at least 3 characters long'],
    maxlength: [10, 'Course code cannot exceed 10 characters'],
    match: [
      /^[A-Z0-9]+$/,
      'Course code must contain only uppercase letters and numbers'
    ]
  },
  
  // Course name field
  courseName: {
    type: String,
    required: [true, 'Course name is required'],
    trim: true,
    minlength: [5, 'Course name must be at least 5 characters long'],
    maxlength: [200, 'Course name cannot exceed 200 characters']
  },
  
  // Credits field
  credits: {
    type: Number,
    required: [true, 'Credits are required'],
    min: [1, 'Credits must be at least 1'],
    max: [6, 'Credits cannot exceed 6'],
    validate: {
      validator: Number.isInteger,
      message: 'Credits must be a whole number'
    }
  },
  
  // Faculty ID field (reference to User)
  facultyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SimpleUser', // Reference to the SimpleUser model
    required: [true, 'Faculty ID is required'],
    validate: {
      validator: function(v) {
        return mongoose.Types.ObjectId.isValid(v);
      },
      message: 'Faculty ID must be a valid ObjectId'
    }
  },
  
  // Students enrolled field (array of User references)
  studentsEnrolled: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SimpleUser', // Reference to the SimpleUser model
    validate: {
      validator: function(v) {
        return mongoose.Types.ObjectId.isValid(v);
      },
      message: 'Student ID must be a valid ObjectId'
    }
  }]
}, {
  // Enable automatic timestamps
  timestamps: true, // This adds createdAt and updatedAt automatically
  
  // JSON transform to clean up output
  toJSON: {
    transform: function(doc, ret) {
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes for better performance (removed duplicate since unique: true creates index)
courseSchema.index({ facultyId: 1 }); // For finding courses by faculty
courseSchema.index({ studentsEnrolled: 1 }); // For finding courses by student
courseSchema.index({ credits: 1 }); // For filtering by credits
courseSchema.index({ createdAt: -1 }); // For sorting by creation date

// Virtual for getting enrollment count
courseSchema.virtual('enrollmentCount').get(function() {
  return this.studentsEnrolled ? this.studentsEnrolled.length : 0;
});

// Virtual for checking if course is full (assuming max 60 students)
courseSchema.virtual('isFull').get(function() {
  const maxStudents = 60; // Default max capacity
  return this.enrollmentCount >= maxStudents;
});

// Instance method to enroll a student
courseSchema.methods.enrollStudent = function(studentId) {
  if (!this.studentsEnrolled.includes(studentId)) {
    this.studentsEnrolled.push(studentId);
    return this.save();
  }
  throw new Error('Student is already enrolled in this course');
};

// Instance method to unenroll a student
courseSchema.methods.unenrollStudent = function(studentId) {
  const index = this.studentsEnrolled.indexOf(studentId);
  if (index > -1) {
    this.studentsEnrolled.splice(index, 1);
    return this.save();
  }
  throw new Error('Student is not enrolled in this course');
};

// Instance method to check if student is enrolled
courseSchema.methods.isStudentEnrolled = function(studentId) {
  return this.studentsEnrolled.includes(studentId);
};

// Static method to find courses by faculty
courseSchema.statics.findByFaculty = function(facultyId) {
  return this.find({ facultyId })
    .populate('facultyId', 'name email role')
    .populate('studentsEnrolled', 'name email registrationNumber');
};

// Static method to find courses by student
courseSchema.statics.findByStudent = function(studentId) {
  return this.find({ studentsEnrolled: studentId })
    .populate('facultyId', 'name email role')
    .populate('studentsEnrolled', 'name email registrationNumber');
};

// Static method to find courses by credits
courseSchema.statics.findByCredits = function(credits) {
  return this.find({ credits })
    .populate('facultyId', 'name email role');
};

// Static method to get course statistics
courseSchema.statics.getStatistics = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        totalCourses: { $sum: 1 },
        totalCredits: { $sum: '$credits' },
        averageCredits: { $avg: '$credits' },
        totalEnrollments: { $sum: { $size: '$studentsEnrolled' } },
        averageEnrollment: { $avg: { $size: '$studentsEnrolled' } }
      }
    }
  ]);
  
  const creditDistribution = await this.aggregate([
    {
      $group: {
        _id: '$credits',
        count: { $sum: 1 }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]);
  
  return {
    overview: stats[0] || {
      totalCourses: 0,
      totalCredits: 0,
      averageCredits: 0,
      totalEnrollments: 0,
      averageEnrollment: 0
    },
    creditDistribution
  };
};

// Pre-save middleware to validate faculty role
courseSchema.pre('save', async function(next) {
  if (this.isModified('facultyId')) {
    try {
      const SimpleUser = mongoose.model('SimpleUser');
      const faculty = await SimpleUser.findById(this.facultyId);
      
      if (!faculty) {
        return next(new Error('Faculty not found'));
      }
      
      if (faculty.role !== 'faculty' && faculty.role !== 'admin') {
        return next(new Error('Only faculty or admin users can be assigned to courses'));
      }
      
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

// Pre-save middleware to validate students
courseSchema.pre('save', async function(next) {
  if (this.isModified('studentsEnrolled')) {
    try {
      const SimpleUser = mongoose.model('SimpleUser');
      
      // Check if all enrolled users are students
      for (const studentId of this.studentsEnrolled) {
        const student = await SimpleUser.findById(studentId);
        if (!student) {
          return next(new Error(`Student with ID ${studentId} not found`));
        }
        if (student.role !== 'student') {
          return next(new Error(`User ${student.name} is not a student`));
        }
      }
      
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

// Post-save middleware to update user's enrolled courses
courseSchema.post('save', async function(doc) {
  try {
    const SimpleUser = mongoose.model('SimpleUser');
    
    // This is a simplified approach - in production, you might want to handle this differently
    // to avoid circular updates and improve performance
    
    // Update faculty's assigned courses (if SimpleUser has this field)
    await SimpleUser.findByIdAndUpdate(
      doc.facultyId,
      { $addToSet: { assignedCourses: doc._id } }
    ).catch(() => {}); // Ignore errors if field doesn't exist
    
    // Update students' enrolled courses (if SimpleUser has this field)
    for (const studentId of doc.studentsEnrolled) {
      await SimpleUser.findByIdAndUpdate(
        studentId,
        { $addToSet: { enrolledCourses: doc._id } }
      ).catch(() => {}); // Ignore errors if field doesn't exist
    }
  } catch (error) {
    console.error('Error updating user course references:', error);
  }
});

// Export the model
module.exports = mongoose.model('SimpleCourse', courseSchema);