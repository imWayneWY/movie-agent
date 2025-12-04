// Jest global setup for mocking required environment variables
process.env.TMDB_API_KEY = process.env.TMDB_API_KEY || 'mock_tmdb_api_key';
process.env.GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'mock_gemini_api_key';
process.env.TMDB_BASE_URL = process.env.TMDB_BASE_URL || 'https://api.themoviedb.org/3';
process.env.TMDB_MCP_SERVER_URL = process.env.TMDB_MCP_SERVER_URL || 'http://localhost:3000';
process.env.LLM_PROVIDER = process.env.LLM_PROVIDER || 'gemini';
