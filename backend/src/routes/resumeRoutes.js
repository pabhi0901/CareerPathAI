import express from 'express';
import {
  uploadResume,
  getResumes,
  getLatestResume,
  extractResumeSkills,
  confirmExtractedSkills,
} from '../controllers/resumeController.js';
import { protect } from '../middleware/authMiddleware.js';
import { uploadPdf } from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.use(protect); // All resume routes protected

router.post('/upload', uploadPdf.single('resume'), uploadResume);
router.get('/', getResumes);
router.get('/latest', getLatestResume);
router.post('/:id/extract', extractResumeSkills);
router.post('/:id/confirm-skills', confirmExtractedSkills);

export default router;
