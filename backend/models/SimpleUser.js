const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Name field
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long'],
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  
  // Email field
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      'Please provide a valid email address'
    ]
  },
  
  // Password field
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long'],
    select: false // Don't include password in queries by default
  },
  
  // Role field
  role: {
    type: String,
    required: [true, 'Role is required'],
    enum: {
      values: ['student', 'faculty', 'admin'],
      message: 'Role must be either student, faculty, or admin'
    },
    default: 'student'
  },
  
  // Registration number field
  registrationNumber: {
    type: String,
    required: function() {
      return this.role === 'student';
    },
    unique: true,
    sparse: true, // Allows null values but ensures uniqueness when present
    uppercase: true,
    trim: true,
    validate: {
      validator: function(v) {
        // Only validate if user is a student and registrationNumber is provided
        if (this.role === 'student' && v) {
          // Format: YYBBB##### (e.g., 22BCE10405, 24BCY10007)
          return /^[0-9]{2}[A-Z]{3}[0-9]{5}$/.test(v);
        }
        return true;
      },
      message: 'Registration number must be in format YYBBB##### (e.g., 22BCE10405)'
    }
  },
  
  // Additional personal information fields
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
    match: [
      /^(\+91|91)?[6-9]\d{9}$/,
      'Please provide a valid Indian phone number'
    ]
  },
  
  dateOfBirth: {
    type: Date,
    validate: {
      validator: function(v) {
        if (!v) return true; // Optional field
        const today = new Date();
        const age = today.getFullYear() - v.getFullYear();
        return age >= 16 && age <= 100; // Reasonable age range
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
  
  // Academic information fields
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
  
  semester: {
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
  
  // Profile completion status
  profileCompleted: {
    type: Boolean,
    default: false
  },
  
  // Account status fields
  isActive: {
    type: Boolean,
    default: true
  },
  
  isVerified: {
    type: Boolean,
    default: false
  },
  
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  
  // Created at field (automatically managed by timestamps)
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  // Enable automatic timestamps
  timestamps: true, // This adds createdAt and updatedAt automatically
  
  // JSON transform to remove sensitive data
  toJSON: {
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes for better performance (removed duplicates since unique: true creates indexes)
userSchema.index({ role: 1 });
userSchema.index({ createdAt: -1 });

// Virtual for getting user's display name
userSchema.virtual('displayName').get(function() {
  return this.name;
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();
  
  try {
    // Hash password with cost of 12
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

// Static method to find user by email or registration number
userSchema.statics.findByEmailOrRegNumber = function(identifier) {
  return this.findOne({
    $or: [
      { email: identifier.toLowerCase() },
      { registrationNumber: identifier.toUpperCase() }
    ]
  }).select('+password'); // Include password for authentication
};

// Static method to generate registration number
userSchema.statics.generateRegistrationNumber = function(batch, branch) {
  // Format: YYBBB##### where YY=batch, BBB=branch, #####=sequential number
  const batchYear = batch.toString().slice(-2); // Last 2 digits of year
  const branchCode = branch.toUpperCase().slice(0, 3); // First 3 letters of branch
  
  // Generate a random 5-digit number (in production, use sequential numbering)
  const studentCode = Math.floor(10000 + Math.random() * 90000).toString();
  
  return `${batchYear}${branchCode}${studentCode}`;
};

// Static method to parse registration number
userSchema.statics.parseRegistrationNumber = function(registrationNumber) {
  if (!registrationNumber || !/^[0-9]{2}[A-Z]{3}[0-9]{5}$/.test(registrationNumber)) {
    return null;
  }
  
  const batch = registrationNumber.slice(0, 2);
  const branch = registrationNumber.slice(2, 5);
  const studentCode = registrationNumber.slice(5);
  
  return {
    batch: `20${batch}`, // Convert YY to 20YY
    branch,
    studentCode,
    fullBatch: `20${batch}-${parseInt(batch) + 4}` // e.g., 2022-2026
  };
};

// Pre-validate middleware for registration number
userSchema.pre('validate', function(next) {
  // Auto-generate registration number for students if not provided
  if (this.role === 'student' && !this.registrationNumber) {
    const currentYear = new Date().getFullYear();
    // Extract department from email or use default
    const emailParts = this.email.split('@')[0];
    const department = emailParts.includes('cse') ? 'CSE' : 
                     emailParts.includes('ece') ? 'ECE' : 
                     emailParts.includes('mech') ? 'MEC' : 'GEN';
    
    this.registrationNumber = this.constructor.generateRegistrationNumber(currentYear, department);
  }
  
  next();
});

// Export the model
module.exports = mongoose.model('SimpleUser', userSchema);