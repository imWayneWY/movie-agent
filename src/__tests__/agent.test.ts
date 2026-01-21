// src/__tests__/agent.test.ts
import { MovieAgent } from '../agent';
import { UserInput, AgentResponse, ErrorResponse } from '../types';
import TmdbApiClient, {
  MovieDetails,
  MovieDetailsWithProviders,
  DiscoverMoviesResponse,
  WatchProvidersResponse,
} from '../tmdbApi';

// Type guard to check if response is a successful AgentResponse
function isAgentResponse(
  response: AgentResponse | ErrorResponse
): response is AgentResponse {
  return !('error' in response);
}

// Mock TMDb API client
class MockTmdbClient extends TmdbApiClient {
  constructor() {
    super('https://api.test.com', 'test-key', 'CA');
  }

  async discoverMovies(): Promise<DiscoverMoviesResponse> {
    return {
      page: 1,
      total_pages: 1,
      total_results: 5,
      results: [
        {
          id: 1,
          title: 'The Grand Adventure',
          overview: 'An epic journey through unknown lands',
          release_date: '2023-05-15',
          genre_ids: [28, 12],
          vote_average: 8.5,
          popularity: 120.5,
        },
        {
          id: 2,
          title: 'Comedy Night',
          overview: 'A hilarious comedy about everyday life',
          release_date: '2022-08-20',
          genre_ids: [35],
          vote_average: 7.8,
          popularity: 95.3,
        },
        {
          id: 3,
          title: 'Mystery Manor',
          overview: 'A thrilling mystery set in an old mansion',
          release_date: '2023-10-31',
          genre_ids: [9648, 53],
          vote_average: 8.2,
          popularity: 110.7,
        },
        {
          id: 4,
          title: 'Romantic Getaway',
          overview: 'A heartwarming romance set in Paris',
          release_date: '2023-02-14',
          genre_ids: [10749, 35],
          vote_average: 7.5,
          popularity: 88.2,
        },
        {
          id: 5,
          title: 'Action Hero',
          overview: 'Non-stop action and explosive thrills',
          release_date: '2023-07-04',
          genre_ids: [28, 53],
          vote_average: 8.0,
          popularity: 150.8,
        },
      ],
    };
  }

  async getMovieDetails(movieId: number): Promise<MovieDetails> {
    const mockDetails: Record<number, MovieDetails> = {
      1: {
        id: 1,
        title: 'The Grand Adventure',
        overview:
          'An epic journey through unknown lands filled with danger and excitement. Our hero must overcome incredible odds to save the world from an ancient evil that threatens to destroy everything.',
        release_date: '2023-05-15',
        genres: [
          { id: 28, name: 'Action' },
          { id: 12, name: 'Adventure' },
        ],
        runtime: 142,
        vote_average: 8.5,
        popularity: 120.5,
      },
      2: {
        id: 2,
        title: 'Comedy Night',
        overview:
          'A hilarious comedy about everyday life that will have you laughing from start to finish. Follow the misadventures of a group of friends as they navigate the ups and downs of modern living with humor and heart.',
        release_date: '2022-08-20',
        genres: [{ id: 35, name: 'Comedy' }],
        runtime: 98,
        vote_average: 7.8,
        popularity: 95.3,
      },
      3: {
        id: 3,
        title: 'Mystery Manor',
        overview:
          'A thrilling mystery set in an old mansion where nothing is as it seems. A detective must unravel a web of secrets and lies to solve a decades-old crime before time runs out.',
        release_date: '2023-10-31',
        genres: [
          { id: 9648, name: 'Mystery' },
          { id: 53, name: 'Thriller' },
        ],
        runtime: 118,
        vote_average: 8.2,
        popularity: 110.7,
      },
      4: {
        id: 4,
        title: 'Romantic Getaway',
        overview:
          'A heartwarming romance set in Paris that will make you believe in love again. Two strangers meet by chance and discover that fate has brought them together for a reason in the city of lights.',
        release_date: '2023-02-14',
        genres: [
          { id: 10749, name: 'Romance' },
          { id: 35, name: 'Comedy' },
        ],
        runtime: 105,
        vote_average: 7.5,
        popularity: 88.2,
      },
      5: {
        id: 5,
        title: 'Action Hero',
        overview:
          'Non-stop action and explosive thrills as our hero fights against impossible odds. With incredible stunts and heart-pounding sequences, this movie delivers edge-of-your-seat entertainment from beginning to end.',
        release_date: '2023-07-04',
        genres: [
          { id: 28, name: 'Action' },
          { id: 53, name: 'Thriller' },
        ],
        runtime: 128,
        vote_average: 8.0,
        popularity: 150.8,
      },
    };

    const details = mockDetails[movieId];
    if (!details) {
      throw new Error(`Movie ${movieId} not found`);
    }

    return details;
  }

  async getMovieDetailsWithProviders(
    movieId: number
  ): Promise<MovieDetailsWithProviders> {
    const details = await this.getMovieDetails(movieId);
    const providers = await this.getWatchProviders(movieId);
    return {
      ...details,
      'watch/providers': providers,
    };
  }

  async getWatchProviders(movieId: number): Promise<WatchProvidersResponse> {
    // Return different providers for different movies
    const providers: Record<number, WatchProvidersResponse> = {
      1: {
        id: 1,
        results: {
          CA: {
            link: 'https://www.themoviedb.org/movie/1/watch',
            flatrate: [
              { provider_id: 8, provider_name: 'Netflix' },
              { provider_id: 9, provider_name: 'Amazon Prime Video' },
            ],
          },
        },
      },
      2: {
        id: 2,
        results: {
          CA: {
            link: 'https://www.themoviedb.org/movie/2/watch',
            flatrate: [{ provider_id: 337, provider_name: 'Disney Plus' }],
          },
        },
      },
      3: {
        id: 3,
        results: {
          CA: {
            link: 'https://www.themoviedb.org/movie/3/watch',
            flatrate: [
              { provider_id: 8, provider_name: 'Netflix' },
              { provider_id: 230, provider_name: 'Crave' },
            ],
          },
        },
      },
      4: {
        id: 4,
        results: {
          CA: {
            link: 'https://www.themoviedb.org/movie/4/watch',
            flatrate: [{ provider_id: 9, provider_name: 'Amazon Prime Video' }],
          },
        },
      },
      5: {
        id: 5,
        results: {
          CA: {
            link: 'https://www.themoviedb.org/movie/5/watch',
            flatrate: [
              { provider_id: 8, provider_name: 'Netflix' },
              { provider_id: 350, provider_name: 'Apple TV Plus' },
            ],
          },
        },
      },
    };

    const provider = providers[movieId];
    if (!provider) {
      return { id: movieId, results: {} };
    }

    return provider;
  }
}

describe('MovieAgent', () => {
  let agent: MovieAgent;
  let mockClient: MockTmdbClient;
  let logMessages: string[];

  beforeEach(() => {
    // Set up environment
    process.env.TMDB_ACCESS_TOKEN = 'test-api-key';

    // Create mock client
    mockClient = new MockTmdbClient();

    // Create logger that captures messages
    logMessages = [];
    const logger = (message: string) => {
      logMessages.push(message);
    };

    // Create agent with mocks
    agent = new MovieAgent(mockClient, logger);
  });

  afterEach(() => {
    delete process.env.TMDB_ACCESS_TOKEN;
  });

  describe('getRecommendations', () => {
    it('should return 3-5 recommendations with all required fields', async () => {
      const input: UserInput = {
        mood: 'excited',
        platforms: ['Netflix', 'Prime Video'],
      };

      const response = await agent.getRecommendations(input);
      if (!isAgentResponse(response)) {
        fail(`Expected AgentResponse but got error`);
        return;
      }

      // Assert response structure
      expect(response).toBeDefined();

      // Type guard to ensure successful response
      if (!isAgentResponse(response)) {
        fail(
          `Expected AgentResponse but got error: ${(response as ErrorResponse).errorType} - ${(response as ErrorResponse).message}`
        );
        return; // Never reached but helps TypeScript
      }

      expect(response.recommendations).toBeDefined();
      expect(response.metadata).toBeDefined();

      // Assert 3-5 recommendations
      expect(response.recommendations.length).toBeGreaterThanOrEqual(3);
      expect(response.recommendations.length).toBeLessThanOrEqual(5);

      // Assert metadata
      expect(response.metadata.totalResults).toBe(
        response.recommendations.length
      );
      expect(response.metadata.requestTimestamp).toBeDefined();
      expect(response.metadata.inputParameters).toEqual(input);

      // Assert each recommendation has required fields
      response.recommendations.forEach(rec => {
        expect(rec.title).toBeDefined();
        expect(typeof rec.title).toBe('string');
        expect(rec.title.length).toBeGreaterThan(0);

        expect(rec.releaseYear).toBeDefined();
        expect(typeof rec.releaseYear).toBe('number');
        expect(rec.releaseYear).toBeGreaterThan(1900);

        expect(rec.runtime).toBeDefined();
        expect(typeof rec.runtime).toBe('number');
        expect(rec.runtime).toBeGreaterThan(0);

        expect(rec.description).toBeDefined();
        expect(typeof rec.description).toBe('string');
        expect(rec.description.length).toBeGreaterThan(0);

        expect(rec.genres).toBeDefined();
        expect(Array.isArray(rec.genres)).toBe(true);
        expect(rec.genres.length).toBeGreaterThan(0);

        expect(rec.streamingPlatforms).toBeDefined();
        expect(Array.isArray(rec.streamingPlatforms)).toBe(true);
        expect(rec.streamingPlatforms.length).toBeGreaterThan(0);

        // Assert streaming platform structure
        rec.streamingPlatforms.forEach(platform => {
          expect(platform.name).toBeDefined();
          expect(typeof platform.name).toBe('string');
          expect(platform.type).toBeDefined();
          expect(typeof platform.type).toBe('string');
          expect(platform.available).toBeDefined();
          expect(typeof platform.available).toBe('boolean');
        });

        expect(rec.matchReason).toBeDefined();
        expect(typeof rec.matchReason).toBe('string');
        expect(rec.matchReason.length).toBeGreaterThan(0);
      });
    });

    it('should handle mood-based recommendations', async () => {
      const input: UserInput = {
        mood: 'happy',
        platforms: ['Netflix', 'Disney+'],
      };

      const response = await agent.getRecommendations(input);
      if (!isAgentResponse(response)) {
        fail(`Expected AgentResponse but got error`);
        return;
      }

      expect(response.recommendations.length).toBeGreaterThanOrEqual(3);
      expect(response.recommendations.length).toBeLessThanOrEqual(5);

      // Verify that recommendations include comedy (happy mood maps to Comedy)
      const hasComedy = response.recommendations.some(rec =>
        rec.genres.includes('Comedy')
      );
      expect(hasComedy).toBe(true);
    });

    it('should handle explicit genre preferences', async () => {
      const input: UserInput = {
        genre: ['Action', 'Thriller'],
        platforms: ['Netflix'],
      };

      const response = await agent.getRecommendations(input);
      if (!isAgentResponse(response)) {
        fail(`Expected AgentResponse but got error`);
        return;
      }

      expect(response.recommendations.length).toBeGreaterThanOrEqual(3);
      expect(response.recommendations.length).toBeLessThanOrEqual(5);

      // Verify that recommendations include Action or Thriller
      response.recommendations.forEach(rec => {
        const hasTargetGenre = rec.genres.some(g =>
          ['Action', 'Thriller'].includes(g)
        );
        expect(hasTargetGenre).toBe(true);
      });
    });

    it('should filter by platform availability', async () => {
      const input: UserInput = {
        mood: 'excited',
        platforms: ['Netflix'],
      };

      const response = await agent.getRecommendations(input);
      if (!isAgentResponse(response)) {
        fail(`Expected AgentResponse but got error`);
        return;
      }

      expect(response.recommendations.length).toBeGreaterThanOrEqual(3);

      // All recommendations should be available on Netflix
      response.recommendations.forEach(rec => {
        const hasNetflix = rec.streamingPlatforms.some(
          p => p.name === 'Netflix'
        );
        expect(hasNetflix).toBe(true);
      });
    });

    it('should filter by runtime constraints', async () => {
      const input: UserInput = {
        mood: 'relaxed',
        platforms: ['Netflix', 'Prime Video', 'Disney+'],
        runtime: { min: 90, max: 120 },
      };

      const response = await agent.getRecommendations(input);
      if (!isAgentResponse(response)) {
        fail(`Expected AgentResponse but got error`);
        return;
      }

      expect(response.recommendations.length).toBeGreaterThanOrEqual(3);

      // All recommendations should be within runtime constraints
      response.recommendations.forEach(rec => {
        expect(rec.runtime).toBeGreaterThanOrEqual(90);
        expect(rec.runtime).toBeLessThanOrEqual(120);
      });
    });

    it('should filter by release year', async () => {
      const input: UserInput = {
        mood: 'excited',
        platforms: ['Netflix', 'Prime Video'],
        releaseYear: 2023,
      };

      const response = await agent.getRecommendations(input);
      if (!isAgentResponse(response)) {
        fail(`Expected AgentResponse but got error`);
        return;
      }

      expect(response.recommendations.length).toBeGreaterThanOrEqual(3);

      // All recommendations should be from 2023
      response.recommendations.forEach(rec => {
        expect(rec.releaseYear).toBe(2023);
      });
    });

    it('should filter by release year range', async () => {
      const input: UserInput = {
        mood: 'excited',
        platforms: ['Netflix', 'Prime Video', 'Disney+'],
        releaseYear: { from: 2022, to: 2023 },
      };

      const response = await agent.getRecommendations(input);
      if (!isAgentResponse(response)) {
        fail(`Expected AgentResponse but got error`);
        return;
      }

      expect(response.recommendations.length).toBeGreaterThanOrEqual(3);

      // All recommendations should be from 2022-2023
      response.recommendations.forEach(rec => {
        expect(rec.releaseYear).toBeGreaterThanOrEqual(2022);
        expect(rec.releaseYear).toBeLessThanOrEqual(2023);
      });
    });

    it('should include match reasons in recommendations', async () => {
      const input: UserInput = {
        mood: 'excited',
        platforms: ['Netflix'],
      };

      const response = await agent.getRecommendations(input);
      if (!isAgentResponse(response)) {
        fail(`Expected AgentResponse but got error`);
        return;
      }

      response.recommendations.forEach(rec => {
        expect(rec.matchReason).toBeTruthy();
        expect(rec.matchReason.length).toBeGreaterThan(0);

        // Match reason should reference either mood or genres
        const hasRelevantReason =
          rec.matchReason.includes('excited') ||
          rec.matchReason.includes('Action') ||
          rec.matchReason.includes('Thriller') ||
          rec.matchReason.includes('Adventure') ||
          rec.matchReason.includes('available') ||
          rec.matchReason.includes('rated');

        expect(hasRelevantReason).toBe(true);
      });
    });

    it('should log pipeline steps', async () => {
      const input: UserInput = {
        mood: 'happy',
        platforms: ['Netflix'],
      };

      await agent.getRecommendations(input);

      // Verify that key pipeline steps were logged
      expect(logMessages).toContain('Starting recommendation pipeline');
      expect(logMessages).toContain('Step 1: Validating input');
      expect(logMessages).toContain('Step 2: Resolving genres');
      expect(logMessages).toContain(
        'Step 3: Discovering candidate movies with providers'
      );
      expect(logMessages).toContain('Step 4: Extracting watch providers');
      expect(logMessages).toContain('Step 5: Applying filters');
      expect(logMessages).toContain('Step 6: Ranking and selecting top movies');
      expect(logMessages).toContain('Step 7: Formatting output');
      expect(logMessages).toContain('Pipeline completed successfully');
    });

    it('should return error for invalid platforms', async () => {
      const input: UserInput = {
        mood: 'happy',
        platforms: ['InvalidPlatform'],
      };

      const response = await agent.getRecommendations(input);

      // Should return ErrorResponse instead of throwing
      if (isAgentResponse(response)) {
        fail('Expected ErrorResponse but got AgentResponse');
      }

      expect(response.errorType).toBe('VALIDATION_ERROR');
      expect(response.message).toContain('Invalid platform');
    });

    it('should return error for invalid runtime constraints', async () => {
      const input: UserInput = {
        mood: 'happy',
        platforms: ['Netflix'],
        runtime: { min: 120, max: 90 },
      };

      const response = await agent.getRecommendations(input);

      // Should return ErrorResponse instead of throwing
      if (isAgentResponse(response)) {
        fail('Expected ErrorResponse but got AgentResponse');
      }

      expect(response.errorType).toBe('VALIDATION_ERROR');
      expect(response.message).toContain('runtime');
    });

    it('should return error for invalid year', async () => {
      const input: UserInput = {
        mood: 'happy',
        platforms: ['Netflix'],
        releaseYear: 3000,
      };

      const response = await agent.getRecommendations(input);

      // Should return ErrorResponse instead of throwing
      if (isAgentResponse(response)) {
        fail('Expected ErrorResponse but got AgentResponse');
      }

      expect(response.errorType).toBe('VALIDATION_ERROR');
      expect(response.message).toContain('Invalid year');
    });

    it('should return error when no movies match filters', async () => {
      const input: UserInput = {
        mood: 'happy',
        platforms: ['Netflix'],
        runtime: { min: 300, max: 400 }, // No movies have this runtime
      };

      const response = await agent.getRecommendations(input);

      // Should return ErrorResponse instead of throwing
      if (isAgentResponse(response)) {
        fail('Expected ErrorResponse but got AgentResponse');
      }

      expect(response.errorType).toBe('NO_RESULTS');
      expect(response.message).toContain('No movies');
    });

    it('should handle multiple genre preferences', async () => {
      const input: UserInput = {
        genre: ['Action', 'Comedy'],
        platforms: ['Netflix', 'Prime Video', 'Disney+'],
      };

      const response = await agent.getRecommendations(input);
      if (!isAgentResponse(response)) {
        fail(`Expected AgentResponse but got error`);
        return;
      }

      expect(response.recommendations.length).toBeGreaterThanOrEqual(3);
      expect(response.recommendations.length).toBeLessThanOrEqual(5);

      // At least one recommendation should have one of the target genres
      const hasTargetGenre = response.recommendations.some(rec =>
        rec.genres.some(g => ['Action', 'Comedy'].includes(g))
      );
      expect(hasTargetGenre).toBe(true);
    });

    it('should return deterministic results with same input', async () => {
      const input: UserInput = {
        mood: 'excited',
        platforms: ['Netflix', 'Prime Video'],
      };

      const response1 = await agent.getRecommendations(input);
      if (!isAgentResponse(response1))
        fail(`Expected AgentResponse but got error: ${response1.errorType}`);
      const response2 = await agent.getRecommendations(input);
      if (!isAgentResponse(response2))
        fail(`Expected AgentResponse but got error: ${response2.errorType}`);

      // Results should be identical
      expect(response1.recommendations.length).toBe(
        response2.recommendations.length
      );

      response1.recommendations.forEach((rec1, index) => {
        const rec2 = response2.recommendations[index];
        expect(rec1.title).toBe(rec2.title);
        expect(rec1.releaseYear).toBe(rec2.releaseYear);
        expect(rec1.runtime).toBe(rec2.runtime);
      });
    });
  });

  describe('invoke', () => {
    it('should return formatted string output without LLM service', async () => {
      // Create agent with LLM explicitly disabled to test fallback format
      const agentNoLLM = new MovieAgent(
        mockClient,
        msg => logMessages.push(msg),
        false // disable LLM
      );

      const input: UserInput = {
        mood: 'excited',
        platforms: ['Netflix'],
      };

      const result = await agentNoLLM.invoke(input);

      expect(typeof result).toBe('string');
      expect(result).toContain('🎬 Movie Recommendations');
      expect(result).toContain('The Grand Adventure');
    });

    it('should return error response when validation fails', async () => {
      const input: UserInput = {
        platforms: ['InvalidPlatform'],
      };

      const result = await agent.invoke(input);

      if (typeof result === 'string') {
        fail('Expected error response');
      }

      expect(result.error).toBe(true);
      expect(result.errorType).toBe('VALIDATION_ERROR');
    });
  });

  describe('stream', () => {
    it('should stream formatted output without LLM service', async () => {
      // Create agent with LLM explicitly disabled to test fallback format
      const agentNoLLM = new MovieAgent(
        mockClient,
        msg => logMessages.push(msg),
        false // disable LLM
      );

      const input: UserInput = {
        mood: 'excited',
        platforms: ['Netflix'],
      };

      const chunks: string[] = [];
      const onChunk = jest.fn((chunk: string) => chunks.push(chunk));

      const result = await agentNoLLM.stream(input, onChunk);

      expect(result).toBeUndefined();
      expect(onChunk).toHaveBeenCalled();
      expect(chunks.length).toBeGreaterThan(0);
      expect(chunks.join('')).toContain('🎬 Movie Recommendations');
      expect(chunks.join('')).toContain('The Grand Adventure');
    });

    it('should return error response when validation fails', async () => {
      const input: UserInput = {
        platforms: ['InvalidPlatform'],
      };

      const chunks: string[] = [];
      const onChunk = jest.fn((chunk: string) => chunks.push(chunk));

      const result = await agent.stream(input, onChunk);

      if (result === undefined) {
        fail('Expected error response');
      }

      expect(result.error).toBe(true);
      expect(result.errorType).toBe('VALIDATION_ERROR');
      expect(onChunk).not.toHaveBeenCalled();
    });
  });

  describe('fallbackFormat', () => {
    it('should format complete response with all fields', async () => {
      // Create agent with LLM explicitly disabled to test fallback format
      const agentNoLLM = new MovieAgent(
        mockClient,
        msg => logMessages.push(msg),
        false // disable LLM
      );

      const input: UserInput = {
        mood: 'excited',
        platforms: ['Netflix'],
      };

      const result = await agentNoLLM.invoke(input);

      expect(typeof result).toBe('string');
      expect(result).toContain('🎬 Movie Recommendations');
      expect(result).toContain('1. **');
      expect(result).toContain('Genres:');
      expect(result).toContain('📺 Available on:');
      expect(result).toContain('✨ Why:');
    });

    it('should handle movies without streaming platforms', async () => {
      // Create a mock client that returns movies with no platforms
      class NoPlatformsMockClient extends MockTmdbClient {
        async getWatchProviders(): Promise<WatchProvidersResponse> {
          return {
            id: 1,
            results: {}, // No providers
          };
        }

        async getMovieDetailsWithProviders(
          movieId: number
        ): Promise<MovieDetailsWithProviders> {
          const details = await this.getMovieDetails(movieId);
          return {
            ...details,
            'watch/providers': { id: movieId, results: {} }, // No providers
          };
        }
      }

      const noPlatformsAgent = new MovieAgent(new NoPlatformsMockClient());
      const result = await noPlatformsAgent.invoke({ mood: 'happy' });

      // When no movies have streaming platforms, the agent returns NO_RESULTS error
      expect(typeof result).toBe('object');
      expect((result as ErrorResponse).errorType).toBe('NO_RESULTS');
    });

    it('should format multiple recommendations', async () => {
      // Create agent with LLM explicitly disabled to test fallback format
      const agentNoLLM = new MovieAgent(
        mockClient,
        msg => logMessages.push(msg),
        false // disable LLM
      );

      const input: UserInput = {
        mood: 'excited',
      };

      const result = await agentNoLLM.invoke(input);

      expect(typeof result).toBe('string');
      expect(result).toMatch(/1\. \*\*/);
      expect(result).toMatch(/2\. \*\*/);
      expect(result).toMatch(/3\. \*\*/);
    });
  });

  describe('generateMatchReason', () => {
    it('should generate match reason for genre matches', async () => {
      const input: UserInput = {
        mood: 'excited',
      };

      const response = await agent.getRecommendations(input);
      if (!isAgentResponse(response))
        fail(`Expected AgentResponse but got error: ${response.errorType}`);

      expect(response.recommendations[0].matchReason).toBeTruthy();
      expect(response.recommendations[0].matchReason.length).toBeGreaterThan(0);
    });

    it('should include platform availability in match reason', async () => {
      const input: UserInput = {
        mood: 'excited',
        platforms: ['Netflix'],
      };

      const response = await agent.getRecommendations(input);
      if (!isAgentResponse(response))
        fail(`Expected AgentResponse but got error: ${response.errorType}`);

      // At least one recommendation should mention the platform
      const hasPlatformMention = response.recommendations.some(rec =>
        rec.matchReason.toLowerCase().includes('netflix')
      );
      expect(hasPlatformMention).toBe(true);
    });

    it('should mention popularity for highly rated movies', async () => {
      const input: UserInput = {
        mood: 'excited',
      };

      const response = await agent.getRecommendations(input);
      if (!isAgentResponse(response))
        fail(`Expected AgentResponse but got error: ${response.errorType}`);

      // Some recommendations should mention being highly rated
      const hasRatingMention = response.recommendations.some(rec =>
        rec.matchReason.toLowerCase().includes('rated')
      );
      expect(hasRatingMention).toBe(true);
    });
  });
});
