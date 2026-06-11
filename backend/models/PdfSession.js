import mongoose from 'mongoose';

const pdfSessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  chunks: [{
    id: Number,
    content: String,
    source: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('PdfSession', pdfSessionSchema);
