import express from 'express';
import authMiddleware from '../middleware/auth.js';
import Meeting from '../models/Meeting.js';

const router = express.Router();

// Get all meetings for a user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const meetings = await Meeting.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(meetings);
  } catch (error) {
    console.error('Get meetings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single meeting
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const meeting = await Meeting.findOne({ _id: req.params.id, userId: req.user.id });
    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }
    res.json(meeting);
  } catch (error) {
    console.error('Get meeting error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create meeting
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, transcript, summary, actionItems, decisions, tags } = req.body;

    if (!title || !transcript) {
      return res.status(400).json({ message: 'Title and transcript are required' });
    }

    const meeting = new Meeting({
      userId: req.user.id,
      title,
      transcript,
      summary,
      actionItems: actionItems || [],
      decisions: decisions || [],
      tags: tags || []
    });

    await meeting.save();
    res.status(201).json(meeting);
  } catch (error) {
    console.error('Create meeting error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update meeting
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { title, transcript, summary, actionItems, decisions, tags } = req.body;

    let meeting = await Meeting.findOne({ _id: req.params.id, userId: req.user.id });
    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    if (title) meeting.title = title;
    if (transcript) meeting.transcript = transcript;
    if (summary) meeting.summary = summary;
    if (actionItems) meeting.actionItems = actionItems;
    if (decisions) meeting.decisions = decisions;
    if (tags) meeting.tags = tags;
    meeting.updatedAt = Date.now();

    await meeting.save();
    res.json(meeting);
  } catch (error) {
    console.error('Update meeting error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete meeting
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const meeting = await Meeting.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }
    res.json({ message: 'Meeting deleted successfully' });
  } catch (error) {
    console.error('Delete meeting error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update action item status
router.patch('/:id/actions/:actionIndex', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;

    const meeting = await Meeting.findOne({ _id: req.params.id, userId: req.user.id });
    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    if (req.params.actionIndex >= meeting.actionItems.length) {
      return res.status(404).json({ message: 'Action item not found' });
    }

    meeting.actionItems[req.params.actionIndex].status = status;
    meeting.updatedAt = Date.now();
    await meeting.save();

    res.json(meeting);
  } catch (error) {
    console.error('Update action error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
