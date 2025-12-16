// src/ranking.ts
import { MovieDetails } from './tmdbApi';
import { moodToGenres } from './mood';

/**
 * User input for ranking context
 */
export interface RankingInput {
  /** User's mood to match against genres */
  mood?: string;
  /** Explicit genre preferences */
  genres?: string[];
  /** User's available streaming platforms */
  platforms?: string[];
  /** Runtime constraints */
  runtime?: {
    min?: number;
    max?: number;
  };
  /** Release year preferences */
  year?: {
    preferred?: number; // Preferred year (exact match gets bonus)
    from?: number; // Minimum acceptable year
    to?: number; // Maximum acceptable year
  };
}

/**
 * Extended movie type with platforms information
 */
export interface RankableMovie extends MovieDetails {
  platforms?: string[];
}

/**
 * Scoring context derived from input
 */
export interface ScoringContext {
  targetGenres: string[];
  userPlatforms: string[];
  runtimeMin?: number;
  runtimeMax?: number;
  preferredYear?: number;
  yearFrom?: number;
  yearTo?: number;
}

/**
 * Scoring weights for different criteria
 */
const WEIGHTS = {
  GENRE_MATCH: 40, // Mood/genre alignment
  PLATFORM_MATCH: 30, // Platform availability
  RUNTIME_MATCH: 15, // Runtime compatibility
  YEAR_MATCH: 10, // Release year preference
  POPULARITY: 5, // Popularity as tiebreaker
};

/**
 * Build scoring context from user input
 * @param input - User ranking input
 * @returns Scoring context
 */
function buildScoringContext(input: RankingInput): ScoringContext {
  // Determine target genres from mood or explicit genres
  let targetGenres: string[] = [];
  if (input.genres && input.genres.length > 0) {
    targetGenres = input.genres;
  } else if (input.mood) {
    targetGenres = moodToGenres(input.mood);
  }

  return {
    targetGenres,
    userPlatforms: input.platforms || [],
    runtimeMin: input.runtime?.min,
    runtimeMax: input.runtime?.max,
    preferredYear: input.year?.preferred,
    yearFrom: input.year?.from,
    yearTo: input.year?.to,
  };
}

/**
 * Calculate genre match score (0-1)
 * @param movie - Movie to score
 * @param context - Scoring context
 * @returns Score between 0 and 1
 */
function scoreGenreMatch(
  movie: RankableMovie,
  context: ScoringContext
): number {
  if (context.targetGenres.length === 0) {
    return 0.5; // Neutral score if no genre preference
  }

  if (!movie.genres || movie.genres.length === 0) {
    return 0;
  }

  const movieGenreNames = movie.genres.map(g => g.name);
  const matchCount = context.targetGenres.filter(targetGenre =>
    movieGenreNames.includes(targetGenre)
  ).length;

  // Score is the ratio of matched genres to target genres
  return matchCount / context.targetGenres.length;
}

/**
 * Calculate platform availability score (0-1)
 * @param movie - Movie to score
 * @param context - Scoring context
 * @returns Score between 0 and 1
 */
function scorePlatformMatch(
  movie: RankableMovie,
  context: ScoringContext
): number {
  if (context.userPlatforms.length === 0) {
    return 0.5; // Neutral score if no platform preference
  }

  if (!movie.platforms || movie.platforms.length === 0) {
    return 0; // Not available on any platform
  }

  // Check if movie is available on any user platform
  const isAvailable = movie.platforms.some(platform =>
    context.userPlatforms.includes(platform)
  );

  return isAvailable ? 1 : 0;
}

/**
 * Calculate runtime compatibility score (0-1)
 * @param movie - Movie to score
 * @param context - Scoring context
 * @returns Score between 0 and 1
 */
function scoreRuntimeMatch(
  movie: RankableMovie,
  context: ScoringContext
): number {
  if (context.runtimeMin === undefined && context.runtimeMax === undefined) {
    return 0.5; // Neutral score if no runtime preference
  }

  if (movie.runtime === undefined || movie.runtime === null) {
    return 0; // Can't score without runtime info
  }

  const { runtimeMin, runtimeMax } = context;

  // Perfect match if within range
  if (
    (runtimeMin === undefined || movie.runtime >= runtimeMin) &&
    (runtimeMax === undefined || movie.runtime <= runtimeMax)
  ) {
    return 1;
  }

  // Calculate how far outside the range
  let distance = 0;
  if (runtimeMin !== undefined && movie.runtime < runtimeMin) {
    distance = runtimeMin - movie.runtime;
  } else if (runtimeMax !== undefined && movie.runtime > runtimeMax) {
    distance = movie.runtime - runtimeMax;
  }

  // Penalize based on distance (exponential decay)
  // Movies 30+ minutes outside range get very low scores
  return Math.max(0, Math.exp(-distance / 30));
}

/**
 * Calculate release year preference score (0-1)
 * @param movie - Movie to score
 * @param context - Scoring context
 * @returns Score between 0 and 1
 */
function scoreYearMatch(movie: RankableMovie, context: ScoringContext): number {
  if (
    context.preferredYear === undefined &&
    context.yearFrom === undefined &&
    context.yearTo === undefined
  ) {
    return 0.5; // Neutral score if no year preference
  }

  if (!movie.release_date) {
    return 0; // Can't score without release date
  }

  const releaseYear = parseInt(movie.release_date.split('-')[0], 10);
  if (isNaN(releaseYear)) {
    return 0;
  }

  // Perfect match for preferred year
  if (context.preferredYear !== undefined) {
    if (releaseYear === context.preferredYear) {
      return 1;
    }
    // Decay score based on distance from preferred year
    const distance = Math.abs(releaseYear - context.preferredYear);
    return Math.max(0, Math.exp(-distance / 5));
  }

  // Check if within acceptable range
  if (
    (context.yearFrom === undefined || releaseYear >= context.yearFrom) &&
    (context.yearTo === undefined || releaseYear <= context.yearTo)
  ) {
    return 1;
  }

  // Outside range
  return 0;
}

/**
 * Normalize popularity score (0-1)
 * @param movie - Movie to score
 * @returns Normalized score between 0 and 1
 */
function scorePopularity(movie: RankableMovie): number {
  if (movie.popularity === undefined || movie.popularity === null) {
    return 0;
  }

  // TMDb popularity typically ranges from 0-1000+
  // Use logarithmic scale to normalize
  const maxPopularity = 1000;
  const normalized = Math.min(movie.popularity, maxPopularity) / maxPopularity;

  return normalized;
}

/**
 * Calculate overall score for a movie
 * @param movie - Movie to score
 * @param input - User input for ranking
 * @param context - Optional pre-built scoring context
 * @returns Overall score (0-100)
 */
export function scoreMovie(
  movie: RankableMovie,
  input: RankingInput,
  context?: ScoringContext
): number {
  const ctx = context || buildScoringContext(input);

  const genreScore = scoreGenreMatch(movie, ctx);
  const platformScore = scorePlatformMatch(movie, ctx);
  const runtimeScore = scoreRuntimeMatch(movie, ctx);
  const yearScore = scoreYearMatch(movie, ctx);
  const popularityScore = scorePopularity(movie);

  // Calculate weighted total
  const totalScore =
    genreScore * WEIGHTS.GENRE_MATCH +
    platformScore * WEIGHTS.PLATFORM_MATCH +
    runtimeScore * WEIGHTS.RUNTIME_MATCH +
    yearScore * WEIGHTS.YEAR_MATCH +
    popularityScore * WEIGHTS.POPULARITY;

  return totalScore;
}

/**
 * Rank movies by score
 * @param movies - Array of movies to rank
 * @param input - User input for ranking
 * @returns Sorted array of movies (highest score first)
 */
export function rankMovies(
  movies: RankableMovie[],
  input: RankingInput
): RankableMovie[] {
  // Build context once for efficiency
  const context = buildScoringContext(input);

  // Score all movies
  const scoredMovies = movies.map(movie => ({
    movie,
    score: scoreMovie(movie, input, context),
  }));

  // Sort by score (descending)
  scoredMovies.sort((a, b) => b.score - a.score);

  // Return sorted movies
  return scoredMovies.map(item => item.movie);
}
