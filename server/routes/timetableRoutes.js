const express = require('express');
const router = express.Router();
const timetableController = require('../controllers/timetableController');

// Middleware to check if user is authenticated
const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
};

// Save a generated timetable
router.post('/save', requireAuth, timetableController.saveTimetable);

// Get all saved timetables with filtering
router.get('/saved', requireAuth, timetableController.getSavedTimetables);

// Get filter options
router.get('/filter-options', requireAuth, timetableController.getFilterOptions);

// Get a specific saved timetable
router.get('/saved/:id', requireAuth, timetableController.getSavedTimetable);

// Update a saved timetable
router.put('/saved/:id', requireAuth, timetableController.updateTimetable);

// Delete a saved timetable
router.delete('/saved/:id', requireAuth, timetableController.deleteTimetable);

module.exports = router;