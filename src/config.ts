import dotenv from 'dotenv';
dotenv.config();

export interface Config {
  TMDB_API_KEY: string;
  TMDB_MCP_SERVER_URL: string;
  TMDB_REGION: string;
  CACHE_TTL: number;
  MAX_RECOMMENDATIONS: number;
  MIN_RECOMMENDATIONS: number;
}

function getEnvVar(key: string, required = false, defaultValue?: string): string | undefined {
  const value = process.env[key];
  if (required && !value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value ?? defaultValue;
}

const config: Config = {
  TMDB_API_KEY: getEnvVar('TMDB_API_KEY', true)!,
  TMDB_MCP_SERVER_URL: getEnvVar('TMDB_MCP_SERVER_URL', true)!,
  TMDB_REGION: getEnvVar('TMDB_REGION', false, 'CA')!,
  CACHE_TTL: parseInt(getEnvVar('CACHE_TTL', false, '86400')!, 10),
  MAX_RECOMMENDATIONS: parseInt(getEnvVar('MAX_RECOMMENDATIONS', false, '5')!, 10),
  MIN_RECOMMENDATIONS: parseInt(getEnvVar('MIN_RECOMMENDATIONS', false, '3')!, 10),
};

export default config;
