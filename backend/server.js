import 'dotenv/config';
import { webcrypto } from 'node:crypto';
if (!globalThis.crypto) {
  globalThis.crypto = webcrypto;
}
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import multer from 'multer';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import authRouter from './routes/auth.js';
import chatsRouter from './routes/chats.js';
import chunkText from './rag/chunker.js';
import { getCollection } from './rag/vectorStore.js';
import { createEmbedding } from './rag/embedder.js';
import { searchChunks } from './rag/retriever.js';
import { askQuestion } from './rag/ragService.js';
import PdfSession from './models/PdfSession.js';

const JWT_SECRET = process.env.JWT_SECRET || 'synthetix_ai_secret_key_123';
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized', message: 'No token provided' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Invalid token' });
  }
};

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/synthetix-ai';
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map(s => s.trim());

mongoose.connect(MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

app.use(cors({
  origin(origin, cb) {
    if (!origin) return cb(null, true);
    if (allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: origin "${origin}" not allowed`));
  },
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

app.use(express.json({ limit: '50kb' }));
app.use(express.urlencoded({ extended: true, limit: '50kb' }));

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please slow down.' },
});
app.use(globalLimiter);

const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many chat messages. Please wait a moment.' },
});

app.get('/api/health', (req, res) => {
  const geminiKeySet = !!(
    process.env.GEMINI_API_KEY &&
    process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here'
  );
  res.json({
    status: 'ok',
    service: 'Synthetix AI Backend',
    version: '1.0.0',
    geminiReady: geminiKeySet,
    dbConnected: mongoose.connection.readyState === 1,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage
});

app.post(
  '/upload',
  authenticate,
  upload.single('pdf'),
  async (req, res) => {
    try {
      const pdf = await import('pdf-parse');
      const filePath = req.file.path;
      const dataBuffer = fs.readFileSync(filePath);
      const pdfData = await pdf.default(dataBuffer);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      const chunks = chunkText(pdfData.text);
      const formattedChunks = chunks.map((chunk, index) => ({
        id: index,
        content: chunk,
        source: req.file.originalname
      }));
      const collection = await getCollection();
      const ids = [];
      const embeddings = [];
      const documents = [];
      const metadatas = [];
      for (let i = 0; i < chunks.length; i++) {
        const embedding = await createEmbedding(chunks[i]);
        ids.push(`${Date.now()}-${req.file.originalname}-${i}`);
        embeddings.push(embedding);
        documents.push(chunks[i]);
        metadatas.push({ source: req.file.originalname });
      }
      if (chunks.length > 0) {
        await collection.add({
          ids,
          embeddings,
          documents,
          metadatas
        });
      }
      const pdfSession = new PdfSession({
        userId: req.userId,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        chunks: formattedChunks
      });
      await pdfSession.save();
      res.json(pdfSession);
    } catch (error) {
      console.log(error);
      res.status(500).json({
        error: 'Failed to parse PDF'
      });
    }
  }
);

app.post(
  '/search',
  authenticate,
  async (req, res) => {
    try {
      const { query, sourceFilename } = req.body;
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ error: 'Bad Request', message: 'Query is required' });
      }
      const result = await searchChunks(query.trim(), sourceFilename);
      res.json(result);
    } catch (error) {
      console.log(error);
      res.status(500).json({
        error: 'Failed to search'
      });
    }
  }
);

app.post(
  '/ask',
  authenticate,
  async (req, res) => {
    try {
      const { question, sourceFilename } = req.body;
      if (!question || typeof question !== 'string') {
        return res.status(400).json({ error: 'Bad Request', message: 'Question is required' });
      }
      const answer = await askQuestion(question.trim(), sourceFilename);
      res.json({
        answer
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        error: 'Failed to generate answer'
      });
    }
  }
);

app.get(
  '/api/pdfs',
  authenticate,
  async (req, res) => {
    try {
      const pdfs = await PdfSession.find({ userId: req.userId }).sort({ createdAt: -1 });
      res.json(pdfs);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch PDF history', message: error.message });
    }
  }
);

app.get(
  '/api/pdfs/:id',
  authenticate,
  async (req, res) => {
    try {
      const pdf = await PdfSession.findOne({ _id: req.params.id, userId: req.userId });
      if (!pdf) {
        return res.status(404).json({ error: 'Not Found', message: 'PDF history item not found' });
      }
      res.json(pdf);
    } catch (error) {
      res.status(500).json({ error: 'Failed to load PDF session', message: error.message });
    }
  }
);

app.delete(
  '/api/pdfs/:id',
  authenticate,
  async (req, res) => {
    try {
      const pdf = await PdfSession.findOneAndDelete({ _id: req.params.id, userId: req.userId });
      if (!pdf) {
        return res.status(404).json({ error: 'Not Found', message: 'PDF history item not found' });
      }
      res.json({ message: 'PDF session deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete PDF session', message: error.message });
    }
  }
);

app.use('/api/auth', authRouter);
app.use('/api/chats', chatLimiter, chatsRouter);

app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} does not exist.`,
  });
});

app.use((err, req, res, _next) => {
  console.error('[Server Error]', err.message);
  if (err.message?.startsWith('CORS')) {
    return res.status(403).json({ error: 'CORS Error', message: err.message });
  }
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

app.listen(PORT, () => {
  const line = '─'.repeat(48);
  console.log(`\n${line}`);
  console.log(`  🚀  Synthetix AI Backend`);
  console.log(`${line}`);
  console.log(`  Listening on  : http://localhost:${PORT}`);
  console.log(`  Environment   : ${process.env.NODE_ENV || 'development'}`);
  const keySet = process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here';
  console.log(`  Gemini API    : ${keySet ? '✅  Key loaded' : '❌  Key NOT set — add to .env'}`);
  console.log(`  Allowed origins:`);
  allowedOrigins.forEach(o => console.log(`    • ${o}`));
  console.log(`${line}\n`);
});

export default app;
