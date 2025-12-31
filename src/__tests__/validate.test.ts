import {
  ALLOWED_PLATFORMS,
  MAX_MOOD_LENGTH,
  MAX_GENRE_LENGTH,
  MAX_ARRAY_LENGTH,
  isValidPlatform,
  validatePlatforms,
  validateRuntime,
  validateYear,
  validateYearRange,
  validateMood,
  validateGenre,
} from '../validate';

describe('validateRuntime', () => {
  it('does not throw if min <= max', () => {
    expect(() => validateRuntime({ min: 90, max: 120 })).not.toThrow();
    expect(() => validateRuntime({ min: 90 })).not.toThrow();
    expect(() => validateRuntime({ max: 120 })).not.toThrow();
    expect(() => validateRuntime({})).not.toThrow();
  });
  it('throws if min > max', () => {
    expect(() => validateRuntime({ min: 130, max: 120 })).toThrow(
      /min runtime/
    );
  });
});

describe('validateYear', () => {
  it('accepts valid years', () => {
    expect(() => validateYear(1999)).not.toThrow();
    expect(() => validateYear(2025)).not.toThrow();
  });
  it('throws for years < 1800 or > 2100', () => {
    expect(() => validateYear(1799)).toThrow(/Invalid year/);
    expect(() => validateYear(2101)).toThrow(/Invalid year/);
  });
  it('throws for non-integer years', () => {
    expect(() => validateYear(2000.5)).toThrow(/Invalid year/);
    expect(() => validateYear(NaN)).toThrow(/Invalid year/);
  });
});

describe('validateYearRange', () => {
  it('accepts valid ranges', () => {
    expect(() => validateYearRange({ from: 2000, to: 2020 })).not.toThrow();
  });
  it('throws if from > to', () => {
    expect(() => validateYearRange({ from: 2021, to: 2020 })).toThrow(
      /Year range invalid/
    );
  });
  it('throws if from or to is invalid', () => {
    expect(() => validateYearRange({ from: 1700, to: 2020 })).toThrow(
      /Invalid year/
    );
    expect(() => validateYearRange({ from: 2000, to: 2200 })).toThrow(
      /Invalid year/
    );
  });
});

describe('validatePlatforms', () => {
  it('accepts allowed platforms', () => {
    expect(() => validatePlatforms(['Netflix', 'Prime Video'])).not.toThrow();
    expect(() => validatePlatforms(ALLOWED_PLATFORMS)).not.toThrow();
  });
  it('throws for any invalid platform', () => {
    expect(() => validatePlatforms(['Netflix', 'FakePlatform'])).toThrow(
      /Invalid platform/
    );
    expect(() => validatePlatforms(['Unknown'])).toThrow(/Invalid platform/);
  });
});

describe('isValidPlatform', () => {
  it('returns true for allowed platforms', () => {
    for (const name of ALLOWED_PLATFORMS) {
      expect(isValidPlatform(name)).toBe(true);
    }
  });
  it('returns false for not allowed platforms', () => {
    expect(isValidPlatform('FakePlatform')).toBe(false);
    expect(isValidPlatform('')).toBe(false);
  });
});

describe('validateMood', () => {
  it('accepts valid mood strings', () => {
    expect(() => validateMood('happy')).not.toThrow();
    expect(() => validateMood('sad and contemplative')).not.toThrow();
    expect(() => validateMood('a'.repeat(MAX_MOOD_LENGTH))).not.toThrow();
  });

  it('throws for empty mood', () => {
    expect(() => validateMood('')).toThrow(/Mood cannot be empty/);
  });

  it('throws for mood exceeding max length', () => {
    const longMood = 'a'.repeat(MAX_MOOD_LENGTH + 1);
    expect(() => validateMood(longMood)).toThrow(
      /Mood must be 100 characters or less/
    );
  });

  it('throws for non-string mood', () => {
    expect(() => validateMood(123 as any)).toThrow(/Mood must be a string/);
    expect(() => validateMood(null as any)).toThrow(/Mood must be a string/);
  });
});

describe('validateGenre', () => {
  it('accepts valid genre strings', () => {
    expect(() => validateGenre('Action')).not.toThrow();
    expect(() => validateGenre('Science Fiction')).not.toThrow();
    expect(() => validateGenre('a'.repeat(MAX_GENRE_LENGTH))).not.toThrow();
  });

  it('accepts valid genre arrays', () => {
    expect(() => validateGenre(['Action', 'Comedy'])).not.toThrow();
    expect(() => validateGenre(['Drama'])).not.toThrow();
    const maxGenres = Array(MAX_ARRAY_LENGTH).fill('Action');
    expect(() => validateGenre(maxGenres)).not.toThrow();
  });

  it('throws for empty genre string', () => {
    expect(() => validateGenre('')).toThrow(/Genre cannot be empty/);
  });

  it('throws for empty genre in array', () => {
    expect(() => validateGenre(['Action', ''])).toThrow(
      /Genre cannot be empty/
    );
  });

  it('throws for genre exceeding max length', () => {
    const longGenre = 'a'.repeat(MAX_GENRE_LENGTH + 1);
    expect(() => validateGenre(longGenre)).toThrow(
      /Genre must be 50 characters or less/
    );
  });

  it('throws for genre array exceeding max length', () => {
    const tooManyGenres = Array(MAX_ARRAY_LENGTH + 1).fill('Action');
    expect(() => validateGenre(tooManyGenres)).toThrow(
      /Too many genres: maximum 10 allowed/
    );
  });

  it('throws for non-string genre in array', () => {
    expect(() => validateGenre(['Action', 123 as any])).toThrow(
      /Genre must be a string/
    );
  });
});

describe('validatePlatforms with array length check', () => {
  it('throws for too many platforms', () => {
    const tooManyPlatforms = Array(MAX_ARRAY_LENGTH + 1).fill('Netflix');
    expect(() => validatePlatforms(tooManyPlatforms)).toThrow(
      /Too many platforms: maximum 10 allowed/
    );
  });
});
