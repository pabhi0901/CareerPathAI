import { Assessment } from '../models/Assessment.js';
import { AssessmentAttempt } from '../models/AssessmentAttempt.js';
import { Roadmap } from '../models/Roadmap.js';
import { ModuleProgress } from '../models/ModuleProgress.js';
import { assessmentGraph } from '../langgraph/assessmentGraph.js';

// @desc    Get or generate assessment for a roadmap module
// @route   GET /api/assessments/:roadmapId/:moduleId
export const getOrGenerateAssessment = async (req, res, next) => {
  try {
    const { roadmapId, moduleId } = req.params;
    const userId = req.user._id;

    const roadmap = await Roadmap.findOne({ _id: roadmapId, userId });
    if (!roadmap) {
      return res.status(404).json({ success: false, message: 'Roadmap not found.' });
    }

    const moduleData = roadmap.modules.find(m => m.moduleId === moduleId);
    if (!moduleData) {
      return res.status(404).json({ success: false, message: 'Module not found in roadmap.' });
    }

    // 1. Check if assessment question set is already generated and saved in MongoDB
    let assessment = await Assessment.findOne({ roadmapId, moduleId });

    if (!assessment) {
      // Generate new assessment using LangGraph node
      const graphResult = await assessmentGraph.invoke({
        moduleTitle: moduleData.title,
        purpose: moduleData.purpose,
        topics: moduleData.topics,
        subtopics: moduleData.subtopics,
        questionCount: 10,
      });

      if (graphResult.error || !graphResult.output) {
        return res.status(500).json({
          success: false,
          message: `Assessment generation failed: ${graphResult.error || 'LLM error'}`,
        });
      }

      assessment = await Assessment.create({
        roadmapId,
        moduleId,
        moduleTitle: moduleData.title,
        passingPercentage: 75,
        questionCount: graphResult.output.questions.length,
        questions: graphResult.output.questions,
      });
    }

    // IMPORTANT SECURITY REQUIREMENT (Section 9):
    // "Questions and answer keys must be stored separately from the response sent to the student during an active attempt. Never expose correct answers before submission."
    const sanitizedQuestions = assessment.questions.map(q => ({
      questionId: q.questionId,
      questionText: q.questionText,
      codeSnippet: q.codeSnippet || '',
      codeLanguage: q.codeLanguage || 'javascript',
      options: q.options,
      topic: q.topic,
      difficulty: q.difficulty,
      marks: q.marks,
      // Omit correctAnswerIndex and explanation!
    }));

    // Fetch student's existing attempt count
    const attemptCount = await AssessmentAttempt.countDocuments({
      userId,
      assessmentId: assessment._id,
    });

    res.status(200).json({
      success: true,
      assessment: {
        _id: assessment._id,
        roadmapId: assessment.roadmapId,
        moduleId: assessment.moduleId,
        moduleTitle: assessment.moduleTitle,
        passingPercentage: assessment.passingPercentage,
        questionCount: sanitizedQuestions.length,
        attemptNumber: attemptCount + 1,
        questions: sanitizedQuestions,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit assessment attempt and calculate score independently on backend
// @route   POST /api/assessments/:roadmapId/:moduleId/submit
export const submitAssessment = async (req, res, next) => {
  try {
    const { roadmapId, moduleId } = req.params;
    const { answers = [] } = req.body; // array of { questionId, selectedOptionIndex }
    const userId = req.user._id;

    const assessment = await Assessment.findOne({ roadmapId, moduleId });
    if (!assessment) {
      return res.status(404).json({ success: false, message: 'Assessment not found.' });
    }

    // Map answers by questionId
    const submittedAnswersMap = new Map();
    answers.forEach(a => {
      submittedAnswersMap.set(a.questionId, Number(a.selectedOptionIndex));
    });

    let correctCount = 0;
    let totalMarks = 0;
    let maxMarks = 0;

    const evaluatedAnswers = [];
    const topicStats = {}; // topic -> { total, correct }

    // Evaluate answers against stored questions
    assessment.questions.forEach(q => {
      const qMarks = q.marks || 1;
      maxMarks += qMarks;

      const selectedOptionIndex = submittedAnswersMap.has(q.questionId)
        ? submittedAnswersMap.get(q.questionId)
        : -1;

      const isCorrect = selectedOptionIndex === q.correctAnswerIndex;
      const marksAwarded = isCorrect ? qMarks : 0;

      if (isCorrect) {
        correctCount += 1;
        totalMarks += qMarks;
      }

      // Topic statistics
      if (!topicStats[q.topic]) {
        topicStats[q.topic] = { total: 0, correct: 0 };
      }
      topicStats[q.topic].total += 1;
      if (isCorrect) topicStats[q.topic].correct += 1;

      evaluatedAnswers.push({
        questionId: q.questionId,
        selectedOptionIndex,
        correctAnswerIndex: q.correctAnswerIndex,
        isCorrect,
        marksAwarded,
        questionText: q.questionText,
        codeSnippet: q.codeSnippet || '',
        codeLanguage: q.codeLanguage || 'javascript',
        options: q.options,
        explanation: q.explanation,
        topic: q.topic,
      });
    });

    // Score calculation
    const totalQuestions = assessment.questions.length;
    const percentage = Math.round((totalMarks / (maxMarks || 1)) * 100);

    // Section 10: 75% rule
    const PASSING_THRESHOLD = 75;
    const passed = percentage >= PASSING_THRESHOLD;

    // Topic breakdown and weak topics
    const topicBreakdown = [];
    const weakTopics = [];
    const revisionRecommendations = [];

    Object.entries(topicStats).forEach(([topic, stats]) => {
      const tPct = Math.round((stats.correct / stats.total) * 100);
      topicBreakdown.push({
        topic,
        totalQuestions: stats.total,
        correctQuestions: stats.correct,
        percentage: tPct,
      });

      if (tPct < 75) {
        weakTopics.push(topic);
        revisionRecommendations.push(
          `Review ${topic} concepts and revisit the module code examples (${stats.correct}/${stats.total} correct).`
        );
      }
    });

    // Determine attempt number
    const previousAttemptsCount = await AssessmentAttempt.countDocuments({
      userId,
      assessmentId: assessment._id,
    });
    const currentAttemptNumber = previousAttemptsCount + 1;

    // Save AssessmentAttempt in MongoDB
    const attempt = await AssessmentAttempt.create({
      userId,
      assessmentId: assessment._id,
      roadmapId,
      moduleId,
      attemptNumber: currentAttemptNumber,
      submittedAnswers: evaluatedAnswers.map(e => ({
        questionId: e.questionId,
        selectedOptionIndex: e.selectedOptionIndex,
        isCorrect: e.isCorrect,
        marksAwarded: e.marksAwarded,
      })),
      totalQuestions,
      correctCount,
      score: totalMarks,
      maxScore: maxMarks,
      percentage,
      passed,
      passingThreshold: PASSING_THRESHOLD,
      topicBreakdown,
      weakTopics,
      revisionRecommendations,
    });

    // Update ModuleProgress: Only mark completed if score >= 75%
    let progress = await ModuleProgress.findOne({ userId, roadmapId, moduleId });
    if (!progress) {
      progress = new ModuleProgress({ userId, roadmapId, moduleId });
    }

    progress.attemptsCount = currentAttemptNumber;
    progress.bestScorePercentage = Math.max(progress.bestScorePercentage || 0, percentage);

    if (passed) {
      progress.status = 'completed';
      progress.completedAt = new Date();
      progress.passedAssessmentAttemptId = attempt._id;

      // UNLOCK NEXT MODULES THAT DEPEND ON THIS MODULE
      const roadmap = await Roadmap.findById(roadmapId);
      if (roadmap) {
        for (const mod of roadmap.modules) {
          // If this module was in their prerequisites
          if (mod.prerequisites && mod.prerequisites.includes(moduleId)) {
            // Check if all prerequisites of mod are completed
            const allPrereqProgress = await ModuleProgress.find({
              userId,
              roadmapId,
              moduleId: { $in: mod.prerequisites },
            });
            const allCompleted = mod.prerequisites.every(pId =>
              allPrereqProgress.some(p => p.moduleId === pId && p.status === 'completed')
            );

            if (allCompleted) {
              await ModuleProgress.findOneAndUpdate(
                { userId, roadmapId, moduleId: mod.moduleId },
                { status: 'unlocked' },
                { upsert: true }
              );
            }
          }
        }
      }
    } else {
      if (progress.status !== 'completed') {
        progress.status = 'in_progress';
      }
    }

    await progress.save();

    res.status(200).json({
      success: true,
      message: passed
        ? `Congratulations! You passed with ${percentage}% (threshold: 75%). Module marked complete.`
        : `Assessment not passed. Score: ${percentage}% (threshold: 75%). Please review weak topics and retry.`,
      result: {
        attemptId: attempt._id,
        attemptNumber: currentAttemptNumber,
        score: totalMarks,
        maxScore: maxMarks,
        correctCount,
        totalQuestions,
        percentage,
        passed,
        passingThreshold: PASSING_THRESHOLD,
        topicBreakdown,
        weakTopics,
        revisionRecommendations,
        evaluatedAnswers,
        moduleStatus: progress.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all attempts for a module
// @route   GET /api/assessments/:roadmapId/:moduleId/attempts
export const getModuleAttempts = async (req, res, next) => {
  try {
    const { roadmapId, moduleId } = req.params;
    const attempts = await AssessmentAttempt.find({
      userId: req.user._id,
      roadmapId,
      moduleId,
    }).sort({ attemptNumber: -1 });

    res.status(200).json({
      success: true,
      attempts,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's entire assessment attempt history
// @route   GET /api/assessments/history
export const getAllAssessmentHistory = async (req, res, next) => {
  try {
    const attempts = await AssessmentAttempt.find({ userId: req.user._id })
      .populate('assessmentId', 'moduleTitle')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      attempts,
    });
  } catch (error) {
    next(error);
  }
};
