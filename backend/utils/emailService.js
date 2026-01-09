const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  // Initialize email transporter
  initializeTransporter() {
    // In production, use actual SMTP settings
    // For development, we'll use a mock implementation
    if (process.env.NODE_ENV === 'production') {
      this.transporter = nodemailer.createTransporter({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });
    } else {
      // Mock transporter for development
      this.transporter = {
        sendMail: async (mailOptions) => {
          console.log('📧 Mock Email Sent:');
          console.log('To:', mailOptions.to);
          console.log('Subject:', mailOptions.subject);
          console.log('Content:', mailOptions.text || mailOptions.html);
          console.log('---');
          
          return {
            messageId: 'mock-message-id-' + Date.now(),
            accepted: [mailOptions.to],
            rejected: []
          };
        }
      };
    }
  }

  // Send OTP email
  async sendOTPEmail(email, otp, userName = 'User') {
    const subject = 'VTOP - Password Reset OTP';
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset OTP</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8fafc;
          }
          .container {
            background: white;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
            color: white;
            width: 80px;
            height: 80px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            font-weight: bold;
            margin: 0 auto 20px;
          }
          .title {
            color: #1e3c72;
            font-size: 24px;
            font-weight: 600;
            margin: 0;
          }
          .subtitle {
            color: #64748b;
            font-size: 16px;
            margin: 8px 0 0;
          }
          .otp-section {
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            border-radius: 8px;
            padding: 30px;
            text-align: center;
            margin: 30px 0;
            border: 2px dashed #cbd5e1;
          }
          .otp-label {
            color: #475569;
            font-size: 14px;
            font-weight: 500;
            margin-bottom: 10px;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .otp-code {
            font-size: 36px;
            font-weight: bold;
            color: #1e3c72;
            letter-spacing: 8px;
            font-family: 'Courier New', monospace;
            margin: 10px 0;
          }
          .otp-validity {
            color: #ef4444;
            font-size: 14px;
            font-weight: 500;
          }
          .instructions {
            background: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 20px;
            margin: 30px 0;
            border-radius: 0 8px 8px 0;
          }
          .instructions h3 {
            color: #92400e;
            margin: 0 0 10px;
            font-size: 16px;
          }
          .instructions ul {
            margin: 0;
            padding-left: 20px;
            color: #78350f;
          }
          .instructions li {
            margin: 5px 0;
          }
          .security-notice {
            background: #fee2e2;
            border: 1px solid #fecaca;
            border-radius: 8px;
            padding: 20px;
            margin: 30px 0;
          }
          .security-notice h3 {
            color: #dc2626;
            margin: 0 0 10px;
            font-size: 16px;
          }
          .security-notice p {
            color: #991b1b;
            margin: 0;
            font-size: 14px;
          }
          .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 30px;
            border-top: 1px solid #e2e8f0;
          }
          .footer p {
            color: #64748b;
            font-size: 14px;
            margin: 5px 0;
          }
          .contact-info {
            background: #f1f5f9;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
            text-align: center;
          }
          .contact-info h3 {
            color: #334155;
            margin: 0 0 10px;
            font-size: 16px;
          }
          .contact-info p {
            color: #64748b;
            margin: 5px 0;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">VIT</div>
            <h1 class="title">Password Reset Request</h1>
            <p class="subtitle">VTOP - VIT on TOP</p>
          </div>

          <p>Dear ${userName},</p>
          
          <p>We received a request to reset your password for your VTOP account. Please use the following One-Time Password (OTP) to proceed with resetting your password.</p>

          <div class="otp-section">
            <div class="otp-label">Your OTP Code</div>
            <div class="otp-code">${otp}</div>
            <div class="otp-validity">⏰ Valid for 10 minutes only</div>
          </div>

          <div class="instructions">
            <h3>📋 Instructions:</h3>
            <ul>
              <li>Enter this OTP on the password reset page</li>
              <li>The OTP is valid for <strong>10 minutes</strong> from the time of this email</li>
              <li>You have <strong>3 attempts</strong> to enter the correct OTP</li>
              <li>After verification, you can set a new password</li>
            </ul>
          </div>

          <div class="security-notice">
            <h3>🔒 Security Notice</h3>
            <p>If you did not request this password reset, please ignore this email and contact our support team immediately. Your account security is important to us.</p>
          </div>

          <div class="contact-info">
            <h3>Need Help?</h3>
            <p>If you're having trouble with the password reset process:</p>
            <p>📧 Email: support@vitbhopal.ac.in</p>
            <p>📞 Phone: +91-755-2970100</p>
            <p>🕒 Support Hours: 9:00 AM - 6:00 PM (Mon-Fri)</p>
          </div>

          <div class="footer">
            <p><strong>VIT Bhopal University</strong></p>
            <p>Kotri Kalan, Near Indore, Madhya Pradesh - 466114</p>
            <p>This is an automated email. Please do not reply to this message.</p>
            <p>&copy; 2024 VIT Bhopal. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
Dear ${userName},

We received a request to reset your password for your VTOP account.

Your OTP Code: ${otp}
Valid for: 10 minutes only

Instructions:
1. Enter this OTP on the password reset page
2. The OTP is valid for 10 minutes from the time of this email
3. You have 3 attempts to enter the correct OTP
4. After verification, you can set a new password

Security Notice:
If you did not request this password reset, please ignore this email and contact our support team immediately.

Need Help?
Email: support@vitbhopal.ac.in
Phone: +91-755-2970100
Support Hours: 9:00 AM - 6:00 PM (Mon-Fri)

VIT Bhopal University
Kotri Kalan, Near Indore, Madhya Pradesh - 466114

This is an automated email. Please do not reply to this message.
© 2024 VIT Bhopal. All rights reserved.
    `;

    const mailOptions = {
      from: process.env.SMTP_FROM || 'VTOP <noreply@vitbhopal.ac.in>',
      to: email,
      subject: subject,
      text: textContent,
      html: htmlContent
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ OTP email sent successfully:', result.messageId);
      return {
        success: true,
        messageId: result.messageId,
        accepted: result.accepted,
        rejected: result.rejected
      };
    } catch (error) {
      console.error('❌ Failed to send OTP email:', error);
      throw new Error('Failed to send OTP email. Please try again later.');
    }
  }

  // Send password reset confirmation email
  async sendPasswordResetConfirmation(email, userName = 'User') {
    const subject = 'VTOP - Password Reset Successful';
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset Successful</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8fafc;
          }
          .container {
            background: white;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .success-icon {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            width: 80px;
            height: 80px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 36px;
            margin: 0 auto 20px;
          }
          .title {
            color: #10b981;
            font-size: 24px;
            font-weight: 600;
            margin: 0;
          }
          .subtitle {
            color: #64748b;
            font-size: 16px;
            margin: 8px 0 0;
          }
          .success-message {
            background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
            border: 1px solid #a7f3d0;
            border-radius: 8px;
            padding: 30px;
            text-align: center;
            margin: 30px 0;
          }
          .timestamp {
            color: #374151;
            font-size: 14px;
            margin-top: 20px;
          }
          .security-tips {
            background: #f0f9ff;
            border-left: 4px solid #0ea5e9;
            padding: 20px;
            margin: 30px 0;
            border-radius: 0 8px 8px 0;
          }
          .security-tips h3 {
            color: #0c4a6e;
            margin: 0 0 15px;
            font-size: 16px;
          }
          .security-tips ul {
            margin: 0;
            padding-left: 20px;
            color: #0f172a;
          }
          .security-tips li {
            margin: 8px 0;
          }
          .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 30px;
            border-top: 1px solid #e2e8f0;
          }
          .footer p {
            color: #64748b;
            font-size: 14px;
            margin: 5px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="success-icon">✓</div>
            <h1 class="title">Password Reset Successful</h1>
            <p class="subtitle">VTOP - VIT on TOP</p>
          </div>

          <p>Dear ${userName},</p>
          
          <div class="success-message">
            <h2 style="color: #10b981; margin: 0 0 15px;">🎉 Password Updated Successfully!</h2>
            <p style="margin: 0; color: #374151;">Your VTOP account password has been reset successfully. You can now log in with your new password.</p>
            <div class="timestamp">
              <strong>Reset completed on:</strong> ${new Date().toLocaleString('en-IN', { 
                timeZone: 'Asia/Kolkata',
                dateStyle: 'full',
                timeStyle: 'medium'
              })}
            </div>
          </div>

          <div class="security-tips">
            <h3>🔐 Security Tips for Your Account:</h3>
            <ul>
              <li><strong>Use a strong password:</strong> Include uppercase, lowercase, numbers, and special characters</li>
              <li><strong>Keep it unique:</strong> Don't reuse passwords from other accounts</li>
              <li><strong>Enable two-factor authentication:</strong> Add an extra layer of security when available</li>
              <li><strong>Log out from shared devices:</strong> Always sign out when using public computers</li>
              <li><strong>Monitor your account:</strong> Report any suspicious activity immediately</li>
            </ul>
          </div>

          <p>If you did not perform this password reset, please contact our support team immediately at <strong>support@vitbhopal.ac.in</strong> or call <strong>+91-755-2970100</strong>.</p>

          <div class="footer">
            <p><strong>VIT Bhopal University</strong></p>
            <p>Kotri Kalan, Near Indore, Madhya Pradesh - 466114</p>
            <p>This is an automated email. Please do not reply to this message.</p>
            <p>&copy; 2024 VIT Bhopal. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
Dear ${userName},

Password Reset Successful!

Your VTOP account password has been reset successfully. You can now log in with your new password.

Reset completed on: ${new Date().toLocaleString('en-IN', { 
  timeZone: 'Asia/Kolkata',
  dateStyle: 'full',
  timeStyle: 'medium'
})}

Security Tips:
- Use a strong password with uppercase, lowercase, numbers, and special characters
- Keep it unique and don't reuse passwords from other accounts
- Enable two-factor authentication when available
- Log out from shared devices
- Monitor your account and report suspicious activity

If you did not perform this password reset, please contact our support team immediately:
Email: support@vitbhopal.ac.in
Phone: +91-755-2970100

VIT Bhopal University
Kotri Kalan, Near Indore, Madhya Pradesh - 466114

This is an automated email. Please do not reply to this message.
© 2024 VIT Bhopal. All rights reserved.
    `;

    const mailOptions = {
      from: process.env.SMTP_FROM || 'VTOP <noreply@vitbhopal.ac.in>',
      to: email,
      subject: subject,
      text: textContent,
      html: htmlContent
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Password reset confirmation email sent:', result.messageId);
      return {
        success: true,
        messageId: result.messageId
      };
    } catch (error) {
      console.error('❌ Failed to send confirmation email:', error);
      // Don't throw error for confirmation email failure
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Test email configuration
  async testConnection() {
    try {
      if (process.env.NODE_ENV === 'production') {
        await this.transporter.verify();
        console.log('✅ Email service connection verified');
        return { success: true };
      } else {
        console.log('✅ Mock email service ready');
        return { success: true, mock: true };
      }
    } catch (error) {
      console.error('❌ Email service connection failed:', error);
      return { success: false, error: error.message };
    }
  }
}

// Export singleton instance
module.exports = new EmailService();