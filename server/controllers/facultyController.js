const Faculty = require('../models/Faculty');
const Subject = require('../models/Subject');

exports.listFaculty = async (req, res) => {
  if (!req.session.userId) return res.redirect('/login');
  const faculty = await Faculty.find().populate('subjects semestersTaught.subject');
  const subjects = await Subject.find();
  res.render('faculty', { faculty, subjects });
};

exports.createFaculty = async (req, res) => {
  if (!req.session.userId) return res.redirect('/login');
  const { name, email, department, maxLoadPerWeek, averageLeavesPerMonth, subjects } = req.body;
  let subjectsArr = subjects;
  if (!Array.isArray(subjectsArr)) subjectsArr = subjectsArr ? [subjectsArr] : [];
  
  // Get subjects with their semesters
  const subjectsWithSemesters = await Subject.find({ _id: { $in: subjectsArr } });
  let semestersArr = [];
  subjectsWithSemesters.forEach(subject => {
    semestersArr.push({ subject: subject._id, semester: subject.semester });
  });
  
  await Faculty.create({ name, email, department, maxLoadPerWeek, averageLeavesPerMonth, subjects: subjectsArr, semestersTaught: semestersArr });
  res.redirect('/faculty');
};

exports.deleteFaculty = async (req, res) => {
  if (!req.session.userId) return res.redirect('/login');
  const { id } = req.body;
  await Faculty.findByIdAndDelete(id);
  res.redirect('/faculty');
};
