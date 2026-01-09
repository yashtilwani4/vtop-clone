const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Basic Information
  userId: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  
  // Personal Information
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  dateOfBirth: {
    type: Date
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other']
  },
  phone: {
    type: String,
    trim: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: { type: String, default: 'India' }
  },
  
  // Role and Academic Information
  role: {
    type: String,
    enum: ['student', 'faculty', 'admin'],
    required: true
  },
  department: {
    type: String,
    required: true
  },
  
  // Student-specific fields
  registrationNumber: {
    type: String,
    sparse: true, // Only for students
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
  batch: {
    type: String // e.g., "2023-2027"
  },
  semester: {
    type: Number,
    min: 1,
    max: 8
  },
  program: {
    type: String // e.g., "B.Tech", "M.Tech", "MBA"
  },
  
  // Faculty-specific fields
  employeeId: {
    type: String,
    sparse: true // Only for faculty
  },
  designation: {
    type: String // e.g., "Professor", "Associate Professor"
  },
  specialization: {
    type: String
  },
  
  // Profile and Status
  profilePicture: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  
  // Academic Records (for students)
  enrolledCourses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  }],
  
  // Teaching Assignments (for faculty)
  assignedCourses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  }]
}, {
  timestamps: true
});

// Indexes for better performance (removed duplicates)
userSchema.index({ role: 1, department: 1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Generate registration number for students
userSchema.statics.generateRegistrationNumber = function(batch, branch) {
  // Format: YYBBB##### where YY=batch, BBB=branch, #####=sequential number
  const batchYear = batch.toString().slice(-2); // Last 2 digits of year
  const branchCode = branch.toUpperCase().slice(0, 3); // First 3 letters of branch
  
  // Generate a random 5-digit number for now (in production, this should be sequential)
  const studentCode = Math.floor(10000 + Math.random() * 90000).toString();
  
  return `${batchYear}${branchCode}${studentCode}`;
};

// Parse registration number to extract batch and branch
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

// Generate user ID based on role
userSchema.statics.generateUserId = async function(role, department) {
  const currentYear = new Date().getFullYear();
  let prefix;
  
  switch (role) {
    case 'student':
      prefix = `${currentYear}${department.substring(0, 3).toUpperCase()}`;
      break;
    case 'faculty':
      prefix = `FAC${department.substring(0, 3).toUpperCase()}`;
      break;
    case 'admin':
      prefix = 'ADM';
      break;
    default:
      prefix = 'USR';
  }
  
  // Find the last user with this prefix
  const lastUser = await this.findOne(
    { userId: { $regex: `^${prefix}` } },
    {},
    { sort: { userId: -1 } }
  );
  
  let nextNumber = 1;
  if (lastUser) {
    const lastNumber = parseInt(lastUser.userId.replace(prefix, ''));
    nextNumber = lastNumber + 1;
  }
  
  return `${prefix}${nextNumber.toString().padStart(4, '0')}`;
};

// Remove password from JSON output
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

module.exports = mongoose.model('User', userSchema);