const mongoose = require('mongoose');
const SimpleUser = require('../models/SimpleUser');
const StudentProfile = require('../models/StudentProfile');

// MongoDB connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vtop-simple');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

// Create student profile with complete information
const createStudentProfile = async () => {
  try {
    await connectDB();
    
    const registrationNumber = '24BCY10007';
    
    // Find the student user
    const student = await SimpleUser.findOne({ registrationNumber });
    
    if (!student) {
      console.log('❌ Student not found with registration number:', registrationNumber);
      return;
    }
    
    console.log('Found student:', {
      name: student.name,
      email: student.email,
      registrationNumber: student.registrationNumber
    });
    
    // Profile data from user requirements
    const profileData = {
      firstName: 'Neha',
      middleName: 'Ajay',
      lastName: 'Babel',
      phone: '+91 9373821859',
      dateOfBirth: new Date('2006-09-28'), // 28 September 2006
      gender: 'Female',
      department: 'School of Artificial Intelligence and Cyber Security (SCAI)',
      program: 'Bachelor of Technology (B.Tech)',
      batch: '2024',
      currentSemester: 3, // Currently in Fall semester (3rd semester)
      academicYear: '2025-26'
    };
    
    // Create or update the profile
    const profile = await StudentProfile.createOrUpdateProfile(
      student._id,
      registrationNumber,
      profileData
    );
    
    console.log('✅ Student profile created/updated successfully:');
    console.log({
      registrationNumber: profile.registrationNumber,
      fullName: `${profile.firstName} ${profile.middleName} ${profile.lastName}`,
      phone: profile.phone,
      dateOfBirth: profile.dateOfBirth.toDateString(),
      gender: profile.gender,
      department: profile.department,
      program: profile.program,
      batch: profile.batch,
      currentSemester: profile.currentSemester,
      academicYear: profile.academicYear,
      completionPercentage: profile.completionPercentage,
      profileCompleted: profile.profileCompleted
    });
    
    // Also update the user's name to match the profile
    if (student.name !== 'Neha Ajay Babel') {
      student.name = 'Neha Ajay Babel';
      await student.save();
      console.log('✅ Updated user name to match profile');
    }
    
    console.log('✅ Profile creation completed successfully');
    
  } catch (error) {
    console.error('❌ Error creating student profile:', error);
    
    if (error.name === 'ValidationError') {
      console.error('Validation errors:');
      Object.values(error.errors).forEach(err => {
        console.error(`- ${err.path}: ${err.message}`);
      });
    }
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
};

// Run the script
if (require.main === module) {
  createStudentProfile();
}

module.exports = { createStudentProfile };