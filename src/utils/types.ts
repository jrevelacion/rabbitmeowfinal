export interface Genre {
  id: number;
  name: string;
}

export interface Company {
  id: number;
  name: string;
  logo_path: string | null;
  origin_country: string;
}

export interface Media {
  id: number;
  title?: string;
  name?: string;
  poster_path: string;
  backdrop_path: string;
  overview: string;
  vote_average: number;
  release_date?: string;
  first_air_date?: string;
  media_type: 'movie' | 'tv';
  genre_ids: number[];
}

export interface MovieDetails extends Media {
  runtime: number;
  genres: Genre[];
  status: string;
  tagline: string;
  budget: number;
  revenue: number;
  production_companies: Company[];
  certification?: string;
  logo_path?: string | null;
}

export interface TVDetails extends Media {
  episode_run_time: number[];
  genres: Genre[];
  status: string;
  tagline: string;
  number_of_episodes: number;
  number_of_seasons: number;
  seasons: Array<{
    id: number;
    name: string;
    overview: string;
    poster_path: string | null;
    season_number: number;
    episode_count: number;
  }>;
  production_companies: Company[];
  certification?: string;
  logo_path?: string | null;
}

export interface Episode {
  id: number;
  name: string;
  overview: string;
  still_path: string;
  episode_number: number;
  season_number: number;
  vote_average: number;
  air_date: string;
}

export interface Review {
  id: string;
  author: string;
  content: string;
  created_at: string;
  author_details: {
    rating: number | null;
    avatar_path: string | null;
  };
}

export interface MovieImagesResponse {
  backdrops: any[];
  logos: any[];
  posters: any[];
}

export interface DownloadV1Response {
  [key: string]: any;
}

export interface DownloadV3Response {
  [key: string]: any;
}

export interface DownloadV4Response {
  [key: string]: any;
}

export interface DownloadV5Response {
  [key: string]: any;
}

export interface DownloadV6Response {
  [key: string]: any;
}

export interface DownloadV7Response {
  [key: string]: any;
}

export interface DownloadV8Response {
  [key: string]: any;
}

export interface DownloadV9Response {
  [key: string]: any;
}

export interface TVDownloadV1Response {
  [key: string]: any;
}

export interface TVDownloadV3Response {
  [key: string]: any;
}

export interface TVDownloadV4Response {
  [key: string]: any;
}

export interface TVDownloadV5Response {
  [key: string]: any;
}

export interface TVDownloadV6Response {
  [key: string]: any;
}

export interface TVDownloadV7Response {
  [key: string]: any;
}

export interface TVDownloadV8Response {
  [key: string]: any;
}
