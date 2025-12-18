import dotenv from 'dotenv';
dotenv.config();

export interface Config {
  TMDB_API_KEY: string;
  TMDB_BASE_URL: string;
  TMDB_REGION: string;
  CACHE_TTL: number;
  MAX_RECOMMENDATIONS: number;
  MIN_RECOMMENDATIONS: number;

  // LLM Provider
  LLM_PROVIDER: 'gemini' | 'azure';
  GEMINI_API_KEY?: string;
  AZURE_OPENAI_API_KEY?: string;
  AZURE_OPENAI_ENDPOINT?: string;
  AZURE_OPENAI_DEPLOYMENT?: string;
  OPENAI_API_KEY?: string;
}

function getEnvVar(
  key: string,
  required = false,
  defaultValue?: string
): string | undefined {
  const value = process.env[key];
  if (required && !value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value ?? defaultValue;
}

const LLM_PROVIDER = getEnvVar('LLM_PROVIDER', false, 'gemini')! as
  | 'gemini'
  | 'azure';

const config: Config = {
  TMDB_API_KEY: getEnvVar('TMDB_API_KEY', false) || '',  // Made optional - factory pattern handles this
  TMDB_BASE_URL: getEnvVar(
    'TMDB_BASE_URL',
    false,
    'https://api.themoviedb.org/3'
  )!,
  TMDB_REGION: getEnvVar('TMDB_REGION', false, 'CA')!,
  CACHE_TTL: parseInt(getEnvVar('CACHE_TTL', false, '86400')!, 10),
  MAX_RECOMMENDATIONS: parseInt(
    getEnvVar('MAX_RECOMMENDATIONS', false, '5')!,
    10
  ),
  MIN_RECOMMENDATIONS: parseInt(
    getEnvVar('MIN_RECOMMENDATIONS', false, '3')!,
    10
  ),

  LLM_PROVIDER,
  GEMINI_API_KEY: getEnvVar('GEMINI_API_KEY', false),  // Made optional
  AZURE_OPENAI_API_KEY: getEnvVar(
    'AZURE_OPENAI_API_KEY',
    false
  ),
  AZURE_OPENAI_ENDPOINT: getEnvVar(
    'AZURE_OPENAI_ENDPOINT',
    false
  ),
  AZURE_OPENAI_DEPLOYMENT: getEnvVar(
    'AZURE_OPENAI_DEPLOYMENT',
    false
  ),
  OPENAI_API_KEY: getEnvVar('OPENAI_API_KEY', false),
};

export default config;
