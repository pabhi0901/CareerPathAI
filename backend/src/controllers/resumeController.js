import { PDFParse } from 'pdf-parse';
import { Resume } from '../models/Resume.js';
import { User } from '../models/User.js';
import { uploadDocument } from '../config/imagekit.js';
import { resumeExtractionGraph } from '../langgraph/resumeExtractionGraph.js';

// Helper to safely extract text from PDF buffer
const extractTextFromPdfBuffer = async (buffer) => {
  try {
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    return result.text || '';
  } catch (err) {
    console.error('[PDF Parser] Error reading text:', err.message);
    return '';
  }
};

// @desc    Upload new resume PDF version
// @route   POST /api/resumes/upload
export const uploadResume = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No resume PDF file uploaded. Please select a valid .pdf file.',
      });
    }

    const userId = req.user._id;

    // Get latest version number for this user
    const latestResume = await Resume.findOne({ userId }).sort({ version: -1 });
    const newVersion = latestResume ? latestResume.version + 1 : 1;

    // 1. Upload to ImageKit (or local fallback)
    const uploadResult = await uploadDocument({
      buffer: req.file.buffer,
      fileName: `resume-v${newVersion}-${req.file.originalname}`,
      folder: 'careerpath/resumes',
    });

    // 2. Extract text from PDF buffer on the backend
    const extractedText = await extractTextFromPdfBuffer(req.file.buffer);

    // 3. Save Resume record in MongoDB
    const resume = await Resume.create({
      userId,
      imagekitFileId: uploadResult.fileId,
      fileUrl: uploadResult.url,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      version: newVersion,
      rawExtractedText: extractedText,
      extractionStatus: 'pending',
    });

    res.status(201).json({
      success: true,
      message: `Resume version ${newVersion} uploaded successfully.`,
      resume: {
        _id: resume._id,
        version: resume.version,
        fileName: resume.fileName,
        fileSize: resume.fileSize,
        fileUrl: resume.fileUrl,
        uploadDate: resume.uploadDate,
        extractionStatus: resume.extractionStatus,
        hasText: Boolean(extractedText && extractedText.trim().length > 30),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all resume versions for student
// @route   GET /api/resumes
export const getResumes = async (req, res, next) => {
  try {
    const resumes = await Resume.find({ userId: req.user._id })
      .sort({ version: -1 })
      .select('-rawExtractedText');

    res.status(200).json({
      success: true,
      resumes,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get latest resume
// @route   GET /api/resumes/latest
export const getLatestResume = async (req, res, next) => {
  try {
    const latestResume = await Resume.findOne({ userId: req.user._id }).sort({ version: -1 });
    if (!latestResume) {
      return res.status(404).json({
        success: false,
        message: 'No resume found for this user.',
      });
    }

    res.status(200).json({
      success: true,
      resume: latestResume,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Extract skills from specific resume (or latest) via LangGraph
// @route   POST /api/resumes/:id/extract or POST /api/resumes/latest/extract
export const extractResumeSkills = async (req, res, next) => {
  try {
    const { id } = req.params;
    let resume;

    if (id === 'latest') {
      resume = await Resume.findOne({ userId: req.user._id }).sort({ version: -1 });
    } else {
      resume = await Resume.findOne({ _id: id, userId: req.user._id });
    }

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume record not found.',
      });
    }

    if (!resume.rawExtractedText || resume.rawExtractedText.trim().length < 20) {
      return res.status(400).json({
        success: false,
        message: 'Resume text could not be read or the PDF contains scanned images without selectable text.',
      });
    }

    // Run LangGraph resume extraction workflow
    const graphResult = await resumeExtractionGraph.invoke({
      resumeText: resume.rawExtractedText,
    });

    if (graphResult.error) {
      resume.extractionStatus = 'failed';
      await resume.save();
      return res.status(500).json({
        success: false,
        message: `AI Skill Extraction failed: ${graphResult.error}`,
      });
    }

    resume.extractedData = graphResult.extractedData;
    resume.extractionStatus = 'extracted';
    await resume.save();

    res.status(200).json({
      success: true,
      message: 'Skills extracted successfully. Please review and confirm them for your profile.',
      resumeId: resume._id,
      version: resume.version,
      extractedData: resume.extractedData,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Confirm reviewed skills and add them to User profile
// @route   POST /api/resumes/:id/confirm-skills
export const confirmExtractedSkills = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { selectedSkills = [] } = req.body;

    if (!Array.isArray(selectedSkills) || selectedSkills.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide at least one skill to confirm.',
      });
    }

    const resume = await Resume.findOne({ _id: id, userId: req.user._id });
    if (!resume) {
      return res.status(404).json({ success: false, message: 'Resume not found.' });
    }

    const user = await User.findById(req.user._id);

    // Merge confirmed skills into user profile without blind overwriting
    selectedSkills.forEach(newSkill => {
      const existing = user.studentProfile.skills.find(
        s => s.name.toLowerCase() === newSkill.name.toLowerCase().trim()
      );

      if (existing) {
        existing.proficiency = newSkill.proficiencyLevel || existing.proficiency;
        existing.evidence = newSkill.evidenceFromResume || existing.evidence;
        existing.source = 'resume_extracted';
      } else {
        user.studentProfile.skills.push({
          name: newSkill.name.trim(),
          proficiency: newSkill.proficiencyLevel || 'Intermediate',
          verified: false,
          source: 'resume_extracted',
          evidence: newSkill.evidenceFromResume || '',
          addedAt: new Date(),
        });
      }
    });

    resume.extractionStatus = 'confirmed';
    await resume.save();
    await user.save();

    res.status(200).json({
      success: true,
      message: `Confirmed and added ${selectedSkills.length} skills to student profile.`,
      skills: user.studentProfile.skills,
    });
  } catch (error) {
    next(error);
  }
};
