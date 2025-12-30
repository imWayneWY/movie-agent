// src/__tests__/error-sanitization.test.ts
import { MovieAgent } from '../agent';
import { UserInput, ErrorResponse } from '../types';
import TmdbApiClient, {
  MovieDetails,
  MovieDetailsWithProviders,
  DiscoverMoviesResponse,
  WatchProvidersResponse,
} from '../tmdbApi';

/**
 * Mock TMDb client that simulates API errors with detailed messages
 */
class ErrorMockClient extends TmdbApiClient {
  constructor() {
    super('https://api.test.com', 'test-key', 'CA');
  }

  async discoverMovies(): Promise<DiscoverMoviesResponse> {
    throw new Error(
      'TMDb API error 401: Invalid API key: You must be granted a valid key. System: api-server-01, Request ID: abc-123-def-456'
    );
  }

  async getMovieDetails(_movieId: number): Promise<MovieDetails> {
    throw new Error(
      'TMDb API error 401: Invalid API key: You must be granted a valid key. System: api-server-01, Request ID: abc-123-def-456'
    );
  }

  async getMovieDetailsWithProviders(
    _movieId: number
  ): Promise<MovieDetailsWithProviders> {
    throw new Error(
      'TMDb API error 401: Invalid API key: You must be granted a valid key. System: api-server-01, Request ID: abc-123-def-456'
    );
  }

  async getWatchProviders(_movieId: number): Promise<WatchProvidersResponse> {
    throw new Error(
      'TMDb API error 401: Invalid API key: You must be granted a valid key. System: api-server-01, Request ID: abc-123-def-456'
    );
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
}

describe('Error Sanitization Tests', () => {
  describe('Production Mode (debug: false)', () => {
    let agent: MovieAgent;
    let mockClient: ErrorMockClient;
    let logMessages: string[];

    beforeEach(() => {
      mockClient = new ErrorMockClient();
      logMessages = [];
      // Logger to capture server-side logs
      const logger = (message: string) => logMessages.push(message);
      // Create agent with debug mode disabled (default)
      agent = new MovieAgent(
        mockClient,
        logger,
        false,
        undefined,
        undefined,
        undefined,
        false
      );
    });

    it('should NOT expose error details in response when debug is false', async () => {
      const input: UserInput = {
        mood: 'adventurous',
      };

      const response = await agent.getRecommendations(input);

      assertIsErrorResponse(response);
      expect(response.errorType).toBe('INVALID_API_KEY');
      expect(response.message).toBe('Invalid or missing TMDB API key');
      // Details should NOT be exposed to user
      expect(response.details).toBeUndefined();
    });

    it('should log error details server-side even when not exposed to user', async () => {
      const input: UserInput = {
        mood: 'adventurous',
      };

      await agent.getRecommendations(input);

      // Server-side logs should contain the error details
      const errorLog = logMessages.find(log => log.includes('Error details:'));
      expect(errorLog).toBeDefined();
      expect(errorLog).toContain('TMDb API error 401');
      expect(errorLog).toContain('System: api-server-01');
      expect(errorLog).toContain('Request ID: abc-123-def-456');
    });

    it('should sanitize all error types in production mode', async () => {
      const errors = [
        { mood: 'adventurous' },
        { mood: 'happy', platforms: ['Netflix'] },
        { genre: ['Action'] },
      ];

      for (const input of errors) {
        const response = await agent.getRecommendations(input);
        assertIsErrorResponse(response);
        // No details should be exposed
        expect(response.details).toBeUndefined();
      }
    });
  });

  describe('Debug Mode (debug: true)', () => {
    let agent: MovieAgent;
    let mockClient: ErrorMockClient;

    beforeEach(() => {
      mockClient = new ErrorMockClient();
      // Create agent with debug mode enabled
      agent = new MovieAgent(
        mockClient,
        () => {},
        false,
        undefined,
        undefined,
        undefined,
        true
      );
    });

    it('should expose error details in response when debug is true', async () => {
      const input: UserInput = {
        mood: 'adventurous',
      };

      const response = await agent.getRecommendations(input);

      assertIsErrorResponse(response);
      expect(response.errorType).toBe('INVALID_API_KEY');
      expect(response.message).toBe('Invalid or missing TMDB API key');
      // Details SHOULD be exposed in debug mode
      expect(response.details).toBeDefined();
      expect(response.details).toContain('TMDb API error 401');
      expect(response.details).toContain('System: api-server-01');
    });

    it('should include system information in debug mode', async () => {
      const input: UserInput = {
        mood: 'happy',
        platforms: ['Netflix'],
      };

      const response = await agent.getRecommendations(input);

      assertIsErrorResponse(response);
      expect(response.details).toBeDefined();
      expect(response.details).toContain('Request ID: abc-123-def-456');
    });
  });

  describe('Default Behavior', () => {
    it('should default to production mode (no details) when debug is not specified', async () => {
      const mockClient = new ErrorMockClient();
      // Create agent without specifying debug flag
      const agent = new MovieAgent(mockClient);

      const input: UserInput = {
        mood: 'adventurous',
      };

      const response = await agent.getRecommendations(input);

      assertIsErrorResponse(response);
      // Should default to safe behavior (no details)
      expect(response.details).toBeUndefined();
    });
  });

  describe('Security - Information Leakage Prevention', () => {
    it('should not leak internal system architecture in production', async () => {
      const mockClient = new ErrorMockClient();
      const agent = new MovieAgent(
        mockClient,
        () => {},
        false,
        undefined,
        undefined,
        undefined,
        false
      );

      const input: UserInput = {
        mood: 'adventurous',
      };

      const response = await agent.getRecommendations(input);

      assertIsErrorResponse(response);
      // Verify no system information is leaked
      const responseStr = JSON.stringify(response);
      expect(responseStr).not.toContain('api-server-01');
      expect(responseStr).not.toContain('Request ID');
      expect(responseStr).not.toContain('System:');
      // But should still have a user-friendly message
      expect(response.message).toBeTruthy();
      expect(response.errorType).toBeTruthy();
    });

    it('should provide generic error messages without stack traces in production', async () => {
      const mockClient = new ErrorMockClient();
      const agent = new MovieAgent(
        mockClient,
        () => {},
        false,
        undefined,
        undefined,
        undefined,
        false
      );

      const input: UserInput = {
        mood: 'scary',
      };

      const response = await agent.getRecommendations(input);

      assertIsErrorResponse(response);
      const responseStr = JSON.stringify(response);
      // Should not contain stack trace keywords
      expect(responseStr).not.toContain('at Object');
      expect(responseStr).not.toContain('at async');
      expect(responseStr).not.toContain('.ts:');
      // Should have a clear, generic message
      expect(response.message).toMatch(/Invalid or missing TMDB API key/);
    });
  });
});
