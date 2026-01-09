const mongoose = require('mongoose');
const SimpleUser = require('../models/SimpleUser');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

const checkUsers = async () => {
  try {
    const users = await SimpleUser.find({});
    console.log('📋 All users in database:');
    users.forEach(user => {
      console.log(`  - ID: ${user._id}`);
      console.log(`    Name: ${user.name}`);
      console.log(`    Email: ${user.email}`);
      console.log(`    Role: ${user.role}`);
      console.log(`    Reg No: ${user.registrationNumber || 'N/A'}`);
      console.log('');
    });
    
    // Check specific user
    const student = await SimpleUser.findOne({ registrationNumber: '24BCY10007' });
    if (student) {
      console.log('🎓 Student 24BCY10007 found:');
      console.log(`  - ID: ${student._id}`);
      console.log(`  - Name: ${student.name}`);
      console.log(`  - Email: ${student.email}`);
    } else {
      console.log('❌ Student 24BCY10007 not found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

checkUsers();