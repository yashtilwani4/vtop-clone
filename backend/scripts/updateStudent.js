const mongoose = require('mongoose');
const SimpleUser = require('../models/SimpleUser');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

const updateStudent = async () => {
  try {
    console.log('🔄 Updating student information...');
    
    // Find the student with registration number 24BCY10007
    const student = await SimpleUser.findOne({ registrationNumber: '24BCY10007' });
    
    if (!student) {
      console.log('❌ Student with registration number 24BCY10007 not found');
      return;
    }
    
    console.log('📋 Current student info:');
    console.log(`  - Name: ${student.name}`);
    console.log(`  - Email: ${student.email}`);
    console.log(`  - Registration: ${student.registrationNumber}`);
    
    // Update the student information
    student.name = 'Neha Ajay Babel';
    student.email = 'neha.24bcy10007@vitbhopal.ac.in';
    student.password = 'nehababel@2026'; // This will be automatically hashed by the pre-save middleware
    
    await student.save();
    
    console.log('✅ Student information updated successfully!');
    console.log('📋 New student info:');
    console.log(`  - Name: ${student.name}`);
    console.log(`  - Email: ${student.email}`);
    console.log(`  - Registration: ${student.registrationNumber}`);
    console.log(`  - Password: nehababel@2026`);
    
    console.log('\n🔑 New Login Credentials:');
    console.log('Email: neha.24bcy10007@vitbhopal.ac.in / nehababel@2026');
    console.log('Registration: 24BCY10007 / nehababel@2026');
    
  } catch (error) {
    console.error('❌ Error updating student:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

updateStudent();