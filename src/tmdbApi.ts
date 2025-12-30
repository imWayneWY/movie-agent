import config from './config';

export interface MovieSummary {
  id: number;
  title: string;
  overview?: string;
  release_date?: string;
  genre_ids?: number[];
  vote_average?: number;
  popularity?: number;
}

export interface DiscoverMoviesParams {
  sort_by?: string;
  with_genres?: string; // comma-separated IDs
  page?: number;
  year?: number;
  'primary_release_date.gte'?: string; // YYYY-MM-DD format
  'primary_release_date.lte'?: string; // YYYY-MM-DD format
  'with_runtime.gte'?: number; // minimum runtime in minutes
  'with_runtime.lte'?: number; // maximum runtime in minutes
  region?: string;
}

export interface DiscoverMoviesResponse {
  page: number;
  results: MovieSummary[];
  total_pages: number;
  total_results: number;
}

export interface MovieDetails extends MovieSummary {
  genres?: { id: number; name: string }[];
  runtime?: number;
  tagline?: string;
  homepage?: string;
}

/**
 * Movie details with embedded watch providers (from append_to_response)
 */
export interface MovieDetailsWithProviders extends MovieDetails {
  'watch/providers'?: WatchProvidersResponse;
}

export interface SearchMoviesResponse extends DiscoverMoviesResponse {}

export interface Genre {
  id: number;
  name: string;
}

export interface GenresResponse {
  genres: Genre[];
}

export interface WatchProvidersResponse {
  id: number;
  results: {
    [countryCode: string]: {
      link?: string;
      flatrate?: { provider_id: number; provider_name: string }[];
      rent?: { provider_id: number; provider_name: string }[];
      buy?: { provider_id: number; provider_name: string }[];
    };
  };
}

export class TmdbApiClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly region: string;

  constructor(baseUrl?: string, apiKey?: string, region?: string) {
    this.baseUrl = baseUrl ?? config.TMDB_BASE_URL;
    this.apiKey = apiKey ?? config.TMDB_API_KEY;
    this.region = region ?? config.TMDB_REGION;
  }

  private buildUrl(
    path: string,
    params?: Record<string, string | number | undefined>
  ): string {
    const normalizedBase = this.baseUrl.endsWith('/')
      ? this.baseUrl
      : this.baseUrl + '/';
    const url = new URL(path, normalizedBase);
    // TMDb v3 API key is now passed via Authorization header for security
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== null) {
          url.searchParams.set(k, String(v));
        }
      }
    }
    return url.toString();
  }

  private async doFetch<T>(url: string): Promise<T> {
    let resp: Response;
    try {
      resp = await fetch(url, {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
      });
    } catch (err: any) {
      throw new Error(
        `Network error calling TMDb API: ${err?.message ?? String(err)}`
      );
    }

    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      throw new Error(
        `TMDb API error ${resp.status}: ${text || resp.statusText}`
      );
    }

    try {
      return (await resp.json()) as T;
    } catch (err: any) {
      throw new Error(
        `Invalid JSON from TMDb API: ${err?.message ?? String(err)}`
      );
    }
  }

  async discoverMovies(
    params: DiscoverMoviesParams = {}
  ): Promise<DiscoverMoviesResponse> {
    const url = this.buildUrl('discover/movie', {
      sort_by: params.sort_by,
      with_genres: params.with_genres,
      page: params.page,
      year: params.year,
      'primary_release_date.gte': params['primary_release_date.gte'],
      'primary_release_date.lte': params['primary_release_date.lte'],
      'with_runtime.gte': params['with_runtime.gte'],
      'with_runtime.lte': params['with_runtime.lte'],
      region: params.region ?? this.region,
    });
    return this.doFetch<DiscoverMoviesResponse>(url);
  }

  async getMovieDetails(movieId: number): Promise<MovieDetails> {
    const url = this.buildUrl(`movie/${movieId}`, { region: this.region });
    return this.doFetch<MovieDetails>(url);
  }

  /**
   * Fetches movie details with watch providers in a single API call
   * Uses append_to_response to reduce API calls
   * @param movieId - TMDb movie ID
   * @returns Movie details with embedded watch providers
   */
  async getMovieDetailsWithProviders(
    movieId: number
  ): Promise<MovieDetailsWithProviders> {
    const url = this.buildUrl(`movie/${movieId}`, {
      region: this.region,
      append_to_response: 'watch/providers',
    });
    return this.doFetch<MovieDetailsWithProviders>(url);
  }

  async searchMovies(
    query: string,
    page?: number
  ): Promise<SearchMoviesResponse> {
    const url = this.buildUrl('search/movie', {
      query,
      page,
      region: this.region,
    });
    return this.doFetch<SearchMoviesResponse>(url);
  }

  async getGenres(): Promise<GenresResponse> {
    const url = this.buildUrl('genre/movie/list', { region: this.region });
    return this.doFetch<GenresResponse>(url);
  }

  async getWatchProviders(movieId: number): Promise<WatchProvidersResponse> {
    const url = this.buildUrl(`movie/${movieId}/watch/providers`);
    return this.doFetch<WatchProvidersResponse>(url);
  }
}

export default TmdbApiClient;
