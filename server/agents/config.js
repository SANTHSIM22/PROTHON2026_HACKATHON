// Agent Configuration
export const agentConfig = {
  mistral: {
    apiKey: process.env.MISTRAL_API_KEY,
    modelName: 'mistral-large-latest',
    temperature: 0.7,
    maxTokens: 2048,
  },
  memoryConfig: {
    memoryType: 'conversation', // 'conversation', 'entity', 'summary'
    maxMemoryItems: 100,
    ttl: 24 * 60 * 60 * 1000, // 24 hours
  },
  agentTimeouts: {
    default: 30000, // 30 seconds
    processing: 60000, // 60 seconds
    longRunning: 300000, // 5 minutes
  },
};

export const systemPrompt = `You are an AI Meeting-to-Action System Agent. Your role is to:
1. Analyze meeting transcripts and discussions
2. Extract key discussion points and decisions
3. Identify actionable items and tasks
4. Convert discussions into structured outputs
5. Maintain context from previous conversations
6. Provide intelligent summaries and recommendations

You have access to conversation memory and can reference previous interactions.
Always be clear, concise, and action-oriented in your responses.`;
