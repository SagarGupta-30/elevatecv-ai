const express = require('express');
const router = express.Router();
const resumeController = require('../controllers/resume.controller');
const { protect } = require('../middleware/auth.middleware');

// All resume routes require authentication
router.use(protect);

router.post('/', resumeController.createResume);
router.get('/', resumeController.getUserResumes);
router.get('/:id', resumeController.getResume);
router.put('/:id', resumeController.updateResume);
router.delete('/:id', resumeController.deleteResume);

module.exports = router;
