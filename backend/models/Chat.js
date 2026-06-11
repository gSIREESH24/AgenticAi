import mongoose from 'mongoose';

const ChatSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  emoji: { type: String, default: '💬' }
}, {
  timestamps: true
});

export default mongoose.model('Chat', ChatSchema);
