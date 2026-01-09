const mongoose = require('mongoose');

const passwordResetSchema = new mongoose.Schema({
  // User reference
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SimpleUser',
    required: [true, 'User ID is required'],
    validate: {
      validator: function(v) {
        return mongoose.Types.ObjectId.isValid(v);
      },
      message: 'User ID must be a valid ObjectId'
    }
  },
  
  // Email address
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
    match: [
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      'Please provide a valid email address'
    ]
  },
  
  // OTP code
  otp: {
    type: String,
    required: [true, 'OTP is required'],
    length: [6, 'OTP must be exactly 6 digits'],
    match: [/^\d{6}$/, 'OTP must be 6 digits']
  },
  
  // OTP expiry time
  expiresAt: {
    type: Date,
    required: [true, 'Expiry time is required'],
    default: function() {
      return new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
    }
  },
  
  // Verification status
  isVerified: {
    type: Boolean,
    default: false
  },
  
  // Usage tracking
  attempts: {
    type: Number,
    default: 0,
    max: [3, 'Maximum 3 verification attempts allowed']
  },
  
  // IP address for security
  ipAddress: {
    type: String,
    trim: true
  },
  
  // User agent for security
  userAgent: {
    type: String,
    trim: true
  },
  
  // Verification timestamp
  verifiedAt: {
    type: Date
  },
  
  // Used timestamp (when password was actually reset)
  usedAt: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.otp; // Never expose OTP in JSON
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes for better performance
passwordResetSchema.index({ userId: 1, createdAt: -1 });
passwordResetSchema.index({ email: 1, createdAt: -1 });
passwordResetSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

// Virtual for checking if OTP is expired
passwordResetSchema.virtual('isExpired').get(function() {
  return new Date() > this.expiresAt;
});

// Virtual for remaining time
passwordResetSchema.virtual('remainingTime').get(function() {
  const remaining = this.expiresAt - new Date();
  return Math.max(0, Math.floor(remaining / 1000)); // seconds
});

// Static method to generate secure OTP
passwordResetSchema.statics.generateOTP = function() {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Static method to create password reset request
passwordResetSchema.statics.createResetRequest = async function(userId, email, ipAddress, userAgent) {
  // Invalidate any existing reset requests for this user
  await this.updateMany(
    { userId, isVerified: false },
    { $set: { expiresAt: new Date() } }
  );
  
  // Generate new OTP
  const otp = this.generateOTP();
  
  // Create new reset request
  const resetRequest = new this({
    userId,
    email,
    otp,
    ipAddress,
    userAgent
  });
  
  return await resetRequest.save();
};

// Instance method to verify OTP
passwordResetSchema.methods.verifyOTP = async function(inputOTP) {
  // Check if already verified
  if (this.isVerified) {
    throw new Error('OTP has already been verified');
  }
  
  // Check if expired
  if (this.isExpired) {
    throw new Error('OTP has expired');
  }
  
  // Check attempts limit
  if (this.attempts >= 3) {
    throw new Error('Maximum verification attempts exceeded');
  }
  
  // Increment attempts
  this.attempts += 1;
  
  // Check OTP
  if (this.otp !== inputOTP) {
    await this.save();
    throw new Error(`Invalid OTP. ${3 - this.attempts} attempts remaining.`);
  }
  
  // Mark as verified
  this.isVerified = true;
  this.verifiedAt = new Date();
  
  return await this.save();
};

// Instance method to mark as used
passwordResetSchema.methods.markAsUsed = async function() {
  if (!this.isVerified) {
    throw new Error('OTP must be verified before use');
  }
  
  if (this.usedAt) {
    throw new Error('Reset token has already been used');
  }
  
  this.usedAt = new Date();
  return await this.save();
};

// Static method to cleanup expired requests
passwordResetSchema.statics.cleanupExpired = async function() {
  const result = await this.deleteMany({
    expiresAt: { $lt: new Date() }
  });
  
  return result.deletedCount;
};

// Static method to get reset statistics
passwordResetSchema.statics.getResetStats = async function(startDate = null, endDate = null) {
  const matchStage = {};
  
  if (startDate && endDate) {
    matchStage.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }
  
  const stats = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalRequests: { $sum: 1 },
        verifiedRequests: {
          $sum: { $cond: [{ $eq: ['$isVerified', true] }, 1, 0] }
        },
        usedRequests: {
          $sum: { $cond: [{ $ne: ['$usedAt', null] }, 1, 0] }
        },
        expiredRequests: {
          $sum: { $cond: [{ $lt: ['$expiresAt', new Date()] }, 1, 0] }
        },
        avgAttempts: { $avg: '$attempts' }
      }
    }
  ]);
  
  return stats[0] || {
    totalRequests: 0,
    verifiedRequests: 0,
    usedRequests: 0,
    expiredRequests: 0,
    avgAttempts: 0
  };
};

// Pre-save middleware to validate expiry time
passwordResetSchema.pre('save', function(next) {
  if (this.isNew && this.expiresAt <= new Date()) {
    return next(new Error('Expiry time must be in the future'));
  }
  next();
});

module.exports = mongoose.model('PasswordReset', passwordResetSchema);