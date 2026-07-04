import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getWatchHistoryFromAPI } from '@/services/watch-progress'; // Create this service

interface ContinueWatchingProps {
  maxItems?: number;
}

interface ContinuableItem {
  media_id: string;
  title: string;
  backdrop_path: string;
  poster_path: string;
  media_type: 'movie' | 'tv';
  overview: string;
  rating: number;
  season: number;
  episode: number;
  created_at: string;
  watch_position: number;
  duration: number;
  progress_percentage: number;
}

const ContinueWatching = ({ maxItems = 20 }: ContinueWatchingProps) => {
  const { user } = useAuth();
  const [continuableItems, setContinuableItems] = useState<ContinuableItem[]>([]);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const [isHovering, setIsHovering] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const rowRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Load continue watching items from watchHistory
  const loadContinueWatchingItems = async () => {
    if (!user) {
      setContinuableItems([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    
    try {
      console.log('Fetching Continue Watching from watchHistory...');
      const watchHistory = await getWatchHistoryFromAPI(50, 0); // Get last 50 items
      console.log('Watch History response:', watchHistory);

      if (!watchHistory || !watchHistory.items || watchHistory.items.length === 0) {
        console.log('No watch history found');
        setContinuableItems([]);
        return;
      }

      // Convert watchHistory items to ContinuableItem format
      const continuableItems = watchHistory.items
        .filter(item => 
          item.duration > 0 && 
          item.watch_position > 0 &&
          item.watch_position < item.duration // Only show if not completed
        )
        .map(item => {
          const percentage = (item.watch_position / item.duration) * 100;
          return {
            media_id: item.media_id,
            title: item.title || '',
            backdrop_path: item.backdrop_path || '',
            poster_path: item.poster_path || '',
            media_type: item.media_type,
            overview: item.overview || '',
            rating: item.rating || 0,
            season: item.season || 0,
            episode: item.episode || 0,
            created_at: item.created_at,
            watch_position: item.watch_position,
            duration: item.duration,
            progress_percentage: Math.min(100, Math.round(percentage))
          };
        })
        .filter(item => 
          item.progress_percentage > 0 && 
          item.progress_percentage < 95 // Only show items with 1-94% progress
        )
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, maxItems);

      console.log('Final Continue Watching items:', continuableItems);
      setContinuableItems(continuableItems);

    } catch (error) {
      console.error('Error loading continue watching items:', error);
      setContinuableItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadContinueWatchingItems();
    
    // Refresh every 30 seconds
    const interval = setInterval(() => {
      loadContinueWatchingItems();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [user, maxItems]);

  // Handle scroll position to show/hide arrows
  const handleScroll = () => {
    if (!rowRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = rowRef.current;
    setShowLeftArrow(scrollLeft > 0);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
  };

  const scrollLeft = () => {
    if (!rowRef.current) return;
    const scrollAmount = rowRef.current.clientWidth * 0.75;
    rowRef.current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
  };

  const scrollRight = () => {
    if (!rowRef.current) return;
    const scrollAmount = rowRef.current.clientWidth * 0.75;
    rowRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  const formatTime = (seconds: number) => {
    if (!seconds || seconds <= 0) return '0:00';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Format title with season and episode for TV shows
  const formatTitle = (item: ContinuableItem) => {
    if (item.media_type === 'movie') {
      return item.title;
    } else if (item.media_type === 'tv') {
      const season = item.season || 1;
      const episode = item.episode || 1;
      return `${item.title} S${season}E${episode}`;
    }
    return item.title;
  };

  const handleContinueWatching = (item: ContinuableItem) => {
    if (item.media_type === 'movie') {
      navigate(`/player/${item.media_type}/${item.media_id}`);
    } else if (item.media_type === 'tv') {
      const season = item.season || 1;
      const episode = item.episode || 1;
      navigate(`/player/${item.media_type}/${item.media_id}/${season}/${episode}`);
    }
  };

  if (!user) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="px-4 md:px-8 mt-8 mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-white mb-4">Continue Watching</h2>
        <div className="flex gap-4 pb-4">
          {[...Array(3)].map((_, i) => (
            <div 
              key={i} 
              className="flex-none w-[280px] md:w-[320px] aspect-video bg-gray-800 rounded-lg animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (continuableItems.length === 0) {
    return null;
  }
  
  return (
    <div className="px-4 md:px-8 mt-8 mb-6">
      <h2 className="text-xl md:text-2xl font-bold text-white mb-4">Continue Watching</h2>
      
      <div 
        className="relative group"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {/* Left scroll button */}
        {showLeftArrow && (
          <button
            className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-black/70 text-white transition-all ${
              isHovering ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
            } hidden md:flex`}
            onClick={scrollLeft}
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}

        <motion.div 
          ref={rowRef}
          className="flex overflow-x-auto hide-scrollbar gap-4 pb-4"
          onScroll={handleScroll}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ staggerChildren: 0.1 }}
        >
          {continuableItems.map((item, index) => (
            <motion.div
              key={`${item.media_id}-${item.media_type}-${item.season}-${item.episode}-${index}`}
              className="relative flex-none w-[280px] md:w-[320px] aspect-video bg-card rounded-lg overflow-hidden group cursor-pointer"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.02 }}
              onClick={() => handleContinueWatching(item)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleContinueWatching(item);
                }
              }}
            >
              {item.backdrop_path ? (
                <img
                  src={`https://image.tmdb.org/t/p/w500${item.backdrop_path}`}
                  alt={item.title}
                  className="w-full h-full object-cover transition-transform group-hover:scale-110"
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder-backdrop.jpg';
                    e.currentTarget.classList.add('object-contain', 'bg-gray-900');
                  }}
                />
              ) : (
                <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                  <span className="text-white text-lg font-medium">{item.title}</span>
                </div>
              )}
              
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-medium line-clamp-1">
                      {formatTitle(item)}
                    </h3>
                    {/* Show media type badge */}
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs px-2 py-0.5 rounded bg-white/20 text-white/80">
                        {item.media_type === 'movie' ? 'Movie' : 'TV Show'}
                      </span>
                      {item.media_type === 'tv' && (item.season || item.episode) && (
                        <span className="text-xs text-white/70">
                          Season {item.season || 1} • Episode {item.episode || 1}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Time display on the right side */}
                  {item.duration > 0 && (
                    <div className="text-xs text-white/70 flex-shrink-0 ml-2 whitespace-nowrap">
                      {formatTime(item.watch_position)} / {formatTime(item.duration)}
                    </div>
                  )}
                </div>
                
                {/* Progress bar - thin style */}
                {item.progress_percentage > 0 && item.progress_percentage < 95 && (
                  <div className="h-1 w-full bg-gray-700">
                    <div 
                      className="h-full bg-accent transition-all duration-300"
                      style={{ width: `${item.progress_percentage}%` }}
                    />
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Right scroll button */}
        {showRightArrow && (
          <button
            className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-black/70 text-white transition-all ${
              isHovering ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'
            } hidden md:flex`}
            onClick={scrollRight}
            aria-label="Scroll right"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        )}
      </div>
    </div>
  );
};

export default ContinueWatching;