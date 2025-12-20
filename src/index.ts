// src/index.ts - Main entry point for the movie-agent package

// Export the main MovieAgent class
export { MovieAgent } from './agent';

// Export the factory for easy configuration
export { MovieAgentFactory, MovieAgentConfig } from './factory';

// Export types for external use
export {
  UserInput,
  AgentResponse,
  MovieRecommendation,
  StreamingPlatform,
  ErrorResponse,
} from './types';

// Export TMDb API client for advanced use cases
export { default as TmdbApiClient } from './tmdbApi';

// Export LLM service for advanced use cases
export { LLMService, getLLMService } from './llm';

// Default export is the factory for convenience
export { MovieAgentFactory as default } from './factory';
