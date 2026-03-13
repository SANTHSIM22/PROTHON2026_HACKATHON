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
