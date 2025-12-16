// Opt-in live test: requires real TMDB API key.
// Run with: LIVE_TEST=1 TMDB_API_KEY=... npm test -- -t "TmdbApiClient Live"

describe('TmdbApiClient Live', () => {
  let TmdbApiClient: any;
  let client: any;

  const required = ['TMDB_API_KEY'];
  const hasEnv =
    process.env.LIVE_TEST === '1' && required.every(k => !!process.env[k]);

  if (!hasEnv) {
    test.skip('skipped: LIVE_TEST=1 and TMDB env vars required', () => {});
    return;
  }

  beforeAll(async () => {
    jest.resetModules();
    ({ default: TmdbApiClient } = await import('../tmdbApi'));
    client = new TmdbApiClient();
  });

  test('discoverMovies returns results', async () => {
    const res = await client.discoverMovies({
      sort_by: 'popularity.desc',
      page: 1,
    });
    expect(res).toBeTruthy();
    expect(res.page).toBeGreaterThanOrEqual(1);
    expect(Array.isArray(res.results)).toBe(true);
  });

  test('searchMovies returns results for a common query', async () => {
    const res = await client.searchMovies('Matrix', 1);
    expect(res).toBeTruthy();
    expect(Array.isArray(res.results)).toBe(true);
  });

  test('getGenres returns list', async () => {
    const res = await client.getGenres();
    expect(res).toBeTruthy();
    expect(Array.isArray(res.genres)).toBe(true);
  });

  test('getMovieDetails returns a known movie', async () => {
    // Use a well-known TMDb movie ID; adjust as needed.
    const movieId = 603; // The Matrix (commonly 603 in TMDb)
    const res = await client.getMovieDetails(movieId);
    expect(res).toBeTruthy();
    expect(res.id).toBe(movieId);
    expect(typeof res.title).toBe('string');
  });
});
