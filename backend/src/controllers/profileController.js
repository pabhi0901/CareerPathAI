import { User } from '../models/User.js';

// @desc    Get user profile
// @route   GET /api/profile
export const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.status(200).json({
      success: true,
      profile: user.studentProfile,
      name: user.name,
      email: user.email,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update student academic and career preferences
// @route   PUT /api/profile
export const updateProfile = async (req, res, next) => {
  try {
    const {
      degree,
      branch,
      academicYear,
      graduationYear,
      targetRole,
      targetCompany,
      availableHoursPerDay,
      placementDeadline,
    } = req.body;

    const user = await User.findById(req.user._id);

    if (degree !== undefined) user.studentProfile.degree = degree;
    if (branch !== undefined) user.studentProfile.branch = branch;
    if (academicYear !== undefined) user.studentProfile.academicYear = academicYear;
    if (graduationYear !== undefined) user.studentProfile.graduationYear = graduationYear;
    if (targetRole !== undefined) user.studentProfile.targetRole = targetRole;
    if (targetCompany !== undefined) user.studentProfile.targetCompany = targetCompany;
    if (availableHoursPerDay !== undefined) user.studentProfile.availableHoursPerDay = Number(availableHoursPerDay);
    if (placementDeadline !== undefined) user.studentProfile.placementDeadline = new Date(placementDeadline);

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      profile: user.studentProfile,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add a confirmed skill to student profile
// @route   POST /api/profile/skills
export const addSkill = async (req, res, next) => {
  try {
    const { name, proficiency = 'Intermediate', verified = false, source = 'manual', evidence = '' } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Skill name is required.' });
    }

    const user = await User.findById(req.user._id);
    const trimmedName = name.trim();

    // Check if skill already exists
    const existingIndex = user.studentProfile.skills.findIndex(
      s => s.name.toLowerCase() === trimmedName.toLowerCase()
    );

    if (existingIndex >= 0) {
      // Update existing skill
      user.studentProfile.skills[existingIndex].proficiency = proficiency;
      user.studentProfile.skills[existingIndex].evidence = evidence || user.studentProfile.skills[existingIndex].evidence;
      user.studentProfile.skills[existingIndex].verified = verified || user.studentProfile.skills[existingIndex].verified;
    } else {
      user.studentProfile.skills.push({
        name: trimmedName,
        proficiency,
        verified,
        source,
        evidence,
        addedAt: new Date(),
      });
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Skill added to profile.',
      skills: user.studentProfile.skills,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a skill in profile
// @route   PUT /api/profile/skills/:skillId
export const updateSkill = async (req, res, next) => {
  try {
    const { skillId } = req.params;
    const { proficiency, verified } = req.body;

    const user = await User.findById(req.user._id);
    const skill = user.studentProfile.skills.id(skillId);

    if (!skill) {
      return res.status(404).json({ success: false, message: 'Skill not found in profile.' });
    }

    if (proficiency !== undefined) skill.proficiency = proficiency;
    if (verified !== undefined) skill.verified = verified;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Skill updated.',
      skills: user.studentProfile.skills,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove skill from student profile
// @route   DELETE /api/profile/skills/:skillId
export const removeSkill = async (req, res, next) => {
  try {
    const { skillId } = req.params;

    const user = await User.findById(req.user._id);
    user.studentProfile.skills = user.studentProfile.skills.filter(
      s => s._id.toString() !== skillId
    );

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Skill removed from profile.',
      skills: user.studentProfile.skills,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add project to profile
// @route   POST /api/profile/projects
export const addProject = async (req, res, next) => {
  try {
    const { title, description, techStack, link } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, message: 'Project title is required.' });
    }

    const user = await User.findById(req.user._id);
    user.studentProfile.projects.push({
      title,
      description: description || '',
      techStack: Array.isArray(techStack) ? techStack : (techStack || '').split(',').map(s => s.trim()).filter(Boolean),
      link: link || '',
    });

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Project added.',
      projects: user.studentProfile.projects,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete project from profile
// @route   DELETE /api/profile/projects/:projectId
export const deleteProject = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    const user = await User.findById(req.user._id);
    user.studentProfile.projects = user.studentProfile.projects.filter(
      p => p._id.toString() !== projectId
    );

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Project removed.',
      projects: user.studentProfile.projects,
    });
  } catch (error) {
    next(error);
  }
};
