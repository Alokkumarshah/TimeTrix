// seed.js
// Run with: node seed.js

const mongoose = require('mongoose');
const Batch = require('./models/Batch');
const Classroom = require('./models/Classroom');
const Subject = require('./models/Subject');
const Faculty = require('./models/Faculty');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/class_scheduling';

async function seed() {
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

  // Clear existing data
  await Promise.all([
    Batch.deleteMany({}),
    Classroom.deleteMany({}),
    Subject.deleteMany({}),
    Faculty.deleteMany({}),
  ]);

  // Create Classrooms
  const classrooms = await Classroom.insertMany([
    { name: 'A101', capacity: 40, type: 'classroom', department: 'CSE', shift: 'morning' },
    { name: 'A102', capacity: 40, type: 'classroom', department: 'CSE', shift: 'evening' },
    { name: 'B201', capacity: 35, type: 'classroom', department: 'ECE', shift: 'morning' },
    { name: 'B202', capacity: 35, type: 'classroom', department: 'ECE', shift: 'evening' },
    { name: 'Lab1', capacity: 25, type: 'laboratory', department: 'CSE', shift: 'morning' },
    { name: 'Lab2', capacity: 25, type: 'laboratory', department: 'ECE', shift: 'evening' },
  ]);

  // Create Subjects
  const subjects = await Subject.insertMany([
    { name: 'Mathematics I', code: 'MATH101', department: 'CSE', semester: 1, isElective: false, requiredClassesPerWeek: 4, maxClassesPerDay: 1 },
    { name: 'Physics', code: 'PHY101', department: 'CSE', semester: 1, isElective: false, requiredClassesPerWeek: 3, maxClassesPerDay: 1 },
    { name: 'Programming', code: 'CSE101', department: 'CSE', semester: 1, isElective: false, requiredClassesPerWeek: 4, maxClassesPerDay: 1 },
    { name: 'Mathematics II', code: 'MATH201', department: 'CSE', semester: 2, isElective: false, requiredClassesPerWeek: 4, maxClassesPerDay: 1 },
    { name: 'Electronics', code: 'ECE101', department: 'ECE', semester: 1, isElective: false, requiredClassesPerWeek: 3, maxClassesPerDay: 1 },
    { name: 'Digital Logic', code: 'ECE201', department: 'ECE', semester: 2, isElective: false, requiredClassesPerWeek: 4, maxClassesPerDay: 1 },
    { name: 'Data Structures', code: 'CSE201', department: 'CSE', semester: 3, isElective: false, requiredClassesPerWeek: 4, maxClassesPerDay: 1 },
    { name: 'Algorithms', code: 'CSE301', department: 'CSE', semester: 5, isElective: false, requiredClassesPerWeek: 4, maxClassesPerDay: 1 },
    { name: 'Microprocessors', code: 'ECE301', department: 'ECE', semester: 5, isElective: false, requiredClassesPerWeek: 3, maxClassesPerDay: 1 },
    { name: 'Operating Systems', code: 'CSE401', department: 'CSE', semester: 7, isElective: false, requiredClassesPerWeek: 4, maxClassesPerDay: 1 },
    { name: 'VLSI Design', code: 'ECE401', department: 'ECE', semester: 7, isElective: false, requiredClassesPerWeek: 3, maxClassesPerDay: 1 },
    { name: 'Machine Learning', code: 'CSE402', department: 'CSE', semester: 8, isElective: true, requiredClassesPerWeek: 2, maxClassesPerDay: 1 },
    { name: 'Embedded Systems', code: 'ECE402', department: 'ECE', semester: 8, isElective: true, requiredClassesPerWeek: 2, maxClassesPerDay: 1 },
  ]);

  // Create Faculty
  const faculty = await Faculty.insertMany([
    { name: 'Dr. A Sharma', email: 'asharma@univ.edu', department: 'CSE', maxLoadPerWeek: 16, averageLeavesPerMonth: 1, subjects: [subjects[0]._id, subjects[2]._id], semestersTaught: [ { subject: subjects[0]._id, semester: 1 }, { subject: subjects[2]._id, semester: 3 } ] },
    { name: 'Dr. B Singh', email: 'bsingh@univ.edu', department: 'CSE', maxLoadPerWeek: 16, averageLeavesPerMonth: 1, subjects: [subjects[3]._id, subjects[6]._id], semestersTaught: [ { subject: subjects[3]._id, semester: 2 }, { subject: subjects[6]._id, semester: 3 } ] },
    { name: 'Dr. C Gupta', email: 'cgupta@univ.edu', department: 'CSE', maxLoadPerWeek: 16, averageLeavesPerMonth: 1, subjects: [subjects[7]._id, subjects[9]._id], semestersTaught: [ { subject: subjects[7]._id, semester: 5 }, { subject: subjects[9]._id, semester: 7 } ] },
    { name: 'Dr. D Verma', email: 'dverma@univ.edu', department: 'ECE', maxLoadPerWeek: 16, averageLeavesPerMonth: 1, subjects: [subjects[4]._id, subjects[5]._id], semestersTaught: [ { subject: subjects[4]._id, semester: 1 }, { subject: subjects[5]._id, semester: 2 } ] },
    { name: 'Dr. E Rao', email: 'erao@univ.edu', department: 'ECE', maxLoadPerWeek: 16, averageLeavesPerMonth: 1, subjects: [subjects[8]._id, subjects[10]._id], semestersTaught: [ { subject: subjects[8]._id, semester: 5 }, { subject: subjects[10]._id, semester: 7 } ] },
    { name: 'Dr. F Kumar', email: 'fkumar@univ.edu', department: 'CSE', maxLoadPerWeek: 16, averageLeavesPerMonth: 1, subjects: [subjects[11]._id], semestersTaught: [ { subject: subjects[11]._id, semester: 8 } ] },
    { name: 'Dr. G Patel', email: 'gpatel@univ.edu', department: 'ECE', maxLoadPerWeek: 16, averageLeavesPerMonth: 1, subjects: [subjects[12]._id], semestersTaught: [ { subject: subjects[12]._id, semester: 8 } ] },
    { name: 'Dr. H Mehta', email: 'hmehta@univ.edu', department: 'CSE', maxLoadPerWeek: 16, averageLeavesPerMonth: 1, subjects: [subjects[1]._id], semestersTaught: [ { subject: subjects[1]._id, semester: 1 } ] },
    { name: 'Dr. I Joshi', email: 'ijoshi@univ.edu', department: 'ECE', maxLoadPerWeek: 16, averageLeavesPerMonth: 1, subjects: [subjects[4]._id, subjects[5]._id], semestersTaught: [ { subject: subjects[4]._id, semester: 1 }, { subject: subjects[5]._id, semester: 2 } ] },
    { name: 'Dr. J Nair', email: 'jnair@univ.edu', department: 'CSE', maxLoadPerWeek: 16, averageLeavesPerMonth: 1, subjects: [subjects[6]._id, subjects[7]._id], semestersTaught: [ { subject: subjects[6]._id, semester: 3 }, { subject: subjects[7]._id, semester: 5 } ] },
  ]);

  // Create Batches (2 per year, 4 years)
  const batchData = [
    // 1st Year
    { name: 'CSE 1A', department: 'CSE', semester: 1, studentsCount: 38, shift: 'morning', classrooms: [classrooms[0]._id], teachers: [faculty[0]._id, faculty[7]._id], subjects: [subjects[0]._id, subjects[1]._id, subjects[2]._id] },
    { name: 'CSE 1B', department: 'CSE', semester: 1, studentsCount: 37, shift: 'evening', classrooms: [classrooms[1]._id], teachers: [faculty[0]._id, faculty[7]._id], subjects: [subjects[0]._id, subjects[1]._id, subjects[2]._id] },
    // 2nd Year
    { name: 'CSE 2A', department: 'CSE', semester: 3, studentsCount: 40, shift: 'morning', classrooms: [classrooms[0]._id], teachers: [faculty[1]._id, faculty[9]._id], subjects: [subjects[3]._id, subjects[6]._id] },
    { name: 'ECE 2A', department: 'ECE', semester: 3, studentsCount: 36, shift: 'evening', classrooms: [classrooms[2]._id], teachers: [faculty[3]._id, faculty[8]._id], subjects: [subjects[4]._id, subjects[5]._id] },
    // 3rd Year
    { name: 'CSE 3A', department: 'CSE', semester: 5, studentsCount: 39, shift: 'morning', classrooms: [classrooms[0]._id], teachers: [faculty[2]._id, faculty[9]._id], subjects: [subjects[7]._id, subjects[8]._id] },
    { name: 'ECE 3A', department: 'ECE', semester: 5, studentsCount: 35, shift: 'evening', classrooms: [classrooms[3]._id], teachers: [faculty[4]._id, faculty[8]._id], subjects: [subjects[8]._id, subjects[9]._id] },
    // 4th Year
    { name: 'CSE 4A', department: 'CSE', semester: 7, studentsCount: 38, shift: 'morning', classrooms: [classrooms[0]._id], teachers: [faculty[2]._id, faculty[5]._id], subjects: [subjects[9]._id, subjects[11]._id] },
    { name: 'ECE 4A', department: 'ECE', semester: 7, studentsCount: 34, shift: 'evening', classrooms: [classrooms[3]._id], teachers: [faculty[4]._id, faculty[6]._id], subjects: [subjects[10]._id, subjects[12]._id] },
  ];

  await Batch.insertMany(batchData);

  console.log('Sample data inserted successfully!');
  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('Seeding error:', err);
  mongoose.disconnect();
});