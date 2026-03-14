import mistralClient from './mistralClient.js';
import agentMemory from './memory.js';
import { agentConfig } from './config.js';

class TechnicalAgent {
  constructor() {
    this.name = 'TechnicalAgent';
    this.type = 'technical';
    this.focus = 'Technical aspects, architecture, code changes, and system requirements';
    this.capabilities = [
      'analyze_technical_requirements',
      'identify_technical_debt',
      'suggest_architecture_improvements',
      'estimate_technical_timeline',
      'security_analysis',
    ];
  }

  /**
   * Process meeting from technical perspective
   */
  async processData(userId, conversationId, meetingData) {
    try {
      const technicalPrompt = `You are a technical expert analyzing a meeting transcript. 
Focus on:
1. Technical Requirements & Architecture: What technical changes are needed?
2. Technology Stack & Tools: What technologies should be used?
3. Technical Debt & Risks: What technical risks exist?
4. Development Timeline: Realistic estimates for implementation
5. Code Quality & Testing: What testing and quality measures are needed?
6. Security & Compliance: Security implications and compliance requirements
7. Performance Considerations: Optimization opportunities
8. GitHub Issues to Create: List specific, actionable GitHub issues with titles that should be created
9. Pull Requests to Create: List specific pull requests that should be created based on the discussion

Meeting Transcript:
${meetingData.transcript}

IMPORTANT INSTRUCTIONS:
- If the transcript is extremely short, casual, or contains absolutely NO technical discussions (e.g., just a microphone check or greetings), DO NOT generate filler content. Simply output: "No technical discussion points were found in this meeting."
- Do not list out empty categories (e.g., avoid "1. Technical Requirements: None").
- Only provide structured technical analysis and recommendations if real technical content exists.
- When suggesting GitHub issues based on actual content, format them clearly as: "GitHub Issue: [Issue Title]"
- When suggesting Pull Requests based on actual content, format them strictly on a SINGLE LINE as:
"Pull Request: [PR Title] | Description: [PR Description]"`;

      const analysis = await mistralClient.generateResponse(
        [{ role: 'user', content: technicalPrompt }],
        agentConfig.systemPrompt,
        { temperature: 0.7, maxTokens: 1500 }
      );

      // Save to memory
      await agentMemory.saveMemory(
        userId,
        JSON.stringify({
          agentType: 'technical',
          analysis: analysis.content,
          timestamp: new Date(),
        }),
        conversationId,
        'analysis'
      );

      // Parse structured data from analysis
      const structuredData = {
        agentType: this.type,
        agentName: this.name,
        analysis: analysis.content,
        focus: 'Technical Requirements, Architecture & Security',
        keAreas: [
          'Architecture & Design',
          'Technology Stack',
          'Development Timeline',
          'Technical Debt',
          'Security & Compliance',
          'Performance',
        ],
        processedAt: new Date(),
      };

      return {
        success: true,
        data: structuredData,
        usage: analysis.usage,
      };
    } catch (error) {
      console.error('Error in TechnicalAgent:', error);
      throw error;
    }
  }

  /**
   * Extract technical action items
   */
  async extractTechnicalActions(userId, conversationId, meetingData) {
    try {
      const actionPrompt = `From this meeting transcript, extract ONLY technical action items with clear ownership:
${meetingData.transcript}

IMPORTANT: If there are no technical action items discussed, or if the transcript is purely conversational/introductory, simply return this exact JSON indicating empty actions: { "actions": [] }

Format as JSON with structure:
{
  "actions": [
    {
      "task": "specific technical task",
      "owner": "person responsible",
      "deadline": "timeline mentioned",
      "priority": "high/medium/low",
      "dependencies": ["other tasks if any"]
    }
  ]
}`;

      const response = await mistralClient.generateResponse(
        [{ role: 'user', content: actionPrompt }],
        agentConfig.systemPrompt,
        { temperature: 0.5, maxTokens: 1000 }
      );

      await agentMemory.saveMemory(
        userId,
        response.content,
        conversationId,
        'action_items'
      );

      return {
        success: true,
        actions: response.content,
      };
    } catch (error) {
      console.error('Error extracting technical actions:', error);
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

  /**
   * Extract GitHub issues from analysis
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
          labels: ['automated', 'from-meeting']
        });
      }
    }

    return issues;
  }
}

export default new TechnicalAgent();
