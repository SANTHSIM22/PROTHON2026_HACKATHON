import { Mistral } from '@mistralai/mistralai';
import { agentConfig } from './config.js';

class MistralClient {
  constructor() {
    this.client = new Mistral({
      apiKey: agentConfig.mistral.apiKey,
    });
  }

  /**
   * Generate response from Mistral AI
   */
  async generateResponse(messages, systemPrompt = null, options = {}) {
    try {
      const messageList = [
        ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
        ...messages,
      ];

      const response = await this.client.chat.complete({
        model: agentConfig.mistral.modelName,
        messages: messageList,
        temperature: options.temperature || agentConfig.mistral.temperature,
        maxTokens: options.maxTokens || agentConfig.mistral.maxTokens,
      });

      return {
        content: response.choices[0].message.content,
        usage: response.usage,
        model: response.model,
      };
    } catch (error) {
      console.error('Error generating response:', error);
      throw error;
    }
  }

  /**
   * Stream response from Mistral AI
   */
  async streamResponse(messages, systemPrompt = null, options = {}) {
    try {
      const messageList = [
        ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
        ...messages,
      ];

      const stream = await this.client.chat.stream({
        model: agentConfig.mistral.modelName,
        messages: messageList,
        temperature: options.temperature || agentConfig.mistral.temperature,
        maxTokens: options.maxTokens || agentConfig.mistral.maxTokens,
      });

      return stream;
    } catch (error) {
      console.error('Error streaming response:', error);
      throw error;
    }
  }

  /**
   * Analyze meeting transcript
   */
  async analyzeMeeting(transcript, previousContext = '') {
    try {
      const prompt = `
${previousContext ? `Previous context:\n${previousContext}\n\n` : ''}
Analyze the following meeting transcript. Extract:
1. Key discussion points
2. Decisions made
3. Action items (with assignees if mentioned)
4. Follow-up items
5. Important notes

Transcript:
${transcript}

Provide a structured analysis.`;

      const response = await this.generateResponse(
        [{ role: 'user', content: prompt }],
        agentConfig.systemPrompt
      );

      return response;
    } catch (error) {
      console.error('Error analyzing meeting:', error);
      throw error;
    }
  }

  /**
   * Extract action items
   */
  async extractActionItems(transcript) {
    try {
      const prompt = `
Extract all action items from the meeting transcript. For each action item, identify:
- Description
- Assignee (if mentioned)
- Priority (High/Medium/Low)
- Due date (if mentioned)

Return as structured JSON.

Transcript:
${transcript}`;

      const response = await this.generateResponse(
        [{ role: 'user', content: prompt }],
        agentConfig.systemPrompt
      );

      return response;
    } catch (error) {
      console.error('Error extracting action items:', error);
      throw error;
    }
  }

  /**
   * Generate summary
   */
  async generateSummary(transcript, previousContext = '') {
    try {
      const prompt = `
${previousContext ? `Previous context:\n${previousContext}\n\n` : ''}
Generate a concise summary of this meeting transcript:

${transcript}

The summary should be clear, actionable, and highlight key decisions.`;

      const response = await this.generateResponse(
        [{ role: 'user', content: prompt }],
        agentConfig.systemPrompt
      );

      return response;
    } catch (error) {
      console.error('Error generating summary:', error);
      throw error;
    }
  }

  /**
   * Multi-turn conversation
   */
  async chat(messages, systemPrompt = null) {
    return this.generateResponse(messages, systemPrompt);
  }
}

export default new MistralClient();
