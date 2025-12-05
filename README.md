# Movie Agent

An intelligent movie recommendation system that helps users discover movies based on their preferences and shows where they're available to stream in Canada.

## Features

- 🎬 Personalized movie recommendations based on mood, genre, and preferences
- 📺 Real-time streaming availability for Canadian platforms
- ⚡ Fast responses using TMDb MCP integration
- 🎯 Smart filtering by runtime, release year, and streaming platforms
- 🤖 Built with LangChain.js for intelligent agent orchestration

## Prerequisites

- Node.js (v18 or higher)
- TMDb API key ([Get one here](https://www.themoviedb.org/settings/api))
- OpenAI API key (for LangChain LLM)

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd movie-agent

# Install dependencies
npm install

# Copy environment variables template
cp .env.example .env

# Add your API keys to .env
```

## Configuration

Create a `.env` file with the following variables:

```bash
# TMDb MCP Configuration
TMDB_API_KEY=your_tmdb_api_key_here
TMDB_MCP_SERVER_URL=http://localhost:3000
TMDB_REGION=CA

# LangChain Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Application Settings
CACHE_TTL=86400
MAX_RECOMMENDATIONS=5
MIN_RECOMMENDATIONS=3
```

## Usage

### Quick Start

```bash
# Run the agent in development mode
npm run dev

# Run the agent in production mode
npm start

# Build for production
npm run build
npm run start:prod
```

### Programmatic Usage

```javascript
import { MovieAgent } from 'movie-agent';

const agent = new MovieAgent();

// Get recommendations based on mood
const recommendations = await agent.getRecommendations({
  mood: 'excited',
  platforms: ['Netflix', 'Prime Video'],
  runtime: { max: 150 },
  releaseYear: { from: 2020, to: 2024 }
});

console.log(recommendations);
```

### API Examples

```javascript
// Example 1: Simple mood-based search
await agent.getRecommendations({
  mood: 'happy'
});

// Example 2: Genre-specific with platform filter
await agent.getRecommendations({
  genre: 'Action',
  platforms: ['Disney+']
});

// Example 3: Complex filtering
await agent.getRecommendations({
  mood: 'adventurous',
  platforms: ['Netflix', 'Prime Video', 'Crave'],
  runtime: { min: 90, max: 150 },
  releaseYear: 2023
});

// Example 4: Multiple genres
await agent.getRecommendations({
  genre: ['Comedy', 'Romance'],
  platforms: ['Netflix'],
  runtime: { max: 120 }
});
```

## Architecture

The Movie Agent uses:
- **TMDb MCP** - Single source for movie metadata and streaming availability
- **LangChain.js** - Agent orchestration and LLM integration
- **Caching Layer** - 24-hour cache for improved performance
- **Mood Mapper** - Intelligent mood-to-genre conversion

See [spec.md](./spec.md) for detailed technical specifications.

## Example

```javascript
const agent = new MovieAgent();

const recommendations = await agent.getRecommendations({
  mood: 'excited',
  platforms: ['Netflix', 'Prime Video'],
  runtime: { max: 150 }
});

console.log(recommendations);
```

## Supported Streaming Platforms (Canada)

- Netflix
- Prime Video
- Crave
- Disney+
- Apple TV+
- Paramount+
- Hayu
- Tubi
- Pluto TV

## Development

### Code Quality

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
- [OpenAI](https://openai.com/) for LLM capabilities
