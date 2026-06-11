import { GoogleGenerativeAI } from '@google/generative-ai';
import { searchChunks } from './retriever.js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function askQuestion(question, sourceFilename) {
  const result = await searchChunks(question, sourceFilename);
  const docs = result.documents[0] || [];
  const context = docs.join('\n\n');
  const prompt = `You are a document assistant.

Answer ONLY from the context.
If the answer is not present in the context, say: "I could not find this information in the document."

Context:
${context}

Question:
${question}`;

  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  const response = await model.generateContent(prompt);
  return response.response.text();
}
