// Jest global setup for mocking required environment variables

// Load .env.development for live tests if LIVE_TEST=1 is set
if (process.env.LIVE_TEST === '1') {
  require('dotenv').config({ path: '.env.development' });
}

process.env.TMDB_API_KEY = process.env.TMDB_API_KEY || 'mock_tmdb_api_key';
process.env.GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'mock_gemini_api_key';
process.env.TMDB_BASE_URL = process.env.TMDB_BASE_URL || 'https://api.themoviedb.org/3';
process.env.TMDB_MCP_SERVER_URL = process.env.TMDB_MCP_SERVER_URL || 'http://localhost:3000';
process.env.LLM_PROVIDER = process.env.LLM_PROVIDER || 'gemini';
