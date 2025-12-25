import mongoose from 'mongoose';

const membershipSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'userType',
    required: true
  },
  userType: {
    type: String,
    enum: ['Student', 'Teacher'],
    required: true
  },
  institution: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true
  },
  role: {
    type: String,
    enum: ['student', 'teacher', 'assistant', 'moderator'],
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  permissions: {
    canCreateContent: {
      type: Boolean,
      default: false
    },
    canModerateDiscussions: {
      type: Boolean,
      default: false
    },
    canManageStudents: {
      type: Boolean,
      default: false
    }
  },
  joinedAt: {
    type: Date,
    default: Date.now
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  metadata: {
    department: String,
    course: String,
    semester: Number,
    batch: String
  }
});

// Compound index for unique membership
membershipSchema.index({ user: 1, institution: 1 }, { unique: true });
membershipSchema.index({ institution: 1, status: 1 });

const Membership = mongoose.model('Membership', membershipSchema);

export default Membership;
