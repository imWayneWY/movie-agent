describe('Config', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
  });

  afterEach(() => {
    process.env = OLD_ENV;
  });

  it('should use default region, ttl, min/max recommendations', () => {
    process.env.TMDB_API_KEY = 'test';
    process.env.TMDB_BASE_URL = '';
    jest.resetModules();
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const cfg = require('../config').default;
    expect(cfg.TMDB_REGION).toBe('CA');
    expect(cfg.CACHE_TTL).toBe(86400);
    expect(cfg.MAX_RECOMMENDATIONS).toBe(5);
    expect(cfg.MIN_RECOMMENDATIONS).toBe(3);
  });

  it('should allow empty TMDB_API_KEY (validation happens in factory)', () => {
    process.env.TMDB_API_KEY = '';
    process.env.TMDB_BASE_URL = 'http://localhost';
    jest.resetModules();
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const cfg = require('../config').default;
    expect(cfg.TMDB_API_KEY).toBe('');
  });

  it('should default TMDB_BASE_URL when missing', () => {
    process.env.TMDB_API_KEY = 'test';
    delete process.env.TMDB_BASE_URL;
    jest.resetModules();
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const cfg = require('../config').default;
    expect(cfg.TMDB_BASE_URL).toBe('https://api.themoviedb.org/3');
  });
});
