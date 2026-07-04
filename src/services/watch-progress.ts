// /services/watch-history.ts
import axios from 'axios';

const API_BASE_URL = 'https://api.flickystream.ru';

const watchHistoryApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
watchHistoryApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface WatchHistoryItem {
  media_id: string;
  title: string;
  poster_path: string;
  backdrop_path: string;
  media_type: 'movie' | 'tv';
  overview: string;
  rating: number;
  watch_position: number;
  duration: number;
  season: number;
  episode: number;
  created_at: string;
}

export const getWatchHistoryFromAPI = async (
  limit: number = 20,
  offset: number = 0
): Promise<{ items: WatchHistoryItem[]; hasMore: boolean }> => {
  try {
    console.log(`Fetching watch history: limit=${limit}, offset=${offset}`);
    
    const response = await watchHistoryApi.get('/api/watch-history', {
      params: { limit, offset }
    });
    
    console.log('Watch history API response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Failed to fetch watch history:', error);
    
    // Return empty response on error
    return { items: [], hasMore: false };
  }
};