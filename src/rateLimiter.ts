// src/rateLimiter.ts
import pLimit from 'p-limit';

/**
 * Configuration for rate limiting
 */
export interface RateLimiterConfig {
  /** Maximum concurrent requests (default: 10) */
  concurrency: number;
  /** Maximum retry attempts for rate limit errors (default: 3) */
  maxRetries: number;
  /** Base delay in milliseconds for exponential backoff (default: 1000) */
  baseDelayMs: number;
  /** Maximum delay in milliseconds for exponential backoff (default: 30000) */
  maxDelayMs: number;
}

/**
 * Default rate limiter configuration
 * TMDb allows 40 requests per 10 seconds, so we limit to 10 concurrent requests
 * to stay well under the limit
 */
export const DEFAULT_RATE_LIMITER_CONFIG: RateLimiterConfig = {
  concurrency: 10,
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
};

/**
 * Rate limiter instance type
 */
export type RateLimiter = ReturnType<typeof pLimit>;

/**
 * Creates a rate limiter with the specified concurrency
 * @param concurrency - Maximum number of concurrent operations
 * @returns A rate limiter function
 */
export function createRateLimiter(
  concurrency: number = DEFAULT_RATE_LIMITER_CONFIG.concurrency
): RateLimiter {
  return pLimit(concurrency);
}

/**
 * Calculates exponential backoff delay with jitter
 * @param attempt - Current retry attempt (0-based)
 * @param baseDelayMs - Base delay in milliseconds
 * @param maxDelayMs - Maximum delay cap in milliseconds
 * @returns Delay in milliseconds
 */
export function calculateBackoffDelay(
  attempt: number,
  baseDelayMs: number = DEFAULT_RATE_LIMITER_CONFIG.baseDelayMs,
  maxDelayMs: number = DEFAULT_RATE_LIMITER_CONFIG.maxDelayMs
): number {
  // Exponential backoff: baseDelay * 2^attempt
  const exponentialDelay = baseDelayMs * Math.pow(2, attempt);
  // Add jitter (0-25% of the delay) to avoid thundering herd
  const jitter = exponentialDelay * Math.random() * 0.25;
  // Cap at maxDelayMs
  return Math.min(exponentialDelay + jitter, maxDelayMs);
}

/**
 * Delays execution for the specified duration
 * @param ms - Delay in milliseconds
 * @returns Promise that resolves after the delay
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Checks if an error is a rate limit error (HTTP 429)
 * @param error - The error to check
 * @returns True if the error is a rate limit error
 */
export function isRateLimitError(error: unknown): boolean {
  if (error instanceof Error) {
    return (
      error.message.includes('429') || error.message.includes('rate limit')
    );
  }
  return false;
}

/**
 * Executes an async function with exponential backoff retry on rate limit errors
 * @param fn - The async function to execute
 * @param config - Rate limiter configuration
 * @returns Promise resolving to the function result
 * @throws The last error if all retries are exhausted
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: Partial<RateLimiterConfig> = {}
): Promise<T> {
  const { maxRetries, baseDelayMs, maxDelayMs } = {
    ...DEFAULT_RATE_LIMITER_CONFIG,
    ...config,
  };

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Only retry on rate limit errors
      if (!isRateLimitError(error)) {
        throw error;
      }

      // Don't delay after the last attempt
      if (attempt < maxRetries) {
        const delayMs = calculateBackoffDelay(attempt, baseDelayMs, maxDelayMs);
        await delay(delayMs);
      }
    }
  }

  throw lastError;
}
