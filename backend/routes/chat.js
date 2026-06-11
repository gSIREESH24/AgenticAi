import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getGeminiService } from '../services/geminiService.js';

const router = Router();

const sessions = new Map();

const SESSION_TTL_MS = 2 * 60 * 60 * 1000;
setInterval(() => {
  const now = Date.now();
  for (const [id, session] of sessions.entries()) {
    if (now - session.lastActive > SESSION_TTL_MS) {
      sessions.delete(id);
    }
  }
}, 15 * 60 * 1000);
function getOrCreateSession(sessionId) {
  if (!sessionId || !sessions.has(sessionId)) {
    const id = uuidv4();
    sessions.set(id, { messages: [], lastActive: Date.now() });
    return { id, session: sessions.get(id) };
  }
  const session = sessions.get(sessionId);
  session.lastActive = Date.now();
  return { id: sessionId, session };
}

// ── POST /api/chat  ───────────────────────────────────────────
/**
 * Body: { message: string, sessionId?: string }
 * Returns: { reply: string, sessionId: string, history: array }
 */
router.post('/', async (req, res) => {
  try {
    const { message, sessionId } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'message field is required and must be a string.',
      });
    }

    const trimmed = message.trim();
    if (trimmed.length === 0) {
      return res.status(400).json({ error: 'Bad Request', message: 'message cannot be empty.' });
    }
    if (trimmed.length > 8000) {
      return res.status(400).json({ error: 'Bad Request', message: 'message exceeds 8000 character limit.' });
    }

    const { id: sid, session } = getOrCreateSession(sessionId);

    const gemini = getGeminiService();
    const reply  = await gemini.chat(trimmed, session.messages);

    session.messages.push(
      { role: 'user', content: trimmed  },
      { role: 'ai',   content: reply    },
    );

    const recentHistory = session.messages.slice(-40);

    return res.status(200).json({
      reply,
      sessionId:  sid,
      history:    recentHistory,
      messageCount: session.messages.length,
    });

  } catch (err) {
    console.error('[Chat Error]', err.message);

    if (err.message?.includes('API key')) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Invalid or missing Gemini API key.' });
    }
    if (err.message?.includes('quota') || err.message?.includes('429')) {
      return res.status(429).json({ error: 'Rate Limited', message: 'API quota exceeded. Try again later.' });
    }
    if (err.message?.includes('SAFETY')) {
      return res.status(422).json({ error: 'Safety Filter', message: 'Message was blocked by safety filters.' });
    }

    return res.status(500).json({
      error:   'Internal Server Error',
      message: 'Something went wrong. Please try again.',
    });
  }
});


router.delete('/session', (req, res) => {
  const { sessionId } = req.body;
  if (sessionId && sessions.has(sessionId)) {
    sessions.delete(sessionId);
    return res.status(200).json({ message: 'Session cleared.' });
  }
  return res.status(404).json({ error: 'Session not found.' });
});


router.get('/session', (req, res) => {
  const { sessionId } = req.query;
  if (!sessionId || !sessions.has(sessionId)) {
    return res.status(404).json({ error: 'Session not found.' });
  }
  const session = sessions.get(sessionId);
  return res.status(200).json({
    sessionId,
    history:      session.messages.slice(-40),
    messageCount: session.messages.length,
    lastActive:   new Date(session.lastActive).toISOString(),
  });
});

export default router;
