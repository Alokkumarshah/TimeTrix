const Batch = require('../models/Batch');
const Classroom = require('../models/Classroom');
const Faculty = require('../models/Faculty');
const Subject = require('../models/Subject');

exports.listBatches = async (req, res) => {
  if (!req.session.userId) return res.redirect('/login');
  const batches = await Batch.find().populate('subjects classrooms teachers');
  const classrooms = await Classroom.find();
  const faculty = await Faculty.find();
  const subjects = await Subject.find();
  res.render('batches', { batches, classrooms, faculty, subjects });
};

exports.createBatch = async (req, res) => {
  if (!req.session.userId) return res.redirect('/login');
  const { name, department, semester, studentsCount, shift, classrooms, teachers, subjects } = req.body;
  let teachersArr = teachers;
  if (!Array.isArray(teachersArr)) teachersArr = teachersArr ? [teachersArr] : [];
  let subjectsArr = subjects;
  if (!Array.isArray(subjectsArr)) subjectsArr = subjectsArr ? [subjectsArr] : [];
  let classroomsArr = classrooms;
  if (!Array.isArray(classroomsArr)) classroomsArr = classroomsArr ? [classroomsArr] : [];
  let subjectTeacherAssignments = [];
  let allAssignedTeachers = [];
  subjectsArr.forEach(subId => {
    const teacherId = req.body['teacherFor_' + subId];
    if (teacherId) {
      subjectTeacherAssignments.push({ subject: subId, teacher: teacherId });
      if (!allAssignedTeachers.includes(teacherId)) {
        allAssignedTeachers.push(teacherId);
      }
    }
  });
  // Merge any manually selected teachers with assigned ones
  teachersArr = Array.from(new Set([...teachersArr, ...allAssignedTeachers]));
  await Batch.create({ name, department, semester, studentsCount, shift, classrooms: classroomsArr, teachers: teachersArr, subjects: subjectsArr, subjectTeacherAssignments });
  res.redirect('/batches');
};

exports.deleteBatch = async (req, res) => {
  if (!req.session.userId) return res.redirect('/login');
  const { id } = req.body;
  await Batch.findByIdAndDelete(id);
  res.redirect('/batches');
};

exports.showAssignTeachers = async (req, res) => {
    const Batch = require('../models/Batch');
    const Faculty = require('../models/Faculty');
    const batches = await Batch.find();
    const faculty = await Faculty.find();
    res.render('assign-teachers', { batches, faculty });
};

exports.assignTeachers = async (req, res) => {
    const Batch = require('../models/Batch');
    const batchId = req.body.batch;
    let teachers = req.body.teachers;
    if (!Array.isArray(teachers)) {
        teachers = teachers ? [teachers] : [];
    }
    await Batch.findByIdAndUpdate(batchId, { teachers });
    res.redirect('/batches/assign-teachers');
};

// API endpoints for React frontend
exports.getSubjectsBySemester = async (req, res) => {
  try {
    const { semester, department } = req.query;
    let query = {};
    
    if (semester) {
      query.semester = parseInt(semester);
    }
    if (department) {
      query.department = department;
    }
    
    const subjects = await Subject.find(query).sort({ name: 1 });
    res.json({ success: true, data: subjects });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getTeachersBySubject = async (req, res) => {
  try {
    const { subjectId } = req.params;
    const teachers = await Faculty.find({ subjects: subjectId }).populate('subjects');
    res.json({ success: true, data: teachers });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getTeachersBySubjects = async (req, res) => {
  try {
    const { subjectIds } = req.query;
    const subjectIdArray = Array.isArray(subjectIds) ? subjectIds : [subjectIds];
    
    const teachers = await Faculty.find({ 
      subjects: { $in: subjectIdArray } 
    }).populate('subjects');
    
    res.json({ success: true, data: teachers });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
