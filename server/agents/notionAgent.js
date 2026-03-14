import mistralClient from './mistralClient.js';
import { agentConfig } from './config.js';

class NotionAgent {
  async generateSummary(transcript) {
    const prompt = `Analyze this meeting transcript and produce a concise, user-friendly Markdown brief that is easy to scan.

Use this structure:
1. # Meeting Brief
2. ## Snapshot (2-4 bullets in plain language)
3. ## Decisions Made (bullet list)
4. ## Action Checklist (Markdown checkboxes using - [ ] ...)
5. ## Technical Issues (ONLY include when real technical issues exist)
6. ## Non-Technical Issues (ONLY include when real business/process issues exist)
7. ## Next Steps (short numbered list)

Formatting rules:
- Keep language simple and direct.
- Do not add sections that have no content.
- Do not write placeholders like "None", "N/A", or "No issues".
- Keep each bullet to one clear point.
- Return Markdown only, with no conversational filler.

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
