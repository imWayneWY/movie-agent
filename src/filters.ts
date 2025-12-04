// src/filters.ts
import { MovieDetails } from './tmdbApi';

/**
 * Runtime constraints for filtering movies by duration
 */
export interface RuntimeConstraints {
  min?: number; // minimum runtime in minutes
  max?: number; // maximum runtime in minutes
}

/**
 * Year range for filtering movies by release year
 */
export interface YearRange {
  from?: number; // start year (inclusive)
  to?: number;   // end year (inclusive)
}

/**
 * Filter a movie by checking if it's available on any of the user's platforms
 * @param movie The movie object with available platforms
 * @param userPlatforms Array of platform names the user has access to
 * @returns true if the movie is available on at least one of the user's platforms
 */
export function filterByPlatforms(
  movie: { platforms?: string[] },
  userPlatforms: string[]
): boolean {
  if (!movie.platforms || movie.platforms.length === 0) {
    return false;
  }
  
  if (!userPlatforms || userPlatforms.length === 0) {
    return false;
  }

  // Check if any of the movie's platforms match any of the user's platforms
  return movie.platforms.some(platform => 
    userPlatforms.includes(platform)
  );
}

/**
 * Filter a movie by runtime constraints
 * @param movie The movie object with runtime information
 * @param constraints Runtime constraints (min and/or max)
 * @returns true if the movie's runtime satisfies the constraints
 */
export function filterByRuntime(
  movie: { runtime?: number },
  constraints: RuntimeConstraints
): boolean {
  // If runtime is not specified, we can't filter
  if (movie.runtime === undefined || movie.runtime === null) {
    return false;
  }

  const { min, max } = constraints;

  // Check minimum runtime constraint
  if (min !== undefined && movie.runtime < min) {
    return false;
  }

  // Check maximum runtime constraint
  if (max !== undefined && movie.runtime > max) {
    return false;
  }

  return true;
}

/**
 * Filter a movie by release year
 * @param movie The movie object with release_date
 * @param year Either a specific year (number) or a year range object
 * @returns true if the movie's release year matches the criteria
 */
export function filterByYear(
  movie: { release_date?: string },
  year: number | YearRange
): boolean {
  if (!movie.release_date) {
    return false;
  }

  // Extract year from release_date (format: YYYY-MM-DD)
  const releaseYear = parseInt(movie.release_date.split('-')[0], 10);
  
  if (isNaN(releaseYear)) {
    return false;
  }

  // If year is a number, check for exact match
  if (typeof year === 'number') {
    return releaseYear === year;
  }

  // If year is a range, check if release year falls within range
  const { from, to } = year;

  if (from !== undefined && releaseYear < from) {
    return false;
  }

  if (to !== undefined && releaseYear > to) {
    return false;
  }

  return true;
}

/**
 * Options for filtering movies
 */
export interface FilterOptions {
  platforms?: string[];
  runtime?: RuntimeConstraints;
  year?: number | YearRange;
}

/**
 * Apply multiple filters to an array of movies
 * @param movies Array of movies to filter
 * @param options Filter options to apply
 * @returns Filtered array of movies that pass all specified filters
 */
export function applyFilters<T extends { platforms?: string[]; runtime?: number; release_date?: string }>(
  movies: T[],
  options: FilterOptions
): T[] {
  let filtered = movies;

  // Apply platform filter if specified
  if (options.platforms && options.platforms.length > 0) {
    filtered = filtered.filter(movie => 
      filterByPlatforms(movie, options.platforms!)
    );
  }

  // Apply runtime filter if specified
  if (options.runtime) {
    filtered = filtered.filter(movie => 
      filterByRuntime(movie, options.runtime!)
    );
  }

  // Apply year filter if specified
  if (options.year !== undefined) {
    filtered = filtered.filter(movie => 
      filterByYear(movie, options.year!)
    );
  }

  return filtered;
}
