// src/providers.ts
import TmdbApiClient, { WatchProvidersResponse } from "./tmdbApi";

// Allowed platforms mapping (add more as needed)
const PLATFORM_MAP: Record<string, string> = {
  "Netflix": "Netflix",
  "Amazon Prime Video": "Prime Video",
  "Disney Plus": "Disney+",
  "Crave": "Crave",
  "Apple TV Plus": "Apple TV+",
  "Paramount Plus": "Paramount+",
  "CBC Gem": "CBC Gem",
  "MUBI": "MUBI",
  "hayu": "hayu",
  "fuboTV": "fuboTV",
  // Add more mappings as needed
};

/**
 * Fetch and normalize Canadian watch providers for a movie.
 * @param movieId TMDb movie ID
 * @param region Region code (default: "CA")
 * @param client Optional TmdbApiClient for testing
 * @returns Array of normalized platform names
 */
export async function getCanadianProviders(
  movieId: number | string,
  region = "CA",
  client?: TmdbApiClient
): Promise<string[]> {
  try {
    const apiClient = client ?? new TmdbApiClient();
    const data = await apiClient.getWatchProviders(Number(movieId));
    if (!data || !data.results || !data.results[region]) return [];
    const regionData = data.results[region];
    // Only consider 'flatrate' (subscription) providers
    const flatrate = regionData.flatrate || [];
    if (!Array.isArray(flatrate) || flatrate.length === 0) return [];
    // Map provider names to allowed platforms
    const platforms = flatrate
      .map((p: any) => PLATFORM_MAP[p.provider_name])
      .filter(Boolean);
    // Remove duplicates
    return Array.from(new Set(platforms));
  } catch {
    return [];
  }
}
