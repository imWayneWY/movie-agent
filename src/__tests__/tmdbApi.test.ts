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
    process.env.TMDB_API_KEY = API_KEY;
    process.env.TMDB_REGION = REGION;
    jest.resetModules();
    ({ default: TmdbApiClient } = await import('../tmdbApi'));
    client = new TmdbApiClient();
    jest.resetAllMocks();
  });

  afterAll(() => {
    delete process.env.TMDB_BASE_URL;
    delete process.env.TMDB_API_KEY;
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
    const res = await client.discoverMovies({ sort_by: 'popularity.desc', page: 1 });
    expect(res).toEqual(sample);
    expect(global.fetch).toHaveBeenCalled();
    const url = (global.fetch as jest.Mock).mock.calls[0][0] as string;
    expect(url).toContain('discover/movie');
    expect(url).toContain(`api_key=${API_KEY}`);
    expect(url).toContain('sort_by=popularity.desc');
    expect(url).toContain('page=1');
    expect(url).toContain(`region=${REGION}`);
  });

  test('getMovieDetails succeeds', async () => {
    const sample = { id: 2, title: 'B', runtime: 120 };
    mockFetchOk(sample);
    const res = await client.getMovieDetails(2);
    expect(res).toEqual(sample);
    const url = (global.fetch as jest.Mock).mock.calls[0][0] as string;
    expect(url).toContain('movie/2');
    expect(url).toContain(`api_key=${API_KEY}`);
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
        US: { link: 'https://tmdb', flatrate: [{ provider_id: 8, provider_name: 'Netflix' }] },
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
    await expect(client.getMovieDetails(999)).rejects.toThrow(/TMDb API error 404/);
  });

  test('handles invalid JSON', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockRejectedValue(new Error('bad json')),
      text: jest.fn().mockResolvedValue('')
    } as any);
    await expect(client.searchMovies('x')).rejects.toThrow(/Invalid JSON/);
  });
});
