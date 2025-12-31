import mongoose from 'mongoose';

const announcementSchema = new mongoose.Schema({
  institution: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'authorType',
    required: true
  },
  authorType: {
    type: String,
    enum: ['Admin', 'Teacher'],
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['general', 'academic', 'event', 'urgent', 'exam'],
    default: 'general'
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  targetAudience: {
    type: [String],
    enum: ['all', 'students', 'teachers', 'staff'],
    default: ['all']
  },
  attachments: [{
    name: String,
    url: String,
    type: String
  }],
  isPinned: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  viewedBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'viewedBy.userType'
    },
    userType: {
      type: String,
      enum: ['Student', 'Teacher', 'Admin']
    },
    viewedAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
announcementSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Announcement = mongoose.model('Announcement', announcementSchema);

export default Announcement;
