import mongoose from 'mongoose';

const meetingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  transcript: {
    type: String,
    required: true
  },
  summary: {
    type: String
  },
  actionItems: [{
    description: String,
    assignee: String,
    priority: {
      type: String,
      enum: ['High', 'Medium', 'Low'],
      default: 'Medium'
    },
    status: {
      type: String,
      enum: ['Open', 'In Progress', 'Completed'],
      default: 'Open'
    },
    dueDate: Date
  }],
  decisions: [String],
  tags: [String],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Meeting', meetingSchema);
