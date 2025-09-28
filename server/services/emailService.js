const nodemailer = require('nodemailer');

// Create transporter - you can configure this for your email provider
const createTransporter = () => {
  console.log('🔧 Creating email transporter...');
  console.log('🔧 Environment variables check:');
  console.log('🔧 EMAIL_USER:', process.env.EMAIL_USER ? '✅ Set' : '❌ Not set');
  console.log('🔧 EMAIL_PASS:', process.env.EMAIL_PASS ? '✅ Set' : '❌ Not set');
  console.log('🔧 CLIENT_URL:', process.env.CLIENT_URL || '❌ Not set');
  
  const emailUser = process.env.EMAIL_USER || 'your-email@gmail.com';
  const emailPass = process.env.EMAIL_PASS || 'your-app-password';
  
  console.log('🔧 Using email user:', emailUser);
  console.log('🔧 Using email pass:', emailPass ? '***hidden***' : '❌ No password');
  
  // For development/testing, you can use Gmail or any SMTP provider
  // For production, use a proper email service like SendGrid, AWS SES, etc.
  
  const transporterConfig = {
    service: 'gmail', // You can change this to your preferred service
    auth: {
      user: emailUser,
      pass: emailPass // Use App Password for Gmail
    }
  };
  
  console.log('🔧 Transporter config:', {
    service: transporterConfig.service,
    auth: {
      user: transporterConfig.auth.user,
      pass: transporterConfig.auth.pass ? '***hidden***' : '❌ No password'
    }
  });
  
  return nodemailer.createTransport(transporterConfig);
};

// Send password reset email
const sendPasswordResetEmail = async (email, resetToken) => {
  console.log('=== EMAIL SERVICE DEBUG ===');
  console.log('📧 Attempting to send password reset email...');
  console.log('📧 Email:', email);
  console.log('🔑 Reset token:', resetToken);
  
  try {
    console.log('📧 Creating email transporter...');
    const transporter = createTransporter();
    console.log('✅ Email transporter created successfully');
    
    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    console.log('🔗 Reset URL:', resetUrl);
    
    const fromEmail = process.env.EMAIL_USER || 'noreply@timetrix.com';
    console.log('📤 From email:', fromEmail);
    console.log('📥 To email:', email);
    
    const mailOptions = {
      from: fromEmail,
      to: email,
      subject: 'Password Reset Request - TimeTrix',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p>You requested a password reset for your TimeTrix account.</p>
          <p>Click the button below to reset your password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p>Or copy and paste this link in your browser:</p>
          <p style="word-break: break-all; color: #666;">${resetUrl}</p>
          <p><strong>This link will expire in 30 minutes.</strong></p>
          <p>If you didn't request this password reset, please ignore this email.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">
            TimeTrix - AI-Powered Timetable Generation System
          </p>
        </div>
      `
    };

    console.log('📧 Mail options prepared:', {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject,
      htmlLength: mailOptions.html.length
    });

    console.log('📧 Sending email...');
    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Password reset email sent successfully!');
    console.log('📧 Message ID:', result.messageId);
    console.log('📧 Response:', result.response);
    console.log('=== EMAIL SENT SUCCESSFULLY ===');
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.log('❌ ERROR sending password reset email:');
    console.error('❌ Error details:', error);
    console.log('❌ Error message:', error.message);
    console.log('❌ Error code:', error.code);
    console.log('❌ Error response:', error.response);
    console.log('=== EMAIL SENDING FAILED ===');
    return { success: false, error: error.message };
  }
};

// Send welcome email (optional)
const sendWelcomeEmail = async (email, username) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_USER || 'noreply@timetrix.com',
      to: email,
      subject: 'Welcome to TimeTrix!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Welcome to TimeTrix!</h2>
          <p>Hello ${username},</p>
          <p>Your account has been successfully created. You can now start generating optimized timetables using our AI-powered system.</p>
          <p>Login to your account and explore the features:</p>
          <ul>
            <li>Create and manage batches</li>
            <li>Assign faculty to subjects</li>
            <li>Set up classrooms and constraints</li>
            <li>Generate conflict-free timetables</li>
            <li>Save and manage multiple timetables</li>
          </ul>
          <p>If you have any questions, feel free to contact our support team.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">
            TimeTrix - AI-Powered Timetable Generation System
          </p>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Welcome email sent:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendPasswordResetEmail,
  sendWelcomeEmail
};
