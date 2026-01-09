const express = require('express');
const Notice = require('../models/Notice');
const { authenticate, authorize, optionalAuth } = require('../middleware/auth');
const { validateNotice, validateObjectId, validatePagination } = require('../middleware/validation');

const router = express.Router();

// @route   GET /api/notices
// @desc    Get notices for user
// @access  Public (with optional auth for personalization)
router.get('/', optionalAuth, validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const { category, priority } = req.query;
    
    let notices;
    
    if (req.user) {
      // Personalized notices for authenticated users
      notices = await Notice.getNoticesForUser(req.user, page, limit, category);
    } else {
      // Public notices for unauthenticated users
      const filter = {
        isPublished: true,
        isActive: true,
        'targetAudience.roles': 'all',
        $or: [
          { expiryDate: { $exists: false } },
          { expiryDate: { $gte: new Date() } }
        ],
        $or: [
          { scheduledPublishDate: { $exists: false } },
          { scheduledPublishDate: { $lte: new Date() } }
        ]
      };
      
      if (category) filter.category = category;
      if (priority) filter.priority = priority;
      
      const skip = (page - 1) * limit;
      
      notices = await Notice.find(filter)
        .populate('publishedBy', 'firstName lastName')
        .sort({ priority: -1, publishedDate: -1 })
        .skip(skip)
        .limit(limit);
    }
    
    res.json({
      success: true,
      data: { notices }
    });
  } catch (error) {
    console.error('Get notices error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notices'
    });
  }
});

// @route   GET /api/notices/:id
// @desc    Get notice by ID
// @access  Public (with optional auth)
router.get('/:id', optionalAuth, validateObjectId('id'), async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.id)
      .populate('publishedBy', 'firstName lastName designation')
      .populate('targetAudience.specificUsers', 'firstName lastName userId');
    
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
        message: 'Access denied'
      });
    }
    
    // Mark as viewed if user is authenticated
    if (req.user) {
      await notice.markAsViewed(req.user._id, req.ip);
    }
    
    res.json({
      success: true,
      data: { notice }
    });
  } catch (error) {
    console.error('Get notice error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notice'
    });
  }
});

// @route   POST /api/notices
// @desc    Create notice
// @access  Private/Faculty/Admin
router.post('/', authenticate, authorize('faculty', 'admin'), validateNotice, async (req, res) => {
  try {
    const {
      title,
      content,
      category,
      priority,
      targetAudience,
      scheduledPublishDate,
      expiryDate,
      attachments,
      requiresAcknowledgment,
      tags
    } = req.body;
    
    const notice = new Notice({
      title,
      content,
      category,
      priority,
      targetAudience,
      publishedBy: req.user._id,
      scheduledPublishDate: scheduledPublishDate ? new Date(scheduledPublishDate) : null,
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      attachments,
      requiresAcknowledgment,
      tags,
      isDraft: req.body.isDraft !== false, // Default to draft
      isPublished: req.body.isDraft === false
    });
    
    await notice.save();
    await notice.populate('publishedBy', 'firstName lastName');
    
    res.status(201).json({
      success: true,
      message: 'Notice created successfully',
      data: { notice }
    });
  } catch (error) {
    console.error('Create notice error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create notice'
    });
  }
});

// @route   PUT /api/notices/:id
// @desc    Update notice
// @access  Private/Faculty/Admin
router.put('/:id', authenticate, authorize('faculty', 'admin'), validateObjectId('id'), async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.id);
    
    if (!notice) {
      return res.status(404).json({
        success: false,
        message: 'Notice not found'
      });
    }
    
    // Check if user can edit this notice
    if (req.user.role !== 'admin' && notice.publishedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    const allowedUpdates = [
      'title', 'content', 'category', 'priority', 'targetAudience',
      'scheduledPublishDate', 'expiryDate', 'attachments', 
      'requiresAcknowledgment', 'tags', 'isDraft', 'isPublished'
    ];
    
    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });
    
    updates.lastModifiedBy = req.user._id;
    updates.version = notice.version + 1;
    
    const updatedNotice = await Notice.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate('publishedBy', 'firstName lastName');
    
    res.json({
      success: true,
      message: 'Notice updated successfully',
      data: { notice: updatedNotice }
    });
  } catch (error) {
    console.error('Update notice error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update notice'
    });
  }
});

// @route   DELETE /api/notices/:id
// @desc    Delete notice
// @access  Private/Admin
router.delete('/:id', authenticate, authorize('admin'), validateObjectId('id'), async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.id);
    
    if (!notice) {
      return res.status(404).json({
        success: false,
        message: 'Notice not found'
      });
    }
    
    // Soft delete
    notice.isActive = false;
    await notice.save();
    
    res.json({
      success: true,
      message: 'Notice deleted successfully'
    });
  } catch (error) {
    console.error('Delete notice error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete notice'
    });
  }
});

// @route   POST /api/notices/:id/acknowledge
// @desc    Acknowledge notice
// @access  Private
router.post('/:id/acknowledge', authenticate, validateObjectId('id'), async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.id);
    
    if (!notice) {
      return res.status(404).json({
        success: false,
        message: 'Notice not found'
      });
    }
    
    if (!notice.requiresAcknowledgment) {
      return res.status(400).json({
        success: false,
        message: 'This notice does not require acknowledgment'
      });
    }
    
    if (!notice.isVisibleToUser(req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    await notice.acknowledge(req.user._id);
    
    res.json({
      success: true,
      message: 'Notice acknowledged successfully'
    });
  } catch (error) {
    console.error('Acknowledge notice error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to acknowledge notice'
    });
  }
});

// @route   POST /api/notices/:id/publish
// @desc    Publish notice
// @access  Private/Admin
router.post('/:id/publish', authenticate, authorize('admin'), validateObjectId('id'), async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.id);
    
    if (!notice) {
      return res.status(404).json({
        success: false,
        message: 'Notice not found'
      });
    }
    
    notice.isPublished = true;
    notice.isDraft = false;
    notice.publishedDate = new Date();
    
    await notice.save();
    
    res.json({
      success: true,
      message: 'Notice published successfully'
    });
  } catch (error) {
    console.error('Publish notice error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to publish notice'
    });
  }
});

// @route   GET /api/notices/my/created
// @desc    Get notices created by current user
// @access  Private/Faculty/Admin
router.get('/my/created', authenticate, authorize('faculty', 'admin'), validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const { category, isPublished } = req.query;
    
    const filter = { publishedBy: req.user._id };
    if (category) filter.category = category;
    if (isPublished !== undefined) filter.isPublished = isPublished === 'true';
    
    const notices = await Notice.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Notice.countDocuments(filter);
    
    res.json({
      success: true,
      data: {
        notices,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get my notices error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notices'
    });
  }
});

// @route   GET /api/notices/stats
// @desc    Get notice statistics
// @access  Private/Admin
router.get('/stats/overview', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    
    const stats = await Notice.getNoticeStats(start, end);
    
    res.json({
      success: true,
      data: { stats }
    });
  } catch (error) {
    console.error('Get notice stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notice statistics'
    });
  }
});

module.exports = router;