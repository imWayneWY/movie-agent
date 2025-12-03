// Input validation utilities for movie-agent

export const ALLOWED_PLATFORMS = [
  "Netflix",
  "Prime Video",
  "Crave",
  "Disney+",
  "Apple TV+",
  "Paramount+",
  "Hayu",
  "Tubi",
  "Pluto TV"
];

export function isValidPlatform(name: string): boolean {
  return ALLOWED_PLATFORMS.includes(name);
}

export function validatePlatforms(platforms: string[]): void {
  const invalid = platforms.filter(p => !isValidPlatform(p));
  if (invalid.length > 0) {
    throw new Error(`Invalid platform(s): ${invalid.join(", ")}`);
  }
}

export function validateRuntime({ min, max }: { min?: number; max?: number }): void {
  if (min !== undefined && max !== undefined && min > max) {
    throw new Error(`min runtime (${min}) cannot be greater than max runtime (${max})`);
  }
}

export function validateYear(year: number): void {
  if (!Number.isInteger(year) || year < 1800 || year > 2100) {
    throw new Error(`Invalid year: ${year}`);
  }
}

export function validateYearRange({ from, to }: { from: number; to: number }): void {
  validateYear(from);
  validateYear(to);
  if (from > to) {
    throw new Error(`Year range invalid: from (${from}) > to (${to})`);
  }
}
