import mongoose from 'mongoose';

const moduleProgressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    roadmapId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Roadmap',
      required: true,
      index: true,
    },
    moduleId: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['locked', 'unlocked', 'in_progress', 'completed'],
      default: 'unlocked',
    },
    completedAt: {
      type: Date,
      default: null,
    },
    bestScorePercentage: {
      type: Number,
      default: 0,
    },
    attemptsCount: {
      type: Number,
      default: 0,
    },
    passedAssessmentAttemptId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AssessmentAttempt',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

moduleProgressSchema.index({ userId: 1, roadmapId: 1, moduleId: 1 }, { unique: true });

export const ModuleProgress = mongoose.model('ModuleProgress', moduleProgressSchema);
