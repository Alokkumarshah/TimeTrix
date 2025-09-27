const express = require('express');
const router = express.Router();
const constraintController = require('../controllers/constraintController');

router.get('/', constraintController.listConstraints);
router.post('/', constraintController.createConstraint);
router.post('/delete', constraintController.deleteConstraint);

// API endpoints for React frontend
router.get('/api/constraints', constraintController.getConstraints);
router.post('/api/constraints', constraintController.createConstraintAPI);
router.delete('/api/constraints/:id', constraintController.deleteConstraintAPI);
router.get('/api/batches-by-semester', constraintController.getBatchesBySemester);
router.get('/api/subjects-by-batch/:batchId', constraintController.getSubjectsByBatch);

module.exports = router;
