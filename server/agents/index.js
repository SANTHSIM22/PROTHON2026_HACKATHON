// Agent exports
export { default as rootAgent } from './rootAgent.js';
export { default as mistralClient } from './mistralClient.js';
export { default as agentMemory } from './memory.js';
export { default as githubAgent } from './githubAgent.js';
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
