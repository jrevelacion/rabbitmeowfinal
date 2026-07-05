import { firebaseAuthService } from './firebase-auth';
// API instance for backend services removed in favor of Firebase Firestore

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

// Auth functions - Using Firebase exclusively
export const authService = {
  // Sign up with email, password, and username (displayName)
  async signUp(email: string, password: string, displayName: string): Promise<{ user: User; token: string }> {
    try {
      const { user } = await firebaseAuthService.signUp(email, password, displayName);
      
      // Generate a simple token for localStorage (Firebase handles actual auth)
      const token = 'firebase_' + Date.now();
      
      // Store token and user in localStorage
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      return { user, token };
    } catch (error: any) {
      throw new Error(error.message || 'Registration failed');
    }
  },

  // Sign in with email OR username
  async signIn(identifier: string, password: string): Promise<{ user: User; token: string }> {
    try {
      // Check if identifier is email (contains @) or username
      const isEmail = identifier.includes('@');
      
      if (isEmail) {
        // Email login
        const { user } = await firebaseAuthService.signIn(identifier, password);
        const token = 'firebase_' + Date.now();
        localStorage.setItem('authToken', token);
        localStorage.setItem('user', JSON.stringify(user));
        return { user, token };
      } else {
        // Username login - need to find user by displayName first
        const { user } = await firebaseAuthService.signInByUsername(identifier, password);
        const token = 'firebase_' + Date.now();
        localStorage.setItem('authToken', token);
        localStorage.setItem('user', JSON.stringify(user));
        return { user, token };
      }
    } catch (error: any) {
      throw new Error(error.message || 'Login failed');
    }
  },

  // Check username availability using Firebase
  async checkUsername(username: string): Promise<{ available: boolean; message: string }> {
    try {
      return await firebaseAuthService.checkUsername(username);
    } catch (error: any) {
      console.error('Error checking username:', error);
      throw new Error(error.message || 'Failed to check username availability');
    }
  },

  // Update user profile (username or photo)
  async updateProfile(updates: { displayName?: string; photoURL?: string }): Promise<User> {
    try {
      const user = await firebaseAuthService.updateProfile(updates);
      localStorage.setItem('user', JSON.stringify(user));
      return user;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update profile');
    }
  },

  // Update only display name (username)
  async updateDisplayName(displayName: string): Promise<User> {
    try {
      const user = await firebaseAuthService.updateDisplayName(displayName);
      localStorage.setItem('user', JSON.stringify(user));
      return user;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update username');
    }
  },

  // Get current user
  async getCurrentUser(): Promise<User | null> {
    try {
      const user = await firebaseAuthService.getCurrentUserData();
      if (user) {
        localStorage.setItem('user', JSON.stringify(user));
      }
      return user;
    } catch (error) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      return null;
    }
  },

  // Sign out
  async signOut(): Promise<void> {
    try {
      await firebaseAuthService.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
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
      await firebaseAuthService.changePassword(currentPassword, newPassword);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to change password');
    }
  },

  // Delete account
  async deleteAccount(password: string): Promise<void> {
    try {
      await firebaseAuthService.deleteAccount(password);
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
    } catch (error: any) {
      throw new Error(error.message || 'Failed to delete account');
    }
  },

  // Change email
  async changeEmail(currentPassword: string, newEmail: string): Promise<{ user: User; token: string }> {
    try {
      const user = await firebaseAuthService.changeEmail(newEmail);
      const token = 'firebase_' + Date.now();
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify(user));
      return { user, token };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to change email');
    }
  },

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!localStorage.getItem('authToken');
  },

  onAuthStateChanged(callback: (user: User | null) => void): () => void {
    return firebaseAuthService.onAuthStateChanged(callback);
  }
};



// Watchlist functions using Firebase Firestore
export const watchlistService = {
  async getWatchlist(): Promise<any[]> {
    return await firebaseAuthService.getWatchlist();
  },

  async addToWatchlist(media: any): Promise<void> {
    const cacheKey = `add_watchlist_${media.id || media.media_id}`;
    return cachedRequest(cacheKey, async () => {
      await firebaseAuthService.addToWatchlist(media);
    });
  },

  async removeFromWatchlist(mediaId: string): Promise<void> {
    await firebaseAuthService.removeFromWatchlist(mediaId);
  }
};

// Favourites functions using Firebase Firestore
export const favouritesService = {
  async getFavourites(): Promise<any[]> {
    return await firebaseAuthService.getFavorites();
  },

  async addToFavourites(media: any): Promise<void> {
    const cacheKey = `add_favourites_${media.id || media.media_id}`;
    return cachedRequest(cacheKey, async () => {
      await firebaseAuthService.addToFavorites(media);
    });
  },

  async removeFromFavourites(mediaId: string): Promise<void> {
    await firebaseAuthService.removeFromFavorites(mediaId);
  }
};

  // Watch history functions using Firebase Firestore
export const watchHistoryService = {
  async getWatchHistory(limit = 20, offset = 0): Promise<{ items: any[]; hasMore: boolean }> {
    return await firebaseAuthService.getWatchHistory(limit, offset);
  },

  async addToWatchHistory(media: any, watchPosition: number, duration: number, season?: number, episode?: number): Promise<void> {
    const cacheKey = `add_watch_history_${media.id || media.media_id}_${media.media_type}_${season || 0}_${episode || 0}_${Math.floor(watchPosition / 10)}`;
    return cachedRequest(cacheKey, async () => {
      await firebaseAuthService.addToWatchHistory(media, watchPosition, duration, season, episode);
    });
  },

  async clearWatchHistory(): Promise<void> {
    await firebaseAuthService.clearWatchHistory();
  },

  async cleanupWatchHistory(): Promise<{ removedDuplicates: number; remainingItems: number }> {
    return await firebaseAuthService.cleanupWatchHistory();
  },

  async deleteWatchHistoryItem(id: string): Promise<void> {
    await firebaseAuthService.deleteWatchHistoryItem(id);
  }
};

// User preferences functions (Fallback to local storage)
export const preferencesService = {
  async getPreferences(): Promise<any> {
    const stored = localStorage.getItem('user_preferences');
    return stored ? JSON.parse(stored) : {};
  },

  async updatePreferences(preferences: any): Promise<void> {
    localStorage.setItem('user_preferences', JSON.stringify(preferences));
  }
};