const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const SimpleUser = require('../models/SimpleUser');

const updateStudentProfile = async () => {
  try {
    console.log('👤 Updating student profile information...');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('📊 Connected to MongoDB');

    // Find the student by registration number
    const student = await SimpleUser.findOne({ registrationNumber: '24BCY10007' });
    if (!student) {
      throw new Error('Student not found with registration number 24BCY10007');
    }

    console.log('📝 Current student data:');
    console.log(`   Name: ${student.name}`);
    console.log(`   Email: ${student.email}`);
    console.log(`   Registration: ${student.registrationNumber}`);

    // Update student profile with complete information
    const updatedData = {
      // Personal Information
      name: 'Neha Ajay Babel', // Full name
      firstName: 'Neha',
      middleName: 'Ajay', 
      lastName: 'Babel',
      email: 'neha.24bcy10007@vitbhopal.ac.in', // Keep existing email
      phone: '+91 9373821859',
      dateOfBirth: new Date('2006-09-28'), // 28 September 2006
      gender: 'Female',
      
      // Academic Information
      registrationNumber: '24BCY10007', // Keep existing
      department: 'School of Artificial Intelligence and Cyber Security (SCAI)',
      program: 'Bachelors of Technology (B.Tech)',
      batch: '2024',
      semester: 3, // Currently in 3rd semester
      academicYear: '2025-26',
      
      // Additional fields
      role: 'student', // Keep existing role
      isActive: true,
      isVerified: true,
      
      // Profile completion
      profileCompleted: true,
      lastUpdated: new Date()
    };

    // Update the student record
    const updatedStudent = await SimpleUser.findByIdAndUpdate(
      student._id,
      { $set: updatedData },
      { new: true, runValidators: true }
    );

    console.log('✅ Student profile updated successfully!');
    console.log('📊 Updated Information:');
    console.log(`   Full Name: ${updatedStudent.firstName} ${updatedStudent.middleName} ${updatedStudent.lastName}`);
    console.log(`   Email: ${updatedStudent.email}`);
    console.log(`   Phone: ${updatedStudent.phone}`);
    console.log(`   Date of Birth: ${updatedStudent.dateOfBirth?.toDateString()}`);
    console.log(`   Gender: ${updatedStudent.gender}`);
    console.log(`   Department: ${updatedStudent.department}`);
    console.log(`   Program: ${updatedStudent.program}`);
    console.log(`   Batch: ${updatedStudent.batch}`);
    console.log(`   Current Semester: ${updatedStudent.semester}`);
    console.log(`   Registration Number: ${updatedStudent.registrationNumber}`);

    return {
      success: true,
      message: 'Student profile updated successfully',
      data: {
        studentId: updatedStudent._id,
        name: updatedStudent.name,
        firstName: updatedStudent.firstName,
        middleName: updatedStudent.middleName,
        lastName: updatedStudent.lastName,
        email: updatedStudent.email,
        phone: updatedStudent.phone,
        dateOfBirth: updatedStudent.dateOfBirth,
        gender: updatedStudent.gender,
        registrationNumber: updatedStudent.registrationNumber,
        department: updatedStudent.department,
        program: updatedStudent.program,
        batch: updatedStudent.batch,
        semester: updatedStudent.semester,
        academicYear: updatedStudent.academicYear,
        profileCompleted: updatedStudent.profileCompleted
      }
    };

  } catch (error) {
    console.error('❌ Error updating student profile:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log('📊 Database connection closed');
  }
};

// Export for use in other files
module.exports = updateStudentProfile;

// Run directly if this file is executed
if (require.main === module) {
  updateStudentProfile()
    .then((result) => {
      console.log('🎉 Profile update completed!');
      console.log(`Updated: ${result.data.firstName} ${result.data.middleName} ${result.data.lastName}`);
      console.log(`Department: ${result.data.department}`);
      console.log(`Program: ${result.data.program}`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Profile update failed:', error);
      process.exit(1);
    });
}