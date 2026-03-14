import mistralClient from './mistralClient.js';
import agentMemory from './memory.js';
import { agentConfig } from './config.js';

class NonTechnicalAgent {
  constructor() {
    this.name = 'NonTechnicalAgent';
    this.type = 'non-technical';
    this.focus = 'Business decisions, timelines, budget, and strategic considerations';
    this.capabilities = [
      'analyze_business_requirements',
      'identify_budget_matters',
      'extract_business_decisions',
      'stakeholder_analysis',
      'risk_and_timeline_planning',
    ];
  }

  /**
   * Process meeting from non-technical perspective
   */
  async processData(userId, conversationId, meetingData) {
    try {
      const businessPrompt = `You are a business analyst reviewing a meeting transcript.
Focus on:
1. Business Objectives & Goals: What are the strategic goals?
2. Budget & Resources: What budget or resource requirements are mentioned?
3. Timeline & Milestones: Deadlines, phases, and timeline expectations
4. Stakeholders & Buy-in: Who needs approval? Stakeholder concerns?
5. Business Risks: Market, competitive, or organizational risks
6. ROI & Business Value: Expected return and business impact
7. Decisions & Approvals: Key decisions made and approvals needed

Meeting Transcript:
${meetingData.transcript}

IMPORTANT INSTRUCTIONS:
- If the transcript is extremely short, casual, or contains absolutely NO business/management discussions (e.g., just a microphone check or greetings), DO NOT generate filler content. Simply output: "No business decisions or topics were discussed in this meeting."
- Do not list out empty categories (e.g., avoid "1. Business Objectives: None").
- Only provide a structured business analysis if real business content exists.`;

      const analysis = await mistralClient.generateResponse(
        [{ role: 'user', content: businessPrompt }],
        agentConfig.systemPrompt,
        { temperature: 0.7, maxTokens: 1500 }
      );

      // Save to memory
      await agentMemory.saveMemory(
        userId,
        JSON.stringify({
          agentType: 'non-technical',
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
        focus: 'Business Goals, Budget & Timeline',
        keyAreas: [
          'Business Objectives',
          'Budget & Resources',
          'Timeline & Phases',
          'Stakeholder Management',
          'Risk & Mitigation',
          'ROI & Impact',
        ],
        processedAt: new Date(),
      };

      return {
        success: true,
        data: structuredData,
        usage: analysis.usage,
      };
    } catch (error) {
      console.error('Error in NonTechnicalAgent:', error);
      throw error;
    }
  }

  /**
   * Extract business decisions and action items
   */
  async extractBusinessActions(userId, conversationId, meetingData) {
    try {
      const actionPrompt = `From this meeting transcript, extract ONLY business/management action items and decisions:
${meetingData.transcript}

IMPORTANT: If there are no business action items or decisions discussed, or if the transcript is purely conversational/introductory, simply return empty arrays: { "decisions": [], "actions": [] }

Format as JSON with structure:
{
  "decisions": [
    {
      "decision": "what was decided",
      "approver": "who approved",
      "impact": "business impact",
      "priority": "high/medium/low"
    }
  ],
  "actions": [
    {
      "task": "business task",
      "owner": "person responsible",
      "deadline": "timeline",
      "stakeholders": ["people involved"],
      "priority": "high/medium/low"
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
      console.error('Error extracting business actions:', error);
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

export default new NonTechnicalAgent();
