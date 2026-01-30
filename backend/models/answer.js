import mongoose from 'mongoose';

const answerSchema = new mongoose.Schema({
  question: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  answeredBy: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'answeredByModel',
    required: true
  },
  answeredByModel: {
    type: String,
    required: true,
    enum: ['Teacher', 'Student']
  },
  upvotes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student'
  }],
  isAccepted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes
answerSchema.index({ question: 1, createdAt: 1 });
answerSchema.index({ answeredBy: 1 });

export default mongoose.model('Answer', answerSchema);
