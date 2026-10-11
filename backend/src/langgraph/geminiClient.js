import { ChatGoogleGenerativeAI } from '@langchain/google-genai';

export const getGeminiModel = (temperature = 0.2) => {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error('GOOGLE_API_KEY is not defined in environment variables.');
  }

  return new ChatGoogleGenerativeAI({
    apiKey,
    model: 'gemini-2.5-flash',
    temperature,
    maxRetries: 2,
  });
};
