const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');
const { sendPasswordResetEmail, sendWelcomeEmail } = require('./services/emailService');
require('dotenv').config({ path: path.join(__dirname, '.', '.env') });
const app = express();

// CORS configuration
app.use(cors({
  // origin: true, // Allow all origins
  origin: process.env.CLIENT_URL, // Allow all origins
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware (must be before all routes)
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Register routes
app.get('/register', (req, res) => {
  res.render('register');
});

app.post('/register', async (req, res) => {
  const { username, password, name, email, role } = req.body;
  try {
    const existing = await User.findOne({ username });
    if (existing) {
      return res.render('register', { error: 'Username already exists.' });
    }
    const user = new User({ username, password, name, email, role });
    await user.save();
    req.session.userId = user._id;
    res.redirect('/dashboard');
  } catch (err) {
    res.render('register', { error: 'Registration failed. Please try again.' });
  }
});
// Assign subjects to batch routes
app.get('/batch-subjects', async (req, res) => {
  if (!req.session.userId) return res.redirect('/login');
  const batches = await Batch.find();
  const subjects = await Subject.find();
  res.render('batch-subjects', { batches, subjects });
});
app.post('/batch-subjects', async (req, res) => {
  if (!req.session.userId) return res.redirect('/login');
  const batchId = req.body.batch;
  let subjects = req.body.subjects;
  if (!Array.isArray(subjects)) subjects = [subjects];
  await Batch.findByIdAndUpdate(batchId, { $set: { subjects } });
  res.redirect('/batches');
});
// Models (for batch-subjects only)
const Constraint = require('./models/Constraint');
const Batch = require('./models/Batch');
const Subject = require('./models/Subject');
const Classroom = require('./models/Classroom');
const Faculty = require('./models/Faculty');
const User = require('./models/User');

// Helper function to update faculty semestersTaught based on batch assignments
const updateFacultySemestersTaught = async (batch) => {
  try {
    if (!batch.subjectTeacherAssignments || batch.subjectTeacherAssignments.length === 0) {
      return;
    }

    for (const assignment of batch.subjectTeacherAssignments) {
      const faculty = await Faculty.findById(assignment.teacher);
      if (faculty) {
        // Check if this subject-semester combination already exists
        const existingIndex = faculty.semestersTaught.findIndex(st => 
          (st.subject.toString() === assignment.subject.toString()) && 
          (st.semester === batch.semester)
        );

        if (existingIndex === -1) {
          // Add new semester taught entry
          faculty.semestersTaught.push({
            subject: assignment.subject,
            semester: batch.semester
          });
          await faculty.save();
        }
      }
    }
  } catch (error) {
    console.error('Error updating faculty semestersTaught:', error);
  }
};

// Migration function to fix existing data
const migrateExistingData = async () => {
  try {
    console.log('Starting data migration...');
    
    // Fix existing batches - populate teachers from subjectTeacherAssignments
    const batches = await Batch.find().populate('subjectTeacherAssignments.teacher');
    for (const batch of batches) {
      if (batch.subjectTeacherAssignments && batch.subjectTeacherAssignments.length > 0) {
        const teacherIds = batch.subjectTeacherAssignments
          .map(assignment => assignment.teacher._id || assignment.teacher)
          .filter((id, index, self) => self.indexOf(id) === index); // Remove duplicates
        
        if (JSON.stringify(batch.teachers.sort()) !== JSON.stringify(teacherIds.sort())) {
          await Batch.findByIdAndUpdate(batch._id, { teachers: teacherIds });
          console.log(`Updated teachers for batch: ${batch.name}`);
        }
      }
    }
    
    // Fix existing faculty - populate semestersTaught from subjects
    const faculty = await Faculty.find().populate('subjects');
    for (const facultyMember of faculty) {
      if (facultyMember.subjects && facultyMember.subjects.length > 0) {
        const semestersTaught = facultyMember.subjects.map(subject => ({
          subject: subject._id,
          semester: subject.semester
        }));
        
        if (JSON.stringify(facultyMember.semestersTaught) !== JSON.stringify(semestersTaught)) {
          await Faculty.findByIdAndUpdate(facultyMember._id, { semestersTaught });
          console.log(`Updated semestersTaught for faculty: ${facultyMember.name}`);
        }
      }
    }
    
    console.log('Data migration completed successfully!');
  } catch (error) {
    console.error('Error during data migration:', error);
  }
};

// MongoDB connection
const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/class_scheduling';
const mongooseConnection = mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  console.log(mongoUri);
  console.log('MongoDB connected');
  
  // Run data migration on startup
  await migrateExistingData();
  
  return mongoose.connection.getClient();
}).catch(err => {
  console.error('MongoDB connection error:', err);
  throw err;
});

// Middleware (move above all routes)
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');

// Session setup
app.use(session({
  secret: process.env.SESSION_SECRET || 'secret',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ 
    clientPromise: mongooseConnection,
    touchAfter: 24 * 3600, // lazy session update
    ttl: 14 * 24 * 60 * 60 // 14 days
  }),
  cookie: { maxAge: 1000 * 60 * 60 * 24 }
}));

// Routers
const classroomRoutes = require('./routes/classroomRoutes');
const subjectRoutes = require('./routes/subjectRoutes');
const facultyRoutes = require('./routes/facultyRoutes');
const batchRoutes = require('./routes/batchRoutes');
const timetableRoutes = require('./routes/timetableRoutes');
const constraintRoutes = require('./routes/constraintRoutes');
const specialClassRoutes = require('./routes/specialClassRoutes');

app.use('/classrooms', classroomRoutes);
app.use('/subjects', subjectRoutes);
app.use('/faculty', facultyRoutes);
app.use('/batches', batchRoutes);
app.use('/timetable', timetableRoutes);
app.use('/constraints', constraintRoutes);
app.use('/special-classes', specialClassRoutes);

app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

// Login routes
app.get('/login', (req, res) => {
  res.render('login');
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user) {
    return res.render('login', { error: 'Invalid username or password.' });
  }
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return res.render('login', { error: 'Invalid username or password.' });
  }
  req.session.userId = user._id;
  res.redirect('/dashboard');
});

// API login endpoint for React app
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }
    req.session.userId = user._id;
    res.status(200).json({ 
      success: true, 
      message: 'Login successful',
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API register endpoint for React app
app.post('/api/register', async (req, res) => {
  const { username, password, name, email, role } = req.body;
  try {
    const existing = await User.findOne({ username });
    if (existing) {
      return res.status(400).json({ error: 'Username already exists.' });
    }
    const user = new User({ username, password, name, email, role });
    await user.save();
    req.session.userId = user._id;
    res.status(200).json({ 
      success: true, 
      message: 'Registration successful',
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

// Forgot password: request reset token
app.post('/api/password/forgot', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }
  try {
    const user = await User.findOne({ email });
    if (!user) {
      // Always return OK to avoid user enumeration
      return res.json({ success: true, message: 'If that email exists, a reset link has been created.' });
    }
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 1000 * 60 * 30); // 30 minutes
    user.passwordResetToken = token;
    user.passwordResetExpires = expires;
    await user.save();

    // Send password reset email
    const emailResult = await sendPasswordResetEmail(email, token);
    if (emailResult.success) {
      res.json({ success: true, message: 'Password reset link has been sent to your email.' });
    } else {
      // If email fails, still return success to user but log the error
      res.json({ 
        success: true, 
        message: 'Password reset link generated. Check your email or contact support if you don\'t receive it.',
        token: token // Include token as fallback for testing
      });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to process request' });
  }
});

// Test email configuration endpoint
app.get('/api/test-email', async (req, res) => {
  console.log('=== EMAIL CONFIGURATION TEST ===');
  console.log('🔧 Testing email configuration...');
  
  try {
    const { sendPasswordResetEmail } = require('./services/emailService');
    
    // Test with a dummy email
    const testEmail = 'test@example.com';
    const testToken = 'test-token-123';
    
    console.log('📧 Sending test email to:', testEmail);
    const result = await sendPasswordResetEmail(testEmail, testToken);
    
    if (result.success) {
      console.log('✅ Email test successful!');
      res.json({ 
        success: true, 
        message: 'Email configuration is working correctly',
        messageId: result.messageId 
      });
    } else {
      console.log('❌ Email test failed:', result.error);
      res.json({ 
        success: false, 
        message: 'Email configuration failed',
        error: result.error 
      });
    }
  } catch (error) {
    console.log('❌ Email test error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Email test failed',
      error: error.message 
    });
  }
  
  console.log('=== EMAIL CONFIGURATION TEST COMPLETE ===');
});

// Validate password reset token (for frontend validation)
app.post('/api/password/validate-token', async (req, res) => {
  console.log('=== TOKEN VALIDATION REQUEST ===');
  const { token } = req.body;
  console.log('🔑 Token to validate:', token);
  
  try {
    if (!token) {
      console.log('❌ No token provided');
      return res.status(400).json({ error: 'Token is required' });
    }
    
    console.log('🔍 Looking for user with token:', token);
    const user = await User.findOne({ 
      passwordResetToken: token, 
      passwordResetExpires: { $gt: new Date() } 
    });
    
    if (!user) {
      console.log('❌ No valid user found with this token');
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }
    
    console.log('✅ Valid token found for user:', {
      id: user._id,
      username: user.username,
      email: user.email,
      tokenExpires: user.passwordResetExpires
    });
    
    res.json({ success: true });
  } catch (error) {
    console.log('❌ Error validating token:', error);
    res.status(500).json({ error: 'Failed to validate token' });
  }
  
  console.log('=== TOKEN VALIDATION COMPLETE ===');
});

// Reset password using token
app.post('/api/password/reset', async (req, res) => {
  console.log('=== PASSWORD RESET REQUEST ===');
  const { token, password } = req.body;
  console.log('🔑 Token:', token ? '***provided***' : '❌ missing');
  console.log('🔒 Password length:', password ? password.length : 0);
  
  try {
    if (!token || !password) {
      console.log('❌ Missing token or password');
      return res.status(400).json({ error: 'Token and new password are required' });
    }
    
    if (password.length < 6) {
      console.log('❌ Password too short');
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }
    
    console.log('🔍 Looking for user with token...');
    const user = await User.findOne({ 
      passwordResetToken: token, 
      passwordResetExpires: { $gt: new Date() } 
    });
    
    if (!user) {
      console.log('❌ No valid user found with this token');
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }
    
    console.log('✅ Valid user found:', {
      id: user._id,
      username: user.username,
      email: user.email
    });

    user.password = password; // will be hashed by pre-save hook
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    
    console.log('✅ Password reset successful for user:', user.username);
    res.json({ success: true, message: 'Password reset successful. You can now log in with your new password.' });
  } catch (error) {
    console.error('❌ Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password. Please try again.' });
  }
  
  console.log('=== PASSWORD RESET REQUEST COMPLETE ===');
});

// API logout endpoint for React app
app.get('/api/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Could not log out' });
    }
    res.status(200).json({ success: true, message: 'Logged out successfully' });
  });
});

// Dashboard route
app.get('/dashboard', async (req, res) => {
  if (!req.session.userId) return res.redirect('/login');
  const user = await User.findById(req.session.userId);
  res.render('dashboard', { user });
});

// Timetable view route
app.get('/timetable', async (req, res) => {
  if (!req.session.userId) return res.redirect('/login');
  const batches = await Batch.find().populate('classroom teachers');
  res.render('timetable', { timetable: null, batches });
});

app.post('/timetable', async (req, res) => {
  if (!req.session.userId) return res.redirect('/login');
  const batchId = req.body.batchId;
  const batch = await Batch.findById(batchId).populate('classroom teachers subjects');
  // Pass batch info to timetable generator
  const reqMock = { body: { batchId, batch } };
  const resMock = {
    json: (data) => {
      const batchesPromise = Batch.find().populate('classroom teachers');
      batchesPromise.then(batches => {
        res.render('timetable', { timetable: data.timetable, batches, selectedBatch: batch });
      });
    },
    status: () => ({ json: () => Batch.find().populate('classroom teachers').then(batches => res.render('timetable', { timetable: [], batches })) })
  };
  await generateTimetable(reqMock, resMock);
});

// Timetable review route (placeholder)
app.post('/timetable/review', (req, res) => {
  // TODO: Implement review/approval workflow
  res.send('Timetable submitted for review.');
});

// Timetable API
// Remove direct timetable API route; handled by timetableRoutes

// Migration endpoint
app.post('/api/migrate-data', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  try {
    await migrateExistingData();
    res.json({ success: true, message: 'Data migration completed successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to migrate data' });
  }
});

// Force refresh endpoint to ensure all data is properly populated
app.post('/api/refresh-data', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  try {
    console.log('Force refreshing all data...');
    
    // Fix all batches
    const batches = await Batch.find().populate('subjectTeacherAssignments.teacher');
    for (const batch of batches) {
      if (batch.subjectTeacherAssignments && batch.subjectTeacherAssignments.length > 0) {
        const teacherIds = batch.subjectTeacherAssignments
          .map(assignment => assignment.teacher._id || assignment.teacher)
          .filter((id, index, self) => self.indexOf(id) === index);
        
        await Batch.findByIdAndUpdate(batch._id, { teachers: teacherIds });
        console.log(`Updated teachers for batch: ${batch.name}`);
      }
    }
    
    // Fix all faculty
    const faculty = await Faculty.find().populate('subjects');
    for (const facultyMember of faculty) {
      if (facultyMember.subjects && facultyMember.subjects.length > 0) {
        const semestersTaught = facultyMember.subjects.map(subject => ({
          subject: subject._id,
          semester: subject.semester
        }));
        
        await Faculty.findByIdAndUpdate(facultyMember._id, { semestersTaught });
        console.log(`Updated semestersTaught for faculty: ${facultyMember.name}`);
      }
    }
    
    res.json({ 
      success: true, 
      message: 'All data refreshed successfully',
      batchesUpdated: batches.length,
      facultyUpdated: faculty.length
    });
  } catch (error) {
    console.error('Error refreshing data:', error);
    res.status(500).json({ error: 'Failed to refresh data' });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
const SpecialClass = require('./models/SpecialClass');
// Special Classes route
app.post('/special-classes/delete', async (req, res) => {
  if (!req.session.userId) return res.redirect('/login');
  const { id } = req.body;
  await SpecialClass.findByIdAndDelete(id);
  res.redirect('/special-classes');
});
app.get('/special-classes', async (req, res) => {
  if (!req.session.userId) return res.redirect('/login');
  const classes = await SpecialClass.find().populate('subject faculty batch classroom');
  // Format for EJS view
  const specialClasses = classes.map(cls => ({
    name: cls.name,
    subject: cls.subject?.name || '',
    faculty: cls.faculty?.name || '',
    batch: cls.batch?.name || '',
    classroom: cls.classroom?.name || '',
    day: cls.day,
    startTime: cls.startTime,
    endTime: cls.endTime
  }));
  res.render('special-classes', { specialClasses });
});

// Delete faculty route
app.post('/faculty/delete', async (req, res) => {
  if (!req.session.userId) return res.redirect('/login');
  const { id } = req.body;
  await Faculty.findByIdAndDelete(id);
  res.redirect('/faculty');
});

// API Routes for React Frontend
// User API
app.get('/api/user/me', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  try {
    const user = await User.findById(req.session.userId).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Batch API
app.get('/api/batches', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  try {
    const batches = await Batch.find().populate('subjects classrooms teachers');
    res.json(batches);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch batches' });
  }
});

app.post('/api/batches', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  try {
    console.log('Batch creation request body:', JSON.stringify(req.body, null, 2));
    const { subjectTeacherAssignments, ...batchData } = req.body;
    
    // Fix stringified arrays - parse them if they're strings
    if (typeof batchData.subjects === 'string') {
      try {
        batchData.subjects = JSON.parse(batchData.subjects);
      } catch (e) {
        batchData.subjects = [];
      }
    }
    if (typeof batchData.classrooms === 'string') {
      try {
        batchData.classrooms = JSON.parse(batchData.classrooms);
      } catch (e) {
        batchData.classrooms = [];
      }
    }
    if (typeof batchData.teachers === 'string') {
      try {
        batchData.teachers = JSON.parse(batchData.teachers);
      } catch (e) {
        batchData.teachers = [];
      }
    }
    
    // Process subject-teacher assignments
    let processedAssignments = [];
    let allAssignedTeachers = [];
    
    if (subjectTeacherAssignments && typeof subjectTeacherAssignments === 'object') {
      Object.entries(subjectTeacherAssignments).forEach(([subjectId, teacherId]) => {
        if (teacherId && teacherId !== '') {
          // Ensure we're working with string IDs, not objects
          const cleanSubjectId = typeof subjectId === 'string' ? subjectId : subjectId.toString();
          const cleanTeacherId = typeof teacherId === 'string' ? teacherId : teacherId.toString();
          
          processedAssignments.push({ 
            subject: cleanSubjectId, 
            teacher: cleanTeacherId 
          });
          
          if (!allAssignedTeachers.includes(cleanTeacherId)) {
            allAssignedTeachers.push(cleanTeacherId);
          }
        }
      });
    }
    
    // Clean up the batch data to ensure proper types
    const cleanBatchData = {
      ...batchData,
      teachers: allAssignedTeachers,
      subjectTeacherAssignments: processedAssignments,
      // Ensure arrays are properly formatted
      subjects: Array.isArray(batchData.subjects) ? batchData.subjects : [],
      classrooms: Array.isArray(batchData.classrooms) ? batchData.classrooms : []
    };
    
    console.log('Clean batch data:', JSON.stringify(cleanBatchData, null, 2));
    
    const batch = new Batch(cleanBatchData);
    await batch.save();
    
    // Update faculty semestersTaught
    try {
      await updateFacultySemestersTaught(batch);
    } catch (facultyError) {
      console.error('Warning: Failed to update faculty semestersTaught:', facultyError);
      // Don't fail the batch creation if faculty update fails
    }
    
    const populatedBatch = await Batch.findById(batch._id).populate('subjects classrooms teachers');
    res.json(populatedBatch);
  } catch (error) {
    console.error('Batch creation error:', error);
    res.status(500).json({ 
      error: 'Failed to create batch',
      details: error.message 
    });
  }
});

app.put('/api/batches/:id', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  try {
    console.log('Batch update request body:', JSON.stringify(req.body, null, 2));
    const { subjectTeacherAssignments, ...batchData } = req.body;
    
    // Fix stringified arrays - parse them if they're strings
    if (typeof batchData.subjects === 'string') {
      try {
        batchData.subjects = JSON.parse(batchData.subjects);
      } catch (e) {
        batchData.subjects = [];
      }
    }
    if (typeof batchData.classrooms === 'string') {
      try {
        batchData.classrooms = JSON.parse(batchData.classrooms);
      } catch (e) {
        batchData.classrooms = [];
      }
    }
    if (typeof batchData.teachers === 'string') {
      try {
        batchData.teachers = JSON.parse(batchData.teachers);
      } catch (e) {
        batchData.teachers = [];
      }
    }
    
    // Process subject-teacher assignments
    let processedAssignments = [];
    let allAssignedTeachers = [];
    
    if (subjectTeacherAssignments && typeof subjectTeacherAssignments === 'object') {
      Object.entries(subjectTeacherAssignments).forEach(([subjectId, teacherId]) => {
        if (teacherId && teacherId !== '') {
          // Ensure we're working with string IDs, not objects
          const cleanSubjectId = typeof subjectId === 'string' ? subjectId : subjectId.toString();
          const cleanTeacherId = typeof teacherId === 'string' ? teacherId : teacherId.toString();
          
          processedAssignments.push({ 
            subject: cleanSubjectId, 
            teacher: cleanTeacherId 
          });
          
          if (!allAssignedTeachers.includes(cleanTeacherId)) {
            allAssignedTeachers.push(cleanTeacherId);
          }
        }
      });
    }
    
    // Clean up the batch data to ensure proper types
    const cleanBatchData = {
      ...batchData,
      teachers: allAssignedTeachers,
      subjectTeacherAssignments: processedAssignments,
      // Ensure arrays are properly formatted
      subjects: Array.isArray(batchData.subjects) ? batchData.subjects : [],
      classrooms: Array.isArray(batchData.classrooms) ? batchData.classrooms : []
    };
    
    console.log('Clean batch data:', JSON.stringify(cleanBatchData, null, 2));
    
    const batch = await Batch.findByIdAndUpdate(req.params.id, cleanBatchData, { new: true });
    
    // Update faculty semestersTaught
    try {
      await updateFacultySemestersTaught(batch);
    } catch (facultyError) {
      console.error('Warning: Failed to update faculty semestersTaught:', facultyError);
      // Don't fail the batch update if faculty update fails
    }
    
    const populatedBatch = await Batch.findById(batch._id).populate('subjects classrooms teachers');
    res.json(populatedBatch);
  } catch (error) {
    console.error('Batch update error:', error);
    res.status(500).json({ 
      error: 'Failed to update batch',
      details: error.message 
    });
  }
});

app.delete('/api/batches/:id', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  try {
    await Batch.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete batch' });
  }
});

// Faculty API
app.get('/api/faculty', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  try {
    const faculty = await Faculty.find().populate('subjects semestersTaught.subject');
    res.json(faculty);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch faculty' });
  }
});

app.post('/api/faculty', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  try {
    const { subjects, ...facultyData } = req.body;
    
    // Get subjects with their semesters to populate semestersTaught
    let semestersArr = [];
    if (subjects && subjects.length > 0) {
      const subjectsWithSemesters = await Subject.find({ _id: { $in: subjects } });
      subjectsWithSemesters.forEach(subject => {
        semestersArr.push({ subject: subject._id, semester: subject.semester });
      });
    }
    
    const faculty = new Faculty({
      ...facultyData,
      subjects: subjects || [],
      semestersTaught: semestersArr
    });
    await faculty.save();
    
    const populatedFaculty = await Faculty.findById(faculty._id).populate('subjects semestersTaught.subject');
    res.json(populatedFaculty);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create faculty' });
  }
});

app.put('/api/faculty/:id', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  try {
    const { subjects, ...facultyData } = req.body;
    
    // Get subjects with their semesters to populate semestersTaught
    let semestersArr = [];
    if (subjects && subjects.length > 0) {
      const subjectsWithSemesters = await Subject.find({ _id: { $in: subjects } });
      subjectsWithSemesters.forEach(subject => {
        semestersArr.push({ subject: subject._id, semester: subject.semester });
      });
    }
    
    const faculty = await Faculty.findByIdAndUpdate(req.params.id, {
      ...facultyData,
      subjects: subjects || [],
      semestersTaught: semestersArr
    }, { new: true });
    
    const populatedFaculty = await Faculty.findById(faculty._id).populate('subjects semestersTaught.subject');
    res.json(populatedFaculty);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update faculty' });
  }
});

app.delete('/api/faculty/:id', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  try {
    await Faculty.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete faculty' });
  }
});

// Subject API
app.get('/api/subjects', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  try {
    const subjects = await Subject.find();
    res.json(subjects);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch subjects' });
  }
});

app.post('/api/subjects', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  try {
    const subject = new Subject(req.body);
    await subject.save();
    res.json(subject);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create subject' });
  }
});

app.put('/api/subjects/:id', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  try {
    const subject = await Subject.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(subject);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update subject' });
  }
});

app.delete('/api/subjects/:id', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  try {
    await Subject.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete subject' });
  }
});

// Classroom API
app.get('/api/classrooms', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  try {
    const classrooms = await Classroom.find();
    res.json(classrooms);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch classrooms' });
  }
});

app.post('/api/classrooms', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  try {
    const classroom = new Classroom(req.body);
    await classroom.save();
    res.json(classroom);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create classroom' });
  }
});

app.put('/api/classrooms/:id', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  try {
    const classroom = await Classroom.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(classroom);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update classroom' });
  }
});

app.delete('/api/classrooms/:id', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  try {
    await Classroom.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete classroom' });
  }
});

// Timetable API
app.post('/api/timetable/generate', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  try {
    const { generateTimetable } = require('./controllers/scheduleController');
    await generateTimetable(req, res);
  } catch (error) {
    console.error('Timetable generation error:', error);
    res.status(500).json({ error: 'Failed to generate timetable' });
  }
});