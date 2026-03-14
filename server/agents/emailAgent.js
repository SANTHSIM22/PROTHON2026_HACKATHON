import mistralClient from './mistralClient.js';
import agentMemory from './memory.js';
import { agentConfig } from './config.js';

class EmailAgent {
  constructor() {
    this.name = 'EmailAgent';
    this.type = 'communication';
    this.focus = 'Extracting and formulating email tasks from meeting transcripts';
    this.capabilities = [
      'extract_emails',
      'format_email_context',
      'match_recipients'
    ];
  }

  async extractEmailTasks(transcript) {
    try {
      const emailPrompt = `You are a helpful communication assistant. Review the following meeting transcript.
Find every instance where someone is explicitly asked to be sent an email, or where an email is planned.
For each instance, output exactly one line in the following strict format, separated by the pipe "|" character:
Email Task: [Name of recipient] | Subject: [Suggested Subject] | Context: [Brief context of what to say]

Example:
Email Task: Sarah | Subject: Q1 Budget Approval needed | Context: Need final sign off on the $5000 infrastructure upgrades

If no emails are mentioned, do not output anything.

Meeting Transcript:
${transcript}`;

      const analysis = await mistralClient.generateResponse(
        [{ role: 'user', content: emailPrompt }],
        agentConfig.systemPrompt,
        { temperature: 0.2, maxTokens: 1000 }
      );

      const content = analysis.content;
      console.log('EmailAgent AI Response:', content);
      
      const emails = [];
      const emailPattern = /(?:Email Task)(?:\*\*|:)?\s+([^|]+)\s*\|\s*(?:\*\*|)?Subject(?:\*\*|:)?\s+([^|]+)\s*\|\s*(?:\*\*|)?Context(?:\*\*|:)?\s+([^\n\r]+)/gi;
      let match;

      while ((match = emailPattern.exec(content)) !== null) {
        const name = match[1].replace(/\*\*/g, '').trim();
        const subject = match[2].replace(/\*\*/g, '').trim();
        const context = match[3].replace(/\*\*/g, '').trim();
        if (name && name.length > 0) {
          emails.push({
            name: name.substring(0, 100),
            subject: subject.substring(0, 150),
            context: context.substring(0, 500)
          });
        }
      }

      return emails;

    } catch (error) {
      console.error('Error in EmailAgent extractEmailTasks:', error);
      throw error;
    }
  }
}

export default new EmailAgent();
