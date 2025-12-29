import mongoose from 'mongoose';

const institutionSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  type: {
    type: String,
    required: true,
    lowercase: true
  },
  description: {
    type: String,
    default: ''
  },

  // Address
  address: {
    street: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    state: {
      type: String,
      required: true
    },
    country: {
      type: String,
      required: true
    },
    zipCode: String
  },

  // Contact Information
  contact: {
    email: String,
    phone: String,
    website: String
  },

  // Branding
  branding: {
    logo: {
      type: String,
      default: ''
    },
    primaryColor: {
      type: String,
      default: '#0052A5'
    },
    secondaryColor: {
      type: String,
      default: '#FFFFFF'
    },
    accentColor: String,
    banner: String,
    favicon: String
  },

  // Admins Array (multiple admins can manage one institution)
  admins: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  }],

  // Super Admin (first registered admin)
  superAdmin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    default: null
  },

  // Students and Teachers
  students: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student'
  }],
  teachers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher'
  }],

  // Departments
  departments: [{
    name: String,
    code: String,
    head: String
  }],

  // Settings
  settings: {
    allowPublicJoin: {
      type: Boolean,
      default: false
    },
    requireApproval: {
      type: Boolean,
      default: true
    },
    maxStudents: {
      type: Number,
      default: null
    },
    maxTeachers: {
      type: Number,
      default: null
    }
  },

  // Statistics
  stats: {
    totalStudents: {
      type: Number,
      default: 0
    },
    totalTeachers: {
      type: Number,
      default: 0
    },
    totalCourses: {
      type: Number,
      default: 0
    },
    totalAdmins: {
      type: Number,
      default: 1
    }
  },

  // Status
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Update timestamp on save
institutionSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual for logo initials
institutionSchema.virtual('initials').get(function () {
  return this.name.split(' ').map(word => word[0]).join('').substring(0, 2).toUpperCase();
});

// Method to add admin
institutionSchema.methods.addAdmin = async function (adminId) {
  if (!this.admins.includes(adminId)) {
    this.admins.push(adminId);
    this.stats.totalAdmins = this.admins.length;
    await this.save();
  }
};

// Method to remove admin
institutionSchema.methods.removeAdmin = async function (adminId) {
  this.admins = this.admins.filter(id => id.toString() !== adminId.toString());
  this.stats.totalAdmins = this.admins.length;
  await this.save();
};

const Institution = mongoose.model('Institution', institutionSchema);

export default Institution;
