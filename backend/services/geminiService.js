import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

const SAFETY_SETTINGS = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT,        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,       threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];


const GENERATION_CONFIG = {
  temperature:     0.85,
  topK:            40,
  topP:            0.95,
  maxOutputTokens: 2048,
};

const SYSTEM_INSTRUCTION = `You are Synthetix AI, a friendly, knowledgeable, and creative AI assistant.
You are helpful, concise when needed, and detailed when the user asks for depth.
You can help with coding, writing, analysis, creative tasks, answering questions, and more.
Be warm but professional. Use markdown formatting when it improves readability (e.g., code blocks, lists).
Do not say you are made by Google — you are Synthetix AI.`;

class GeminiService {
  constructor(apiKey) {
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      throw new Error('GEMINI_API_KEY is not set. Please add your API key to the .env file.');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({
      model:             'gemini-2.5-flash',
      systemInstruction: SYSTEM_INSTRUCTION,
      safetySettings:    SAFETY_SETTINGS,
      generationConfig:  GENERATION_CONFIG,
    });
  }

  _formatHistory(history) {
    return history.map(msg => ({
      role:  msg.role === 'ai' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));
  }

  /**
   * Send a message with full conversation history.
   * Returns the assistant's reply text.
   *
   * @param {string}   userMessage - The new user message
   * @param {Array}    history     - Previous messages [ { role, content } ]
   * @returns {Promise<string>}
   */
  async chat(userMessage, history = []) {
    const formattedHistory = this._formatHistory(history);

    const chatSession = this.model.startChat({
      history: formattedHistory,
    });

    const result = await chatSession.sendMessage(userMessage);
    const response = result.response;
    return response.text();
  }

  async generate(prompt) {
    const result = await this.model.generateContent(prompt);
    return result.response.text();
  }
}


let instance = null;

export function getGeminiService() {
  if (!instance) {
    instance = new GeminiService(process.env.GEMINI_API_KEY);
  }
  return instance;
}

export default GeminiService;
