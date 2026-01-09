const mongoose = require('mongoose');

const simpleTimetableSchema = new mongoose.Schema({
  // Academic Information
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
  
  // Class Information
  department: {
    type: String,
    required: [true, 'Department is required'],
    trim: true,
    uppercase: true
  },
  
  program: {
    type: String,
    required: [true, 'Program is required'],
    enum: ['B.Tech', 'M.Tech', 'B.Sc', 'M.Sc', 'BCA', 'MCA', 'MBA'],
    default: 'B.Tech'
  },
  
  section: {
    type: String,
    required: [true, 'Section is required'],
    trim: true,
    uppercase: true,
    default: 'A'
  },
  
  // Weekly Schedule
  weeklySchedule: [{
    day: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      required: [true, 'Day is required']
    },
    
    slots: [{
      slotNumber: {
        type: Number,
        required: [true, 'Slot number is required'],
        min: [1, 'Slot number must be at least 1'],
        max: [12, 'Slot number cannot exceed 12']
      },
      
      startTime: {
        type: String,
        required: [true, 'Start time is required'],
        match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Start time must be in HH:MM format']
      },
      
      endTime: {
        type: String,
        required: [true, 'End time is required'],
        match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'End time must be in HH:MM format']
      },
      
      courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SimpleCourse',
        validate: {
          validator: function(v) {
            return !v || mongoose.Types.ObjectId.isValid(v);
          },
          message: 'Course ID must be a valid ObjectId'
        }
      },
      
      facultyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SimpleUser',
        validate: {
          validator: function(v) {
            return !v || mongoose.Types.ObjectId.isValid(v);
          },
          message: 'Faculty ID must be a valid ObjectId'
        }
      },
      
      room: {
        type: String,
        required: [true, 'Room is required'],
        trim: true,
        uppercase: true
      },
      
      slotType: {
        type: String,
        enum: ['Lecture', 'Lab', 'Tutorial', 'Practical', 'Break', 'Lunch', 'Free'],
        default: 'Lecture'
      },
      
      isBreak: {
        type: Boolean,
        default: false
      },
      
      duration: {
        type: Number, // Duration in minutes
        default: 60
      }
    }]
  }],
  
  // Status and Metadata
  status: {
    type: String,
    enum: ['Draft', 'Active', 'Inactive', 'Archived'],
    default: 'Draft'
  },
  
  effectiveFrom: {
    type: Date,
    required: [true, 'Effective from date is required']
  },
  
  effectiveTo: {
    type: Date,
    validate: {
      validator: function(v) {
        return !v || v > this.effectiveFrom;
      },
      message: 'Effective to date must be after effective from date'
    }
  },
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SimpleUser',
    required: [true, 'Created by is required']
  },
  
  // Additional Information
  totalHours: {
    type: Number,
    default: 0
  },
  
  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot exceed 1000 characters'],
    trim: true
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
simpleTimetableSchema.index({ 
  academicYear: 1, 
  semester: 1, 
  department: 1, 
  program: 1, 
  section: 1 
}, { unique: true });

simpleTimetableSchema.index({ status: 1, effectiveFrom: 1 });
simpleTimetableSchema.index({ 'weeklySchedule.slots.facultyId': 1 });
simpleTimetableSchema.index({ 'weeklySchedule.slots.courseId': 1 });
simpleTimetableSchema.index({ createdBy: 1 });

// Virtual for active status
simpleTimetableSchema.virtual('isActive').get(function() {
  const now = new Date();
  return this.status === 'Active' && 
         this.effectiveFrom <= now && 
         (!this.effectiveTo || this.effectiveTo >= now);
});

// Virtual for total weekly hours
simpleTimetableSchema.virtual('weeklyHours').get(function() {
  let totalHours = 0;
  this.weeklySchedule.forEach(day => {
    day.slots.forEach(slot => {
      if (!slot.isBreak && slot.slotType !== 'Free') {
        totalHours += slot.duration || 60;
      }
    });
  });
  return Math.round(totalHours / 60 * 100) / 100; // Convert to hours with 2 decimal places
});

// Instance method to get day schedule
simpleTimetableSchema.methods.getDaySchedule = function(day) {
  const daySchedule = this.weeklySchedule.find(d => d.day === day);
  return daySchedule ? daySchedule.slots.sort((a, b) => a.slotNumber - b.slotNumber) : [];
};

// Instance method to get current slot
simpleTimetableSchema.methods.getCurrentSlot = function(day, currentTime) {
  const daySchedule = this.getDaySchedule(day);
  const now = new Date(`2000-01-01 ${currentTime}`);
  
  return daySchedule.find(slot => {
    const start = new Date(`2000-01-01 ${slot.startTime}`);
    const end = new Date(`2000-01-01 ${slot.endTime}`);
    return now >= start && now <= end;
  });
};

// Instance method to get next slot
simpleTimetableSchema.methods.getNextSlot = function(day, currentTime) {
  const daySchedule = this.getDaySchedule(day);
  const now = new Date(`2000-01-01 ${currentTime}`);
  
  const upcomingSlots = daySchedule.filter(slot => {
    const start = new Date(`2000-01-01 ${slot.startTime}`);
    return now < start;
  });
  
  return upcomingSlots.length > 0 ? upcomingSlots[0] : null;
};

// Instance method to check for conflicts
simpleTimetableSchema.methods.checkConflicts = function() {
  const conflicts = [];
  
  this.weeklySchedule.forEach(daySchedule => {
    const slots = daySchedule.slots.filter(s => !s.isBreak && s.slotType !== 'Free');
    
    // Check for time overlaps
    for (let i = 0; i < slots.length; i++) {
      for (let j = i + 1; j < slots.length; j++) {
        const slot1 = slots[i];
        const slot2 = slots[j];
        
        const start1 = new Date(`2000-01-01 ${slot1.startTime}`);
        const end1 = new Date(`2000-01-01 ${slot1.endTime}`);
        const start2 = new Date(`2000-01-01 ${slot2.startTime}`);
        const end2 = new Date(`2000-01-01 ${slot2.endTime}`);
        
        // Check for overlap
        if ((start1 < end2 && end1 > start2)) {
          conflicts.push({
            day: daySchedule.day,
            type: 'Time Overlap',
            slots: [slot1, slot2],
            message: `Time overlap between slots ${slot1.slotNumber} and ${slot2.slotNumber}`
          });
        }
        
        // Check for room conflicts
        if (slot1.room === slot2.room && (start1 < end2 && end1 > start2)) {
          conflicts.push({
            day: daySchedule.day,
            type: 'Room Conflict',
            room: slot1.room,
            slots: [slot1, slot2],
            message: `Room ${slot1.room} is double-booked`
          });
        }
        
        // Check for faculty conflicts
        if (slot1.facultyId && slot2.facultyId && 
            slot1.facultyId.toString() === slot2.facultyId.toString() && 
            (start1 < end2 && end1 > start2)) {
          conflicts.push({
            day: daySchedule.day,
            type: 'Faculty Conflict',
            facultyId: slot1.facultyId,
            slots: [slot1, slot2],
            message: `Faculty is assigned to multiple slots at the same time`
          });
        }
      }
    }
  });
  
  return conflicts;
};

// Static method to get faculty timetable
simpleTimetableSchema.statics.getFacultyTimetable = async function(facultyId, academicYear = null, semester = null) {
  const matchStage = {
    status: 'Active',
    'weeklySchedule.slots.facultyId': new mongoose.Types.ObjectId(facultyId)
  };
  
  if (academicYear) matchStage.academicYear = academicYear;
  if (semester) matchStage.semester = semester;
  
  const pipeline = [
    { $match: matchStage },
    { $unwind: '$weeklySchedule' },
    { $unwind: '$weeklySchedule.slots' },
    {
      $match: {
        'weeklySchedule.slots.facultyId': new mongoose.Types.ObjectId(facultyId),
        'weeklySchedule.slots.isBreak': { $ne: true }
      }
    },
    {
      $lookup: {
        from: 'simplecourses',
        localField: 'weeklySchedule.slots.courseId',
        foreignField: '_id',
        as: 'courseDetails'
      }
    },
    { $unwind: { path: '$courseDetails', preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: {
          day: '$weeklySchedule.day',
          academicYear: '$academicYear',
          semester: '$semester'
        },
        slots: {
          $push: {
            slotNumber: '$weeklySchedule.slots.slotNumber',
            startTime: '$weeklySchedule.slots.startTime',
            endTime: '$weeklySchedule.slots.endTime',
            course: '$courseDetails',
            room: '$weeklySchedule.slots.room',
            slotType: '$weeklySchedule.slots.slotType',
            duration: '$weeklySchedule.slots.duration',
            department: '$department',
            program: '$program',
            section: '$section'
          }
        }
      }
    },
    {
      $sort: { 
        '_id.academicYear': -1, 
        '_id.semester': -1, 
        '_id.day': 1 
      }
    }
  ];
  
  return await this.aggregate(pipeline);
};

// Static method to get student timetable
simpleTimetableSchema.statics.getStudentTimetable = async function(department, program, semester, academicYear, section = 'A') {
  return await this.findOne({
    department,
    program,
    semester,
    academicYear,
    section,
    status: 'Active',
    effectiveFrom: { $lte: new Date() },
    $or: [
      { effectiveTo: { $exists: false } },
      { effectiveTo: { $gte: new Date() } }
    ]
  })
  .populate('weeklySchedule.slots.courseId', 'courseCode courseName credits')
  .populate('weeklySchedule.slots.facultyId', 'name email')
  .populate('createdBy', 'name');
};

// Static method to get room utilization
simpleTimetableSchema.statics.getRoomUtilization = async function(room, academicYear = null, semester = null) {
  const matchStage = {
    status: 'Active',
    'weeklySchedule.slots.room': room
  };
  
  if (academicYear) matchStage.academicYear = academicYear;
  if (semester) matchStage.semester = semester;
  
  const pipeline = [
    { $match: matchStage },
    { $unwind: '$weeklySchedule' },
    { $unwind: '$weeklySchedule.slots' },
    {
      $match: {
        'weeklySchedule.slots.room': room,
        'weeklySchedule.slots.isBreak': { $ne: true }
      }
    },
    {
      $lookup: {
        from: 'simplecourses',
        localField: 'weeklySchedule.slots.courseId',
        foreignField: '_id',
        as: 'courseDetails'
      }
    },
    {
      $lookup: {
        from: 'simpleusers',
        localField: 'weeklySchedule.slots.facultyId',
        foreignField: '_id',
        as: 'facultyDetails'
      }
    },
    { $unwind: { path: '$courseDetails', preserveNullAndEmptyArrays: true } },
    { $unwind: { path: '$facultyDetails', preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: '$weeklySchedule.day',
        slots: {
          $push: {
            slotNumber: '$weeklySchedule.slots.slotNumber',
            startTime: '$weeklySchedule.slots.startTime',
            endTime: '$weeklySchedule.slots.endTime',
            course: '$courseDetails',
            faculty: '$facultyDetails',
            slotType: '$weeklySchedule.slots.slotType',
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

// Static method to get timetable statistics
simpleTimetableSchema.statics.getTimetableStats = async function(academicYear = null, semester = null) {
  const matchStage = { status: 'Active' };
  
  if (academicYear) matchStage.academicYear = academicYear;
  if (semester) matchStage.semester = semester;
  
  const pipeline = [
    { $match: matchStage },
    { $unwind: '$weeklySchedule' },
    { $unwind: '$weeklySchedule.slots' },
    {
      $match: {
        'weeklySchedule.slots.isBreak': { $ne: true },
        'weeklySchedule.slots.slotType': { $ne: 'Free' }
      }
    },
    {
      $group: {
        _id: null,
        totalSlots: { $sum: 1 },
        totalHours: { $sum: { $divide: ['$weeklySchedule.slots.duration', 60] } },
        slotTypes: { $push: '$weeklySchedule.slots.slotType' },
        departments: { $addToSet: '$department' },
        programs: { $addToSet: '$program' },
        uniqueRooms: { $addToSet: '$weeklySchedule.slots.room' },
        uniqueFaculty: { $addToSet: '$weeklySchedule.slots.facultyId' },
        uniqueCourses: { $addToSet: '$weeklySchedule.slots.courseId' }
      }
    },
    {
      $project: {
        _id: 0,
        totalSlots: 1,
        totalHours: { $round: ['$totalHours', 2] },
        totalDepartments: { $size: '$departments' },
        totalPrograms: { $size: '$programs' },
        totalRooms: { $size: '$uniqueRooms' },
        totalFaculty: { $size: '$uniqueFaculty' },
        totalCourses: { $size: '$uniqueCourses' },
        slotTypeDistribution: {
          $arrayToObject: {
            $map: {
              input: { $setUnion: ['$slotTypes', []] },
              as: 'type',
              in: {
                k: '$$type',
                v: {
                  $size: {
                    $filter: {
                      input: '$slotTypes',
                      cond: { $eq: ['$$this', '$$type'] }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  ];
  
  const result = await this.aggregate(pipeline);
  return result[0] || {
    totalSlots: 0,
    totalHours: 0,
    totalDepartments: 0,
    totalPrograms: 0,
    totalRooms: 0,
    totalFaculty: 0,
    totalCourses: 0,
    slotTypeDistribution: {}
  };
};

// Pre-save middleware to calculate total hours
simpleTimetableSchema.pre('save', function(next) {
  let totalMinutes = 0;
  
  this.weeklySchedule.forEach(day => {
    day.slots.forEach(slot => {
      if (!slot.isBreak && slot.slotType !== 'Free') {
        totalMinutes += slot.duration || 60;
      }
    });
  });
  
  this.totalHours = Math.round(totalMinutes / 60 * 100) / 100;
  next();
});

// Pre-save middleware to validate references
simpleTimetableSchema.pre('save', async function(next) {
  try {
    const SimpleUser = mongoose.model('SimpleUser');
    const SimpleCourse = mongoose.model('SimpleCourse');
    
    // Validate created by user
    const creator = await SimpleUser.findById(this.createdBy);
    if (!creator) {
      return next(new Error('Creator user not found'));
    }
    
    if (!['admin', 'faculty'].includes(creator.role)) {
      return next(new Error('Only admin or faculty can create timetables'));
    }
    
    // Validate faculty and course references in slots
    for (const day of this.weeklySchedule) {
      for (const slot of day.slots) {
        if (slot.facultyId) {
          const faculty = await SimpleUser.findById(slot.facultyId);
          if (!faculty) {
            return next(new Error(`Faculty not found for slot ${slot.slotNumber} on ${day.day}`));
          }
          if (faculty.role !== 'faculty') {
            return next(new Error(`User ${faculty.name} is not a faculty member`));
          }
        }
        
        if (slot.courseId) {
          const course = await SimpleCourse.findById(slot.courseId);
          if (!course) {
            return next(new Error(`Course not found for slot ${slot.slotNumber} on ${day.day}`));
          }
        }
      }
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model('SimpleTimetable', simpleTimetableSchema);