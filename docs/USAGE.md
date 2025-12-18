# Using movie-agent in Your Project

## Installation

```bash
# Install from local directory during development
npm install ../movie-agent

# Or install from GitHub
npm install github:imWayneWY/movie-agent
```

## Basic Usage

### Option 1: Using MovieAgentFactory.create() with explicit config (Recommended)

This approach gives you full control and doesn't rely on environment variables being loaded by the package itself.

```typescript
import { MovieAgentFactory } from 'movie-agent';

// Load your environment variables first
import dotenv from 'dotenv';
dotenv.config();

// Create agent with explicit configuration
const agent = MovieAgentFactory.create({
  tmdbApiKey: process.env.TMDB_API_KEY!,
  tmdbRegion: 'CA',
  debug: true, // Enable debug logging
});

// Get recommendations
const recommendations = await agent.getRecommendations({
  mood: 'excited',
  genre: 'Action',
  platforms: ['Netflix', 'Prime Video'],
});

console.log(recommendations);
```

### Option 2: Using MovieAgentFactory.fromEnv() convenience method

This method reads environment variables automatically, but you must load your .env file first.

```typescript
import { MovieAgentFactory } from 'movie-agent';
import dotenv from 'dotenv';

// IMPORTANT: Load your .env file BEFORE creating the agent
dotenv.config();

// Create agent from environment variables
const agent = MovieAgentFactory.fromEnv(true); // true = enable debug logging

// Get recommendations
const recommendations = await agent.getRecommendations({
  mood: 'relaxed',
  genre: ['Comedy', 'Romance'],
  runtime: { max: 120 },
});
```

## Example: Next.js API Route

```typescript
// pages/api/recommendations.ts
import { MovieAgentFactory } from 'movie-agent';
import type { NextApiRequest, NextApiResponse } from 'next';

// Create agent once (singleton pattern)
const agent = MovieAgentFactory.create({
  tmdbApiKey: process.env.TMDB_API_KEY!,
  tmdbRegion: process.env.TMDB_REGION || 'CA',
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { mood, genre, platforms } = req.body;

    const recommendations = await agent.getRecommendations({
      mood,
      genre,
      platforms,
    });

    res.status(200).json(recommendations);
  } catch (error) {
    console.error('Error getting recommendations:', error);
    res.status(500).json({ error: 'Failed to get recommendations' });
  }
}
```

## Example: Express Server

```typescript
// server.ts
import express from 'express';
import { MovieAgentFactory } from 'movie-agent';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

// Create agent instance
const agent = MovieAgentFactory.create({
  tmdbApiKey: process.env.TMDB_API_KEY!,
  tmdbRegion: 'CA',
  debug: process.env.NODE_ENV === 'development',
});

app.post('/api/recommendations', async (req, res) => {
  try {
    const recommendations = await agent.getRecommendations(req.body);
    res.json(recommendations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to get recommendations' });
  }
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
```

## Configuration Options

### MovieAgentConfig Interface

```typescript
interface MovieAgentConfig {
  // Required
  tmdbApiKey: string;

  // Optional TMDb settings
  tmdbBaseUrl?: string;        // Default: 'https://api.themoviedb.org/3'
  tmdbRegion?: string;         // Default: 'CA'

  // Optional LLM settings (for future features)
  llmProvider?: 'gemini' | 'azure';
  geminiApiKey?: string;
  azureOpenAiApiKey?: string;
  azureOpenAiEndpoint?: string;
  azureOpenAiDeployment?: string;
  openaiApiKey?: string;

  // Optional application settings
  cacheTtl?: number;           // Cache time-to-live in seconds
  maxRecommendations?: number; // Maximum number of recommendations
  minRecommendations?: number; // Minimum number of recommendations

  // Enable debug logging
  debug?: boolean;             // Default: false
}
```

## Environment Variables

Create a `.env` file in your web app project:

```bash
# Required
TMDB_API_KEY=your_tmdb_api_key_here

# Optional
TMDB_BASE_URL=https://api.themoviedb.org/3
TMDB_REGION=CA

# LLM Configuration (optional, for future features)
LLM_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_api_key_here

# Or for Azure OpenAI
# AZURE_OPENAI_API_KEY=your_azure_key
# AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
# AZURE_OPENAI_DEPLOYMENT=your_deployment_name

# Application Settings (optional)
CACHE_TTL=86400
MAX_RECOMMENDATIONS=5
MIN_RECOMMENDATIONS=3
```

## Input Parameters

The `getRecommendations()` method accepts a `UserInput` object:

```typescript
interface UserInput {
  mood?: string;                    // e.g., 'excited', 'relaxed', 'thoughtful'
  genre?: string | string[];        // e.g., 'Action' or ['Action', 'Thriller']
  platforms?: string[];             // e.g., ['Netflix', 'Prime Video']
  runtime?: {
    min?: number;                   // Minimum runtime in minutes
    max?: number;                   // Maximum runtime in minutes
  };
  releaseYear?: number | {          // Single year or range
    from: number;
    to: number;
  };
}
```

## Error Handling

The agent returns typed error responses:

```typescript
const result = await agent.getRecommendations(input);

if ('error' in result) {
  // Handle error
  console.error(`Error: ${result.errorType} - ${result.message}`);
  
  switch (result.errorType) {
    case 'INVALID_API_KEY':
      // Handle invalid API key
      break;
    case 'RATE_LIMIT_EXCEEDED':
      // Handle rate limit
      break;
    case 'NO_RESULTS':
      // No movies found matching criteria
      break;
    // ... other error types
  }
} else {
  // Success! Use recommendations
  console.log(result.recommendations);
}
```

## TypeScript Support

The package is fully typed. Import types as needed:

```typescript
import {
  MovieAgentFactory,
  UserInput,
  AgentResponse,
  MovieRecommendation,
  ErrorResponse,
} from 'movie-agent';
```

## CLI Usage Examples

If you want to run the movie-agent CLI directly (useful for testing or standalone use):

### Basic Commands

```bash
# Get help
npm start -- --help

# Simple mood-based search
npm start -- --mood excited

# Mood with specific genre
npm start -- --mood relaxed --genre Comedy

# Multiple genres
npm start -- --genre "Action,Thriller"

# Filter by streaming platforms
npm start -- --platforms "Netflix,Prime Video"

# Combine mood, genre, and platforms
npm start -- --mood happy --genre Comedy --platforms Netflix
```

### Runtime Filters

```bash
# Movies under 2 hours
npm start -- --genre Action --runtimeMax 120

# Movies between 90-120 minutes
npm start -- --runtimeMin 90 --runtimeMax 120

# Short films for a quick watch
npm start -- --mood relaxed --runtimeMax 90
```

### Year/Release Date Filters

```bash
# Specific year
npm start -- --genre "Sci-Fi" --year 2023

# Year range - recent movies
npm start -- --yearFrom 2020 --yearTo 2024

# Classic movies
npm start -- --genre Drama --yearFrom 1990 --yearTo 2000

# New releases only
npm start -- --mood excited --yearFrom 2024
```

### Complex Queries

```bash
# Recent action thriller on Netflix, under 2 hours
npm start -- --mood excited --genre "Action,Thriller" --platforms Netflix --runtimeMax 120 --yearFrom 2022

# Family-friendly comedy on Disney+, any length
npm start -- --mood happy --genre Comedy --platforms "Disney+"

# Thoughtful drama from the 2010s, over 2 hours
npm start -- --mood thoughtful --genre Drama --yearFrom 2010 --yearTo 2019 --runtimeMin 120

# Weekend binge-worthy series on any platform
npm start -- --mood relaxed --runtimeMax 150 --yearFrom 2020
```

## API Usage Examples

Comprehensive examples of using the API programmatically:

### Example 1: Simple Mood Search

```typescript
const agent = MovieAgentFactory.create({
  tmdbApiKey: process.env.TMDB_API_KEY!,
});

const result = await agent.getRecommendations({
  mood: 'excited'
});
```

### Example 2: Genre-Based Search

```typescript
// Single genre
const actionMovies = await agent.getRecommendations({
  genre: 'Action'
});

// Multiple genres
const actionThrillers = await agent.getRecommendations({
  genre: ['Action', 'Thriller']
});
```

### Example 3: Platform-Specific Search

```typescript
const netflixMovies = await agent.getRecommendations({
  mood: 'relaxed',
  platforms: ['Netflix']
});

const streamingOptions = await agent.getRecommendations({
  genre: 'Comedy',
  platforms: ['Netflix', 'Prime Video', 'Disney+']
});
```

### Example 4: Runtime Filtering

```typescript
// Short movies only
const quickWatch = await agent.getRecommendations({
  mood: 'happy',
  runtime: { max: 90 }
});

// Feature-length films
const featureFilms = await agent.getRecommendations({
  genre: 'Drama',
  runtime: { min: 90, max: 180 }
});

// Epic movies
const epics = await agent.getRecommendations({
  genre: 'Adventure',
  runtime: { min: 150 }
});
```

### Example 5: Release Year Filtering

```typescript
// Specific year
const moviesFrom2023 = await agent.getRecommendations({
  genre: 'Sci-Fi',
  releaseYear: 2023
});

// Year range - recent movies
const recentMovies = await agent.getRecommendations({
  mood: 'excited',
  releaseYear: { from: 2020, to: 2024 }
});

// Classic movies
const classics = await agent.getRecommendations({
  genre: 'Drama',
  releaseYear: { from: 1980, to: 1999 }
});
```

### Example 6: Complex Combinations

```typescript
// Date night movie
const dateNight = await agent.getRecommendations({
  mood: 'romantic',
  genre: ['Romance', 'Comedy'],
  platforms: ['Netflix', 'Prime Video'],
  runtime: { min: 90, max: 120 },
  releaseYear: { from: 2018, to: 2024 }
});

// Family movie night
const familyNight = await agent.getRecommendations({
  mood: 'happy',
  genre: 'Animation',
  platforms: ['Disney+'],
  runtime: { max: 120 }
});

// Thriller marathon
const thrillerMarathon = await agent.getRecommendations({
  mood: 'intense',
  genre: ['Thriller', 'Mystery'],
  runtime: { min: 90, max: 130 },
  releaseYear: { from: 2015, to: 2024 }
});
```

### Example 7: Error Handling

```typescript
const result = await agent.getRecommendations({
  mood: 'excited',
  genre: 'Action',
  platforms: ['Netflix']
});

if ('error' in result) {
  switch (result.errorType) {
    case 'NO_RESULTS':
      console.log('No movies found. Try different criteria.');
      break;
    case 'INVALID_API_KEY':
      console.error('Invalid TMDb API key.');
      break;
    case 'RATE_LIMIT_EXCEEDED':
      console.log('Too many requests. Please wait.');
      break;
    case 'VALIDATION_ERROR':
      console.error('Invalid input:', result.message);
      break;
    default:
      console.error('Unknown error:', result.message);
  }
} else {
  // Success - process recommendations
  result.recommendations.forEach(movie => {
    console.log(`${movie.title} (${movie.releaseYear})`);
    console.log(`Genres: ${movie.genres.join(', ')}`);
    console.log(`Platforms: ${movie.streamingPlatforms.map(p => p.name).join(', ')}`);
    console.log(`Why: ${movie.matchReason}\n`);
  });
}
```

### Example 8: Building a Recommendation UI

```typescript
interface RecommendationFilters {
  mood?: string;
  genres?: string[];
  platforms?: string[];
  maxRuntime?: number;
  minRuntime?: number;
  yearFrom?: number;
  yearTo?: number;
}

async function getMoviesForUI(filters: RecommendationFilters) {
  const input: UserInput = {
    mood: filters.mood,
    genre: filters.genres && filters.genres.length > 0 ? filters.genres : undefined,
    platforms: filters.platforms,
  };

  if (filters.minRuntime || filters.maxRuntime) {
    input.runtime = {
      min: filters.minRuntime,
      max: filters.maxRuntime,
    };
  }

  if (filters.yearFrom || filters.yearTo) {
    input.releaseYear = {
      from: filters.yearFrom || 1900,
      to: filters.yearTo || new Date().getFullYear(),
    };
  }

  const result = await agent.getRecommendations(input);
  
  if ('error' in result) {
    throw new Error(result.message);
  }

  return result.recommendations.map(movie => ({
    id: movie.tmdbId,
    title: movie.title,
    year: movie.releaseYear,
    runtime: movie.runtime,
    genres: movie.genres,
    overview: movie.overview,
    platforms: movie.streamingPlatforms.map(p => ({
      name: p.name,
      available: p.available,
    })),
    reason: movie.matchReason,
  }));
}

// Usage in a web app
const movies = await getMoviesForUI({
  mood: 'excited',
  genres: ['Action', 'Adventure'],
  platforms: ['Netflix', 'Prime Video'],
  maxRuntime: 150,
  yearFrom: 2020,
});
```

## Supported Values

### Moods

Common mood values that map to genres:
- `excited` → Action, Adventure, Thriller
- `happy` → Comedy, Animation, Family
- `relaxed` → Comedy, Romance, Drama
- `thoughtful` → Drama, Documentary, Mystery
- `romantic` → Romance, Drama
- `intense` → Thriller, Horror, Crime
- `adventurous` → Adventure, Action, Fantasy
- `nostalgic` → Classic genres, older films
- `curious` → Documentary, Mystery, Sci-Fi

### Genres

Supported genre values (case-insensitive):
- Action
- Adventure
- Animation
- Comedy
- Crime
- Documentary
- Drama
- Family
- Fantasy
- History
- Horror
- Music
- Mystery
- Romance
- Science Fiction (or "Sci-Fi")
- TV Movie
- Thriller
- War
- Western

### Streaming Platforms

Common platform values (case-sensitive):
- Netflix
- Prime Video
- Disney+
- Apple TV+
- HBO Max
- Hulu
- Paramount+
- Peacock
- Crave
- And many more regional platforms

**Note:** Platform availability is region-specific. The default region is Canada (CA).

## Response Format

### Success Response

```typescript
interface AgentResponse {
  recommendations: MovieRecommendation[];
  metadata?: {
    timestamp?: string;
    inputParameters?: UserInput;
  };
}

interface MovieRecommendation {
  tmdbId: number;
  title: string;
  releaseYear: string;
  runtime: number;
  genres: string[];
  overview: string;
  streamingPlatforms: StreamingPlatform[];
  matchReason: string;
}

interface StreamingPlatform {
  name: string;
  type: 'subscription' | 'rent' | 'buy';
  available: boolean;
}
```

### Error Response

```typescript
interface ErrorResponse {
  error: true;
  errorType: 'VALIDATION_ERROR' | 'INVALID_API_KEY' | 'RATE_LIMIT_EXCEEDED' | 'NO_RESULTS' | 'MCP_UNAVAILABLE' | 'UNKNOWN_ERROR';
  message: string;
  timestamp: string;
  details?: string;
}
```

## Tips for Web Applications

### 1. Cache Recommendations

```typescript
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 3600 }); // 1 hour cache

async function getCachedRecommendations(input: UserInput) {
  const cacheKey = JSON.stringify(input);
  
  const cached = cache.get<AgentResponse>(cacheKey);
  if (cached) {
    return cached;
  }

  const result = await agent.getRecommendations(input);
  if (!('error' in result)) {
    cache.set(cacheKey, result);
  }
  
  return result;
}
```

### 2. Rate Limiting

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests, please try again later.'
});

app.use('/api/recommendations', limiter);
```

### 3. Input Validation

```typescript
import { z } from 'zod';

const RecommendationSchema = z.object({
  mood: z.string().optional(),
  genre: z.union([z.string(), z.array(z.string())]).optional(),
  platforms: z.array(z.string()).optional(),
  runtime: z.object({
    min: z.number().min(0).optional(),
    max: z.number().max(500).optional(),
  }).optional(),
  releaseYear: z.union([
    z.number().min(1900).max(2030),
    z.object({
      from: z.number().min(1900),
      to: z.number().max(2030),
    })
  ]).optional(),
});

// In your API route
try {
  const validatedInput = RecommendationSchema.parse(req.body);
  const result = await agent.getRecommendations(validatedInput);
  res.json(result);
} catch (error) {
  res.status(400).json({ error: 'Invalid input' });
}
```

### 4. Logging and Monitoring

```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

async function getRecommendationsWithLogging(input: UserInput) {
  logger.info('Fetching recommendations', { input });
  
  const startTime = Date.now();
  const result = await agent.getRecommendations(input);
  const duration = Date.now() - startTime;
  
  if ('error' in result) {
    logger.error('Recommendation error', { 
      error: result.errorType, 
      message: result.message,
      duration 
    });
  } else {
    logger.info('Recommendations retrieved', { 
      count: result.recommendations.length,
      duration 
    });
  }
  
  return result;
}
```
