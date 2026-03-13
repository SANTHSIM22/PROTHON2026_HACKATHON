import axios from 'axios';
import agentMemory from './memory.js';

class GitHubAgent {
  constructor() {
    this.name = 'GitHubAgent';
    this.type = 'github';
    this.focus = 'Create and manage GitHub issues from meeting analysis';
    this.capabilities = [
      'extract_github_issues',
      'create_issues',
      'validate_github_credentials',
      'list_repositories',
    ];
  }

  /**
   * Extract GitHub issues from technical analysis
   */
  extractGitHubIssues(analysisText) {
    const issues = [];
    const issuePattern = /GitHub Issue:\s*([^\n]+)/gi;
    let match;

    while ((match = issuePattern.exec(analysisText)) !== null) {
      const title = match[1].trim();
      if (title && title.length > 0) {
        issues.push({
          title: title.substring(0, 120),
          description: `Auto-generated from meeting analysis: ${title}`,
          labels: ['automated', 'from-meeting'],
          body: `This GitHub issue was automatically created from a meeting analysis.\n\n**Issue Title:** ${title}`,
        });
      }
    }

    return issues;
  }

  /**
   * Validate GitHub credentials
   */
  async validateCredentials(githubToken, githubUrl) {
    try {
      // Extract owner/repo from URL
      const urlMatch = githubUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
      if (!urlMatch) {
        return {
          valid: false,
          error: 'Invalid GitHub URL format. Use: https://github.com/owner/repo',
        };
      }

      const [, owner, repo] = urlMatch;

      // Test the token by making a simple API call
      const response = await axios.get(`https://api.github.com/repos/${owner}/${repo}`, {
        headers: {
          Authorization: `token ${githubToken}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });

      return {
        valid: true,
        owner,
        repo,
        repoName: response.data.name,
        message: `Successfully connected to ${owner}/${repo}`,
      };
    } catch (error) {
      return {
        valid: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  /**
   * Create GitHub issues
   */
  async createIssues(githubToken, githubUrl, issues) {
    try {
      // Extract owner/repo from URL
      const urlMatch = githubUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
      if (!urlMatch) {
        throw new Error('Invalid GitHub URL format');
      }

      const [, owner, repo] = urlMatch;
      const createdIssues = [];

      console.log(`[GitHubAgent] Creating ${issues.length} issues for ${owner}/${repo}`);

      for (const issue of issues) {
        try {
          console.log(`[GitHubAgent] Creating issue: "${issue.title}"`);
          
          const response = await axios.post(
            `https://api.github.com/repos/${owner}/${repo}/issues`,
            {
              title: `[Auto-Generated] ${issue.title}`,
              body: issue.body || `Auto-generated from meeting analysis`,
              labels: issue.labels || [],
            },
            {
              headers: {
                Authorization: `token ${githubToken}`,
                Accept: 'application/vnd.github.v3+json',
              },
            }
          );

          console.log(`[GitHubAgent] Issue created successfully: #${response.data.number}`);

          createdIssues.push({
            title: issue.title,
            issueNumber: response.data.number,
            url: response.data.html_url,
            success: true,
          });
        } catch (issueError) {
          console.error(`[GitHubAgent] Failed to create issue "${issue.title}":`, issueError.response?.data?.message || issueError.message);
          createdIssues.push({
            title: issue.title,
            success: false,
            error: issueError.response?.data?.message || issueError.message,
          });
        }
      }

      console.log(`[GitHubAgent] Completed: ${createdIssues.filter(i => i.success).length}/${issues.length} issues created`);

      return {
        totalRequested: issues.length,
        successCount: createdIssues.filter(i => i.success).length,
        failureCount: createdIssues.filter(i => !i.success).length,
        issues: createdIssues,
      };
    } catch (error) {
      console.error('[GitHubAgent] Error:', error.message);
      throw error;
    }
  }

  /**
   * Process technical data and create GitHub issues
   */
  async processAndCreateIssues(userId, conversationId, technicalAnalysis, githubToken, githubUrl) {
    try {
      // Extract issues
      const issues = this.extractGitHubIssues(technicalAnalysis);

      if (!issues || issues.length === 0) {
        return {
          success: true,
          message: 'No GitHub issues found in technical analysis',
          issuesFound: 0,
        };
      }

      // Validate credentials
      const validation = await this.validateCredentials(githubToken, githubUrl);
      if (!validation.valid) {
        throw new Error(`GitHub validation failed: ${validation.error}`);
      }

      // Create issues
      const result = await this.createIssues(githubToken, githubUrl, issues);

      // Save to memory
      await agentMemory.saveMemory(
        userId,
        JSON.stringify({
          action: 'github_issues_created',
          conversationId,
          result,
          timestamp: new Date(),
        }),
        conversationId,
        'interaction'
      );

      return {
        success: true,
        ...result,
      };
    } catch (error) {
      console.error('Error processing and creating GitHub issues:', error);
      throw error;
    }
  }

  /**
   * Get agent info
   */
  getInfo() {
    return {
      name: this.name,
      type: this.type,
      focus: this.focus,
      capabilities: this.capabilities,
    };
  }
}

export default new GitHubAgent();
