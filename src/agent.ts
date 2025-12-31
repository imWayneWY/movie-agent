// src/agent.ts
import {
  UserInput,
  AgentResponse,
  MovieRecommendation,
  StreamingPlatform,
  ErrorResponse,
} from './types';
import {
  validatePlatforms,
  validateRuntime,
  validateYear,
  validateYearRange,
  validateMood,
  validateGenre,
} from './validate';
import { moodToGenres } from './mood';
import { discoverMovies, DiscoverInput } from './discover';
import TmdbApiClient, {
  MovieDetails,
  MovieDetailsWithProviders,
} from './tmdbApi';
import { extractPlatformsFromProviders } from './providers';
import { applyFilters, FilterOptions } from './filters';
import { rankMovies, RankableMovie, RankingInput } from './ranking';
import { toRecommendation, formatResponse } from './format';
import { LLMService } from './llm';

/**
 * Extended movie type with platform information
 */
interface MovieWithProviders extends MovieDetails {
  platforms: string[];
}

/**
 * MovieAgent orchestrates the full recommendation pipeline
 */
export class MovieAgent {
  private tmdbClient: TmdbApiClient;
  private logger: (message: string) => void;
  private llmService: LLMService | null;

  /**
   * Creates a new MovieAgent instance
   * @param tmdbClient - Optional TMDb API client for testing
   * @param logger - Optional logger function for debugging
   * @param enableLLM - Whether to enable LLM formatting (default: true if GEMINI_API_KEY is set)
   * @param llmProvider - LLM provider to use ('gemini' or 'azure')
   * @param llmApiKey - API key for the LLM provider
   * @param azureConfig - Azure OpenAI configuration (endpoint and deployment)
   */
  constructor(
    tmdbClient?: TmdbApiClient,
    logger?: (message: string) => void,
    enableLLM?: boolean,
    llmProvider?: 'gemini' | 'azure',
    llmApiKey?: string,
    azureConfig?: { endpoint?: string; deployment?: string }
  ) {
    this.tmdbClient = tmdbClient ?? new TmdbApiClient();
    this.logger =
      logger ?? ((message: string) => console.log(`[MovieAgent] ${message}`));

    // Initialize LLM service if enabled and API key is available
    const shouldEnableLLM = enableLLM ?? !!process.env.GEMINI_API_KEY;
    this.llmService = shouldEnableLLM
      ? new LLMService(llmApiKey, llmProvider, azureConfig)
      : null;
  }

  /**
   * Gets movie recommendations based on user input
   * @param input - User input with mood, platforms, genres, runtime, and year preferences
   * @returns Promise resolving to structured agent response with 3-5 recommendations or error response
   */
  async getRecommendations(
    input: UserInput
  ): Promise<AgentResponse | ErrorResponse> {
    try {
      this.logger('Starting recommendation pipeline');

      // Step 1: Validate input
      this.logger('Step 1: Validating input');
      this.validateInput(input);

      // Step 2: Resolve genres from mood or explicit input
      this.logger('Step 2: Resolving genres');
      const genres = this.resolveGenres(input);
      this.logger(`Resolved genres: ${genres.join(', ')}`);

      // Step 3: Discover candidate movies via TMDb (with watch providers)
      this.logger('Step 3: Discovering candidate movies with providers');
      const candidates = await this.discoverCandidates(input, genres);
      this.logger(`Found ${candidates.length} candidate movies`);

      if (candidates.length === 0) {
        return this.createErrorResponse(
          'NO_RESULTS',
          'No movies found matching the criteria'
        );
      }

      // Step 4: Extract watch providers from embedded data (region CA)
      this.logger('Step 4: Extracting watch providers');
      const moviesWithProviders = this.extractWatchProviders(candidates);
      this.logger(
        `${moviesWithProviders.length} movies have streaming providers`
      );

      // Step 5: Apply filters (platforms, runtime, year)
      this.logger('Step 5: Applying filters');
      const filtered = this.applyFilters(moviesWithProviders, input);
      this.logger(`${filtered.length} movies passed filters`);

      if (filtered.length === 0) {
        return this.createErrorResponse(
          'NO_RESULTS',
          'No movies match the specified filters (platforms, runtime, year)'
        );
      }

      // Step 6: Rank and select top 3-5 movies
      this.logger('Step 6: Ranking and selecting top movies');
      const topMovies = this.rankAndSelect(filtered, input);
      this.logger(`Selected ${topMovies.length} top movies`);

      // Step 7: Format structured output with metadata
      this.logger('Step 7: Formatting output');
      const recommendations = this.formatRecommendations(topMovies, input);
      const response = formatResponse(recommendations, {
        inputParameters: input,
      });

      this.logger('Pipeline completed successfully');
      return response;
    } catch (error) {
      this.logger(
        `Error in recommendation pipeline: ${error instanceof Error ? error.message : String(error)}`
      );
      return this.handleError(error);
    }
  }

  /**
   * Creates a structured error response
   * @param errorType - The type of error
   * @param message - Human-readable error message
   * @param details - Optional details for debugging
   * @returns ErrorResponse object
   */
  private createErrorResponse(
    errorType: ErrorResponse['errorType'],
    message: string,
    details?: string
  ): ErrorResponse {
    return {
      error: true,
      errorType,
      message,
      timestamp: new Date().toISOString(),
      details,
    };
  }

  /**
   * Handles errors and converts them to structured error responses
   * @param error - The error to handle
   * @returns ErrorResponse object
   */
  private handleError(error: unknown): ErrorResponse {
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Check for invalid API key errors
    if (
      errorMessage.includes('401') ||
      errorMessage.includes('Invalid API key') ||
      errorMessage.includes('authentication')
    ) {
      return this.createErrorResponse(
        'INVALID_API_KEY',
        'Invalid or missing TMDB API key',
        errorMessage
      );
    }

    // Check for rate limit errors
    if (
      errorMessage.includes('429') ||
      errorMessage.includes('rate limit') ||
      errorMessage.includes('Too Many Requests')
    ) {
      return this.createErrorResponse(
        'RATE_LIMIT_EXCEEDED',
        'TMDB API rate limit exceeded. Please try again later.',
        errorMessage
      );
    }

    // Check for MCP/network errors
    if (
      errorMessage.includes('Network error') ||
      errorMessage.includes('ECONNREFUSED') ||
      errorMessage.includes('ENOTFOUND') ||
      errorMessage.includes('timeout')
    ) {
      return this.createErrorResponse(
        'MCP_UNAVAILABLE',
        'Unable to connect to TMDB API service',
        errorMessage
      );
    }

    // Check for validation errors - be more comprehensive
    if (
      errorMessage.includes('Invalid') ||
      errorMessage.includes('must be') ||
      errorMessage.includes('cannot be greater than') ||
      errorMessage.includes('Year range invalid') ||
      errorMessage.includes('runtime') ||
      errorMessage.includes('year')
    ) {
      return this.createErrorResponse(
        'VALIDATION_ERROR',
        errorMessage,
        errorMessage
      );
    }

    // Default to unknown error
    return this.createErrorResponse(
      'UNKNOWN_ERROR',
      'An unexpected error occurred while processing your request',
      errorMessage
    );
  }

  /**
   * Validates user input
   * @param input - User input to validate
   * @throws Error if validation fails
   */
  private validateInput(input: UserInput): void {
    // Validate mood if provided
    if (input.mood !== undefined) {
      validateMood(input.mood);
    }

    // Validate genre if provided
    if (input.genre !== undefined) {
      validateGenre(input.genre);
    }

    // Validate platforms if provided
    if (input.platforms && input.platforms.length > 0) {
      validatePlatforms(input.platforms);
    }

    // Validate runtime constraints if provided
    if (input.runtime) {
      validateRuntime(input.runtime);
    }

    // Validate release year if provided
    if (input.releaseYear !== undefined) {
      if (typeof input.releaseYear === 'number') {
        validateYear(input.releaseYear);
      } else {
        validateYearRange(input.releaseYear);
      }
    }
  }

  /**
   * Resolves genres from mood or explicit genre input
   * @param input - User input
   * @returns Array of genre names
   */
  private resolveGenres(input: UserInput): string[] {
    // Prioritize explicit genres
    if (input.genre) {
      return Array.isArray(input.genre) ? input.genre : [input.genre];
    }

    // Fall back to mood-based genres
    if (input.mood) {
      return moodToGenres(input.mood);
    }

    // No genre preference
    return [];
  }

  /**
   * Discovers candidate movies from TMDb
   * @param input - User input
   * @param genres - Resolved genres
   * @returns Array of movie summaries
   */
  private async discoverCandidates(
    input: UserInput,
    genres: string[]
  ): Promise<MovieDetailsWithProviders[]> {
    // Build discover input
    const discoverInput: DiscoverInput = {
      genres: genres.length > 0 ? genres : undefined,
      mood: input.mood,
    };

    // Add year constraints if provided
    if (input.releaseYear !== undefined) {
      if (typeof input.releaseYear === 'number') {
        discoverInput.year = input.releaseYear;
      } else {
        discoverInput.yearMin = input.releaseYear.from;
        discoverInput.yearMax = input.releaseYear.to;
      }
    }

    // Add runtime constraints if provided
    if (input.runtime) {
      discoverInput.runtimeMin = input.runtime.min;
      discoverInput.runtimeMax = input.runtime.max;
    }

    // Discover movies
    const response = await discoverMovies(discoverInput, this.tmdbClient);

    // Fetch detailed information for top candidates
    // Limit to top 20 to avoid excessive API calls
    const topCandidates = response.results.slice(0, 20);

    // Fetch details with watch providers in a single call per movie
    // This uses append_to_response to reduce API calls by 50%
    const detailsPromises = topCandidates.map(movie =>
      this.tmdbClient.getMovieDetailsWithProviders(movie.id)
    );

    const details = await Promise.all(detailsPromises);
    return details;
  }

  /**
   * Extracts watch providers from movie details and filters to those with providers
   * @param candidates - Array of movie details with embedded providers
   * @returns Array of movies with platform information
   */
  private extractWatchProviders(
    candidates: MovieDetailsWithProviders[]
  ): MovieWithProviders[] {
    const moviesWithProviders: MovieWithProviders[] = [];

    for (const movie of candidates) {
      try {
        const platforms = extractPlatformsFromProviders(
          movie['watch/providers'],
          'CA'
        );

        // Only include movies with at least one provider
        if (platforms.length > 0) {
          moviesWithProviders.push({
            ...movie,
            platforms,
          });
        }
      } catch (error) {
        // Log error but continue with other movies
        this.logger(
          `Failed to extract providers for movie ${movie.id}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }

    return moviesWithProviders;
  }

  /**
   * Applies user-specified filters to movies
   * @param movies - Movies with provider information
   * @param input - User input
   * @returns Filtered movies
   */
  private applyFilters(
    movies: MovieWithProviders[],
    input: UserInput
  ): MovieWithProviders[] {
    const filterOptions: FilterOptions = {};

    // Add platform filter if specified
    if (input.platforms && input.platforms.length > 0) {
      filterOptions.platforms = input.platforms;
    }

    // Add runtime filter if specified
    if (input.runtime) {
      filterOptions.runtime = input.runtime;
    }

    // Add year filter if specified
    if (input.releaseYear !== undefined) {
      if (typeof input.releaseYear === 'number') {
        filterOptions.year = input.releaseYear;
      } else {
        filterOptions.year = {
          from: input.releaseYear.from,
          to: input.releaseYear.to,
        };
      }
    }

    return applyFilters(movies, filterOptions);
  }

  /**
   * Ranks movies and selects top 3-5
   * @param movies - Filtered movies
   * @param input - User input
   * @returns Top 3-5 movies
   */
  private rankAndSelect(
    movies: MovieWithProviders[],
    input: UserInput
  ): MovieWithProviders[] {
    // Build ranking input
    const rankingInput: RankingInput = {
      mood: input.mood,
      genres: input.genre
        ? Array.isArray(input.genre)
          ? input.genre
          : [input.genre]
        : undefined,
      platforms: input.platforms,
      runtime: input.runtime,
    };

    // Add year preferences for ranking
    if (input.releaseYear !== undefined) {
      if (typeof input.releaseYear === 'number') {
        rankingInput.year = { preferred: input.releaseYear };
      } else {
        rankingInput.year = {
          from: input.releaseYear.from,
          to: input.releaseYear.to,
        };
      }
    }

    // Rank movies
    const ranked = rankMovies(movies as RankableMovie[], rankingInput);

    // Select top 3-5 movies
    const count = Math.min(5, Math.max(3, ranked.length));
    return ranked.slice(0, count) as MovieWithProviders[];
  }

  /**
   * Formats movies into recommendations
   * @param movies - Selected movies
   * @param input - User input
   * @returns Array of formatted recommendations
   */
  private formatRecommendations(
    movies: MovieWithProviders[],
    input: UserInput
  ): MovieRecommendation[] {
    return movies.map(movie => {
      // Build streaming platform information
      const streamingPlatforms: StreamingPlatform[] = movie.platforms.map(
        name => ({
          name,
          type: 'subscription',
          available: true,
        })
      );

      // Generate match reason based on input
      const reason = this.generateMatchReason(movie, input);

      // Format as recommendation
      return toRecommendation(
        {
          id: movie.id,
          title: movie.title,
          release_date: movie.release_date || '',
          runtime: movie.runtime || 0,
          overview: movie.overview || '',
          genres: movie.genres || [],
        },
        streamingPlatforms,
        reason
      );
    });
  }

  /**
   * Get recommendations with AI-formatted output (invoke mode)
   * @param input - User input with mood, platforms, genres, runtime, and year preferences
   * @returns Promise resolving to AI-formatted string output or error response
   */
  async invoke(input: UserInput): Promise<string | ErrorResponse> {
    const response = await this.getRecommendations(input);

    if ('error' in response) {
      return response;
    }

    // Use LLM if available, otherwise use fallback formatting
    if (this.llmService) {
      try {
        return await this.llmService.formatRecommendations(response, input);
      } catch (error) {
        this.logger(`LLM formatting failed, using fallback: ${error}`);
        return this.fallbackFormat(response);
      }
    }

    return this.fallbackFormat(response);
  }

  /**
   * Get recommendations with AI-formatted streaming output
   * @param input - User input with mood, platforms, genres, runtime, and year preferences
   * @param onChunk - Callback function called for each chunk of streamed content
   * @returns Promise resolving when streaming is complete, or error response
   */
  async stream(
    input: UserInput,
    onChunk: (chunk: string) => void
  ): Promise<void | ErrorResponse> {
    const response = await this.getRecommendations(input);

    if ('error' in response) {
      return response;
    }

    // Use LLM streaming if available, otherwise output fallback immediately
    if (this.llmService) {
      try {
        await this.llmService.formatRecommendationsStream(
          response,
          input,
          onChunk
        );
      } catch (error) {
        this.logger(`LLM streaming failed, using fallback: ${error}`);
        onChunk(this.fallbackFormat(response));
      }
    } else {
      onChunk(this.fallbackFormat(response));
    }
  }

  /**
   * Fallback formatting when LLM is not available
   */
  private fallbackFormat(response: AgentResponse): string {
    let output = '\\n🎬 Movie Recommendations\\n\\n';

    response.recommendations.forEach((movie, index) => {
      output += `${index + 1}. **${movie.title}** (${movie.releaseYear}) • ${movie.runtime} min\\n`;
      output += `   Genres: ${movie.genres.join(', ')}\\n\\n`;
      output += `   ${movie.description}\\n\\n`;

      const platforms = movie.streamingPlatforms
        .filter(p => p.available)
        .map(p => p.name);

      if (platforms.length > 0) {
        output += `   📺 Available on: ${platforms.join(', ')}\\n`;
      }

      output += `   ✨ Why: ${movie.matchReason}\\n\\n`;
    });

    return output;
  }

  /**
   * Generates a match reason for a movie
   * @param movie - Movie to explain
   * @param input - User input
   * @returns Match reason string
   */
  private generateMatchReason(
    movie: MovieWithProviders,
    input: UserInput
  ): string {
    const reasons: string[] = [];

    // Genre match
    const movieGenres = movie.genres?.map(g => g.name) || [];
    const userGenres = this.resolveGenres(input);
    const matchedGenres = movieGenres.filter(g => userGenres.includes(g));

    if (matchedGenres.length > 0) {
      reasons.push(
        `matches your ${input.mood ? `${input.mood} mood` : 'genre preferences'} (${matchedGenres.join(', ')})`
      );
    }

    // Platform availability
    if (input.platforms && input.platforms.length > 0) {
      const matchedPlatforms = movie.platforms.filter(p =>
        input.platforms!.includes(p)
      );
      if (matchedPlatforms.length > 0) {
        reasons.push(`available on ${matchedPlatforms.join(', ')}`);
      }
    }

    // Popularity
    if (movie.popularity && movie.popularity > 50) {
      reasons.push('highly rated');
    }

    // Default reason if none match
    if (reasons.length === 0) {
      reasons.push('recommended based on your preferences');
    }

    return reasons.join(', ');
  }
}
