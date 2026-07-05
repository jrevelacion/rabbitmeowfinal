import axios from 'axios';

const API_BASE_URL = 'https://api.flickystream.ru/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// User interface - displayName is the username
export interface User {
  uid: string;
  email: string | null;
  displayName: string | null; // This is the username
  photoURL: string | null;
}

// Cache for preventing duplicate requests
const requestCache = new Map<string, { timestamp: number; promise: Promise<any> }>();
const CACHE_DURATION = 5000; // 5 seconds

// Helper to cache and deduplicate requests
const cachedRequest = async (key: string, requestFn: () => Promise<any>) => {
  const now = Date.now();
  const cached = requestCache.get(key);
  
  if (cached && now - cached.timestamp < CACHE_DURATION) {
    return cached.promise;
  }
  
  const promise = requestFn();
  requestCache.set(key, { timestamp: now, promise });
  
  // Clean up cache after promise resolves
  promise.finally(() => {
    setTimeout(() => {
      requestCache.delete(key);
    }, CACHE_DURATION);
  });
  
  return promise;
};

// Auth functions
export const authService = {
  // Sign up with email, password, and username (displayName)
  async signUp(email: string, password: string, displayName: string): Promise<{ user: User; token: string }> {
    try {
      const response = await api.post('/auth/register', {
        email,
        password,
        displayName // This is the username
      });
      
      const { token, user } = response.data;
      
      // Store token and user in localStorage
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      return { user, token };
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Registration failed');
    }
  },
  

  // Sign in with email OR username
  async signIn(identifier: string, password: string): Promise<{ user: User; token: string }> {
    try {
      // Check if identifier is email (contains @) or username
      const isEmail = identifier.includes('@');
      
      const payload = isEmail 
        ? { email: identifier, password }
        : { displayName: identifier, password };
      
      const response = await api.post('/auth/login', payload);
      
      const { token, user } = response.data;
      
      // Store token and user in localStorage
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      return { user, token };
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Login failed');
    }
  },

  // Check username availability using Firebase
  async checkUsername(username: string): Promise<{ available: boolean; message: string }> {
    try {
      // Import Firebase auth service dynamically to avoid circular dependencies
      const { firebaseAuthService } = await import('./firebase-auth');
      return await firebaseAuthService.checkUsername(username);
    } catch (error: any) {
      console.error('Error checking username:', error);
      throw new Error(error.message || 'Failed to check username availability');
    }
  },

  // Update user profile (username or photo)
  async updateProfile(updates: { displayName?: string; photoURL?: string }): Promise<User> {
    try {
      const response = await api.patch('/auth/update-profile', updates);
      const user = response.data.user;
      
      // Update stored user data
      localStorage.setItem('user', JSON.stringify(user));
      
      return user;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to update profile');
    }
  },

  // Update only display name (username)
  async updateDisplayName(displayName: string): Promise<User> {
    try {
      const response = await api.patch('/auth/display-name', { displayName });
      const user = response.data.user;
      
      // Update stored user data
      localStorage.setItem('user', JSON.stringify(user));
      
      return user;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to update username');
    }
  },

  // Get current user
  async getCurrentUser(): Promise<User | null> {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return null;

      const response = await api.get('/auth/me');
      const user = response.data;
      
      // Update stored user data
      localStorage.setItem('user', JSON.stringify(user));
      
      return user;
    } catch (error) {
      // If token is invalid, clear storage
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      return null;
    }
  },

  // Sign out
  async signOut(): Promise<void> {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  },

  // Get stored user
  getStoredUser(): User | null {
    try {
      const userString = localStorage.getItem('user');
      return userString ? JSON.parse(userString) : null;
    } catch (error) {
      return null;
    }
  },
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
  try {
    const response = await api.post('/auth/change-password', {
      currentPassword,
      newPassword
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || 'Failed to change password');
  }
},

// Delete account
async deleteAccount(password: string): Promise<void> {
  try {
    const response = await api.delete('/auth/account', {
      data: { password }
    });
    
    // Clear local storage on successful deletion
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || 'Failed to delete account');
  }
},
// Change email
async changeEmail(currentPassword: string, newEmail: string): Promise<{ user: User; token: string }> {
  try {
    const response = await api.post('/auth/change-email', {
      currentPassword,
      newEmail
    });
    
    const { token, user } = response.data;
    
    // Update stored user data
    localStorage.setItem('authToken', token);
    localStorage.setItem('user', JSON.stringify(user));
    
    return { user, token };
  } catch (error: any) {
    throw new Error(error.response?.data?.error || 'Failed to change email');
  }
},

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!localStorage.getItem('authToken');
  }
};



// Watchlist functions
export const watchlistService = {
  async getWatchlist(): Promise<any[]> {
    try {
      const response = await api.get('/watchlist');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to get watchlist');
    }
  },

  async addToWatchlist(media: any): Promise<void> {
    const cacheKey = `add_watchlist_${media.id || media.media_id}`;
    
    return cachedRequest(cacheKey, async () => {
      try {
        await api.post('/watchlist', {
          media_id: media.id || media.media_id,
          title: media.title || media.name,
          poster_path: media.poster_path,
          backdrop_path: media.backdrop_path,
          media_type: media.media_type,
          overview: media.overview,
          rating: media.vote_average
        });
      } catch (error: any) {
        throw new Error(error.response?.data?.error || 'Failed to add to watchlist');
      }
    });
  },

  async removeFromWatchlist(mediaId: string): Promise<void> {
    try {
      await api.delete(`/watchlist/${mediaId}`);
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to remove from watchlist');
    }
  }
};

// Favourites functions
export const favouritesService = {
  async getFavourites(): Promise<any[]> {
    try {
      const response = await api.get('/favourites');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to get favourites');
    }
  },

  async addToFavourites(media: any): Promise<void> {
    const cacheKey = `add_favourites_${media.id || media.media_id}`;
    
    return cachedRequest(cacheKey, async () => {
      try {
        await api.post('/favourites', {
          media_id: media.id || media.media_id,
          title: media.title || media.name,
          poster_path: media.poster_path,
          backdrop_path: media.backdrop_path,
          media_type: media.media_type,
          overview: media.overview,
          rating: media.vote_average
        });
      } catch (error: any) {
        throw new Error(error.response?.data?.error || 'Failed to add to favourites');
      }
    });
  },

  async removeFromFavourites(mediaId: string): Promise<void> {
    try {
      await api.delete(`/favourites/${mediaId}`);
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to remove from favourites');
    }
  }
};

// Watch history functions
export const watchHistoryService = {
  // Get watch history
  async getWatchHistory(limit = 20, offset = 0): Promise<{ items: any[]; hasMore: boolean }> {
    try {
      const response = await api.get(`/watch-history?limit=${limit}&offset=${offset}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to get watch history');
    }
  },

  // Get specific watch history item
  async getWatchHistoryItem(mediaId: number, mediaType: 'movie' | 'tv', season?: number, episode?: number): Promise<any | null> {
    try {
      const params = new URLSearchParams({
        media_id: mediaId.toString(),
        media_type: mediaType
      });
      
      if (season) params.append('season', season.toString());
      if (episode) params.append('episode', episode.toString());
      
      const response = await api.get(`/watch-history/item?${params.toString()}`);
      return response.data;
    } catch (error: any) {
      // If not found, return null instead of throwing
      if (error.response?.status === 404) {
        return null;
      }
      throw new Error(error.response?.data?.error || 'Failed to get watch history item');
    }
  },

  // Add or update watch history (UPSERT operation)
  async addToWatchHistory(media: any, watchPosition: number, duration: number, season?: number, episode?: number): Promise<void> {
    // Create a unique cache key to prevent duplicate requests
    const cacheKey = `add_watch_history_${media.id || media.media_id}_${media.media_type}_${season || 0}_${episode || 0}_${Math.floor(watchPosition / 10)}`;
    
    return cachedRequest(cacheKey, async () => {
      try {
        // First, check if item already exists
        const existingItem = await this.getWatchHistoryItem(
          media.id || media.media_id,
          media.media_type,
          season,
          episode
        ).catch(() => null);
        
        const requestData = {
          media_id: media.id || media.media_id,
          title: media.title || media.name,
          poster_path: media.poster_path,
          backdrop_path: media.backdrop_path,
          media_type: media.media_type,
          overview: media.overview,
          rating: media.vote_average,
          watch_position: watchPosition,
          duration: duration,
          season: season,
          episode: episode
        };
        
        if (existingItem) {
          // Update existing item if watch position is significantly different
          const positionDiff = Math.abs(existingItem.watch_position - watchPosition);
          const timeDiff = Date.now() - new Date(existingItem.updated_at || existingItem.created_at).getTime();
          
          // Only update if position changed significantly (> 30 seconds) OR it's been a while (> 5 minutes)
          if (positionDiff > 30 || timeDiff > 5 * 60 * 1000) {
            await api.put(`/watch-history/${existingItem.id}`, requestData);
          }
        } else {
          // Create new item
          await api.post('/watch-history', requestData);
        }
      } catch (error: any) {
        // If it's a duplicate error, just log it
        if (error.response?.status === 409) {
          console.log('Watch history item already exists');
          return;
        }
        
        // If the endpoint doesn't exist, try the old endpoint
        if (error.response?.status === 404) {
          try {
            await api.post('/watch-history', {
              media_id: media.id || media.media_id,
              title: media.title || media.name,
              poster_path: media.poster_path,
              backdrop_path: media.backdrop_path,
              media_type: media.media_type,
              overview: media.overview,
              rating: media.vote_average,
              watch_position: watchPosition,
              duration: duration,
              season: season,
              episode: episode
            });
          } catch (fallbackError: any) {
            throw new Error(fallbackError.response?.data?.error || 'Failed to add to watch history');
          }
        } else {
          throw new Error(error.response?.data?.error || 'Failed to add to watch history');
        }
      }
    });
  },

  // Update watch position only
  async updateWatchPosition(mediaId: number, mediaType: 'movie' | 'tv', watchPosition: number, season?: number, episode?: number): Promise<void> {
    const cacheKey = `update_watch_position_${mediaId}_${mediaType}_${season || 0}_${episode || 0}_${Math.floor(watchPosition / 30)}`;
    
    return cachedRequest(cacheKey, async () => {
      try {
        await api.patch('/watch-history/position', {
          media_id: mediaId,
          media_type: mediaType,
          watch_position: watchPosition,
          season: season,
          episode: episode
        });
      } catch (error: any) {
        // If update endpoint doesn't exist, use addToWatchHistory as fallback
        if (error.response?.status === 404) {
          const mockMedia = {
            id: mediaId,
            media_id: mediaId,
            title: '',
            name: '',
            poster_path: '',
            backdrop_path: '',
            media_type: mediaType,
            overview: '',
            vote_average: 0
          };
          
          await this.addToWatchHistory(mockMedia, watchPosition, 0, season, episode);
        } else {
          throw new Error(error.response?.data?.error || 'Failed to update watch position');
        }
      }
    });
  },

  async clearWatchHistory(): Promise<void> {
    try {
      await api.delete('/watch-history');
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to clear watch history');
    }
  },

  async cleanupWatchHistory(): Promise<{ removedDuplicates: number; remainingItems: number }> {
    try {
      const response = await api.post('/watch-history/cleanup');
      return {
        removedDuplicates: response.data.removedDuplicates,
        remainingItems: response.data.remainingItems
      };
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to cleanup watch history');
    }
  },

  // Delete specific watch history item
  async deleteWatchHistoryItem(id: string): Promise<void> {
    try {
      await api.delete(`/watch-history/${id}`);
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to delete watch history item');
    }
  }
};

// User preferences functions
export const preferencesService = {
  async getPreferences(): Promise<any> {
    try {
      const response = await api.get('/preferences');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to get preferences');
    }
  },

  async updatePreferences(preferences: any): Promise<void> {
    const cacheKey = `update_preferences_${JSON.stringify(preferences)}`;
    
    return cachedRequest(cacheKey, async () => {
      try {
        await api.patch('/preferences', preferences);
      } catch (error: any) {
        throw new Error(error.response?.data?.error || 'Failed to update preferences');
      }
    });
  }
};