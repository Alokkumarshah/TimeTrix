const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Import models
const User = require('./models/User');
const Batch = require('./models/Batch');
const Subject = require('./models/Subject');
const Faculty = require('./models/Faculty');
const Classroom = require('./models/Classroom');
const Constraint = require('./models/Constraint');
const SpecialClass = require('./models/SpecialClass');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/class_scheduling', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function seedDatabase() {
  try {
    console.log('Starting database seeding...');

  // Clear existing data
    await User.deleteMany({});
    await Batch.deleteMany({});
    await Subject.deleteMany({});
    await Faculty.deleteMany({});
    await Classroom.deleteMany({});
    await Constraint.deleteMany({});
    await SpecialClass.deleteMany({});
    
    console.log('Cleared existing data');

    // Create admin user
    const adminUser = new User({
      username: 'admin',
      password: 'admin123',
      role: 'admin',
      name: 'System Administrator',
      email: 'admin@timetable.com'
    });
    await adminUser.save();
    console.log('Created admin user');

    // Create subjects (6 classes with common subjects)
    const subjects = [];
    const subjectData = [
      { name: 'Mathematics', code: 'MATH101', department: 'Mathematics', semester: 1, requiredClassesPerWeek: 4, maxClassesPerDay: 2 },
      { name: 'Physics', code: 'PHYS101', department: 'Physics', semester: 1, requiredClassesPerWeek: 3, maxClassesPerDay: 2 },
      { name: 'Chemistry', code: 'CHEM101', department: 'Chemistry', semester: 1, requiredClassesPerWeek: 3, maxClassesPerDay: 2 },
      { name: 'English', code: 'ENG101', department: 'English', semester: 1, requiredClassesPerWeek: 2, maxClassesPerDay: 1 },
      { name: 'Computer Science', code: 'CS101', department: 'Computer Science', semester: 1, requiredClassesPerWeek: 4, maxClassesPerDay: 2 },
      { name: 'Engineering Drawing', code: 'ED101', department: 'Engineering', semester: 1, requiredClassesPerWeek: 2, maxClassesPerDay: 1 }
    ];

    for (const subData of subjectData) {
      const subject = new Subject(subData);
      await subject.save();
      subjects.push(subject);
    }
    console.log('Created subjects');

    // Create classrooms (12 classrooms for 12 batches)
    const classrooms = [];
    for (let i = 1; i <= 12; i++) {
      const classroom = new Classroom({
        name: `Room ${i}`,
        capacity: 50,
        type: 'classroom',
        department: 'General',
        shift: i <= 6 ? 'Morning' : 'Evening'
      });
      await classroom.save();
      classrooms.push(classroom);
    }
    console.log('Created classrooms');

    // Create faculty with overlapping assignments
    const faculties = [];
    const facultyData = [
      { name: 'Dr. John Smith', email: 'john.smith@university.edu', department: 'Mathematics', maxLoadPerWeek: 20 },
      { name: 'Prof. Sarah Johnson', email: 'sarah.johnson@university.edu', department: 'Physics', maxLoadPerWeek: 18 },
      { name: 'Dr. Michael Brown', email: 'michael.brown@university.edu', department: 'Chemistry', maxLoadPerWeek: 16 },
      { name: 'Ms. Emily Davis', email: 'emily.davis@university.edu', department: 'English', maxLoadPerWeek: 14 },
      { name: 'Dr. Robert Wilson', email: 'robert.wilson@university.edu', department: 'Computer Science', maxLoadPerWeek: 22 },
      { name: 'Prof. Lisa Anderson', email: 'lisa.anderson@university.edu', department: 'Engineering', maxLoadPerWeek: 16 },
      { name: 'Dr. David Taylor', email: 'david.taylor@university.edu', department: 'Mathematics', maxLoadPerWeek: 18 },
      { name: 'Ms. Jennifer Martinez', email: 'jennifer.martinez@university.edu', department: 'Physics', maxLoadPerWeek: 16 },
      { name: 'Dr. James Thompson', email: 'james.thompson@university.edu', department: 'Chemistry', maxLoadPerWeek: 14 },
      { name: 'Prof. Amanda Garcia', email: 'amanda.garcia@university.edu', department: 'Computer Science', maxLoadPerWeek: 20 }
    ];

    for (const facData of facultyData) {
      const faculty = new Faculty(facData);
      await faculty.save();
      faculties.push(faculty);
    }
    console.log('Created faculty');

    // Assign subjects to faculty (creating overlaps)
    const facultySubjectAssignments = [
      { faculty: faculties[0], subjects: [subjects[0]] }, // Dr. John Smith - Mathematics
      { faculty: faculties[1], subjects: [subjects[1]] }, // Prof. Sarah Johnson - Physics
      { faculty: faculties[2], subjects: [subjects[2]] }, // Dr. Michael Brown - Chemistry
      { faculty: faculties[3], subjects: [subjects[3]] }, // Ms. Emily Davis - English
      { faculty: faculties[4], subjects: [subjects[4]] }, // Dr. Robert Wilson - Computer Science
      { faculty: faculties[5], subjects: [subjects[5]] }, // Prof. Lisa Anderson - Engineering Drawing
      { faculty: faculties[6], subjects: [subjects[0]] }, // Dr. David Taylor - Mathematics (overlap)
      { faculty: faculties[7], subjects: [subjects[1]] }, // Ms. Jennifer Martinez - Physics (overlap)
      { faculty: faculties[8], subjects: [subjects[2]] }, // Dr. James Thompson - Chemistry (overlap)
      { faculty: faculties[9], subjects: [subjects[4]] }  // Prof. Amanda Garcia - Computer Science (overlap)
    ];

    for (const assignment of facultySubjectAssignments) {
      assignment.faculty.subjects = assignment.subjects;
      await assignment.faculty.save();
    }
    console.log('Assigned subjects to faculty');

    // Create 12 batches (6 classes with 2 sections each)
    const batches = [];
  const batchData = [
      { name: '1A', department: 'Engineering', semester: 1, studentsCount: 45, shift: 'Morning' },
      { name: '1B', department: 'Engineering', semester: 1, studentsCount: 42, shift: 'Morning' },
      { name: '2A', department: 'Engineering', semester: 1, studentsCount: 48, shift: 'Morning' },
      { name: '2B', department: 'Engineering', semester: 1, studentsCount: 44, shift: 'Morning' },
      { name: '3A', department: 'Engineering', semester: 1, studentsCount: 46, shift: 'Morning' },
      { name: '3B', department: 'Engineering', semester: 1, studentsCount: 43, shift: 'Morning' },
      { name: '4A', department: 'Engineering', semester: 1, studentsCount: 47, shift: 'Evening' },
      { name: '4B', department: 'Engineering', semester: 1, studentsCount: 41, shift: 'Evening' },
      { name: '5A', department: 'Engineering', semester: 1, studentsCount: 49, shift: 'Evening' },
      { name: '5B', department: 'Engineering', semester: 1, studentsCount: 45, shift: 'Evening' },
      { name: '6A', department: 'Engineering', semester: 1, studentsCount: 44, shift: 'Evening' },
      { name: '6B', department: 'Engineering', semester: 1, studentsCount: 46, shift: 'Evening' }
    ];

    for (let i = 0; i < batchData.length; i++) {
      const batch = new Batch({
        ...batchData[i],
        subjects: subjects.map(s => s._id), // All batches have same subjects
        classrooms: [classrooms[i]._id], // Each batch gets one classroom
        teachers: [],
        subjectTeacherAssignments: []
      });

      // Create subject-teacher assignments with overlapping teachers
      const subjectTeacherAssignments = [];
      
      // Assign teachers to subjects with overlaps
      subjectTeacherAssignments.push({
        subject: subjects[0]._id, // Mathematics
        teacher: i % 2 === 0 ? faculties[0]._id : faculties[6]._id
      });
      
      subjectTeacherAssignments.push({
        subject: subjects[1]._id, // Physics
        teacher: i % 2 === 0 ? faculties[1]._id : faculties[7]._id
      });
      
      subjectTeacherAssignments.push({
        subject: subjects[2]._id, // Chemistry
        teacher: i % 2 === 0 ? faculties[2]._id : faculties[8]._id
      });
      
      subjectTeacherAssignments.push({
        subject: subjects[3]._id, // English
        teacher: faculties[3]._id
      });
      
      subjectTeacherAssignments.push({
        subject: subjects[4]._id, // Computer Science
        teacher: i % 2 === 0 ? faculties[4]._id : faculties[9]._id
      });
      
      subjectTeacherAssignments.push({
        subject: subjects[5]._id, // Engineering Drawing
        teacher: faculties[5]._id
      });

      batch.subjectTeacherAssignments = subjectTeacherAssignments;
      batch.teachers = [...new Set(subjectTeacherAssignments.map(sta => sta.teacher))];
      
      await batch.save();
      batches.push(batch);
    }
    console.log('Created batches with overlapping teacher assignments');

    // Create constraints for testing
    const constraints = [];
    
    // Subject slot preferences (special constraints)
    const specialConstraints = [
      {
        type: 'subject_slot_preference',
        details: {
          batch: batches[0]._id,
          subject: subjects[0]._id,
          day: 'Monday',
          slot: 'Period 1'
        }
      },
      {
        type: 'subject_slot_preference',
        details: {
          batch: batches[1]._id,
          subject: subjects[1]._id,
          day: 'Tuesday',
          slot: 'Period 2'
        }
      }
    ];

    for (const constraintData of specialConstraints) {
      const constraint = new Constraint(constraintData);
      await constraint.save();
      constraints.push(constraint);
    }
    console.log('Created constraints');

    console.log('\n=== SEEDING COMPLETE ===');
    console.log(`Created ${subjects.length} subjects`);
    console.log(`Created ${classrooms.length} classrooms`);
    console.log(`Created ${faculties.length} faculty members`);
    console.log(`Created ${batches.length} batches`);
    console.log(`Created ${constraints.length} constraints`);
    
    console.log('\n=== TEACHER OVERLAP SUMMARY ===');
    console.log('Mathematics: Dr. John Smith & Dr. David Taylor');
    console.log('Physics: Prof. Sarah Johnson & Ms. Jennifer Martinez');
    console.log('Chemistry: Dr. Michael Brown & Dr. James Thompson');
    console.log('Computer Science: Dr. Robert Wilson & Prof. Amanda Garcia');
    console.log('English: Ms. Emily Davis (no overlap)');
    console.log('Engineering Drawing: Prof. Lisa Anderson (no overlap)');
    
    console.log('\n=== BATCH STRUCTURE ===');
    console.log('Class 1: 1A (Morning), 1B (Morning)');
    console.log('Class 2: 2A (Morning), 2B (Morning)');
    console.log('Class 3: 3A (Morning), 3B (Morning)');
    console.log('Class 4: 4A (Evening), 4B (Evening)');
    console.log('Class 5: 5A (Evening), 5B (Evening)');
    console.log('Class 6: 6A (Evening), 6B (Evening)');
    
    console.log('\n=== ALL BATCHES HAVE SAME SUBJECTS ===');
    subjects.forEach(subject => {
      console.log(`- ${subject.name} (${subject.code}): ${subject.requiredClassesPerWeek} classes/week, max ${subject.maxClassesPerDay}/day`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();