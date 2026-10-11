import { StateGraph, Annotation, START, END } from '@langchain/langgraph';
import { z } from 'zod';
import { getGeminiModel } from './geminiClient.js';

// Define Zod schema for structured resume extraction
export const ResumeExtractionSchema = z.object({
  skills: z.array(
    z.object({
      name: z.string().describe('Name of the skill, normalized (e.g. React, Node.js, Python, PostgreSQL)'),
      category: z.string().describe('e.g. Frontend, Backend, Database, Cloud, DevOps, Core CS, Soft Skills'),
      proficiencyLevel: z.enum(['Beginner', 'Intermediate', 'Advanced', 'Expert']).describe('Inferred proficiency based on resume evidence'),
      evidenceFromResume: z.string().describe('Direct snippet or evidence from resume where this skill was used'),
    })
  ).describe('List of extracted skills with supporting evidence'),

  technologies: z.array(
    z.object({
      name: z.string().describe('Tool, framework, or library name'),
      category: z.string().describe('Category of technology'),
      contextOfUsage: z.string().describe('How the student used this technology'),
    })
  ).describe('Technologies and tools mentioned in projects or experience'),

  experienceHighlights: z.array(z.string()).describe('Key career, internship, or role highlights extracted from resume'),

  projectEvidence: z.array(
    z.object({
      projectName: z.string(),
      techStack: z.array(z.string()),
      highlights: z.string(),
    })
  ).describe('Projects detailed in the resume with tech stack and achievements'),

  education: z.array(z.string()).describe('Degrees, college/university, GPA, and graduation year'),
  certifications: z.array(z.string()).describe('Certifications or courses completed'),
});

// Explicit LangGraph State definition
export const ResumeExtractionState = Annotation.Root({
  resumeText: Annotation(),
  extractedData: Annotation(),
  error: Annotation(),
});

// Core Node: resumeSkillExtractionNode
export const resumeSkillExtractionNode = async (state) => {
  const { resumeText } = state;
  if (!resumeText || resumeText.trim().length === 0) {
    throw new Error('Resume text is empty or unreadable.');
  }

  const model = getGeminiModel(0.1);
  const structuredModel = model.withStructuredOutput(ResumeExtractionSchema);

  const prompt = `You are an expert technical recruiter and resume analyst.
Analyze the following student resume text thoroughly.
Extract all technical skills, frameworks, tools, database systems, core CS concepts, and libraries.
For EVERY extracted skill:
- Normalize the name cleanly (e.g., 'ReactJS' -> 'React', 'Node' -> 'Node.js', 'Postgres' -> 'PostgreSQL').
- Determine inferred proficiency ('Beginner', 'Intermediate', 'Advanced', 'Expert') based strictly on how it is used in projects or experience.
- Provide concrete evidence or quote the project context from the text.
Do NOT invent or hallucinate skills not present in the resume.

Resume text:
\"\"\"
${resumeText.slice(0, 30000)}
\"\"\"`;

  try {
    const extractedData = await structuredModel.invoke(prompt);
    return { extractedData };
  } catch (err) {
    return { error: err.message };
  }
};

// Build StateGraph
const workflow = new StateGraph(ResumeExtractionState)
  .addNode('resumeSkillExtractionNode', resumeSkillExtractionNode)
  .addEdge(START, 'resumeSkillExtractionNode')
  .addEdge('resumeSkillExtractionNode', END);

export const resumeExtractionGraph = workflow.compile();
