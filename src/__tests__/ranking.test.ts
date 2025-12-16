// src/__tests__/ranking.test.ts
import {
  scoreMovie,
  rankMovies,
  RankableMovie,
  RankingInput,
} from '../ranking';

// Helper function to create test movies
function createMovie(overrides: Partial<RankableMovie>): RankableMovie {
  return {
    id: 1,
    title: 'Test Movie',
    overview: 'A test movie',
    release_date: '2020-01-01',
    genre_ids: [],
    vote_average: 7.0,
    popularity: 100,
    genres: [],
    runtime: 120,
    platforms: [],
    ...overrides,
  };
}

describe('scoreMovie', () => {
  describe('genre matching', () => {
    it('scores high when genres match mood perfectly', () => {
      const movie = createMovie({
        genres: [
          { id: 35, name: 'Comedy' },
          { id: 10751, name: 'Family' },
        ],
      });
      const input: RankingInput = { mood: 'happy' };
      const score = scoreMovie(movie, input);

      // Genre match should be high (Comedy and Family are in happy mood)
      expect(score).toBeGreaterThan(30); // At least partial genre weight
    });

    it('scores zero when no genres match', () => {
      const movie = createMovie({
        genres: [{ id: 27, name: 'Horror' }],
      });
      const input: RankingInput = { mood: 'happy' };
      const score = scoreMovie(movie, input);

      // Should get some points from neutral scores, but not from genre
      expect(score).toBeLessThan(40);
    });

    it('handles explicit genre preferences', () => {
      const movie = createMovie({
        genres: [
          { id: 28, name: 'Action' },
          { id: 12, name: 'Adventure' },
        ],
      });
      const input: RankingInput = { genres: ['Action', 'Adventure'] };
      const score = scoreMovie(movie, input);

      // Perfect genre match should score high
      expect(score).toBeGreaterThan(35);
    });

    it('scores neutrally when no genre preference given', () => {
      const movie = createMovie({
        genres: [{ id: 28, name: 'Action' }],
      });
      const input: RankingInput = {};
      const score = scoreMovie(movie, input);

      // Should get neutral scores across all categories
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThan(60);
    });
  });

  describe('platform matching', () => {
    it('scores high when available on user platform', () => {
      const movie = createMovie({
        platforms: ['Netflix', 'Disney+'],
      });
      const input: RankingInput = { platforms: ['Netflix'] };
      const score = scoreMovie(movie, input);

      // Should get full platform score
      expect(score).toBeGreaterThan(25);
    });

    it('scores zero when not available on any user platform', () => {
      const movie = createMovie({
        platforms: ['HBO Max'],
      });
      const input: RankingInput = { platforms: ['Netflix', 'Disney+'] };
      const score = scoreMovie(movie, input);

      // No platform match, should be low (gets neutral scores elsewhere)
      expect(score).toBeLessThan(35);
    });

    it('scores zero when movie has no platforms', () => {
      const movie = createMovie({
        platforms: [],
      });
      const input: RankingInput = { platforms: ['Netflix'] };
      const score = scoreMovie(movie, input);

      expect(score).toBeLessThan(35);
    });

    it('scores neutrally when no platform preference', () => {
      const movie = createMovie({
        platforms: ['Netflix'],
      });
      const input: RankingInput = {};
      const score = scoreMovie(movie, input);

      expect(score).toBeGreaterThan(0);
    });
  });

  describe('runtime matching', () => {
    it('scores high when runtime is within range', () => {
      const movie = createMovie({
        runtime: 120,
      });
      const input: RankingInput = {
        runtime: { min: 90, max: 150 },
      };
      const score = scoreMovie(movie, input);

      // Perfect runtime match
      expect(score).toBeGreaterThan(10);
    });

    it('scores lower when runtime is outside range', () => {
      const movie = createMovie({
        runtime: 180,
      });
      const input: RankingInput = {
        runtime: { min: 90, max: 120 },
      };
      const score = scoreMovie(movie, input);

      // Should be penalized for being 60 minutes too long
      expect(score).toBeLessThan(45);
    });

    it('handles minimum runtime only', () => {
      const movie = createMovie({
        runtime: 150,
      });
      const input: RankingInput = {
        runtime: { min: 120 },
      };
      const score = scoreMovie(movie, input);

      expect(score).toBeGreaterThan(10);
    });

    it('handles maximum runtime only', () => {
      const movie = createMovie({
        runtime: 90,
      });
      const input: RankingInput = {
        runtime: { max: 120 },
      };
      const score = scoreMovie(movie, input);

      expect(score).toBeGreaterThan(10);
    });

    it('scores zero when runtime is missing', () => {
      const movie = createMovie({
        runtime: undefined,
      });
      const input: RankingInput = {
        runtime: { min: 90, max: 120 },
      };
      const score = scoreMovie(movie, input);

      // Missing runtime should penalize
      expect(score).toBeLessThan(45);
    });
  });

  describe('year matching', () => {
    it('scores high for preferred year exact match', () => {
      const movie = createMovie({
        release_date: '2020-06-15',
      });
      const input: RankingInput = {
        year: { preferred: 2020 },
      };
      const score = scoreMovie(movie, input);

      expect(score).toBeGreaterThan(8);
    });

    it('scores lower for years away from preferred', () => {
      const movie = createMovie({
        release_date: '2010-01-01',
      });
      const input: RankingInput = {
        year: { preferred: 2020 },
      };
      const score = scoreMovie(movie, input);

      // 10 years away should have low year score but gets neutral elsewhere
      expect(score).toBeLessThan(45);
    });

    it('scores high when within year range', () => {
      const movie = createMovie({
        release_date: '2015-03-20',
      });
      const input: RankingInput = {
        year: { from: 2010, to: 2020 },
      };
      const score = scoreMovie(movie, input);

      expect(score).toBeGreaterThan(8);
    });

    it('scores zero when outside year range', () => {
      const movie = createMovie({
        release_date: '2005-01-01',
      });
      const input: RankingInput = {
        year: { from: 2010, to: 2020 },
      };
      const score = scoreMovie(movie, input);

      expect(score).toBeLessThan(45);
    });

    it('handles missing release date', () => {
      const movie = createMovie({
        release_date: undefined,
      });
      const input: RankingInput = {
        year: { preferred: 2020 },
      };
      const score = scoreMovie(movie, input);

      expect(score).toBeLessThan(45);
    });
  });

  describe('popularity as tiebreaker', () => {
    it('includes popularity in score', () => {
      const popularMovie = createMovie({
        popularity: 500,
      });
      const unpopularMovie = createMovie({
        popularity: 10,
      });
      const input: RankingInput = {};

      const popularScore = scoreMovie(popularMovie, input);
      const unpopularScore = scoreMovie(unpopularMovie, input);

      // Popular movie should score slightly higher
      expect(popularScore).toBeGreaterThan(unpopularScore);
    });

    it('handles missing popularity', () => {
      const movie = createMovie({
        popularity: undefined,
      });
      const input: RankingInput = {};

      expect(() => scoreMovie(movie, input)).not.toThrow();
    });
  });

  describe('combined scoring', () => {
    it('scores perfect match movie highest', () => {
      const movie = createMovie({
        genres: [{ id: 35, name: 'Comedy' }],
        platforms: ['Netflix'],
        runtime: 100,
        release_date: '2020-01-01',
        popularity: 500,
      });
      const input: RankingInput = {
        mood: 'happy', // includes Comedy
        platforms: ['Netflix'],
        runtime: { min: 90, max: 120 },
        year: { preferred: 2020 },
      };

      const score = scoreMovie(movie, input);

      // Should score very high with all criteria met
      expect(score).toBeGreaterThan(70);
    });

    it('scores poor match movie lowest', () => {
      const movie = createMovie({
        genres: [{ id: 27, name: 'Horror' }],
        platforms: ['HBO Max'],
        runtime: 180,
        release_date: '1990-01-01',
        popularity: 5,
      });
      const input: RankingInput = {
        mood: 'happy',
        platforms: ['Netflix'],
        runtime: { min: 90, max: 120 },
        year: { preferred: 2020 },
      };

      const score = scoreMovie(movie, input);

      // Should score very low with no criteria met
      expect(score).toBeLessThan(20);
    });
  });
});

describe('rankMovies', () => {
  it('ranks movies in descending order by score', () => {
    const movies: RankableMovie[] = [
      createMovie({
        id: 1,
        title: 'Low Score',
        genres: [{ id: 27, name: 'Horror' }],
        platforms: [],
        popularity: 10,
      }),
      createMovie({
        id: 2,
        title: 'High Score',
        genres: [{ id: 35, name: 'Comedy' }],
        platforms: ['Netflix'],
        popularity: 500,
      }),
      createMovie({
        id: 3,
        title: 'Medium Score',
        genres: [{ id: 35, name: 'Comedy' }],
        platforms: [],
        popularity: 100,
      }),
    ];

    const input: RankingInput = {
      mood: 'happy',
      platforms: ['Netflix'],
    };

    const ranked = rankMovies(movies, input);

    expect(ranked[0].title).toBe('High Score');
    expect(ranked[1].title).toBe('Medium Score');
    expect(ranked[2].title).toBe('Low Score');
  });

  it('handles empty movie list', () => {
    const movies: RankableMovie[] = [];
    const input: RankingInput = { mood: 'happy' };

    const ranked = rankMovies(movies, input);

    expect(ranked).toEqual([]);
  });

  it('maintains order for equal scores', () => {
    const movies: RankableMovie[] = [
      createMovie({
        id: 1,
        title: 'First',
        genres: [{ id: 35, name: 'Comedy' }],
        popularity: 100,
      }),
      createMovie({
        id: 2,
        title: 'Second',
        genres: [{ id: 35, name: 'Comedy' }],
        popularity: 100,
      }),
    ];

    const input: RankingInput = { mood: 'happy' };

    const ranked = rankMovies(movies, input);

    // Both should have similar scores
    expect(ranked).toHaveLength(2);
  });

  it('ranks by platform availability primarily when mood matches', () => {
    const movies: RankableMovie[] = [
      createMovie({
        id: 1,
        title: 'Not Available',
        genres: [{ id: 35, name: 'Comedy' }],
        platforms: ['HBO Max'],
      }),
      createMovie({
        id: 2,
        title: 'Available',
        genres: [{ id: 35, name: 'Comedy' }],
        platforms: ['Netflix'],
      }),
    ];

    const input: RankingInput = {
      mood: 'happy',
      platforms: ['Netflix'],
    };

    const ranked = rankMovies(movies, input);

    expect(ranked[0].title).toBe('Available');
    expect(ranked[1].title).toBe('Not Available');
  });

  it('uses popularity as tiebreaker when all else equal', () => {
    const movies: RankableMovie[] = [
      createMovie({
        id: 1,
        title: 'Less Popular',
        genres: [{ id: 28, name: 'Action' }],
        platforms: ['Netflix'],
        runtime: 120,
        release_date: '2020-01-01',
        popularity: 50,
      }),
      createMovie({
        id: 2,
        title: 'More Popular',
        genres: [{ id: 28, name: 'Action' }],
        platforms: ['Netflix'],
        runtime: 120,
        release_date: '2020-01-01',
        popularity: 500,
      }),
    ];

    const input: RankingInput = {
      genres: ['Action'],
      platforms: ['Netflix'],
      runtime: { min: 100, max: 140 },
      year: { preferred: 2020 },
    };

    const ranked = rankMovies(movies, input);

    expect(ranked[0].title).toBe('More Popular');
    expect(ranked[1].title).toBe('Less Popular');
  });

  it('ranks by multiple criteria correctly', () => {
    const movies: RankableMovie[] = [
      createMovie({
        id: 1,
        title: 'Perfect Match',
        genres: [
          { id: 28, name: 'Action' },
          { id: 53, name: 'Thriller' },
        ],
        platforms: ['Netflix'],
        runtime: 120,
        release_date: '2020-05-15',
        popularity: 800,
      }),
      createMovie({
        id: 2,
        title: 'Good Match',
        genres: [{ id: 28, name: 'Action' }],
        platforms: ['Netflix'],
        runtime: 140,
        release_date: '2019-01-01',
        popularity: 400,
      }),
      createMovie({
        id: 3,
        title: 'Poor Match',
        genres: [{ id: 18, name: 'Drama' }],
        platforms: ['HBO Max'],
        runtime: 200,
        release_date: '2010-01-01',
        popularity: 50,
      }),
      createMovie({
        id: 4,
        title: 'Okay Match',
        genres: [{ id: 28, name: 'Action' }],
        platforms: [],
        runtime: 115,
        release_date: '2020-01-01',
        popularity: 300,
      }),
    ];

    const input: RankingInput = {
      mood: 'excited', // maps to Action, Adventure, Thriller
      platforms: ['Netflix', 'Disney+'],
      runtime: { min: 90, max: 130 },
      year: { preferred: 2020 },
    };

    const ranked = rankMovies(movies, input);

    // Perfect Match should be first (all criteria met)
    expect(ranked[0].title).toBe('Perfect Match');

    // Good Match should be second (on platform, right genre, slightly off runtime/year)
    expect(ranked[1].title).toBe('Good Match');

    // Okay Match should be third (right genre and runtime/year, but no platform)
    expect(ranked[2].title).toBe('Okay Match');

    // Poor Match should be last (wrong genre, wrong platform, wrong runtime, wrong year)
    expect(ranked[3].title).toBe('Poor Match');
  });

  it('handles runtime preference correctly', () => {
    const movies: RankableMovie[] = [
      createMovie({
        id: 1,
        title: 'Too Long',
        runtime: 180,
        genres: [{ id: 35, name: 'Comedy' }],
      }),
      createMovie({
        id: 2,
        title: 'Just Right',
        runtime: 100,
        genres: [{ id: 35, name: 'Comedy' }],
      }),
      createMovie({
        id: 3,
        title: 'Too Short',
        runtime: 60,
        genres: [{ id: 35, name: 'Comedy' }],
      }),
    ];

    const input: RankingInput = {
      mood: 'happy',
      runtime: { min: 90, max: 120 },
    };

    const ranked = rankMovies(movies, input);

    expect(ranked[0].title).toBe('Just Right');
    // Too Short and Too Long should be ranked lower
    expect(ranked[1].title).not.toBe('Just Right');
    expect(ranked[2].title).not.toBe('Just Right');
  });

  it('handles year preference correctly', () => {
    const movies: RankableMovie[] = [
      createMovie({
        id: 1,
        title: 'Recent',
        release_date: '2023-01-01',
        genres: [{ id: 18, name: 'Drama' }],
      }),
      createMovie({
        id: 2,
        title: 'Preferred Year',
        release_date: '2020-01-01',
        genres: [{ id: 18, name: 'Drama' }],
      }),
      createMovie({
        id: 3,
        title: 'Old',
        release_date: '2000-01-01',
        genres: [{ id: 18, name: 'Drama' }],
      }),
    ];

    const input: RankingInput = {
      genres: ['Drama'],
      year: { preferred: 2020 },
    };

    const ranked = rankMovies(movies, input);

    expect(ranked[0].title).toBe('Preferred Year');
    // Recent should be second (closer to 2020 than 2000)
    expect(ranked[1].title).toBe('Recent');
    expect(ranked[2].title).toBe('Old');
  });
});
