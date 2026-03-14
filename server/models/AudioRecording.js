import mongoose from 'mongoose';

const audioRecordingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  filename: {
    type: String,
    required: true
  },
  audioData: {
    type: Buffer,
    required: true
  },
  contentType: {
    type: String,
    default: 'audio/webm'
  },
  meetingName: {
    type: String,
    default: 'Unassigned' // E.g., 'Meeting 1', 'Meeting 2'
  },
  transcript: [{
    text: String,
    timestamp: Number, // milliseconds (start time)
    endTime: Number,   // milliseconds (end time when they stopped speaking)
    speaker: String // Speaker identifier for diarization (Speaker A, Speaker B, etc)
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('AudioRecording', audioRecordingSchema);