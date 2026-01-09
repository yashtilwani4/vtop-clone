const express = require('express');
const SimpleNotice = require('../models/SimpleNotice');
const SimpleUser = require('../models/SimpleUser');

const router = express.Router();

// Simple authentication middleware (for demo purposes)
const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    // For demo purposes, we'll decode without verification
    // In production, use proper JWT verification
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    const user = await SimpleUser.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

// Optional authentication middleware
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (token) {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
      const user = await SimpleUser.findById(decoded.userId);
      
      if (user) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

// Authorization middleware for admin
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }
  next();
};

// Authorization middleware for admin or faculty
const requireAdminOrFaculty = (req, res, next) => {
  if (!req.user || !['admin', 'faculty'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Admin or faculty access required'
    });
  }
  next();
};

// @route   POST /api/simple-notices/create
// @desc    Create notice (Admin only)
// @access  Private/Admin
router.post('/create', authenticate, requireAdmin, async (req, res) => {
  try {
    const {
      title,
      content,
      category,
      priority,
      targetAudience,
      targetDepartments,
      targetPrograms,
      targetSemesters,
      expiryDate,
      attachments,
      tags,
      summary,
      status
    } = req.body;

    // Validate required fields
    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Title and content are required'
      });
    }

    // Create new notice
    const notice = new SimpleNotice({
      title,
      content,
      category: category || 'General',
      priority: priority || 'Medium',
      targetAudience: targetAudience || 'All',
      targetDepartments: targetDepartments || [],
      targetPrograms: targetPrograms || [],
      targetSemesters: targetSemesters || [],
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      attachments: attachments || [],
      tags: tags || [],
      summary,
      status: status || 'Draft',
      publishedBy: req.user._id,
      publishedDate: status === 'Published' ? new Date() : Date.now()
    });

    await notice.save();

    // Populate publisher information
    await notice.populate('publishedBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Notice created successfully',
      data: {
        notice: {
          id: notice._id,
          title: notice.title,
          content: notice.content,
          summary: notice.summary,
          category: notice.category,
          priority: notice.priority,
          targetAudience: notice.targetAudience,
          targetDepartments: notice.targetDepartments,
          targetPrograms: notice.targetPrograms,
          targetSemesters: notice.targetSemesters,
          status: notice.status,
          publishedDate: notice.publishedDate,
          expiryDate: notice.expiryDate,
          attachments: notice.attachments,
          tags: notice.tags,
          slug: notice.slug,
          viewCount: notice.viewCount,
          readingTime: notice.readingTime,
          publishedBy: notice.publishedBy,
          createdAt: notice.createdAt
        }
      }
    });

  } catch (error) {
    console.error('Create notice error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create notice',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/simple-notices/all
// @desc    Get all notices for users (sorted by latest)
// @access  Public (with optional auth for personalization)
router.get('/all', optionalAuth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      priority,
      search,
      sortBy = 'latest'
    } = req.query;

    let notices, pagination;

    if (req.user) {
      // Personalized notices for authenticated users
      const result = await SimpleNotice.getNoticesForUser(req.user, {
        page: parseInt(page),
        limit: parseInt(limit),
        category,
        priority,
        search,
        sortBy
      });
      
      notices = result.notices;
      pagination = result.pagination;
    } else {
      // Public notices for unauthenticated users
      const skip = (parseInt(page) - 1) * parseInt(limit);
      
      const filter = {
        status: 'Published',
        isActive: true,
        targetAudience: 'All',
        $or: [
          { expiryDate: { $exists: false } },
          { expiryDate: { $gte: new Date() } }
        ]
      };
      
      if (category) filter.category = category;
      if (priority) filter.priority = priority;
      if (search) filter.$text = { $search: search };
      
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
      
      notices = await SimpleNotice.find(filter)
        .populate('publishedBy', 'name email')
        .sort(sortCriteria)
        .skip(skip)
        .limit(parseInt(limit))
        .select('title summary category priority publishedDate expiryDate viewCount tags slug readingTime daysSincePublished');
      
      const total = await SimpleNotice.countDocuments(filter);
      
      pagination = {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
        hasNextPage: parseInt(page) < Math.ceil(total / parseInt(limit)),
        hasPrevPage: parseInt(page) > 1
      };
    }

    res.json({
      success: true,
      data: {
        notices: notices.map(notice => ({
          id: notice._id || notice.id,
          title: notice.title,
          summary: notice.summary,
          category: notice.category,
          priority: notice.priority,
          targetAudience: notice.targetAudience,
          publishedDate: notice.publishedDate,
          expiryDate: notice.expiryDate,
          viewCount: notice.viewCount,
          tags: notice.tags,
          slug: notice.slug,
          readingTime: notice.readingTime,
          daysSincePublished: notice.daysSincePublished,
          isViewed: notice.isViewed || false,
          publisherName: notice.publisherName || notice.publishedBy?.name,
          publisherEmail: notice.publisherEmail || notice.publishedBy?.email,
          createdAt: notice.createdAt,
          updatedAt: notice.updatedAt
        })),
        pagination,
        filters: {
          category,
          priority,
          search,
          sortBy
        }
      }
    });

  } catch (error) {
    console.error('Get all notices error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notices',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/simple-notices/:id
// @desc    Get notice by ID
// @access  Public (with optional auth for view tracking)
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Find notice by ID or slug
    let notice = await SimpleNotice.findOne({
      $or: [
        { _id: mongoose.Types.ObjectId.isValid(id) ? id : null },
        { slug: id }
      ]
    }).populate('publishedBy', 'name email');

    if (!notice) {
      return res.status(404).json({
        success: false,
        message: 'Notice not found'
      });
    }

    // Check if notice is visible to user
    if (req.user && !notice.isVisibleToUser(req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. This notice is not available for your profile.'
      });
    }

    // For public access, only show notices targeted to 'All'
    if (!req.user && notice.targetAudience !== 'All') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Please login to view this notice.'
      });
    }

    // Mark as viewed if user is authenticated
    if (req.user) {
      await notice.markAsViewed(req.user._id, req.ip);
      // Refresh notice to get updated view count
      notice = await SimpleNotice.findById(notice._id).populate('publishedBy', 'name email');
    }

    res.json({
      success: true,
      data: {
        notice: {
          id: notice._id,
          title: notice.title,
          content: notice.content,
          summary: notice.summary,
          category: notice.category,
          priority: notice.priority,
          targetAudience: notice.targetAudience,
          targetDepartments: notice.targetDepartments,
          targetPrograms: notice.targetPrograms,
          targetSemesters: notice.targetSemesters,
          status: notice.status,
          publishedDate: notice.publishedDate,
          expiryDate: notice.expiryDate,
          attachments: notice.attachments,
          tags: notice.tags,
          slug: notice.slug,
          viewCount: notice.viewCount,
          readingTime: notice.readingTime,
          daysSincePublished: notice.daysSincePublished,
          isExpired: notice.isExpired,
          isCurrent: notice.isCurrent,
          publishedBy: {
            id: notice.publishedBy._id,
            name: notice.publishedBy.name,
            email: notice.publishedBy.email
          },
          createdAt: notice.createdAt,
          updatedAt: notice.updatedAt
        }
      }
    });

  } catch (error) {
    console.error('Get notice by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notice',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   PUT /api/simple-notices/:id
// @desc    Update notice (Admin only)
// @access  Private/Admin
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const notice = await SimpleNotice.findById(req.params.id);

    if (!notice) {
      return res.status(404).json({
        success: false,
        message: 'Notice not found'
      });
    }

    const allowedUpdates = [
      'title', 'content', 'summary', 'category', 'priority', 
      'targetAudience', 'targetDepartments', 'targetPrograms', 
      'targetSemesters', 'expiryDate', 'attachments', 'tags', 'status'
    ];

    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    // Update metadata
    updates.lastModifiedBy = req.user._id;
    updates.version = notice.version + 1;

    // If publishing for the first time, set published date
    if (updates.status === 'Published' && notice.status !== 'Published') {
      updates.publishedDate = new Date();
    }

    const updatedNotice = await SimpleNotice.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate('publishedBy', 'name email');

    res.json({
      success: true,
      message: 'Notice updated successfully',
      data: {
        notice: {
          id: updatedNotice._id,
          title: updatedNotice.title,
          content: updatedNotice.content,
          summary: updatedNotice.summary,
          category: updatedNotice.category,
          priority: updatedNotice.priority,
          targetAudience: updatedNotice.targetAudience,
          targetDepartments: updatedNotice.targetDepartments,
          targetPrograms: updatedNotice.targetPrograms,
          targetSemesters: updatedNotice.targetSemesters,
          status: updatedNotice.status,
          publishedDate: updatedNotice.publishedDate,
          expiryDate: updatedNotice.expiryDate,
          attachments: updatedNotice.attachments,
          tags: updatedNotice.tags,
          slug: updatedNotice.slug,
          viewCount: updatedNotice.viewCount,
          version: updatedNotice.version,
          publishedBy: updatedNotice.publishedBy,
          lastModifiedBy: updatedNotice.lastModifiedBy,
          updatedAt: updatedNotice.updatedAt
        }
      }
    });

  } catch (error) {
    console.error('Update notice error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update notice',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   DELETE /api/simple-notices/:id
// @desc    Delete notice (Admin only)
// @access  Private/Admin
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const notice = await SimpleNotice.findById(req.params.id);

    if (!notice) {
      return res.status(404).json({
        success: false,
        message: 'Notice not found'
      });
    }

    // Soft delete by setting status to archived and isActive to false
    notice.status = 'Archived';
    notice.isActive = false;
    notice.lastModifiedBy = req.user._id;
    notice.version = notice.version + 1;

    await notice.save();

    res.json({
      success: true,
      message: 'Notice deleted successfully',
      data: {
        deletedNotice: {
          id: notice._id,
          title: notice.title,
          status: notice.status,
          deletedAt: new Date()
        }
      }
    });

  } catch (error) {
    console.error('Delete notice error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete notice',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/simple-notices/admin/manage
// @desc    Get all notices for admin management
// @access  Private/Admin
router.get('/admin/manage', authenticate, requireAdmin, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      category,
      priority,
      search,
      sortBy = 'latest'
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build filter
    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (priority) filter.priority = priority;
    if (search) filter.$text = { $search: search };

    // Build sort criteria
    let sortCriteria = {};
    switch (sortBy) {
      case 'latest':
        sortCriteria = { createdAt: -1 };
        break;
      case 'published':
        sortCriteria = { publishedDate: -1 };
        break;
      case 'priority':
        sortCriteria = { priority: -1, createdAt: -1 };
        break;
      case 'views':
        sortCriteria = { viewCount: -1, createdAt: -1 };
        break;
      default:
        sortCriteria = { createdAt: -1 };
    }

    const notices = await SimpleNotice.find(filter)
      .populate('publishedBy', 'name email')
      .populate('lastModifiedBy', 'name email')
      .sort(sortCriteria)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await SimpleNotice.countDocuments(filter);

    res.json({
      success: true,
      data: {
        notices: notices.map(notice => ({
          id: notice._id,
          title: notice.title,
          summary: notice.summary,
          category: notice.category,
          priority: notice.priority,
          targetAudience: notice.targetAudience,
          status: notice.status,
          isActive: notice.isActive,
          publishedDate: notice.publishedDate,
          expiryDate: notice.expiryDate,
          viewCount: notice.viewCount,
          tags: notice.tags,
          slug: notice.slug,
          version: notice.version,
          readingTime: notice.readingTime,
          daysSincePublished: notice.daysSincePublished,
          isExpired: notice.isExpired,
          isCurrent: notice.isCurrent,
          publishedBy: notice.publishedBy,
          lastModifiedBy: notice.lastModifiedBy,
          createdAt: notice.createdAt,
          updatedAt: notice.updatedAt
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
          hasNextPage: parseInt(page) < Math.ceil(total / parseInt(limit)),
          hasPrevPage: parseInt(page) > 1
        },
        filters: {
          status,
          category,
          priority,
          search,
          sortBy
        }
      }
    });

  } catch (error) {
    console.error('Get admin notices error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notices for admin',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/simple-notices/search
// @desc    Search notices
// @access  Public
router.get('/search', optionalAuth, async (req, res) => {
  try {
    const {
      q: query,
      page = 1,
      limit = 10,
      category,
      priority
    } = req.query;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters long'
      });
    }

    const searchResults = await SimpleNotice.searchNotices(query.trim(), {
      page: parseInt(page),
      limit: parseInt(limit),
      category,
      priority
    });

    res.json({
      success: true,
      data: {
        query: query.trim(),
        results: searchResults,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: searchResults.length
        }
      }
    });

  } catch (error) {
    console.error('Search notices error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search notices',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/simple-notices/stats
// @desc    Get notice statistics (Admin only)
// @access  Private/Admin
router.get('/stats', authenticate, requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const stats = await SimpleNotice.getNoticeStats(startDate, endDate);

    // Get additional metrics
    const recentNotices = await SimpleNotice.find({
      status: 'Published',
      publishedDate: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    }).countDocuments();

    const expiredNotices = await SimpleNotice.find({
      expiryDate: { $lt: new Date() },
      status: 'Published'
    }).countDocuments();

    const topViewedNotices = await SimpleNotice.find({
      status: 'Published'
    })
    .sort({ viewCount: -1 })
    .limit(5)
    .select('title viewCount publishedDate category')
    .populate('publishedBy', 'name');

    res.json({
      success: true,
      data: {
        ...stats,
        additionalMetrics: {
          recentNotices,
          expiredNotices,
          topViewedNotices
        },
        filters: {
          startDate,
          endDate
        }
      }
    });

  } catch (error) {
    console.error('Get notice stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notice statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   PUT /api/simple-notices/:id/publish
// @desc    Publish notice (Admin only)
// @access  Private/Admin
router.put('/:id/publish', authenticate, requireAdmin, async (req, res) => {
  try {
    const notice = await SimpleNotice.findById(req.params.id);

    if (!notice) {
      return res.status(404).json({
        success: false,
        message: 'Notice not found'
      });
    }

    if (notice.status === 'Published') {
      return res.status(400).json({
        success: false,
        message: 'Notice is already published'
      });
    }

    notice.status = 'Published';
    notice.publishedDate = new Date();
    notice.lastModifiedBy = req.user._id;
    notice.version = notice.version + 1;

    await notice.save();

    res.json({
      success: true,
      message: 'Notice published successfully',
      data: {
        notice: {
          id: notice._id,
          title: notice.title,
          status: notice.status,
          publishedDate: notice.publishedDate,
          version: notice.version
        }
      }
    });

  } catch (error) {
    console.error('Publish notice error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to publish notice',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;