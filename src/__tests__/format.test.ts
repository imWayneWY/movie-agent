import { describe, it, expect } from '@jest/globals';
import {
  buildDescription,
  toRecommendation,
  formatResponse,
  buildPosterUrl,
  TMDB_IMAGE_BASE_URL,
} from '../format';
import { MovieRecommendation, StreamingPlatform } from '../types';

describe('format', () => {
  describe('buildDescription', () => {
    it('should return a description when overview is within word limit', () => {
      const shortOverview =
        'A short movie description with less than fifty words.';
      const result = buildDescription(shortOverview);
      expect(result).toBe(shortOverview);
    });

    it('should truncate long descriptions to max 100 words', () => {
      const longOverview = Array(150).fill('word').join(' ') + '.';
      const result = buildDescription(longOverview);
      const wordCount = result.split(/\s+/).length;
      expect(wordCount).toBeLessThanOrEqual(100);
    });

    it('should return at least 50 words when truncating', () => {
      // Create a 120-word overview with sentence breaks
      const overview =
        Array(60).fill('word').join(' ') +
        '. ' +
        Array(60).fill('more').join(' ') +
        '.';
      const result = buildDescription(overview);
      const wordCount = result.split(/\s+/).length;
      expect(wordCount).toBeGreaterThanOrEqual(50);
    });

    it('should handle empty overview', () => {
      const result = buildDescription('');
      expect(result).toBe('No description available.');
    });

    it('should try to end at sentence boundaries', () => {
      const overview =
        Array(40).fill('word').join(' ') +
        '. ' +
        Array(40).fill('more').join(' ') +
        '. ' +
        Array(40).fill('extra').join(' ');
      const result = buildDescription(overview);
      // Should end with punctuation if possible
      expect(result).toMatch(/[.!?]$/);
    });
  });

  describe('buildPosterUrl', () => {
    it('should build a full poster URL with default size', () => {
      const posterPath = '/abc123.jpg';
      const result = buildPosterUrl(posterPath);
      expect(result).toBe(`${TMDB_IMAGE_BASE_URL}w500${posterPath}`);
    });

    it('should build a poster URL with custom size', () => {
      const posterPath = '/abc123.jpg';
      const result = buildPosterUrl(posterPath, 'w342');
      expect(result).toBe(`${TMDB_IMAGE_BASE_URL}w342${posterPath}`);
    });

    it('should return null for null poster_path', () => {
      const result = buildPosterUrl(null);
      expect(result).toBeNull();
    });

    it('should return null for undefined poster_path', () => {
      const result = buildPosterUrl(undefined);
      expect(result).toBeNull();
    });

    it('should return null for empty string poster_path', () => {
      const result = buildPosterUrl('');
      expect(result).toBeNull();
    });
  });

  describe('toRecommendation', () => {
    const mockMovie = {
      id: 123,
      title: 'Test Movie',
      release_date: '2023-06-15',
      runtime: 120,
      overview: 'A thrilling adventure that takes viewers on an epic journey.',
      genres: [
        { id: 1, name: 'Action' },
        { id: 2, name: 'Adventure' },
      ],
      poster_path: '/abc123.jpg',
      vote_average: 8.5,
    };

    const mockProviders: StreamingPlatform[] = [
      { name: 'Netflix', type: 'subscription', available: true },
      { name: 'Prime Video', type: 'subscription', available: true },
    ];

    const mockReason = 'Matches your adventurous mood and action preference.';

    it('should return a properly structured MovieRecommendation', () => {
      const result = toRecommendation(mockMovie, mockProviders, mockReason);

      expect(result).toHaveProperty('title');
      expect(result).toHaveProperty('releaseYear');
      expect(result).toHaveProperty('runtime');
      expect(result).toHaveProperty('description');
      expect(result).toHaveProperty('genres');
      expect(result).toHaveProperty('streamingPlatforms');
      expect(result).toHaveProperty('matchReason');
      expect(result).toHaveProperty('posterUrl');
      expect(result).toHaveProperty('rating');
    });

    it('should correctly extract release year from date', () => {
      const result = toRecommendation(mockMovie, mockProviders, mockReason);
      expect(result.releaseYear).toBe(2023);
    });

    it('should map genre objects to genre names', () => {
      const result = toRecommendation(mockMovie, mockProviders, mockReason);
      expect(result.genres).toEqual(['Action', 'Adventure']);
    });

    it('should include all required fields with correct types', () => {
      const result = toRecommendation(mockMovie, mockProviders, mockReason);

      expect(typeof result.title).toBe('string');
      expect(typeof result.releaseYear).toBe('number');
      expect(typeof result.runtime).toBe('number');
      expect(typeof result.description).toBe('string');
      expect(Array.isArray(result.genres)).toBe(true);
      expect(Array.isArray(result.streamingPlatforms)).toBe(true);
      expect(typeof result.matchReason).toBe('string');
    });

    it('should include streaming platform information', () => {
      const result = toRecommendation(mockMovie, mockProviders, mockReason);
      expect(result.streamingPlatforms).toHaveLength(2);
      expect(result.streamingPlatforms[0]).toMatchObject({
        name: 'Netflix',
        type: 'subscription',
        available: true,
      });
    });

    it('should include match reason', () => {
      const result = toRecommendation(mockMovie, mockProviders, mockReason);
      expect(result.matchReason).toBe(mockReason);
    });

    it('should include posterUrl when poster_path is provided', () => {
      const result = toRecommendation(mockMovie, mockProviders, mockReason);
      expect(result.posterUrl).toBe(
        `${TMDB_IMAGE_BASE_URL}w500${mockMovie.poster_path}`
      );
    });

    it('should return null posterUrl when poster_path is missing', () => {
      const movieWithoutPoster = { ...mockMovie, poster_path: null };
      const result = toRecommendation(
        movieWithoutPoster,
        mockProviders,
        mockReason
      );
      expect(result.posterUrl).toBeNull();
    });

    it('should include rating when vote_average is provided', () => {
      const result = toRecommendation(mockMovie, mockProviders, mockReason);
      expect(result.rating).toBe(8.5);
    });

    it('should return null rating when vote_average is missing', () => {
      const movieWithoutRating = { ...mockMovie, vote_average: undefined };
      const result = toRecommendation(
        movieWithoutRating,
        mockProviders,
        mockReason
      );
      expect(result.rating).toBeNull();
    });
  });

  describe('formatResponse', () => {
    const mockRecommendation: MovieRecommendation = {
      title: 'Test Movie',
      releaseYear: 2023,
      runtime: 120,
      description: 'A test movie description that is properly formatted.',
      genres: ['Action', 'Adventure'],
      streamingPlatforms: [
        { name: 'Netflix', type: 'subscription', available: true },
      ],
      matchReason: 'Test reason',
      posterUrl: 'https://image.tmdb.org/t/p/w500/abc123.jpg',
      rating: 8.5,
    };

    it('should accept 3 recommendations', () => {
      const recommendations = [
        mockRecommendation,
        { ...mockRecommendation, title: 'Movie 2' },
        { ...mockRecommendation, title: 'Movie 3' },
      ];

      const result = formatResponse(recommendations, {
        inputParameters: { mood: 'happy' },
      });

      expect(result.recommendations).toHaveLength(3);
      expect(result.metadata.totalResults).toBe(3);
    });

    it('should accept 5 recommendations', () => {
      const recommendations = [
        mockRecommendation,
        { ...mockRecommendation, title: 'Movie 2' },
        { ...mockRecommendation, title: 'Movie 3' },
        { ...mockRecommendation, title: 'Movie 4' },
        { ...mockRecommendation, title: 'Movie 5' },
      ];

      const result = formatResponse(recommendations, {
        inputParameters: { mood: 'happy' },
      });

      expect(result.recommendations).toHaveLength(5);
      expect(result.metadata.totalResults).toBe(5);
    });

    it('should throw error with less than 3 recommendations', () => {
      const recommendations = [mockRecommendation, mockRecommendation];

      expect(() =>
        formatResponse(recommendations, { inputParameters: {} })
      ).toThrow('Expected 3-5 recommendations, got 2');
    });

    it('should throw error with more than 5 recommendations', () => {
      const recommendations = Array(6).fill(mockRecommendation);

      expect(() =>
        formatResponse(recommendations, { inputParameters: {} })
      ).toThrow('Expected 3-5 recommendations, got 6');
    });

    it('should return properly structured AgentResponse', () => {
      const recommendations = [
        mockRecommendation,
        { ...mockRecommendation, title: 'Movie 2' },
        { ...mockRecommendation, title: 'Movie 3' },
      ];

      const result = formatResponse(recommendations, {
        inputParameters: { mood: 'happy', platforms: ['Netflix'] },
      });

      expect(result).toHaveProperty('recommendations');
      expect(result).toHaveProperty('metadata');
      expect(result.metadata).toHaveProperty('requestTimestamp');
      expect(result.metadata).toHaveProperty('totalResults');
      expect(result.metadata).toHaveProperty('inputParameters');
    });

    it('should generate ISO timestamp', () => {
      const recommendations = [
        mockRecommendation,
        mockRecommendation,
        mockRecommendation,
      ];

      const result = formatResponse(recommendations, {
        inputParameters: {},
      });

      // Check if timestamp is valid ISO format
      const timestamp = new Date(result.metadata.requestTimestamp);
      expect(timestamp.toISOString()).toBe(result.metadata.requestTimestamp);
    });

    it('should include input parameters in metadata', () => {
      const recommendations = [
        mockRecommendation,
        mockRecommendation,
        mockRecommendation,
      ];

      const inputParams = {
        mood: 'excited',
        platforms: ['Netflix', 'Prime Video'],
        genre: ['Action'],
        runtime: { max: 150 },
      };

      const result = formatResponse(recommendations, {
        inputParameters: inputParams,
      });

      expect(result.metadata.inputParameters).toEqual(inputParams);
    });

    it('should correctly count totalResults', () => {
      const recommendations = Array(4).fill(mockRecommendation);

      const result = formatResponse(recommendations, {
        inputParameters: {},
      });

      expect(result.metadata.totalResults).toBe(4);
    });
  });

  describe('integration tests', () => {
    it('should format complete response from movie to AgentResponse', () => {
      const movie = {
        id: 456,
        title: 'Integration Test Movie',
        release_date: '2022-03-20',
        runtime: 105,
        overview:
          'An exciting story about software testing that brings joy and quality assurance to development teams.',
        genres: [
          { id: 1, name: 'Comedy' },
          { id: 2, name: 'Drama' },
        ],
        vote_average: 7.8,
      };

      const providers: StreamingPlatform[] = [
        { name: 'Crave', type: 'subscription', available: true },
      ];

      const recommendation = toRecommendation(
        movie,
        providers,
        'Perfect for your relaxed mood'
      );

      const response = formatResponse(
        [recommendation, recommendation, recommendation],
        {
          inputParameters: { mood: 'relaxed' },
        }
      );

      expect(response.recommendations).toHaveLength(3);
      expect(response.recommendations[0].title).toBe('Integration Test Movie');
      expect(response.recommendations[0].releaseYear).toBe(2022);
      expect(response.metadata.totalResults).toBe(3);
    });
  });
});
