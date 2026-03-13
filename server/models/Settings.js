import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true,
  },
  github: {
    token: {
      type: String,
      default: null,
    },
    repositoryUrl: {
      type: String,
      default: null,
    },
    owner: {
      type: String,
      default: null,
    },
    repo: {
      type: String,
      default: null,
    },
    validated: {
      type: Boolean,
      default: false,
    },
    validatedAt: {
      type: Date,
      default: null,
    },
  },
  preferences: {
    autoCreateGitHubIssues: {
      type: Boolean,
      default: false,
    },
    notifyOnIssueCreation: {
      type: Boolean,
      default: true,
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt timestamp before saving
settingsSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model('Settings', settingsSchema);
