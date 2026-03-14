import mongoose from 'mongoose';

const organizationDataSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  meetings: [{
    id: String,
    title: String,
    date: String,
    duration: Number,
    attendees: [String],
    transcript: String
  }]
}, { timestamps: true });

export default mongoose.model('OrganizationData', organizationDataSchema);