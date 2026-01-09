const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  faculty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  session: {
    startTime: {
      type: String,
      required: true // Format: "09:00"
    },
    endTime: {
      type: String,
      required: true // Format: "10:00"
    },
    type: {
      type: String,
      enum: ['Lecture', 'Lab', 'Tutorial'],
      default: 'Lecture'
    },
    topic: {
      type: String,
      trim: true
    }
  },
  
  // Attendance Records
  attendanceRecords: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    status: {
      type: String,
      enum: ['Present', 'Absent', 'Late'],
      required: true
    },
    markedAt: {
      type: Date,
      default: Date.now
    },
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    remarks: {
      type: String,
      trim: true
    }
  }],
  
  // Session Status
  isCompleted: {
    type: Boolean,
    default: false
  },
  totalStudents: {
    type: Number,
    required: true
  },
  presentCount: {
    type: Number,
    default: 0
  },
  absentCount: {
    type: Number,
    default: 0
  },
  lateCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes
attendanceSchema.index({ course: 1, date: 1 });
attendanceSchema.index({ faculty: 1, date: 1 });
attendanceSchema.index({ 'attendanceRecords.student': 1 });

// Pre-save middleware to calculate counts
attendanceSchema.pre('save', function(next) {
  this.presentCount = this.attendanceRecords.filter(record => record.status === 'Present').length;
  this.absentCount = this.attendanceRecords.filter(record => record.status === 'Absent').length;
  this.lateCount = this.attendanceRecords.filter(record => record.status === 'Late').length;
  next();
});

// Virtual for attendance percentage
attendanceSchema.virtual('attendancePercentage').get(function() {
  if (this.totalStudents === 0) return 0;
  return Math.round((this.presentCount / this.totalStudents) * 100);
});

// Method to mark attendance for a student
attendanceSchema.methods.markAttendance = function(studentId, status, markedBy, remarks = '') {
  const existingRecord = this.attendanceRecords.find(
    record => record.student.toString() === studentId.toString()
  );
  
  if (existingRecord) {
    existingRecord.status = status;
    existingRecord.markedAt = new Date();
    existingRecord.markedBy = markedBy;
    existingRecord.remarks = remarks;
  } else {
    this.attendanceRecords.push({
      student: studentId,
      status,
      markedBy,
      remarks,
      markedAt: new Date()
    });
  }
  
  return this.save();
};

// Static method to get student attendance summary
attendanceSchema.statics.getStudentAttendanceSummary = async function(studentId, courseId = null) {
  const matchStage = {
    'attendanceRecords.student': new mongoose.Types.ObjectId(studentId)
  };
  
  if (courseId) {
    matchStage.course = new mongoose.Types.ObjectId(courseId);
  }
  
  const pipeline = [
    { $match: matchStage },
    { $unwind: '$attendanceRecords' },
    { $match: { 'attendanceRecords.student': new mongoose.Types.ObjectId(studentId) } },
    {
      $group: {
        _id: '$course',
        totalClasses: { $sum: 1 },
        presentClasses: {
          $sum: {
            $cond: [
              { $eq: ['$attendanceRecords.status', 'Present'] },
              1,
              0
            ]
          }
        },
        lateClasses: {
          $sum: {
            $cond: [
              { $eq: ['$attendanceRecords.status', 'Late'] },
              1,
              0
            ]
          }
        }
      }
    },
    {
      $addFields: {
        attendancePercentage: {
          $round: [
            {
              $multiply: [
                { $divide: ['$presentClasses', '$totalClasses'] },
                100
              ]
            },
            2
          ]
        }
      }
    },
    {
      $lookup: {
        from: 'courses',
        localField: '_id',
        foreignField: '_id',
        as: 'courseDetails'
      }
    },
    { $unwind: '$courseDetails' }
  ];
  
  return await this.aggregate(pipeline);
};

// Static method to get course attendance statistics
attendanceSchema.statics.getCourseAttendanceStats = async function(courseId, startDate = null, endDate = null) {
  const matchStage = { course: new mongoose.Types.ObjectId(courseId) };
  
  if (startDate && endDate) {
    matchStage.date = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }
  
  const pipeline = [
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalSessions: { $sum: 1 },
        averageAttendance: { $avg: '$attendancePercentage' },
        totalPresent: { $sum: '$presentCount' },
        totalAbsent: { $sum: '$absentCount' },
        totalLate: { $sum: '$lateCount' }
      }
    }
  ];
  
  return await this.aggregate(pipeline);
};

module.exports = mongoose.model('Attendance', attendanceSchema);