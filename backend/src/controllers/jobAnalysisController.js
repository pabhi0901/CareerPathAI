import { PDFParse } from 'pdf-parse';
import { JobAnalysis } from '../models/JobAnalysis.js';
import { User } from '../models/User.js';
import { uploadDocument } from '../config/imagekit.js';
import { jobAnalysisGraph } from '../langgraph/jobAnalysisGraph.js';

// Safe PDF text extraction
const extractTextFromBuffer = async (buffer) => {
  try {
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    return result.text || '';
  } catch (err) {
    console.error('[PDF Parser] Error reading JD text:', err.message);
    return '';
  }
};

// @desc    Analyze Job Description (via text paste or PDF file)
// @route   POST /api/job-analysis/analyze
export const analyzeJob = async (req, res, next) => {
  try {
    let jobText = req.body.jobDescriptionText || '';
    let inputType = 'text';
    let fileUrl = null;
    let title = req.body.title || '';
    let company = req.body.company || '';

    // Handle PDF upload if provided
    if (req.file) {
      inputType = 'pdf';
      const parsedText = await extractTextFromBuffer(req.file.buffer);
      if (!parsedText || parsedText.trim().length < 30) {
        return res.status(400).json({
          success: false,
          message: 'Could not extract text from the uploaded PDF. Please paste the job description text directly.',
        });
      }
      jobText = parsedText;

      // Upload JD PDF to ImageKit
      const uploadResult = await uploadDocument({
        buffer: req.file.buffer,
        fileName: `jd-${Date.now()}-${req.file.originalname}`,
        folder: 'careerpath/job_descriptions',
      });
      fileUrl = uploadResult.url;
    }

    if (!jobText || jobText.trim().length < 30) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a job description with at least 30 characters of text or upload a valid PDF.',
      });
    }

    // Parse user-added missing skills
    let userAddedMissingSkills = [];
    if (req.body.userAddedMissingSkills) {
      if (Array.isArray(req.body.userAddedMissingSkills)) {
        userAddedMissingSkills = req.body.userAddedMissingSkills;
      } else {
        try {
          userAddedMissingSkills = JSON.parse(req.body.userAddedMissingSkills);
        } catch {
          userAddedMissingSkills = req.body.userAddedMissingSkills.split(',').map(s => s.trim()).filter(Boolean);
        }
      }
    }

    // Fetch user and confirmed skills
    const user = await User.findById(req.user._id);
    const studentSkills = user.studentProfile?.skills || [];

    // Invoke LangGraph job analysis graph
    const graphResult = await jobAnalysisGraph.invoke({
      jobDescriptionText: jobText,
      studentSkills,
      userAddedMissingSkills,
    });

    if (graphResult.error || !graphResult.output) {
      return res.status(500).json({
        success: false,
        message: `Job Analysis failed: ${graphResult.error || 'Invalid LLM response'}`,
      });
    }

    const { extractedRequirements, matchResults } = graphResult.output;

    const analysisTitle = title.trim() || extractedRequirements.targetRole || 'Target Role Analysis';

    // Save as an immutable historical record
    const jobAnalysis = await JobAnalysis.create({
      userId: req.user._id,
      title: analysisTitle,
      company: company.trim(),
      inputType,
      fileUrl,
      rawJobDescription: jobText,
      userAddedMissingSkills,
      extractedRequirements,
      matchResults,
      studentSkillsSnapshot: studentSkills.map(s => ({
        name: s.name,
        proficiency: s.proficiency,
        verified: s.verified,
      })),
    });

    res.status(201).json({
      success: true,
      message: 'Job description analyzed and saved successfully.',
      analysis: jobAnalysis,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all job analyses for user (history)
// @route   GET /api/job-analysis
export const getJobAnalyses = async (req, res, next) => {
  try {
    const analyses = await JobAnalysis.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .select('-rawJobDescription');

    res.status(200).json({
      success: true,
      analyses,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single job analysis by ID
// @route   GET /api/job-analysis/:id
export const getJobAnalysisById = async (req, res, next) => {
  try {
    const analysis = await JobAnalysis.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!analysis) {
      return res.status(404).json({
        success: false,
        message: 'Job analysis record not found.',
      });
    }

    res.status(200).json({
      success: true,
      analysis,
    });
  } catch (error) {
    next(error);
  }
};
