import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
  chatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat', required: true },
  role: { type: String, required: true, enum: ['user', 'ai'] },
  content: { type: String, required: true }
}, {
  timestamps: true
});

export default mongoose.model('Message', MessageSchema);
