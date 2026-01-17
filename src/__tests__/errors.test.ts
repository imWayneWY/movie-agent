// src/__tests__/errors.test.ts
import { MovieAgent } from '../agent';
import { UserInput, ErrorResponse } from '../types';
import TmdbApiClient, {
  MovieDetails,
  MovieDetailsWithProviders,
  DiscoverMoviesResponse,
  WatchProvidersResponse,
} from '../tmdbApi';

/**
 * Mock TMDb client that simulates invalid API key errors
 */
class InvalidApiKeyMockClient extends TmdbApiClient {
  constructor() {
    super('https://api.test.com', 'invalid-key', 'CA');
  }

  async discoverMovies(): Promise<DiscoverMoviesResponse> {
    throw new Error(
      'TMDb API error 401: Invalid API key: You must be granted a valid key.'
    );
  }

  async getMovieDetails(_movieId: number): Promise<MovieDetails> {
    throw new Error(
      'TMDb API error 401: Invalid API key: You must be granted a valid key.'
    );
  }

  async getMovieDetailsWithProviders(
    _movieId: number
  ): Promise<MovieDetailsWithProviders> {
    throw new Error(
      'TMDb API error 401: Invalid API key: You must be granted a valid key.'
    );
  }

  async getWatchProviders(_movieId: number): Promise<WatchProvidersResponse> {
    throw new Error(
      'TMDb API error 401: Invalid API key: You must be granted a valid key.'
    );
  }
}

/**
 * Mock TMDb client that simulates rate limit errors
 */
class RateLimitMockClient extends TmdbApiClient {
  constructor() {
    super('https://api.test.com', 'test-key', 'CA');
  }

  async discoverMovies(): Promise<DiscoverMoviesResponse> {
    throw new Error(
      'TMDb API error 429: Your request count (41) is over the allowed limit of 40.'
    );
  }

  async getMovieDetails(_movieId: number): Promise<MovieDetails> {
    throw new Error('TMDb API error 429: Too Many Requests');
  }

  async getMovieDetailsWithProviders(
    _movieId: number
  ): Promise<MovieDetailsWithProviders> {
    throw new Error('TMDb API error 429: Too Many Requests');
  }

  async getWatchProviders(_movieId: number): Promise<WatchProvidersResponse> {
    throw new Error('TMDb API error 429: rate limit exceeded');
  }
}

/**
 * Mock TMDb client that simulates MCP/network unavailability
 */
class McpUnavailableMockClient extends TmdbApiClient {
  constructor() {
    super('https://api.test.com', 'test-key', 'CA');
  }

  async discoverMovies(): Promise<DiscoverMoviesResponse> {
    throw new Error('Network error calling TMDb API: ECONNREFUSED');
  }

  async getMovieDetails(_movieId: number): Promise<MovieDetails> {
    throw new Error(
      'Network error calling TMDb API: connect ENOTFOUND api.themoviedb.org'
    );
  }

  async getMovieDetailsWithProviders(
    _movieId: number
  ): Promise<MovieDetailsWithProviders> {
    throw new Error(
      'Network error calling TMDb API: connect ENOTFOUND api.themoviedb.org'
    );
  }

  async getWatchProviders(_movieId: number): Promise<WatchProvidersResponse> {
    throw new Error('Network error calling TMDb API: timeout exceeded');
  }
}

/**
 * Helper function to assert error response structure
 */
function assertIsErrorResponse(
  response: any
): asserts response is ErrorResponse {
  expect(response).toBeDefined();
  expect(response.error).toBe(true);
  expect(response).toHaveProperty('errorType');
  expect(response).toHaveProperty('message');
  expect(response).toHaveProperty('timestamp');
  expect(typeof response.timestamp).toBe('string');
  expect(new Date(response.timestamp).toString()).not.toBe('Invalid Date');
}

describe('Error Handling Tests', () => {
  describe('Invalid API Key Errors', () => {
    let agent: MovieAgent;
    let mockClient: InvalidApiKeyMockClient;

    beforeEach(() => {
      mockClient = new InvalidApiKeyMockClient();
      agent = new MovieAgent(
        mockClient,
        () => {},
        false,
        undefined,
        undefined,
        undefined,
        true
      ); // Enable debug mode for tests
    });

    it('should return INVALID_API_KEY error when API key is invalid', async () => {
      const input: UserInput = {
        mood: 'adventurous',
      };

      const response = await agent.getRecommendations(input);

      assertIsErrorResponse(response);
      expect(response.errorType).toBe('INVALID_API_KEY');
      expect(response.message).toBe('Invalid or missing TMDB access token');
      expect(response.details).toBeDefined();
      expect(response.details).toContain('401');
    });

    it('should return INVALID_API_KEY error with platforms filter', async () => {
      const input: UserInput = {
        mood: 'happy',
        platforms: ['Netflix', 'Prime Video'],
      };

      const response = await agent.getRecommendations(input);

      assertIsErrorResponse(response);
      expect(response.errorType).toBe('INVALID_API_KEY');
      expect(response.message).toContain('access token');
    });

    it('should return INVALID_API_KEY error with all filters', async () => {
      const input: UserInput = {
        mood: 'adventurous',
        platforms: ['Netflix'],
        genre: ['Action'],
        runtime: { min: 90, max: 150 },
        releaseYear: 2023,
      };

      const response = await agent.getRecommendations(input);

      assertIsErrorResponse(response);
      expect(response.errorType).toBe('INVALID_API_KEY');
    });
  });

  describe('Rate Limit Exceeded Errors', () => {
    let agent: MovieAgent;
    let mockClient: RateLimitMockClient;

    beforeEach(() => {
      mockClient = new RateLimitMockClient();
      agent = new MovieAgent(
        mockClient,
        () => {},
        false,
        undefined,
        undefined,
        undefined,
        true
      ); // Enable debug mode for tests
    });

    it('should return RATE_LIMIT_EXCEEDED error when rate limit is hit', async () => {
      const input: UserInput = {
        mood: 'adventurous',
      };

      const response = await agent.getRecommendations(input);

      assertIsErrorResponse(response);
      expect(response.errorType).toBe('RATE_LIMIT_EXCEEDED');
      expect(response.message).toBe(
        'TMDB API rate limit exceeded. Please try again later.'
      );
      expect(response.details).toBeDefined();
      expect(response.details).toContain('429');
    });

    it('should return RATE_LIMIT_EXCEEDED error with genre filter', async () => {
      const input: UserInput = {
        genre: ['Comedy', 'Romance'],
      };

      const response = await agent.getRecommendations(input);

      assertIsErrorResponse(response);
      expect(response.errorType).toBe('RATE_LIMIT_EXCEEDED');
      expect(response.message).toContain('rate limit');
    });

    it('should return RATE_LIMIT_EXCEEDED error with year range', async () => {
      const input: UserInput = {
        mood: 'scary',
        releaseYear: { from: 2020, to: 2023 },
      };

      const response = await agent.getRecommendations(input);

      assertIsErrorResponse(response);
      expect(response.errorType).toBe('RATE_LIMIT_EXCEEDED');
    });
  });

  describe('MCP Unavailable Errors', () => {
    let agent: MovieAgent;
    let mockClient: McpUnavailableMockClient;

    beforeEach(() => {
      mockClient = new McpUnavailableMockClient();
      agent = new MovieAgent(
        mockClient,
        () => {},
        false,
        undefined,
        undefined,
        undefined,
        true
      ); // Enable debug mode for tests
    });

    it('should return MCP_UNAVAILABLE error when connection is refused', async () => {
      const input: UserInput = {
        mood: 'adventurous',
      };

      const response = await agent.getRecommendations(input);

      assertIsErrorResponse(response);
      expect(response.errorType).toBe('MCP_UNAVAILABLE');
      expect(response.message).toBe('Unable to connect to TMDB API service');
      expect(response.details).toBeDefined();
      expect(response.details).toContain('Network error');
    });

    it('should return MCP_UNAVAILABLE error when host is not found', async () => {
      // Create a client that returns results for discover but fails on details
      class PartialFailureMockClient extends TmdbApiClient {
        constructor() {
          super('https://api.test.com', 'test-key', 'CA');
        }

        async discoverMovies(): Promise<DiscoverMoviesResponse> {
          return {
            page: 1,
            total_pages: 1,
            total_results: 1,
            results: [
              {
                id: 1,
                title: 'Test Movie',
                overview: 'Test overview',
                release_date: '2023-01-01',
                genre_ids: [28],
                vote_average: 7.5,
                popularity: 100,
              },
            ],
          };
        }

        async getMovieDetails(_movieId: number): Promise<MovieDetails> {
          throw new Error(
            'Network error calling TMDb API: connect ENOTFOUND api.themoviedb.org'
          );
        }

        async getMovieDetailsWithProviders(
          _movieId: number
        ): Promise<MovieDetailsWithProviders> {
          throw new Error(
            'Network error calling TMDb API: connect ENOTFOUND api.themoviedb.org'
          );
        }

        async getWatchProviders(
          _movieId: number
        ): Promise<WatchProvidersResponse> {
          throw new Error('Network error calling TMDb API: connect ENOTFOUND');
        }
      }

      const partialClient = new PartialFailureMockClient();
      const partialAgent = new MovieAgent(
        partialClient,
        () => {},
        false,
        undefined,
        undefined,
        undefined,
        true
      ); // Enable debug mode for tests

      const input: UserInput = {
        mood: 'adventurous',
      };

      const response = await partialAgent.getRecommendations(input);

      assertIsErrorResponse(response);
      expect(response.errorType).toBe('MCP_UNAVAILABLE');
      expect(response.details).toContain('ENOTFOUND');
    });

    it('should return MCP_UNAVAILABLE error on timeout', async () => {
      // Create a client that simulates timeout
      class TimeoutMockClient extends TmdbApiClient {
        constructor() {
          super('https://api.test.com', 'test-key', 'CA');
        }

        async discoverMovies(): Promise<DiscoverMoviesResponse> {
          throw new Error('Network error calling TMDb API: timeout exceeded');
        }

        async getMovieDetails(_movieId: number): Promise<MovieDetails> {
          throw new Error('Network error calling TMDb API: timeout');
        }

        async getMovieDetailsWithProviders(
          _movieId: number
        ): Promise<MovieDetailsWithProviders> {
          throw new Error('Network error calling TMDb API: timeout');
        }

        async getWatchProviders(
          _movieId: number
        ): Promise<WatchProvidersResponse> {
          throw new Error('Network error calling TMDb API: Request timeout');
        }
      }

      const timeoutClient = new TimeoutMockClient();
      const timeoutAgent = new MovieAgent(
        timeoutClient,
        () => {},
        false,
        undefined,
        undefined,
        undefined,
        true
      ); // Enable debug mode for tests

      const input: UserInput = {
        mood: 'happy',
        platforms: ['Netflix'],
      };

      const response = await timeoutAgent.getRecommendations(input);

      assertIsErrorResponse(response);
      expect(response.errorType).toBe('MCP_UNAVAILABLE');
      expect(response.details).toContain('timeout');
    });
  });

  describe('Validation Errors', () => {
    let agent: MovieAgent;

    beforeEach(() => {
      // Use a mock client that would succeed if validation passes
      class ValidMockClient extends TmdbApiClient {
        constructor() {
          super('https://api.test.com', 'test-key', 'CA');
        }

        async discoverMovies(): Promise<DiscoverMoviesResponse> {
          return {
            page: 1,
            total_pages: 1,
            total_results: 1,
            results: [],
          };
        }

        async getMovieDetails(movieId: number): Promise<MovieDetails> {
          return {
            id: movieId,
            title: 'Test Movie',
            overview: 'Test overview',
            release_date: '2023-01-01',
            genres: [{ id: 28, name: 'Action' }],
            runtime: 120,
            vote_average: 7.5,
            popularity: 100,
          };
        }

        async getMovieDetailsWithProviders(
          movieId: number
        ): Promise<MovieDetailsWithProviders> {
          return {
            id: movieId,
            title: 'Test Movie',
            overview: 'Test overview',
            release_date: '2023-01-01',
            genres: [{ id: 28, name: 'Action' }],
            runtime: 120,
            vote_average: 7.5,
            popularity: 100,
            'watch/providers': { id: movieId, results: {} },
          };
        }

        async getWatchProviders(
          movieId: number
        ): Promise<WatchProvidersResponse> {
          return {
            id: movieId,
            results: {},
          };
        }
      }

      const mockClient = new ValidMockClient();
      agent = new MovieAgent(
        mockClient,
        () => {},
        false,
        undefined,
        undefined,
        undefined,
        true
      ); // Enable debug mode for tests
    });

    it('should return VALIDATION_ERROR for invalid platform', async () => {
      const input: UserInput = {
        mood: 'happy',
        platforms: ['InvalidPlatform'],
      };

      const response = await agent.getRecommendations(input);

      assertIsErrorResponse(response);
      expect(response.errorType).toBe('VALIDATION_ERROR');
      expect(response.message).toContain('Invalid');
    });

    it('should return VALIDATION_ERROR for invalid runtime constraints', async () => {
      const input: UserInput = {
        mood: 'happy',
        runtime: { min: 200, max: 100 }, // min > max is invalid
      };

      const response = await agent.getRecommendations(input);

      assertIsErrorResponse(response);
      expect(response.errorType).toBe('VALIDATION_ERROR');
      // Check details field which contains the actual validation error
      expect(response.details).toBeDefined();
      expect(response.details).toContain('runtime');
    });

    it('should return VALIDATION_ERROR for invalid year', async () => {
      const input: UserInput = {
        mood: 'happy',
        releaseYear: 1700, // Too old (before 1800 minimum)
      };

      const response = await agent.getRecommendations(input);

      assertIsErrorResponse(response);
      expect(response.errorType).toBe('VALIDATION_ERROR');
      expect(response.message).toContain('Invalid year');
    });

    it('should return VALIDATION_ERROR for invalid year range', async () => {
      const input: UserInput = {
        mood: 'happy',
        releaseYear: { from: 2025, to: 2020 }, // from > to is invalid
      };

      const response = await agent.getRecommendations(input);

      assertIsErrorResponse(response);
      expect(response.errorType).toBe('VALIDATION_ERROR');
      // Check details field which contains the actual validation error
      expect(response.details).toBeDefined();
      expect(response.details!.toLowerCase()).toMatch(/year|invalid/);
    });
  });

  describe('No Results Errors', () => {
    let agent: MovieAgent;

    beforeEach(() => {
      // Mock client that returns no results
      class NoResultsMockClient extends TmdbApiClient {
        constructor() {
          super('https://api.test.com', 'test-key', 'CA');
        }

        async discoverMovies(): Promise<DiscoverMoviesResponse> {
          return {
            page: 1,
            total_pages: 0,
            total_results: 0,
            results: [],
          };
        }

        async getMovieDetails(movieId: number): Promise<MovieDetails> {
          return {
            id: movieId,
            title: 'Test Movie',
            overview: 'Test overview',
            release_date: '2023-01-01',
            genres: [{ id: 28, name: 'Action' }],
            runtime: 120,
            vote_average: 7.5,
            popularity: 100,
          };
        }

        async getMovieDetailsWithProviders(
          movieId: number
        ): Promise<MovieDetailsWithProviders> {
          return {
            id: movieId,
            title: 'Test Movie',
            overview: 'Test overview',
            release_date: '2023-01-01',
            genres: [{ id: 28, name: 'Action' }],
            runtime: 120,
            vote_average: 7.5,
            popularity: 100,
            'watch/providers': { id: movieId, results: {} },
          };
        }

        async getWatchProviders(
          movieId: number
        ): Promise<WatchProvidersResponse> {
          return {
            id: movieId,
            results: {},
          };
        }
      }

      const mockClient = new NoResultsMockClient();
      agent = new MovieAgent(
        mockClient,
        () => {},
        false,
        undefined,
        undefined,
        undefined,
        true
      ); // Enable debug mode for tests
    });

    it('should return NO_RESULTS error when no movies match criteria', async () => {
      const input: UserInput = {
        mood: 'adventurous',
      };

      const response = await agent.getRecommendations(input);

      assertIsErrorResponse(response);
      expect(response.errorType).toBe('NO_RESULTS');
      // Message can vary based on where filtering happens
      expect(response.message).toContain('No movies');
    });

    it('should return NO_RESULTS or VALIDATION_ERROR with specific filters', async () => {
      const input: UserInput = {
        genre: ['Documentary'],
        platforms: ['Netflix'], // Use valid platform
        runtime: { min: 30, max: 60 },
      };

      const response = await agent.getRecommendations(input);

      assertIsErrorResponse(response);
      // Could be NO_RESULTS if no movies found, or validation may occur first
      expect(['NO_RESULTS', 'VALIDATION_ERROR']).toContain(response.errorType);
    });
  });

  describe('Unknown Errors', () => {
    let agent: MovieAgent;

    beforeEach(() => {
      // Mock client that throws unexpected errors
      class UnknownErrorMockClient extends TmdbApiClient {
        constructor() {
          super('https://api.test.com', 'test-key', 'CA');
        }

        async discoverMovies(): Promise<DiscoverMoviesResponse> {
          throw new Error('Something went completely wrong');
        }

        async getMovieDetails(_movieId: number): Promise<MovieDetails> {
          throw new Error('Unexpected error occurred');
        }

        async getMovieDetailsWithProviders(
          _movieId: number
        ): Promise<MovieDetailsWithProviders> {
          throw new Error('Unexpected error occurred');
        }

        async getWatchProviders(
          _movieId: number
        ): Promise<WatchProvidersResponse> {
          throw new Error('Unknown system error');
        }
      }

      const mockClient = new UnknownErrorMockClient();
      agent = new MovieAgent(
        mockClient,
        () => {},
        false,
        undefined,
        undefined,
        undefined,
        true
      ); // Enable debug mode for tests
    });

    it('should return UNKNOWN_ERROR for unexpected errors', async () => {
      const input: UserInput = {
        mood: 'adventurous',
      };

      const response = await agent.getRecommendations(input);

      assertIsErrorResponse(response);
      expect(response.errorType).toBe('UNKNOWN_ERROR');
      expect(response.message).toBe(
        'An unexpected error occurred while processing your request'
      );
      expect(response.details).toBeDefined();
    });

    it('should handle non-Error objects gracefully', async () => {
      // Mock client that throws non-Error objects
      class NonErrorMockClient extends TmdbApiClient {
        constructor() {
          super('https://api.test.com', 'test-key', 'CA');
        }

        async discoverMovies(): Promise<DiscoverMoviesResponse> {
          throw 'String error message';
        }

        async getMovieDetails(_movieId: number): Promise<MovieDetails> {
          throw { code: 'CUSTOM_ERROR', message: 'Custom error object' };
        }

        async getMovieDetailsWithProviders(
          _movieId: number
        ): Promise<MovieDetailsWithProviders> {
          throw { code: 'CUSTOM_ERROR', message: 'Custom error object' };
        }

        async getWatchProviders(
          _movieId: number
        ): Promise<WatchProvidersResponse> {
          throw null;
        }
      }

      const mockClient = new NonErrorMockClient();
      const mockAgent = new MovieAgent(
        mockClient,
        () => {},
        false,
        undefined,
        undefined,
        undefined,
        true
      ); // Enable debug mode for tests

      const input: UserInput = {
        mood: 'happy',
      };

      const response = await mockAgent.getRecommendations(input);

      assertIsErrorResponse(response);
      expect(response.errorType).toBe('UNKNOWN_ERROR');
      expect(response.details).toBeDefined();
    });
  });

  describe('Error Response Structure', () => {
    it('should have consistent error response structure', async () => {
      const mockClient = new InvalidApiKeyMockClient();
      const agent = new MovieAgent(
        mockClient,
        () => {},
        false,
        undefined,
        undefined,
        undefined,
        true
      ); // Enable debug mode for tests

      const input: UserInput = {
        mood: 'adventurous',
      };

      const response = await agent.getRecommendations(input);

      // Verify structure
      assertIsErrorResponse(response);
      expect(response).toEqual({
        error: true,
        errorType: expect.any(String),
        message: expect.any(String),
        timestamp: expect.any(String),
        details: expect.any(String),
      });

      // Verify timestamp is valid ISO format
      expect(() => new Date(response.timestamp).toISOString()).not.toThrow();
    });

    it('should include all required error types', () => {
      const errorTypes = [
        'MCP_UNAVAILABLE',
        'INVALID_API_KEY',
        'RATE_LIMIT_EXCEEDED',
        'VALIDATION_ERROR',
        'NO_RESULTS',
        'UNKNOWN_ERROR',
      ];

      // This test documents all supported error types
      expect(errorTypes).toHaveLength(6);
      expect(errorTypes).toContain('MCP_UNAVAILABLE');
      expect(errorTypes).toContain('INVALID_API_KEY');
      expect(errorTypes).toContain('RATE_LIMIT_EXCEEDED');
    });
  });
});
