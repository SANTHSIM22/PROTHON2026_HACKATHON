// Agent exports
export { default as rootAgent } from './rootAgent.js';
export { default as mistralClient } from './mistralClient.js';
export { default as agentMemory } from './memory.js';
export { default as githubAgent } from './githubAgent.js';
export { default as nonTechnicalAgent } from './nonTechnicalAgent.js';
export { default as emailAgent } from './emailAgent.js';
export { default as calendarAgent } from './calendarAgent.js';
export { default as trelloAgent } from './trelloAgent.js';
export { agentConfig, systemPrompt } from './config.js';

// Agent factory
export const createAgent = (type = 'root') => {
  switch (type) {
    case 'root':
      return rootAgent;
    default:
      return rootAgent;
  }
};
