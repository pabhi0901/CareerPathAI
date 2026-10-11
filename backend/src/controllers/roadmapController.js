import { Roadmap } from '../models/Roadmap.js';
import { JobAnalysis } from '../models/JobAnalysis.js';
import { User } from '../models/User.js';
import { ModuleProgress } from '../models/ModuleProgress.js';
import { AssessmentAttempt } from '../models/AssessmentAttempt.js';
import { Assessment } from '../models/Assessment.js';
import { roadmapGraph } from '../langgraph/roadmapGraph.js';

// @desc    Generate Roadmap A and Roadmap B for a specific Job Analysis
// @route   POST /api/roadmaps/generate/:jobAnalysisId
export const generateRoadmaps = async (req, res, next) => {
  try {
    const { jobAnalysisId } = req.params;
    const userId = req.user._id;

    const jobAnalysis = await JobAnalysis.findOne({ _id: jobAnalysisId, userId });
    if (!jobAnalysis) {
      return res.status(404).json({
        success: false,
        message: 'Job analysis record not found.',
      });
    }

    const user = await User.findById(userId);

    // Calculate current version for this analysis
    const existingRoadmaps = await Roadmap.find({ userId, jobAnalysisId });
    const latestVersion = existingRoadmaps.reduce((max, r) => Math.max(max, r.version || 1), 0);
    const newVersion = latestVersion + 1;

    // Run LangGraph roadmap generation workflow
    const graphResult = await roadmapGraph.invoke({
      jobAnalysisData: jobAnalysis,
      studentProfile: user.studentProfile,
    });

    if (graphResult.error || !graphResult.output) {
      return res.status(500).json({
        success: false,
        message: `Roadmap generation failed: ${graphResult.error || 'Invalid response from model'}`,
      });
    }

    const { existingSkillsRoadmap, missingSkillsRoadmap } = graphResult.output;

    const studyConstraintDetails = {
      availableHoursPerDay: user.studentProfile?.availableHoursPerDay || 3,
      targetDeadline: user.studentProfile?.placementDeadline || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      totalEstimatedWeeks: Math.max(
        existingSkillsRoadmap.estimatedTotalWeeks || 4,
        missingSkillsRoadmap.estimatedTotalWeeks || 6
      ),
    };

    // 1. Create Roadmap A (Existing Skills)
    const roadmapA = await Roadmap.create({
      userId,
      jobAnalysisId,
      roadmapType: 'existing_skills',
      title: existingSkillsRoadmap.title || 'Existing Skills Deepening & Validation',
      description: existingSkillsRoadmap.description || 'Validating and advancing existing skills to interview-ready level',
      targetRole: jobAnalysis.extractedRequirements?.targetRole || user.studentProfile?.targetRole,
      version: newVersion,
      studyConstraintDetails: {
        ...studyConstraintDetails,
        totalEstimatedWeeks: existingSkillsRoadmap.estimatedTotalWeeks,
      },
      modules: existingSkillsRoadmap.modules,
    });

    // 2. Create Roadmap B (Missing Skills)
    const roadmapB = await Roadmap.create({
      userId,
      jobAnalysisId,
      roadmapType: 'missing_skills',
      title: missingSkillsRoadmap.title || 'Target Role Skill Gap Learning Path',
      description: missingSkillsRoadmap.description || 'Mastering missing job requirements in prerequisite order',
      targetRole: jobAnalysis.extractedRequirements?.targetRole || user.studentProfile?.targetRole,
      version: newVersion,
      studyConstraintDetails: {
        ...studyConstraintDetails,
        totalEstimatedWeeks: missingSkillsRoadmap.estimatedTotalWeeks,
      },
      modules: missingSkillsRoadmap.modules,
    });

    // 3. Initialize ModuleProgress for both roadmaps - KEEP ALL UNLOCKED
    const initProgressRecords = [];
    [roadmapA, roadmapB].forEach(roadmap => {
      roadmap.modules.forEach(mod => {
        // All modules and assessments are immediately unlocked
        initProgressRecords.push({
          userId,
          roadmapId: roadmap._id,
          moduleId: mod.moduleId,
          status: 'unlocked',
        });
      });
    });

    await ModuleProgress.insertMany(initProgressRecords);

    res.status(201).json({
      success: true,
      message: `Roadmaps version ${newVersion} created successfully!`,
      roadmapA,
      roadmapB,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get roadmaps for a job analysis
// @route   GET /api/roadmaps/analysis/:jobAnalysisId
export const getRoadmapsByAnalysis = async (req, res, next) => {
  try {
    const { jobAnalysisId } = req.params;
    const userId = req.user._id;

    const roadmaps = await Roadmap.find({ userId, jobAnalysisId }).sort({ version: -1, createdAt: -1 });

    // Attach progress records for modules
    const roadmapIds = roadmaps.map(r => r._id);
    const progressList = await ModuleProgress.find({ userId, roadmapId: { $in: roadmapIds } });

    const progressMap = {};
    progressList.forEach(p => {
      progressMap[`${p.roadmapId}_${p.moduleId}`] = p;
    });

    const enrichedRoadmaps = roadmaps.map(r => {
      const rObj = r.toObject();
      rObj.modules = rObj.modules.map(m => {
        const prog = progressMap[`${r._id}_${m.moduleId}`];
        return {
          ...m,
          progress: {
            status: prog?.status === 'completed' ? 'completed' : prog?.status === 'in_progress' ? 'in_progress' : 'unlocked',
            bestScorePercentage: prog?.bestScorePercentage || 0,
            attemptsCount: prog?.attemptsCount || 0,
          },
        };
      });
      return rObj;
    });

    res.status(200).json({
      success: true,
      roadmaps: enrichedRoadmaps,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single roadmap by ID with progress
// @route   GET /api/roadmaps/:id
export const getRoadmapById = async (req, res, next) => {
  try {
    const roadmap = await Roadmap.findOne({ _id: req.params.id, userId: req.user._id });
    if (!roadmap) {
      return res.status(404).json({ success: false, message: 'Roadmap not found.' });
    }

    const progressList = await ModuleProgress.find({
      userId: req.user._id,
      roadmapId: roadmap._id,
    });

    const progressMap = {};
    progressList.forEach(p => {
      progressMap[p.moduleId] = p;
    });

    const rObj = roadmap.toObject();
    rObj.modules = rObj.modules.map(m => {
      const prog = progressMap[m.moduleId];
      return {
        ...m,
        progress: {
          status: prog?.status === 'completed' ? 'completed' : prog?.status === 'in_progress' ? 'in_progress' : 'unlocked',
          bestScorePercentage: prog?.bestScorePercentage || 0,
          attemptsCount: prog?.attemptsCount || 0,
        },
      };
    });

    res.status(200).json({
      success: true,
      roadmap: rObj,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get detailed module content, progress, and assessment attempt history
// @route   GET /api/roadmaps/:id/module/:moduleId
export const getModuleDetail = async (req, res, next) => {
  try {
    const { id: roadmapId, moduleId } = req.params;
    const userId = req.user._id;

    const roadmap = await Roadmap.findOne({ _id: roadmapId, userId });
    if (!roadmap) {
      return res.status(404).json({ success: false, message: 'Roadmap not found.' });
    }

    const moduleData = roadmap.modules.find(m => m.moduleId === moduleId);
    if (!moduleData) {
      return res.status(404).json({ success: false, message: 'Module not found in roadmap.' });
    }

    // Get current progress - ensure unlocked
    let progress = await ModuleProgress.findOne({ userId, roadmapId, moduleId });
    if (!progress) {
      progress = await ModuleProgress.create({
        userId,
        roadmapId,
        moduleId,
        status: 'unlocked',
      });
    } else if (progress.status === 'locked') {
      progress.status = 'unlocked';
      await progress.save();
    }

    // Get assessment attempts history for this module
    const attempts = await AssessmentAttempt.find({
      userId,
      roadmapId,
      moduleId,
    }).sort({ attemptNumber: -1 });

    // Check if an assessment has already been generated
    const assessment = await Assessment.findOne({ roadmapId, moduleId });

    res.status(200).json({
      success: true,
      module: moduleData,
      roadmap: {
        _id: roadmap._id,
        title: roadmap.title,
        roadmapType: roadmap.roadmapType,
        targetRole: roadmap.targetRole,
      },
      progress,
      attempts,
      hasAssessment: Boolean(assessment),
    });
  } catch (error) {
    next(error);
  }
};
