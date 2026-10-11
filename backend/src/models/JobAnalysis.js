import mongoose from 'mongoose';

const skillMatchItemSchema = new mongoose.Schema(
  {
    skillName: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      default: 'technical',
    },
    status: {
      type: String,
      enum: ['matched', 'partially_matched', 'missing', 'optional'],
      required: true,
    },
    studentProficiency: {
      type: String,
      default: null,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    importance: {
      type: String,
      enum: ['mandatory', 'preferred', 'optional'],
      default: 'mandatory',
    },
    evidenceOrReason: {
      type: String,
      default: '',
    },
  },
  { _id: false }
);

const jobAnalysisSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    company: {
      type: String,
      default: '',
      trim: true,
    },
    inputType: {
      type: String,
      enum: ['text', 'pdf'],
      default: 'text',
    },
    fileUrl: {
      type: String,
      default: null,
    },
    rawJobDescription: {
      type: String,
      required: true,
    },
    userAddedMissingSkills: [
      {
        type: String,
        trim: true,
      },
    ],
    extractedRequirements: {
      targetRole: String,
      requiredTechnicalSkills: [String],
      preferredSkills: [String],
      toolsAndTechnologies: [String],
      experienceRequirements: String,
      educationalRequirements: String,
      responsibilities: [String],
    },
    matchResults: {
      matchedSkills: [skillMatchItemSchema],
      partiallyMatchedSkills: [skillMatchItemSchema],
      missingSkills: [skillMatchItemSchema],
      optionalSkills: [skillMatchItemSchema],
      overallMatchScore: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },
      analysisSummary: {
        type: String,
        default: '',
      },
    },
    studentSkillsSnapshot: [
      {
        name: String,
        proficiency: String,
        verified: Boolean,
      },
    ],
  },
  {
    timestamps: true,
  }
);

jobAnalysisSchema.index({ userId: 1, createdAt: -1 });

export const JobAnalysis = mongoose.model('JobAnalysis', jobAnalysisSchema);
