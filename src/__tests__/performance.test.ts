// src/__tests__/performance.test.ts
import { MovieAgent } from '../agent';
import { UserInput } from '../types';
import TmdbApiClient, {
  MovieDetails,
  DiscoverMoviesResponse,
  WatchProvidersResponse,
} from '../tmdbApi';

/**
 * Mock TMDb client with fast responses for performance testing
 */
class FastMockTmdbClient extends TmdbApiClient {
  constructor() {
    super('https://api.test.com', 'test-key', 'CA');
  }

  async discoverMovies(): Promise<DiscoverMoviesResponse> {
    // Simulate fast API response
    return Promise.resolve({
      page: 1,
      total_pages: 1,
      total_results: 10,
      results: Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        title: `Movie ${i + 1}`,
        overview: `Description for movie ${i + 1}`,
        release_date: '2023-01-15',
        genre_ids: [28, 12],
        vote_average: 7.5 + i * 0.1,
        popularity: 100 + i * 10,
      })),
    });
  }

  async getMovieDetails(movieId: number): Promise<MovieDetails> {
    // Simulate fast API response
    return Promise.resolve({
      id: movieId,
      title: `Movie ${movieId}`,
      overview: `A thrilling adventure movie with action-packed sequences and stunning visual effects that will keep you on the edge of your seat from start to finish.`,
      release_date: '2023-01-15',
      genres: [
        { id: 28, name: 'Action' },
        { id: 12, name: 'Adventure' },
      ],
      runtime: 120,
      vote_average: 8.0,
      popularity: 150,
    });
  }

  async getWatchProviders(movieId: number): Promise<WatchProvidersResponse> {
    // Simulate fast API response
    return Promise.resolve({
      id: movieId,
      results: {
        CA: {
          link: 'https://www.themoviedb.org/movie/123/watch?locale=CA',
          flatrate: [
            { provider_id: 8, provider_name: 'Netflix' },
            { provider_id: 9, provider_name: 'Amazon Prime Video' },
          ],
        },
      },
    });
  }
}

describe('Performance Tests', () => {
  let agent: MovieAgent;
  let mockClient: FastMockTmdbClient;

  beforeEach(() => {
    mockClient = new FastMockTmdbClient();
    agent = new MovieAgent(mockClient, () => {}); // Silent logger for performance tests
  });

  describe('Pipeline Execution Time', () => {
    it('should complete full pipeline in under 5000ms with fast responses', async () => {
      const input: UserInput = {
        mood: 'adventurous',
        platforms: ['Netflix', 'Prime Video'],
        runtime: { min: 90, max: 150 },
        releaseYear: 2023,
      };

      const startTime = Date.now();
      const response = await agent.getRecommendations(input);
      const endTime = Date.now();
      const executionTime = endTime - startTime;

      // Assert execution time is under 5000ms
      expect(executionTime).toBeLessThan(5000);

      // Verify successful response
      expect(response).toHaveProperty('recommendations');
      if ('error' in response) {
        fail('Expected successful response but got error');
      }
      expect(response.recommendations.length).toBeGreaterThanOrEqual(3);
      expect(response.recommendations.length).toBeLessThanOrEqual(5);
    });

    it('should complete pipeline with minimal input in under 5000ms', async () => {
      const input: UserInput = {
        mood: 'happy',
      };

      const startTime = Date.now();
      const response = await agent.getRecommendations(input);
      const endTime = Date.now();
      const executionTime = endTime - startTime;

      expect(executionTime).toBeLessThan(5000);
      expect(response).toHaveProperty('recommendations');
      if ('error' in response) {
        fail('Expected successful response but got error');
      }
    });

    it('should complete pipeline with multiple genres in under 5000ms', async () => {
      const input: UserInput = {
        genre: ['Action', 'Adventure', 'Thriller'],
        platforms: ['Netflix'],
        runtime: { min: 100, max: 180 },
      };

      const startTime = Date.now();
      const response = await agent.getRecommendations(input);
      const endTime = Date.now();
      const executionTime = endTime - startTime;

      expect(executionTime).toBeLessThan(5000);
      expect(response).toHaveProperty('recommendations');
      if ('error' in response) {
        fail('Expected successful response but got error');
      }
    });

    it('should complete pipeline with year range in under 5000ms', async () => {
      const input: UserInput = {
        mood: 'adventurous',
        releaseYear: { from: 2020, to: 2023 },
      };

      const startTime = Date.now();
      const response = await agent.getRecommendations(input);
      const endTime = Date.now();
      const executionTime = endTime - startTime;

      expect(executionTime).toBeLessThan(5000);
      expect(response).toHaveProperty('recommendations');
      if ('error' in response) {
        fail('Expected successful response but got error');
      }
    });

    it('should complete pipeline with all filters in under 5000ms', async () => {
      const input: UserInput = {
        mood: 'adventurous',
        platforms: ['Netflix', 'Prime Video', 'Disney+'],
        genre: ['Action'],
        runtime: { min: 90, max: 150 },
        releaseYear: { from: 2020, to: 2023 },
      };

      const startTime = Date.now();
      const response = await agent.getRecommendations(input);
      const endTime = Date.now();
      const executionTime = endTime - startTime;

      expect(executionTime).toBeLessThan(5000);
      expect(response).toHaveProperty('recommendations');
      if ('error' in response) {
        fail('Expected successful response but got error');
      }
      expect(response.recommendations.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Performance Benchmarks', () => {
    it('should measure average execution time across multiple runs', async () => {
      const input: UserInput = {
        mood: 'adventurous',
        platforms: ['Netflix'],
      };

      const runs = 5;
      const executionTimes: number[] = [];

      for (let i = 0; i < runs; i++) {
        const startTime = Date.now();
        await agent.getRecommendations(input);
        const endTime = Date.now();
        executionTimes.push(endTime - startTime);
      }

      const averageTime = executionTimes.reduce((a, b) => a + b, 0) / runs;
      const maxTime = Math.max(...executionTimes);

      // Log performance metrics
      console.log(`Average execution time: ${averageTime.toFixed(2)}ms`);
      console.log(`Max execution time: ${maxTime}ms`);
      console.log(`Min execution time: ${Math.min(...executionTimes)}ms`);

      // Assert all runs are under 5000ms
      expect(maxTime).toBeLessThan(5000);
      expect(averageTime).toBeLessThan(5000);
    });

    it('should handle concurrent requests efficiently', async () => {
      const inputs: UserInput[] = [
        { mood: 'adventurous' },
        { mood: 'happy' },
        { mood: 'scary' },
      ];

      const startTime = Date.now();
      const responses = await Promise.all(
        inputs.map(input => agent.getRecommendations(input))
      );
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // Total time for 3 concurrent requests should still be reasonable
      expect(totalTime).toBeLessThan(7000);
      expect(responses).toHaveLength(3);
      responses.forEach(response => {
        expect(response).toHaveProperty('recommendations');
      });
    });
  });

  describe('Resource Efficiency', () => {
    it('should complete with limited movie candidates', async () => {
      // Test with a client that returns fewer results
      class LimitedMockClient extends FastMockTmdbClient {
        async discoverMovies(): Promise<DiscoverMoviesResponse> {
          return Promise.resolve({
            page: 1,
            total_pages: 1,
            total_results: 5,
            results: Array.from({ length: 5 }, (_, i) => ({
              id: i + 1,
              title: `Movie ${i + 1}`,
              overview: `Description for movie ${i + 1}`,
              release_date: '2023-01-15',
              genre_ids: [28, 12],
              vote_average: 7.5,
              popularity: 100,
            })),
          });
        }
      }

      const limitedClient = new LimitedMockClient();
      const limitedAgent = new MovieAgent(limitedClient, () => {});

      const input: UserInput = {
        mood: 'adventurous',
        platforms: ['Netflix'],
      };

      const startTime = Date.now();
      const response = await limitedAgent.getRecommendations(input);
      const endTime = Date.now();
      const executionTime = endTime - startTime;

      expect(executionTime).toBeLessThan(5000);
      expect(response).toHaveProperty('recommendations');
      if ('error' in response) {
        fail('Expected successful response but got error');
      }
    });
  });
});
