// src/__tests__/rateLimiter.test.ts
import {
  createRateLimiter,
  calculateBackoffDelay,
  delay,
  isRateLimitError,
  withRetry,
  DEFAULT_RATE_LIMITER_CONFIG,
} from '../rateLimiter';

describe('rateLimiter', () => {
  describe('createRateLimiter', () => {
    it('creates a rate limiter with default concurrency', () => {
      const limiter = createRateLimiter();
      expect(limiter).toBeDefined();
      expect(typeof limiter).toBe('function');
    });

    it('creates a rate limiter with custom concurrency', () => {
      const limiter = createRateLimiter(5);
      expect(limiter).toBeDefined();
    });

    it('limits concurrent execution', async () => {
      const limiter = createRateLimiter(2);
      let concurrent = 0;
      let maxConcurrent = 0;

      const task = async () => {
        concurrent++;
        maxConcurrent = Math.max(maxConcurrent, concurrent);
        await delay(50);
        concurrent--;
        return true;
      };

      const promises = Array(5)
        .fill(null)
        .map(() => limiter(task));
      await Promise.all(promises);

      expect(maxConcurrent).toBeLessThanOrEqual(2);
    });
  });

  describe('calculateBackoffDelay', () => {
    it('returns base delay for first attempt', () => {
      const result = calculateBackoffDelay(0, 1000, 30000);
      // Should be between 1000 and 1250 (1000 + 25% jitter)
      expect(result).toBeGreaterThanOrEqual(1000);
      expect(result).toBeLessThanOrEqual(1250);
    });

    it('increases delay exponentially', () => {
      const attempt0 = calculateBackoffDelay(0, 1000, 100000);
      const attempt1 = calculateBackoffDelay(1, 1000, 100000);
      const attempt2 = calculateBackoffDelay(2, 1000, 100000);

      // Without jitter, expected values are 1000, 2000, 4000
      // With jitter, they can be up to 25% higher
      expect(attempt0).toBeGreaterThanOrEqual(1000);
      expect(attempt1).toBeGreaterThanOrEqual(2000);
      expect(attempt2).toBeGreaterThanOrEqual(4000);
    });

    it('caps at maximum delay', () => {
      const maxDelay = 5000;
      const result = calculateBackoffDelay(10, 1000, maxDelay);
      expect(result).toBeLessThanOrEqual(maxDelay);
    });

    it('uses default values when not provided', () => {
      const result = calculateBackoffDelay(0);
      expect(result).toBeGreaterThanOrEqual(
        DEFAULT_RATE_LIMITER_CONFIG.baseDelayMs
      );
    });
  });

  describe('delay', () => {
    it('delays for the specified duration', async () => {
      const start = Date.now();
      await delay(50);
      const elapsed = Date.now() - start;
      expect(elapsed).toBeGreaterThanOrEqual(45); // Allow some timing variance
    });
  });

  describe('isRateLimitError', () => {
    it('returns true for 429 errors', () => {
      const error = new Error('TMDb API error 429: Too Many Requests');
      expect(isRateLimitError(error)).toBe(true);
    });

    it('returns true for rate limit message', () => {
      const error = new Error('rate limit exceeded');
      expect(isRateLimitError(error)).toBe(true);
    });

    it('returns false for other errors', () => {
      const error = new Error('TMDb API error 500: Internal Server Error');
      expect(isRateLimitError(error)).toBe(false);
    });

    it('returns false for non-Error types', () => {
      expect(isRateLimitError('some string')).toBe(false);
      expect(isRateLimitError(null)).toBe(false);
      expect(isRateLimitError(undefined)).toBe(false);
    });
  });

  describe('withRetry', () => {
    it('returns result on success without retry', async () => {
      const fn = jest.fn().mockResolvedValue('success');
      const result = await withRetry(fn);
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('retries on rate limit error', async () => {
      const rateLimitError = new Error('TMDb API error 429: Too Many Requests');
      const fn = jest
        .fn()
        .mockRejectedValueOnce(rateLimitError)
        .mockResolvedValue('success');

      const result = await withRetry(fn, {
        maxRetries: 3,
        baseDelayMs: 10,
        maxDelayMs: 100,
      });

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('throws non-rate-limit errors immediately', async () => {
      const serverError = new Error(
        'TMDb API error 500: Internal Server Error'
      );
      const fn = jest.fn().mockRejectedValue(serverError);

      await expect(
        withRetry(fn, { maxRetries: 3, baseDelayMs: 10 })
      ).rejects.toThrow('500');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('throws after max retries exhausted', async () => {
      const rateLimitError = new Error('TMDb API error 429: Too Many Requests');
      const fn = jest.fn().mockRejectedValue(rateLimitError);

      await expect(
        withRetry(fn, { maxRetries: 2, baseDelayMs: 10, maxDelayMs: 20 })
      ).rejects.toThrow('429');
      expect(fn).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });

    it('uses default config when not provided', async () => {
      const fn = jest.fn().mockResolvedValue('success');
      const result = await withRetry(fn);
      expect(result).toBe('success');
    });
  });

  describe('DEFAULT_RATE_LIMITER_CONFIG', () => {
    it('has expected default values', () => {
      expect(DEFAULT_RATE_LIMITER_CONFIG.concurrency).toBe(10);
      expect(DEFAULT_RATE_LIMITER_CONFIG.maxRetries).toBe(3);
      expect(DEFAULT_RATE_LIMITER_CONFIG.baseDelayMs).toBe(1000);
      expect(DEFAULT_RATE_LIMITER_CONFIG.maxDelayMs).toBe(30000);
    });
  });
});
