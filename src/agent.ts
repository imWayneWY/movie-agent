// src/agent.ts
import { UserInput, AgentResponse, MovieRecommendation, StreamingPlatform, ErrorResponse } from './types';
import { validatePlatforms, validateRuntime, validateYear, validateYearRange } from './validate';
import { moodToGenres } from './mood';
import { discoverMovies, DiscoverInput } from './discover';
import TmdbApiClient, { MovieDetails } from './tmdbApi';
import { getCanadianProviders } from './providers';
import { applyFilters, FilterOptions } from './filters';
import { rankMovies, RankableMovie, RankingInput } from './ranking';
import { toRecommendation, formatResponse } from './format';

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

  /**
   * Creates a new MovieAgent instance
   * @param tmdbClient - Optional TMDb API client for testing
   * @param logger - Optional logger function for debugging
   */
  constructor(tmdbClient?: TmdbApiClient, logger?: (message: string) => void) {
    this.tmdbClient = tmdbClient ?? new TmdbApiClient();
    this.logger = logger ?? ((message: string) => console.log(`[MovieAgent] ${message}`));
  }

  /**
   * Gets movie recommendations based on user input
   * @param input - User input with mood, platforms, genres, runtime, and year preferences
   * @returns Promise resolving to structured agent response with 3-5 recommendations or error response
   */
  async getRecommendations(input: UserInput): Promise<AgentResponse | ErrorResponse> {
    try {
      this.logger('Starting recommendation pipeline');

      // Step 1: Validate input
      this.logger('Step 1: Validating input');
      this.validateInput(input);

      // Step 2: Resolve genres from mood or explicit input
      this.logger('Step 2: Resolving genres');
      const genres = this.resolveGenres(input);
      this.logger(`Resolved genres: ${genres.join(', ')}`);

      // Step 3: Discover candidate movies via TMDb
      this.logger('Step 3: Discovering candidate movies');
      const candidates = await this.discoverCandidates(input, genres);
      this.logger(`Found ${candidates.length} candidate movies`);

      if (candidates.length === 0) {
        return this.createErrorResponse('NO_RESULTS', 'No movies found matching the criteria');
      }

      // Step 4: Fetch watch providers for each candidate (region CA)
      this.logger('Step 4: Fetching watch providers');
      const moviesWithProviders = await this.fetchWatchProviders(candidates);
      this.logger(`Fetched providers for ${moviesWithProviders.length} movies`);

      // Step 5: Apply filters (platforms, runtime, year)
      this.logger('Step 5: Applying filters');
      const filtered = this.applyFilters(moviesWithProviders, input);
      this.logger(`${filtered.length} movies passed filters`);

      if (filtered.length === 0) {
        return this.createErrorResponse('NO_RESULTS', 'No movies match the specified filters (platforms, runtime, year)');
      }

      // Step 6: Rank and select top 3-5 movies
      this.logger('Step 6: Ranking and selecting top movies');
      const topMovies = this.rankAndSelect(filtered, input);
      this.logger(`Selected ${topMovies.length} top movies`);

      // Step 7: Format structured output with metadata
      this.logger('Step 7: Formatting output');
      const recommendations = this.formatRecommendations(topMovies, input);
      const response = formatResponse(recommendations, { inputParameters: input });

      this.logger('Pipeline completed successfully');
      return response;
    } catch (error) {
      this.logger(`Error in recommendation pipeline: ${error instanceof Error ? error.message : String(error)}`);
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
    if (errorMessage.includes('401') || errorMessage.includes('Invalid API key') || errorMessage.includes('authentication')) {
      return this.createErrorResponse(
        'INVALID_API_KEY',
        'Invalid or missing TMDB API key',
        errorMessage
      );
    }
    
    // Check for rate limit errors
    if (errorMessage.includes('429') || errorMessage.includes('rate limit') || errorMessage.includes('Too Many Requests')) {
      return this.createErrorResponse(
        'RATE_LIMIT_EXCEEDED',
        'TMDB API rate limit exceeded. Please try again later.',
        errorMessage
      );
    }
    
    // Check for MCP/network errors
    if (errorMessage.includes('Network error') || errorMessage.includes('ECONNREFUSED') || 
        errorMessage.includes('ENOTFOUND') || errorMessage.includes('timeout')) {
      return this.createErrorResponse(
        'MCP_UNAVAILABLE',
        'Unable to connect to TMDB API service',
        errorMessage
      );
    }
    
    // Check for validation errors - be more comprehensive
    if (errorMessage.includes('Invalid') || errorMessage.includes('must be') || 
        errorMessage.includes('cannot be greater than') || errorMessage.includes('Year range invalid') ||
        errorMessage.includes('runtime') || errorMessage.includes('year')) {
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
  private async discoverCandidates(input: UserInput, genres: string[]): Promise<MovieDetails[]> {
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

    // Fetch details for each movie
    const detailsPromises = topCandidates.map(movie =>
      this.tmdbClient.getMovieDetails(movie.id)
    );

    const details = await Promise.all(detailsPromises);
    return details;
  }

  /**
   * Fetches watch providers for each candidate movie
   * @param candidates - Array of movie details
   * @returns Array of movies with platform information
   */
  private async fetchWatchProviders(candidates: MovieDetails[]): Promise<MovieWithProviders[]> {
    const moviesWithProviders: MovieWithProviders[] = [];

    // Fetch providers for each movie
    for (const movie of candidates) {
      try {
        const platforms = await getCanadianProviders(movie.id, 'CA', this.tmdbClient);
        
        // Only include movies with at least one provider
        if (platforms.length > 0) {
          moviesWithProviders.push({
            ...movie,
            platforms,
          });
        }
      } catch (error) {
        // Log error but continue with other movies
        this.logger(`Failed to fetch providers for movie ${movie.id}: ${error instanceof Error ? error.message : String(error)}`);
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
  private applyFilters(movies: MovieWithProviders[], input: UserInput): MovieWithProviders[] {
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
  private rankAndSelect(movies: MovieWithProviders[], input: UserInput): MovieWithProviders[] {
    // Build ranking input
    const rankingInput: RankingInput = {
      mood: input.mood,
      genres: input.genre ? (Array.isArray(input.genre) ? input.genre : [input.genre]) : undefined,
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
  private formatRecommendations(movies: MovieWithProviders[], input: UserInput): MovieRecommendation[] {
    return movies.map(movie => {
      // Build streaming platform information
      const streamingPlatforms: StreamingPlatform[] = movie.platforms.map(name => ({
        name,
        type: 'subscription',
        available: true,
      }));

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
   * Generates a match reason for a movie
   * @param movie - Movie to explain
   * @param input - User input
   * @returns Match reason string
   */
  private generateMatchReason(movie: MovieWithProviders, input: UserInput): string {
    const reasons: string[] = [];

    // Genre match
    const movieGenres = movie.genres?.map(g => g.name) || [];
    const userGenres = this.resolveGenres(input);
    const matchedGenres = movieGenres.filter(g => userGenres.includes(g));
    
    if (matchedGenres.length > 0) {
      reasons.push(`matches your ${input.mood ? `${input.mood} mood` : 'genre preferences'} (${matchedGenres.join(', ')})`);
    }

    // Platform availability
    if (input.platforms && input.platforms.length > 0) {
      const matchedPlatforms = movie.platforms.filter(p => input.platforms!.includes(p));
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
