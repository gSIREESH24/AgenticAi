import { Router } from 'express';
import jwt from 'jsonwebtoken';
import Chat from '../models/Chat.js';
import Message from '../models/Message.js';
import { getGeminiService } from '../services/geminiService.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'synthetix_ai_secret_key_123';

function authenticate(req, res, next) {
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
}

function selectEmoji(text) {
  const t = text.toLowerCase();
  if (t.includes('movie') || t.includes('film') || t.includes('show')) return '🎬';
  if (t.includes('code') || t.includes('program') || t.includes('javascript') || t.includes('react') || t.includes('css')) return '💻';
  if (t.includes('explain') || t.includes('why') || t.includes('how') || t.includes('concept') || t.includes('idea')) return '💡';
  if (t.includes('write') || t.includes('essay') || t.includes('email') || t.includes('draft') || t.includes('summarize')) return '📝';
  return '💬';
}

router.get('/', authenticate, async (req, res) => {
  try {
    const chats = await Chat.find({ userId: req.userId }).sort({ updatedAt: -1 });
    res.json(chats);
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
});

router.post('/', authenticate, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Bad Request', message: 'Message is required' });
    }
    const gemini = getGeminiService();
    const reply = await gemini.chat(message.trim(), []);
    const chat = new Chat({
      userId: req.userId,
      title: message.trim().slice(0, 30) + (message.trim().length > 30 ? '...' : ''),
      emoji: selectEmoji(message)
    });
    await chat.save();
    const userMsg = new Message({
      chatId: chat._id,
      role: 'user',
      content: message.trim()
    });
    await userMsg.save();
    const aiMsg = new Message({
      chatId: chat._id,
      role: 'ai',
      content: reply
    });
    await aiMsg.save();
    res.status(201).json({
      chat,
      messages: [userMsg, aiMsg]
    });
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
});

router.post('/:id', authenticate, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Bad Request', message: 'Message is required' });
    }
    const chat = await Chat.findOne({ _id: req.params.id, userId: req.userId });
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }
    const dbMessages = await Message.find({ chatId: chat._id }).sort({ createdAt: 1 });
    const history = dbMessages.map(m => ({
      role: m.role,
      content: m.content
    }));
    const gemini = getGeminiService();
    const reply = await gemini.chat(message.trim(), history);
    const userMsg = new Message({
      chatId: chat._id,
      role: 'user',
      content: message.trim()
    });
    await userMsg.save();
    const aiMsg = new Message({
      chatId: chat._id,
      role: 'ai',
      content: reply
    });
    await aiMsg.save();
    chat.updatedAt = new Date();
    await chat.save();
    res.json({
      messages: [userMsg, aiMsg]
    });
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const chat = await Chat.findOne({ _id: req.params.id, userId: req.userId });
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }
    const messages = await Message.find({ chatId: chat._id }).sort({ createdAt: 1 });
    res.json({
      chat,
      messages
    });
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  try {
    const chat = await Chat.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }
    await Message.deleteMany({ chatId: chat._id });
    res.json({ message: 'Chat deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
});

export default router;
