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

```bash
# Run the agent
npm start

# Run in development mode
npm run dev

# Run tests
npm test

# Run tests with coverage
npm run test:coverage
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

```bash
# Lint code
npm run lint

# Format code
npm run format

# Type check
npm run type-check
```

## Testing

The project follows Test-Driven Development (TDD) practices:

```bash
# Run all tests
npm test

# Run unit tests
npm run test:unit

# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e
```

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
