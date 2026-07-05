import { useState, useEffect, useCallback, useRef, memo, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getMovieDetails, getTVDetails, videoSources, getSeasonDetails } from '@/utils/api';
import { MovieDetails, TVDetails, VideoSource, Episode, Media } from '@/utils/types';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Film, Tv, Check, SkipBack, SkipForward, Heart, Bookmark, Calendar, Star, Play, ExternalLink, Maximize2, Minimize2, ChevronRight, ChevronLeft, Shuffle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { useWatchHistory } from '@/hooks/watch-history';
import { useAuth } from '@/hooks';
import { useUserPreferences } from '@/hooks/user-preferences';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import Ads from '@/components/Ads';
import { AutoNextEpisode } from '@/components/AutoNextEpisode';
import { useWatchProgress, getWatchProgress } from '@/hooks/useWatchProgress';

// Simple debounce and throttle implementations (no lodash dependency)
const debounce = <T extends (...args: any[]) => any>(func: T, wait: number) => {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

const throttle = <T extends (...args: any[]) => any>(func: T, limit: number) => {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

const backdropSizes = {
  small: 'https://image.tmdb.org/t/p/w300',
  original: 'https://image.tmdb.org/t/p/original',
};

// Video sources that should not be sandboxed
const NO_SANDBOX_SOURCES = ['riveembed', 'smashystream', '111movies', 'spanish', '2embed', 'moviesapi', 'autoembed', 'multiembed', 'vidsrc-me', 'primesrc', 'warezcdn', 'superflix'];

// Define types for video source origins
const SOURCE_ORIGINS: Record<string, string[]> = {
  'vidzee': ['https://player.vidzee.wtf'],
  'vidrock': ['https://vidrock.ru'],
  'vidsrc-wtf-1': ['https://www.vidsrc.wtf'],
  'vidsrc-wtf-2': ['https://www.vidsrc.wtf'],
  'vidlink': ['https://vidlink.pro'],
  'vidfast': [
    'https://vidfast.pro',
    'https://vidfast.in',
    'https://vidfast.io',
    'https://vidfast.me',
    'https://vidfast.net',
    'https://vidfast.pm',
    'https://vidfast.xyz'
  ],
  'videasy': ['https://player.videasy.net'],
  'vidnest': ['https://vidnest.fun'],
  'vidup': ['https://vidup.to']
};

// Create a wrapper type for source display
interface SourceDisplay {
  key: string;
  name: string;
  sandbox?: string;
}

// Memoized Episode Card Component
const EpisodeCard = memo(({ 
  episode, 
  isCurrentEpisode, 
  onPlay, 
  onToggleDescription, 
  isExpanded,
  formatDate,
  isMobile 
}: { 
  episode: Episode; 
  isCurrentEpisode: boolean; 
  onPlay: (season: number, episode: number) => void;
  onToggleDescription: (id: number, e: React.MouseEvent) => void;
  isExpanded: boolean;
  formatDate: (date: string) => string;
  isMobile: boolean;
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  
  return (
    <div
      className={cn(
        "group relative rounded-lg border cursor-pointer",
        "bg-gradient-to-br backdrop-blur-sm",
        isCurrentEpisode
          ? "from-accent/20 via-accent/10 to-transparent border-accent/50 shadow-lg shadow-accent/10"
          : "from-white/5 via-transparent to-transparent border-white/10 hover:border-white/20 hover:bg-white/5",
        isMobile ? "p-3" : "p-4"
      )}
      onClick={() => onPlay(episode.season_number, episode.episode_number)}
    >
      <div className="flex gap-3">
        <div className="relative flex-shrink-0">
          {episode.still_path ? (
            <div className={cn(
              "relative rounded-lg overflow-hidden bg-gray-800",
              isMobile ? "w-16 h-16" : "w-20 h-20"
            )}>
              {!imageLoaded && (
                <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-white/10 to-transparent" />
              )}
              <img 
                src={`${backdropSizes.small}${episode.still_path}`} 
                alt={`${episode.name} still`}
                className={cn(
                  "w-full h-full object-cover transition-opacity duration-300",
                  imageLoaded ? "opacity-100" : "opacity-0"
                )}
                loading="lazy"
                decoding="async"
                onLoad={() => setImageLoaded(true)}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
            </div>
          ) : (
            <div className={cn(
              "rounded-lg bg-gradient-to-br from-white/10 to-transparent border border-white/10 flex items-center justify-center",
              isMobile ? "w-16 h-16" : "w-20 h-20"
            )}>
              <Play className={cn("text-white/40", isMobile ? "h-6 w-6" : "h-6 w-6")} />
            </div>
          )}
          
          {isCurrentEpisode && (
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-accent rounded-full flex items-center justify-center shadow-lg">
              <Check className="h-3 w-3 text-white" />
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4 className={cn(
              "font-semibold truncate flex-1",
              isMobile ? "text-xs" : "text-sm"
            )}>
              <span className="text-accent/80 mr-1">
                E{episode.episode_number.toString().padStart(2, '0')}
              </span>
              {episode.name || 'Untitled Episode'}
            </h4>
            {episode.vote_average > 0 && (
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-white/5 flex-shrink-0">
                <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                <span className="text-amber-300 font-medium text-[10px]">
                  {episode.vote_average.toFixed(1)}
                </span>
              </div>
            )}
          </div>
          
          {episode.air_date && (
            <div className="flex items-center text-[10px] text-white/60 mb-1.5">
              <Calendar className="h-2.5 w-2.5 mr-1 flex-shrink-0" />
              <span className="truncate">{formatDate(episode.air_date)}</span>
            </div>
          )}
          
          <p className={cn(
            "text-[10px] text-white/70 mb-2",
            isExpanded ? "line-clamp-none" : "line-clamp-2"
          )}>
            {episode.overview || 'No description available.'}
          </p>
          
          {episode.overview && episode.overview.length > (isMobile ? 80 : 100) && (
            <button
              onClick={(e) => onToggleDescription(episode.id, e)}
              className="text-[10px] text-accent hover:text-accent/80 mb-2 transition-colors"
            >
              {isExpanded ? 'Read less' : 'Read more'}
            </button>
          )}
          
          <div className="flex items-center justify-between">
            <Button
              size="sm"
              className={cn(
                "transition-all duration-200",
                isMobile ? "h-7 text-[10px] px-2" : "h-8 text-xs",
                isCurrentEpisode
                  ? "bg-accent hover:bg-accent/90 text-white shadow-lg shadow-accent/20"
                  : "bg-white/10 hover:bg-white/20 text-white/90"
              )}
              onClick={(e) => {
                e.stopPropagation();
                onPlay(episode.season_number, episode.episode_number);
              }}
            >
              <Play className={cn("mr-1", isMobile ? "h-2.5 w-2.5" : "h-3 w-3")} />
              {isCurrentEpisode ? 'Continue' : 'Play'}
            </Button>
          </div>
        </div>
      </div>
      
      {isCurrentEpisode && (
        <div className="absolute -inset-0.5 bg-gradient-to-r from-accent/20 via-transparent to-transparent rounded-lg -z-10 blur-sm pointer-events-none" />
      )}
    </div>
  );
});

EpisodeCard.displayName = 'EpisodeCard';

// Memoized Source Button Component - using SourceDisplay instead of VideoSource
const SourceButton = memo(({ 
  source, 
  isSelected, 
  onClick 
}: { 
  source: SourceDisplay; 
  isSelected: boolean; 
  onClick: () => void;
}) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative group p-4 rounded-lg border transition-all duration-200",
        "bg-gradient-to-br backdrop-blur-sm",
        isSelected
          ? "from-accent/20 to-accent/10 border-accent"
          : "from-white/5 to-transparent border-white/10 hover:border-white/20",
        !SOURCE_ORIGINS[source.key] && "opacity-70"
      )}
    >
      <div className="space-y-2 text-left">
        <div className="flex items-center justify-between">
          <span className={cn(
            "text-sm font-medium transition-colors",
            isSelected ? "text-accent" : "text-white group-hover:text-white/90"
          )}>
            {source.name}
          </span>
          {isSelected && (
            <div className="h-2 w-2 rounded-full bg-accent" />
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {isSelected ? (
            <div className="text-xs text-accent flex items-center gap-1">
              <Check className="h-3 w-3" />
              Active
            </div>
          ) : (
            <span className="text-xs text-white/40">Click to switch</span>
          )}
        </div>
      </div>
    </button>
  );
}
                         );

SourceButton.displayName = 'SourceButton';

const Player = () => {
  const { id, season, episode } = useParams<{ id: string; season?: string; episode?: string }>();
  const { userPreferences, updatePreferences } = useUserPreferences();
  const [title, setTitle] = useState<string>('');
  const [selectedSource, setSelectedSource] = useState<string>(
    userPreferences?.preferred_source || localStorage.getItem('selectedVideoSource') || videoSources[0].key
  );
  const [embedUrl, setEmbedUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [mediaType, setMediaType] = useState<'movie' | 'tv'>('movie');
  const [mediaDetails, setMediaDetails] = useState<MovieDetails | TVDetails | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [currentEpisodeIndex, setCurrentEpisodeIndex] = useState<number>(0);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState<string>(season || '1');
  const [autoNextEnabled, setAutoNextEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('autoNextEnabled');
    return saved !== null ? saved === 'true' : true;
  });
  const [isEpisodeMenuOpen, setIsEpisodeMenuOpen] = useState(false);
  const [expandedEpisodes, setExpandedEpisodes] = useState<Record<number, boolean>>({});
  const [visibleEpisodesCount, setVisibleEpisodesCount] = useState(10);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const { 
    addToFavorites, 
    addToWatchlist, 
    removeFromFavorites,
    removeFromWatchlist,
    isInFavorites,
    isInWatchlist
  } = useWatchHistory();

  const [isFavorite, setIsFavorite] = useState(false);
  const [isInMyWatchlist, setIsInMyWatchlist] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastCheckTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number>();

  const memoizedNavigate = useCallback(navigate, [navigate]);
  const memoizedToast = useCallback(toast, [toast]);


  const toggleEpisodeDescription = useCallback((episodeId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedEpisodes(prev => ({
      ...prev,
      [episodeId]: !prev[episodeId]
    }));
  }, []);

  // Convert videoSources to SourceDisplay array for display
  const sourceDisplays: SourceDisplay[] = useMemo(() => {
    return videoSources.map(source => ({
      key: source.key,
      name: source.name,
      sandbox: (source as any).sandbox
    }));
  }, []);

  // Optimized load more episodes for mobile
  useEffect(() => {
    if (!isMobile || episodes.length <= visibleEpisodesCount) return;

    const loadMoreTrigger = document.getElementById('load-more-trigger');
    if (!loadMoreTrigger) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingMore && visibleEpisodesCount < episodes.length) {
          setIsLoadingMore(true);
          setTimeout(() => {
            setVisibleEpisodesCount(prev => Math.min(prev + 10, episodes.length));
            setIsLoadingMore(false);
          }, 100);
        }
      },
      { threshold: 0.1 }
    );

    observerRef.current.observe(loadMoreTrigger);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [isMobile, episodes.length, visibleEpisodesCount, isLoadingMore]);

  // Synchronize selectedSource with userPreferences.preferred_source
  useEffect(() => {
    if (userPreferences?.preferred_source && videoSources.some(src => src.key === userPreferences.preferred_source)) {
      setSelectedSource(userPreferences.preferred_source);
      localStorage.setItem('selectedVideoSource', userPreferences.preferred_source);
    } else {
      const storedSource = localStorage.getItem('selectedVideoSource');
      if (storedSource && videoSources.some(src => src.key === storedSource)) {
        setSelectedSource(storedSource);
      } else {
        setSelectedSource(videoSources[0].key);
        localStorage.setItem('selectedVideoSource', videoSources[0].key);
      }
    }
  }, [userPreferences?.preferred_source]);

  useEffect(() => {
    if (user && id && mediaType) {
      const mediaId = parseInt(id, 10);
      setIsFavorite(isInFavorites(mediaId, mediaType));
      setIsInMyWatchlist(isInWatchlist(mediaId, mediaType));
    } else {
      setIsFavorite(false);
      setIsInMyWatchlist(false);
    }
  }, [user, id, mediaType, isInFavorites, isInWatchlist]);

  const updateEmbedUrl = useCallback(async (mediaId: number, seasonNum?: number, episodeNum?: number) => {
    const source = videoSources.find(src => src.key === selectedSource);
    if (!source) {
      console.error(`No source found for key: ${selectedSource}`);
      return;
    }
    
    let url: string | undefined;

    if (mediaType === 'movie') {
      url = source.getMovieUrl(mediaId);
    } else if (mediaType === 'tv' && seasonNum && episodeNum) {
      url = source.getTVUrl(mediaId, seasonNum, episodeNum);
    }

    if (url) {
      setEmbedUrl(url);
    } else {
      const nextSource = videoSources.find(src => src.key !== selectedSource);
      if (nextSource) {
        setSelectedSource(nextSource.key);
        localStorage.setItem('selectedVideoSource', nextSource.key);
        memoizedToast({
          title: "Source Error",
          description: `Failed to load video source: ${source.name}. Switching to ${nextSource.name}.`,
          variant: "destructive"
        });
        if (mediaType === 'movie') {
          setEmbedUrl(nextSource.getMovieUrl(mediaId));
        } else if (mediaType === 'tv' && seasonNum && episodeNum) {
          setEmbedUrl(nextSource.getTVUrl(mediaId, seasonNum, episodeNum));
        }
      } else {
        memoizedToast({
          title: "No Available Sources",
          description: "All video sources failed to load. Please try again later.",
          variant: "destructive"
        });
        setEmbedUrl('');
      }
    }
  }, [selectedSource, mediaType, memoizedToast]);

  useEffect(() => {
    let isMounted = true;
    
    const fetchMediaDetails = async () => {
      if (!id || !isMounted) return;
      
      if (!mediaDetails || parseInt(id, 10) !== mediaDetails.id) {
        setIsLoading(true);
        setMediaDetails(null);
        setEpisodes([]);
        setEmbedUrl('');
      }

      try {
        const mediaId = parseInt(id, 10);
        const isTV = season !== undefined || episode !== undefined;
        const detectedMediaType = isTV ? 'tv' : 'movie';
        
        setMediaType(detectedMediaType);

        const seasonNum = season ? parseInt(season, 10) : 1;
        const episodeNum = episode ? parseInt(episode, 10) : 1;

        if (detectedMediaType === 'movie') {
          const movieDetails = await getMovieDetails(mediaId);
          if (movieDetails && isMounted) {
            setTitle(movieDetails.title || 'Untitled Movie');
            setMediaDetails(movieDetails);
          }
        } else {
          if (isNaN(seasonNum) || isNaN(episodeNum)) {
            memoizedNavigate(`/player/tv/${id}/1/1`, { replace: true });
            return;
          }

          const tvDetails = await getTVDetails(mediaId);
          if (tvDetails && isMounted) {
            const seasonData = await getSeasonDetails(mediaId, seasonNum);
            if (isMounted) {
              setEpisodes(seasonData);
              const currentEpisodeNumber = episodeNum;
              const episodeIndex = seasonData.findIndex(ep => ep.episode_number === currentEpisodeNumber);
              setCurrentEpisodeIndex(episodeIndex !== -1 ? episodeIndex : 0);
              
              const episodeTitle = seasonData.find(ep => ep.episode_number === currentEpisodeNumber)?.name || '';
              setTitle(`${tvDetails.name || 'Untitled Show'} - Season ${seasonNum} Episode ${episodeNum}${episodeTitle ? ': ' + episodeTitle : ''}`);
              setMediaDetails(tvDetails);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching media details:', error);
        if (isMounted) {
          memoizedToast({
            title: "Error loading content",
            description: "There was a problem loading the media. Please try again.",
            variant: "destructive"
          });
          memoizedNavigate('/');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
          setHasInitialized(true);
        }
      }
    };
    
    fetchMediaDetails();
    
    return () => {
      isMounted = false;
    };
  }, [id, season, episode, memoizedNavigate, memoizedToast]);

  useEffect(() => {
    if (!id || !hasInitialized || !mediaDetails) return;
    
    const mediaId = parseInt(id, 10);
    const seasonNum = season ? parseInt(season, 10) : 1;
    const episodeNum = episode ? parseInt(episode, 10) : 1;

    if (mediaType === 'movie') {
      updateEmbedUrl(mediaId);
    } else if (mediaType === 'tv' && !isNaN(seasonNum) && !isNaN(episodeNum)) {
      updateEmbedUrl(mediaId, seasonNum, episodeNum);
    }
  }, [id, season, episode, hasInitialized, mediaDetails, updateEmbedUrl, mediaType]);

  // Optimized watch progress hook
  useWatchProgress(
    id ? parseInt(id, 10) : undefined,
    mediaType,
    season ? parseInt(season, 10) : undefined,
    episode ? parseInt(episode, 10) : undefined,
    mediaDetails,
    title
  );

  const handleAutoNextToggle = useCallback((enabled: boolean) => {
    setAutoNextEnabled(enabled);
    localStorage.setItem('autoNextEnabled', enabled.toString());
    
    memoizedToast({
      title: enabled ? "Auto-Next Enabled" : "Auto-Next Disabled",
      description: enabled 
        ? "Next episode will play automatically when current one ends." 
        : "Auto-next feature is now disabled.",
      duration: 3000,
    });
  }, [memoizedToast]);

  const handleSourceChange = useCallback(async (sourceKey: string) => {
    if (!videoSources.some(src => src.key === sourceKey)) {
      memoizedToast({
        title: "Invalid Source",
        description: `The selected source is not valid.`,
        variant: "destructive"
      });
      return;
    }

    setSelectedSource(sourceKey);
    localStorage.setItem('selectedVideoSource', sourceKey);
    if (user) {
      await updatePreferences({ preferred_source: sourceKey });
    }
    const sourceName = videoSources.find(s => s.key === sourceKey)?.name || 'new source';
    memoizedToast({
      title: "Source Changed",
      description: `Switched to ${sourceName}`,
      duration: 3000,
    });

    if (id && mediaDetails) {
      const mediaId = parseInt(id, 10);
      const seasonNum = season ? parseInt(season, 10) : 1;
      const episodeNum = episode ? parseInt(episode, 10) : 1;
      updateEmbedUrl(mediaId, mediaType === 'tv' ? seasonNum : undefined, mediaType === 'tv' ? episodeNum : undefined);
    }
  }, [user, updatePreferences, memoizedToast, id, mediaDetails, mediaType, season, episode, updateEmbedUrl]);

  const goToDetails = useCallback(() => {
    if (id) {
      memoizedNavigate(`/${mediaType}/${id}`);
    }
  }, [id, mediaType, memoizedNavigate]);

  const goToNextEpisode = useCallback(async () => {
    if (mediaType !== 'tv' || !id || !season || !mediaDetails) return;

    const currentSeasonNum = parseInt(season, 10);
    if (episodes.length === 0 || currentEpisodeIndex >= episodes.length - 1) {
      const tvDetails = mediaDetails as TVDetails;
      const nextSeasonNum = currentSeasonNum + 1;
      const nextSeason = tvDetails.seasons.find(s => s.season_number === nextSeasonNum);
      
      if (nextSeason && nextSeason.episode_count > 0) {
        try {
          const seasonData = await getSeasonDetails(parseInt(id, 10), nextSeasonNum);
          if (seasonData.length > 0) {
            setEpisodes(seasonData);
            setSelectedSeason(nextSeasonNum.toString());
            setCurrentEpisodeIndex(0);
            setVisibleEpisodesCount(10);
            const nextUrl = `/player/tv/${id}/${nextSeasonNum}/${seasonData[0].episode_number}`;
            memoizedNavigate(nextUrl, { replace: false });
            memoizedToast({ 
              title: "Navigation", 
              description: `Playing Season ${nextSeasonNum}, Episode 1: ${seasonData[0].name}` 
            });
          } else {
            memoizedToast({ 
              title: "No More Episodes", 
              description: "This was the last episode of the series.", 
              variant: "default" 
            });
          }
        } catch (error) {
          console.error('Error fetching next season:', error);
          memoizedToast({
            title: "Error",
            description: "Failed to load next season.",
            variant: "destructive"
          });
        }
      } else {
        memoizedToast({ 
          title: "No More Seasons", 
          description: "This was the last season of the series.", 
          variant: "default" 
        });
      }
      return;
    }

    const nextEpisode = episodes[currentEpisodeIndex + 1];
    const nextUrl = `/player/tv/${id}/${season}/${nextEpisode.episode_number}`;
    memoizedNavigate(nextUrl, { replace: false });
    setCurrentEpisodeIndex(currentEpisodeIndex + 1);
    memoizedToast({ title: "Navigation", description: `Playing next episode: ${nextEpisode.name}` });
  }, [mediaType, id, season, episodes, currentEpisodeIndex, mediaDetails, memoizedNavigate, memoizedToast]);

  const goToPreviousEpisode = useCallback(() => {
    if (mediaType !== 'tv' || !id || !season || episodes.length === 0 || currentEpisodeIndex <= 0) return;
    const prevEpisode = episodes[currentEpisodeIndex - 1];
    const prevUrl = `/player/tv/${id}/${season}/${prevEpisode.episode_number}`;
    memoizedNavigate(prevUrl, { replace: false });
    setCurrentEpisodeIndex(currentEpisodeIndex - 1);
    memoizedToast({ title: "Navigation", description: `Playing previous episode: ${prevEpisode.name}` });
  }, [mediaType, id, season, episodes, currentEpisodeIndex, memoizedNavigate, memoizedToast]);
 
  const handleShuffleEpisode = useCallback(() => {
    if (mediaType !== 'tv' || !mediaDetails) {
      memoizedToast({
        title: "Not Available",
        description: "Shuffle is only available for TV shows.",
        variant: "default"
      });
      return;
    }
    
    const tvDetails = mediaDetails as TVDetails;
    if (!tvDetails.seasons || tvDetails.seasons.length === 0) {
      memoizedToast({
        title: "No Seasons Found",
        description: "This show doesn't have any seasons available.",
        variant: "default"
      });
      return;
    }
    
    const regularSeasons = tvDetails.seasons.filter(s => s.season_number > 0);
    
    if (regularSeasons.length === 0) {
      memoizedToast({
        title: "No Regular Seasons",
        description: "No regular seasons available for shuffling.",
        variant: "default"
      });
      return;
    }
    
    const randomSeason = regularSeasons[Math.floor(Math.random() * regularSeasons.length)];
    const seasonNumber = randomSeason.season_number;
    
    const fetchAndPlayRandomEpisode = async () => {
      try {
        const seasonEpisodes = await getSeasonDetails(tvDetails.id, seasonNumber);
        
        if (seasonEpisodes.length === 0) {
          memoizedToast({
            title: "No Episodes",
            description: `Season ${seasonNumber} has no episodes available.`,
            variant: "default"
          });
          return;
        }
        
        const randomEpisode = seasonEpisodes[Math.floor(Math.random() * seasonEpisodes.length)];
        memoizedNavigate(`/player/tv/${tvDetails.id}/${seasonNumber}/${randomEpisode.episode_number}`);
        
        memoizedToast({
          title: "🎲 Shuffle Mode",
          description: `Playing Season ${seasonNumber}, Episode ${randomEpisode.episode_number}: ${randomEpisode.name || 'Untitled'}`,
        });
      } catch (error) {
        console.error('Error fetching season episodes for shuffle:', error);
        memoizedToast({
          title: "Shuffle Failed",
          description: "Could not load random episode. Please try again.",
          variant: "destructive"
        });
      }
    };
    
    fetchAndPlayRandomEpisode();
  }, [mediaType, mediaDetails, memoizedNavigate, memoizedToast]);

  const toggleFavorite = useCallback(() => {

    if (!mediaDetails || !id) return;
    const mediaId = parseInt(id, 10);
    if (isFavorite) {
      removeFromFavorites(mediaId, mediaType);
      setIsFavorite(false);
      memoizedToast({ title: "Removed from favorites", description: `${title} has been removed from your favorites.` });
    } else {
      addToFavorites({
        media_id: mediaId,
        media_type: mediaType,
        title: (mediaDetails as MovieDetails).title || (mediaDetails as TVDetails).name || '',
        poster_path: mediaDetails.poster_path,
        backdrop_path: mediaDetails.backdrop_path,
        overview: mediaDetails.overview,
        rating: mediaDetails.vote_average
      });
      setIsFavorite(true);
      memoizedToast({ title: "Added to favorites", description: `${title} has been added to your favorites.` });
    }
  }, [user, mediaDetails, id, isFavorite, mediaType, removeFromFavorites, addToFavorites, title, memoizedToast]);

  const toggleWatchlist = useCallback(() => {

    if (!mediaDetails || !id) return;
    const mediaId = parseInt(id, 10);
    if (isInMyWatchlist) {
      removeFromWatchlist(mediaId, mediaType);
      setIsInMyWatchlist(false);
      memoizedToast({ title: "Removed from watchlist", description: `${title} has been removed from your watchlist.` });
    } else {
      addToWatchlist({
        media_id: mediaId,
        media_type: mediaType,
        title: (mediaDetails as MovieDetails).title || (mediaDetails as TVDetails).name || '',
        poster_path: mediaDetails.poster_path,
        backdrop_path: mediaDetails.backdrop_path,
        overview: mediaDetails.overview,
        rating: mediaDetails.vote_average
      });
      setIsInMyWatchlist(true);
      memoizedToast({ title: "Added to watchlist", description: `${title} has been added to your watchlist.` });
    }
  }, [user, mediaDetails, id, isInMyWatchlist, mediaType, removeFromWatchlist, addToWatchlist, title, memoizedToast]);

  const handlePlayEpisode = useCallback((seasonNumber: number, episodeNumber: number) => {
    if (id) {
      const playUrl = `/player/tv/${id}/${seasonNumber}/${episodeNumber}`;
      memoizedNavigate(playUrl, { replace: false });
      setSelectedSeason(seasonNumber.toString());
      const episodeIndex = episodes.findIndex(ep => ep.episode_number === episodeNumber && ep.season_number === seasonNumber);
      setCurrentEpisodeIndex(episodeIndex !== -1 ? episodeIndex : 0);
      
      if (isMobile) {
        setIsEpisodeMenuOpen(false);
      }
    }
  }, [id, episodes, memoizedNavigate, isMobile]);

  const handleSeasonChange = useCallback(async (value: string) => {
    setSelectedSeason(value);
    if (id) {
      try {
        const seasonNum = parseInt(value, 10);
        const seasonData = await getSeasonDetails(parseInt(id, 10), seasonNum);
        setEpisodes(seasonData);
        setCurrentEpisodeIndex(0);
        setVisibleEpisodesCount(10);
        if (seasonData.length > 0) {
          const seasonUrl = `/player/tv/${id}/${seasonNum}/${seasonData[0].episode_number}`;
          memoizedNavigate(seasonUrl, { replace: false });
          
          if (isMobile) {
            setIsEpisodeMenuOpen(false);
          }
        }
      } catch (error) {
        console.error('Error fetching season details:', error);
        memoizedToast({
          title: "Error",
          description: "Failed to load season episodes.",
          variant: "destructive"
        });
      }
    }
  }, [id, memoizedNavigate, memoizedToast, isMobile]);

  const formatDate = useCallback((dateString: string) => {
    if (!dateString) return 'TBA';
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (error) {
      return 'Invalid date';
    }
  }, []);

  // Optimized message handler with throttling
  useEffect(() => {
    const throttledHandler = throttle((event: MessageEvent) => {
      const origins = SOURCE_ORIGINS[selectedSource];
      if (!origins || !origins.includes(event.origin)) return;

      if (event.data?.type === "MEDIA_DATA") {
        const mediaData = event.data.data;
        
        if (autoNextEnabled && 
            mediaType === 'tv' && 
            episodes.length > 0 && 
            id &&
            Object.keys(SOURCE_ORIGINS).includes(selectedSource)) {
          
          const mediaId = parseInt(id, 10);
          const currentSeasonNum = season ? parseInt(season, 10) : 1;
          const currentEpisodeNum = episode ? parseInt(episode, 10) : 1;
          
          const mediaEntry = Object.values(mediaData).find((entry: any) => 
            entry.id === mediaId || entry.id === mediaId.toString()
          );
          
          if (mediaEntry && (mediaEntry as any).type === "tv") {
            const showProgress = (mediaEntry as any).show_progress || (mediaEntry as any).showProgress;
            
            if (showProgress) {
              const episodeKey = `s${currentSeasonNum}e${currentEpisodeNum}`;
              const episodeProgress = showProgress[episodeKey];
              
              if (episodeProgress) {
                const progress = episodeProgress.progress || episodeProgress;
                if (progress && progress.duration > 0) {
                  const watchedPercentage = (progress.watched / progress.duration) * 100;
                  
                  if (watchedPercentage >= 95) {
                    goToNextEpisode();
                  }
                }
              }
            }
          }
        }
      }

      if (event.data?.type === "PLAYER_EVENT") {
        const { event: eventType } = event.data.data;
        
        if (eventType === "ended" && 
            autoNextEnabled && 
            mediaType === 'tv' && 
            Object.keys(SOURCE_ORIGINS).includes(selectedSource)) {
          goToNextEpisode();
        }
      }
    }, 100);

    window.addEventListener("message", throttledHandler);
    return () => {
      window.removeEventListener("message", throttledHandler);
    };
  }, [mediaType, episodes, id, season, episode, goToNextEpisode, selectedSource, autoNextEnabled]);

    // Optimized video end detection using requestAnimationFrame
  useEffect(() => {
    if (!iframeRef.current || !embedUrl || isLoading || mediaType !== 'tv' || !autoNextEnabled) return;

    const checkVideoEnded = (timestamp: number) => {
      if (timestamp - lastCheckTimeRef.current >= 1000) {
        try {
          const iframeDoc = iframeRef.current?.contentDocument;
          const videoElement = iframeDoc?.querySelector('video');
          if (videoElement && videoElement.ended && episodes.length > 0) {
            goToNextEpisode();
          }
        } catch (error) {
          // Silent fail - cross-origin restrictions
        }
        lastCheckTimeRef.current = timestamp;
      }
      animationFrameRef.current = requestAnimationFrame(checkVideoEnded);
    };

    animationFrameRef.current = requestAnimationFrame(checkVideoEnded);
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [embedUrl, isLoading, mediaType, episodes, goToNextEpisode, autoNextEnabled]);

  // Optimized sandbox error check with debounce
  // Sandbox error checking removed - no longer needed

  // Sandbox logic removed - all sources now have full permissions

  // Memoized episodes to render
  const episodesToRender = useMemo(() => {
    return isMobile ? episodes.slice(0, visibleEpisodesCount) : episodes;
  }, [episodes, isMobile, visibleEpisodesCount]);

  const hasMoreEpisodes = isMobile && visibleEpisodesCount < episodes.length;

  // Memoized source buttons using sourceDisplays
  const sourceButtons = useMemo(() => {
    return sourceDisplays.map((source) => (
      <SourceButton
        key={source.key}
        source={source}
        isSelected={selectedSource === source.key}
        onClick={() => handleSourceChange(source.key)}
      />
    ));
  }, [sourceDisplays, selectedSource, handleSourceChange]);

  // Render mobile episode menu button
  const renderMobileEpisodeButton = useCallback(() => {
    if (mediaType !== 'tv' || !mediaDetails) return null;
    
    return (
      <button
        onClick={() => setIsEpisodeMenuOpen(prev => !prev)}
        className="fixed right-0 top-1/2 z-40 bg-gradient-to-l from-accent/30 to-accent/10 backdrop-blur-md p-3 rounded-l-xl border border-r-0 border-white/20 shadow-2xl transition-transform active:scale-95"
        style={{ transform: 'translateY(-50%)' }}
      >
        <div className="flex flex-col items-center">
          <ChevronLeft className="h-5 w-5 text-white" />
          <span className="text-xs font-medium text-white mt-1">Episodes</span>
          <span className="text-[10px] text-white/80 mt-0.5">Season {selectedSeason}</span>
        </div>
      </button>
    );
  }, [mediaType, mediaDetails, selectedSeason]);

  // Render mobile episode menu
  const renderMobileEpisodeMenu = useCallback(() => {
    if (mediaType !== 'tv' || !mediaDetails) return null;
    
    return (
      <>
        <div 
          className={`fixed inset-0 bg-black/80 backdrop-blur-sm z-50 transition-opacity duration-200 ${
            isEpisodeMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          onClick={() => setIsEpisodeMenuOpen(false)}
        />
        
        <div 
          className={`fixed right-0 top-0 bottom-0 w-[85%] max-w-sm bg-gradient-to-b from-background to-background/95 backdrop-blur-xl z-50 border-l border-white/10 shadow-2xl transition-transform duration-300 ease-out ${
            isEpisodeMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white/80 hover:text-white"
                  onClick={() => setIsEpisodeMenuOpen(false)}
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
                <h3 className="text-xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                  Episodes
                </h3>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                <Tv className="h-4 w-4 text-accent" />
                <span className="text-sm text-white/80">
                  Season {selectedSeason}
                </span>
              </div>
            </div>
            
            <div className="p-4 border-b border-white/10">
              <Select 
                value={selectedSeason}
                onValueChange={handleSeasonChange}
              >
                <SelectTrigger className="h-12 bg-black/30 border-white/10 hover:border-white/20 text-white w-full">
                  <div className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-accent" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    <SelectValue placeholder="Select a season" />
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-black/95 backdrop-blur-lg border-white/10 text-white">
                  {(mediaDetails as TVDetails).seasons
                    .filter(season => season.season_number > 0)
                    .map(season => (
                      <SelectItem 
                        key={season.id} 
                        value={season.season_number.toString()}
                        className="focus:bg-white/10 hover:bg-white/10 transition-colors cursor-pointer py-3"
                      >
                        <span>Season {season.season_number}</span>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 scrollbar-thin contain-content">
              <div className="space-y-3">
                {episodesToRender.length > 0 ? (
                  <>
                    {episodesToRender.map((ep) => (
                      <EpisodeCard
                        key={ep.id}
                        episode={ep}
                        isCurrentEpisode={
                          parseInt(season || '0', 10) === ep.season_number && 
                          parseInt(episode || '0', 10) === ep.episode_number
                        }
                        onPlay={handlePlayEpisode}
                        onToggleDescription={toggleEpisodeDescription}
                        isExpanded={expandedEpisodes[ep.id] || false}
                        formatDate={formatDate}
                        isMobile={true}
                      />
                    ))}
                    {hasMoreEpisodes && (
                      <div id="load-more-trigger" className="h-10 flex items-center justify-center">
                        {isLoadingMore && (
                          <div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-10">
                    <div className="inline-flex p-4 rounded-full bg-white/5 mb-4">
                      <Film className="h-8 w-8 text-white/40" />
                    </div>
                    <p className="text-white/70 text-sm">
                      No episodes available for this season.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }, [mediaType, mediaDetails, isEpisodeMenuOpen, selectedSeason, handleSeasonChange, episodesToRender, season, episode, handlePlayEpisode, toggleEpisodeDescription, expandedEpisodes, formatDate, hasMoreEpisodes, isLoadingMore]);

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 bg-gradient-to-b from-background/95 to-background pointer-events-none" />
      
      <nav className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/80 to-transparent">
        <Navbar />
      </nav>

      <div className="relative z-10 container mx-auto px-4">
        <div className="flex items-center gap-4 py-4 mt-16">
          <Button
            variant="ghost"
            size="sm"
            className="text-white/80 hover:text-white transition-colors"
            onClick={() => memoizedNavigate(-1)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          <h1 className="text-xl md:text-2xl font-semibold truncate flex-1">{title}</h1>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "rounded-full transition-colors duration-200",
                isFavorite ? "text-red-500 hover:text-red-600" : "text-white/80 hover:text-white"
              )}
              onClick={toggleFavorite}
            >
              <Heart className={cn("h-5 w-5", isFavorite && "fill-current")} />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "rounded-full transition-colors duration-200",
                isInMyWatchlist ? "text-accent hover:text-accent/90" : "text-white/80 hover:text-white"
              )}
              onClick={toggleWatchlist}
            >
              <Bookmark className={cn("h-5 w-5", isInMyWatchlist && "fill-current")} />
            </Button>
          </div>
        </div>


        <div className={cn(
          "max-w-7xl mx-auto",
          isMobile ? "flex flex-col" : "flex flex-col md:flex-row gap-8"
        )}>
          <div className="flex-1">
            <div className="relative aspect-video rounded-lg overflow-hidden shadow-2xl bg-black">
              {isLoading ? (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <div className="w-12 h-12 border-3 border-accent/30 border-t-accent rounded-full animate-spin" />
                </div>
              ) : embedUrl ? (
                <iframe
                  ref={iframeRef}
                  src={embedUrl}
                  className="w-full h-full"
                  title={title}
                  allowFullScreen
                  referrerPolicy="no-referrer"
                  allow="autoplay; encrypted-media; fullscreen"
                  loading="lazy"
                />
              ) : (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <p className="text-white text-lg">Failed to load video. Please try another source.</p>
                </div>
              )}
            </div> 

            {mediaType === 'tv' && episodes.length > 1 && (
              <div className="mt-6 flex justify-center gap-4">
                <Button
                  variant="outline"
                  size={isMobile ? "icon" : "lg"}
                  onClick={goToPreviousEpisode}
                  disabled={currentEpisodeIndex <= 0}
                  className="border-white/10 bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-colors duration-200"
                >
                  <SkipBack className="h-5 w-5" />
                  {!isMobile && <span className="ml-2">Previous</span>}
                </Button>
                
                <Button
                  variant="outline"
                  size={isMobile ? "icon" : "lg"}
                  onClick={goToNextEpisode}
                  disabled={currentEpisodeIndex >= episodes.length - 1 && !(mediaDetails as TVDetails)?.seasons.find(s => s.season_number === parseInt(season || '0', 10) + 1)}
                  className="border-white/10 bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-colors duration-200"
                >
                  {!isMobile && <span className="mr-2">Next</span>}
                  <SkipForward className="h-5 w-5" />
                </Button>
              </div>
            )}
            
            <div className="mt-8 mb-12">
              <div className="space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <AutoNextEpisode
                      isEnabled={autoNextEnabled}
                      onToggle={handleAutoNextToggle}
                      currentSource={selectedSource}
                      mediaType={mediaType}
                      currentEpisode={
                        mediaType === 'tv' && season && episode 
                          ? { 
                              season: parseInt(season, 10), 
                              episode: parseInt(episode, 10) 
                            }
                          : undefined
                      }
                      onNextEpisode={goToNextEpisode}
                      onPreviousEpisode={goToPreviousEpisode}
                      hasNextEpisode={
                        mediaType === 'tv' && 
                        (currentEpisodeIndex < episodes.length - 1 || 
                         !!((mediaDetails as TVDetails)?.seasons.find(
                           s => s.season_number === parseInt(season || '0', 10) + 1
                         )))
                      }
                    />

                    <Button
                      variant="outline"
                      size="sm"
                      className="border-white/10 bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-colors duration-200"
                      onClick={goToDetails}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Details
                    </Button>
 
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 border-0"
                      onClick={handleShuffleEpisode}
                    >
                      <Shuffle className="h-4 w-4 mr-2" />
                      Shuffle
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {sourceButtons}
                </div>
              </div>
            </div>
          </div>

          {/* Desktop Episodes Panel */}
          {!isMobile && mediaType === 'tv' && mediaDetails && (
            <div className="w-full md:w-[440px] flex-shrink-0 md:-ml-32 md:translate-x-32">
              <div className="bg-gradient-to-br from-background/80 to-background/40 backdrop-blur-xl p-6 rounded-xl shadow-2xl border border-white/10">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                    Episodes
                  </h3>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                    <Tv className="h-4 w-4 text-accent" />
                    <span className="text-sm text-white/80">
                      Season {selectedSeason}
                    </span>
                  </div>
                </div>
                
                <div className="mb-6">
                  <Select 
                    value={selectedSeason}
                    onValueChange={handleSeasonChange}
                  >
                    <SelectTrigger className="h-11 bg-black/30 border-white/10 hover:border-white/20 text-white w-full">
                      <div className="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-accent" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                        <SelectValue placeholder="Select a season" />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="bg-black/95 backdrop-blur-lg border-white/10 text-white">
                      {(mediaDetails as TVDetails).seasons
                        .filter(season => season.season_number > 0)
                        .map(season => (
                          <SelectItem 
                            key={season.id} 
                            value={season.season_number.toString()}
                            className="focus:bg-white/10 hover:bg-white/10 transition-colors cursor-pointer py-3"
                          >
                            <span>Season {season.season_number}</span>
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent pointer-events-none z-10" />
                  <div 
                    className="space-y-3 max-h-[70vh] overflow-y-auto pr-2 scrollbar-thin contain-content"
                    style={{
                      scrollbarWidth: 'thin',
                      scrollbarColor: 'rgba(255, 255, 255, 0.2) transparent',
                    }}
                  >
                    {episodes.length > 0 ? (
                      episodes.map((ep) => (
                        <EpisodeCard
                          key={ep.id}
                          episode={ep}
                          isCurrentEpisode={
                            parseInt(season || '0', 10) === ep.season_number && 
                            parseInt(episode || '0', 10) === ep.episode_number
                          }
                          onPlay={handlePlayEpisode}
                          onToggleDescription={toggleEpisodeDescription}
                          isExpanded={expandedEpisodes[ep.id] || false}
                          formatDate={formatDate}
                          isMobile={false}
                        />
                      ))
                    ) : (
                      <div className="text-center py-10">
                        <div className="inline-flex p-4 rounded-full bg-white/5 mb-4">
                          <Film className="h-8 w-8 text-white/40" />
                        </div>
                        <p className="text-white/70 text-sm">
                          No episodes available for this season.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          {userPreferences?.adsEnabled && <Ads />}
        </div>
      </div>

      {/* Mobile Episode Menu */}
      {isMobile && renderMobileEpisodeButton()}
      {isMobile && renderMobileEpisodeMenu()}
    </div>
  );
};

export default Player;
