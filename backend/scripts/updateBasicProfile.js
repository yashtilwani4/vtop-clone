const mongoose = require('mongoose');
const SimpleUser = require('../models/SimpleUser');

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

// Update student profile with basic information only
const updateBasicProfile = async () => {
  try {
    await connectDB();
    
    const registrationNumber = '24BCY10007';
    
    // Find the student
    const student = await SimpleUser.findOne({ registrationNumber });
    
    if (!student) {
      console.log('Student not found with registration number:', registrationNumber);
      return;
    }
    
    console.log('Current student data:', {
      name: student.name,
      email: student.email,
      registrationNumber: student.registrationNumber,
      role: student.role
    });
    
    // Update only the name field (which already exists in the model)
    const updatedName = 'Neha Ajay Babel';
    
    if (student.name !== updatedName) {
      student.name = updatedName;
      await student.save();
      console.log('✅ Updated student name to:', updatedName);
    } else {
      console.log('✅ Student name is already correct:', student.name);
    }
    
    // Verify the update
    const updatedStudent = await SimpleUser.findOne({ registrationNumber });
    console.log('Updated student data:', {
      name: updatedStudent.name,
      email: updatedStudent.email,
      registrationNumber: updatedStudent.registrationNumber,
      role: updatedStudent.role,
      updatedAt: updatedStudent.updatedAt
    });
    
    console.log('✅ Basic profile update completed successfully');
    
  } catch (error) {
    console.error('❌ Error updating basic profile:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
};

// Run the update
if (require.main === module) {
  updateBasicProfile();
}

module.exports = { updateBasicProfile };