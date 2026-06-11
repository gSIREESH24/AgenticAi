import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function createEmbedding(text) {
  const model = genAI.getGenerativeModel({ model: 'gemini-embedding-2' });
  const response = await model.embedContent(text);
  return response.embedding.values;
}
