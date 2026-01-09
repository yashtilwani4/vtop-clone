const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
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
  
  // Faculty who marked attendance
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
  
  // Date of the class
  date: {
    type: Date,
    required: [true, 'Date is required'],
    validate: {
      validator: function(v) {
        // Date should not be in the future
        return v <= new Date();
      },
      message: 'Date cannot be in the future'
    }
  },
  
  // Attendance status
  status: {
    type: String,
    required: [true, 'Attendance status is required'],
    enum: {
      values: ['Present', 'Absent', 'Late'],
      message: 'Status must be Present, Absent, or Late'
    }
  },
  
  // Class session details
  session: {
    startTime: {
      type: String,
      required: [true, 'Start time is required'],
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Start time must be in HH:MM format']
    },
    endTime: {
      type: String,
      required: [true, 'End time is required'],
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'End time must be in HH:MM format']
    },
    type: {
      type: String,
      enum: ['Lecture', 'Lab', 'Tutorial', 'Seminar'],
      default: 'Lecture'
    }
  },
  
  // Optional remarks
  remarks: {
    type: String,
    maxlength: [500, 'Remarks cannot exceed 500 characters'],
    trim: true
  },
  
  // Marked timestamp
  markedAt: {
    type: Date,
    default: Date.now
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
attendanceSchema.index({ courseId: 1, studentId: 1, date: 1 }, { unique: true }); // Prevent duplicate attendance for same day
attendanceSchema.index({ courseId: 1, date: -1 }); // For course attendance queries
attendanceSchema.index({ studentId: 1, date: -1 }); // For student attendance queries
attendanceSchema.index({ facultyId: 1, date: -1 }); // For faculty queries
attendanceSchema.index({ status: 1 }); // For status filtering

// Virtual for formatted date
attendanceSchema.virtual('formattedDate').get(function() {
  return this.date.toISOString().split('T')[0]; // YYYY-MM-DD format
});

// Virtual for session duration in minutes
attendanceSchema.virtual('sessionDuration').get(function() {
  const start = this.session.startTime.split(':');
  const end = this.session.endTime.split(':');
  const startMinutes = parseInt(start[0]) * 60 + parseInt(start[1]);
  const endMinutes = parseInt(end[0]) * 60 + parseInt(end[1]);
  return endMinutes - startMinutes;
});

// Static method to calculate attendance percentage for a student in a course
attendanceSchema.statics.calculatePercentage = async function(studentId, courseId, startDate = null, endDate = null) {
  const filter = { studentId, courseId };
  
  // Add date range filter if provided
  if (startDate || endDate) {
    filter.date = {};
    if (startDate) filter.date.$gte = new Date(startDate);
    if (endDate) filter.date.$lte = new Date(endDate);
  }
  
  const totalClasses = await this.countDocuments(filter);
  
  if (totalClasses === 0) {
    return {
      totalClasses: 0,
      attendedClasses: 0,
      percentage: 0,
      status: 'No classes'
    };
  }
  
  const attendedClasses = await this.countDocuments({
    ...filter,
    status: { $in: ['Present', 'Late'] }
  });
  
  const percentage = Math.round((attendedClasses / totalClasses) * 100);
  
  // Determine status based on percentage
  let status = 'Good';
  if (percentage < 75) status = 'Critical';
  else if (percentage < 85) status = 'Warning';
  
  return {
    totalClasses,
    attendedClasses,
    absentClasses: totalClasses - attendedClasses,
    percentage,
    status
  };
};

// Static method to get attendance summary for a student
attendanceSchema.statics.getStudentSummary = async function(studentId, startDate = null, endDate = null) {
  const matchFilter = { studentId };
  
  // Add date range filter if provided
  if (startDate || endDate) {
    matchFilter.date = {};
    if (startDate) matchFilter.date.$gte = new Date(startDate);
    if (endDate) matchFilter.date.$lte = new Date(endDate);
  }
  
  const summary = await this.aggregate([
    { $match: matchFilter },
    {
      $lookup: {
        from: 'simplecourses',
        localField: 'courseId',
        foreignField: '_id',
        as: 'course'
      }
    },
    { $unwind: '$course' },
    {
      $group: {
        _id: '$courseId',
        courseCode: { $first: '$course.courseCode' },
        courseName: { $first: '$course.courseName' },
        totalClasses: { $sum: 1 },
        attendedClasses: {
          $sum: {
            $cond: [
              { $in: ['$status', ['Present', 'Late']] },
              1,
              0
            ]
          }
        },
        absentClasses: {
          $sum: {
            $cond: [
              { $eq: ['$status', 'Absent'] },
              1,
              0
            ]
          }
        },
        lateClasses: {
          $sum: {
            $cond: [
              { $eq: ['$status', 'Late'] },
              1,
              0
            ]
          }
        }
      }
    },
    {
      $addFields: {
        percentage: {
          $round: [
            {
              $multiply: [
                { $divide: ['$attendedClasses', '$totalClasses'] },
                100
              ]
            },
            0
          ]
        }
      }
    },
    {
      $addFields: {
        status: {
          $switch: {
            branches: [
              { case: { $lt: ['$percentage', 75] }, then: 'Critical' },
              { case: { $lt: ['$percentage', 85] }, then: 'Warning' },
              { case: { $gte: ['$percentage', 85] }, then: 'Good' }
            ],
            default: 'Unknown'
          }
        }
      }
    },
    { $sort: { courseCode: 1 } }
  ]);
  
  return summary;
};

// Static method to get course attendance overview for faculty
attendanceSchema.statics.getCourseOverview = async function(courseId, date = null) {
  const matchFilter = { courseId };
  
  if (date) {
    const targetDate = new Date(date);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);
    
    matchFilter.date = {
      $gte: targetDate,
      $lt: nextDay
    };
  }
  
  const overview = await this.aggregate([
    { $match: matchFilter },
    {
      $lookup: {
        from: 'simpleusers',
        localField: 'studentId',
        foreignField: '_id',
        as: 'student'
      }
    },
    { $unwind: '$student' },
    {
      $group: {
        _id: date ? '$studentId' : '$status',
        ...(date ? {
          studentName: { $first: '$student.name' },
          registrationNumber: { $first: '$student.registrationNumber' },
          status: { $first: '$status' },
          session: { $first: '$session' },
          remarks: { $first: '$remarks' }
        } : {
          count: { $sum: 1 }
        })
      }
    },
    { $sort: date ? { registrationNumber: 1 } : { _id: 1 } }
  ]);
  
  return overview;
};

// Static method to mark bulk attendance
attendanceSchema.statics.markBulkAttendance = async function(attendanceData) {
  const { courseId, facultyId, date, session, attendanceList } = attendanceData;
  
  const bulkOps = attendanceList.map(record => ({
    updateOne: {
      filter: {
        courseId,
        studentId: record.studentId,
        date: new Date(date)
      },
      update: {
        $set: {
          courseId,
          studentId: record.studentId,
          facultyId,
          date: new Date(date),
          status: record.status,
          session,
          remarks: record.remarks || '',
          markedAt: new Date()
        }
      },
      upsert: true
    }
  }));
  
  const result = await this.bulkWrite(bulkOps);
  return result;
};

// Pre-save middleware to validate references
attendanceSchema.pre('save', async function(next) {
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
    
    // Validate faculty is assigned to the course
    if (course.facultyId.toString() !== this.facultyId.toString() && faculty.role !== 'admin') {
      return next(new Error('Faculty is not assigned to this course'));
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

// Pre-save middleware to validate session times
attendanceSchema.pre('save', function(next) {
  const start = this.session.startTime.split(':');
  const end = this.session.endTime.split(':');
  const startMinutes = parseInt(start[0]) * 60 + parseInt(start[1]);
  const endMinutes = parseInt(end[0]) * 60 + parseInt(end[1]);
  
  if (endMinutes <= startMinutes) {
    return next(new Error('End time must be after start time'));
  }
  
  next();
});

module.exports = mongoose.model('SimpleAttendance', attendanceSchema);