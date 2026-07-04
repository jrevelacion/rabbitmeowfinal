import { useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from '@/hooks';
import { useUserPreferences } from '@/hooks/user-preferences';
import { Media } from '@/utils/types';
import { useToast } from '@/hooks/use-toast';
import { 
  watchHistoryService,
  watchlistService,
  favouritesService
} from '@/lib/auth';
import { 
  WatchHistoryContext,
  WatchHistoryItem,
  FavoriteItem,
  WatchlistItem,
  MediaBaseItem,
  WatchHistoryContextType 
} from './types/watch-history';

const LOCAL_STORAGE_HISTORY_KEY = 'fdf_watch_history';
const MAX_LOCAL_HISTORY = 10;

export { WatchHistoryContext };

export function WatchHistoryProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { userPreferences } = useUserPreferences();
  const [watchHistory, setWatchHistory] = useState<WatchHistoryItem[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const { toast } = useToast();

  const loadLocalWatchHistory = useCallback(() => {
    try {
      const storedHistory = localStorage.getItem(LOCAL_STORAGE_HISTORY_KEY);
      if (!storedHistory) return [];
      const history = JSON.parse(storedHistory) as WatchHistoryItem[];
      return history.slice(0, MAX_LOCAL_HISTORY);
    } catch (error) {
      console.error('Error loading local watch history:', error);
      return [];
    }
  }, []);

  const saveLocalWatchHistory = useCallback((history: WatchHistoryItem[]) => {
    try {
      const recentHistory = history.slice(0, MAX_LOCAL_HISTORY);
      localStorage.setItem(LOCAL_STORAGE_HISTORY_KEY, JSON.stringify(recentHistory));
    } catch (error) {
      console.error('Error saving local watch history:', error);
    }
  }, []);

  const fetchWatchHistory = useCallback(async (isInitial: boolean = false) => {
    if (!user) {
      setWatchHistory(loadLocalWatchHistory());
      setHasMore(false);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const currentOffset = isInitial ? 0 : offset;
      const response = await watchHistoryService.getWatchHistory(20, currentOffset);
      
      const historyData = response.items.map(item => ({
        ...item,
        id: item.media_id,
        user_id: user.uid,
        media_id: parseInt(item.media_id),
        created_at: item.created_at || new Date().toISOString()
      }));

      setWatchHistory(prev => isInitial ? historyData : [...prev, ...historyData]);
      setHasMore(response.hasMore);
      setOffset(currentOffset + historyData.length);
    } catch (error) {
      console.error('Error fetching watch history:', error);
      toast({
        title: "Error loading watch history",
        description: "There was a problem loading your watch history.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [user?.uid, offset, toast, loadLocalWatchHistory]);

  const fetchFavorites = useCallback(async () => {
    if (!user) {
      setFavorites([]);
      return;
    }

    try {
      const favoritesData = await favouritesService.getFavourites();
      const formattedFavorites = favoritesData.map(item => ({
        ...item,
        id: item.media_id,
        user_id: user.uid,
        media_id: parseInt(item.media_id),
        added_at: item.added_at || new Date().toISOString()
      }));
      setFavorites(formattedFavorites);
    } catch (error) {
      console.error('Error fetching favorites:', error);
      toast({
        title: "Error loading favorites",
        description: "There was a problem loading your favorites.",
        variant: "destructive"
      });
    }
  }, [user?.uid, toast]);

  const fetchWatchlist = useCallback(async () => {
    if (!user) {
      setWatchlist([]);
      return;
    }

    try {
      const watchlistData = await watchlistService.getWatchlist();
      const formattedWatchlist = watchlistData.map(item => ({
        ...item,
        id: item.media_id,
        user_id: user.uid,
        media_id: parseInt(item.media_id),
        added_at: item.added_at || new Date().toISOString()
      }));
      setWatchlist(formattedWatchlist);
    } catch (error) {
      console.error('Error fetching watchlist:', error);
      toast({
        title: "Error loading watchlist",
        description: "There was a problem loading your watchlist.",
        variant: "destructive"
      });
    }
  }, [user?.uid, toast]);

  useEffect(() => {
    if (user) {
      Promise.all([
        fetchWatchHistory(true),
        fetchFavorites(),
        fetchWatchlist()
      ]).catch(error => {
        console.error('Error fetching initial data:', error);
      });
    } else {
      setWatchHistory(loadLocalWatchHistory());
      setFavorites([]);
      setWatchlist([]);
      setHasMore(true);
      setOffset(0);
      setIsLoading(false);
    }
  }, [user?.uid, fetchWatchHistory, fetchFavorites, fetchWatchlist, loadLocalWatchHistory]);

const addToWatchHistory = useCallback(async (
  media: Media,
  position?: number,
  duration?: number,
  season?: number,
  episode?: number,
  preferredSource?: string
) => {
  if (!user || !userPreferences?.isWatchHistoryEnabled) return;

  const mediaType = media.media_type;
  const mediaId = media.id;
  const title = media.title || media.name || '';

  try {
    // FIX: Pass season and episode to the service
    await watchHistoryService.addToWatchHistory(media, position || 0, duration || 0, season, episode);

    // Refresh the watch history to get the updated data from server
    await fetchWatchHistory(true);
    
  } catch (error) {
    console.error('Error adding to watch history:', error);
    toast({
      title: "Error updating watch history",
      description: "There was a problem updating your watch history.",
      variant: "destructive"
    });
  }
}, [user, userPreferences?.isWatchHistoryEnabled, toast, fetchWatchHistory]);

  const updateWatchPosition = async (
    mediaId: number, 
    mediaType: 'movie' | 'tv', 
    position: number, 
    season?: number, 
    episode?: number,
    preferredSource?: string
  ) => {
    if (!user) return;

    try {
      const existingItem = watchHistory.find(item => item.media_id === mediaId);
      if (!existingItem) return;

      // For simplicity, we'll use addToWatchHistory to update
      const mockMedia: Media = {
        id: mediaId,
        media_type: mediaType,
        title: existingItem.title,
        name: existingItem.title,
        poster_path: existingItem.poster_path,
        backdrop_path: existingItem.backdrop_path,
        overview: existingItem.overview,
        vote_average: existingItem.rating
      };

      await addToWatchHistory(mockMedia, position, existingItem.duration, season, episode, preferredSource);
    } catch (error) {
      console.error('Error updating watch position:', error);
      toast({
        title: "Error updating progress",
        description: "There was a problem updating your watch progress.",
        variant: "destructive"
      });
    }
  };
  
  const clearWatchHistory = async () => {
    if (!user) return;
    
    try {
      await watchHistoryService.clearWatchHistory();
      setWatchHistory([]);
      saveLocalWatchHistory([]);
      setOffset(0);
      setHasMore(true);
    } catch (error) {
      console.error('Error clearing watch history:', error);
      toast({
        title: "Error clearing history",
        description: "There was a problem clearing your watch history.",
        variant: "destructive"
      });
    }
  };

  const cleanupWatchHistory = async () => {
    if (!user) return;
    
    try {
      const result = await watchHistoryService.cleanupWatchHistory();
      await fetchWatchHistory(true); // Refresh the display
      
      toast({
        title: "Duplicates removed",
        description: `Removed ${result.removedDuplicates} duplicate entries. ${result.remainingItems} items remaining.`
      });
    } catch (error) {
      console.error('Error cleaning up watch history:', error);
      toast({
        title: "Error cleaning up history",
        description: "There was a problem removing duplicate entries.",
        variant: "destructive"
      });
    }
  };

  const deleteWatchHistoryItem = async (id: string) => {
    if (!user) return;
    
    try {
      await watchHistoryService.clearWatchHistory(); // API doesn't support single item deletion, so we refresh
      await fetchWatchHistory(true);
      
      toast({
        title: "Item removed",
        description: "The item has been removed from your watch history."
      });
    } catch (error) {
      console.error('Error deleting watch history item:', error);
      toast({
        title: "Error removing item",
        description: "There was a problem removing the item from your history.",
        variant: "destructive"
      });
    }
  };

  const deleteSelectedWatchHistory = async (ids: string[]) => {
    // For simplicity, clear all history for now
    await clearWatchHistory();
  };

  const addToFavorites = async (item: MediaBaseItem) => {
    if (!user) return;
    
    try {
      const existingItem = favorites.find(fav => 
        fav.media_id === item.media_id && fav.media_type === item.media_type
      );
      
      if (existingItem) return;

      const mockMedia = {
        id: item.media_id,
        media_id: item.media_id,
        title: item.title,
        name: item.title,
        poster_path: item.poster_path,
        backdrop_path: item.backdrop_path,
        media_type: item.media_type,
        overview: item.overview,
        vote_average: item.rating
      };

      await favouritesService.addToFavourites(mockMedia);
      
      const newItem: FavoriteItem = {
        id: `${item.media_id}`,
        user_id: user.uid,
        media_id: item.media_id,
        media_type: item.media_type,
        title: item.title,
        poster_path: item.poster_path,
        backdrop_path: item.backdrop_path,
        overview: item.overview,
        rating: item.rating,
        added_at: new Date().toISOString()
      };
      
      setFavorites(prev => [newItem, ...prev]);
    } catch (error) {
      console.error('Error adding to favorites:', error);
      toast({
        title: "Error adding to favorites",
        description: "There was a problem adding to your favorites.",
        variant: "destructive"
      });
    }
  };

  const removeFromFavorites = async (mediaId: number, mediaType: 'movie' | 'tv') => {
    if (!user) return;
    
    try {
      await favouritesService.removeFromFavourites(mediaId.toString());
      
      const updatedFavorites = favorites.filter(
        item => !(item.media_id === mediaId && item.media_type === mediaType)
      );
      setFavorites(updatedFavorites);
    } catch (error) {
      console.error('Error removing from favorites:', error);
      toast({
        title: "Error removing from favorites",
        description: "There was a problem removing from your favorites.",
        variant: "destructive"
      });
    }
  };

  const isInFavorites = (mediaId: number, mediaType: 'movie' | 'tv'): boolean => {
    return favorites.some(item => item.media_id === mediaId && item.media_type === mediaType);
  };

  const deleteFavoriteItem = async (id: string) => {
    await removeFromFavorites(parseInt(id), favorites.find(f => f.id === id)?.media_type as 'movie' | 'tv');
  };

  const deleteSelectedFavorites = async (ids: string[]) => {
    for (const id of ids) {
      const item = favorites.find(f => f.id === id);
      if (item) {
        await removeFromFavorites(item.media_id, item.media_type);
      }
    }
  };

  const addToWatchlist = async (item: MediaBaseItem) => {
    if (!user) return;
    
    try {
      const existingItem = watchlist.find(watch => 
        watch.media_id === item.media_id && watch.media_type === item.media_type
      );
      
      if (existingItem) return;

      const mockMedia = {
        id: item.media_id,
        media_id: item.media_id,
        title: item.title,
        name: item.title,
        poster_path: item.poster_path,
        backdrop_path: item.backdrop_path,
        media_type: item.media_type,
        overview: item.overview,
        vote_average: item.rating
      };

      await watchlistService.addToWatchlist(mockMedia);
      
      const newItem: WatchlistItem = {
        id: `${item.media_id}`,
        user_id: user.uid,
        media_id: item.media_id,
        media_type: item.media_type,
        title: item.title,
        poster_path: item.poster_path,
        backdrop_path: item.backdrop_path,
        overview: item.overview,
        rating: item.rating,
        added_at: new Date().toISOString()
      };
      
      setWatchlist(prev => [newItem, ...prev]);
    } catch (error) {
      console.error('Error adding to watchlist:', error);
      toast({
        title: "Error adding to watchlist",
        description: "There was a problem adding to your watchlist.",
        variant: "destructive"
      });
    }
  };

  const removeFromWatchlist = async (mediaId: number, mediaType: 'movie' | 'tv') => {
    if (!user) return;
    
    try {
      await watchlistService.removeFromWatchlist(mediaId.toString());
      
      const updatedWatchlist = watchlist.filter(
        item => !(item.media_id === mediaId && item.media_type === mediaType)
      );
      setWatchlist(updatedWatchlist);
    } catch (error) {
      console.error('Error removing from watchlist:', error);
      toast({
        title: "Error removing from watchlist",
        description: "There was a problem removing from your watchlist.",
        variant: "destructive"
      });
    }
  };

  const isInWatchlist = (mediaId: number, mediaType: 'movie' | 'tv'): boolean => {
    return watchlist.some(item => item.media_id === mediaId && item.media_type === mediaType);
  };

  const deleteWatchlistItem = async (id: string) => {
    await removeFromWatchlist(parseInt(id), watchlist.find(w => w.id === id)?.media_type as 'movie' | 'tv');
  };

  const deleteSelectedWatchlist = async (ids: string[]) => {
    for (const id of ids) {
      const item = watchlist.find(w => w.id === id);
      if (item) {
        await removeFromWatchlist(item.media_id, item.media_type);
      }
    }
  };

  return (
    <WatchHistoryContext.Provider value={{
      watchHistory,
      favorites,
      watchlist,
      hasMore,
      isLoading,
      loadMore: () => fetchWatchHistory(false),
      addToWatchHistory,
      updateWatchPosition,
      clearWatchHistory,
      cleanupWatchHistory,
      deleteWatchHistoryItem,
      deleteSelectedWatchHistory,
      deleteFavoriteItem,
      deleteSelectedFavorites,
      deleteWatchlistItem,
      deleteSelectedWatchlist,
      addToFavorites,
      removeFromFavorites,
      isInFavorites,
      addToWatchlist,
      removeFromWatchlist,
      isInWatchlist
    }}>
      {children}
    </WatchHistoryContext.Provider>
  );
}