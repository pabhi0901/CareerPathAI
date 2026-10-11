import express from 'express';
import {
  generateRoadmaps,
  getRoadmapsByAnalysis,
  getRoadmapById,
  getModuleDetail,
} from '../controllers/roadmapController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/generate/:jobAnalysisId', generateRoadmaps);
router.get('/analysis/:jobAnalysisId', getRoadmapsByAnalysis);
router.get('/:id', getRoadmapById);
router.get('/:id/module/:moduleId', getModuleDetail);

export default router;
