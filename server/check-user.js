const mongoose = require('mongoose');
const User = require('./models/User');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/class_scheduling', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function checkUser() {
  try {
    console.log('Checking users in database...');
    const users = await User.find({});
    console.log('Users found:', users.length);
    users.forEach(user => {
      console.log(`- ${user.username} (${user.email}) - Role: ${user.role}`);
    });
    
    const adminUser = await User.findOne({ email: 'admin@timetable.com' });
    if (adminUser) {
      console.log('\nAdmin user found:', {
        id: adminUser._id,
        username: adminUser.username,
        email: adminUser.email,
        hasResetToken: !!adminUser.passwordResetToken,
        resetTokenExpires: adminUser.passwordResetExpires
      });
    } else {
      console.log('\nAdmin user not found!');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

checkUser();
