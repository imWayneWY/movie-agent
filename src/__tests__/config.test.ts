import config from '../config';

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
    process.env.TMDB_MCP_SERVER_URL = 'http://localhost';
    jest.resetModules();
    const cfg = require('../config').default;
    expect(cfg.TMDB_REGION).toBe('CA');
    expect(cfg.CACHE_TTL).toBe(86400);
    expect(cfg.MAX_RECOMMENDATIONS).toBe(5);
    expect(cfg.MIN_RECOMMENDATIONS).toBe(3);
  });

  it('should throw if TMDB_API_KEY is missing', () => {
    process.env.TMDB_API_KEY = '';
    process.env.TMDB_MCP_SERVER_URL = 'http://localhost';
    jest.resetModules();
    expect(() => require('../config')).toThrow(/TMDB_API_KEY/);
  });

  it('should throw if TMDB_MCP_SERVER_URL is missing', () => {
    process.env.TMDB_API_KEY = 'test';
    process.env.TMDB_MCP_SERVER_URL = '';
    jest.resetModules();
    expect(() => require('../config')).toThrow(/TMDB_MCP_SERVER_URL/);
  });
});
