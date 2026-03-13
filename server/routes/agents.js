import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';
import { google } from 'googleapis';
import { rootAgent, agentMemory, githubAgent, nonTechnicalAgent, emailAgent, calendarAgent, notionAgent } from '../agents/index.js';
import trelloAgent from '../agents/trelloAgent.js';
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

// Extract Email Tasks from transcript
router.post('/extract-emails', authMiddleware, async (req, res) => {
  try {
    const { dataIndex } = req.body;

    if (dataIndex === undefined) {
      return res.status(400).json({
        success: false,
        error: 'dataIndex is required',
      });
    }

    const dataPath = path.join(__dirname, '../data/data1.json');
    const fileContent = fs.readFileSync(dataPath, 'utf-8');
    const data = JSON.parse(fileContent);
    const meetings = data.meetings;

    if (!meetings || !meetings[dataIndex]) {
      return res.status(400).json({
        success: false,
        error: 'Invalid dataIndex',
      });
    }

    const transcript = meetings[dataIndex].transcript;
    const emails = await emailAgent.extractEmailTasks(transcript);

    return res.json({
      success: true,
      emails: emails || [],
      emailsFound: emails ? emails.length : 0,
    });
  } catch (error) {
    console.error('Error extracting email tasks:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Endpoint to send emails via Nodemailer
router.post('/send-emails', authMiddleware, async (req, res) => {
  try {
    const { emailTasks } = req.body;

    if (!emailTasks || emailTasks.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'emailTasks is required',
      });
    }

    // Configure Nodemailer transporter
    // For a hackathon demo, we will generate a test Ethereal account if no SMTP is provided.
    // In production or to send *real* emails, add SMTP_USER and SMTP_PASS to your .env file
    let transporter;
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      transporter = nodemailer.createTransport({
        service: 'gmail', // or your email provider
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    } else {
      console.log('No SMTP_USER found in .env, falling back to Ethereal Test Account...');
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false, 
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    }

    const results = [];
    
    for (const task of emailTasks) {
      if (!task.emailAddress) continue;
      
      const mailOptions = {
        from: '"AI Meeting Agent" <agent@ai-meetings.local>',
        to: task.emailAddress,
        subject: task.subject,
        text: `Hello ${task.name},\n\nFollowing our recent meeting, here is a task assigned to you:\n\n${task.context}\n\nBest regards,\nAI Meeting Agent`,
        html: `<h3>Hello ${task.name},</h3><p>Following our recent meeting, here is a task assigned to you:</p><blockquote style="border-left: 4px solid #ccc; padding-left: 10px; font-style: italic;">${task.context}</blockquote><br/><p>Best regards,<br/><strong>AI Meeting Agent</strong></p>`
      };

      const info = await transporter.sendMail(mailOptions);
      console.log(`Message sent to ${task.emailAddress}: %s`, info.messageId);
      if (!process.env.SMTP_USER) {
        console.log(`Preview URL for ${task.emailAddress}: %s`, nodemailer.getTestMessageUrl(info));
      }
      
      results.push({
        ...task,
        success: true,
        message: `Email sent successfully to ${task.emailAddress}`,
        previewUrl: nodemailer.getTestMessageUrl(info) || null,
        sentAt: new Date()
      });
    }

    return res.json({
      success: true,
      successCount: results.length,
      failureCount: 0,
      results
    });
  } catch (error) {
    console.error('Error sending emails:', error);
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

// Extract Calendar Events from transcript
router.post('/extract-events', authMiddleware, async (req, res) => {
  try {
    const { dataIndex } = req.body;

    if (dataIndex === undefined) {
      return res.status(400).json({ success: false, error: 'dataIndex is required' });
    }

    const dataPath = path.join(__dirname, '../data/data1.json');
    const fileContent = fs.readFileSync(dataPath, 'utf-8');
    const data = JSON.parse(fileContent);
    const meetings = data.meetings;

    if (!meetings || !meetings[dataIndex]) {
      return res.status(400).json({ success: false, error: 'Invalid dataIndex' });
    }

    const transcript = meetings[dataIndex].transcript;
    // We pass the "date" of the meeting as a reference so "next week" parses correctly
    const meetingDate = meetings[dataIndex].date || new Date().toISOString();
    
    const events = await calendarAgent.extractEvents(transcript, meetingDate);

    return res.json({
      success: true,
      events: events || [],
      eventsFound: events ? events.length : 0,
    });
  } catch (error) {
    console.error('Error extracting calendar events:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create Calendar events
router.post('/create-calendar-events', authMiddleware, async (req, res) => {
  try {
    const { events } = req.body;

    if (!events || events.length === 0) {
      return res.status(400).json({ success: false, error: 'No events provided' });
    }

    const settings = await Settings.findOne({ userId: req.user.id });
    let gCalToken = settings?.googleCalendar?.accessToken;
    const calendarId = settings?.googleCalendar?.calendarId || 'primary';
    
    // Auto-refresh token if OAuth credentials are provided using googleapis SDK
    if (settings?.googleCalendar?.refreshToken && settings?.googleCalendar?.clientId && settings?.googleCalendar?.clientSecret) {
      try {
        const oauth2Client = new google.auth.OAuth2(
          settings.googleCalendar.clientId,
          settings.googleCalendar.clientSecret,
          "https://developers.google.com/oauthplayground"
        );
        oauth2Client.setCredentials({ refresh_token: settings.googleCalendar.refreshToken });
        const { credentials } = await oauth2Client.refreshAccessToken();
        gCalToken = credentials.access_token;
      } catch (err) {
        console.error("Error fetching google refresh token:", err);
      }
    }

    // If no token is provided, fall back to a mock success (useful for tests)
    if (!gCalToken) {
      const results = events.map(event => ({
        ...event,
        success: true,
        message: `(Mock) Event '${event.summary}' scheduled for ${event.date}`,
        status: 'scheduled'
      }));

      return res.json({
        success: true,
        successCount: results.length,
        failureCount: 0,
        results,
        note: 'Mocked locally. Add Google Calendar Token in Settings to sync to a real calendar.'
      });
    }

    // Push data to the REAL Google Calendar API
    const results = [];
    let successCount = 0;
    let failureCount = 0;

    for (const event of events) {
      // Build request body for Google API
      const requestBody = {
        summary: event.summary,
        description: event.description,
      };

      if (event.isAllDay) {
        requestBody.start = { date: event.date };
        requestBody.end = { date: event.date };
        // Google requires endDate to be the next day (exclusive) for all day events
        const nextDay = new Date(event.date);
        nextDay.setDate(nextDay.getDate() + 1);
        requestBody.end = { date: nextDay.toISOString().split('T')[0] };
      } else {
        // Assume default timezone processing or construct standard ISO strings
        const startDateTime = event.startTime 
            ? `${event.date}T${event.startTime}:00Z` 
            : `${event.date}T09:00:00Z`; // fallback to 9am UTC
            
        // Provide standard 1 hr end block
        const endDate = new Date(startDateTime);
        endDate.setMinutes(endDate.getMinutes() + (event.durationMinutes || 60));

        requestBody.start = { dateTime: startDateTime };
        requestBody.end = { dateTime: endDate.toISOString() };
      }

      // Add attendees if any
      if (event.attendees && event.attendees.length > 0) {
        // Here we attempt to map their names, you could even map against contacts list!
        requestBody.attendees = event.attendees.map(a => ({ email: typeof a === 'string' && a.includes('@') ? a : 'dummy@example.com' }));
      }

      // Execute fetch
      try {
        const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${gCalToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error?.message || 'Google API Error');
        }

        successCount++;
        results.push({ ...event, success: true, apiLink: data.htmlLink });
      } catch (err) {
        failureCount++;
        results.push({ ...event, success: false, error: err.message });
      }
    }

    return res.json({
      success: true,
      successCount,
      failureCount,
      results
    });
  } catch (error) {
    console.error('Error creating calendar events:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Trello Agents
router.post('/extract-trello-cards', authMiddleware, async (req, res) => {
  try {
    const { dataIndex } = req.body;

    const dataPath = path.join(__dirname, '../data/data1.json');
    const rawData = fs.readFileSync(dataPath, 'utf8');
    const parsedData = JSON.parse(rawData);
    // Since we changed data1.json to have a "meetings" root property, unpack it safely
    const meetings = parsedData.meetings || parsedData; 

    if (dataIndex === undefined || !meetings[dataIndex]) {
      return res.status(400).json({ success: false, error: 'Invalid data index' });
    }

    const transcript = meetings[dataIndex].transcript;
    const cards = await trelloAgent.extractCards(transcript);

    return res.json({
      success: true,
      cards: cards || [],
      cardsFound: cards ? cards.length : 0,
    });
  } catch (error) {
    console.error('Error extracting Trello cards:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/create-trello-cards', authMiddleware, async (req, res) => {
  try {
    const { cards } = req.body;

    if (!cards || cards.length === 0) {
      return res.status(400).json({ success: false, error: 'No cards provided' });
    }

    const settings = await Settings.findOne({ userId: req.user.id });
    const trelloKey = settings?.trello?.apiKey;
    const trelloToken = settings?.trello?.apiToken;
    const listId = settings?.trello?.listId;

    if (!trelloKey || !trelloToken || !listId) {
       const results = cards.map(card => ({
        ...card,
        success: true,
        message: `(Mock) Trello Card '${card.name}' created`,
        status: 'created'
      }));

      return res.json({
        success: true,
        successCount: results.length,
        failureCount: 0,
        results,
        note: 'Mocked locally. Add Trello Credentials in Settings to sync to a real Trello board.'
      });
    }

    const results = [];
    let successCount = 0;
    let failureCount = 0;

    for (const card of cards) {
      try {
        const queryParams = new URLSearchParams({
          key: trelloKey,
          token: trelloToken,
          idList: listId,
          name: card.name,
          desc: card.desc || '',
        });

        const response = await fetch(`https://api.trello.com/1/cards?${queryParams.toString()}`, {
          method: 'POST',
          headers: { 'Accept': 'application/json' }
        });

        const data = await response.json();

        if (!response.ok) {
           throw new Error(data.message || 'Trello API Error');
        }

        successCount++;
        results.push({ ...card, success: true, url: data.url });
      } catch (err) {
        failureCount++;
        results.push({ ...card, success: false, error: err.message });
      }
    }

    return res.json({
      success: true,
      successCount,
      failureCount,
      results
    });
  } catch (error) {
    console.error('Error creating Trello cards:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Notion Agents
router.post('/extract-notion-summary', authMiddleware, async (req, res) => {
  try {
    const { dataIndex } = req.body;

    const dataPath = path.join(__dirname, '../data/data1.json');
    const rawData = fs.readFileSync(dataPath, 'utf8');
    const parsedData = JSON.parse(rawData);
    const meetings = parsedData.meetings || parsedData;

    if (dataIndex === undefined || !meetings[dataIndex]) {
      return res.status(400).json({ success: false, error: 'Invalid data index' });
    }

    const transcript = meetings[dataIndex].transcript;
    const summary = await notionAgent.generateSummary(transcript);

    return res.json({
      success: true,
      summary
    });
  } catch (error) {
    console.error('Error generating Notion summary:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/create-notion-page', authMiddleware, async (req, res) => {
  try {
    const { summary, title } = req.body;

    if (!summary) {
      return res.status(400).json({ success: false, error: 'No summary provided' });
    }

    const settings = await Settings.findOne({ userId: req.user.id });
    const notionKey = settings?.notion?.apiKey;
    const databaseId = settings?.notion?.databaseId;

    if (!notionKey || !databaseId) {
      return res.json({
        success: true,
        note: 'Mocked locally. Add Notion Credentials in Settings to push this summary to a real Notion database.',
        pageUrl: 'https://notion.so/mock-page-id'
      });
    }

    // Split markdown summary into blocks (Notion blocks have 2000 char limits)
    // We will do a basic split by newlines for paragraph blocks
    const chunks = summary.split('\n').filter(p => p.trim().length > 0);
    const childrenBlocks = chunks.map(chunk => ({
      object: 'block',
      type: 'paragraph',
      paragraph: {
        rich_text: [
          {
            type: 'text',
            text: {
              content: chunk.substring(0, 1999) // ensure limit is met
            }
          }
        ]
      }
    }));

    // If the ID acts as a normal "page" instead of a true structured "database", 
    // the parent object structure needs to reflect that.
    const requestBody = {
      parent: { 
        // We will try appending it to a page based on that error
        type: "page_id",
        page_id: databaseId
      },
      properties: {
        title: [
          { text: { content: title || 'Meeting Summary' } }
        ]
      },
      children: childrenBlocks.slice(0, 100) // max 100 blocks per request
    };

    const response = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${notionKey}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Notion API Error');
    }

    return res.json({
      success: true,
      pageUrl: data.url
    });
  } catch (error) {
    console.error('Error creating Notion page:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
