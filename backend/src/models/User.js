import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const skillItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    proficiency: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
      default: 'Intermediate',
    },
    verified: {
      type: Boolean,
      default: false,
    },
    source: {
      type: String,
      enum: ['manual', 'resume_extracted', 'assessment_passed'],
      default: 'manual',
    },
    evidence: {
      type: String,
      default: '',
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const projectItemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    techStack: [
      {
        type: String,
        trim: true,
      },
    ],
    link: {
      type: String,
      default: '',
    },
  },
  { _id: true }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/\S+@\S+\.\S+/, 'Please use a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false, // Don't return password by default
    },
    studentProfile: {
      degree: {
        type: String,
        default: 'B.Tech / B.E.',
      },
      branch: {
        type: String,
        default: 'Computer Science & Engineering',
      },
      academicYear: {
        type: String,
        default: '3rd Year',
      },
      graduationYear: {
        type: Number,
        default: 2026,
      },
      targetRole: {
        type: String,
        default: 'Full Stack Engineer',
        trim: true,
      },
      targetCompany: {
        type: String,
        default: '',
        trim: true,
      },
      availableHoursPerDay: {
        type: Number,
        default: 3,
        min: 1,
        max: 16,
      },
      placementDeadline: {
        type: Date,
        default: () => new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // Default 90 days from now
      },
      skills: [skillItemSchema],
      projects: [projectItemSchema],
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate JWT token
userSchema.methods.generateAuthToken = function () {
  return jwt.sign(
    { id: this._id, email: this.email, name: this.name },
    process.env.JWT_SECRET || 'careerpath_secret_jwt_fallback_key',
    { expiresIn: '7d' }
  );
};

export const User = mongoose.model('User', userSchema);
