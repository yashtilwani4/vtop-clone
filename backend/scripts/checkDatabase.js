const mongoose = require('mongoose');
const SimpleUser = require('../models/SimpleUser');

async function checkDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vtop_portal');
    console.log('✅ Connected to MongoDB');

    // Check database name
    console.log('📊 Database:', mongoose.connection.db.databaseName);

    // Count users
    const userCount = await SimpleUser.countDocuments();
    console.log('👥 Total users:', userCount);

    // Find admin user
    const adminUser = await SimpleUser.findOne({ email: 'admin@vitbhopal.ac.in' });
    console.log('👤 Admin user:', adminUser ? {
      id: adminUser._id,
      name: adminUser.name,
      email: adminUser.email,
      role: adminUser.role,
      hasPassword: !!adminUser.password
    } : 'Not found');

    // List all users
    const allUsers = await SimpleUser.find({}).select('name email role registrationNumber');
    console.log('📋 All users:');
    allUsers.forEach(user => {
      console.log(`  - ${user.name} (${user.email}) - ${user.role} ${user.registrationNumber || ''}`);
    });

    // Test findByEmailOrRegNumber
    const foundUser = await SimpleUser.findByEmailOrRegNumber('admin@vitbhopal.ac.in');
    console.log('🔍 Found by email:', foundUser ? {
      id: foundUser._id,
      email: foundUser.email,
      hasPassword: !!foundUser.password
    } : 'Not found');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

checkDatabase();