import mistralClient from './mistralClient.js';
import { agentConfig } from './config.js';

class TrelloAgent {
  async extractCards(transcript) {
    const prompt = `Analyze the following meeting transcript. Identify any explicit action items or tasks that sound like they should be tracked on a project board (like Trello).
    
Extract these tasks into a structured JSON array. Each element in the array must be an object with these properties:
- "name": A concise, clear title for the task (string)
- "desc": A detailed description or notes about the task (string)

Output ONLY a single valid JSON array of these objects. Do NOT include any explanations, introduction, or markdown formatting outside of the array.

If there are no tasks found, output exactly: []

Transcript:
${transcript}`;

    try {
      const response = await mistralClient.generateResponse(
        [{ role: 'user', content: prompt }],
        agentConfig.systemPrompt,
        { temperature: 0.1, maxTokens: 1500 }
      );

      let content = response.content.trim();
      
      // Attempt to isolate just the JSON array
      const startIndex = content.indexOf('[');
      const endIndex = content.lastIndexOf(']');
      
      if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
        content = content.substring(startIndex, endIndex + 1);
      }

      console.log('TrelloAgent Extracted Content:', content);

      try {
        const cards = JSON.parse(content);
        return Array.isArray(cards) ? cards : [];
      } catch (parseError) {
        console.warn('Trello JSON parse failed, returning empty array.');
        return [];
      }

    } catch (error) {
      console.error('Error in TrelloAgent extractCards:', error);
      return [];
    }
  }
}

export default new TrelloAgent();
