/**
 * Maps a mood to an array of movie genres.
 * @param mood - The mood to map.
 * @returns Array of genres, or [] if unknown mood.
 */
export function moodToGenres(mood: string): string[] {
  const mapping: Record<string, string[]> = {
    happy: ['Comedy', 'Family', 'Musical'],
    thoughtful: ['Drama', 'Documentary', 'Biography'],
    excited: ['Action', 'Adventure', 'Thriller'],
    relaxed: ['Romance', 'Comedy', 'Animation'],
    scared: ['Horror', 'Thriller', 'Mystery'],
  };
  const genres = mapping[mood.toLowerCase()] || [];
  // Ensure uniqueness
  return Array.from(new Set(genres));
}
