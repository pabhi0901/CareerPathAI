import { StateGraph, Annotation, START, END } from '@langchain/langgraph';
import { z } from 'zod';
import { getGeminiModel } from './geminiClient.js';

// Question item schema with separate codeSnippet and codeLanguage fields
export const QuestionSchema = z.object({
  questionId: z.string(),
  questionText: z.string(),
  codeSnippet: z.string().default(''),
  codeLanguage: z.string().default('javascript'),
  options: z.array(z.string()),
  correctAnswerIndex: z.number(),
  explanation: z.string(),
  topic: z.string(),
  difficulty: z.string().default('intermediate'),
  marks: z.number().default(1),
});

export const AssessmentOutputSchema = z.object({
  questions: z.array(QuestionSchema),
});

// Explicit LangGraph State
export const AssessmentState = Annotation.Root({
  moduleTitle: Annotation(),
  purpose: Annotation(),
  topics: Annotation(),
  subtopics: Annotation(),
  questionCount: Annotation(),
  output: Annotation(),
  error: Annotation(),
});

// Core Node: assessmentGenerationNode
export const assessmentGenerationNode = async (state) => {
  const {
    moduleTitle = 'Technical Module',
    purpose = '',
    topics = [],
    subtopics = [],
    questionCount = 10,
  } = state;

  const model = getGeminiModel(0.2);
  const structuredModel = model.withStructuredOutput(AssessmentOutputSchema);

  const prompt = `You are an elite Senior Staff Engineer and technical examiner creating a rigorous, fair technical assessment.
Create an assessment of exactly ${questionCount} multiple-choice questions (MCQs) for the following module:

Module Title: \"${moduleTitle}\"
Module Purpose: \"${purpose}\"
Core Topics: ${topics.join(', ') || 'Core concepts'}
Subtopics: ${subtopics.join(', ') || 'Detailed mechanics'}

STRICT EXAMINATION RULES:
1. Every question must have EXACTLY 4 distinct options.
2. 'correctAnswerIndex' MUST be an integer between 0 and 3, corresponding to the correct option in the options array.
3. No trick questions or trivial syntax typos. Questions must test true engineering comprehension, edge cases, lifecycle/asynchronous behavior, data structures, or real-world problem solving.
4. Include code snippets or scenario-based questions where appropriate.
5. Provide a thorough, educational 'explanation' for each question.
6. Categorize each question by its specific 'topic' from the module topics list.
7. Distribute difficulties: ~30% beginner/fundamentals, ~50% intermediate/standard engineering, ~20% advanced/edge cases.
8. NEVER repeat duplicate questions.
9. SEPARATE CODE SNIPPETS: Whenever a question involves code (e.g. analyzing output, identifying bugs, or evaluating syntax), put the conceptual question text in 'questionText' and place the actual code strictly into the 'codeSnippet' field (with proper indentation), specifying 'codeLanguage'. Never embed raw multi-line code inside 'questionText'. If the question has no code, leave 'codeSnippet' as an empty string.`;

  try {
    const rawOutput = await structuredModel.invoke(prompt);

    // Validate questions: remove duplicates or invalid answer indices
    const seenTexts = new Set();
    const validatedQuestions = [];

    for (let i = 0; i < rawOutput.questions.length; i++) {
      const q = rawOutput.questions[i];
      const normalizedText = q.questionText.trim().toLowerCase();

      if (seenTexts.has(normalizedText)) continue;
      seenTexts.add(normalizedText);

      if (
        !Array.isArray(q.options) ||
        q.options.length !== 4 ||
        typeof q.correctAnswerIndex !== 'number' ||
        q.correctAnswerIndex < 0 ||
        q.correctAnswerIndex > 3
      ) {
        continue;
      }

      validatedQuestions.push({
        ...q,
        questionId: `q-${i + 1}-${Date.now().toString(36).slice(-4)}`,
        marks: q.marks || 1,
      });
    }

    if (validatedQuestions.length < 5) {
      throw new Error('LLM generated fewer than 5 valid questions.');
    }

    return {
      output: {
        questions: validatedQuestions,
      },
    };
  } catch (err) {
    return { error: err.message };
  }
};

// Build StateGraph
const workflow = new StateGraph(AssessmentState)
  .addNode('assessmentGenerationNode', assessmentGenerationNode)
  .addEdge(START, 'assessmentGenerationNode')
  .addEdge('assessmentGenerationNode', END);

export const assessmentGraph = workflow.compile();
