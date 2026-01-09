const mongoose = require('mongoose');

const simpleNoticeSchema = new mongoose.Schema({
  // Basic Information
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  
  content: {
    type: String,
    required: [true, 'Content is required'],
    trim: true,
    maxlength: [5000, 'Content cannot exceed 5000 characters']
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
      'Research',
      'Sports',
      'Cultural'
    ],
    required: [true, 'Category is required'],
    default: 'General'
  },
  
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Urgent'],
    default: 'Medium'
  },
  
  // Publishing Information
  publishedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SimpleUser',
    required: [true, 'Publisher is required'],
    validate: {
      validator: function(v) {
        return mongoose.Types.ObjectId.isValid(v);
      },
      message: 'Publisher ID must be a valid ObjectId'
    }
  },
  
  publishedDate: {
    type: Date,
    default: Date.now
  },
  
  // Status Management
  status: {
    type: String,
    enum: ['Draft', 'Published', 'Archived'],
    default: 'Draft'
  },
  
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Targeting (Simplified)
  targetAudience: {
    type: String,
    enum: ['All', 'Students', 'Faculty', 'Admin'],
    default: 'All'
  },
  
  // Optional targeting filters
  targetDepartments: [{
    type: String,
    trim: true,
    uppercase: true
  }],
  
  targetPrograms: [{
    type: String,
    enum: ['B.Tech', 'M.Tech', 'B.Sc', 'M.Sc', 'BCA', 'MCA', 'MBA']
  }],
  
  targetSemesters: [{
    type: Number,
    min: [1, 'Semester must be at least 1'],
    max: [8, 'Semester cannot exceed 8']
  }],
  
  // Scheduling
  expiryDate: {
    type: Date,
    validate: {
      validator: function(v) {
        return !v || v > this.publishedDate;
      },
      message: 'Expiry date must be after published date'
    }
  },
  
  // Attachments (Simplified)
  attachments: [{
    fileName: {
      type: String,
      required: [true, 'File name is required'],
      trim: true
    },
    fileUrl: {
      type: String,
      required: [true, 'File URL is required'],
      trim: true
    },
    fileSize: {
      type: Number, // in bytes
      min: [0, 'File size cannot be negative']
    },
    fileType: {
      type: String,
      trim: true,
      lowercase: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Engagement Tracking
  viewCount: {
    type: Number,
    default: 0,
    min: [0, 'View count cannot be negative']
  },
  
  views: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SimpleUser'
    },
    viewedAt: {
      type: Date,
      default: Date.now
    },
    ipAddress: {
      type: String,
      trim: true
    }
  }],
  
  // Tags for better organization
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
    maxlength: [50, 'Tag cannot exceed 50 characters']
  }],
  
  // SEO friendly URL slug
  slug: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    lowercase: true
  },
  
  // Additional metadata
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SimpleUser'
  },
  
  version: {
    type: Number,
    default: 1,
    min: [1, 'Version must be at least 1']
  },
  
  // Summary for quick preview
  summary: {
    type: String,
    trim: true,
    maxlength: [300, 'Summary cannot exceed 300 characters']
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes for better performance
simpleNoticeSchema.index({ publishedDate: -1 });
simpleNoticeSchema.index({ status: 1, publishedDate: -1 });
simpleNoticeSchema.index({ category: 1, status: 1 });
simpleNoticeSchema.index({ priority: 1, publishedDate: -1 });
simpleNoticeSchema.index({ targetAudience: 1 });
simpleNoticeSchema.index({ publishedBy: 1 });
simpleNoticeSchema.index({ expiryDate: 1 });
simpleNoticeSchema.index({ tags: 1 });
simpleNoticeSchema.index({ slug: 1 });
simpleNoticeSchema.index({ isActive: 1, status: 1 });

// Text index for search functionality
simpleNoticeSchema.index({
  title: 'text',
  content: 'text',
  summary: 'text',
  tags: 'text'
}, {
  weights: {
    title: 10,
    summary: 5,
    content: 2,
    tags: 3
  }
});

// Virtual for reading time estimation
simpleNoticeSchema.virtual('readingTime').get(function() {
  const wordsPerMinute = 200;
  const wordCount = this.content.split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
});

// Virtual for checking if notice is expired
simpleNoticeSchema.virtual('isExpired').get(function() {
  return this.expiryDate && new Date() > this.expiryDate;
});

// Virtual for checking if notice is current
simpleNoticeSchema.virtual('isCurrent').get(function() {
  return this.status === 'Published' && 
         this.isActive && 
         !this.isExpired;
});

// Virtual for days since published
simpleNoticeSchema.virtual('daysSincePublished').get(function() {
  const diffTime = Math.abs(new Date() - this.publishedDate);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Pre-save middleware to generate slug
simpleNoticeSchema.pre('save', function(next) {
  if (this.isModified('title') && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
      .substring(0, 60); // Limit length
    
    // Add timestamp if slug might not be unique
    if (this.slug.length < 3) {
      this.slug = `notice-${Date.now()}`;
    }
  }
  next();
});

// Pre-save middleware to generate summary if not provided
simpleNoticeSchema.pre('save', function(next) {
  if (this.isModified('content') && !this.summary) {
    // Generate summary from first 250 characters of content
    this.summary = this.content
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .substring(0, 250)
      .trim();
    
    // Add ellipsis if content was truncated
    if (this.content.length > 250) {
      this.summary += '...';
    }
  }
  next();
});

// Pre-save middleware to validate publisher role
simpleNoticeSchema.pre('save', async function(next) {
  try {
    if (this.isModified('publishedBy')) {
      const SimpleUser = mongoose.model('SimpleUser');
      const publisher = await SimpleUser.findById(this.publishedBy);
      
      if (!publisher) {
        return next(new Error('Publisher not found'));
      }
      
      if (!['admin', 'faculty'].includes(publisher.role)) {
        return next(new Error('Only admin and faculty can publish notices'));
      }
    }
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to check if notice is visible to user
simpleNoticeSchema.methods.isVisibleToUser = function(user) {
  // Check basic visibility criteria
  if (this.status !== 'Published' || !this.isActive || this.isExpired) {
    return false;
  }
  
  // Check target audience
  if (this.targetAudience === 'All') {
    return true;
  }
  
  // Check role-based targeting
  if (this.targetAudience === 'Students' && user.role !== 'student') {
    return false;
  }
  
  if (this.targetAudience === 'Faculty' && user.role !== 'faculty') {
    return false;
  }
  
  if (this.targetAudience === 'Admin' && user.role !== 'admin') {
    return false;
  }
  
  // Check department targeting
  if (this.targetDepartments.length > 0 && 
      !this.targetDepartments.includes(user.department)) {
    return false;
  }
  
  // Check program targeting
  if (this.targetPrograms.length > 0 && 
      !this.targetPrograms.includes(user.program)) {
    return false;
  }
  
  // Check semester targeting (for students)
  if (user.role === 'student' && 
      this.targetSemesters.length > 0 && 
      !this.targetSemesters.includes(user.semester)) {
    return false;
  }
  
  return true;
};

// Instance method to mark as viewed
simpleNoticeSchema.methods.markAsViewed = async function(userId, ipAddress = null) {
  // Check if user has already viewed this notice
  const existingView = this.views.find(view => 
    view.userId && view.userId.toString() === userId.toString()
  );
  
  if (!existingView) {
    this.views.push({
      userId,
      viewedAt: new Date(),
      ipAddress
    });
    this.viewCount = this.views.length;
    return this.save();
  }
  
  return Promise.resolve(this);
};

// Static method to get notices for user with filtering
simpleNoticeSchema.statics.getNoticesForUser = async function(user, options = {}) {
  const {
    page = 1,
    limit = 10,
    category = null,
    priority = null,
    search = null,
    sortBy = 'latest'
  } = options;
  
  const skip = (page - 1) * limit;
  
  // Build match criteria
  const matchCriteria = {
    status: 'Published',
    isActive: true,
    $or: [
      { expiryDate: { $exists: false } },
      { expiryDate: { $gte: new Date() } }
    ]
  };
  
  // Add category filter
  if (category) {
    matchCriteria.category = category;
  }
  
  // Add priority filter
  if (priority) {
    matchCriteria.priority = priority;
  }
  
  // Add search filter
  if (search) {
    matchCriteria.$text = { $search: search };
  }
  
  // Build targeting criteria
  const targetingCriteria = {
    $or: [
      { targetAudience: 'All' },
      { targetAudience: user.role === 'student' ? 'Students' : 
                       user.role === 'faculty' ? 'Faculty' : 'Admin' }
    ]
  };
  
  // Add department filter
  if (user.department) {
    targetingCriteria.$or.push(
      { targetDepartments: { $in: [user.department] } },
      { targetDepartments: { $size: 0 } }
    );
  }
  
  // Add program filter
  if (user.program) {
    targetingCriteria.$or.push(
      { targetPrograms: { $in: [user.program] } },
      { targetPrograms: { $size: 0 } }
    );
  }
  
  // Add semester filter for students
  if (user.role === 'student' && user.semester) {
    targetingCriteria.$or.push(
      { targetSemesters: { $in: [user.semester] } },
      { targetSemesters: { $size: 0 } }
    );
  }
  
  // Build sort criteria
  let sortCriteria = {};
  switch (sortBy) {
    case 'latest':
      sortCriteria = { publishedDate: -1 };
      break;
    case 'priority':
      sortCriteria = { priority: -1, publishedDate: -1 };
      break;
    case 'category':
      sortCriteria = { category: 1, publishedDate: -1 };
      break;
    case 'views':
      sortCriteria = { viewCount: -1, publishedDate: -1 };
      break;
    default:
      sortCriteria = { publishedDate: -1 };
  }
  
  const pipeline = [
    { $match: { ...matchCriteria, ...targetingCriteria } },
    { $sort: sortCriteria },
    { $skip: skip },
    { $limit: limit },
    {
      $lookup: {
        from: 'simpleusers',
        localField: 'publishedBy',
        foreignField: '_id',
        as: 'publisher'
      }
    },
    { $unwind: { path: '$publisher', preserveNullAndEmptyArrays: true } },
    {
      $addFields: {
        isViewed: {
          $in: [user._id, '$views.userId']
        },
        publisherName: '$publisher.name',
        publisherEmail: '$publisher.email'
      }
    },
    {
      $project: {
        title: 1,
        content: 1,
        summary: 1,
        category: 1,
        priority: 1,
        status: 1,
        targetAudience: 1,
        publishedDate: 1,
        expiryDate: 1,
        viewCount: 1,
        tags: 1,
        slug: 1,
        attachments: 1,
        readingTime: 1,
        daysSincePublished: 1,
        isViewed: 1,
        publisherName: 1,
        publisherEmail: 1,
        createdAt: 1,
        updatedAt: 1
      }
    }
  ];
  
  const notices = await this.aggregate(pipeline);
  
  // Get total count for pagination
  const totalPipeline = [
    { $match: { ...matchCriteria, ...targetingCriteria } },
    { $count: 'total' }
  ];
  
  const totalResult = await this.aggregate(totalPipeline);
  const total = totalResult.length > 0 ? totalResult[0].total : 0;
  
  return {
    notices,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1
    }
  };
};

// Static method to get notice statistics
simpleNoticeSchema.statics.getNoticeStats = async function(startDate = null, endDate = null) {
  const matchStage = {};
  
  if (startDate && endDate) {
    matchStage.publishedDate = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }
  
  const pipeline = [
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalNotices: { $sum: 1 },
        publishedNotices: {
          $sum: { $cond: [{ $eq: ['$status', 'Published'] }, 1, 0] }
        },
        draftNotices: {
          $sum: { $cond: [{ $eq: ['$status', 'Draft'] }, 1, 0] }
        },
        archivedNotices: {
          $sum: { $cond: [{ $eq: ['$status', 'Archived'] }, 1, 0] }
        },
        totalViews: { $sum: '$viewCount' },
        avgViewsPerNotice: { $avg: '$viewCount' },
        categoryStats: {
          $push: {
            category: '$category',
            priority: '$priority',
            viewCount: '$viewCount'
          }
        }
      }
    },
    {
      $project: {
        _id: 0,
        totalNotices: 1,
        publishedNotices: 1,
        draftNotices: 1,
        archivedNotices: 1,
        totalViews: 1,
        avgViewsPerNotice: { $round: ['$avgViewsPerNotice', 2] }
      }
    }
  ];
  
  const categoryPipeline = [
    { $match: matchStage },
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
        totalViews: { $sum: '$viewCount' },
        avgViews: { $avg: '$viewCount' }
      }
    },
    { $sort: { count: -1 } }
  ];
  
  const priorityPipeline = [
    { $match: matchStage },
    {
      $group: {
        _id: '$priority',
        count: { $sum: 1 },
        totalViews: { $sum: '$viewCount' }
      }
    },
    { $sort: { count: -1 } }
  ];
  
  const [overallStats, categoryStats, priorityStats] = await Promise.all([
    this.aggregate(pipeline),
    this.aggregate(categoryPipeline),
    this.aggregate(priorityPipeline)
  ]);
  
  return {
    overview: overallStats[0] || {
      totalNotices: 0,
      publishedNotices: 0,
      draftNotices: 0,
      archivedNotices: 0,
      totalViews: 0,
      avgViewsPerNotice: 0
    },
    categoryDistribution: categoryStats,
    priorityDistribution: priorityStats
  };
};

// Static method to search notices
simpleNoticeSchema.statics.searchNotices = async function(query, options = {}) {
  const {
    page = 1,
    limit = 10,
    category = null,
    priority = null
  } = options;
  
  const skip = (page - 1) * limit;
  
  const matchCriteria = {
    $text: { $search: query },
    status: 'Published',
    isActive: true,
    $or: [
      { expiryDate: { $exists: false } },
      { expiryDate: { $gte: new Date() } }
    ]
  };
  
  if (category) matchCriteria.category = category;
  if (priority) matchCriteria.priority = priority;
  
  const pipeline = [
    { $match: matchCriteria },
    { $addFields: { score: { $meta: 'textScore' } } },
    { $sort: { score: { $meta: 'textScore' }, publishedDate: -1 } },
    { $skip: skip },
    { $limit: limit },
    {
      $lookup: {
        from: 'simpleusers',
        localField: 'publishedBy',
        foreignField: '_id',
        as: 'publisher'
      }
    },
    { $unwind: { path: '$publisher', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        title: 1,
        summary: 1,
        category: 1,
        priority: 1,
        publishedDate: 1,
        viewCount: 1,
        tags: 1,
        slug: 1,
        score: 1,
        publisherName: '$publisher.name',
        readingTime: 1
      }
    }
  ];
  
  return await this.aggregate(pipeline);
};

module.exports = mongoose.model('SimpleNotice', simpleNoticeSchema);