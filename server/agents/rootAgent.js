import mistralClient from './mistralClient.js';
import agentMemory from './memory.js';
import { agentConfig } from './config.js';
import technicalAgent from './technicalAgent.js';
import nonTechnicalAgent from './nonTechnicalAgent.js';

class RootAgent {
  constructor() {
    this.name = 'RootAgent';
    this.capabilities = [
      'analyze_meetings',
      'extract_actions',
      'generate_summaries',
      'maintain_context',
      'process_requests',
      'delegate_to_agents',
      'process_dual_perspective',
    ];
    this.subAgents = {
      technical: technicalAgent,
      nonTechnical: nonTechnicalAgent,
    };
  }

  /**
   * Initialize agent for a user
   */
  async initialize(userId) {
    return {
      agentId: `agent_${userId}_${Date.now()}`,
      userId,
      capabilities: this.capabilities,
      initialized: true,
      timestamp: new Date(),
    };
  }

  /**
   * Process meeting for user
   */
  async processMeeting(userId, conversationId, meetingData) {
    try {
      // Get context from memory
      const context = await agentMemory.getContext(userId, conversationId);

      // Analyze meeting with Mistral
      const analysis = await mistralClient.analyzeMeeting(
        meetingData.transcript,
        context
      );

      // Save to memory
      await agentMemory.saveMemory(
        userId,
        `Meeting analyzed: ${meetingData.title}`,
        conversationId,
        'analysis'
      );

      return {
        success: true,
        analysis: analysis.content,
        usage: analysis.usage,
      };
    } catch (error) {
      console.error('Error processing meeting:', error);
      throw error;
    }
  }

  /**
   * Process user request
   */
  async processRequest(userId, conversationId, request) {
    try {
      // Get conversation context
      const context = await agentMemory.getContext(userId, conversationId);

      // Build messages
      const messages = [
        { role: 'user', content: request },
      ];

      // Get response from Mistral
      const response = await mistralClient.chat(
        messages,
        agentConfig.systemPrompt
      );

      // Save interaction to memory
      await agentMemory.saveMemory(
        userId,
        `User: ${request}\nAgent: ${response.content}`,
        conversationId,
        'interaction'
      );

      return {
        success: true,
        response: response.content,
        usage: response.usage,
      };
    } catch (error) {
      console.error('Error processing request:', error);
      throw error;
    }
  }

  /**
   * Extract action items from meeting
   */
  async extractActionItems(userId, conversationId, transcript) {
    try {
      const actionItems = await mistralClient.extractActionItems(transcript);

      await agentMemory.saveMemory(
        userId,
        `Action items extracted: ${actionItems.content}`,
        conversationId,
        'action_items'
      );

      return {
        success: true,
        actionItems: actionItems.content,
      };
    } catch (error) {
      console.error('Error extracting action items:', error);
      throw error;
    }
  }

  /**
   * Generate meeting summary
   */
  async generateSummary(userId, conversationId, transcript) {
    try {
      const context = await agentMemory.getContext(userId, conversationId);

      const summary = await mistralClient.generateSummary(transcript, context);

      await agentMemory.saveMemory(
        userId,
        `Meeting summary: ${summary.content}`,
        conversationId,
        'summary'
      );

      return {
        success: true,
        summary: summary.content,
      };
    } catch (error) {
      console.error('Error generating summary:', error);
      throw error;
    }
  }

  /**
   * Get conversation history
   */
  async getConversationHistory(userId, conversationId, limit = 10) {
    try {
      const memories = await agentMemory.getMemory(
        userId,
        conversationId,
        limit
      );

      return {
        success: true,
        history: memories,
      };
    } catch (error) {
      console.error('Error getting history:', error);
      throw error;
    }
  }

  /**
   * Search conversation memories
   */
  async searchMemories(userId, query) {
    try {
      const results = await agentMemory.searchMemories(userId, query);

      return {
        success: true,
        results,
      };
    } catch (error) {
      console.error('Error searching memories:', error);
      throw error;
    }
  }

  /**
   * Process stream (for real-time responses)
   */
  async processStream(userId, conversationId, request, onChunk) {
    try {
      const stream = await mistralClient.streamResponse(
        [{ role: 'user', content: request }],
        agentConfig.systemPrompt
      );

      let fullResponse = '';

      for await (const chunk of stream) {
        if (chunk.data?.choices?.[0]?.delta?.content) {
          const content = chunk.data.choices[0].delta.content;
          fullResponse += content;
          onChunk(content);
        }
      }

      // Save complete interaction
      await agentMemory.saveMemory(
        userId,
        `User: ${request}\nAgent: ${fullResponse}`,
        conversationId,
        'interaction'
      );

      return { success: true, response: fullResponse };
    } catch (error) {
      console.error('Error processing stream:', error);
      throw error;
    }
  }

  /**
   * Process data with both technical and non-technical agents
   */
  async processDualPerspective(userId, conversationId, meetingData) {
    try {
      console.log('RootAgent: Processing dual perspective for meeting:', meetingData.title);

      // Process with both agents in parallel
      const [technicalResult, nonTechnicalResult] = await Promise.all([
        technicalAgent.processData(userId, conversationId, meetingData),
        nonTechnicalAgent.processData(userId, conversationId, meetingData),
      ]);

      // Extract actions from both perspectives
      const [techActions, nonTechActions] = await Promise.all([
        technicalAgent.extractTechnicalActions(userId, conversationId, meetingData),
        nonTechnicalAgent.extractBusinessActions(userId, conversationId, meetingData),
      ]);

      // Save combined analysis to memory
      const combinedAnalysis = {
        meetingId: meetingData.id,
        title: meetingData.title,
        processedAt: new Date(),
        technical: {
          analysis: technicalResult.data.analysis,
          actions: techActions.actions,
        },
        nonTechnical: {
          analysis: nonTechnicalResult.data.analysis,
          actions: nonTechActions.actions,
        },
      };

      await agentMemory.saveMemory(
        userId,
        JSON.stringify(combinedAnalysis),
        conversationId,
        'analysis'
      );

      return {
        success: true,
        meetingId: meetingData.id,
        title: meetingData.title,
        technical: technicalResult.data,
        nonTechnical: nonTechnicalResult.data,
        techActions: techActions.actions,
        nonTechActions: nonTechActions.actions,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('Error in dual perspective processing:', error);
      throw error;
    }
  }

  /**
   * Get agent capabilities
   */
  getCapabilities() {
    return {
      agent: this.name,
      capabilities: this.capabilities,
      config: {
        model: agentConfig.mistral.modelName,
        temperature: agentConfig.mistral.temperature,
        maxTokens: agentConfig.mistral.maxTokens,
      },
      subAgents: {
        technical: technicalAgent.getInfo(),
        nonTechnical: nonTechnicalAgent.getInfo(),
      },
    };
  }
}

export default new RootAgent();
