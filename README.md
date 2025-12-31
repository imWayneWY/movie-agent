# Movie Agent

An intelligent movie recommendation system that helps users discover movies based on their preferences and shows where they're available to stream in Canada.

## Features

- 🎬 Personalized movie recommendations based on mood, genre, and preferences
- 🤖 AI-powered output formatting with LangChain and Google Gemini
- 🌊 Streaming and non-streaming output modes
- 📺 Real-time streaming availability for Canadian platforms
- ⚡ Fast responses using TMDb API
- 🎯 Smart filtering by runtime, release year, and streaming platforms
- 📦 Easy integration into web applications and APIs
- 🔒 Multi-tenant cache isolation for secure deployments (see [Cache Isolation Guide](docs/CACHE_ISOLATION.md))

## Prerequisites

- Node.js (v18 or higher)
- TMDb API key ([Get one here](https://www.themoviedb.org/settings/api))
- LLM API key for AI formatting (optional):
  - Google Gemini API key - [Get one here](https://aistudio.google.com/app/apikey)
  - **OR** Azure OpenAI credentials - [Learn more](https://azure.microsoft.com/en-us/products/ai-services/openai-service)

## Installation

```bash
npm install movie-agent
```

## Quick Start

### Basic Usage - Get Structured Data

```typescript
import { MovieAgent } from 'movie-agent';

// Create agent
const agent = new MovieAgent();

// Get structured recommendations
const response = await agent.getRecommendations({
  mood: 'excited',
  platforms: ['Netflix', 'Prime Video'],
});

console.log(response.recommendations);
```

### AI-Formatted Output - Invoke Mode (Waits for complete response)

```typescript
import { MovieAgent } from 'movie-agent';

const agent = new MovieAgent();

// Get AI-formatted markdown output
const output = await agent.invoke({
  mood: 'happy',
  platforms: ['Netflix'],
});

console.log(output); // Formatted markdown string
```

### AI-Formatted Output - Stream Mode (Real-time streaming)

```typescript
import { MovieAgent } from 'movie-agent';

const agent = new MovieAgent();

// Stream AI-formatted output in real-time
await agent.stream({
  mood: 'excited',
  platforms: ['Netflix'],
}, (chunk) => {
  process.stdout.write(chunk); // or update your UI
});
```

### Using with MovieAgentFactory

```typescript
import { MovieAgentFactory } from 'movie-agent';

// Create agent with explicit configuration (Gemini)
const agent = MovieAgentFactory.create({
  tmdbApiKey: process.env.TMDB_API_KEY!,
  tmdbRegion: 'CA',
  llmProvider: 'gemini',
  geminiApiKey: process.env.GEMINI_API_KEY,
  debug: true,
});

// Or use Azure OpenAI
const agentWithAzure = MovieAgentFactory.create({
  tmdbApiKey: process.env.TMDB_API_KEY!,
  tmdbRegion: 'CA',
  llmProvider: 'azure',
  azureOpenAiApiKey: process.env.AZURE_OPENAI_API_KEY,
  azureOpenAiEndpoint: process.env.AZURE_OPENAI_ENDPOINT,
  azureOpenAiDeployment: process.env.AZURE_OPENAI_DEPLOYMENT,
  debug: true,
});

// All three methods available: getRecommendations, invoke, stream
const structured = await agent.getRecommendations({ mood: 'happy' });
const formatted = await agent.invoke({ mood: 'happy' });
await agent.stream({ mood: 'happy' }, (chunk) => console.log(chunk));
```

## API Reference

### MovieAgent Methods

#### `getRecommendations(input: UserInput): Promise<AgentResponse | ErrorResponse>`
Returns structured movie recommendations with metadata.

```typescript
const response = await agent.getRecommendations({
  mood: 'happy',
  platforms: ['Netflix']
});
// Returns: { recommendations: [...], metadata: {...} }
```

#### `invoke(input: UserInput): Promise<string | ErrorResponse>`
Returns AI-formatted markdown output (non-streaming). Waits for complete response before returning.

```typescript
const output = await agent.invoke({
  mood: 'excited',
  platforms: ['Netflix']
});
// Returns: Formatted markdown string
```

#### `stream(input: UserInput, onChunk: (chunk: string) => void): Promise<void | ErrorResponse>`
Streams AI-formatted output in real-time. Best for interactive UIs.

```typescript
await agent.stream({
  mood: 'relaxed',
  platforms: ['Netflix']
}, (chunk) => {
  process.stdout.write(chunk);
});
```

## Input Parameters

```typescript
interface UserInput {
  mood?: string;                    // e.g., 'excited', 'relaxed', 'thoughtful', 'happy', 'scared'
  genre?: string | string[];        // e.g., 'Action' or ['Action', 'Thriller']
  platforms?: string[];             // e.g., ['Netflix', 'Prime Video', 'Disney+']
  runtime?: {
    min?: number;                   // Minimum runtime in minutes
    max?: number;                   // Maximum runtime in minutes
  };
  releaseYear?: number | {          // Single year or range
    from?: number;
    to?: number;
  };
}
```

## Output Comparison

### `getRecommendations()` - Structured Data
```json
{
  "recommendations": [
    {
      "tmdbId": 123,
      "title": "Movie Title",
      "releaseYear": "2024",
      "runtime": 120,
      "genres": ["Action", "Adventure"],
      "description": "...",
      "streamingPlatforms": [...],
      "matchReason": "..."
    }
  ],
  "metadata": {...}
}
```

### `invoke()` / `stream()` - AI-Formatted Markdown
```markdown
Hey there! 👋 Looking for some action-packed thrills? Here are your recommendations:

### **Movie Title (2024)** - 120 minutes
*Genres: Action, Adventure*
A compelling description...
📺 Available on: Netflix
✨ Why: Perfect for your excited mood with thrilling action!
```

## API Examples

```typescript
// Simple mood-based search
await agent.getRecommendations({ mood: 'happy' });

// AI-formatted output
await agent.invoke({ mood: 'happy' });

// Streaming output
await agent.stream({ mood: 'happy' }, (chunk) => console.log(chunk));

// Genre-specific with platform filter
await agent.getRecommendations({
  genre: 'Action',
  platforms: ['Disney+']
});

// Complex filtering
await agent.getRecommendations({
  mood: 'adventurous',
  platforms: ['Netflix', 'Prime Video'],
  runtime: { min: 90, max: 150 },
  releaseYear: { from: 2020, to: 2024 }
});

// Multiple genres
await agent.getRecommendations({
  genre: ['Comedy', 'Romance'],
  platforms: ['Netflix'],
  runtime: { max: 120 }
});
```

## Integration Examples

### Next.js API Route (Structured Data)

```typescript
// pages/api/recommendations.ts
import { MovieAgent } from 'movie-agent';
import type { NextApiRequest, NextApiResponse } from 'next';

const agent = new MovieAgent();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { mood, genre, platforms } = req.body;
    const recommendations = await agent.getRecommendations({ mood, genre, platforms });
    res.status(200).json(recommendations);
  } catch (error) {
    console.error('Error getting recommendations:', error);
    res.status(500).json({ error: 'Failed to get recommendations' });
  }
}
```

### Next.js API Route (AI-Formatted Streaming)

```typescript
// pages/api/recommendations-stream.ts
import { MovieAgent } from 'movie-agent';
import type { NextApiRequest, NextApiResponse } from 'next';

const agent = new MovieAgent();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { mood, genre, platforms } = req.body;
    
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');
    
    await agent.stream({ mood, genre, platforms }, (chunk) => {
      res.write(chunk);
    });
    
    res.end();
  } catch (error) {
    console.error('Error streaming recommendations:', error);
    res.status(500).json({ error: 'Failed to stream recommendations' });
  }
}
```

### Express Server (Streaming)

```typescript
import express from 'express';
import { MovieAgent } from 'movie-agent';

const app = express();
app.use(express.json());

const agent = new MovieAgent();

// Structured data endpoint
app.post('/api/recommendations', async (req, res) => {
  try {
    const recommendations = await agent.getRecommendations(req.body);
    res.json(recommendations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to get recommendations' });
  }
});

// Streaming endpoint
app.post('/api/recommendations/stream', async (req, res) => {
  try {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');
    
    await agent.stream(req.body, (chunk) => {
      res.write(chunk);
    });
    
    res.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to stream recommendations' });
  }
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
```

### React Component with Streaming

```typescript
import { useState } from 'react';

function MovieRecommendations() {
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);

  const getRecommendations = async () => {
    setLoading(true);
    setOutput('');

    const response = await fetch('/api/recommendations/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mood: 'happy', platforms: ['Netflix'] }),
    });

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value);
      setOutput(prev => prev + chunk);
    }

    setLoading(false);
  };

  return (
    <div>
      <button onClick={getRecommendations} disabled={loading}>
        Get Recommendations
      </button>
      <div style={{ whiteSpace: 'pre-wrap' }}>{output}</div>
    </div>
  );
}
```

## Configuration

### Environment Variables

```bash
# Required
TMDB_API_KEY=your_tmdb_api_key_here

# LLM Provider Selection (optional)
LLM_PROVIDER=gemini  # Options: gemini, azure

# Option 1: Google Gemini (for AI-formatted output)
GEMINI_API_KEY=your_gemini_api_key_here

# Option 2: Azure OpenAI (for AI-formatted output)
AZURE_OPENAI_API_KEY=your_azure_openai_api_key_here
AZURE_OPENAI_ENDPOINT=https://your-resource-name.openai.azure.com/
AZURE_OPENAI_DEPLOYMENT=your_deployment_name

# Optional
TMDB_REGION=CA
CACHE_TTL=86400
MAX_RECOMMENDATIONS=5
MIN_RECOMMENDATIONS=3
```

**Note:** If no LLM API key is provided, the `invoke()` and `stream()` methods will use a fallback formatter.

### LLM Provider Configuration

The package supports multiple LLM providers for AI-formatted output:

#### Google Gemini (Default)
```typescript
const agent = MovieAgentFactory.create({
  tmdbApiKey: 'your-tmdb-key',
  llmProvider: 'gemini',
  geminiApiKey: 'your-gemini-key',
});
```

#### Azure OpenAI
```typescript
const agent = MovieAgentFactory.create({
  tmdbApiKey: 'your-tmdb-key',
  llmProvider: 'azure',
  azureOpenAiApiKey: 'your-azure-key',
  azureOpenAiEndpoint: 'https://your-resource.openai.azure.com/',
  azureOpenAiDeployment: 'your-deployment-name',
});
```

#### Using Environment Variables
```bash
# Set LLM_PROVIDER in .env
LLM_PROVIDER=azure
AZURE_OPENAI_API_KEY=your_key
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_DEPLOYMENT=gpt-4
```

```typescript
// Automatically uses Azure OpenAI from environment
const agent = MovieAgentFactory.fromEnv();
```

### Input Parameters

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

```typescript
const result = await agent.getRecommendations(input);

if ('error' in result) {
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
  }
} else {
  // Success! Use recommendations
  console.log(result.recommendations);
}
```

## Supported Streaming Platforms (Canada)

- Netflix
- Prime Video
- Crave
- Disney+
- Apple TV+
- Paramount+
- And many more regional platforms

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
```

### Error Response

```typescript
interface ErrorResponse {
  error: true;
  errorType: 'VALIDATION_ERROR' | 'INVALID_API_KEY' | 'RATE_LIMIT_EXCEEDED' | 'NO_RESULTS' | 'UNKNOWN_ERROR';
  message: string;
  timestamp: string;
}
```

## Development

### For Contributors

If you want to develop or modify this package:

```bash
# Clone the repository
git clone https://github.com/imWayneWY/movie-agent.git
cd movie-agent

# Install dependencies
npm install

# Copy environment variables template
cp .env.example .env

# Add your API keys to .env
```

### Building

```bash
# Type checking
npm run type-check

# Lint code
npm run lint

# Fix linting issues automatically
npm run lint:fix

# Format code
npm run format

# Check formatting without modifying files
npm run format:check

# Run all validations (type-check + lint + coverage)
npm run validate
```

### Building

```bash
# Clean build artifacts
npm run clean

# Build TypeScript to JavaScript
npm run build

# Clean and build (runs validation first)
npm run prebuild && npm run build
```

## Testing

The project follows Test-Driven Development (TDD) practices with comprehensive test coverage.

### Running Tests

```bash
# Run all tests (unit + E2E)
npm test

# Run only unit tests (excludes E2E and live integration tests)
npm run test:unit

# Run E2E tests
npm run test:e2e

# Run live integration tests (requires API keys)
npm run test:integration

# Run tests with coverage report
npm run test:coverage

# Run tests in watch mode (for development)
npm run test:watch

# Run tests in CI mode (with coverage)
npm run test:ci
```

### Test Structure

- **Unit Tests** (`src/__tests__/*.test.ts`) - Test individual modules and functions
- **E2E Tests** (`src/__tests__/e2e.test.ts`) - Test complete recommendation pipeline
- **Integration Tests** (`src/__tests__/*.live.test.ts`) - Test with real APIs (requires credentials)

### Coverage Requirements

The project enforces minimum 90% code coverage across:
- Branches: 90%
- Functions: 90%
- Lines: 90%
- Statements: 90%

View coverage report after running tests:
```bash
npm run test:coverage
open coverage/lcov-report/index.html
```

## CI/CD Workflow

### GitHub Actions Example

```yaml
name: CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run type-check
      - run: npm run lint
      - run: npm run test:ci
      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

### Pre-commit Workflow

Recommended pre-commit hook (`.git/hooks/pre-commit`):
```bash
#!/bin/sh
npm run type-check && npm run lint && npm run test:unit
```

### Development Workflow

1. **Create a new branch**
   ```bash
   git checkout -b feature/your-feature
   ```

2. **Make changes with TDD**
   ```bash
   # Write tests first
   npm run test:watch
   # Implement feature
   # Ensure tests pass
   ```

3. **Validate before commit**
   ```bash
   npm run validate
   ```

4. **Commit and push**
   ```bash
   git add .
   git commit -m "feat: your feature description"
   git push origin feature/your-feature
   ```

5. **Create Pull Request**
   - Ensure CI passes
   - Request code review
   - Merge when approved

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT

## Acknowledgments

- [The Movie Database (TMDb)](https://www.themoviedb.org/) for movie data and streaming availability
- [LangChain.js](https://js.langchain.com/) for agent framework
- [Google Gemini](https://ai.google.dev/) and [Azure OpenAI](https://azure.microsoft.com/en-us/products/ai-services/openai-service) for LLM capabilities
