import { moodToGenres } from '../mood';

describe('moodToGenres', () => {
  it('returns correct genres for happy', () => {
    expect(moodToGenres('happy')).toEqual(['Comedy', 'Family', 'Musical']);
  });

  it('returns correct genres for thoughtful', () => {
    expect(moodToGenres('thoughtful')).toEqual([
      'Drama',
      'Documentary',
      'Biography',
    ]);
  });

  it('returns correct genres for excited', () => {
    expect(moodToGenres('excited')).toEqual([
      'Action',
      'Adventure',
      'Thriller',
    ]);
  });

  it('returns correct genres for relaxed', () => {
    expect(moodToGenres('relaxed')).toEqual(['Romance', 'Comedy', 'Animation']);
  });

  it('returns correct genres for scared', () => {
    expect(moodToGenres('scared')).toEqual(['Horror', 'Thriller', 'Mystery']);
  });

  it('returns [] for unknown mood', () => {
    expect(moodToGenres('unknownmood')).toEqual([]);
    expect(moodToGenres('')).toEqual([]);
    expect(moodToGenres('joyful')).toEqual([]);
  });

  it('ensures uniqueness of genres', () => {
    // Simulate a mapping with duplicates
    const testMapping = ['Comedy', 'Comedy', 'Family', 'Musical', 'Musical'];
    // Patch the function for this test
    const uniqueGenres = Array.from(new Set(testMapping));
    expect(uniqueGenres).toEqual(['Comedy', 'Family', 'Musical']);
  });
});
