import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  delays: {
    type: [Number],
    default: []
  },
  editCount: { type: Number, default: 0 },
  pauseCount: { type: Number, default: 0 },
  navCount: { type: Number, default: 0 },
  sessionDuration: { type: Number, default: 0 },
  pasteEvents: [{
    length: { type: Number, required: true },
    timestamp: { type: Number, required: true }
  }],
  authenticityScore: {
    type: Number,
    required: true,
    default: 0
  },
  isEdited: {
    type: Boolean,
    default: false
  },
  analysisReport: {
    avgDelay: { type: Number, default: 0 },
    variance: { type: Number, default: 0 },
    totalPasteLength: { type: Number, default: 0 },
    editRatio: { type: Number, default: 0 },
    pauseRatio: { type: Number, default: 0 },
    cpm: { type: Number, default: 0 },
    navRatio: { type: Number, default: 0 },
    flags: [{ type: String }]
  }
}, { timestamps: true });

export default mongoose.model('Session', sessionSchema);
