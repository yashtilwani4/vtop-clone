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

    // Update student profile with basic information first
    const updatedData = {
      // Personal Information (basic fields that should exist)
      name: 'Neha Ajay Babel', // Full name
      email: 'neha.24bcy10007@vitbhopal.ac.in', // Keep existing email
      registrationNumber: '24BCY10007', // Keep existing
      role: 'student', // Keep existing role
      
      // Try to add new fields if the model supports them
      ...(student.firstName !== undefined && { firstName: 'Neha' }),
      ...(student.middleName !== undefined && { middleName: 'Ajay' }),
      ...(student.lastName !== undefined && { lastName: 'Babel' }),
      ...(student.phone !== undefined && { phone: '9373821859' }), // Without +91 to avoid validation issues
      ...(student.dateOfBirth !== undefined && { dateOfBirth: new Date('2006-09-28') }),
      ...(student.gender !== undefined && { gender: 'Female' }),
      ...(student.department !== undefined && { department: 'School of Artificial Intelligence and Cyber Security (SCAI)' }),
      ...(student.program !== undefined && { program: 'Bachelors of Technology (B.Tech)' }),
      ...(student.batch !== undefined && { batch: '2024' }),
      ...(student.semester !== undefined && { semester: 3 }),
      ...(student.academicYear !== undefined && { academicYear: '2025-26' }),
      ...(student.isActive !== undefined && { isActive: true }),
      ...(student.isVerified !== undefined && { isVerified: true }),
      ...(student.profileCompleted !== undefined && { profileCompleted: true }),
      ...(student.lastUpdated !== undefined && { lastUpdated: new Date() })
    };

    // Update the student record
    const updatedStudent = await SimpleUser.findByIdAndUpdate(
      student._id,
      { $set: updatedData },
      { new: true, runValidators: false } // Disable validators to avoid issues with new fields
    );

    console.log('✅ Student profile updated successfully!');
    console.log('📊 Updated Information:');
    console.log(`   Full Name: ${updatedStudent.name}`);
    console.log(`   Email: ${updatedStudent.email}`);
    console.log(`   Registration Number: ${updatedStudent.registrationNumber}`);

    return {
      success: true,
      message: 'Student profile updated successfully',
      data: {
        studentId: updatedStudent._id,
        name: updatedStudent.name,
        email: updatedStudent.email,
        registrationNumber: updatedStudent.registrationNumber,
        role: updatedStudent.role,
        // Include new fields if they exist
        ...(updatedStudent.firstName && { firstName: updatedStudent.firstName }),
        ...(updatedStudent.middleName && { middleName: updatedStudent.middleName }),
        ...(updatedStudent.lastName && { lastName: updatedStudent.lastName }),
        ...(updatedStudent.phone && { phone: updatedStudent.phone }),
        ...(updatedStudent.dateOfBirth && { dateOfBirth: updatedStudent.dateOfBirth }),
        ...(updatedStudent.gender && { gender: updatedStudent.gender }),
        ...(updatedStudent.department && { department: updatedStudent.department }),
        ...(updatedStudent.program && { program: updatedStudent.program }),
        ...(updatedStudent.batch && { batch: updatedStudent.batch }),
        ...(updatedStudent.semester && { semester: updatedStudent.semester }),
        ...(updatedStudent.academicYear && { academicYear: updatedStudent.academicYear })
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