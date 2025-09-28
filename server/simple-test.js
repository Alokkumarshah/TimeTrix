const mongoose = require('mongoose');
const User = require('./models/User');
const crypto = require('crypto');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/class_scheduling', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function createTestToken() {
  try {
    console.log('Creating test reset token...');
    
    // Find the admin user
    const user = await User.findOne({ email: 'admin@univ.edu' });
    if (!user) {
      console.log('Admin user not found!');
      return;
    }
    
    console.log('Found user:', user.username, user.email);
    
    // Generate reset token
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 1000 * 60 * 30); // 30 minutes
    
    console.log('Generated token:', token);
    console.log('Token expires at:', expires);
    
    // Save token to user
    user.passwordResetToken = token;
    user.passwordResetExpires = expires;
    await user.save();
    
    console.log('Token saved to user');
    console.log('\n=== TEST RESET LINK ===');
    console.log(`http://localhost:3000/reset-password?token=${token}`);
    console.log('\nCopy this link and open it in your browser to test the reset password flow.');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

createTestToken();
