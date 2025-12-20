// src/__tests__/llm.test.ts
import { LLMService, getLLMService } from '../llm';
import { AgentResponse } from '../types';

// Mock the langchain modules
jest.mock('@langchain/google-genai', () => ({
  ChatGoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    invoke: jest.fn(),
    stream: jest.fn(),
  })),
}));

jest.mock('@langchain/core/prompts', () => ({
  PromptTemplate: {
    fromTemplate: jest.fn().mockReturnValue({
      pipe: jest.fn().mockReturnThis(),
    }),
  },
}));

jest.mock('@langchain/core/output_parsers', () => ({
  StringOutputParser: jest.fn().mockImplementation(() => ({})),
}));

describe('LLMService', () => {
  const mockResponse: AgentResponse = {
    recommendations: [
      {
        title: 'Test Movie',
        releaseYear: 2023,
        runtime: 120,
        genres: ['Action', 'Adventure'],
        description: 'A thrilling test movie.',
        streamingPlatforms: [
          { name: 'Netflix', type: 'subscription', available: true },
          { name: 'Prime Video', type: 'subscription', available: false },
        ],
        matchReason: 'Matches your excited mood',
      },
      {
        title: 'Another Movie',
        releaseYear: 2022,
        runtime: 95,
        genres: ['Comedy'],
        description: 'A funny test movie.',
        streamingPlatforms: [],
        matchReason: 'Highly rated',
      },
    ],
    metadata: {
      requestTimestamp: '2024-01-01T00:00:00.000Z',
      totalResults: 2,
      inputParameters: {},
    },
  };

  const mockUserInput = {
    mood: 'excited',
    platforms: ['Netflix'],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Set up environment variable for tests
    process.env.GEMINI_API_KEY = 'test-api-key';
  });

  afterEach(() => {
    delete process.env.GEMINI_API_KEY;
  });

  describe('constructor', () => {
    it('should create LLMService with provided API key', () => {
      const service = new LLMService('custom-api-key');
      expect(service).toBeInstanceOf(LLMService);
    });

    it('should create LLMService with environment variable API key', () => {
      const service = new LLMService();
      expect(service).toBeInstanceOf(LLMService);
    });

    it('should throw error if no API key is provided', () => {
      delete process.env.GEMINI_API_KEY;
      expect(() => new LLMService()).toThrow(
        'GEMINI_API_KEY is required for LLM service'
      );
    });
  });

  describe('formatRecommendations', () => {
    it('should format recommendations successfully', async () => {
      const service = new LLMService('test-api-key');

      // Mock the chain invoke method
      (service as any).chain = {
        invoke: jest.fn().mockResolvedValue('Formatted movie recommendations'),
      };

      const consoleSpy = jest
        .spyOn(console, 'log')
        .mockImplementation(() => {});

      const result = await service.formatRecommendations(
        mockResponse,
        mockUserInput
      );

      expect(result).toBe('Formatted movie recommendations');
      expect((service as any).chain.invoke).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('✓ LLM formatting completed in')
      );

      consoleSpy.mockRestore();
    });

    it('should handle timeout and fallback to basic format', async () => {
      const service = new LLMService('test-api-key');

      // Mock the chain invoke method to timeout
      (service as any).chain = {
        invoke: jest
          .fn()
          .mockImplementation(
            () => new Promise(resolve => setTimeout(resolve, 20000))
          ),
      };

      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      const result = await service.formatRecommendations(
        mockResponse,
        mockUserInput
      );

      // Should return fallback format
      expect(result).toContain('🎬 Movie Recommendations');
      expect(result).toContain('Test Movie');
      expect(result).toContain('Another Movie');
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    }, 20000);

    it('should handle LLM error and fallback to basic format', async () => {
      const service = new LLMService('test-api-key');

      // Mock the chain invoke method to throw error
      (service as any).chain = {
        invoke: jest.fn().mockRejectedValue(new Error('LLM API error')),
      };

      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      const result = await service.formatRecommendations(
        mockResponse,
        mockUserInput
      );

      // Should return fallback format
      expect(result).toContain('🎬 Movie Recommendations');
      expect(result).toContain('Test Movie');
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'LLM formatting error:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it('should format recommendations with no streaming platforms', async () => {
      const service = new LLMService('test-api-key');

      const responseWithNoPlatforms: AgentResponse = {
        recommendations: [
          {
            title: 'Test Movie',
            releaseYear: 2023,
            runtime: 120,
            genres: ['Action'],
            description: 'A test movie.',
            streamingPlatforms: [],
            matchReason: 'Matches preferences',
          },
        ],
        metadata: {
          requestTimestamp: '2024-01-01T00:00:00.000Z',
          totalResults: 1,
          inputParameters: {},
        },
      };

      (service as any).chain = {
        invoke: jest.fn().mockResolvedValue('Formatted output'),
      };

      const consoleSpy = jest
        .spyOn(console, 'log')
        .mockImplementation(() => {});

      await service.formatRecommendations(responseWithNoPlatforms, {});

      // Check that the invoke was called with proper data including "No streaming availability"
      const invokeCall = ((service as any).chain.invoke as jest.Mock).mock
        .calls[0][0];
      expect(invokeCall.recommendations).toContain('No streaming availability');

      consoleSpy.mockRestore();
    });
  });

  describe('formatRecommendationsStream', () => {
    it('should stream recommendations successfully', async () => {
      const service = new LLMService('test-api-key');
      const chunks: string[] = [];
      const onChunk = jest.fn((chunk: string) => chunks.push(chunk));

      // Mock the stream method
      const mockStream = async function* () {
        yield 'Chunk 1';
        yield 'Chunk 2';
        yield 'Chunk 3';
      };

      (service as any).chain = {
        stream: jest.fn().mockResolvedValue(mockStream()),
      };

      const consoleSpy = jest
        .spyOn(console, 'log')
        .mockImplementation(() => {});

      await service.formatRecommendationsStream(
        mockResponse,
        mockUserInput,
        onChunk
      );

      expect(onChunk).toHaveBeenCalledTimes(3);
      expect(chunks).toEqual(['Chunk 1', 'Chunk 2', 'Chunk 3']);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('✓ LLM streaming completed in')
      );

      consoleSpy.mockRestore();
    });

    it('should handle streaming timeout and fallback', async () => {
      const service = new LLMService('test-api-key');
      const chunks: string[] = [];
      const onChunk = jest.fn((chunk: string) => chunks.push(chunk));

      // Mock the stream method to timeout
      const mockStream = async function* () {
        await new Promise(resolve => setTimeout(resolve, 20000));
        yield 'Never reached';
      };

      (service as any).chain = {
        stream: jest.fn().mockResolvedValue(mockStream()),
      };

      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      await service.formatRecommendationsStream(
        mockResponse,
        mockUserInput,
        onChunk
      );

      // Should call onChunk with fallback format
      expect(onChunk).toHaveBeenCalledWith(
        expect.stringContaining('🎬 Movie Recommendations')
      );
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    }, 20000);

    it('should handle streaming error and fallback', async () => {
      const service = new LLMService('test-api-key');
      const chunks: string[] = [];
      const onChunk = jest.fn((chunk: string) => chunks.push(chunk));

      // Mock the stream method to throw error
      (service as any).chain = {
        stream: jest.fn().mockRejectedValue(new Error('Stream error')),
      };

      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      await service.formatRecommendationsStream(
        mockResponse,
        mockUserInput,
        onChunk
      );

      // Should call onChunk with fallback format
      expect(onChunk).toHaveBeenCalledWith(
        expect.stringContaining('🎬 Movie Recommendations')
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('LLM streaming error:'),
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('fallbackFormat', () => {
    it('should format response with all fields', () => {
      const service = new LLMService('test-api-key');
      const result = (service as any).fallbackFormat(mockResponse);

      expect(result).toContain('🎬 Movie Recommendations');
      expect(result).toContain('1. **Test Movie** (2023) • 120 min');
      expect(result).toContain('Genres: Action, Adventure');
      expect(result).toContain('A thrilling test movie.');
      expect(result).toContain('📺 Available on: Netflix');
      expect(result).toContain('✨ Why: Matches your excited mood');
      expect(result).toContain('2. **Another Movie** (2022) • 95 min');
      expect(result).toContain('Genres: Comedy');
    });

    it('should handle movies with no available platforms', () => {
      const service = new LLMService('test-api-key');
      const responseNoPlatforms: AgentResponse = {
        ...mockResponse,
        recommendations: [
          {
            ...mockResponse.recommendations[0],
            streamingPlatforms: [
              { name: 'Netflix', type: 'subscription', available: false },
            ],
          },
        ],
      };

      const result = (service as any).fallbackFormat(responseNoPlatforms);

      expect(result).toContain('🎬 Movie Recommendations');
      expect(result).not.toContain('📺 Available on:');
    });
  });

  describe('getLLMService', () => {
    it('should return singleton instance', () => {
      const service1 = getLLMService();
      const service2 = getLLMService();

      expect(service1).toBe(service2);
      expect(service1).toBeInstanceOf(LLMService);
    });
  });
});
