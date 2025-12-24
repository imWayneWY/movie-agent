// src/__tests__/providers.test.ts
import {
  getCanadianProviders,
  extractPlatformsFromProviders,
} from '../providers';
import TmdbApiClient from '../tmdbApi';
import { resetCache } from '../cache';

describe('extractPlatformsFromProviders', () => {
  it('returns empty array if providersData is undefined', () => {
    const result = extractPlatformsFromProviders(undefined, 'CA');
    expect(result).toEqual([]);
  });

  it('returns empty array if results is empty', () => {
    const result = extractPlatformsFromProviders(
      { id: 123, results: {} },
      'CA'
    );
    expect(result).toEqual([]);
  });

  it('returns empty array if region not found', () => {
    const result = extractPlatformsFromProviders(
      {
        id: 123,
        results: {
          US: { flatrate: [{ provider_id: 1, provider_name: 'Netflix' }] },
        },
      },
      'CA'
    );
    expect(result).toEqual([]);
  });

  it('returns empty array if no flatrate providers', () => {
    const result = extractPlatformsFromProviders(
      {
        id: 123,
        results: { CA: { rent: [], buy: [] } },
      },
      'CA'
    );
    expect(result).toEqual([]);
  });

  it('returns mapped platforms for flatrate providers', () => {
    const result = extractPlatformsFromProviders(
      {
        id: 123,
        results: {
          CA: {
            flatrate: [
              { provider_id: 1, provider_name: 'Netflix' },
              { provider_id: 2, provider_name: 'Amazon Prime Video' },
              { provider_id: 3, provider_name: 'Disney Plus' },
            ],
          },
        },
      },
      'CA'
    );
    expect(result).toEqual(['Netflix', 'Prime Video', 'Disney+']);
  });

  it('filters out unknown providers', () => {
    const result = extractPlatformsFromProviders(
      {
        id: 123,
        results: {
          CA: {
            flatrate: [
              { provider_id: 1, provider_name: 'Netflix' },
              { provider_id: 99, provider_name: 'Unknown Service' },
            ],
          },
        },
      },
      'CA'
    );
    expect(result).toEqual(['Netflix']);
  });

  it('removes duplicate platforms', () => {
    const result = extractPlatformsFromProviders(
      {
        id: 123,
        results: {
          CA: {
            flatrate: [
              { provider_id: 1, provider_name: 'Netflix' },
              { provider_id: 1, provider_name: 'Netflix' },
            ],
          },
        },
      },
      'CA'
    );
    expect(result).toEqual(['Netflix']);
  });
});

describe('getCanadianProviders', () => {
  const movieId = 12345;
  let mockClient: jest.Mocked<TmdbApiClient>;

  beforeEach(() => {
    mockClient = {
      getWatchProviders: jest.fn(),
    } as any;
    resetCache(); // Clear cache between tests
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns empty array if no providers', async () => {
    mockClient.getWatchProviders.mockResolvedValueOnce({
      id: movieId,
      results: {},
    });
    const result = await getCanadianProviders(movieId, 'CA', mockClient);
    expect(result).toEqual([]);
  });

  it('returns empty array if no flatrate providers', async () => {
    mockClient.getWatchProviders.mockResolvedValueOnce({
      id: movieId,
      results: { CA: { rent: [], buy: [] } },
    });
    const result = await getCanadianProviders(movieId, 'CA', mockClient);
    expect(result).toEqual([]);
  });

  it('returns mapped platforms for flatrate providers', async () => {
    mockClient.getWatchProviders.mockResolvedValueOnce({
      id: movieId,
      results: {
        CA: {
          flatrate: [
            { provider_id: 1, provider_name: 'Netflix' },
            { provider_id: 2, provider_name: 'Amazon Prime Video' },
            { provider_id: 3, provider_name: 'Disney Plus' },
            { provider_id: 99, provider_name: 'Unknown Service' },
            { provider_id: 1, provider_name: 'Netflix' }, // duplicate
          ],
        },
      },
    });
    const result = await getCanadianProviders(movieId, 'CA', mockClient);
    expect(result).toEqual(['Netflix', 'Prime Video', 'Disney+']);
  });

  it('handles missing region gracefully', async () => {
    mockClient.getWatchProviders.mockResolvedValueOnce({
      id: movieId,
      results: { US: {} },
    });
    const result = await getCanadianProviders(movieId, 'CA', mockClient);
    expect(result).toEqual([]);
  });

  it('handles fetch errors gracefully', async () => {
    mockClient.getWatchProviders.mockRejectedValueOnce(
      new Error('Network error')
    );
    const result = await getCanadianProviders(movieId, 'CA', mockClient);
    expect(result).toEqual([]);
  });
});
