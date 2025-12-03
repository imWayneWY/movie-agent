import {
  ALLOWED_PLATFORMS,
  isValidPlatform,
  validatePlatforms,
  validateRuntime,
  validateYear,
  validateYearRange
} from '../validate';

describe('validateRuntime', () => {
  it('does not throw if min <= max', () => {
    expect(() => validateRuntime({ min: 90, max: 120 })).not.toThrow();
    expect(() => validateRuntime({ min: 90 })).not.toThrow();
    expect(() => validateRuntime({ max: 120 })).not.toThrow();
    expect(() => validateRuntime({})).not.toThrow();
  });
  it('throws if min > max', () => {
    expect(() => validateRuntime({ min: 130, max: 120 })).toThrow(/min runtime/);
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
    expect(() => validateYearRange({ from: 2021, to: 2020 })).toThrow(/Year range invalid/);
  });
  it('throws if from or to is invalid', () => {
    expect(() => validateYearRange({ from: 1700, to: 2020 })).toThrow(/Invalid year/);
    expect(() => validateYearRange({ from: 2000, to: 2200 })).toThrow(/Invalid year/);
  });
});

describe('validatePlatforms', () => {
  it('accepts allowed platforms', () => {
    expect(() => validatePlatforms(["Netflix", "Prime Video"])).not.toThrow();
    expect(() => validatePlatforms(ALLOWED_PLATFORMS)).not.toThrow();
  });
  it('throws for any invalid platform', () => {
    expect(() => validatePlatforms(["Netflix", "FakePlatform"])).toThrow(/Invalid platform/);
    expect(() => validatePlatforms(["Unknown"])).toThrow(/Invalid platform/);
  });
});

describe('isValidPlatform', () => {
  it('returns true for allowed platforms', () => {
    for (const name of ALLOWED_PLATFORMS) {
      expect(isValidPlatform(name)).toBe(true);
    }
  });
  it('returns false for not allowed platforms', () => {
    expect(isValidPlatform("FakePlatform")).toBe(false);
    expect(isValidPlatform("")).toBe(false);
  });
});
