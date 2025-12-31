// Input validation utilities for movie-agent

// Maximum length constants to prevent DoS attacks
export const MAX_MOOD_LENGTH = 100;
export const MAX_GENRE_LENGTH = 50;
export const MAX_ARRAY_LENGTH = 10;

export const ALLOWED_PLATFORMS = [
  'Netflix',
  'Prime Video',
  'Crave',
  'Disney+',
  'Apple TV+',
  'Paramount+',
  'Hayu',
  'Tubi',
  'Pluto TV',
];

export function isValidPlatform(name: string): boolean {
  return ALLOWED_PLATFORMS.includes(name);
}

export function validatePlatforms(platforms: string[]): void {
  if (platforms.length > MAX_ARRAY_LENGTH) {
    throw new Error(
      `Too many platforms: maximum ${MAX_ARRAY_LENGTH} allowed, got ${platforms.length}`
    );
  }
  const invalid = platforms.filter(p => !isValidPlatform(p));
  if (invalid.length > 0) {
    throw new Error(`Invalid platform(s): ${invalid.join(', ')}`);
  }
}

export function validateRuntime({
  min,
  max,
}: {
  min?: number;
  max?: number;
}): void {
  if (min !== undefined && max !== undefined && min > max) {
    throw new Error(
      `min runtime (${min}) cannot be greater than max runtime (${max})`
    );
  }
}

export function validateYear(year: number): void {
  if (!Number.isInteger(year) || year < 1800 || year > 2100) {
    throw new Error(`Invalid year: ${year}`);
  }
}

export function validateYearRange({
  from,
  to,
}: {
  from: number;
  to: number;
}): void {
  validateYear(from);
  validateYear(to);
  if (from > to) {
    throw new Error(`Year range invalid: from (${from}) > to (${to})`);
  }
}

export function validateMood(mood: string): void {
  if (typeof mood !== 'string') {
    throw new Error('Mood must be a string');
  }
  if (mood.length === 0) {
    throw new Error('Mood cannot be empty');
  }
  if (mood.length > MAX_MOOD_LENGTH) {
    throw new Error(
      `Mood must be ${MAX_MOOD_LENGTH} characters or less, got ${mood.length}`
    );
  }
}

export function validateGenre(genre: string | string[]): void {
  const genres = Array.isArray(genre) ? genre : [genre];

  if (genres.length > MAX_ARRAY_LENGTH) {
    throw new Error(
      `Too many genres: maximum ${MAX_ARRAY_LENGTH} allowed, got ${genres.length}`
    );
  }

  for (const g of genres) {
    if (typeof g !== 'string') {
      throw new Error('Genre must be a string');
    }
    if (g.length === 0) {
      throw new Error('Genre cannot be empty');
    }
    if (g.length > MAX_GENRE_LENGTH) {
      throw new Error(
        `Genre must be ${MAX_GENRE_LENGTH} characters or less, got ${g.length}`
      );
    }
  }
}
