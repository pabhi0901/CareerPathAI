import mongoose from 'mongoose';

const resumeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    imagekitFileId: {
      type: String,
      required: true,
    },
    fileUrl: {
      type: String,
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    version: {
      type: Number,
      required: true,
      default: 1,
    },
    extractionStatus: {
      type: String,
      enum: ['pending', 'extracted', 'failed', 'confirmed'],
      default: 'pending',
    },
    rawExtractedText: {
      type: String,
      default: '',
    },
    extractedData: {
      skills: [
        {
          name: String,
          category: String,
          proficiencyLevel: String,
          evidenceFromResume: String,
        },
      ],
      technologies: [
        {
          name: String,
          category: String,
          contextOfUsage: String,
        },
      ],
      experienceHighlights: [String],
      projectEvidence: [
        {
          projectName: String,
          techStack: [String],
          highlights: String,
        },
      ],
      education: [String],
      certifications: [String],
    },
    uploadDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

resumeSchema.index({ userId: 1, version: -1 });

export const Resume = mongoose.model('Resume', resumeSchema);
