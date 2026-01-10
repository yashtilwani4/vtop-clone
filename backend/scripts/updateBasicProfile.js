const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const SimpleUser = require('../models/SimpleUser');

const updateBasicProfile = async () => {
  try {
    console.log('👤 Updating basic student profile...');

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

    // Update only basic fields that definitely exist in the model
    const updatedData = {
      name: 'Neha Ajay Babel', // Update full name
      email: 'neha.24bcy10007@vitbhopal.ac.in', // Keep existing email
      registrationNumber: '24BCY10007', // Keep existing
      role: 'student' // Keep existing role
    };

    // Update the student record with basic validation
    const updatedStudent = await SimpleUser.findByIdAndUpdate(
      student._id,
      { $set: updatedData },
      { new: true, runValidators: true }
    );

    console.log('✅ Basic profile updated successfully!');
    console.log('📊 Updated Information:');
    console.log(`   Full Name: ${updatedStudent.name}`);
    console.log(`   Email: ${updatedStudent.email}`);
    console.log(`   Registration Number: ${updatedStudent.registrationNumber}`);
    console.log(`   Role: ${updatedStudent.role}`);

    return {
      success: true,
      message: 'Basic student profile updated successfully',
      data: {
        studentId: updatedStudent._id,
        name: updatedStudent.name,
        email: updatedStudent.email,
        registrationNumber: updatedStudent.registrationNumber,
        role: updatedStudent.role,
        createdAt: updatedStudent.createdAt,
        updatedAt: updatedStudent.updatedAt
      }
    };

  } catch (error) {
    console.error('❌ Error updating basic profile:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log('📊 Database connection closed');
  }
};

// Export for use in other files
module.exports = updateBasicProfile;

// Run directly if this file is executed
if (require.main === module) {
  updateBasicProfile()
    .then((result) => {
      console.log('🎉 Basic profile update completed!');
      console.log(`Updated: ${result.data.name}`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Basic profile update failed:', error);
      process.exit(1);
    });
}