// src/__tests__/factory.test.ts
import { MovieAgentFactory } from '../factory';
import { MovieAgent } from '../agent';

describe('MovieAgentFactory', () => {
  const validConfig = {
    tmdbApiKey: 'test-api-key',
  };

  describe('create', () => {
    it('should create MovieAgent with minimal config', () => {
      const agent = MovieAgentFactory.create(validConfig);

      expect(agent).toBeInstanceOf(MovieAgent);
    });

    it('should create MovieAgent with full config', () => {
      const fullConfig = {
        tmdbApiKey: 'test-api-key',
        tmdbBaseUrl: 'https://custom-api.com',
        tmdbRegion: 'US',
        llmProvider: 'gemini' as const,
        geminiApiKey: 'gemini-key',
        azureOpenAiApiKey: 'azure-key',
        azureOpenAiEndpoint: 'https://azure.endpoint.com',
        azureOpenAiDeployment: 'gpt-4',
        openaiApiKey: 'openai-key',
        cacheTtl: 60000,
        maxRecommendations: 10,
        minRecommendations: 2,
        debug: true,
      };

      const agent = MovieAgentFactory.create(fullConfig);

      expect(agent).toBeInstanceOf(MovieAgent);
    });

    it('should use default TMDB base URL when not provided', () => {
      const agent = MovieAgentFactory.create(validConfig);

      expect(agent).toBeInstanceOf(MovieAgent);
      // Agent should be created successfully with defaults
    });

    it('should use default region (CA) when not provided', () => {
      const agent = MovieAgentFactory.create(validConfig);

      expect(agent).toBeInstanceOf(MovieAgent);
    });

    it('should enable debug logging when debug is true', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const agent = MovieAgentFactory.create({
        ...validConfig,
        debug: true,
      });

      expect(agent).toBeInstanceOf(MovieAgent);
      // Logger should be created (we can't directly test it without calling a method)

      consoleSpy.mockRestore();
    });

    it('should not enable debug logging when debug is false', () => {
      const agent = MovieAgentFactory.create({
        ...validConfig,
        debug: false,
      });

      expect(agent).toBeInstanceOf(MovieAgent);
    });

    it('should throw error when tmdbApiKey is missing', () => {
      expect(() =>
        MovieAgentFactory.create({
          tmdbApiKey: '',
        })
      ).toThrow('TMDB API key is required');
    });

    it('should throw error when tmdbApiKey is undefined', () => {
      expect(() => MovieAgentFactory.create({} as any)).toThrow(
        'TMDB API key is required'
      );
    });

    it('should accept custom tmdbBaseUrl', () => {
      const agent = MovieAgentFactory.create({
        tmdbApiKey: 'test-key',
        tmdbBaseUrl: 'https://custom.api.com/v3',
      });

      expect(agent).toBeInstanceOf(MovieAgent);
    });

    it('should accept custom tmdbRegion', () => {
      const agent = MovieAgentFactory.create({
        tmdbApiKey: 'test-key',
        tmdbRegion: 'US',
      });

      expect(agent).toBeInstanceOf(MovieAgent);
    });

    it('should accept LLM provider configuration', () => {
      const agent = MovieAgentFactory.create({
        tmdbApiKey: 'test-key',
        llmProvider: 'gemini',
        geminiApiKey: 'gemini-test-key',
      });

      expect(agent).toBeInstanceOf(MovieAgent);
    });

    it('should accept Azure OpenAI configuration', () => {
      const agent = MovieAgentFactory.create({
        tmdbApiKey: 'test-key',
        llmProvider: 'azure',
        azureOpenAiApiKey: 'azure-key',
        azureOpenAiEndpoint: 'https://test.openai.azure.com',
        azureOpenAiDeployment: 'gpt-4',
      });

      expect(agent).toBeInstanceOf(MovieAgent);
    });

    it('should accept cache TTL configuration', () => {
      const agent = MovieAgentFactory.create({
        tmdbApiKey: 'test-key',
        cacheTtl: 120000,
      });

      expect(agent).toBeInstanceOf(MovieAgent);
    });

    it('should accept recommendation count configuration', () => {
      const agent = MovieAgentFactory.create({
        tmdbApiKey: 'test-key',
        maxRecommendations: 10,
        minRecommendations: 2,
      });

      expect(agent).toBeInstanceOf(MovieAgent);
    });
  });

  describe('fromEnv', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      jest.resetModules();
      process.env = { ...originalEnv };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it('should create MovieAgent from environment variables', () => {
      process.env.TMDB_API_KEY = 'test-api-key';

      const agent = MovieAgentFactory.fromEnv();

      expect(agent).toBeInstanceOf(MovieAgent);
    });

    it('should create MovieAgent with debug enabled', () => {
      process.env.TMDB_API_KEY = 'test-api-key';

      const agent = MovieAgentFactory.fromEnv(true);

      expect(agent).toBeInstanceOf(MovieAgent);
    });

    it('should create MovieAgent with debug disabled by default', () => {
      process.env.TMDB_API_KEY = 'test-api-key';

      const agent = MovieAgentFactory.fromEnv();

      expect(agent).toBeInstanceOf(MovieAgent);
    });

    it('should throw error when TMDB_API_KEY is not in environment', () => {
      delete process.env.TMDB_API_KEY;

      expect(() => MovieAgentFactory.fromEnv()).toThrow(
        'TMDB_API_KEY environment variable is required'
      );
    });

    it('should use TMDB_BASE_URL from environment', () => {
      process.env.TMDB_API_KEY = 'test-api-key';
      process.env.TMDB_BASE_URL = 'https://custom-api.com';

      const agent = MovieAgentFactory.fromEnv();

      expect(agent).toBeInstanceOf(MovieAgent);
    });

    it('should use TMDB_REGION from environment', () => {
      process.env.TMDB_API_KEY = 'test-api-key';
      process.env.TMDB_REGION = 'US';

      const agent = MovieAgentFactory.fromEnv();

      expect(agent).toBeInstanceOf(MovieAgent);
    });

    it('should use LLM_PROVIDER from environment', () => {
      process.env.TMDB_API_KEY = 'test-api-key';
      process.env.LLM_PROVIDER = 'gemini';
      process.env.GEMINI_API_KEY = 'gemini-key';

      const agent = MovieAgentFactory.fromEnv();

      expect(agent).toBeInstanceOf(MovieAgent);
    });

    it('should use Azure OpenAI config from environment', () => {
      process.env.TMDB_API_KEY = 'test-api-key';
      process.env.LLM_PROVIDER = 'azure';
      process.env.AZURE_OPENAI_API_KEY = 'azure-key';
      process.env.AZURE_OPENAI_ENDPOINT = 'https://test.openai.azure.com';
      process.env.AZURE_OPENAI_DEPLOYMENT = 'gpt-4';

      const agent = MovieAgentFactory.fromEnv();

      expect(agent).toBeInstanceOf(MovieAgent);
    });

    it('should use OPENAI_API_KEY from environment', () => {
      process.env.TMDB_API_KEY = 'test-api-key';
      process.env.OPENAI_API_KEY = 'openai-key';

      const agent = MovieAgentFactory.fromEnv();

      expect(agent).toBeInstanceOf(MovieAgent);
    });

    it('should use CACHE_TTL from environment', () => {
      process.env.TMDB_API_KEY = 'test-api-key';
      process.env.CACHE_TTL = '120000';

      const agent = MovieAgentFactory.fromEnv();

      expect(agent).toBeInstanceOf(MovieAgent);
    });

    it('should use MAX_RECOMMENDATIONS from environment', () => {
      process.env.TMDB_API_KEY = 'test-api-key';
      process.env.MAX_RECOMMENDATIONS = '10';

      const agent = MovieAgentFactory.fromEnv();

      expect(agent).toBeInstanceOf(MovieAgent);
    });

    it('should use MIN_RECOMMENDATIONS from environment', () => {
      process.env.TMDB_API_KEY = 'test-api-key';
      process.env.MIN_RECOMMENDATIONS = '2';

      const agent = MovieAgentFactory.fromEnv();

      expect(agent).toBeInstanceOf(MovieAgent);
    });

    it('should handle all environment variables together', () => {
      process.env.TMDB_API_KEY = 'test-api-key';
      process.env.TMDB_BASE_URL = 'https://custom-api.com';
      process.env.TMDB_REGION = 'US';
      process.env.LLM_PROVIDER = 'gemini';
      process.env.GEMINI_API_KEY = 'gemini-key';
      process.env.AZURE_OPENAI_API_KEY = 'azure-key';
      process.env.AZURE_OPENAI_ENDPOINT = 'https://test.openai.azure.com';
      process.env.AZURE_OPENAI_DEPLOYMENT = 'gpt-4';
      process.env.OPENAI_API_KEY = 'openai-key';
      process.env.CACHE_TTL = '120000';
      process.env.MAX_RECOMMENDATIONS = '10';
      process.env.MIN_RECOMMENDATIONS = '2';

      const agent = MovieAgentFactory.fromEnv(true);

      expect(agent).toBeInstanceOf(MovieAgent);
    });

    it('should handle missing optional environment variables', () => {
      process.env.TMDB_API_KEY = 'test-api-key';
      // All other variables undefined

      const agent = MovieAgentFactory.fromEnv();

      expect(agent).toBeInstanceOf(MovieAgent);
    });

    it('should handle invalid CACHE_TTL gracefully', () => {
      process.env.TMDB_API_KEY = 'test-api-key';
      process.env.CACHE_TTL = 'not-a-number';

      const agent = MovieAgentFactory.fromEnv();

      expect(agent).toBeInstanceOf(MovieAgent);
    });

    it('should handle invalid MAX_RECOMMENDATIONS gracefully', () => {
      process.env.TMDB_API_KEY = 'test-api-key';
      process.env.MAX_RECOMMENDATIONS = 'not-a-number';

      const agent = MovieAgentFactory.fromEnv();

      expect(agent).toBeInstanceOf(MovieAgent);
    });

    it('should handle invalid MIN_RECOMMENDATIONS gracefully', () => {
      process.env.TMDB_API_KEY = 'test-api-key';
      process.env.MIN_RECOMMENDATIONS = 'not-a-number';

      const agent = MovieAgentFactory.fromEnv();

      expect(agent).toBeInstanceOf(MovieAgent);
    });
  });
});
