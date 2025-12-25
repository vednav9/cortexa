import mongoose from 'mongoose';

const invitationSchema = new mongoose.Schema({
  institution: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'recipientType',
    required: true
  },
  recipientType: {
    type: String,
    enum: ['Student', 'Teacher'],
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  type: {
    type: String,
    enum: ['join', 'collaborate', 'teach'],
    default: 'join'
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'expired'],
    default: 'pending'
  },
  message: {
    type: String,
    default: ''
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
  },
  respondedAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient queries
invitationSchema.index({ recipient: 1, status: 1 });
invitationSchema.index({ institution: 1, status: 1 });
invitationSchema.index({ expiresAt: 1 });

// Virtual to check if expired
invitationSchema.virtual('isExpired').get(function() {
  return this.expiresAt < new Date() && this.status === 'pending';
});

// Auto-expire invitations
invitationSchema.pre('find', function() {
  this.where('expiresAt').gt(new Date()).or({ status: { $ne: 'pending' } });
});

const Invitation = mongoose.model('Invitation', invitationSchema);

export default Invitation;
