import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { History, Clock, Trash2, Bookmark, Heart, Loader2, LogIn } from 'lucide-react';
import { useWatchHistory } from '@/hooks/watch-history';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from '@/hooks';
import Ads from '@/components/Ads';
import { useUserPreferences } from '@/hooks/user-preferences';
import MediaGrid from '@/components/MediaGrid';
import Spinner from '@/components/ui/spinner';

// Type definitions compatible with ExtendedMedia from MediaGrid
interface ExtendedMedia {
  id: number;
  media_id: number;
  title: string;
  name: string;
  poster_path: string;
  backdrop_path: string;
  media_type: 'movie' | 'tv';
  overview: string;
  vote_average: number;
  release_date: string;
  first_air_date: string;
  genre_ids: number[];
  docId?: string;
  watched_at?: string;
  created_at?: string;
  season_number?: number;
  episode_number?: number;
  episode_title?: string;
  episode_info?: string | null;
  progress?: number;
}

const WatchHistory = () => {
  const { userPreferences } = useUserPreferences();
  const hookResult = useWatchHistory();
  
  // Safely extract values with fallbacks
  const watchHistory = Array.isArray(hookResult.watchHistory) ? hookResult.watchHistory : [];
  const clearWatchHistory = typeof hookResult.clearWatchHistory === 'function' ? hookResult.clearWatchHistory : async () => {};
  const favorites = Array.isArray(hookResult.favorites) ? hookResult.favorites : [];
  const watchlist = Array.isArray(hookResult.watchlist) ? hookResult.watchlist : [];
  const deleteWatchHistoryItem = typeof hookResult.deleteWatchHistoryItem === 'function' ? hookResult.deleteWatchHistoryItem : async () => {};
  const deleteSelectedWatchHistory = typeof hookResult.deleteSelectedWatchHistory === 'function' ? hookResult.deleteSelectedWatchHistory : async () => {};
  const deleteFavoriteItem = typeof hookResult.deleteFavoriteItem === 'function' ? hookResult.deleteFavoriteItem : async () => {};
  const deleteSelectedFavorites = typeof hookResult.deleteSelectedFavorites === 'function' ? hookResult.deleteSelectedFavorites : async () => {};
  const deleteWatchlistItem = typeof hookResult.deleteWatchlistItem === 'function' ? hookResult.deleteWatchlistItem : async () => {};
  const deleteSelectedWatchlist = typeof hookResult.deleteSelectedWatchlist === 'function' ? hookResult.deleteSelectedWatchlist : async () => {};
  const hasMore = hookResult.hasMore === true;
  const isLoading = hookResult.isLoading === true;
  const loadMore = typeof hookResult.loadMore === 'function' ? hookResult.loadMore : async () => {};
  
  // No error property - remove error handling or use a different approach
  const [localError, setLocalError] = useState<string | null>(null);
  
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [activeTab, setActiveTab] = useState<'history' | 'favorites' | 'watchlist'>('history');
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [contentVisible, setContentVisible] = useState(false);
  const loader = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTimeout(() => setContentVisible(true), 300);
  }, []);

  const handleLoadMore = useCallback(async () => {
    if (!hasMore || isLoadingMore) return;
    
    setIsLoadingMore(true);
    setLocalError(null);
    try {
      await loadMore();
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Failed to load more watch history items.');
      toast({
        title: "Error",
        description: "Failed to load more watch history items.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingMore(false);
    }
  }, [loadMore, toast, hasMore, isLoadingMore]);

  useEffect(() => {
    const currentLoader = loader.current;
    const currentObserver = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (target.isIntersecting && hasMore && !isLoadingMore && activeTab === 'history') {
          handleLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (currentLoader) {
      currentObserver.observe(currentLoader);
    }

    return () => {
      if (currentLoader) {
        currentObserver.unobserve(currentLoader);
      }
    };
  }, [hasMore, isLoadingMore, activeTab, handleLoadMore]);

  const handleClearHistory = async () => {
    try {
      await clearWatchHistory();
      toast({
        title: "Watch history cleared",
        description: "Your watch history has been successfully cleared.",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to clear watch history.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteWatchHistoryItem = async (id: string) => {
    try {
      await deleteWatchHistoryItem(id);
      toast({
        title: "Item removed",
        description: "The item has been removed from your watch history.",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to delete watch history item.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteSelectedWatchHistory = async (ids: string[]) => {
    try {
      await deleteSelectedWatchHistory(ids);
      toast({
        title: "Items removed",
        description: `${ids.length} item${ids.length === 1 ? '' : 's'} removed from your watch history.`,
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to delete selected watch history items.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteFavoriteItem = async (id: string) => {
    try {
      await deleteFavoriteItem(id);
      toast({
        title: "Item removed",
        description: "The item has been removed from your favorites.",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to delete favorite item.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteSelectedFavorites = async (ids: string[]) => {
    try {
      await deleteSelectedFavorites(ids);
      toast({
        title: "Items removed",
        description: `${ids.length} item${ids.length === 1 ? '' : 's'} removed from your favorites.`,
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to delete selected favorites.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteWatchlistItem = async (id: string) => {
    try {
      await deleteWatchlistItem(id);
      toast({
        title: "Item removed",
        description: "The item has been removed from your watchlist.",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to delete watchlist item.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteSelectedWatchlist = async (ids: string[]) => {
    try {
      await deleteSelectedWatchlist(ids);
      toast({
        title: "Items removed",
        description: `${ids.length} item${ids.length === 1 ? '' : 's'} removed from your watchlist.`,
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to delete selected watchlist items.",
        variant: "destructive",
      });
    }
  };

  const getItemDate = (item: any): string => {
    if (item?.watched_at) {
      return item.watched_at;
    }
    if (item?.created_at) {
      return item.created_at;
    }
    if (item?.added_at) {
      return item.added_at;
    }
    return new Date().toISOString();
  };

  const sortedWatchHistory = [...watchHistory].sort((a, b) => {
    const dateA = new Date(getItemDate(a)).getTime();
    const dateB = new Date(getItemDate(b)).getTime();
    return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
  });

  // Helper function to format season and episode
  const formatEpisodeInfo = (item: any): string | null => {
    if (item?.media_type === 'tv' && item?.season_number && item?.episode_number) {
      return `S${String(item.season_number).padStart(2, '0')} E${String(item.episode_number).padStart(2, '0')}`;
    }
    return null;
  };

  // Format media for MediaGrid with proper types
  const watchHistoryMedia: ExtendedMedia[] = sortedWatchHistory.map((item: any) => ({
    id: item?.media_id || 0,
    media_id: item?.media_id || 0,
    title: item?.title || item?.name || '',
    name: item?.title || item?.name || '',
    poster_path: item?.poster_path || '',
    backdrop_path: item?.backdrop_path || '',
    media_type: (item?.media_type === 'tv' ? 'tv' : 'movie') as 'movie' | 'tv',
    overview: item?.overview || '',
    vote_average: item?.vote_average || 0,
    release_date: item?.release_date || '',
    first_air_date: item?.first_air_date || '',
    genre_ids: item?.genre_ids || [],
    docId: item?.id,
    watched_at: item?.watched_at || item?.created_at || item?.added_at,
    season_number: item?.season_number,
    episode_number: item?.episode_number,
    episode_title: item?.episode_title || '',
    episode_info: formatEpisodeInfo(item),
    progress: item?.progress || 0
  }));

  const favoritesMedia: ExtendedMedia[] = favorites.map((item: any) => ({
    id: item?.media_id || 0,
    media_id: item?.media_id || 0,
    title: item?.title || item?.name || '',
    name: item?.title || item?.name || '',
    poster_path: item?.poster_path || '',
    backdrop_path: item?.backdrop_path || '',
    media_type: (item?.media_type === 'tv' ? 'tv' : 'movie') as 'movie' | 'tv',
    overview: item?.overview || '',
    vote_average: item?.vote_average || 0,
    release_date: item?.release_date || '',
    first_air_date: item?.first_air_date || '',
    genre_ids: item?.genre_ids || [],
    docId: item?.id,
    created_at: item?.created_at || item?.added_at
  }));

  const watchlistMedia: ExtendedMedia[] = watchlist.map((item: any) => ({
    id: item?.media_id || 0,
    media_id: item?.media_id || 0,
    title: item?.title || item?.name || '',
    name: item?.title || item?.name || '',
    poster_path: item?.poster_path || '',
    backdrop_path: item?.backdrop_path || '',
    media_type: (item?.media_type === 'tv' ? 'tv' : 'movie') as 'movie' | 'tv',
    overview: item?.overview || '',
    vote_average: item?.vote_average || 0,
    release_date: item?.release_date || '',
    first_air_date: item?.first_air_date || '',
    genre_ids: item?.genre_ids || [],
    docId: item?.id,
    created_at: item?.created_at || item?.added_at
  }));

  const handleTabChange = (value: string) => {
    setActiveTab(value as 'history' | 'favorites' | 'watchlist');
  };

  const getItemCount = (): number => {
    switch(activeTab) {
      case 'history': return watchHistory.length;
      case 'favorites': return favorites.length;
      case 'watchlist': return watchlist.length;
      default: return 0;
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-32 px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-md mx-auto"
          >
            <div className="bg-card/50 backdrop-blur-sm rounded-xl border border-white/10 p-8 text-center">
              <div className="inline-flex p-4 rounded-full bg-white/5 mb-4">
                <LogIn className="h-8 w-8 text-accent" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Please log in</h3>
              <p className="text-sm text-white/70 mb-6">
                You need to be logged in to view your watch history, favorites, and watchlist.
              </p>
              <Button onClick={() => navigate('/login')} className="w-full sm:w-auto bg-accent hover:bg-accent/80 text-white">
                <LogIn className="h-4 w-4 mr-2" />
                Log In
              </Button>
            </div>
          </motion.div>
        </div>
        <Footer />
        {userPreferences?.adsEnabled && <Ads />}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <motion.div 
        className="pt-24 pb-16 px-4 sm:px-6 lg:px-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-7xl mx-auto">
          {/* Header - Netflix style */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white">
                {activeTab === 'history' && 'Watch History'}
                {activeTab === 'favorites' && 'My Favorites'}
                {activeTab === 'watchlist' && 'My Watchlist'}
              </h1>
              <p className="text-white/60 mt-2">
                {getItemCount()} {getItemCount() === 1 ? 'title' : 'titles'}
              </p>
            </div>
            
            <div className="flex flex-wrap gap-3">
              {activeTab === 'history' && watchHistory.length > 0 && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
                    className="border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    <span className="sm:hidden">
                      {sortOrder === 'newest' ? 'Newest' : 'Oldest'}
                    </span>
                    <span className="hidden sm:inline">
                      {sortOrder === 'newest' ? 'Newest First' : 'Oldest First'}
                    </span>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleClearHistory}
                    className="border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    <span className="sm:hidden">Clear</span>
                    <span className="hidden sm:inline">Clear History</span>
                  </Button>
                </>
              )}
            </div>
          </div>
          
          {/* Tabs - Netflix style */}
          <Tabs defaultValue="history" onValueChange={handleTabChange} className="w-full">
            <div className="w-full mb-8 border-b border-white/10">
              <TabsList className="bg-transparent h-auto p-0 space-x-8">
                <TabsTrigger 
                  value="history" 
                  className="data-[state=active]:bg-transparent data-[state=active]:text-accent data-[state=active]:border-b-2 data-[state=active]:border-accent rounded-none px-1 py-3 text-white/70 hover:text-white"
                >
                  <History className="h-4 w-4 mr-2" />
                  <span>History</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="favorites" 
                  className="data-[state=active]:bg-transparent data-[state=active]:text-accent data-[state=active]:border-b-2 data-[state=active]:border-accent rounded-none px-1 py-3 text-white/70 hover:text-white"
                >
                  <Heart className="h-4 w-4 mr-2" />
                  <span>Favorites</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="watchlist" 
                  className="data-[state=active]:bg-transparent data-[state=active]:text-accent data-[state=active]:border-b-2 data-[state=active]:border-accent rounded-none px-1 py-3 text-white/70 hover:text-white"
                >
                  <Bookmark className="h-4 w-4 mr-2" />
                  <span>Watchlist</span>
                </TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="history" className="mt-0">
              {isLoading && !watchHistory.length ? (
                <div className="flex items-center justify-center py-20">
                  <Spinner size="lg" className="text-accent" />
                </div>
              ) : localError ? (
                <div className="py-20 text-center">
                  <div className="inline-flex p-4 rounded-full bg-red-500/10 mb-4">
                    <History className="h-8 w-8 text-red-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">Unable to load watch history</h3>
                  <p className="text-white/70 mb-4 max-w-md mx-auto">{localError}</p>
                  <Button onClick={() => window.location.reload()} variant="outline" className="border-white/10 bg-white/5 text-white hover:bg-white/10">
                    Try Again
                  </Button>
                </div>
              ) : watchHistory.length > 0 ? (
                <div className={`transition-opacity duration-500 ${contentVisible ? 'opacity-100' : 'opacity-0'}`}>
                  <MediaGrid 
                    media={watchHistoryMedia}
                    showDeleteButton={true}
                    onDelete={handleDeleteWatchHistoryItem}
                    onDeleteSelected={handleDeleteSelectedWatchHistory}
                    selectable={true}
                    listView={false}
                    showEpisodeInfo={true}
                  />
                  {hasMore && (
                    <div 
                      ref={loader}
                      className="flex justify-center py-8"
                    >
                      <Button
                        variant="outline"
                        onClick={handleLoadMore}
                        disabled={isLoadingMore}
                        className="border-white/10 bg-white/5 text-white hover:bg-white/10"
                      >
                        {isLoadingMore ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Loading...
                          </>
                        ) : (
                          'Load More'
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-20 text-center">
                  <div className="inline-flex p-4 rounded-full bg-white/5 mb-4">
                    <Clock className="h-8 w-8 text-white/50" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">No watch history yet</h3>
                  <p className="text-white/70 mb-6 max-w-sm mx-auto">
                    Start watching movies and shows to build your history.
                  </p>
                  <Button onClick={() => navigate('/')} className="bg-accent hover:bg-accent/80 text-white">
                    Browse Content
                  </Button>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="favorites" className="mt-0">
              {isLoading && !favorites.length ? (
                <div className="flex items-center justify-center py-20">
                  <Spinner size="lg" className="text-accent" />
                </div>
              ) : localError ? (
                <div className="py-20 text-center">
                  <div className="inline-flex p-4 rounded-full bg-red-500/10 mb-4">
                    <Heart className="h-8 w-8 text-red-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">Unable to load favorites</h3>
                  <p className="text-white/70 mb-4 max-w-md mx-auto">{localError}</p>
                  <Button onClick={() => window.location.reload()} variant="outline" className="border-white/10 bg-white/5 text-white hover:bg-white/10">
                    Try Again
                  </Button>
                </div>
              ) : favorites.length > 0 ? (
                <div className={`transition-opacity duration-500 ${contentVisible ? 'opacity-100' : 'opacity-0'}`}>
                  <MediaGrid 
                    media={favoritesMedia}
                    showDeleteButton={true}
                    onDelete={handleDeleteFavoriteItem}
                    onDeleteSelected={handleDeleteSelectedFavorites}
                    selectable={true}
                    listView={false}
                  />
                </div>
              ) : (
                <div className="py-20 text-center">
                  <div className="inline-flex p-4 rounded-full bg-white/5 mb-4">
                    <Heart className="h-8 w-8 text-white/50" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">No favorites yet</h3>
                  <p className="text-white/70 mb-6 max-w-sm mx-auto">
                    Save your favorite movies and shows to find them quickly.
                  </p>
                  <Button onClick={() => navigate('/')} className="bg-accent hover:bg-accent/80 text-white">
                    Browse Content
                  </Button>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="watchlist" className="mt-0">
              {isLoading && !watchlist.length ? (
                <div className="flex items-center justify-center py-20">
                  <Spinner size="lg" className="text-accent" />
                </div>
              ) : localError ? (
                <div className="py-20 text-center">
                  <div className="inline-flex p-4 rounded-full bg-red-500/10 mb-4">
                    <Bookmark className="h-8 w-8 text-red-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">Unable to load watchlist</h3>
                  <p className="text-white/70 mb-4 max-w-md mx-auto">{localError}</p>
                  <Button onClick={() => window.location.reload()} variant="outline" className="border-white/10 bg-white/5 text-white hover:bg-white/10">
                    Try Again
                  </Button>
                </div>
              ) : watchlist.length > 0 ? (
                <div className={`transition-opacity duration-500 ${contentVisible ? 'opacity-100' : 'opacity-0'}`}>
                  <MediaGrid 
                    media={watchlistMedia}
                    showDeleteButton={true}
                    onDelete={handleDeleteWatchlistItem}
                    onDeleteSelected={handleDeleteSelectedWatchlist}
                    selectable={true}
                    listView={false}
                  />
                </div>
              ) : (
                <div className="py-20 text-center">
                  <div className="inline-flex p-4 rounded-full bg-white/5 mb-4">
                    <Bookmark className="h-8 w-8 text-white/50" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">Your watchlist is empty</h3>
                  <p className="text-white/70 mb-6 max-w-sm mx-auto">
                    Add content to your watchlist to watch later.
                  </p>
                  <Button onClick={() => navigate('/')} className="bg-accent hover:bg-accent/80 text-white">
                    Browse Content
                  </Button>
                </div>
              )}
            </TabsContent> 
          </Tabs>
        </div>
      </motion.div>
      
      <Footer />
      {userPreferences?.adsEnabled && <Ads />}
    </div>
  );
};

export default WatchHistory;