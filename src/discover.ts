import TmdbApiClient, {
  DiscoverMoviesParams,
  DiscoverMoviesResponse,
} from './tmdbApi';
import { moodToGenres } from './mood';
import { getCache, generateDiscoverCacheKey } from './cache';
import config from './config';

/**
 * Input for building discover parameters.
 */
export interface DiscoverInput {
  /** Optional mood to map to genres */
  mood?: string;
  /** Explicit genre names (e.g., ["Action", "Comedy"]) */
  genres?: string[];
  /** Specific release year */
  year?: number;
  /** Minimum release year */
  yearMin?: number;
  /** Maximum release year */
  yearMax?: number;
  /** Minimum runtime in minutes */
  runtimeMin?: number;
  /** Maximum runtime in minutes */
  runtimeMax?: number;
  /** Page number for pagination */
  page?: number;
  /** Sort order (e.g., "popularity.desc", "release_date.desc") */
  sortBy?: string;
}

/**
 * Maps genre names to genre IDs based on TMDb's genre list.
 * This is a static mapping of common movie genres.
 */
const GENRE_NAME_TO_ID: Record<string, number> = {
  Action: 28,
  Adventure: 12,
  Animation: 16,
  Biography: 99, // Note: Biography is not a standard TMDb genre, using Documentary
  Comedy: 35,
  Crime: 80,
  Documentary: 99,
  Drama: 18,
  Family: 10751,
  Fantasy: 14,
  History: 36,
  Horror: 27,
  Music: 10402,
  Musical: 10402, // Music and Musical map to the same ID
  Mystery: 9648,
  Romance: 10749,
  'Science Fiction': 878,
  Thriller: 53,
  'TV Movie': 10770,
  War: 10752,
  Western: 37,
};

/**
 * Converts genre names to comma-separated genre IDs.
 * @param genreNames - Array of genre names
 * @returns Comma-separated string of genre IDs, or undefined if no valid genres
 */
function genreNamesToIds(genreNames: string[]): string | undefined {
  const ids = genreNames
    .map(name => GENRE_NAME_TO_ID[name])
    .filter(id => id !== undefined);

  if (ids.length === 0) {
    return undefined;
  }

  return ids.join(',');
}

/**
 * Builds TMDb discover parameters from user input.
 * @param input - User input with mood, genres, year range, runtime constraints, etc.
 * @returns DiscoverMoviesParams object ready for API call
 */
export function buildDiscoverParams(
  input: DiscoverInput
): DiscoverMoviesParams {
  const params: DiscoverMoviesParams = {};

  // Handle genres - prioritize explicit genres over mood
  let genreNames: string[] = [];
  if (input.genres && input.genres.length > 0) {
    genreNames = input.genres;
  } else if (input.mood) {
    genreNames = moodToGenres(input.mood);
  }

  if (genreNames.length > 0) {
    params.with_genres = genreNamesToIds(genreNames);
  }

  // Handle year - specific year takes precedence over range
  if (input.year) {
    params.year = input.year;
  } else {
    // Use date range if no specific year
    if (input.yearMin) {
      params['primary_release_date.gte'] = `${input.yearMin}-01-01`;
    }
    if (input.yearMax) {
      params['primary_release_date.lte'] = `${input.yearMax}-12-31`;
    }
  }

  // Handle runtime constraints
  if (input.runtimeMin !== undefined) {
    params['with_runtime.gte'] = input.runtimeMin;
  }
  if (input.runtimeMax !== undefined) {
    params['with_runtime.lte'] = input.runtimeMax;
  }

  // Handle pagination
  if (input.page !== undefined) {
    params.page = input.page;
  }

  // Handle sort order (default to popularity descending)
  params.sort_by = input.sortBy ?? 'popularity.desc';

  return params;
}

/**
 * Discovers movies based on user input.
 * @param input - User input with mood, genres, year range, runtime constraints, etc.
 * @param apiClient - Optional TMDb API client instance (defaults to new instance)
 * @returns Promise resolving to discover movies response
 */
export async function discoverMovies(
  input: DiscoverInput,
  apiClient?: TmdbApiClient
): Promise<DiscoverMoviesResponse> {
  const client = apiClient ?? new TmdbApiClient();
  const params = buildDiscoverParams(input);

  // Check cache first
  const cache = getCache(config.CACHE_TTL);
  const cacheKey = generateDiscoverCacheKey(params);
  const cachedResult = cache.get<DiscoverMoviesResponse>(cacheKey);

  if (cachedResult) {
    return cachedResult;
  }

  // Cache miss - fetch from API
  const result = await client.discoverMovies(params);

  // Store in cache
  cache.set(cacheKey, result);

  return result;
}
