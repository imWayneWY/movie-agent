// src/factory.ts
import { MovieAgent } from './agent';
import TmdbApiClient from './tmdbApi';

/**
 * Configuration options for creating a MovieAgent instance
 */
export interface MovieAgentConfig {
  // TMDb Configuration (required)
  tmdbApiKey: string;
  tmdbBaseUrl?: string;
  tmdbRegion?: string;

  // LLM Provider Configuration (optional for now, may be used in future features)
  llmProvider?: 'gemini' | 'azure';
  geminiApiKey?: string;
  azureOpenAiApiKey?: string;
  azureOpenAiEndpoint?: string;
  azureOpenAiDeployment?: string;
  openaiApiKey?: string;

  // Application Settings (optional)
  cacheTtl?: number;
  maxRecommendations?: number;
  minRecommendations?: number;

  // Enable debug logging
  debug?: boolean;
}

/**
 * Factory class for creating configured MovieAgent instances
 *
 * This class provides a clean interface for external projects to create
 * MovieAgent instances without needing to manage TMDb API clients or
 * environment variables directly.
 *
 * @example
 * ```typescript
 * import { MovieAgentFactory } from 'movie-agent';
 *
 * const agent = MovieAgentFactory.create({
 *   tmdbApiKey: process.env.TMDB_API_KEY,
 *   tmdbRegion: 'CA',
 *   debug: true
 * });
 *
 * const recommendations = await agent.getRecommendations({
 *   mood: 'excited',
 *   genre: 'Action'
 * });
 * ```
 */
export class MovieAgentFactory {
  /**
   * Creates a configured MovieAgent instance
   *
   * @param config - Configuration options for the MovieAgent
   * @returns A fully configured MovieAgent instance ready to use
   * @throws Error if required configuration is missing
   */
  static create(config: MovieAgentConfig): MovieAgent {
    // Validate required configuration
    if (!config.tmdbApiKey) {
      throw new Error(
        'TMDB API key is required. Please provide tmdbApiKey in the configuration.'
      );
    }

    // Create TMDb API client with provided configuration
    const tmdbClient = new TmdbApiClient(
      config.tmdbBaseUrl || 'https://api.themoviedb.org/3',
      config.tmdbApiKey,
      config.tmdbRegion || 'CA'
    );

    // Create logger function if debug is enabled
    const logger = config.debug
      ? (message: string) => console.log(`[MovieAgent] ${message}`)
      : undefined;

    // Determine LLM enablement and get the appropriate API key
    const llmProvider = config.llmProvider;
    let llmApiKey: string | undefined;
    let enableLLM = false;
    let azureConfig: { endpoint?: string; deployment?: string } | undefined;

    if (llmProvider === 'azure' && config.azureOpenAiApiKey) {
      llmApiKey = config.azureOpenAiApiKey;
      azureConfig = {
        endpoint: config.azureOpenAiEndpoint,
        deployment: config.azureOpenAiDeployment,
      };
      enableLLM = true;
    } else if (llmProvider === 'gemini' && config.geminiApiKey) {
      llmApiKey = config.geminiApiKey;
      enableLLM = true;
    } else if (config.geminiApiKey) {
      // Default to Gemini if API key is provided but no provider specified
      llmApiKey = config.geminiApiKey;
      enableLLM = true;
    }

    // Create and return MovieAgent instance
    return new MovieAgent(
      tmdbClient,
      logger,
      enableLLM,
      llmProvider,
      llmApiKey,
      azureConfig
    );
  }

  /**
   * Creates a MovieAgent instance from environment variables
   *
   * This is a convenience method for projects that use environment variables.
   * It reads from process.env and creates a MovieAgent with the standard
   * environment variable names.
   *
   * Expected environment variables:
   * - TMDB_API_KEY (required)
   * - TMDB_BASE_URL (optional)
   * - TMDB_REGION (optional, defaults to 'CA')
   * - LLM_PROVIDER (optional)
   * - GEMINI_API_KEY (optional)
   * - AZURE_OPENAI_API_KEY (optional)
   * - AZURE_OPENAI_ENDPOINT (optional)
   * - AZURE_OPENAI_DEPLOYMENT (optional)
   * - OPENAI_API_KEY (optional)
   *
   * @param debug - Enable debug logging (default: false)
   * @returns A fully configured MovieAgent instance
   * @throws Error if TMDB_API_KEY is not set in environment
   *
   * @example
   * ```typescript
   * import { MovieAgentFactory } from 'movie-agent';
   *
   * // Make sure to load your .env file first
   * import dotenv from 'dotenv';
   * dotenv.config();
   *
   * const agent = MovieAgentFactory.fromEnv(true);
   * ```
   */
  static fromEnv(debug = false): MovieAgent {
    const tmdbApiKey = process.env.TMDB_API_KEY;

    if (!tmdbApiKey) {
      throw new Error(
        'TMDB_API_KEY environment variable is required. ' +
          'Please set it in your .env file or environment.'
      );
    }

    return MovieAgentFactory.create({
      tmdbApiKey,
      tmdbBaseUrl: process.env.TMDB_BASE_URL,
      tmdbRegion: process.env.TMDB_REGION,
      llmProvider:
        (process.env.LLM_PROVIDER as 'gemini' | 'azure') || undefined,
      geminiApiKey: process.env.GEMINI_API_KEY,
      azureOpenAiApiKey: process.env.AZURE_OPENAI_API_KEY,
      azureOpenAiEndpoint: process.env.AZURE_OPENAI_ENDPOINT,
      azureOpenAiDeployment: process.env.AZURE_OPENAI_DEPLOYMENT,
      openaiApiKey: process.env.OPENAI_API_KEY,
      cacheTtl: process.env.CACHE_TTL
        ? parseInt(process.env.CACHE_TTL, 10)
        : undefined,
      maxRecommendations: process.env.MAX_RECOMMENDATIONS
        ? parseInt(process.env.MAX_RECOMMENDATIONS, 10)
        : undefined,
      minRecommendations: process.env.MIN_RECOMMENDATIONS
        ? parseInt(process.env.MIN_RECOMMENDATIONS, 10)
        : undefined,
      debug,
    });
  }
}
