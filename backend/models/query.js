import mongoose from "mongoose";

const replySchema = new mongoose.Schema({
  text: { type: String, required: true },
  repliedBy: {
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'replies.repliedBy.userModel' },
    userModel: { type: String, required: true, enum: ['Admin', 'Teacher', 'Student'] },
    name: { type: String, required: true }
  },
  repliedAt: { type: Date, default: Date.now }
}, { _id: true });

const querySchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  category: { 
    type: String, 
    required: true,
    enum: ['general', 'technical', 'academic', 'administrative'],
    default: 'general'
  },
  priority: {
    type: String,
    required: true,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  status: {
    type: String,
    required: true,
    enum: ['open', 'in-progress', 'resolved', 'closed'],
    default: 'open'
  },
  institution: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true
  },
  createdBy: {
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'createdBy.userModel' },
    userModel: { type: String, required: true, enum: ['Admin', 'Teacher', 'Student'] },
    name: { type: String, required: true },
    email: { type: String }
  },
  replies: [replySchema],
  assignedTo: {
    userId: { type: mongoose.Schema.Types.ObjectId, refPath: 'assignedTo.userModel' },
    userModel: { type: String, enum: ['Admin', 'Teacher'] },
    name: { type: String }
  },
  resolvedAt: { type: Date },
  resolvedBy: {
    userId: { type: mongoose.Schema.Types.ObjectId, refPath: 'resolvedBy.userModel' },
    userModel: { type: String, enum: ['Admin', 'Teacher'] },
    name: { type: String }
  }
}, { timestamps: true });

// Indexes for better query performance
querySchema.index({ institution: 1, status: 1, createdAt: -1 });
querySchema.index({ 'createdBy.userId': 1, createdAt: -1 });
querySchema.index({ status: 1, priority: 1 });

export default mongoose.model("Query", querySchema);
