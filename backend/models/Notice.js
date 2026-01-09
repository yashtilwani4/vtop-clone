const mongoose = require('mongoose');

const noticeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  
  // Notice Classification
  category: {
    type: String,
    enum: [
      'Academic',
      'Examination',
      'Admission',
      'Fee',
      'Event',
      'Holiday',
      'Emergency',
      'General',
      'Placement',
      'Research'
    ],
    required: true
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Urgent'],
    default: 'Medium'
  },
  
  // Targeting
  targetAudience: {
    roles: [{
      type: String,
      enum: ['student', 'faculty', 'admin', 'all'],
      required: true
    }],
    departments: [{
      type: String
    }],
    programs: [{
      type: String
    }],
    semesters: [{
      type: Number,
      min: 1,
      max: 8
    }],
    specificUsers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
  
  // Publishing Information
  publishedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  publishedDate: {
    type: Date,
    default: Date.now
  },
  
  // Visibility and Status
  isActive: {
    type: Boolean,
    default: true
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  isDraft: {
    type: Boolean,
    default: true
  },
  
  // Scheduling
  scheduledPublishDate: {
    type: Date
  },
  expiryDate: {
    type: Date
  },
  
  // Attachments
  attachments: [{
    fileName: {
      type: String,
      required: true
    },
    fileUrl: {
      type: String,
      required: true
    },
    fileSize: {
      type: Number // in bytes
    },
    fileType: {
      type: String
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Engagement Tracking
  views: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    viewedAt: {
      type: Date,
      default: Date.now
    },
    ipAddress: String
  }],
  
  // Acknowledgment (for important notices)
  requiresAcknowledgment: {
    type: Boolean,
    default: false
  },
  acknowledgments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    acknowledgedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // SEO and Search
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  slug: {
    type: String,
    unique: true,
    sparse: true
  },
  
  // Metadata
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  version: {
    type: Number,
    default: 1
  }
}, {
  timestamps: true
});

// Indexes for better performance
noticeSchema.index({ publishedDate: -1 });
noticeSchema.index({ category: 1, isPublished: 1 });
noticeSchema.index({ 'targetAudience.roles': 1 });
noticeSchema.index({ 'targetAudience.departments': 1 });
noticeSchema.index({ priority: 1, publishedDate: -1 });
noticeSchema.index({ expiryDate: 1 });
noticeSchema.index({ tags: 1 });
noticeSchema.index({ slug: 1 });

// Text index for search functionality
noticeSchema.index({
  title: 'text',
  content: 'text',
  tags: 'text'
});

// Virtual for view count
noticeSchema.virtual('viewCount').get(function() {
  return this.views.length;
});

// Virtual for acknowledgment count
noticeSchema.virtual('acknowledgmentCount').get(function() {
  return this.acknowledgments.length;
});

// Virtual for reading time (approximate)
noticeSchema.virtual('readingTime').get(function() {
  const wordsPerMinute = 200;
  const wordCount = this.content.split(' ').length;
  return Math.ceil(wordCount / wordsPerMinute);
});

// Pre-save middleware to generate slug
noticeSchema.pre('save', function(next) {
  if (this.isModified('title') && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 50);
  }
  next();
});

// Method to check if notice is visible to user
noticeSchema.methods.isVisibleToUser = function(user) {
  // Check if notice is published and active
  if (!this.isPublished || !this.isActive) {
    return false;
  }
  
  // Check expiry date
  if (this.expiryDate && new Date() > this.expiryDate) {
    return false;
  }
  
  // Check scheduled publish date
  if (this.scheduledPublishDate && new Date() < this.scheduledPublishDate) {
    return false;
  }
  
  const target = this.targetAudience;
  
  // Check if targeting all users
  if (target.roles.includes('all')) {
    return true;
  }
  
  // Check role targeting
  if (!target.roles.includes(user.role)) {
    return false;
  }
  
  // Check department targeting
  if (target.departments.length > 0 && !target.departments.includes(user.department)) {
    return false;
  }
  
  // Check program targeting
  if (target.programs.length > 0 && !target.programs.includes(user.program)) {
    return false;
  }
  
  // Check semester targeting (for students)
  if (user.role === 'student' && target.semesters.length > 0 && !target.semesters.includes(user.semester)) {
    return false;
  }
  
  // Check specific user targeting
  if (target.specificUsers.length > 0) {
    return target.specificUsers.some(userId => userId.toString() === user._id.toString());
  }
  
  return true;
};

// Method to mark as viewed by user
noticeSchema.methods.markAsViewed = function(userId, ipAddress = null) {
  const existingView = this.views.find(view => 
    view.user && view.user.toString() === userId.toString()
  );
  
  if (!existingView) {
    this.views.push({
      user: userId,
      viewedAt: new Date(),
      ipAddress
    });
    return this.save();
  }
  
  return Promise.resolve(this);
};

// Method to acknowledge notice
noticeSchema.methods.acknowledge = function(userId) {
  const existingAck = this.acknowledgments.find(ack => 
    ack.user.toString() === userId.toString()
  );
  
  if (!existingAck) {
    this.acknowledgments.push({
      user: userId,
      acknowledgedAt: new Date()
    });
    return this.save();
  }
  
  return Promise.resolve(this);
};

// Static method to get notices for user
noticeSchema.statics.getNoticesForUser = async function(user, page = 1, limit = 10, category = null) {
  const skip = (page - 1) * limit;
  
  // Build match criteria
  const matchCriteria = {
    isPublished: true,
    isActive: true,
    $or: [
      { expiryDate: { $exists: false } },
      { expiryDate: { $gte: new Date() } }
    ],
    $or: [
      { scheduledPublishDate: { $exists: false } },
      { scheduledPublishDate: { $lte: new Date() } }
    ]
  };
  
  // Add category filter
  if (category) {
    matchCriteria.category = category;
  }
  
  // Add targeting criteria
  const targetingCriteria = {
    $or: [
      { 'targetAudience.roles': 'all' },
      { 'targetAudience.roles': user.role },
      { 'targetAudience.specificUsers': user._id }
    ]
  };
  
  // Add department and program filters
  if (user.department) {
    targetingCriteria.$or.push(
      { 'targetAudience.departments': { $in: [user.department] } }
    );
  }
  
  if (user.program) {
    targetingCriteria.$or.push(
      { 'targetAudience.programs': { $in: [user.program] } }
    );
  }
  
  if (user.role === 'student' && user.semester) {
    targetingCriteria.$or.push(
      { 'targetAudience.semesters': { $in: [user.semester] } }
    );
  }
  
  const pipeline = [
    { $match: { ...matchCriteria, ...targetingCriteria } },
    { $sort: { priority: -1, publishedDate: -1 } },
    { $skip: skip },
    { $limit: limit },
    {
      $lookup: {
        from: 'users',
        localField: 'publishedBy',
        foreignField: '_id',
        as: 'publisher'
      }
    },
    {
      $addFields: {
        isViewed: {
          $in: [user._id, '$views.user']
        },
        isAcknowledged: {
          $in: [user._id, '$acknowledgments.user']
        }
      }
    }
  ];
  
  return await this.aggregate(pipeline);
};

// Static method to get notice statistics
noticeSchema.statics.getNoticeStats = async function(startDate, endDate) {
  const matchStage = {
    publishedDate: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    }
  };
  
  const pipeline = [
    { $match: matchStage },
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
        totalViews: { $sum: { $size: '$views' } },
        totalAcknowledgments: { $sum: { $size: '$acknowledgments' } }
      }
    },
    { $sort: { count: -1 } }
  ];
  
  return await this.aggregate(pipeline);
};

module.exports = mongoose.model('Notice', noticeSchema);