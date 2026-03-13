import mistralClient from './mistralClient.js';
import { agentConfig } from './config.js';

class CalendarAgent {
  constructor() {
    this.name = 'CalendarAgent';
    this.type = 'scheduling';
    this.focus = 'Extracting meetings, holidays, and milestones from transcripts';
    this.capabilities = ['extract_events', 'format_calendar_payload'];
  }

  async extractEvents(transcript, currentDate = new Date().toISOString()) {
    try {
      const prompt = `You are an expert AI scheduling assistant. Review the following meeting transcript.
Find any mention of future meetings, holidays, deadlines, or events that need to be scheduled on a calendar.

The current date is: ${currentDate}. Use this to resolve relative dates like "next Thursday" or "in 2 weeks".

Output ONLY a single valid JSON array of objects. Do NOT include any explanations, markdown formatting, or surrounding text.

Return strictly this format:
[
  {
    "summary": "Event Title",
    "description": "Context or agenda",
    "date": "YYYY-MM-DD",
    "startTime": "HH:MM", // 24-hour format if a specific time is mentioned, else null
    "durationMinutes": 60, // Estimate based on context, default to 60 if unsure
    "isAllDay": false, // true for holidays/full day events
    "attendees": ["names of people involved"]
  }
]

If there are no events, output exactly: []

Transcript:
${transcript}`;

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

      console.log('CalendarAgent Extracted Content:', content);

      try {
        const events = JSON.parse(content);
        return Array.isArray(events) ? events : [];
      } catch (parseError) {
        // If it still fails, manually attempt to clean any trailing notes
        console.warn('First parse failed, attempting strict clean...');
        const strictMatch = content.substring(content.indexOf('['), content.lastIndexOf(']') + 1);
        const strictEvents = JSON.parse(strictMatch);
        return Array.isArray(strictEvents) ? strictEvents : [];
      }

    } catch (error) {
      console.error('Error in CalendarAgent extractEvents:', error);
      // Fallback in case of JSON parse error
      return [];
    }
  }
}

export default new CalendarAgent();