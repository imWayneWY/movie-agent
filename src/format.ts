import {
  MovieRecommendation,
  StreamingPlatform,
  AgentResponse,
  UserInput,
  ResponseMetadata,
} from './types';

/**
 * Builds a concise, non-spoiler description (50-100 words)
 * @param overview - The movie overview from TMDb
 * @returns Formatted description within word count constraints
 */
export function buildDescription(overview: string): string {
  // TODO: Implement intelligent description builder
  // - Truncate to 50-100 words
  // - Avoid spoilers (could use AI or heuristics)
  // - Ensure complete sentences
  
  if (!overview) {
    return 'No description available.';
  }

  const words = overview.split(/\s+/);
  const minWords = 50;
  const maxWords = 100;

  if (words.length <= maxWords) {
    return overview;
  }

  // Truncate to max words and try to end at a sentence boundary
  const truncated = words.slice(0, maxWords).join(' ');
  
  // Find the last sentence-ending punctuation within our limit
  const lastPeriod = truncated.lastIndexOf('.');
  const lastExclamation = truncated.lastIndexOf('!');
  const lastQuestion = truncated.lastIndexOf('?');
  const lastSentenceEnd = Math.max(lastPeriod, lastExclamation, lastQuestion);

  if (lastSentenceEnd > 0) {
    // Check if we have enough words before this point
    const beforeSentenceEnd = truncated.substring(0, lastSentenceEnd + 1);
    const beforeWords = beforeSentenceEnd.split(/\s+/).length;
    
    if (beforeWords >= minWords) {
      return beforeSentenceEnd;
    }
  }

  // If we can't find a good sentence boundary, add ellipsis
  return truncated + '...';
}

/**
 * Formats a movie with streaming providers into a MovieRecommendation
 * @param movie - TMDb movie object with id, title, release_date, runtime, overview, genres
 * @param providers - Streaming provider information
 * @param reason - Why this movie was recommended
 * @returns Formatted MovieRecommendation
 */
export function toRecommendation(
  movie: {
    id: number;
    title: string;
    release_date: string;
    runtime: number;
    overview: string;
    genres: Array<{ id: number; name: string }>;
  },
  providers: StreamingPlatform[],
  reason: string
): MovieRecommendation {
  const releaseYear = new Date(movie.release_date).getFullYear();
  const description = buildDescription(movie.overview);
  const genres = movie.genres.map((g) => g.name);

  return {
    title: movie.title,
    releaseYear,
    runtime: movie.runtime,
    description,
    genres,
    streamingPlatforms: providers,
    matchReason: reason,
  };
}

/**
 * Formats the complete agent response with recommendations and metadata
 * @param recommendations - Array of MovieRecommendation objects (3-5 items)
 * @param metadata - Request metadata including input parameters
 * @returns Complete AgentResponse object
 */
export function formatResponse(
  recommendations: MovieRecommendation[],
  metadata: Omit<ResponseMetadata, 'requestTimestamp' | 'totalResults'>
): AgentResponse {
  // Enforce 3-5 recommendations
  if (recommendations.length < 3 || recommendations.length > 5) {
    throw new Error(
      `Expected 3-5 recommendations, got ${recommendations.length}`
    );
  }

  const response: AgentResponse = {
    recommendations,
    metadata: {
      requestTimestamp: new Date().toISOString(),
      totalResults: recommendations.length,
      inputParameters: metadata.inputParameters,
    },
  };

  return response;
}
