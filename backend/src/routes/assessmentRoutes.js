import express from 'express';
import {
  getOrGenerateAssessment,
  submitAssessment,
  getModuleAttempts,
  getAllAssessmentHistory,
} from '../controllers/assessmentController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/history', getAllAssessmentHistory);
router.get('/:roadmapId/:moduleId', getOrGenerateAssessment);
router.post('/:roadmapId/:moduleId/submit', submitAssessment);
router.get('/:roadmapId/:moduleId/attempts', getModuleAttempts);

export default router;
