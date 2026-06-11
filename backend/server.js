import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import authRouter from './routes/auth.js';
import chatsRouter from './routes/chats.js';

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
