# Movie Agent Specification

## 1. Purpose and Scope

### 1.1 Purpose
The Movie Agent is an intelligent recommendation system designed to help users discover movies based on their preferences and immediately know where they can stream them in Canada. The agent provides personalized recommendations by considering user mood, available streaming platforms, genre preferences, runtime constraints, and release year preferences.

### 1.2 Scope
- **In Scope:**
  - Movie recommendations only (no TV shows, documentaries, or short films)
  - Streaming availability specific to Canada
  - Integration with TMDb MCP for movie metadata and streaming availability
  - Support for multiple input parameters (all optional)
  - Natural language processing for user mood interpretation

- **Out of Scope:**
  - TV shows, series, or episodic content
  - Rental or purchase options (focus on streaming only)
  - International streaming availability outside Canada
  - User account management or watch history tracking
  - Movie ratings or reviews aggregation

## 2. Functional Requirements

### 2.1 Input Parameters
All input parameters are optional. The agent should handle any combination of the following:

| Parameter | Type | Description | Examples |
|-----------|------|-------------|----------|
| User Mood | String | Emotional state or desired feeling | "happy", "thoughtful", "excited", "relaxed", "adventurous" |
| Streaming Platforms | Array<String> | Platforms user has access to | ["Netflix", "Prime Video", "Crave", "Disney+", "Apple TV+"] |
| Genre Preference | String or Array<String> | Preferred movie genres | "Action", "Comedy", ["Drama", "Thriller"] |
| Runtime Constraints | Object | Min/max duration in minutes | { min: 90, max: 120 } |
| Release Year | Number or Range | Year or year range | 2020 or { from: 2015, to: 2023 } |

### 2.2 Output Format
The agent must return 3-5 movie recommendations with the following structure:

```json
{
  "recommendations": [
    {
      "title": "Movie Title",
      "releaseYear": 2023,
      "runtime": 120,
      "description": "A concise 2-3 sentence description of the plot without spoilers.",
      "genres": ["Action", "Thriller"],
      "streamingPlatforms": [
        {
          "name": "Netflix",
          "type": "subscription",
          "available": true
        },
        {
          "name": "Prime Video",
          "type": "subscription",
          "available": true
        }
      ],
      "matchReason": "Brief explanation of why this movie was recommended based on user input"
    }
  ],
  "metadata": {
    "requestTimestamp": "2025-12-01T10:30:00Z",
    "totalResults": 5,
    "inputParameters": {
      "mood": "excited",
      "platforms": ["Netflix", "Prime Video"],
      "genre": ["Action"],
      "runtime": { "max": 150 }
    }
  }
}
```

### 2.3 Core Functions

#### 2.3.1 Movie Discovery
- Query TMDb via MCP for movie metadata based on input criteria
- Filter results to match user preferences
- Rank movies based on relevance to input parameters

#### 2.3.2 Streaming Availability Lookup
- Query TMDb MCP for Canadian streaming availability (watch providers)
- Filter by user-specified platforms (if provided)
- Include only movies available on at least one streaming platform in Canada

#### 2.3.3 Mood-to-Genre Mapping
- Interpret user mood and map to appropriate genres
- Example mappings:
  - "happy" → Comedy, Family, Musical
  - "thoughtful" → Drama, Documentary, Biography
  - "excited" → Action, Adventure, Thriller
  - "relaxed" → Romance, Comedy, Animation
  - "scared" → Horror, Thriller, Mystery

#### 2.3.4 Recommendation Ranking
- Prioritize movies based on:
  1. Match to user mood/genre
  2. Availability on user's platforms
  3. Runtime compatibility
  4. Release year preference
  5. Popularity/rating (as tiebreaker)

## 3. Non-Functional Requirements

### 3.1 Performance
- Response time: < 5 seconds for recommendation generation
- API rate limiting: Respect rate limits of TMDb MCP (40 requests per 10 seconds)
- Caching: Cache movie metadata and watch provider data for 24 hours to reduce API calls

### 3.2 Reliability
- Graceful degradation if one API is unavailable
- Fallback to cached data when possible
- Clear error messages for users when recommendations cannot be generated

### 3.3 Usability
- Descriptions must be concise (50-100 words)
- Output format should be easy to scan
- Match reasons should be clear and personalized

### 3.4 Maintainability
- Modular architecture using Langchain.js components
- Clear separation between API integrations
- Comprehensive logging for debugging
- Environment-based configuration for API keys

### 3.5 Security
- Secure storage of API keys using environment variables
- No storage of user personal data
- Input validation to prevent injection attacks

## 4. Example User Flows

### 4.1 Basic Flow: Mood-Based Recommendation
```
User Input:
{
  "mood": "excited"
}

Agent Process:
1. Map "excited" → ["Action", "Adventure", "Thriller"]
2. Query TMDb MCP for popular movies in these genres
3. Check TMDb MCP for Canadian streaming availability (watch providers)
4. Rank and select top 5 movies
5. Return formatted recommendations

Expected Output:
5 action/adventure/thriller movies available to stream in Canada
```

### 4.2 Constrained Flow: Platform-Specific with Runtime Limit
```
User Input:
{
  "platforms": ["Netflix", "Disney+"],
  "runtime": { "max": 120 },
  "genre": "Animation"
}

Agent Process:
1. Query TMDb MCP for animation movies with runtime ≤ 120 minutes
2. Filter TMDb watch provider results for Netflix and Disney+ in Canada
3. Return only movies available on specified platforms
4. Rank by popularity/rating
5. Return top 5 matches

Expected Output:
3-5 animated movies under 2 hours, available on Netflix or Disney+ in Canada
```

### 4.3 Complex Flow: Multiple Constraints
```
User Input:
{
  "mood": "thoughtful",
  "platforms": ["Crave", "Prime Video"],
  "releaseYear": { "from": 2020, "to": 2023 },
  "runtime": { "min": 90, "max": 150 }
}

Agent Process:
1. Map "thoughtful" → ["Drama", "Biography", "Mystery"]
2. Query TMDb MCP with filters: genres, year range (2020-2023), runtime (90-150 min)
3. Check TMDb MCP watch providers for Crave and Prime Video availability in Canada
4. Rank by relevance to mood and popularity
5. Return top 5 recommendations

Expected Output:
3-5 thought-provoking dramas from 2020-2023, 90-150 minutes long, on Crave or Prime Video
```

## 5. API Integration Plan

### 5.1 The Movie Database (TMDb) via MCP
- **Purpose:** Single source for movie metadata and streaming availability
- **Integration Method:** TMDb MCP Server
- **Advantages:**
  - Simplified API access through Model Context Protocol
  - Built-in rate limiting and error handling
  - Structured response parsing
  - No need to manage raw HTTP requests
  - Unified data source for metadata and streaming availability

- **Available Operations:**
  - Discover movies with filters (genre, year, runtime)
  - Get detailed movie information by ID
  - Search movies by title
  - Get genre list
  - Get watch providers (streaming availability) by region

- **Key Data:**
  - Title, release date, runtime
  - Genres, overview (description)
  - Popularity score, vote average
  - Watch providers (streaming platforms) by country
  - Provider details (logo, name, type)

- **Watch Providers Data:**
  - Country-specific availability (CA for Canada)
  - Platform names (Netflix, Prime Video, Crave, Disney+, etc.)
  - Provider type (flatrate/subscription, rent, buy)
  - Real-time availability data from TMDb

- **Rate Limits:** Managed by MCP server (40 requests per 10 seconds)
- **Authentication:** API key configured in MCP server settings

### 5.2 Integration Architecture

```
┌─────────────────┐
│   User Input    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Langchain.js   │
│  Agent Orchestr.│
└────────┬────────┘
         │
    ┌────┴────┬──────────────┬──────────────┐
    ▼         ▼              ▼              ▼
┌────────┐ ┌──────────┐  ┌──────────┐  ┌──────────┐
│ TMDb   │ │  Cache   │  │  Mood    │  │ Ranking  │
│  MCP   │ │  Layer   │  │  Mapper  │  │  Engine  │
│        │ │          │  │          │  │          │
│ • Meta │ │          │  │          │  │          │
│ • Watch│ │          │  │          │  │          │
└────────┘ └──────────┘  └──────────┘  └──────────┘
    │             │              │              │
    └─────────────┴──────────────┴──────────────┘
                     │
                     ▼
            ┌────────────────┐
            │ Response Format│
            │   & Ranking    │
            └────────────────┘
```

### 5.3 Error Handling Strategy

| Scenario | Handling Strategy |
|----------|-------------------|
| TMDb MCP unavailable | Use cached data, return error if no cache |
| Watch providers unavailable | Return recommendations with "Streaming availability unknown" |
| No matches found | Relax constraints progressively (runtime → year → genre → platform) |
| Rate limit exceeded | Use cached results, queue request for retry |
| Invalid API key | Return clear error message, log for admin |
| MCP connection error | Retry with exponential backoff, fallback to cache |
| Region not supported | Default to showing all available platforms with note |

## 6. Output Format Specification

### 6.1 Success Response Structure
```typescript
interface MovieRecommendation {
  title: string;
  releaseYear: number;
  runtime: number; // in minutes
  description: string; // 50-100 words
  genres: string[];
  streamingPlatforms: StreamingPlatform[];
  matchReason: string; // Why this was recommended
}

interface StreamingPlatform {
  name: string; // e.g., "Netflix", "Prime Video"
  type: "subscription" | "rental" | "purchase";
  available: boolean;
}

interface AgentResponse {
  recommendations: MovieRecommendation[]; // 3-5 items
  metadata: {
    requestTimestamp: string; // ISO 8601
    totalResults: number;
    inputParameters: UserInput;
  };
}
```

### 6.2 Error Response Structure
```typescript
interface ErrorResponse {
  error: true;
  message: string; // User-friendly error message
  code: string; // Error code for logging
  suggestions?: string[]; // Optional recovery suggestions
  timestamp: string; // ISO 8601
}
```

### 6.3 Display Format (Human-Readable)
```
🎬 Movie Recommendations for You

1. **The Grand Adventure** (2023) • 118 min
   Genres: Action, Adventure
   
   A thrilling journey across uncharted territories where a team of 
   explorers must work together to survive against all odds.
   
   📺 Available on: Netflix, Prime Video
   ✨ Why: Perfect for your excited mood with non-stop action
   
───────────────────────────────────────────────────────────

2. **City Lights Rising** (2022) • 105 min
   Genres: Action, Thriller
   
   An intense urban thriller following a detective racing against time
   to prevent a city-wide catastrophe.
   
   📺 Available on: Crave
   ✨ Why: High-energy thriller matching your excitement
```

## 7. Test-Driven Development (TDD)

### 7.1 Unit Tests

#### 7.1.1 Mood Mapping Tests
```javascript
describe('Mood to Genre Mapping', () => {
  test('should map "excited" to action genres', () => {
    const genres = moodToGenres('excited');
    expect(genres).toContain('Action');
    expect(genres).toContain('Adventure');
  });

  test('should handle unknown moods gracefully', () => {
    const genres = moodToGenres('unknown-mood');
    expect(genres).toEqual([]);
  });

  test('should return unique genres', () => {
    const genres = moodToGenres('happy');
    expect(new Set(genres).size).toBe(genres.length);
  });
});
```

#### 7.1.2 Runtime Filter Tests
```javascript
describe('Runtime Filtering', () => {
  test('should filter movies within runtime range', () => {
    const movies = [
      { title: 'Short', runtime: 80 },
      { title: 'Medium', runtime: 120 },
      { title: 'Long', runtime: 180 }
    ];
    const filtered = filterByRuntime(movies, { min: 90, max: 150 });
    expect(filtered).toHaveLength(1);
    expect(filtered[0].title).toBe('Medium');
  });

  test('should handle missing runtime data', () => {
    const movies = [{ title: 'Unknown', runtime: null }];
    const filtered = filterByRuntime(movies, { max: 120 });
    expect(filtered).toHaveLength(0);
  });
});
```

#### 7.1.3 Platform Matching Tests
```javascript
describe('Streaming Platform Filtering', () => {
  test('should filter by user platforms', () => {
    const movie = {
      title: 'Test Movie',
      platforms: ['Netflix', 'Crave']
    };
    expect(isAvailableOnPlatforms(movie, ['Netflix'])).toBe(true);
    expect(isAvailableOnPlatforms(movie, ['Disney+'])).toBe(false);
  });

  test('should match if any user platform matches', () => {
    const movie = {
      title: 'Test Movie',
      platforms: ['Prime Video']
    };
    expect(isAvailableOnPlatforms(movie, ['Netflix', 'Prime Video'])).toBe(true);
  });
});
```

### 7.2 Integration Tests

#### 7.2.1 TMDb API Integration
```javascript
describe('TMDb API Integration', () => {
  test('should fetch movies by genre', async () => {
    const movies = await fetchMoviesByGenre(['Action'], { limit: 5 });
    expect(movies).toHaveLength(5);
    expect(movies[0]).toHaveProperty('title');
    expect(movies[0]).toHaveProperty('runtime');
  });

  test('should handle API errors gracefully', async () => {
    // Mock API failure
    const result = await fetchMoviesByGenre(['InvalidGenre']);
    expect(result.error).toBeDefined();
  });

  test('should respect rate limits', async () => {
    const requests = Array(50).fill(null).map(() => 
      fetchMoviesByGenre(['Comedy'])
    );
    await expect(Promise.all(requests)).resolves.toBeDefined();
  });
});
```

#### 7.2.2 TMDb Watch Providers Integration
```javascript
describe('TMDb Watch Providers Integration', () => {
  test('should fetch Canadian streaming availability', async () => {
    const movieId = 27205; // Inception
    const providers = await getWatchProviders(movieId, 'CA');
    expect(providers).toHaveProperty('results');
    expect(providers.results).toHaveProperty('CA');
  });

  test('should return empty object when not available in region', async () => {
    const movieId = 999999; // Non-existent
    const providers = await getWatchProviders(movieId, 'CA');
    expect(providers.results).toEqual({});
  });

  test('should filter by platform type (flatrate/subscription)', async () => {
    const movieId = 27205;
    const providers = await getWatchProviders(movieId, 'CA');
    if (providers.results.CA) {
      expect(providers.results.CA).toHaveProperty('flatrate');
    }
  });
});
```

### 7.3 End-to-End Tests

#### 7.3.1 Complete Recommendation Flow
```javascript
describe('Movie Agent E2E', () => {
  test('should return recommendations with all inputs', async () => {
    const input = {
      mood: 'excited',
      platforms: ['Netflix'],
      genre: 'Action',
      runtime: { max: 150 }
    };
    
    const response = await movieAgent.getRecommendations(input);
    
    expect(response.recommendations).toHaveLength.greaterThanOrEqual(3);
    expect(response.recommendations).toHaveLength.lessThanOrEqual(5);
    
    response.recommendations.forEach(movie => {
      expect(movie).toHaveProperty('title');
      expect(movie).toHaveProperty('releaseYear');
      expect(movie).toHaveProperty('runtime');
      expect(movie).toHaveProperty('description');
      expect(movie.streamingPlatforms.length).toBeGreaterThan(0);
      expect(movie.runtime).toBeLessThanOrEqual(150);
    });
  });

  test('should work with minimal input', async () => {
    const response = await movieAgent.getRecommendations({ mood: 'happy' });
    expect(response.recommendations.length).toBeGreaterThanOrEqual(3);
  });

  test('should handle no matches scenario', async () => {
    const input = {
      genre: 'NonExistentGenre',
      releaseYear: 1800,
      runtime: { min: 1, max: 2 }
    };
    
    const response = await movieAgent.getRecommendations(input);
    expect(response.error).toBeDefined();
    expect(response.suggestions).toBeDefined();
  });
});
```

### 7.4 Performance Tests

```javascript
describe('Performance Requirements', () => {
  test('should return results within 5 seconds', async () => {
    const startTime = Date.now();
    await movieAgent.getRecommendations({ mood: 'excited' });
    const endTime = Date.now();
    
    expect(endTime - startTime).toBeLessThan(5000);
  });

  test('should use caching effectively', async () => {
    // First call - uncached
    const start1 = Date.now();
    await movieAgent.getRecommendations({ genre: 'Comedy' });
    const duration1 = Date.now() - start1;

    // Second call - cached
    const start2 = Date.now();
    await movieAgent.getRecommendations({ genre: 'Comedy' });
    const duration2 = Date.now() - start2;

    expect(duration2).toBeLessThan(duration1 * 0.5);
  });
});
```

### 7.5 Validation Tests

```javascript
describe('Input Validation', () => {
  test('should validate runtime constraints', () => {
    expect(() => validateInput({ runtime: { min: 200, max: 100 } }))
      .toThrow('min runtime cannot exceed max runtime');
  });

  test('should validate platform names', () => {
    expect(() => validateInput({ platforms: ['InvalidPlatform'] }))
      .toThrow('Invalid streaming platform');
  });

  test('should validate year range', () => {
    expect(() => validateInput({ releaseYear: { from: 2025, to: 2020 } }))
      .toThrow('Invalid year range');
  });

  test('should accept valid inputs', () => {
    const validInput = {
      mood: 'happy',
      platforms: ['Netflix'],
      genre: 'Comedy',
      runtime: { max: 120 }
    };
    expect(() => validateInput(validInput)).not.toThrow();
  });
});
```

### 7.6 Test Coverage Goals

- **Unit Tests:** ≥ 90% code coverage
- **Integration Tests:** All API endpoints tested
- **E2E Tests:** All user flows covered
- **Performance Tests:** Response time requirements validated
- **Edge Cases:** Error handling and boundary conditions tested

### 7.7 Continuous Testing Strategy

1. **Pre-commit:** Run unit tests
2. **CI Pipeline:** Run all tests on every commit
3. **Nightly:** Run full E2E test suite with live APIs
4. **Weekly:** Performance regression tests
5. **Monthly:** API integration health checks

## 8. Technical Implementation with Langchain.js

### 8.1 Core Components

```typescript
import { ChatOpenAI } from "@langchain/openai";
import { StructuredOutputParser } from "langchain/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";

// Agent tools
- TMDbTool: Query movie metadata and watch providers
- MoodMapperTool: Convert mood to genres
- RankingTool: Score and rank recommendations
- CacheTool: Manage cached data for performance
```

### 8.2 Agent Architecture

```
LangChain Agent
├── Tools
│   ├── TMDbSearchTool (metadata + watch providers)
│   ├── MoodAnalyzerTool
│   ├── MovieRankerTool
│   └── CacheManagementTool
├── Memory (for caching)
├── Output Parser (structured response)
└── Prompt Template
```

## 9. Configuration

### 9.1 Environment Variables
```bash
# TMDb MCP Configuration
TMDB_API_KEY=your_tmdb_key
TMDB_MCP_SERVER_URL=http://localhost:3000 (if using remote MCP)
TMDB_REGION=CA (for Canadian watch providers)

# LangChain Configuration
OPENAI_API_KEY=your_openai_key (for LangChain LLM)

# Application Settings
CACHE_TTL=86400 (24 hours in seconds)
MAX_RECOMMENDATIONS=5
MIN_RECOMMENDATIONS=3
```

### 9.2 Supported Streaming Platforms (Canada)
- Netflix
- Prime Video (Amazon)
- Crave
- Disney+
- Apple TV+
- Paramount+
- Hayu
- Tubi
- Pluto TV

## 10. Future Enhancements (Out of v1 Scope)

- Multi-language support (French for Quebec)
- TV show recommendations
- Watch party suggestions for groups
- Integration with user watch history
- Price comparison for rental options
- Trailer previews
- Similar movie suggestions
- Save/export recommendations

## 11. Success Metrics

- **Accuracy:** ≥ 95% of recommendations available on stated platforms
- **Performance:** < 5 second response time for 99% of requests
- **Coverage:** ≥ 90% of queries return 3+ recommendations
- **User Satisfaction:** Clear, concise output that requires no follow-up
- **API Efficiency:** < 10 API calls per recommendation request

---

**Document Version:** 1.0  
**Last Updated:** December 1, 2025  
**Status:** Draft for Implementation
