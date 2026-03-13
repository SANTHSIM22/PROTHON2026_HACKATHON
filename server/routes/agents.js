import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { rootAgent, agentMemory } from '../agents/index.js';
import { githubAgent } from '../agents/index.js';
import authMiddleware from '../middleware/auth.js';
import Meeting from '../models/Meeting.js';
import Settings from '../models/Settings.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Initialize agent for user
router.post('/init', authMiddleware, async (req, res) => {
  try {
    const agent = await rootAgent.initialize(req.user.id);
    res.json({
      success: true,
      agent,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Process meeting with agent
router.post('/process-meeting', authMiddleware, async (req, res) => {
  try {
    const { meetingId } = req.body;
    const conversationId = `conv_${meetingId}`;

    const meeting = await Meeting.findById(meetingId);
    if (!meeting) {
      return res.status(404).json({
        success: false,
        error: 'Meeting not found',
      });
    }

    const result = await rootAgent.processMeeting(
      req.user.id,
      conversationId,
      meeting
    );

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Chat with agent
router.post('/chat', authMiddleware, async (req, res) => {
  try {
    const { conversationId, message } = req.body;

    if (!conversationId || !message) {
      return res.status(400).json({
        success: false,
        error: 'conversationId and message are required',
      });
    }

    const result = await rootAgent.processRequest(
      req.user.id,
      conversationId,
      message
    );

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Extract action items
router.post('/extract-actions', authMiddleware, async (req, res) => {
  try {
    const { conversationId, transcript } = req.body;

    if (!transcript) {
      return res.status(400).json({
        success: false,
        error: 'transcript is required',
      });
    }

    const result = await rootAgent.extractActionItems(
      req.user.id,
      conversationId,
      transcript
    );

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Generate summary
router.post('/summary', authMiddleware, async (req, res) => {
  try {
    const { conversationId, transcript } = req.body;

    if (!transcript) {
      return res.status(400).json({
        success: false,
        error: 'transcript is required',
      });
    }

    const result = await rootAgent.generateSummary(
      req.user.id,
      conversationId,
      transcript
    );

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get conversation history
router.get('/history/:conversationId', authMiddleware, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { limit = 20 } = req.query;

    const result = await rootAgent.getConversationHistory(
      req.user.id,
      conversationId,
      parseInt(limit)
    );

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Search memories
router.get('/search', authMiddleware, async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'query parameter is required',
      });
    }

    const result = await rootAgent.searchMemories(req.user.id, query);

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get memory summary
router.get('/memory-summary/:conversationId', authMiddleware, async (req, res) => {
  try {
    const { conversationId } = req.params;

    const summary = await agentMemory.getMemorySummary(
      req.user.id,
      conversationId
    );

    res.json({
      success: true,
      summary,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get agent capabilities
router.get('/capabilities', authMiddleware, (req, res) => {
  const capabilities = rootAgent.getCapabilities();
  res.json({
    success: true,
    ...capabilities,
  });
});

// Clear conversation memory
router.delete('/memory/:conversationId', authMiddleware, async (req, res) => {
  try {
    const { conversationId } = req.params;

    const result = await agentMemory.clearMemory(conversationId);

    res.json({
      success: true,
      message: 'Memory cleared',
      ...result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Process data from data1.json with dual perspective (Technical + Non-Technical)
router.post('/process-data', authMiddleware, async (req, res) => {
  try {
    const { dataIndex = 0 } = req.body;
    
    // Read data from file
    const dataPath = path.join(__dirname, '../data/data1.json');
    const fileContent = fs.readFileSync(dataPath, 'utf-8');
    const data = JSON.parse(fileContent);
    const meetings = data.meetings;
    
    if (!meetings || meetings.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No meetings found in data1.json',
      });
    }

    if (dataIndex >= meetings.length) {
      return res.status(400).json({
        success: false,
        error: `Invalid data index. Available: ${meetings.length}`,
      });
    }

    const meetingData = meetings[dataIndex];
    const conversationId = `conv_data_${meetingData.id}`;

    // Process with both technical and non-technical agents
    const result = await rootAgent.processDualPerspective(
      req.user.id,
      conversationId,
      meetingData
    );

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Error processing data:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Mock data processing - for testing when Mistral API is unavailable
router.post('/process-data-mock', authMiddleware, async (req, res) => {
  try {
    const { dataIndex = 0 } = req.body;
    
    const dataPath = path.join(__dirname, '../data/data1.json');
    const fileContent = fs.readFileSync(dataPath, 'utf-8');
    const data = JSON.parse(fileContent);
    const meetings = data.meetings;
    
    if (!meetings || meetings.length === 0) {
      return res.status(400).json({ success: false, error: 'No meetings found' });
    }

    const meetingData = meetings[dataIndex];
    const conversationId = `conv_data_${meetingData.id}`;

    // Return mock analysis with GitHub issues
    const mockAnalysis = {
      success: true,
      meetingId: meetingData.id,
      title: meetingData.title,
      timestamp: new Date().toISOString(),
      technical: {
        analysis: `## Technical Analysis for ${meetingData.title}

### Architecture & Infrastructure
The payment system migration will require significant architectural changes. The team plans to move from Stripe to a custom payment gateway solution.

### Key Technical Recommendations
1. **Payment Gateway Migration**: Custom implementation over external services for better control and compliance
   GitHub Issue: Implement custom payment gateway for Q1 roadmap
   
2. **Database & Caching**: Redis layer for transaction caching will improve performance
   GitHub Issue: Add Redis caching layer for transaction records
   
3. **API Endpoints**: Refactor existing billing module and update all payment-related endpoints
   GitHub Issue: Refactor billing API endpoints for new payment gateway
   
4. **Security & Compliance**: PCI compliance is critical, schedule security audit before launch
   GitHub Issue: Conduct security audit for PCI compliance validation
   
5. **Data Migration**: Implement robust rollback strategy for data migration
   GitHub Issue: Create database migration and rollback scripts

### Technical Debt
- Authentication tokens need modernization
- Current Stripe integration is tightly coupled to business logic
- Lack of real-time payment status tracking

### Timeline Estimate
- Backend infrastructure: 5 weeks (with parallel work)
- Frontend changes: 2 weeks
- Security audit: 1 week
- Total critical path: 6 weeks

### Risk Assessment
- Data migration complexity (HIGH)
- PCI compliance validation (HIGH)
- System downtime during transition (MEDIUM)`,
      },
      nonTechnical: {
        analysis: `## Business & Strategic Analysis

### Executive Summary
The Q1 product planning meeting focused on a major payment system overhaul to improve compliance and performance.

### Business Goals
1. Transition to custom payment solution for better control
2. Improve transaction processing performance by 40% with caching
3. Ensure PCI compliance before launch
4. Modernize checkout experience

### Timeline & Scope
- Total project duration: 5-6 weeks
- Sequential approach: 6 weeks
- Parallel optimization: 5 weeks
- Monthly check-in meetings scheduled

### Budget Considerations
- Infrastructure upgrades: $5,000
- Testing tools and resources: Additional budget needed
- External security audit: Required for compliance

### Stakeholder Management
- Technical specification document: Due Friday
- Database migration scripts: Due Wednesday
- UI wireframes: Due Thursday
- Stakeholder buy-in: Required before proceeding

### Risk Factors
- Data migration complexity requires careful planning
- A/B testing needed for UI changes
- Timeline is aggressive but achievable with proper coordination

### Success Metrics
- Zero transaction data loss during migration
- Performance improvement measured and validated
- Full PCI compliance certification obtained`,
      },
    };

    res.json(mockAnalysis);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get processed data results from memory
router.get('/processed-data/:conversationId', authMiddleware, async (req, res) => {
  try {
    const { conversationId } = req.params;

    const memories = await agentMemory.getMemory(req.user.id, conversationId, 5);
    
    if (!memories || memories.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No processed data found',
      });
    }

    // Get the analysis memory (first one should be the combined analysis)
    const analysisMemory = memories.find(m => m.type === 'analysis');
    
    if (!analysisMemory) {
      return res.status(404).json({
        success: false,
        error: 'No analysis found',
      });
    }

    const analysisData = JSON.parse(analysisMemory.content);

    res.json({
      success: true,
      conversationId,
      data: analysisData,
      storedAt: analysisMemory.timestamp,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get all available data from data1.json
router.get('/available-data', authMiddleware, async (req, res) => {
  try {
    const dataPath = path.join(__dirname, '../data/data1.json');
    const fileContent = fs.readFileSync(dataPath, 'utf-8');
    const data = JSON.parse(fileContent);
    const meetings = data.meetings;

    res.json({
      success: true,
      count: meetings.length,
      meetings: meetings.map((m, idx) => ({
        index: idx,
        id: m.id,
        title: m.title,
        date: m.date,
        attendees: m.attendees.length,
      })),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Create GitHub issues using stored credentials
router.post('/create-github-issues', authMiddleware, async (req, res) => {
  try {
    const { conversationId, issues } = req.body;

    console.log('[GitHub Issues] User:', req.user.id, 'Issues count:', issues?.length);

    if (!issues || issues.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No issues provided',
      });
    }

    // Get user's GitHub settings
    const settings = await Settings.findOne({ userId: req.user.id });
    
    console.log('[GitHub Issues] Settings found:', !!settings, 'GitHub configured:', !!settings?.github?.validated);

    if (!settings || !settings.github || !settings.github.validated) {
      return res.status(400).json({
        success: false,
        error: 'GitHub is not configured. Please configure it in Settings.',
      });
    }

    const { token, repositoryUrl, owner, repo } = settings.github;
    
    console.log('[GitHub Issues] Creating issues for:', `${owner}/${repo}`);

    if (!token || !owner || !repo) {
      return res.status(400).json({
        success: false,
        error: 'Incomplete GitHub configuration',
      });
    }

    // Create issues using the GitHub agent with stored credentials
    const result = await githubAgent.createIssues(token, repositoryUrl, issues);

    console.log('[GitHub Issues] Result:', { success: result.successCount, failed: result.failureCount });

    // Save the issue creation record to memory
    try {
      await agentMemory.saveMemory(
        req.user.id,
        JSON.stringify(result),
        conversationId,
        'github_issues_created'
      );
    } catch (memError) {
      console.error('[GitHub Issues] Memory save error (non-fatal):', memError.message);
      // Don't fail the whole request if memory save fails
    }

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Error creating GitHub issues:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Extract GitHub issues from analysis text
router.post('/extract-github-issues', authMiddleware, async (req, res) => {
  try {
    const { analysisText } = req.body;

    if (!analysisText) {
      return res.status(400).json({
        success: false,
        error: 'analysisText is required',
      });
    }

    // Use the GitHub agent's extraction method
    const issues = githubAgent.extractGitHubIssues(analysisText);

    return res.json({
      success: true,
      issues: issues || [],
      issuesFound: issues ? issues.length : 0,
    });
  } catch (error) {
    console.error('Error extracting GitHub issues:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Extract GitHub PRs from analysis text
router.post('/extract-github-pull-requests', authMiddleware, async (req, res) => {
  try {
    const { analysisText } = req.body;

    if (!analysisText) {
      return res.status(400).json({
        success: false,
        error: 'analysisText is required',
      });
    }

    // Use the GitHub agent's extraction method for PRs
    const pullRequests = githubAgent.extractPullRequests(analysisText);

    return res.json({
      success: true,
      pullRequests: pullRequests || [],
      prsFound: pullRequests ? pullRequests.length : 0,
    });
  } catch (error) {
    console.error('Error extracting GitHub PRs:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Assign GitHub issues to team members
router.post('/assign-issues', authMiddleware, async (req, res) => {
  try {
    const { issueAssignments } = req.body;

    if (!issueAssignments || issueAssignments.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'issueAssignments is required',
      });
    }

    const settings = await Settings.findOne({ userId: req.user.id });
    
    if (!settings || !settings.github || !settings.github.validated) {
      return res.status(400).json({
        success: false,
        error: 'GitHub is not configured. Please configure it in Settings.',
      });
    }

    const { token, repositoryUrl } = settings.github;

    console.log('[Assign Issues] Assigning', issueAssignments.length, 'issues');

    const result = await githubAgent.assignIssues(token, repositoryUrl, issueAssignments);

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Error assigning issues:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Create pull requests from test to main branch
router.post('/create-pull-requests', authMiddleware, async (req, res) => {
  try {
    const { pullRequests } = req.body;

    if (!pullRequests || pullRequests.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'pullRequests is required',
      });
    }

    const settings = await Settings.findOne({ userId: req.user.id });
    
    if (!settings || !settings.github || !settings.github.validated) {
      return res.status(400).json({
        success: false,
        error: 'GitHub is not configured. Please configure it in Settings.',
      });
    }

    const { token, repositoryUrl } = settings.github;

    console.log('[Create PRs] Creating', pullRequests.length, 'pull requests');

    const result = await githubAgent.createPullRequest(token, repositoryUrl, pullRequests);

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Error creating pull requests:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
