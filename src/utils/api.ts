import axios from 'axios';
import { 
  Media, MovieDetails, TVDetails, Episode, Review, Genre, Company, MovieImagesResponse, 
  DownloadV1Response, DownloadV3Response, DownloadV4Response, DownloadV5Response, 
  DownloadV6Response, DownloadV7Response, DownloadV8Response, DownloadV9Response, TVDownloadV1Response, TVDownloadV3Response, 
  TVDownloadV4Response, TVDownloadV5Response, TVDownloadV6Response, TVDownloadV7Response, TVDownloadV8Response 
} from './types';

// Add interface for video response
interface TMDBVideo {
  id: string;
  key: string;
  name: string;
  site: string;
  size: number;
  type: string;
  official: boolean;
  published_at: string;
}

interface TMDBVideoResponse {
  id: number;
  results: TMDBVideo[];
}

// Create axios instance for TMDB
const tmdb = axios.create({
  baseURL: 'https://api.themoviedb.org/3',
  params: {
    api_key: '297f1b91919bae59d50ed815f8d2e14c',
    language: 'en-US'
  }
});

interface TMDBMovieResult {
  id: number;
  title: string;
  name?: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  vote_average: number;
  release_date?: string;
  first_air_date?: string;
  media_type?: 'movie' | 'tv';
  genre_ids: number[];
}

interface TMDBTVResult {
  id: number;
  name: string;
  title?: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  vote_average: number;
  first_air_date: string;
  release_date?: string;
  media_type?: 'movie' | 'tv';
  genre_ids: number[];
}

interface TMDBMovieDetailsResult extends TMDBMovieResult {
  runtime: number;
  genres: Genre[];
  status: string;
  tagline: string;
  budget: number;
  revenue: number;
  production_companies: Company[];
  release_dates?: {
    results: Array<{
      iso_3166_1: string;
      release_dates: Array<{
        certification: string;
      }>;
    }>;
  };
}

interface TMDBTVDetailsResult extends TMDBTVResult {
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
  content_ratings?: {
    results: Array<{
      iso_3166_1: string;
      rating: string;
    }>;
  };
}

const API_KEY = '297f1b91919bae59d50ed815f8d2e14c';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

export const posterSizes = {
  small: `${IMAGE_BASE_URL}/w185`,
  medium: `${IMAGE_BASE_URL}/w342`,
  large: `${IMAGE_BASE_URL}/w500`,
  original: `${IMAGE_BASE_URL}/original`,
};

export const backdropSizes = {
  small: `${IMAGE_BASE_URL}/w300`,
  medium: `${IMAGE_BASE_URL}/w780`,
  large: `${IMAGE_BASE_URL}/w1280`,
  original: `${IMAGE_BASE_URL}/original`,
};

export const videoSources = [
  {
    key: 'videasy',
    name: 'Videasy',
    getMovieUrl: (id: number) => `https://player.videasy.net/movie/${id}`,
    getTVUrl: (id: number, season: number, episode: number) => `https://player.videasy.net/tv/${id}/${season}/${episode}`,
  },
  {
    key: 'vidlink',
    name: 'VidLink',
    getMovieUrl: (id: number) => `https://vidlink.pro/movie/${id}?autoplay=true&title=true`,
    getTVUrl: (id: number, season: number, episode: number) => `https://vidlink.pro/tv/${id}/${season}/${episode}?autoplay=true&title=true`,
  },
  {
    key: 'vidfast',
    name: 'VidFast',
    getMovieUrl: (id: number) => `https://vidfast.pro/movie/${id}?autoPlay=true`,
    getTVUrl: (id: number, season: number, episode: number) => `https://vidfast.pro/tv/${id}/${season}/${episode}?autoPlay=true`,
  },
  {
    key: '111movies',
    name: '111Movies',
    getMovieUrl: (id: number) => `https://111movies.com/movie/${id}`,
    getTVUrl: (id: number, season: number, episode: number) => `https://111movies.com/tv/${id}/${season}/${episode}`,
  },
  {
    key: 'vidsrc-me',
    name: 'VidSrc.me',
    getMovieUrl: (id: number) => `https://vidsrcme.ru/embed/movie/${id}`,
    getTVUrl: (id: number, season: number, episode: number) => `https://vidsrcme.ru/embed/tv/${id}/${season}/${episode}`,
  },
  {
    key: 'smashystream',
    name: 'SmashyStream',
    getMovieUrl: (id: number) => `https://embed.smashystream.com/playere.php?tmdb=${id}`,
    getTVUrl: (id: number, season: number, episode: number) => `https://embed.smashystream.com/playere.php?tmdb=${id}&season=${season}&episode=${episode}`,
  },
  {
    key: 'vidzee',
    name: 'Vidzee',
    getMovieUrl: (id: number) => `https://player.vidzee.wtf/embed/movie/${id}`,
    getTVUrl: (id: number, season: number, episode: number) => `https://player.vidzee.wtf/embed/tv/${id}/${season}/${episode}`,
  },
  {
    key: 'vidup',
    name: 'VidUp',
    getMovieUrl: (id: number) => `https://vidup.to/movie/${id}?autoPlay=true`,
    getTVUrl: (id: number, season: number, episode: number) => `https://vidup.to/tv/${id}/${season}/${episode}?autoPlay=true`,
  },
  {
    key: 'vidnest',
    name: 'Vidnest',
    getMovieUrl: (id: number) => `https://vidnest.fun/movie/${id}`,
    getTVUrl: (id: number, season: number, episode: number) => `https://vidnest.fun/tv/${id}/${season}/${episode}`,
  },
  {
    key: 'vidrock',
    name: 'VidRock',
    getMovieUrl: (id: number) => `https://vidrock.ru/movie/${id}`,
    getTVUrl: (id: number, season: number, episode: number) => `https://vidrock.ru/tv/${id}/${season}/${episode}`,
  },
  {
    key: 'vidscr-wtf',
    name: 'VidScr.wtf',
    getMovieUrl: (id: number) => `https://vidscr.wtf/movie/${id}`,
    getTVUrl: (id: number, season: number, episode: number) => `https://vidscr.wtf/tv/${id}/${season}/${episode}`,
  },
  {
    key: 'vidsrc-wtf-1',
    name: 'VidSrc.wtf (API 1)',
    getMovieUrl: (id: number) => `https://www.vidsrc.wtf/api/1/movie?id=${id}`,
    getTVUrl: (id: number, season: number, episode: number) => `https://www.vidsrc.wtf/api/1/tv?id=${id}&s=${season}&e=${episode}`,
    sandbox: 'allow-scripts allow-same-origin'
  },
  {
    key: 'vidsrc-wtf-2',
    name: 'VidSrc.wtf (API 2)',
    getMovieUrl: (id: number) => `https://www.vidsrc.wtf/api/2/movie?id=${id}`,
    getTVUrl: (id: number, season: number, episode: number) => `https://www.vidsrc.wtf/api/2/tv?id=${id}&s=${season}&e=${episode}`,
    sandbox: 'allow-scripts allow-same-origin'
  },
  {
    key: 'vidsrc-wtf-3',
    name: 'VidSrc.wtf (API 3)',
    getMovieUrl: (id: number) => `https://www.vidsrc.wtf/api/3/movie?id=${id}`,
    getTVUrl: (id: number, season: number, episode: number) => `https://www.vidsrc.wtf/api/3/tv?id=${id}&s=${season}&e=${episode}`,
    sandbox: 'allow-scripts allow-same-origin'
  },
  {
    key: '2embed',
    name: '2Embed',
    getMovieUrl: (id: number) => `https://www.2embed.cc/embed/${id}`,
    getTVUrl: (id: number, season: number, episode: number) => `https://www.2embed.cc/embedtv/${id}&s=${season}&e=${episode}`,
  },
  {
    key: 'multiembed',
    name: 'MultiEmbed',
    getMovieUrl: (id: number) => `https://multiembed.mov/?video_id=${id}&tmdb=1`,
    getTVUrl: (id: number, season: number, episode: number) => `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${season}&e=${episode}`,
  },
  {
    key: 'primesrc',
    name: 'PrimeSrc',
    getMovieUrl: (id: number) => `https://primesrc.me/embed/movie?tmdb=${id}`,
    getTVUrl: (id: number, season: number, episode: number) => `https://primesrc.me/embed/tv?tmdb=${id}&season=${season}&episode=${episode}`,
  },
];
