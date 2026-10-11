import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema(
  {
    questionId: {
      type: String,
      required: true,
    },
    questionText: {
      type: String,
      required: true,
    },
    codeSnippet: {
      type: String,
      default: '',
    },
    codeLanguage: {
      type: String,
      default: 'javascript',
    },
    options: {
      type: [String],
      required: true,
      validate: [val => val.length === 4, 'Each question must have exactly 4 options'],
    },
    correctAnswerIndex: {
      type: Number,
      required: true,
      min: 0,
      max: 3,
    },
    explanation: {
      type: String,
      required: true,
    },
    topic: {
      type: String,
      required: true,
    },
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'intermediate',
    },
    marks: {
      type: Number,
      default: 1,
    },
  },
  { _id: false }
);

const assessmentSchema = new mongoose.Schema(
  {
    roadmapId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Roadmap',
      required: true,
      index: true,
    },
    moduleId: {
      type: String,
      required: true,
      index: true,
    },
    moduleTitle: {
      type: String,
      required: true,
    },
    passingPercentage: {
      type: Number,
      default: 75,
    },
    questionCount: {
      type: Number,
      required: true,
    },
    questions: [questionSchema],
  },
  {
    timestamps: true,
  }
);

assessmentSchema.index({ roadmapId: 1, moduleId: 1 }, { unique: true });

export const Assessment = mongoose.model('Assessment', assessmentSchema);
