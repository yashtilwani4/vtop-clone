const mongoose = require('mongoose');

const timetableSchema = new mongoose.Schema({
  // Basic Information
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
  department: {
    type: String,
    required: true
  },
  program: {
    type: String,
    required: true // e.g., "B.Tech", "M.Tech"
  },
  section: {
    type: String,
    default: 'A' // A, B, C, etc.
  },
  
  // Timetable Structure
  schedule: [{
    day: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      required: true
    },
    periods: [{
      periodNumber: {
        type: Number,
        required: true,
        min: 1,
        max: 10
      },
      startTime: {
        type: String,
        required: true // Format: "09:00"
      },
      endTime: {
        type: String,
        required: true // Format: "10:00"
      },
      course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course'
      },
      faculty: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      room: {
        type: String,
        required: true
      },
      type: {
        type: String,
        enum: ['Lecture', 'Lab', 'Tutorial', 'Break', 'Free'],
        default: 'Lecture'
      },
      isBreak: {
        type: Boolean,
        default: false
      }
    }]
  }],
  
  // Metadata
  isActive: {
    type: Boolean,
    default: true
  },
  effectiveFrom: {
    type: Date,
    required: true
  },
  effectiveTo: {
    type: Date
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Special Schedules
  examSchedule: [{
    date: {
      type: Date,
      required: true
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true
    },
    examType: {
      type: String,
      enum: ['Midterm', 'Endterm', 'Supplementary', 'Assignment'],
      required: true
    },
    startTime: {
      type: String,
      required: true
    },
    endTime: {
      type: String,
      required: true
    },
    room: {
      type: String,
      required: true
    },
    instructions: {
      type: String,
      trim: true
    }
  }],
  
  // Holidays and Events
  holidays: [{
    date: {
      type: Date,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['National Holiday', 'Festival', 'University Holiday', 'Exam Break'],
      default: 'University Holiday'
    }
  }]
}, {
  timestamps: true
});

// Indexes
timetableSchema.index({ 
  academicYear: 1, 
  semester: 1, 
  department: 1, 
  program: 1, 
  section: 1 
}, { unique: true });

timetableSchema.index({ effectiveFrom: 1, effectiveTo: 1 });
timetableSchema.index({ 'schedule.periods.course': 1 });
timetableSchema.index({ 'schedule.periods.faculty': 1 });

// Method to get day schedule
timetableSchema.methods.getDaySchedule = function(day) {
  const daySchedule = this.schedule.find(s => s.day === day);
  return daySchedule ? daySchedule.periods.sort((a, b) => a.periodNumber - b.periodNumber) : [];
};

// Method to get current period
timetableSchema.methods.getCurrentPeriod = function(day, currentTime) {
  const daySchedule = this.getDaySchedule(day);
  const now = new Date(`2000-01-01 ${currentTime}`);
  
  return daySchedule.find(period => {
    const start = new Date(`2000-01-01 ${period.startTime}`);
    const end = new Date(`2000-01-01 ${period.endTime}`);
    return now >= start && now <= end;
  });
};

// Method to get next period
timetableSchema.methods.getNextPeriod = function(day, currentTime) {
  const daySchedule = this.getDaySchedule(day);
  const now = new Date(`2000-01-01 ${currentTime}`);
  
  return daySchedule.find(period => {
    const start = new Date(`2000-01-01 ${period.startTime}`);
    return now < start;
  });
};

// Static method to get faculty timetable
timetableSchema.statics.getFacultyTimetable = async function(facultyId, academicYear, semester) {
  const pipeline = [
    {
      $match: {
        academicYear,
        semester,
        isActive: true,
        'schedule.periods.faculty': new mongoose.Types.ObjectId(facultyId)
      }
    },
    { $unwind: '$schedule' },
    { $unwind: '$schedule.periods' },
    {
      $match: {
        'schedule.periods.faculty': new mongoose.Types.ObjectId(facultyId),
        'schedule.periods.isBreak': { $ne: true }
      }
    },
    {
      $lookup: {
        from: 'courses',
        localField: 'schedule.periods.course',
        foreignField: '_id',
        as: 'courseDetails'
      }
    },
    { $unwind: '$courseDetails' },
    {
      $group: {
        _id: '$schedule.day',
        periods: {
          $push: {
            periodNumber: '$schedule.periods.periodNumber',
            startTime: '$schedule.periods.startTime',
            endTime: '$schedule.periods.endTime',
            course: '$courseDetails',
            room: '$schedule.periods.room',
            type: '$schedule.periods.type',
            department: '$department',
            program: '$program',
            section: '$section'
          }
        }
      }
    },
    {
      $sort: { '_id': 1 }
    }
  ];
  
  return await this.aggregate(pipeline);
};

// Static method to get room schedule
timetableSchema.statics.getRoomSchedule = async function(room, academicYear, semester) {
  const pipeline = [
    {
      $match: {
        academicYear,
        semester,
        isActive: true,
        'schedule.periods.room': room
      }
    },
    { $unwind: '$schedule' },
    { $unwind: '$schedule.periods' },
    {
      $match: {
        'schedule.periods.room': room,
        'schedule.periods.isBreak': { $ne: true }
      }
    },
    {
      $lookup: {
        from: 'courses',
        localField: 'schedule.periods.course',
        foreignField: '_id',
        as: 'courseDetails'
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'schedule.periods.faculty',
        foreignField: '_id',
        as: 'facultyDetails'
      }
    },
    { $unwind: { path: '$courseDetails', preserveNullAndEmptyArrays: true } },
    { $unwind: { path: '$facultyDetails', preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: '$schedule.day',
        periods: {
          $push: {
            periodNumber: '$schedule.periods.periodNumber',
            startTime: '$schedule.periods.startTime',
            endTime: '$schedule.periods.endTime',
            course: '$courseDetails',
            faculty: '$facultyDetails',
            type: '$schedule.periods.type',
            department: '$department',
            program: '$program',
            section: '$section'
          }
        }
      }
    },
    { $sort: { '_id': 1 } }
  ];
  
  return await this.aggregate(pipeline);
};

// Method to check for conflicts
timetableSchema.methods.checkConflicts = function() {
  const conflicts = [];
  
  this.schedule.forEach(daySchedule => {
    const periods = daySchedule.periods.filter(p => !p.isBreak);
    
    // Check for time overlaps
    for (let i = 0; i < periods.length; i++) {
      for (let j = i + 1; j < periods.length; j++) {
        const period1 = periods[i];
        const period2 = periods[j];
        
        const start1 = new Date(`2000-01-01 ${period1.startTime}`);
        const end1 = new Date(`2000-01-01 ${period1.endTime}`);
        const start2 = new Date(`2000-01-01 ${period2.startTime}`);
        const end2 = new Date(`2000-01-01 ${period2.endTime}`);
        
        // Check for overlap
        if ((start1 < end2 && end1 > start2)) {
          conflicts.push({
            day: daySchedule.day,
            type: 'Time Overlap',
            periods: [period1, period2]
          });
        }
        
        // Check for room conflicts
        if (period1.room === period2.room && (start1 < end2 && end1 > start2)) {
          conflicts.push({
            day: daySchedule.day,
            type: 'Room Conflict',
            room: period1.room,
            periods: [period1, period2]
          });
        }
      }
    }
  });
  
  return conflicts;
};

module.exports = mongoose.model('Timetable', timetableSchema);