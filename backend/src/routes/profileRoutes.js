import express from 'express';
import {
  getProfile,
  updateProfile,
  addSkill,
  updateSkill,
  removeSkill,
  addProject,
  deleteProject,
} from '../controllers/profileController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect); // All profile routes protected

router.get('/', getProfile);
router.put('/', updateProfile);
router.post('/skills', addSkill);
router.put('/skills/:skillId', updateSkill);
router.delete('/skills/:skillId', removeSkill);
router.post('/projects', addProject);
router.delete('/projects/:projectId', deleteProject);

export default router;
