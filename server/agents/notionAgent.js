import mistralClient from './mistralClient.js';
import { agentConfig } from './config.js';

class NotionAgent {
  async generateSummary(transcript) {
    const prompt = `Analyze the following meeting transcript. Generate a comprehensive and well-structured summary of the meeting. 
Include the main topics discussed, key decisions made, and a brief overview of action items.
Return the output as plain text formatted with Markdown (headings, bullet points). Do not include any conversational filler.

Transcript:
${transcript}`;

    try {
      const response = await mistralClient.generateResponse(
        [{ role: 'user', content: prompt }],
        agentConfig.systemPrompt,
        { temperature: 0.2, maxTokens: 2000 }
      );

      return response.content.trim();
    } catch (error) {
      console.error('Error in NotionAgent generateSummary:', error);
      return "Error: Failed to generate summary from the transcript.";
    }
  }
}

export default new NotionAgent();
