/**
 * Streaming platform information for a movie
 */
export interface StreamingPlatform {
  /** Platform name (e.g., "Netflix", "Prime Video") */
  name: string;
  /** Type of access (e.g., "subscription", "free", "ads") */
  type: string;
  /** Whether the movie is currently available on this platform */
  available: boolean;
}

/**
 * Runtime constraints for movie filtering
 */
export interface RuntimeConstraints {
  /** Minimum runtime in minutes */
  min?: number;
  /** Maximum runtime in minutes */
  max?: number;
}

/**
 * Release year range for movie filtering
 */
export interface ReleaseYearRange {
  /** Start year (inclusive) */
  from: number;
  /** End year (inclusive) */
  to: number;
}

/**
 * User input parameters for movie recommendations
 */
export interface UserInput {
  /** User's emotional state or desired feeling */
  mood?: string;
  /** Streaming platforms user has access to */
  platforms?: string[];
  /** Preferred genre(s) */
  genre?: string | string[];
  /** Runtime constraints in minutes */
  runtime?: RuntimeConstraints;
  /** Release year or year range */
  releaseYear?: number | ReleaseYearRange;
}

/**
 * Individual movie recommendation
 */
export interface MovieRecommendation {
  /** Movie title */
  title: string;
  /** Year of release */
  releaseYear: number;
  /** Runtime in minutes */
  runtime: number;
  /** Non-spoiler description (50-100 words) */
  description: string;
  /** List of genres */
  genres: string[];
  /** Available streaming platforms */
  streamingPlatforms: StreamingPlatform[];
  /** Explanation of why this movie was recommended */
  matchReason: string;
}

/**
 * Metadata about the recommendation request
 */
export interface ResponseMetadata {
  /** ISO timestamp of when the request was made */
  requestTimestamp: string;
  /** Total number of recommendations returned */
  totalResults: number;
  /** Input parameters used for the request */
  inputParameters: UserInput;
}

/**
 * Complete agent response with recommendations and metadata
 */
export interface AgentResponse {
  /** List of 3-5 movie recommendations */
  recommendations: MovieRecommendation[];
  /** Request metadata */
  metadata: ResponseMetadata;
}

/**
 * Error response structure for handling failures
 */
export interface ErrorResponse {
  /** Error indicator */
  error: true;
  /** Error type category */
  errorType: 'MCP_UNAVAILABLE' | 'INVALID_API_KEY' | 'RATE_LIMIT_EXCEEDED' | 'VALIDATION_ERROR' | 'NO_RESULTS' | 'UNKNOWN_ERROR';
  /** Human-readable error message */
  message: string;
  /** ISO timestamp of when the error occurred */
  timestamp: string;
  /** Optional details for debugging */
  details?: string;
}
