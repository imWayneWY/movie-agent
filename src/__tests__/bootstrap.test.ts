import { MovieAgent } from '../agent';
import { MovieAgentFactory } from '../factory';
import TmdbApiClient from '../tmdbApi';

describe('MovieAgent Bootstrap', () => {
  it('should load the MovieAgent class', () => {
    expect(MovieAgent).toBeDefined();
  });

  it('should create a MovieAgent instance with TmdbApiClient', () => {
    const tmdbClient = new TmdbApiClient(
      'https://api.themoviedb.org/3',
      'test-api-key',
      'CA'
    );
    const agent = new MovieAgent(tmdbClient);
    expect(agent).toBeInstanceOf(MovieAgent);
  });

  it('should create agent via factory', () => {
    const agent = MovieAgentFactory.create({
      tmdbAccessToken: 'test-api-key',
      tmdbRegion: 'CA',
    });
    expect(agent).toBeInstanceOf(MovieAgent);
  });

  it('should throw error when factory called without API key', () => {
    expect(() => {
      MovieAgentFactory.create({
        tmdbAccessToken: '',
      });
    }).toThrow(/TMDB access token is required/);
  });
});
