const emailService = require('../utils/emailService');

async function testEmailService() {
  console.log('🧪 Testing Email Service...\n');

  try {
    // Test connection
    console.log('1. Testing email service connection...');
    const connectionTest = await emailService.testConnection();
    console.log('✅ Connection test:', connectionTest);
    console.log('');

    // Test OTP email
    console.log('2. Testing OTP email...');
    const otpResult = await emailService.sendOTPEmail(
      'test@example.com',
      '123456',
      'John Doe'
    );
    console.log('✅ OTP email result:', otpResult);
    console.log('');

    // Test confirmation email
    console.log('3. Testing confirmation email...');
    const confirmResult = await emailService.sendPasswordResetConfirmation(
      'test@example.com',
      'John Doe'
    );
    console.log('✅ Confirmation email result:', confirmResult);
    console.log('');

    console.log('🎉 All email service tests completed successfully!');

  } catch (error) {
    console.error('❌ Email service test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testEmailService();
}

module.exports = testEmailService;