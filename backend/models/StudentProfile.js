const mongoose = require('mongoose');

const studentProfileSchema = new mongoose.Schema({
  // Reference to the user
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SimpleUser',
    required: true,
    unique: true
  },
  
  registrationNumber: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  
  // Personal Information
  firstName: {
    type: String,
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  
  middleName: {
    type: String,
    trim: true,
    maxlength: [50, 'Middle name cannot exceed 50 characters']
  },
  
  lastName: {
    type: String,
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  
  phone: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        if (!v) return true; // Optional field
        // Remove all spaces and special characters except +
        const cleanPhone = v.replace(/[\s\-\(\)]/g, '');
        // Check various Indian phone number formats
        return /^(\+91|91)?[6-9]\d{9}$/.test(cleanPhone);
      },
      message: 'Please provide a valid Indian phone number'
    }
  },
  
  dateOfBirth: {
    type: Date,
    validate: {
      validator: function(v) {
        if (!v) return true; // Optional field
        const today = new Date();
        const birthYear = v.getFullYear();
        const currentYear = today.getFullYear();
        const age = currentYear - birthYear;
        return age >= 16 && age <= 100;
      },
      message: 'Date of birth must indicate age between 16 and 100 years'
    }
  },
  
  gender: {
    type: String,
    enum: {
      values: ['Male', 'Female', 'Other', 'Prefer not to say'],
      message: 'Gender must be Male, Female, Other, or Prefer not to say'
    }
  },
  
  // Academic Information
  department: {
    type: String,
    trim: true,
    maxlength: [200, 'Department name cannot exceed 200 characters']
  },
  
  program: {
    type: String,
    trim: true,
    maxlength: [100, 'Program name cannot exceed 100 characters']
  },
  
  batch: {
    type: String,
    trim: true,
    match: [
      /^20\d{2}$/,
      'Batch must be a 4-digit year (e.g., 2024)'
    ]
  },
  
  currentSemester: {
    type: Number,
    min: [1, 'Semester must be at least 1'],
    max: [8, 'Semester cannot exceed 8']
  },
  
  academicYear: {
    type: String,
    trim: true,
    match: [
      /^20\d{2}-\d{2}$/,
      'Academic year must be in format YYYY-YY (e.g., 2024-25)'
    ]
  },
  
  // Address Information (optional)
  address: {
    street: String,
    city: String,
    state: String,
    pincode: {
      type: String,
      match: [/^\d{6}$/, 'Pincode must be 6 digits']
    },
    country: {
      type: String,
      default: 'India'
    }
  },
  
  // Emergency Contact (optional)
  emergencyContact: {
    name: String,
    relationship: String,
    phone: {
      type: String,
      validate: {
        validator: function(v) {
          if (!v) return true;
          const cleanPhone = v.replace(/[\s\-\(\)]/g, '');
          return /^(\+91|91)?[6-9]\d{9}$/.test(cleanPhone);
        },
        message: 'Please provide a valid emergency contact phone number'
      }
    }
  },
  
  // Profile completion tracking
  profileCompleted: {
    type: Boolean,
    default: false
  },
  
  completionPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(ret) {
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes
studentProfileSchema.index({ userId: 1 });
studentProfileSchema.index({ registrationNumber: 1 });

// Calculate completion percentage before saving
studentProfileSchema.pre('save', function(next) {
  const requiredFields = [
    'firstName', 'lastName', 'phone', 'dateOfBirth', 
    'gender', 'department', 'program', 'batch'
  ];
  
  const optionalFields = [
    'middleName', 'currentSemester', 'academicYear',
    'address.street', 'address.city', 'address.state', 'address.pincode',
    'emergencyContact.name', 'emergencyContact.phone'
  ];
  
  let completedRequired = 0;
  let completedOptional = 0;
  
  // Check required fields
  requiredFields.forEach(field => {
    if (this[field] && this[field].toString().trim()) {
      completedRequired++;
    }
  });
  
  // Check optional fields
  optionalFields.forEach(field => {
    const fieldParts = field.split('.');
    let value = this;
    
    for (const part of fieldParts) {
      value = value ? value[part] : null;
    }
    
    if (value && value.toString().trim()) {
      completedOptional++;
    }
  });
  
  // Calculate percentage (required fields worth 80%, optional 20%)
  const requiredPercentage = (completedRequired / requiredFields.length) * 80;
  const optionalPercentage = (completedOptional / optionalFields.length) * 20;
  
  this.completionPercentage = Math.round(requiredPercentage + optionalPercentage);
  this.profileCompleted = this.completionPercentage >= 80; // 80% threshold
  
  next();
});

// Static method to create or update profile
studentProfileSchema.statics.createOrUpdateProfile = async function(userId, registrationNumber, profileData) {
  try {
    const profile = await this.findOneAndUpdate(
      { userId },
      { 
        userId,
        registrationNumber,
        ...profileData
      },
      { 
        new: true, 
        upsert: true,
        runValidators: true
      }
    );
    
    return profile;
  } catch (error) {
    throw error;
  }
};

// Static method to get profile by registration number
studentProfileSchema.statics.getByRegistrationNumber = function(registrationNumber) {
  return this.findOne({ registrationNumber }).populate('userId', 'name email role');
};

module.exports = mongoose.model('StudentProfile', studentProfileSchema);