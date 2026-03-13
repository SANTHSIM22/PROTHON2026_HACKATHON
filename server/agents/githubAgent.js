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
      'assign_issues',
      'create_pull_requests'
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
   * Extract Pull Requests from technical analysis
   */
  extractPullRequests(analysisText) {
    const prs = [];
    
    // First try strictly finding the formatted ones with descriptions
    const strictPattern = /(?:Pull Request|PR)(?:\*\*|:)?\s+([^\n\r|]+)\s*\|\s*(?:\*\*|)?Description(?:\*\*|:)?\s+([^\n\r]+)/gi;
    let match;
    let foundUrls = new Set();

    while ((match = strictPattern.exec(analysisText)) !== null) {
      const title = match[1].replace(/\*\*/g, '').trim();
      const description = match[2].replace(/\*\*/g, '').trim();
      if (title && title.length > 0 && !foundUrls.has(title)) {
        foundUrls.add(title);
        // Vary the source branch slightly if you expect multiple PRs from a single transcript
        // Note: Realistically, GitHub only allows one PR per branch pair at a time.
        prs.push({
          title: title.substring(0, 120),
          description: description,
          head: 'test',
          base: 'main',
          labels: ['automated', 'from-meeting'],
        });
      }
    }

    // Fallback if no strict matches found: try finding simple "Pull Request: [Title]"
    if (prs.length === 0) {
      const simplePattern = /(?:Pull Request|PR)(?:\*\*|:)?\s+([^\n\r]+)/gi;
      while ((match = simplePattern.exec(analysisText)) !== null) {
        let title = match[1].replace(/\*\*/g, '').trim();
        // Ignore lines that look like they contain the word "Description" or are too long
        if (title && title.length > 0 && title.length < 150 && !title.toLowerCase().includes('description:') && !foundUrls.has(title)) {
          foundUrls.add(title);
          prs.push({
            title: title.substring(0, 120),
            description: `Auto-generated pull request from meeting analysis`,
            head: 'test',
            base: 'main',
            labels: ['automated', 'from-meeting'],
          });
        }
      }
    }

    return prs;
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
   * Assign issues to team members
   */
  async assignIssues(githubToken, githubUrl, issueAssignments) {
    try {
      // Extract owner/repo from URL
      const urlMatch = githubUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
      if (!urlMatch) {
        throw new Error('Invalid GitHub URL format');
      }

      const [, owner, repo] = urlMatch;
      const assignmentResults = [];

      console.log(`[GitHubAgent] Assigning ${issueAssignments.length} issues for ${owner}/${repo}`);

      for (const assignment of issueAssignments) {
        try {
          const { issueNumber, assignees } = assignment;

          if (!issueNumber || !assignees || assignees.length === 0) {
            assignmentResults.push({
              issueNumber,
              success: false,
              error: 'Issue number and assignees are required',
            });
            continue;
          }

          console.log(`[GitHubAgent] Assigning issue #${issueNumber} to ${assignees.join(', ')}`);

          const response = await axios.patch(
            `https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}`,
            {
              assignees: assignees,
            },
            {
              headers: {
                Authorization: `token ${githubToken}`,
                Accept: 'application/vnd.github.v3+json',
              },
            }
          );

          console.log(`[GitHubAgent] Issue #${issueNumber} assigned successfully`);

          assignmentResults.push({
            issueNumber,
            assignees,
            url: response.data.html_url,
            success: true,
          });
        } catch (error) {
          console.error(`[GitHubAgent] Failed to assign issue:`, error.response?.data?.message || error.message);
          assignmentResults.push({
            issueNumber: assignment.issueNumber,
            assignees: assignment.assignees,
            success: false,
            error: error.response?.data?.message || error.message,
          });
        }
      }

      console.log(`[GitHubAgent] Assignment completed: ${assignmentResults.filter(r => r.success).length}/${issueAssignments.length}`);

      return {
        totalRequested: issueAssignments.length,
        successCount: assignmentResults.filter(r => r.success).length,
        failureCount: assignmentResults.filter(r => !r.success).length,
        assignments: assignmentResults,
      };
    } catch (error) {
      console.error('[GitHubAgent] Error assigning issues:', error.message);
      throw error;
    }
  }

  /**
   * Create pull request from test branch to main
   */
  async createPullRequest(githubToken, githubUrl, pullRequests) {
    try {
      // Extract owner/repo from URL
      const urlMatch = githubUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
      if (!urlMatch) {
        throw new Error('Invalid GitHub URL format');
      }

      const [, owner, repo] = urlMatch;
      const prResults = [];

      console.log(`[GitHubAgent] Creating ${pullRequests.length} pull requests for ${owner}/${repo}`);

      for (const pr of pullRequests) {
        try {
          const {
            title,
            description,
            head = 'test',
            base = 'main',
            labels,
          } = pr;

          if (!title) {
            prResults.push({
              title,
              success: false,
              error: 'PR title is required',
            });
            continue;
          }

          console.log(`[GitHubAgent] Creating PR: "${title}" from ${head} to ${base}`);

          const response = await axios.post(
            `https://api.github.com/repos/${owner}/${repo}/pulls`,
            {
              title: `[Auto-Generated] ${title}`,
              body: description || `Auto-generated pull request from ${head} to ${base}`,
              head,
              base
            },
            {
              headers: {
                Authorization: `token ${githubToken}`,
                Accept: 'application/vnd.github.v3+json',
              },
            }
          );

          console.log(`[GitHubAgent] PR created successfully: #${response.data.number}`);

          prResults.push({
            title,
            prNumber: response.data.number,
            url: response.data.html_url,
            head,
            base,
            success: true,
          });
        } catch (error) {
          let errorDetail = error.response?.data?.message || error.message;
          if (error.response?.data?.errors && error.response?.data?.errors.length > 0) {
            errorDetail += ` (${error.response.data.errors[0].message})`;
          }
          
          console.error(`[GitHubAgent] Failed to create PR:`, errorDetail);
          prResults.push({
            title: pr.title,
            success: false,
            error: errorDetail,
          });
        }
      }

      console.log(`[GitHubAgent] PR creation completed: ${prResults.filter(r => r.success).length}/${pullRequests.length}`);

      return {
        totalRequested: pullRequests.length,
        successCount: prResults.filter(r => r.success).length,
        failureCount: prResults.filter(r => !r.success).length,
        pullRequests: prResults,
      };
    } catch (error) {
      console.error('[GitHubAgent] Error creating pull requests:', error.message);
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
