import Memory from '../models/Memory.js';

class AgentMemory {
  constructor() {
    this.memoryCache = new Map();
  }

  /**
   * Save conversation memory to database
   */
  async saveMemory(userId, content, conversationId, memoryType = 'conversation') {
    try {
      const memory = new Memory({
        userId,
        conversationId,
        type: memoryType,
        content,
        timestamp: new Date(),
        metadata: {
          model: 'mistral-large-latest',
          importance: this.calculateImportance(content),
        },
      });

      const savedMemory = await memory.save();
      
      // Also cache in memory
      const cacheKey = `${userId}:${conversationId}`;
      if (!this.memoryCache.has(cacheKey)) {
        this.memoryCache.set(cacheKey, []);
      }
      this.memoryCache.get(cacheKey).push(savedMemory);

      return savedMemory;
    } catch (error) {
      console.error('Error saving memory:', error);
      throw error;
    }
  }

  /**
   * Retrieve conversation memory
   */
  async getMemory(userId, conversationId, limit = 20) {
    try {
      const memories = await Memory.find({
        userId,
        conversationId,
      })
        .sort({ timestamp: -1 })
        .limit(limit);

      return memories;
    } catch (error) {
      console.error('Error retrieving memory:', error);
      throw error;
    }
  }

  /**
   * Search memories by content
   */
  async searchMemories(userId, query) {
    try {
      const memories = await Memory.find({
        userId,
        $text: { $search: query },
      }).limit(10);

      return memories;
    } catch (error) {
      console.error('Error searching memories:', error);
      throw error;
    }
  }

  /**
   * Get context for agent from recent memories
   */
  async getContext(userId, conversationId, contextLength = 5) {
    try {
      const memories = await this.getMemory(userId, conversationId, contextLength);
      
      const context = memories
        .reverse()
        .map(mem => `[${mem.type}] ${mem.content}`)
        .join('\n');

      return context;
    } catch (error) {
      console.error('Error getting context:', error);
      throw error;
    }
  }

  /**
   * Calculate importance score for memory
   */
  calculateImportance(content) {
    const keywordWeights = {
      'decision': 5,
      'action': 4,
      'task': 4,
      'urgent': 5,
      'important': 3,
      'completed': 2,
    };

    let score = 1;
    const lowerContent = content.toLowerCase();

    for (const [keyword, weight] of Object.entries(keywordWeights)) {
      if (lowerContent.includes(keyword)) {
        score += weight;
      }
    }

    return Math.min(score, 10); // Cap at 10
  }

  /**
   * Clear memory for a conversation
   */
  async clearMemory(conversationId) {
    try {
      await Memory.deleteMany({ conversationId });
      
      // Clear from cache
      for (const [key] of this.memoryCache) {
        if (key.includes(conversationId)) {
          this.memoryCache.delete(key);
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Error clearing memory:', error);
      throw error;
    }
  }

  /**
   * Get memory summary
   */
  async getMemorySummary(userId, conversationId) {
    try {
      const memories = await Memory.find({ userId, conversationId });
      
      const summary = {
        totalMemories: memories.length,
        byType: {},
        averageImportance: 0,
      };

      memories.forEach(mem => {
        summary.byType[mem.type] = (summary.byType[mem.type] || 0) + 1;
        summary.averageImportance += mem.metadata?.importance || 0;
      });

      summary.averageImportance = 
        memories.length > 0 
          ? summary.averageImportance / memories.length 
          : 0;

      return summary;
    } catch (error) {
      console.error('Error getting memory summary:', error);
      throw error;
    }
  }
}

export default new AgentMemory();
