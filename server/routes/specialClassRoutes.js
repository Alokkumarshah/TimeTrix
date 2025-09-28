const express = require('express');
const router = express.Router();
const specialClassController = require('../controllers/specialClassController');

// JSON API for React app
router.get('/', specialClassController.listSpecialClasses);
router.post('/', specialClassController.createSpecialClass);
router.delete('/:id', specialClassController.deleteSpecialClass);
router.put('/:id', specialClassController.updateSpecialClass);

module.exports = router;
