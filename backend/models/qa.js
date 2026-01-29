import mongoose from 'mongoose';

const qaSchema = new mongoose.Schema({
  institution: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true,
    index: true
  },
  
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
    index: true
  },
  
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    default: null
  },
  
  semester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Semester',
    default: null
  },
  
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  
  category: {
    type: String,
    enum: ['general', 'technical', 'academic', 'assignment', 'exam', 'other'],
    default: 'general'
  },
  
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  
  status: {
    type: String,
    enum: ['open', 'in-progress', 'resolved', 'closed'],
    default: 'open',
    index: true
  },
  
  askedBy: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'askedBy.userType',
      required: true
    },
    userType: {
      type: String,
      enum: ['Student', 'Teacher'],
      required: true
    },
    name: String,
    email: String
  },
  
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    default: null
  },
  
  tags: [{
    type: String,
    trim: true
  }],
  
  attachments: [{
    fileName: String,
    fileUrl: String,
    fileType: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  answers: [{
    answeredBy: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'answers.answeredBy.userType'
      },
      userType: {
        type: String,
        enum: ['Student', 'Teacher', 'Admin']
      },
      name: String,
      email: String
    },
    text: {
      type: String,
      required: true,
      trim: true
    },
    attachments: [{
      fileName: String,
      fileUrl: String,
      fileType: String
    }],
    isAccepted: {
      type: Boolean,
      default: false
    },
    upvotes: [{
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'answers.upvotes.userType'
    }],
    downvotes: [{
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'answers.downvotes.userType'
    }],
    answeredAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  views: {
    type: Number,
    default: 0
  },
  
  upvotes: [{
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'askedBy.userType'
  }],
  
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'askedBy.userType'
  }],
  
  isAnonymous: {
    type: Boolean,
    default: false
  },
  
  isPinned: {
    type: Boolean,
    default: false
  },
  
  resolvedAt: Date,
  closedAt: Date

}, { 
  timestamps: true 
});

// Indexes for better query performance
qaSchema.index({ institution: 1, course: 1, status: 1 });
qaSchema.index({ 'askedBy.userId': 1 });
qaSchema.index({ assignedTo: 1 });
qaSchema.index({ createdAt: -1 });
qaSchema.index({ tags: 1 });

// Virtual for answer count
qaSchema.virtual('answerCount').get(function() {
  return this.answers?.length || 0;
});

// Virtual for accepted answer
qaSchema.virtual('hasAcceptedAnswer').get(function() {
  return this.answers?.some(a => a.isAccepted) || false;
});

const QA = mongoose.model('QA', qaSchema);

export default QA;
