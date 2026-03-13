import express from 'express';
import authMiddleware from '../middleware/auth.js';
import Settings from '../models/Settings.js';
import githubAgent from '../agents/githubAgent.js';

const router = express.Router();

/**
 * Get user settings
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    let settings = await Settings.findOne({ userId: req.user.id });

    // Create default settings if they don't exist
    if (!settings) {
      settings = new Settings({
        userId: req.user.id,
      });
      await settings.save();
    }

    // Don't send the actual token to the frontend for security
    const safeSettings = {
      ...settings.toObject(),
      github: {
        ...settings.github.toObject(),
        token: settings.github.token ? '••••••••' : null,
      },
    };
    if (safeSettings.googleCalendar) {
      if (safeSettings.googleCalendar.accessToken) safeSettings.googleCalendar.accessToken = '••••••••';
      if (safeSettings.googleCalendar.clientId) safeSettings.googleCalendar.clientId = '••••••••';
      if (safeSettings.googleCalendar.clientSecret) safeSettings.googleCalendar.clientSecret = '••••••••';
      if (safeSettings.googleCalendar.refreshToken) safeSettings.googleCalendar.refreshToken = '••••••••';
    }
    
    if (safeSettings.trello) {
      if (safeSettings.trello.apiKey) safeSettings.trello.apiKey = '••••••••';
      if (safeSettings.trello.apiToken) safeSettings.trello.apiToken = '••••••••';
    }

    if (safeSettings.notion) {
      if (safeSettings.notion.apiKey) safeSettings.notion.apiKey = '••••••••';
    }

    res.json({
      success: true,
      settings: safeSettings,
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Update GitHub settings
 */
router.put('/github', authMiddleware, async (req, res) => {
  try {
    const { token, repositoryUrl } = req.body;

    if (!token || !repositoryUrl) {
      return res.status(400).json({
        success: false,
        error: 'Token and repository URL are required',
      });
    }

    // Validate GitHub credentials
    const validation = await githubAgent.validateCredentials(token, repositoryUrl);

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: validation.error,
      });
    }

    // Update or create settings
    let settings = await Settings.findOne({ userId: req.user.id });

    if (!settings) {
      settings = new Settings({
        userId: req.user.id,
      });
    }

    settings.github = {
      token,
      repositoryUrl,
      owner: validation.owner,
      repo: validation.repo,
      validated: true,
      validatedAt: new Date(),
    };

    await settings.save();

    res.json({
      success: true,
      message: `Successfully connected to ${validation.owner}/${validation.repo}`,
      github: {
        token: '••••••••',
        repositoryUrl,
        owner: validation.owner,
        repo: validation.repo,
        validated: true,
      },
    });
  } catch (error) {
    console.error('Update GitHub settings error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Update preferences
 */
router.put('/preferences', authMiddleware, async (req, res) => {
  try {
    const { autoCreateGitHubIssues, notifyOnIssueCreation } = req.body;

    let settings = await Settings.findOne({ userId: req.user.id });

    if (!settings) {
      settings = new Settings({
        userId: req.user.id,
      });
    }

    if (autoCreateGitHubIssues !== undefined) {
      settings.preferences.autoCreateGitHubIssues = autoCreateGitHubIssues;
    }

    if (notifyOnIssueCreation !== undefined) {
      settings.preferences.notifyOnIssueCreation = notifyOnIssueCreation;
    }

    await settings.save();

    res.json({
      success: true,
      message: 'Preferences updated',
      preferences: settings.preferences,
    });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Update contacts (for email routing)
 */
router.put('/contacts', authMiddleware, async (req, res) => {
  try {
    const { contacts } = req.body;

    let settings = await Settings.findOne({ userId: req.user.id });

    if (!settings) {
      settings = new Settings({
        userId: req.user.id,
      });
    }

    settings.contacts = contacts || [];
    await settings.save();

    res.json({
      success: true,
      message: 'Contacts updated',
      contacts: settings.contacts,
    });
  } catch (error) {
    console.error('Update contacts error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Update Google Calendar settings
 */
router.put('/google-calendar', authMiddleware, async (req, res) => {
  try {
    const { accessToken, clientId, clientSecret, refreshToken, calendarId } = req.body;

    let settings = await Settings.findOne({ userId: req.user.id });

    if (!settings) {
      settings = new Settings({
        userId: req.user.id,
      });
    }

    if (!settings.googleCalendar) {
      settings.googleCalendar = {};
    }

    if (accessToken !== undefined) settings.googleCalendar.accessToken = accessToken;
    if (clientId !== undefined) settings.googleCalendar.clientId = clientId;
    if (clientSecret !== undefined) settings.googleCalendar.clientSecret = clientSecret;
    if (refreshToken !== undefined) settings.googleCalendar.refreshToken = refreshToken;
    if (calendarId !== undefined) settings.googleCalendar.calendarId = calendarId || 'primary';
    
    await settings.save();

    res.json({
      success: true,
      message: 'Google Calendar settings updated',
      googleCalendar: {
        accessToken: settings.googleCalendar.accessToken ? '••••••••' : null,
        clientId: settings.googleCalendar.clientId ? '••••••••' : null,
        clientSecret: settings.googleCalendar.clientSecret ? '••••••••' : null,
        refreshToken: settings.googleCalendar.refreshToken ? '••••••••' : null,
        calendarId: settings.googleCalendar.calendarId
      },
    });
  } catch (error) {
    console.error('Update Google Calendar settings error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Update Trello settings
 */
router.put('/trello', authMiddleware, async (req, res) => {
  try {
    const { apiKey, apiToken, listId } = req.body;

    let settings = await Settings.findOne({ userId: req.user.id });

    if (!settings) {
      settings = new Settings({
        userId: req.user.id,
      });
    }

    if (!settings.trello) {
      settings.trello = {};
    }

    if (apiKey !== undefined) settings.trello.apiKey = apiKey;
    if (apiToken !== undefined) settings.trello.apiToken = apiToken;
    if (listId !== undefined) settings.trello.listId = listId;

    await settings.save();

    res.json({
      success: true,
      message: 'Trello settings updated',
    });
  } catch (error) {
    console.error('Update Trello settings error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Update Notion settings
 */
router.put('/notion', authMiddleware, async (req, res) => {
  try {
    const { apiKey, databaseId } = req.body;

    let settings = await Settings.findOne({ userId: req.user.id });

    if (!settings) {
      settings = new Settings({ userId: req.user.id });
    }

    if (!settings.notion) {
      settings.notion = {};
    }

    if (apiKey !== undefined) settings.notion.apiKey = apiKey;
    if (databaseId !== undefined) settings.notion.databaseId = databaseId;

    await settings.save();

    res.json({
      success: true,
      message: 'Notion settings updated',
    });
  } catch (error) {
    console.error('Update Notion settings error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Clear GitHub settings
 */
router.delete('/github', authMiddleware, async (req, res) => {
  try {
    let settings = await Settings.findOne({ userId: req.user.id });

    if (settings) {
      settings.github = {
        token: null,
        repositoryUrl: null,
        owner: null,
        repo: null,
        validated: false,
        validatedAt: null,
      };
      await settings.save();
    }

    res.json({
      success: true,
      message: 'GitHub settings cleared',
    });
  } catch (error) {
    console.error('Clear GitHub settings error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
