import { User } from '../models/User.js';
import { JobAnalysis } from '../models/JobAnalysis.js';
import { Roadmap } from '../models/Roadmap.js';
import { ModuleProgress } from '../models/ModuleProgress.js';
import { AssessmentAttempt } from '../models/AssessmentAttempt.js';

// @desc    Get aggregated student dashboard metrics
// @route   GET /api/dashboard
export const getDashboardMetrics = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // 1. User & Profile
    const user = await User.findById(userId);
    const profile = user.studentProfile || {};
    const confirmedSkills = profile.skills || [];

    // 2. Latest Job Analysis
    const latestJobAnalysis = await JobAnalysis.findOne({ userId }).sort({ createdAt: -1 });

    // 3. Roadmaps & Modules Progress
    const roadmaps = await Roadmap.find({ userId }).sort({ version: -1, createdAt: -1 });

    let latestExistingRoadmap = null;
    let latestMissingRoadmap = null;

    if (latestJobAnalysis) {
      latestExistingRoadmap = roadmaps.find(
        r => r.jobAnalysisId?.toString() === latestJobAnalysis._id.toString() && r.roadmapType === 'existing_skills'
      );
      latestMissingRoadmap = roadmaps.find(
        r => r.jobAnalysisId?.toString() === latestJobAnalysis._id.toString() && r.roadmapType === 'missing_skills'
      );
    }

    if (!latestExistingRoadmap) {
      latestExistingRoadmap = roadmaps.find(r => r.roadmapType === 'existing_skills');
    }
    if (!latestMissingRoadmap) {
      latestMissingRoadmap = roadmaps.find(r => r.roadmapType === 'missing_skills');
    }

    // All progress records for user
    const allProgress = await ModuleProgress.find({ userId });
    const completedProgress = allProgress.filter(p => p.status === 'completed');

    // Calculate roadmap modules stats
    const countRoadmapProgress = (roadmap) => {
      if (!roadmap || !roadmap.modules) return { total: 0, completed: 0, percentage: 0 };
      const total = roadmap.modules.length;
      const completed = roadmap.modules.filter(m =>
        completedProgress.some(p => p.roadmapId?.toString() === roadmap._id.toString() && p.moduleId === m.moduleId)
      ).length;
      return {
        total,
        completed,
        percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
      };
    };

    const existingProgressStats = countRoadmapProgress(latestExistingRoadmap);
    const missingProgressStats = countRoadmapProgress(latestMissingRoadmap);

    // 4. Assessment Statistics
    const allAttempts = await AssessmentAttempt.find({ userId }).sort({ createdAt: -1 });
    const totalAttempts = allAttempts.length;
    const passedAttempts = allAttempts.filter(a => a.passed).length;
    const passRate = totalAttempts > 0 ? Math.round((passedAttempts / totalAttempts) * 100) : 0;

    // Collect weak topics from all attempts
    const weakTopicsMap = new Map();
    allAttempts.forEach(attempt => {
      (attempt.weakTopics || []).forEach(wt => {
        weakTopicsMap.set(wt, (weakTopicsMap.get(wt) || 0) + 1);
      });
    });
    const weakTopics = Array.from(weakTopicsMap.entries())
      .map(([topic, count]) => ({ topic, occurrences: count }))
      .sort((a, b) => b.occurrences - a.occurrences)
      .slice(0, 6);

    // 5. Recent assessment results (last 5)
    const recentAssessments = allAttempts.slice(0, 5).map(a => ({
      _id: a._id,
      moduleId: a.moduleId,
      attemptNumber: a.attemptNumber,
      score: a.score,
      maxScore: a.maxScore,
      percentage: a.percentage,
      passed: a.passed,
      createdAt: a.createdAt,
    }));

    // 6. Placement Deadline Calculation
    const targetDeadline = profile.placementDeadline ? new Date(profile.placementDeadline) : null;
    const now = new Date();
    let daysRemaining = null;
    let weeksRemaining = null;
    if (targetDeadline) {
      const diffTime = targetDeadline.getTime() - now.getTime();
      daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
      weeksRemaining = Math.max(0, Math.ceil(daysRemaining / 7));
    }

    // 7. Career Readiness Score Calculation (Deterministic Formula)
    // Formula Breakdown:
    // - Skill Match Coverage: 40% (based on latest job analysis match score or verified ratio)
    // - Assessment Proficiency: 35% (based on assessment pass rate & average score)
    // - Roadmap Completion: 25% (based on completed modules ratio)
    const matchScore = latestJobAnalysis?.matchResults?.overallMatchScore || 0;
    const avgAssessmentScore = totalAttempts > 0
      ? Math.round(allAttempts.reduce((acc, curr) => acc + curr.percentage, 0) / totalAttempts)
      : 0;

    const totalActiveModules = (existingProgressStats.total + missingProgressStats.total) || 1;
    const totalCompletedModules = (existingProgressStats.completed + missingProgressStats.completed);
    const moduleCompletionRatio = Math.min(100, Math.round((totalCompletedModules / totalActiveModules) * 100));

    let readinessScore = 0;
    if (latestJobAnalysis || totalAttempts > 0) {
      readinessScore = Math.round(
        matchScore * 0.40 +
        avgAssessmentScore * 0.35 +
        moduleCompletionRatio * 0.25
      );
    } else {
      // Baseline readiness based on verified skills
      const verifiedRatio = confirmedSkills.length > 0
        ? (confirmedSkills.filter(s => s.verified).length / confirmedSkills.length) * 100
        : 0;
      readinessScore = Math.round(Math.min(60, confirmedSkills.length * 6 + verifiedRatio * 0.3));
    }

    readinessScore = Math.min(100, Math.max(0, readinessScore));

    const readinessExplanation = {
      formula: 'Career Readiness Index = (40% Job Requirement Match) + (35% Assessment Proficiency) + (25% Roadmap Milestone Completion)',
      disclaimer: 'This index reflects verified syllabus coverage and mock assessment performance against target JD criteria. It is an educational preparation metric, not a guaranteed hiring probability.',
      components: {
        jobMatchScore: matchScore,
        averageAssessmentScore: avgAssessmentScore,
        roadmapCompletionPercentage: moduleCompletionRatio,
      },
    };

    res.status(200).json({
      success: true,
      metrics: {
        targetRole: profile.targetRole || latestJobAnalysis?.extractedRequirements?.targetRole || 'Software Engineer',
        targetCompany: profile.targetCompany || latestJobAnalysis?.company || '',
        availableHoursPerDay: profile.availableHoursPerDay || 3,
        daysRemaining,
        weeksRemaining,
        placementDeadline: targetDeadline,

        skillsOverview: {
          totalConfirmed: confirmedSkills.length,
          verifiedCount: confirmedSkills.filter(s => s.verified).length,
          missingSkillsCount: latestJobAnalysis?.matchResults?.missingSkills?.length || 0,
          matchedSkillsCount: latestJobAnalysis?.matchResults?.matchedSkills?.length || 0,
        },

        latestJobAnalysis: latestJobAnalysis
          ? {
              _id: latestJobAnalysis._id,
              title: latestJobAnalysis.title,
              company: latestJobAnalysis.company,
              matchScore: latestJobAnalysis.matchResults?.overallMatchScore || 0,
              createdAt: latestJobAnalysis.createdAt,
            }
          : null,

        roadmapProgress: {
          existingSkills: {
            roadmapId: latestExistingRoadmap?._id,
            title: latestExistingRoadmap?.title || 'Existing Skills Roadmap',
            ...existingProgressStats,
          },
          missingSkills: {
            roadmapId: latestMissingRoadmap?._id,
            title: latestMissingRoadmap?.title || 'Missing Skills Roadmap',
            ...missingProgressStats,
          },
        },

        assessmentStats: {
          totalAttempts,
          passedAttempts,
          passRate,
          recentAssessments,
          weakTopics,
        },

        readiness: {
          score: readinessScore,
          explanation: readinessExplanation,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
