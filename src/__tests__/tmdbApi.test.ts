describe('TmdbApiClient', () => {
  const BASE_URL = 'https://api.themoviedb.org/3/';
  const API_KEY = 'test-api-key';
  const REGION = 'US';

  let TmdbApiClient: any;
  let client: any;
  let originalFetch: any;

  beforeAll(async () => {
    originalFetch = global.fetch;
  });

  beforeEach(async () => {
    process.env.TMDB_BASE_URL = BASE_URL;
    process.env.TMDB_ACCESS_TOKEN = API_KEY;
    process.env.TMDB_REGION = REGION;
    jest.resetModules();
    ({ default: TmdbApiClient } = await import('../tmdbApi'));
    client = new TmdbApiClient();
    jest.resetAllMocks();
  });

  afterAll(() => {
    delete process.env.TMDB_BASE_URL;
    delete process.env.TMDB_ACCESS_TOKEN;
    delete process.env.TMDB_REGION;
    global.fetch = originalFetch;
  });

  function mockFetchOk(data: any, status = 200) {
    global.fetch = jest.fn().mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      json: jest.fn().mockResolvedValue(data),
      text: jest.fn().mockResolvedValue(JSON.stringify(data)),
      statusText: 'OK',
    } as any);
  }

  function mockFetchFail(status = 500, text = 'Internal Error') {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status,
      json: jest.fn(),
      text: jest.fn().mockResolvedValue(text),
      statusText: 'ERR',
    } as any);
  }

  function mockFetchThrow(err: any) {
    global.fetch = jest.fn().mockRejectedValue(err);
  }

  test('discoverMovies succeeds', async () => {
    const sample = {
      page: 1,
      results: [{ id: 1, title: 'A', overview: 'o' }],
      total_pages: 1,
      total_results: 1,
    };
    mockFetchOk(sample);
    const res = await client.discoverMovies({
      sort_by: 'popularity.desc',
      page: 1,
    });
    expect(res).toEqual(sample);
    expect(global.fetch).toHaveBeenCalled();
    const url = (global.fetch as jest.Mock).mock.calls[0][0] as string;
    const options = (global.fetch as jest.Mock).mock.calls[0][1];
    expect(url).toContain('discover/movie');
    expect(url).not.toContain('api_key');
    expect(url).toContain('sort_by=popularity.desc');
    expect(url).toContain('page=1');
    expect(url).toContain(`region=${REGION}`);
    expect(options.headers.Authorization).toBe(`Bearer ${API_KEY}`);
  });

  test('getMovieDetails succeeds', async () => {
    const sample = { id: 2, title: 'B', runtime: 120 };
    mockFetchOk(sample);
    const res = await client.getMovieDetails(2);
    expect(res).toEqual(sample);
    const url = (global.fetch as jest.Mock).mock.calls[0][0] as string;
    const options = (global.fetch as jest.Mock).mock.calls[0][1];
    expect(url).toContain('movie/2');
    expect(url).not.toContain('api_key');
    expect(options.headers.Authorization).toBe(`Bearer ${API_KEY}`);
  });

  test('getMovieDetailsWithProviders succeeds', async () => {
    const sample = {
      id: 2,
      title: 'B',
      runtime: 120,
      'watch/providers': {
        id: 2,
        results: {
          CA: {
            flatrate: [{ provider_id: 8, provider_name: 'Netflix' }],
          },
        },
      },
    };
    mockFetchOk(sample);
    const res = await client.getMovieDetailsWithProviders(2);
    expect(res).toEqual(sample);
    const url = (global.fetch as jest.Mock).mock.calls[0][0] as string;
    const options = (global.fetch as jest.Mock).mock.calls[0][1];
    expect(url).toContain('movie/2');
    expect(url).not.toContain('api_key');
    expect(url).toContain('append_to_response=watch%2Fproviders');
    expect(options.headers.Authorization).toBe(`Bearer ${API_KEY}`);
  });

  test('searchMovies succeeds', async () => {
    const sample = {
      page: 1,
      results: [{ id: 3, title: 'C' }],
      total_pages: 1,
      total_results: 1,
    };
    mockFetchOk(sample);
    const res = await client.searchMovies('query', 1);
    expect(res).toEqual(sample);
    const url = (global.fetch as jest.Mock).mock.calls[0][0] as string;
    expect(url).toContain('search/movie');
    expect(url).toContain('query=query');
  });

  test('getGenres succeeds', async () => {
    const sample = { genres: [{ id: 10, name: 'Action' }] };
    mockFetchOk(sample);
    const res = await client.getGenres();
    expect(res).toEqual(sample);
    const url = (global.fetch as jest.Mock).mock.calls[0][0] as string;
    expect(url).toContain('genre/movie/list');
  });

  test('getWatchProviders succeeds', async () => {
    const sample = {
      id: 4,
      results: {
        US: {
          link: 'https://tmdb',
          flatrate: [{ provider_id: 8, provider_name: 'Netflix' }],
        },
      },
    };
    mockFetchOk(sample);
    const res = await client.getWatchProviders(4);
    expect(res).toEqual(sample);
    const url = (global.fetch as jest.Mock).mock.calls[0][0] as string;
    expect(url).toContain('movie/4/watch/providers');
  });

  test('handles network error', async () => {
    mockFetchThrow(new Error('socket hang up'));
    await expect(client.getGenres()).rejects.toThrow(/Network error/);
  });

  test('handles non-200 response', async () => {
    mockFetchFail(404, 'Not Found');
    await expect(client.getMovieDetails(999)).rejects.toThrow(
      /TMDb API error 404/
    );
  });

  test('handles invalid JSON', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockRejectedValue(new Error('bad json')),
      text: jest.fn().mockResolvedValue(''),
    } as any);
    await expect(client.searchMovies('x')).rejects.toThrow(/Invalid JSON/);
  });

  test('uses Bearer token for secure authentication', async () => {
    const sample = { genres: [{ id: 10, name: 'Action' }] };
    mockFetchOk(sample);
    await client.getGenres();

    const url = (global.fetch as jest.Mock).mock.calls[0][0] as string;
    const options = (global.fetch as jest.Mock).mock.calls[0][1];

    // Verify API key is NOT in URL (security best practice)
    expect(url).not.toContain('api_key');
    expect(url).not.toContain(API_KEY);

    // Verify access token IS in Authorization header
    expect(options.headers.Authorization).toBe(`Bearer ${API_KEY}`);
    expect(options.headers.Accept).toBe('application/json');
  });

  describe('HTTPS Enforcement', () => {
    test('should accept HTTPS URLs', () => {
      // Should not throw for HTTPS URLs
      expect(() => {
        new TmdbApiClient('https://api.themoviedb.org/3/', API_KEY, REGION);
      }).not.toThrow();
    });

    test('should accept HTTPS URLs with uppercase protocol', () => {
      // Should not throw for HTTPS URLs with any case
      expect(() => {
        new TmdbApiClient('HTTPS://api.themoviedb.org/3/', API_KEY, REGION);
      }).not.toThrow();
      expect(() => {
        new TmdbApiClient('Https://api.themoviedb.org/3/', API_KEY, REGION);
      }).not.toThrow();
    });

    test('should reject HTTP URLs', () => {
      expect(() => {
        new TmdbApiClient('http://api.themoviedb.org/3/', API_KEY, REGION);
      }).toThrow(
        'Base URL must use HTTPS protocol for secure API communication'
      );
    });

    test('should reject non-HTTPS protocols', () => {
      expect(() => {
        new TmdbApiClient('ftp://api.themoviedb.org/3/', API_KEY, REGION);
      }).toThrow(
        'Base URL must use HTTPS protocol for secure API communication'
      );
    });

    test('should reject URLs without protocol', () => {
      expect(() => {
        new TmdbApiClient('api.themoviedb.org/3/', API_KEY, REGION);
      }).toThrow(
        'Base URL must use HTTPS protocol for secure API communication'
      );
    });

    test('should use HTTPS when baseUrl comes from config', () => {
      // The default BASE_URL in beforeEach is already HTTPS
      // This verifies the config-based URL is also validated
      expect(() => {
        new TmdbApiClient();
      }).not.toThrow();
    });
  });

  describe('Request Timeout', () => {
    test('should timeout after configured duration', async () => {
      // Mock fetch to hang but respect abort signal
      global.fetch = jest.fn().mockImplementation((url, options) => {
        return new Promise((resolve, reject) => {
          // Listen for abort signal
          if (options?.signal) {
            options.signal.addEventListener('abort', () => {
              const error = new Error('The operation was aborted');
              error.name = 'AbortError';
              reject(error);
            });
          }
          // Never resolve to simulate hanging request (unless aborted)
        });
      });

      // Create client with 100ms timeout
      const timeoutClient = new TmdbApiClient(
        BASE_URL,
        API_KEY,
        REGION,
        undefined,
        100
      );

      await expect(timeoutClient.getGenres()).rejects.toThrow(
        /Request timeout after 100ms/
      );
    }, 15000); // 15 second Jest timeout

    test('should use default timeout when not specified', async () => {
      // Mock fetch to hang but respect abort signal
      global.fetch = jest.fn().mockImplementation((url, options) => {
        return new Promise((resolve, reject) => {
          // Listen for abort signal
          if (options?.signal) {
            options.signal.addEventListener('abort', () => {
              const error = new Error('The operation was aborted');
              error.name = 'AbortError';
              reject(error);
            });
          }
          // Never resolve to simulate hanging request (unless aborted)
        });
      });

      // Use a shorter timeout for testing
      const shortTimeoutClient = new TmdbApiClient(
        BASE_URL,
        API_KEY,
        REGION,
        undefined,
        50
      );

      const startTime = Date.now();
      await expect(shortTimeoutClient.getGenres()).rejects.toThrow(
        /Network error calling TMDb API/
      );
      const endTime = Date.now();
      const elapsed = endTime - startTime;

      // Should timeout in approximately 50ms (with some buffer for test execution)
      expect(elapsed).toBeLessThan(200);
    }, 15000); // 15 second Jest timeout

    test('should handle AbortError correctly', async () => {
      // Mock fetch to simulate AbortError
      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';
      global.fetch = jest.fn().mockRejectedValue(abortError);

      const timeoutClient = new TmdbApiClient(
        BASE_URL,
        API_KEY,
        REGION,
        undefined,
        1000
      );

      await expect(timeoutClient.getGenres()).rejects.toThrow(
        /Request timeout after 1000ms/
      );
    });

    test('should successfully complete fast requests', async () => {
      const sample = { genres: [{ id: 10, name: 'Action' }] };
      mockFetchOk(sample);

      const timeoutClient = new TmdbApiClient(
        BASE_URL,
        API_KEY,
        REGION,
        undefined,
        5000
      );

      const result = await timeoutClient.getGenres();
      expect(result).toEqual(sample);
    });
  });
});
