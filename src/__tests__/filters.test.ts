// src/__tests__/filters.test.ts
import {
  filterByPlatforms,
  filterByRuntime,
  filterByYear,
  applyFilters,
  RuntimeConstraints,
  YearRange,
  FilterOptions,
} from '../filters';

describe('filterByPlatforms', () => {
  it('returns true when movie is available on one of user platforms', () => {
    const movie = { platforms: ['Netflix', 'Disney+'] };
    const userPlatforms = ['Netflix', 'Prime Video'];
    expect(filterByPlatforms(movie, userPlatforms)).toBe(true);
  });

  it('returns true when movie is available on all matching platforms', () => {
    const movie = { platforms: ['Netflix'] };
    const userPlatforms = ['Netflix'];
    expect(filterByPlatforms(movie, userPlatforms)).toBe(true);
  });

  it('returns false when movie has no matching platforms', () => {
    const movie = { platforms: ['Hulu', 'HBO Max'] };
    const userPlatforms = ['Netflix', 'Prime Video'];
    expect(filterByPlatforms(movie, userPlatforms)).toBe(false);
  });

  it('returns false when movie has no platforms', () => {
    const movie = { platforms: [] };
    const userPlatforms = ['Netflix'];
    expect(filterByPlatforms(movie, userPlatforms)).toBe(false);
  });

  it('returns false when movie platforms is undefined', () => {
    const movie = {};
    const userPlatforms = ['Netflix'];
    expect(filterByPlatforms(movie, userPlatforms)).toBe(false);
  });

  it('returns false when user has no platforms', () => {
    const movie = { platforms: ['Netflix'] };
    const userPlatforms: string[] = [];
    expect(filterByPlatforms(movie, userPlatforms)).toBe(false);
  });

  it('handles multiple matching platforms', () => {
    const movie = { platforms: ['Netflix', 'Disney+', 'Prime Video'] };
    const userPlatforms = ['Netflix', 'Disney+'];
    expect(filterByPlatforms(movie, userPlatforms)).toBe(true);
  });

  it('is case-sensitive for platform names', () => {
    const movie = { platforms: ['netflix'] };
    const userPlatforms = ['Netflix'];
    expect(filterByPlatforms(movie, userPlatforms)).toBe(false);
  });
});

describe('filterByRuntime', () => {
  it('returns true when runtime is within min and max constraints', () => {
    const movie = { runtime: 120 };
    const constraints: RuntimeConstraints = { min: 90, max: 150 };
    expect(filterByRuntime(movie, constraints)).toBe(true);
  });

  it('returns true when runtime equals min constraint', () => {
    const movie = { runtime: 90 };
    const constraints: RuntimeConstraints = { min: 90, max: 150 };
    expect(filterByRuntime(movie, constraints)).toBe(true);
  });

  it('returns true when runtime equals max constraint', () => {
    const movie = { runtime: 150 };
    const constraints: RuntimeConstraints = { min: 90, max: 150 };
    expect(filterByRuntime(movie, constraints)).toBe(true);
  });

  it('returns false when runtime is below min constraint', () => {
    const movie = { runtime: 80 };
    const constraints: RuntimeConstraints = { min: 90, max: 150 };
    expect(filterByRuntime(movie, constraints)).toBe(false);
  });

  it('returns false when runtime is above max constraint', () => {
    const movie = { runtime: 160 };
    const constraints: RuntimeConstraints = { min: 90, max: 150 };
    expect(filterByRuntime(movie, constraints)).toBe(false);
  });

  it('returns true when only min constraint is specified and runtime is above', () => {
    const movie = { runtime: 120 };
    const constraints: RuntimeConstraints = { min: 90 };
    expect(filterByRuntime(movie, constraints)).toBe(true);
  });

  it('returns false when only min constraint is specified and runtime is below', () => {
    const movie = { runtime: 80 };
    const constraints: RuntimeConstraints = { min: 90 };
    expect(filterByRuntime(movie, constraints)).toBe(false);
  });

  it('returns true when only max constraint is specified and runtime is below', () => {
    const movie = { runtime: 120 };
    const constraints: RuntimeConstraints = { max: 150 };
    expect(filterByRuntime(movie, constraints)).toBe(true);
  });

  it('returns false when only max constraint is specified and runtime is above', () => {
    const movie = { runtime: 160 };
    const constraints: RuntimeConstraints = { max: 150 };
    expect(filterByRuntime(movie, constraints)).toBe(false);
  });

  it('returns true when no constraints are specified', () => {
    const movie = { runtime: 120 };
    const constraints: RuntimeConstraints = {};
    expect(filterByRuntime(movie, constraints)).toBe(true);
  });

  it('returns false when runtime is undefined', () => {
    const movie = {};
    const constraints: RuntimeConstraints = { min: 90, max: 150 };
    expect(filterByRuntime(movie, constraints)).toBe(false);
  });

  it('returns false when runtime is null', () => {
    const movie = { runtime: null as any };
    const constraints: RuntimeConstraints = { min: 90, max: 150 };
    expect(filterByRuntime(movie, constraints)).toBe(false);
  });
});

describe('filterByYear', () => {
  it('returns true when release year matches exact year', () => {
    const movie = { release_date: '2020-05-15' };
    expect(filterByYear(movie, 2020)).toBe(true);
  });

  it('returns false when release year does not match exact year', () => {
    const movie = { release_date: '2020-05-15' };
    expect(filterByYear(movie, 2021)).toBe(false);
  });

  it('returns true when release year is within range', () => {
    const movie = { release_date: '2020-05-15' };
    const yearRange: YearRange = { from: 2018, to: 2022 };
    expect(filterByYear(movie, yearRange)).toBe(true);
  });

  it('returns true when release year equals from year', () => {
    const movie = { release_date: '2018-05-15' };
    const yearRange: YearRange = { from: 2018, to: 2022 };
    expect(filterByYear(movie, yearRange)).toBe(true);
  });

  it('returns true when release year equals to year', () => {
    const movie = { release_date: '2022-05-15' };
    const yearRange: YearRange = { from: 2018, to: 2022 };
    expect(filterByYear(movie, yearRange)).toBe(true);
  });

  it('returns false when release year is before from year', () => {
    const movie = { release_date: '2017-05-15' };
    const yearRange: YearRange = { from: 2018, to: 2022 };
    expect(filterByYear(movie, yearRange)).toBe(false);
  });

  it('returns false when release year is after to year', () => {
    const movie = { release_date: '2023-05-15' };
    const yearRange: YearRange = { from: 2018, to: 2022 };
    expect(filterByYear(movie, yearRange)).toBe(false);
  });

  it('returns true when only from year is specified and release year is after', () => {
    const movie = { release_date: '2020-05-15' };
    const yearRange: YearRange = { from: 2018 };
    expect(filterByYear(movie, yearRange)).toBe(true);
  });

  it('returns false when only from year is specified and release year is before', () => {
    const movie = { release_date: '2017-05-15' };
    const yearRange: YearRange = { from: 2018 };
    expect(filterByYear(movie, yearRange)).toBe(false);
  });

  it('returns true when only to year is specified and release year is before', () => {
    const movie = { release_date: '2020-05-15' };
    const yearRange: YearRange = { to: 2022 };
    expect(filterByYear(movie, yearRange)).toBe(true);
  });

  it('returns false when only to year is specified and release year is after', () => {
    const movie = { release_date: '2023-05-15' };
    const yearRange: YearRange = { to: 2022 };
    expect(filterByYear(movie, yearRange)).toBe(false);
  });

  it('returns true when no year constraints are specified', () => {
    const movie = { release_date: '2020-05-15' };
    const yearRange: YearRange = {};
    expect(filterByYear(movie, yearRange)).toBe(true);
  });

  it('returns false when release_date is undefined', () => {
    const movie = {};
    expect(filterByYear(movie, 2020)).toBe(false);
  });

  it('returns false when release_date is invalid format', () => {
    const movie = { release_date: 'invalid-date' };
    expect(filterByYear(movie, 2020)).toBe(false);
  });

  it('handles different date formats correctly', () => {
    const movie = { release_date: '2020-01-01' };
    expect(filterByYear(movie, 2020)).toBe(true);
  });
});

describe('applyFilters', () => {
  const movies = [
    {
      id: 1,
      title: 'Movie 1',
      platforms: ['Netflix', 'Disney+'],
      runtime: 120,
      release_date: '2020-05-15',
    },
    {
      id: 2,
      title: 'Movie 2',
      platforms: ['Prime Video'],
      runtime: 90,
      release_date: '2019-08-20',
    },
    {
      id: 3,
      title: 'Movie 3',
      platforms: ['Netflix'],
      runtime: 150,
      release_date: '2021-03-10',
    },
    {
      id: 4,
      title: 'Movie 4',
      platforms: ['HBO Max'],
      runtime: 110,
      release_date: '2020-11-05',
    },
    {
      id: 5,
      title: 'Movie 5',
      platforms: ['Disney+'],
      runtime: 95,
      release_date: '2018-06-15',
    },
  ];

  it('returns all movies when no filters are applied', () => {
    const options: FilterOptions = {};
    const result = applyFilters(movies, options);
    expect(result).toEqual(movies);
    expect(result.length).toBe(5);
  });

  it('filters by platforms only', () => {
    const options: FilterOptions = {
      platforms: ['Netflix'],
    };
    const result = applyFilters(movies, options);
    expect(result.length).toBe(2);
    expect(result.map(m => m.id)).toEqual([1, 3]);
  });

  it('filters by runtime only', () => {
    const options: FilterOptions = {
      runtime: { min: 100, max: 130 },
    };
    const result = applyFilters(movies, options);
    expect(result.length).toBe(2);
    expect(result.map(m => m.id)).toEqual([1, 4]);
  });

  it('filters by year only - exact year', () => {
    const options: FilterOptions = {
      year: 2020,
    };
    const result = applyFilters(movies, options);
    expect(result.length).toBe(2);
    expect(result.map(m => m.id)).toEqual([1, 4]);
  });

  it('filters by year only - year range', () => {
    const options: FilterOptions = {
      year: { from: 2019, to: 2020 },
    };
    const result = applyFilters(movies, options);
    expect(result.length).toBe(3);
    expect(result.map(m => m.id)).toEqual([1, 2, 4]);
  });

  it('filters by multiple criteria - platforms and runtime', () => {
    const options: FilterOptions = {
      platforms: ['Netflix', 'Disney+'],
      runtime: { max: 125 },
    };
    const result = applyFilters(movies, options);
    expect(result.length).toBe(2);
    expect(result.map(m => m.id)).toEqual([1, 5]);
  });

  it('filters by multiple criteria - platforms and year', () => {
    const options: FilterOptions = {
      platforms: ['Netflix', 'Disney+'],
      year: { from: 2020 },
    };
    const result = applyFilters(movies, options);
    expect(result.length).toBe(2);
    expect(result.map(m => m.id)).toEqual([1, 3]);
  });

  it('filters by all criteria - platforms, runtime, and year', () => {
    const options: FilterOptions = {
      platforms: ['Netflix', 'Disney+'],
      runtime: { min: 95, max: 125 },
      year: { from: 2020 },
    };
    const result = applyFilters(movies, options);
    expect(result.length).toBe(1);
    expect(result.map(m => m.id)).toEqual([1]);
  });

  it('returns empty array when no movies match filters', () => {
    const options: FilterOptions = {
      platforms: ['Hulu'],
    };
    const result = applyFilters(movies, options);
    expect(result).toEqual([]);
    expect(result.length).toBe(0);
  });

  it('handles empty movie array', () => {
    const options: FilterOptions = {
      platforms: ['Netflix'],
    };
    const result = applyFilters([], options);
    expect(result).toEqual([]);
  });

  it('filters with empty platforms array does not filter', () => {
    const options: FilterOptions = {
      platforms: [],
    };
    const result = applyFilters(movies, options);
    expect(result.length).toBe(5);
  });

  it('filters complex scenario with strict constraints', () => {
    const options: FilterOptions = {
      platforms: ['Netflix', 'Prime Video', 'Disney+'],
      runtime: { min: 90, max: 120 },
      year: { from: 2019, to: 2021 },
    };
    const result = applyFilters(movies, options);
    expect(result.length).toBe(2);
    expect(result.map(m => m.id)).toEqual([1, 2]);
  });

  it('preserves movie properties after filtering', () => {
    const options: FilterOptions = {
      platforms: ['Netflix'],
    };
    const result = applyFilters(movies, options);
    expect(result[0]).toEqual(movies[0]);
    expect(result[0].title).toBe('Movie 1');
    expect(result[0].platforms).toEqual(['Netflix', 'Disney+']);
  });
});
