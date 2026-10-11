import mongoose from 'mongoose';

const codeSnippetSchema = new mongoose.Schema(
  {
    title: String,
    language: {
      type: String,
      default: 'javascript',
    },
    code: String,
    explanation: String,
  },
  { _id: false }
);

const resourceSchema = new mongoose.Schema(
  {
    title: String,
    url: String,
    type: {
      type: String,
      enum: ['official_docs', 'tutorial', 'article', 'interactive_spec'],
      default: 'official_docs',
    },
    description: String,
  },
  { _id: false }
);

const practiceExerciseSchema = new mongoose.Schema(
  {
    title: String,
    description: String,
    task: String,
    solutionHint: String,
  },
  { _id: false }
);

const roadmapModuleSchema = new mongoose.Schema(
  {
    moduleId: {
      type: String,
      required: true,
    },
    order: {
      type: Number,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    purpose: {
      type: String,
      default: '',
    },
    estimatedStudyDuration: {
      type: String,
      default: '3-4 hours',
    },
    prerequisites: [
      {
        type: String, // references other moduleIds or skill names
      },
    ],
    topics: [String],
    subtopics: [String],
    detailedExplanation: {
      type: String,
      default: '',
    },
    practicalApplications: [String],
    codeSnippets: [codeSnippetSchema],
    curatedResources: [resourceSchema],
    practiceExercises: [practiceExerciseSchema],
    assessmentRequired: {
      type: Boolean,
      default: true,
    },
  },
  { _id: true }
);

const roadmapSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    jobAnalysisId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'JobAnalysis',
      required: true,
      index: true,
    },
    roadmapType: {
      type: String,
      enum: ['existing_skills', 'missing_skills'],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: '',
    },
    targetRole: {
      type: String,
      default: '',
    },
    version: {
      type: Number,
      default: 1,
    },
    studyConstraintDetails: {
      availableHoursPerDay: Number,
      targetDeadline: Date,
      totalEstimatedWeeks: Number,
    },
    modules: [roadmapModuleSchema],
  },
  {
    timestamps: true,
  }
);

roadmapSchema.index({ userId: 1, jobAnalysisId: 1, roadmapType: 1, version: -1 });

export const Roadmap = mongoose.model('Roadmap', roadmapSchema);
