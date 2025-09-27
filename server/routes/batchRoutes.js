const express = require('express');
const router = express.Router();
const batchController = require('../controllers/batchController');

router.get('/', batchController.listBatches);
router.post('/', batchController.createBatch);
router.post('/delete', batchController.deleteBatch);

// Assign teachers to batch
router.get('/assign-teachers', batchController.showAssignTeachers);
router.post('/assign-teachers', batchController.assignTeachers);

// API endpoints for React frontend
router.get('/api/subjects-by-semester', batchController.getSubjectsBySemester);
router.get('/api/teachers-by-subject/:subjectId', batchController.getTeachersBySubject);
router.get('/api/teachers-by-subjects', batchController.getTeachersBySubjects);

module.exports = router;
