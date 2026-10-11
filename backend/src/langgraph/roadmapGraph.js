import { StateGraph, Annotation, START, END } from '@langchain/langgraph';
import { z } from 'zod';
import { getGeminiModel } from './geminiClient.js';

// Module schema for structured roadmap output
const CodeSnippetSchema = z.object({
  title: z.string(),
  language: z.string().default('javascript'),
  code: z.string(),
  explanation: z.string(),
});

const ResourceSchema = z.object({
  title: z.string(),
  url: z.string(),
  type: z.enum(['official_docs', 'tutorial', 'article', 'interactive_spec']),
  description: z.string(),
});

const PracticeExerciseSchema = z.object({
  title: z.string(),
  description: z.string(),
  task: z.string(),
  solutionHint: z.string(),
});

const RoadmapModuleSchema = z.object({
  moduleId: z.string().describe('Unique slug ID, e.g. mod-react-core-01'),
  order: z.number().describe('1-based sequential ordering'),
  title: z.string().describe('Descriptive module title'),
  purpose: z.string().describe('Why this module is critical for the target role'),
  estimatedStudyDuration: z.string().describe('e.g. 4-6 hours or 3 days'),
  prerequisites: z.array(z.string()).describe('List of prerequisite moduleIds or foundational concepts'),
  topics: z.array(z.string()).describe('Core topics covered in this module'),
  subtopics: z.array(z.string()).describe('Specific subtopics in prerequisite learning order'),
  detailedExplanation: z.string().describe('In-depth editorial tutorial and conceptual walkthrough explaining core mechanics'),
  practicalApplications: z.array(z.string()).describe('Real-world enterprise applications of these topics'),
  codeSnippets: z.array(CodeSnippetSchema).describe('Clear, working code snippets demonstrating essential patterns'),
  curatedResources: z.array(ResourceSchema).describe('Curated verified documentation and reference URLs (e.g. mdn, official docs)'),
  practiceExercises: z.array(PracticeExerciseSchema).describe('Practical challenges for students to build or solve'),
});

export const RoadmapsOutputSchema = z.object({
  existingSkillsRoadmap: z.object({
    title: z.string().describe('e.g. Deepening & Validating Existing Skills'),
    description: z.string().describe('Strategic plan to validate, refine, and advance existing claimed skills to interview-ready level'),
    estimatedTotalWeeks: z.number().describe('Total weeks to complete at given study hours'),
    modules: z.array(RoadmapModuleSchema).describe('3 to 5 modules focused on revision, advanced patterns, and project strengthening'),
  }),
  missingSkillsRoadmap: z.object({
    title: z.string().describe('e.g. Bridging Skill Gaps for Target Role'),
    description: z.string().describe('Structured, prerequisite-ordered learning path to master missing job requirements'),
    estimatedTotalWeeks: z.number().describe('Total weeks to complete at given study hours'),
    modules: z.array(RoadmapModuleSchema).describe('4 to 7 prerequisite-sequenced modules covering missing requirements'),
  }),
});

// Explicit LangGraph State
export const RoadmapState = Annotation.Root({
  jobAnalysisData: Annotation(),
  studentProfile: Annotation(),
  output: Annotation(),
  error: Annotation(),
});

// Core Node: roadmapGenerationNode
export const roadmapGenerationNode = async (state) => {
  const { jobAnalysisData, studentProfile = {} } = state;

  if (!jobAnalysisData) {
    throw new Error('Job analysis data is required for roadmap generation.');
  }

  const model = getGeminiModel(0.2);
  const structuredModel = model.withStructuredOutput(RoadmapsOutputSchema);

  const targetRole = jobAnalysisData.extractedRequirements?.targetRole || studentProfile.targetRole || 'Software Engineer';
  const studyHours = studentProfile.availableHoursPerDay || 3;
  const deadline = studentProfile.placementDeadline ? new Date(studentProfile.placementDeadline).toLocaleDateString() : '3 months from now';

  const matchedList = (jobAnalysisData.matchResults?.matchedSkills || []).map(s => s.skillName).join(', ');
  const partialList = (jobAnalysisData.matchResults?.partiallyMatchedSkills || []).map(s => s.skillName).join(', ');
  const missingList = (jobAnalysisData.matchResults?.missingSkills || []).map(s => s.skillName).join(', ');
  const optionalList = (jobAnalysisData.matchResults?.optionalSkills || []).map(s => s.skillName).join(', ');

  const prompt = `You are a Principal Software Engineer and Technical Mentor.
Generate TWO distinct, deeply personalized, highly actionable learning roadmaps for a student preparing for the target role: \"${targetRole}\".

Student Constraints:
- Available study time: ${studyHours} hours/day
- Target placement deadline: ${deadline}
- Current Matched Skills: ${matchedList || 'None'}
- Partially Matched / Unverified Skills: ${partialList || 'None'}
- Critical Missing Skills: ${missingList || 'None'}
- Optional / Preferred Skills: ${optionalList || 'None'}

Generate:
1. Roadmap A: 'Existing Skills Roadmap'
   - Focus: Concept validation, interview-grade edge cases, performance optimization, advanced system architecture, and strengthening existing project evidence for skills the student already knows (${matchedList || 'core fundamentals'}).
   - Do NOT assume skills are fully mastered; focus on eliminating blind spots and proving expertise.
   - Provide 3-4 comprehensive modules.

2. Roadmap B: 'Missing Skills Roadmap'
   - Focus: A strict prerequisite-ordered progression mastering the missing skills (${missingList || 'target technologies'}).
   - Start from foundational building blocks, leading to production integration and system design.
   - Provide 4-6 comprehensive modules.

Important Guidelines for each Module:
- Write clear, robust, educational 'detailedExplanation' with real engineering context.
- Include practical code examples in 'codeSnippets' with actual syntax.
- Use only legitimate, verified official documentation URLs (e.g., https://developer.mozilla.org, https://react.dev, https://nodejs.org/docs, https://www.mongodb.com/docs, https://docs.docker.com, https://kubernetes.io/docs, etc.). Never make up fake domain names.
- Provide challenging 'practiceExercises' with clear tasks and helpful solution hints.`;

  try {
    const output = await structuredModel.invoke(prompt);
    return { output };
  } catch (err) {
    return { error: err.message };
  }
};

// Build StateGraph
const workflow = new StateGraph(RoadmapState)
  .addNode('roadmapGenerationNode', roadmapGenerationNode)
  .addEdge(START, 'roadmapGenerationNode')
  .addEdge('roadmapGenerationNode', END);

export const roadmapGraph = workflow.compile();
