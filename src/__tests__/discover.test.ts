import type { DiscoverInput } from '../discover';
import type { DiscoverMoviesResponse } from '../tmdbApi';

describe('buildDiscoverParams', () => {
  let buildDiscoverParams: any;

  beforeAll(async () => {
    process.env.TMDB_ACCESS_TOKEN = 'test-api-key';
    jest.resetModules();
    ({ buildDiscoverParams } = await import('../discover'));
  });

  afterAll(() => {
    delete process.env.TMDB_ACCESS_TOKEN;
  });

  describe('genre handling', () => {
    it('maps mood to genres', () => {
      const input: DiscoverInput = { mood: 'happy' };
      const params = buildDiscoverParams(input);
      // happy -> ["Comedy", "Family", "Musical"] -> IDs: 35, 10751, 10402
      expect(params.with_genres).toBe('35,10751,10402');
    });

    it('uses explicit genres over mood', () => {
      const input: DiscoverInput = {
        mood: 'happy',
        genres: ['Action', 'Drama'],
      };
      const params = buildDiscoverParams(input);
      // Action: 28, Drama: 18
      expect(params.with_genres).toBe('28,18');
    });

    it('handles single genre', () => {
      const input: DiscoverInput = { genres: ['Horror'] };
      const params = buildDiscoverParams(input);
      expect(params.with_genres).toBe('27');
    });

    it('handles multiple genres', () => {
      const input: DiscoverInput = { genres: ['Action', 'Comedy', 'Thriller'] };
      const params = buildDiscoverParams(input);
      expect(params.with_genres).toBe('28,35,53');
    });

    it('filters out unknown genres', () => {
      const input: DiscoverInput = {
        genres: ['Action', 'UnknownGenre', 'Drama'],
      };
      const params = buildDiscoverParams(input);
      expect(params.with_genres).toBe('28,18');
    });

    it('returns undefined genres when no valid genres', () => {
      const input: DiscoverInput = { genres: ['UnknownGenre', 'FakeGenre'] };
      const params = buildDiscoverParams(input);
      expect(params.with_genres).toBeUndefined();
    });

    it('returns undefined genres when mood is unknown', () => {
      const input: DiscoverInput = { mood: 'unknownmood' };
      const params = buildDiscoverParams(input);
      expect(params.with_genres).toBeUndefined();
    });

    it('handles empty genres array', () => {
      const input: DiscoverInput = { genres: [] };
      const params = buildDiscoverParams(input);
      expect(params.with_genres).toBeUndefined();
    });
  });

  describe('year handling', () => {
    it('uses specific year when provided', () => {
      const input: DiscoverInput = { year: 2020 };
      const params = buildDiscoverParams(input);
      expect(params.year).toBe(2020);
      expect(params['primary_release_date.gte']).toBeUndefined();
      expect(params['primary_release_date.lte']).toBeUndefined();
    });

    it('uses year range when no specific year', () => {
      const input: DiscoverInput = { yearMin: 2010, yearMax: 2020 };
      const params = buildDiscoverParams(input);
      expect(params.year).toBeUndefined();
      expect(params['primary_release_date.gte']).toBe('2010-01-01');
      expect(params['primary_release_date.lte']).toBe('2020-12-31');
    });

    it('handles only minimum year', () => {
      const input: DiscoverInput = { yearMin: 2015 };
      const params = buildDiscoverParams(input);
      expect(params['primary_release_date.gte']).toBe('2015-01-01');
      expect(params['primary_release_date.lte']).toBeUndefined();
    });

    it('handles only maximum year', () => {
      const input: DiscoverInput = { yearMax: 2018 };
      const params = buildDiscoverParams(input);
      expect(params['primary_release_date.gte']).toBeUndefined();
      expect(params['primary_release_date.lte']).toBe('2018-12-31');
    });

    it('specific year takes precedence over range', () => {
      const input: DiscoverInput = { year: 2022, yearMin: 2010, yearMax: 2020 };
      const params = buildDiscoverParams(input);
      expect(params.year).toBe(2022);
      expect(params['primary_release_date.gte']).toBeUndefined();
      expect(params['primary_release_date.lte']).toBeUndefined();
    });
  });

  describe('runtime handling', () => {
    it('handles minimum runtime', () => {
      const input: DiscoverInput = { runtimeMin: 90 };
      const params = buildDiscoverParams(input);
      expect(params['with_runtime.gte']).toBe(90);
    });

    it('handles maximum runtime', () => {
      const input: DiscoverInput = { runtimeMax: 120 };
      const params = buildDiscoverParams(input);
      expect(params['with_runtime.lte']).toBe(120);
    });

    it('handles both min and max runtime', () => {
      const input: DiscoverInput = { runtimeMin: 80, runtimeMax: 150 };
      const params = buildDiscoverParams(input);
      expect(params['with_runtime.gte']).toBe(80);
      expect(params['with_runtime.lte']).toBe(150);
    });

    it('handles zero runtime values', () => {
      const input: DiscoverInput = { runtimeMin: 0, runtimeMax: 0 };
      const params = buildDiscoverParams(input);
      expect(params['with_runtime.gte']).toBe(0);
      expect(params['with_runtime.lte']).toBe(0);
    });
  });

  describe('pagination and sorting', () => {
    it('includes page number', () => {
      const input: DiscoverInput = { page: 2 };
      const params = buildDiscoverParams(input);
      expect(params.page).toBe(2);
    });

    it('uses custom sort order', () => {
      const input: DiscoverInput = { sortBy: 'release_date.desc' };
      const params = buildDiscoverParams(input);
      expect(params.sort_by).toBe('release_date.desc');
    });

    it('defaults to popularity.desc', () => {
      const input: DiscoverInput = {};
      const params = buildDiscoverParams(input);
      expect(params.sort_by).toBe('popularity.desc');
    });
  });

  describe('complex queries', () => {
    it('builds complete params with all options', () => {
      const input: DiscoverInput = {
        genres: ['Action', 'Thriller'],
        yearMin: 2015,
        yearMax: 2020,
        runtimeMin: 90,
        runtimeMax: 180,
        page: 1,
        sortBy: 'vote_average.desc',
      };
      const params = buildDiscoverParams(input);
      expect(params).toEqual({
        with_genres: '28,53',
        'primary_release_date.gte': '2015-01-01',
        'primary_release_date.lte': '2020-12-31',
        'with_runtime.gte': 90,
        'with_runtime.lte': 180,
        page: 1,
        sort_by: 'vote_average.desc',
      });
    });

    it('builds params with mood and runtime constraints', () => {
      const input: DiscoverInput = {
        mood: 'excited',
        runtimeMin: 100,
        year: 2023,
      };
      const params = buildDiscoverParams(input);
      // excited -> ["Action", "Adventure", "Thriller"] -> 28, 12, 53
      expect(params.with_genres).toBe('28,12,53');
      expect(params.year).toBe(2023);
      expect(params['with_runtime.gte']).toBe(100);
      expect(params.sort_by).toBe('popularity.desc');
    });
  });

  describe('edge cases', () => {
    it('handles empty input', () => {
      const input: DiscoverInput = {};
      const params = buildDiscoverParams(input);
      expect(params).toEqual({
        sort_by: 'popularity.desc',
      });
    });

    it('handles undefined values gracefully', () => {
      const input: DiscoverInput = {
        mood: undefined,
        genres: undefined,
        year: undefined,
        runtimeMin: undefined,
        runtimeMax: undefined,
      };
      const params = buildDiscoverParams(input);
      expect(params.with_genres).toBeUndefined();
      expect(params.year).toBeUndefined();
      expect(params['with_runtime.gte']).toBeUndefined();
      expect(params['with_runtime.lte']).toBeUndefined();
    });
  });
});

describe('discoverMovies', () => {
  let discoverMovies: any;
  let TmdbApiClient: any;
  let resetCache: any;

  beforeAll(async () => {
    process.env.TMDB_ACCESS_TOKEN = 'test-api-key';
    jest.resetModules();
    ({ discoverMovies } = await import('../discover'));
    ({ default: TmdbApiClient } = await import('../tmdbApi'));
    ({ resetCache } = await import('../cache'));
  });

  beforeEach(() => {
    resetCache(); // Clear cache between tests
  });

  afterAll(() => {
    delete process.env.TMDB_ACCESS_TOKEN;
  });

  it('calls apiClient.discoverMovies with built params', async () => {
    const mockResponse: DiscoverMoviesResponse = {
      page: 1,
      results: [
        { id: 1, title: 'Test Movie' },
        { id: 2, title: 'Another Movie' },
      ],
      total_pages: 5,
      total_results: 100,
    };

    const mockApiClient = {
      discoverMovies: jest.fn().mockResolvedValue(mockResponse),
    } as any;

    const input: DiscoverInput = {
      genres: ['Action'],
      year: 2023,
    };

    const result = await discoverMovies(input, mockApiClient);

    expect(mockApiClient.discoverMovies).toHaveBeenCalledWith({
      with_genres: '28',
      year: 2023,
      sort_by: 'popularity.desc',
    });
    expect(result).toEqual(mockResponse);
  });

  it('creates default apiClient when not provided', async () => {
    const input: DiscoverInput = { mood: 'happy' };

    // This test would actually call the API, so we'll mock the constructor
    const mockDiscoverMovies = jest.fn().mockResolvedValue({
      page: 1,
      results: [],
      total_pages: 0,
      total_results: 0,
    });

    jest
      .spyOn(TmdbApiClient.prototype, 'discoverMovies')
      .mockImplementation(mockDiscoverMovies);

    await discoverMovies(input);

    expect(mockDiscoverMovies).toHaveBeenCalled();

    jest.restoreAllMocks();
  });

  it('passes through API errors', async () => {
    const mockApiClient = {
      discoverMovies: jest.fn().mockRejectedValue(new Error('API Error')),
    } as any;

    const input: DiscoverInput = { genres: ['Horror'] };

    await expect(discoverMovies(input, mockApiClient)).rejects.toThrow(
      'API Error'
    );
  });

  it('handles complex input with mood and constraints', async () => {
    const mockResponse: DiscoverMoviesResponse = {
      page: 2,
      results: [{ id: 100, title: 'Scary Movie' }],
      total_pages: 10,
      total_results: 200,
    };

    const mockApiClient = {
      discoverMovies: jest.fn().mockResolvedValue(mockResponse),
    } as any;

    const input: DiscoverInput = {
      mood: 'scared',
      runtimeMin: 80,
      runtimeMax: 120,
      yearMin: 2020,
      yearMax: 2023,
      page: 2,
      sortBy: 'vote_average.desc',
    };

    const result = await discoverMovies(input, mockApiClient);

    expect(mockApiClient.discoverMovies).toHaveBeenCalledWith({
      with_genres: '27,53,9648', // Horror, Thriller, Mystery
      'primary_release_date.gte': '2020-01-01',
      'primary_release_date.lte': '2023-12-31',
      'with_runtime.gte': 80,
      'with_runtime.lte': 120,
      page: 2,
      sort_by: 'vote_average.desc',
    });
    expect(result).toEqual(mockResponse);
  });
});
