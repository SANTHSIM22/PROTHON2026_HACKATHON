import mongoose from 'mongoose';

const memorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  conversationId: {
    type: String,
    required: true,
    index: true,
  },
  type: {
    type: String,
    enum: ['conversation', 'entity', 'summary', 'analysis', 'action_items', 'interaction', 'github_issues_created'],
    default: 'conversation',
  },
  content: {
    type: String,
    required: true,
    text: true, // Enable text search
  },
  metadata: {
    model: String,
    importance: {
      type: Number,
      min: 0,
      max: 10,
      default: 1,
    },
    tags: [String],
    relatedIds: [String],
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
  ttl: {
    type: Date,
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000),
    index: { expireAfterSeconds: 0 },
  },
});

// Create text index for search
memorySchema.index({ content: 'text' });
memorySchema.index({ userId: 1, conversationId: 1, timestamp: -1 });

const Memory = mongoose.model('Memory', memorySchema);
export default Memory;
