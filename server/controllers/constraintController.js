const Constraint = require('../models/Constraint');

exports.listConstraints = async (req, res) => {
  if (!req.session.userId) return res.redirect('/login');
  const constraints = await Constraint.find();
  const Batch = require('../models/Batch');
  const Faculty = require('../models/Faculty');
  const Classroom = require('../models/Classroom');
  const batches = await Batch.find();
  const faculty = await Faculty.find();
  const classrooms = await Classroom.find();
  const Subject = require('../models/Subject');
  const subjects = await Subject.find();
  // Build batchTeachers mapping: { batchId: [teacherId, ...] }
  const batchTeachers = {};
  batches.forEach(batch => {
    batchTeachers[batch._id] = batch.teachers ? batch.teachers.map(t => t.toString()) : [];
  });
  // Build facultyList for dropdown
  const facultyList = faculty.map(t => ({ id: t._id.toString(), name: t.name }));
  res.render('constraints', {
    constraints,
    batches,
    faculty,
    subjects,
    classrooms,
    batchTeachers: JSON.stringify(batchTeachers),
    facultyList: JSON.stringify(facultyList)
  });
};

exports.createConstraint = async (req, res) => {
  if (!req.session.userId) return res.redirect('/login');
  const { type, details, day, startTime, endTime, batch, faculty, dayPref, slotPref } = req.body;
  // Teacher slot preference constraint
  if (req.body.type === 'teacher_slot_preference' && req.body.batch && req.body.faculty && req.body.dayPref && req.body.slotPref) {
    const { batch, faculty, dayPref, slotPref } = req.body;
    const existing = await Constraint.findOne({
      type: 'teacher_slot_preference',
      'details.batch': batch,
      'details.day': dayPref,
      'details.slot': slotPref
    });
    if (existing) {
      // Slot already taken
      const Batch = require('../models/Batch');
      const Faculty = require('../models/Faculty');
      const Subject = require('../models/Subject');
      const batches = await Batch.find();
      const faculty = await Faculty.find();
      const subjects = await Subject.find();
      const constraints = await Constraint.find();
      const batchTeachers = {};
      batches.forEach(batch => {
        batchTeachers[batch._id] = batch.teachers ? batch.teachers.map(t => t.toString()) : [];
      });
      // Build facultyList for dropdown
      const facultyList = faculty.map(t => ({ id: t._id.toString(), name: t.name }));
      return res.render('constraints', {
        constraints,
        batches,
        faculty,
        subjects,
        batchTeachers: JSON.stringify(batchTeachers),
        facultyList: JSON.stringify(facultyList),
        error: 'This slot is already taken by another teacher for this batch.'
      });
    }
    await Constraint.create({
      type: 'teacher_slot_preference',
      details: {
        batch,
        faculty,
        day: dayPref,
        slot: slotPref
      }
    });
    return res.redirect('/constraints');
  }
  // Subject slot preference constraint
  if (req.body.type === 'subject_slot_preference' && req.body.batchSubject && req.body.subjectPref && req.body.daySubjectPref && req.body.slotSubjectPref) {
    await Constraint.create({
      type: 'subject_slot_preference',
      details: {
        batch: req.body.batchSubject,
        subject: req.body.subjectPref,
        day: req.body.daySubjectPref,
        slot: req.body.slotSubjectPref
      }
    });
    return res.redirect('/constraints');
  }
  // Classroom preference constraint
  if (req.body.type === 'classroom_preference' && req.body.batchClassroom && req.body.classroomPref && req.body.dayClassroomPref && req.body.slotClassroomPref) {
    const existing = await Constraint.findOne({
      type: 'classroom_preference',
      'details.batch': req.body.batchClassroom,
      'details.day': req.body.dayClassroomPref,
      'details.slot': req.body.slotClassroomPref
    });
    if (existing) {
      // Slot already taken
      const Batch = require('../models/Batch');
      const Faculty = require('../models/Faculty');
      const Subject = require('../models/Subject');
      const Classroom = require('../models/Classroom');
      const batches = await Batch.find();
      const faculty = await Faculty.find();
      const subjects = await Subject.find();
      const classrooms = await Classroom.find();
      const constraints = await Constraint.find();
      const batchTeachers = {};
      batches.forEach(batch => {
        batchTeachers[batch._id] = batch.teachers ? batch.teachers.map(t => t.toString()) : [];
      });
      // Build facultyList for dropdown
      const facultyList = faculty.map(t => ({ id: t._id.toString(), name: t.name }));
      return res.render('constraints', {
        constraints,
        batches,
        faculty,
        subjects,
        classrooms,
        batchTeachers: JSON.stringify(batchTeachers),
        facultyList: JSON.stringify(facultyList),
        error: 'This slot is already taken by another classroom for this batch.'
      });
    }
    await Constraint.create({
      type: 'classroom_preference',
      details: {
        batch: req.body.batchClassroom,
        classroom: req.body.classroomPref,
        day: req.body.dayClassroomPref,
        slot: req.body.slotClassroomPref
      }
    });
    return res.redirect('/constraints');
  }
  // Ignore other constraint types
  return res.redirect('/constraints');
};

exports.deleteConstraint = async (req, res) => {
  if (!req.session.userId) return res.redirect('/login');
  const { id } = req.body;
  await Constraint.findByIdAndDelete(id);
  res.redirect('/constraints');
};

// API endpoints for React frontend
exports.getConstraints = async (req, res) => {
  try {
    const constraints = await Constraint.find().populate('details.batch details.subject details.classroom details.faculty');
    res.json({ success: true, data: constraints });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.createConstraintAPI = async (req, res) => {
  try {
    const { type, details } = req.body;
    
    // Check for conflicts
    const existing = await Constraint.findOne({
      type,
      'details.batch': details.batch,
      'details.day': details.day,
      'details.slot': details.slot
    });
    
    if (existing) {
      return res.status(400).json({ 
        success: false, 
        error: 'This slot is already taken for this batch' 
      });
    }
    
    const constraint = await Constraint.create({ type, details });
    res.json({ success: true, data: constraint });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.deleteConstraintAPI = async (req, res) => {
  try {
    const { id } = req.params;
    await Constraint.findByIdAndDelete(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getBatchesBySemester = async (req, res) => {
  try {
    const { semester, department } = req.query;
    let query = {};
    
    if (semester) {
      query.semester = parseInt(semester);
    }
    if (department) {
      query.department = department;
    }
    
    const Batch = require('../models/Batch');
    const batches = await Batch.find(query).populate('subjects teachers').sort({ name: 1 });
    res.json({ success: true, data: batches });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getSubjectsByBatch = async (req, res) => {
  try {
    const { batchId } = req.params;
    const Batch = require('../models/Batch');
    const batch = await Batch.findById(batchId).populate('subjects');
    
    if (!batch) {
      return res.status(404).json({ success: false, error: 'Batch not found' });
    }
    
    res.json({ success: true, data: batch.subjects || [] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};