import mongoose from 'mongoose';

const submittedAnswerSchema = new mongoose.Schema(
  {
    questionId: {
      type: String,
      required: true,
    },
    selectedOptionIndex: {
      type: Number,
      required: true,
      min: 0,
      max: 3,
    },
    isCorrect: {
      type: Boolean,
      required: true,
    },
    marksAwarded: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  { _id: false }
);

const topicBreakdownSchema = new mongoose.Schema(
  {
    topic: String,
    totalQuestions: Number,
    correctQuestions: Number,
    percentage: Number,
  },
  { _id: false }
);

const assessmentAttemptSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    assessmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Assessment',
      required: true,
      index: true,
    },
    roadmapId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Roadmap',
      required: true,
    },
    moduleId: {
      type: String,
      required: true,
    },
    attemptNumber: {
      type: Number,
      required: true,
    },
    submittedAnswers: [submittedAnswerSchema],
    totalQuestions: {
      type: Number,
      required: true,
    },
    correctCount: {
      type: Number,
      required: true,
    },
    score: {
      type: Number,
      required: true,
    },
    maxScore: {
      type: Number,
      required: true,
    },
    percentage: {
      type: Number,
      required: true,
    },
    passed: {
      type: Boolean,
      required: true,
    },
    passingThreshold: {
      type: Number,
      default: 75,
    },
    topicBreakdown: [topicBreakdownSchema],
    weakTopics: [String],
    revisionRecommendations: [String],
  },
  {
    timestamps: true,
  }
);

assessmentAttemptSchema.index({ userId: 1, assessmentId: 1, attemptNumber: 1 });

export const AssessmentAttempt = mongoose.model('AssessmentAttempt', assessmentAttemptSchema);
