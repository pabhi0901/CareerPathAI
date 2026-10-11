import { StateGraph, Annotation, START, END } from '@langchain/langgraph';
import { z } from 'zod';
import { getGeminiModel } from './geminiClient.js';

// Zod Schema for Structured Job Analysis & Skill Matching
export const SkillMatchItemSchema = z.object({
  skillName: z.string().describe('Standardized name of the required skill (e.g., Docker, TypeScript, React)'),
  category: z.string().describe('Category (e.g., Frontend, Backend, Database, Cloud/DevOps, System Design)'),
  status: z.enum(['matched', 'partially_matched', 'missing', 'optional']).describe('Classification against student skills'),
  studentProficiency: z.string().default('Not Claimed').describe('Student current proficiency if claimed or Not Claimed'),
  isVerified: z.boolean().describe('Whether student has verified this skill through assessments'),
  importance: z.enum(['mandatory', 'preferred', 'optional']).describe('Importance level in the job description'),
  evidenceOrReason: z.string().describe('Detailed explanation of why this skill was classified into this status, comparing JD expectation and student profile'),
});

export const JobAnalysisOutputSchema = z.object({
  extractedRequirements: z.object({
    targetRole: z.string().describe('The primary job title or role described in the JD'),
    requiredTechnicalSkills: z.array(z.string()).describe('Core non-negotiable technical skills'),
    preferredSkills: z.array(z.string()).describe('Preferred or nice-to-have skills'),
    toolsAndTechnologies: z.array(z.string()).describe('Tools, IDEs, CI/CD, or platforms specified'),
    experienceRequirements: z.string().describe('Years of experience or candidate seniority required'),
    educationalRequirements: z.string().describe('Degree or academic qualification requirements'),
    responsibilities: z.array(z.string()).describe('Key daily responsibilities and deliverables'),
  }),
  matchResults: z.object({
    matchedSkills: z.array(SkillMatchItemSchema).describe('Skills clearly possessed and demonstrated by the student'),
    partiallyMatchedSkills: z.array(SkillMatchItemSchema).describe('Skills student has beginner or unverified exposure to, or related concepts'),
    missingSkills: z.array(SkillMatchItemSchema).describe('Mandatory or preferred skills not present in student profile'),
    optionalSkills: z.array(SkillMatchItemSchema).describe('Optional or preferred skills missing from profile'),
    overallMatchScore: z.number().min(0).max(100).describe('Calculated percentage match score (0-100) reflecting role readiness'),
    analysisSummary: z.string().describe('Comprehensive editorial overview summarizing the candidate match strengths, key gap areas, and immediate priorities'),
  }),
});

// Explicit LangGraph State
export const JobAnalysisState = Annotation.Root({
  jobDescriptionText: Annotation(),
  studentSkills: Annotation(),
  userAddedMissingSkills: Annotation(),
  output: Annotation(),
  error: Annotation(),
});

// Core Node: skillMatchingNode
export const skillMatchingNode = async (state) => {
  const { jobDescriptionText, studentSkills = [], userAddedMissingSkills = [] } = state;

  if (!jobDescriptionText || jobDescriptionText.trim().length === 0) {
    throw new Error('Job description text is empty or missing.');
  }

  const model = getGeminiModel(0.15);
  const structuredModel = model.withStructuredOutput(JobAnalysisOutputSchema);

  const formattedStudentSkills = studentSkills.map(s => {
    return `- ${s.name} (Proficiency: ${s.proficiency || 'Intermediate'}, Verified: ${s.verified ? 'Yes' : 'No'}, Source: ${s.source || 'manual'})`;
  }).join('\n');

  const additionalSkillsNote = userAddedMissingSkills.length > 0
    ? `Student highlighted these additional skills that may be relevant: ${userAddedMissingSkills.join(', ')}`
    : '';

  const prompt = `You are a Senior Technical Hiring Lead and Career Analyst.
Carefully parse the target Job Description and compare it against the student's confirmed skills profile.

Student's Confirmed Profile Skills:
${formattedStudentSkills || 'No confirmed skills on profile yet.'}

${additionalSkillsNote}

Job Description:
\"\"\"
${jobDescriptionText.slice(0, 30000)}
\"\"\"

Guidelines for Skill Normalization and Matching:
1. Normalize equivalent terms (e.g., 'JavaScript' = 'JS', 'React.js' = 'React', 'Postgres' = 'PostgreSQL', 'Golang' = 'Go').
2. Classify:
   - 'matched': Student has the skill with good proficiency.
   - 'partially_matched': Student claims beginner proficiency, unverified status, or knows a closely related technology but lacks depth.
   - 'missing': Required technical skill completely absent from student profile.
   - 'optional': Preferred/bonus skill not present in student profile.
3. Keep mandatory requirements strictly distinct from nice-to-have requirements.
4. Calculate an objective 'overallMatchScore' (0-100) based on mandatory skill coverage and partial matches.
5. Provide precise, constructive 'evidenceOrReason' for each skill classification.`;

  try {
    const output = await structuredModel.invoke(prompt);
    return { output };
  } catch (err) {
    return { error: err.message };
  }
};

// Build StateGraph
const workflow = new StateGraph(JobAnalysisState)
  .addNode('skillMatchingNode', skillMatchingNode)
  .addEdge(START, 'skillMatchingNode')
  .addEdge('skillMatchingNode', END);

export const jobAnalysisGraph = workflow.compile();
