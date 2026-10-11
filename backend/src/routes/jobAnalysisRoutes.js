import express from 'express';
import {
  analyzeJob,
  getJobAnalyses,
  getJobAnalysisById,
} from '../controllers/jobAnalysisController.js';
import { protect } from '../middleware/authMiddleware.js';
import { uploadPdf } from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/analyze', uploadPdf.single('jobPdf'), analyzeJob);
router.get('/', getJobAnalyses);
router.get('/:id', getJobAnalysisById);

export default router;
