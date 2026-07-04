import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTVDetails, getTVRecommendations, getSeasonDetails, backdropSizes, posterSizes, getTVTrailer } from '@/utils/api';
import { TVDetails, Episode, Media } from '@/utils/types';
import { Button } from '@/components/ui/button';
import ContentRow from '@/components/ContentRow';
import Navbar from '@/components/Navbar';
import ReviewSection from '@/components/ReviewSection';
import { Play, Calendar, Star, ArrowLeft, List, Shield, History, Heart, Bookmark, Shuffle } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useWatchHistory } from '@/hooks/watch-history';
import { format } from 'date-fns';
import Ads from '@/components/Ads';
import DownloadTVButton from '@/components/DownloadTVButton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUserPreferences } from '@/hooks/user-preferences';


const TVDetailsPage = () => {
  const { userPreferences } = useUserPreferences();
  const { id } = useParams<{ id: string }>();
  const [tvShow, setTVShow] = useState<TVDetails | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [backdropLoaded, setBackdropLoaded] = useState(false);
  const [logoLoaded, setLogoLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState<'episodes' | 'about' | 'reviews'>('episodes');
  const [recommendations, setRecommendations] = useState<Media[]>([]);
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { watchHistory, addToFavorites, addToWatchlist, removeFromFavorites, removeFromWatchlist, isInFavorites, isInWatchlist } = useWatchHistory();
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isInMyWatchlist, setIsInMyWatchlist] = useState(false);
  
  useEffect(() => {
    const fetchTVData = async () => {
      if (!id) {
        setError("TV show ID is required");
        setIsLoading(false);
        return;
      }

      const tvId = parseInt(id, 10);
      if (isNaN(tvId)) {
        setError("Invalid TV show ID");
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        setError(null);
        const [tvData, recommendationsData] = await Promise.all([
          getTVDetails(tvId),
          getTVRecommendations(tvId)
        ]);
        
        if (!tvData) {
          setError("TV show not found");
          return;
        }

        setTVShow(tvData);
        setRecommendations(recommendationsData);
        
        if (tvData.seasons && tvData.seasons.length > 0) {
          const firstSeason = tvData.seasons.find(s => s.season_number > 0);
          if (firstSeason) {
            setSelectedSeason(firstSeason.season_number);
          }
        }
      } catch (error) {
        console.error('Error fetching TV show data:', error);
        setError("Failed to load TV show data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTVData();
  }, [id]);
  
  useEffect(() => {
    const fetchEpisodes = async () => {
      if (!tvShow || !selectedSeason) return;
      
      try {
        const episodesData = await getSeasonDetails(tvShow.id, selectedSeason);
        setEpisodes(episodesData);
      } catch (error) {
        console.error('Error fetching episodes:', error);
      }
    };
    
    fetchEpisodes();
  }, [tvShow, selectedSeason]);

  useEffect(() => {
    const fetchTrailer = async () => {
      if (tvShow?.id) {
        try {
          const trailerData = await getTVTrailer(tvShow.id);
          setTrailerKey(trailerData);
        } catch (error) {
          console.error('Error fetching trailer:', error);
        }
      }
    };
    
    fetchTrailer();
  }, [tvShow?.id]);

  useEffect(() => {
    if (tvShow?.id) {
      setIsFavorite(isInFavorites(tvShow.id, 'tv'));
      setIsInMyWatchlist(isInWatchlist(tvShow.id, 'tv'));
    }
  }, [tvShow?.id, isInFavorites, isInWatchlist]);
  
  const handlePlayEpisode = (seasonNumber: number, episodeNumber: number) => {
    if (tvShow) {
      navigate(`/player/tv/${tvShow.id}/${seasonNumber}/${episodeNumber}`);
    }
  };

  const handleToggleFavorite = () => {
    if (!tvShow) return;
    
    if (isFavorite) {
      removeFromFavorites(tvShow.id, 'tv');
      setIsFavorite(false);
    } else {
      addToFavorites({
        media_id: tvShow.id,
        media_type: 'tv',
        title: tvShow.name,
        poster_path: tvShow.poster_path,
        backdrop_path: tvShow.backdrop_path,
        overview: tvShow.overview,
        rating: tvShow.vote_average
      });
      setIsFavorite(true);
    }
  };

  const handleToggleWatchlist = () => {
    if (!tvShow) return;
    
    if (isInMyWatchlist) {
      removeFromWatchlist(tvShow.id, 'tv');
      setIsInMyWatchlist(false);
    } else {
      addToWatchlist({
        media_id: tvShow.id,
        media_type: 'tv',
        title: tvShow.name,
        poster_path: tvShow.poster_path,
        backdrop_path: tvShow.backdrop_path,
        overview: tvShow.overview,
        rating: tvShow.vote_average
      });
      setIsInMyWatchlist(true);
    }
  };


  const getLastWatchedEpisode = () => {
    if (!tvShow || !watchHistory.length) return null;

    const tvWatchHistory = watchHistory.filter(
      item => item.media_id === tvShow.id && item.media_type === 'tv'
    );

    if (!tvWatchHistory.length) return null;

    const lastWatched = tvWatchHistory.reduce((latest, current) => {
      return new Date(current.created_at) > new Date(latest.created_at) ? current : latest;
    });

    return {
      season: lastWatched.season,
      episode: lastWatched.episode,
      progress: Math.round((lastWatched.watch_position / lastWatched.duration) * 100)
    };
  };
  
  const formatSeasonEpisodeCount = (count: number) => {
    return `${count} ${count === 1 ? 'Episode' : 'Episodes'}`;
  };
  
  const formatDate = (dateString: string) => {
    if (!dateString) return 'TBA';
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (error) {
      return 'Invalid date';
    }
  };
  const handleShuffleEpisode = () => {
  if (!tvShow || !tvShow.seasons || tvShow.seasons.length === 0) return;
  
  // Filter out season 0 (specials) if you want to avoid them
  const regularSeasons = tvShow.seasons.filter(season => season.season_number > 0);
  
  if (regularSeasons.length === 0) return;
  
  // Select a random season
  const randomSeason = regularSeasons[Math.floor(Math.random() * regularSeasons.length)];
  const seasonNumber = randomSeason.season_number;
  
  // Fetch episodes for the random season to get episode count
  const fetchAndPlayRandomEpisode = async () => {
    try {
      const seasonEpisodes = await getSeasonDetails(tvShow.id, seasonNumber);
      
      if (seasonEpisodes.length === 0) return;
      
      // Select a random episode from that season
      const randomEpisode = seasonEpisodes[Math.floor(Math.random() * seasonEpisodes.length)];
      
      // Navigate to the player with the random season and episode
      navigate(`/player/tv/${tvShow.id}/${seasonNumber}/${randomEpisode.episode_number}`);
    } catch (error) {
      console.error('Error fetching season episodes for shuffle:', error);
    }
  };
  
  fetchAndPlayRandomEpisode();
};
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-pulse-slow text-white font-medium">Loading...</div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <h1 className="text-2xl text-white mb-4">{error}</h1>
        <Button onClick={() => navigate('/')} variant="outline">
          Return to Home
        </Button>
      </div>
    );
  }
  
  if (!tvShow) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <h1 className="text-2xl text-white mb-4">TV Show not found</h1>
        <Button onClick={() => navigate('/')} variant="outline">
          Return to Home
        </Button>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="relative w-full h-[70vh]">
        {!backdropLoaded && (
          <div className="absolute inset-0 bg-background image-skeleton" />
        )}
        
        <button 
          onClick={() => navigate(-1)}
          className="absolute top-20 left-6 z-10 text-white p-2 rounded-full bg-black/30 hover:bg-black/50 transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        
        <img
          src={`${backdropSizes.original}${tvShow.backdrop_path}`}
          alt={tvShow.name || 'TV Show backdrop'}
          className={`w-full h-full object-cover transition-opacity duration-700 ${
            backdropLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setBackdropLoaded(true)}
        />
        
        {!isMobile && trailerKey && (
          <div className="absolute inset-0 bg-black/60">
            <iframe
              className="w-full h-full"
              src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&mute=1&controls=0&modestbranding=1&loop=1&playlist=${trailerKey}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        )}

        <div className="absolute inset-0 details-gradient" />
        
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 lg:p-16">
          <div className="flex flex-col md:flex-row items-start gap-6 max-w-6xl mx-auto">
            <div className="hidden md:block flex-shrink-0 w-48 xl:w-64 rounded-lg overflow-hidden shadow-lg">
              <img 
                src={`${posterSizes.medium}${tvShow.poster_path}`} 
                alt={tvShow.name || 'TV show poster'} 
                className="w-full h-auto"
              />
            </div>
            
            <div className="flex-1 animate-slide-up">
              {tvShow.logo_path ? (
                <div className="relative w-full max-w-[300px] md:max-w-[400px] lg:max-w-[500px] mx-auto mb-4 
                              transition-all duration-300 ease-in-out hover:scale-105">
                  {!logoLoaded && (
                    <div className="absolute inset-0 bg-background image-skeleton rounded-lg" />
                  )}
                  
                  <img
                    src={`${backdropSizes.original}${tvShow.logo_path}`}
                    alt={tvShow.name}
                    className={`w-full h-auto object-contain filter drop-shadow-lg
                              transition-opacity duration-700 ease-in-out
                              ${logoLoaded ? 'opacity-100' : 'opacity-0'}`}
                    onLoad={() => setLogoLoaded(true)}
                  />
                </div>
              ) : (
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2 text-balance
                             animate-fade-in">
                  {tvShow.name}
                </h1>
              )}
              
              {tvShow.tagline && (
                <p className="text-white/70 mb-4 italic text-lg">{tvShow.tagline}</p>
              )}
              
              <div className="flex flex-wrap items-center gap-4 mb-6">
                {tvShow.certification && (
                  <div className="flex items-center bg-white/20 px-2 py-1 rounded">
                    <Shield className="h-4 w-4 mr-1 text-white" />
                    <span className="text-white font-medium text-sm">{tvShow.certification}</span>
                  </div>
                )}
                
                {tvShow.first_air_date && (
                  <div className="flex items-center text-white/80">
                    <Calendar className="h-4 w-4 mr-2" />
                    {formatDate(tvShow.first_air_date)}
                  </div>
                )}
                
                <div className="flex items-center text-white/80">
                  <List className="h-4 w-4 mr-2" />
                  {tvShow.number_of_seasons} {tvShow.number_of_seasons === 1 ? 'Season' : 'Seasons'}
                </div>
                
                {tvShow.vote_average > 0 && (
                  <div className="flex items-center text-amber-400">
                    <Star className="h-4 w-4 mr-2 fill-amber-400" />
                    {tvShow.vote_average.toFixed(1)}
                  </div>
                )}
                
                <div className="flex flex-wrap gap-2">
                  {tvShow.genres.map((genre) => (
                    <span 
                      key={genre.id}
                      className="px-2 py-1 rounded bg-white/10 text-white/80 text-xs"
                    >
                      {genre.name}
                    </span>
                  ))}
                </div>
              </div>
              
              <p className="text-white/80 mb-6">{tvShow.overview}</p>
              
              <div className="flex flex-wrap gap-3">
                {episodes.length > 0 && (
                  <Button 
                    onClick={() => handlePlayEpisode(selectedSeason, 1)}
                    className="bg-accent hover:bg-accent/80 text-white flex items-center"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Play Latest Episode
                  </Button>
                )}
                <Button 
                 onClick={handleShuffleEpisode}
                 className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 flex items-center border-0"
            >
                <Shuffle className="h-4 w-4 mr-2 animate-pulse" />
                 Shuffle Episode
                </Button>

                {getLastWatchedEpisode() && (
                  <Button 
                    onClick={() => {
                      const lastWatched = getLastWatchedEpisode();
                      if (lastWatched) {
                        handlePlayEpisode(lastWatched.season, lastWatched.episode);
                      }
                    }}
                    variant="outline"
                    className="border-accent text-accent hover:bg-accent/10 flex items-center"
                  >
                    <History className="h-4 w-4 mr-2" />
                    Continue S{getLastWatchedEpisode()?.season} E{getLastWatchedEpisode()?.episode} ({getLastWatchedEpisode()?.progress}%)
                  </Button>
                )}

                <Button 
                  onClick={handleToggleFavorite}
                  variant="outline"
                  className={`border-white/20 ${isFavorite ? 'bg-accent text-white' : 'bg-black/50 text-white hover:bg-black/70'}`}
                >
                  <Heart className={`h-4 w-4 mr-2 ${isFavorite ? 'fill-current' : ''}`} />
                  {isFavorite ? 'In Favorites' : 'Add to Favorites'}
                </Button>

                <Button 
                  onClick={handleToggleWatchlist}
                  variant="outline"
                  className={`border-white/20 ${isInMyWatchlist ? 'bg-accent text-white' : 'bg-black/50 text-white hover:bg-black/70'}`}
                >
                  <Bookmark className={`h-4 w-4 mr-2 ${isInMyWatchlist ? 'fill-current' : ''}`} />
                  {isInMyWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
                </Button>

                <DownloadTVButton 
                  tmdbId={tvShow.id.toString()} 
                  showTitle={tvShow.name || 'Unknown'} 
                  season={selectedSeason} 
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      
 
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex border-b border-white/10 mb-6 overflow-x-auto pb-1 hide-scrollbar">
          <button
            className={`py-2 px-4 font-medium whitespace-nowrap ${
              activeTab === 'episodes' 
                ? 'text-white border-b-2 border-accent' 
                : 'text-white/60 hover:text-white'
            }`}
            onClick={() => setActiveTab('episodes')}
          >
            Episodes
          </button>
          <button
            className={`py-2 px-4 font-medium whitespace-nowrap ${
              activeTab === 'about' 
                ? 'text-white border-b-2 border-accent' 
                : 'text-white/60 hover:text-white'
            }`}
            onClick={() => setActiveTab('about')}
          >
            About
          </button>
          <button
            className={`py-2 px-4 font-medium whitespace-nowrap ${
              activeTab === 'reviews' 
                ? 'text-white border-b-2 border-accent' 
                : 'text-white/60 hover:text-white'
            }`}
            onClick={() => setActiveTab('reviews')}
          >
            Reviews
          </button>
        </div>
        
        {activeTab === 'episodes' && (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Seasons & Episodes</h2>
              <Select
                value={selectedSeason.toString()}
                onValueChange={(value) => setSelectedSeason(parseInt(value, 10))}
              >
                <SelectTrigger className="w-[180px] bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="Select season" />
                </SelectTrigger>
                <SelectContent className="bg-background text-white border-white/20">
                  {tvShow.seasons
                    .filter(season => season.season_number > 0)
                    .map(season => (
                      <SelectItem 
                        key={season.id}
                        value={season.season_number.toString()}
                        className="text-white hover:bg-accent/20"
                      >
                        Season {season.season_number}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-4">
              {episodes.length > 0 ? (
                episodes.map(episode => (
                  <div key={episode.id} className="glass p-4 rounded-lg">
                    <div className="flex flex-col md:flex-row gap-4">
                      {episode.still_path && (
                        <div className="flex-shrink-0 w-full md:w-48">
                          <img 
                            src={`${backdropSizes.small}${episode.still_path}`} 
                            alt={`${episode.name} still`}
                            className="w-full h-auto rounded-lg"
                          />
                        </div>
                      )}
                      
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h3 className="text-white font-medium">
                              {episode.episode_number}. {episode.name}
                            </h3>
                            {episode.air_date && (
                              <div className="flex items-center text-white/60 text-sm mt-1">
                                <Calendar className="h-3 w-3 mr-1" />
                                {formatDate(episode.air_date)}
                              </div>
                            )}
                          </div>
                          {episode.vote_average > 0 && (
                            <div className="flex items-center text-amber-400 text-sm">
                              <Star className="h-3 w-3 mr-1 fill-amber-400" />
                              {episode.vote_average.toFixed(1)}
                            </div>
                          )}
                        </div>
                        
                        <p className="text-white/70 text-sm mb-3 line-clamp-2">{episode.overview}</p>
                        
                        <Button 
                          onClick={() => handlePlayEpisode(episode.season_number, episode.episode_number)}
                          size="sm"
                          className="bg-accent hover:bg-accent/80 text-white flex items-center"
                        >
                          <Play className="h-3 w-3 mr-1" />
                          Play
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-white/70">
                  No episodes available for this season.
                </div>
              )}
            </div>
          </>
        )}
        
        {activeTab === 'about' && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-6">About the Show</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="glass p-6 rounded-xl">
                <h3 className="text-lg font-semibold text-white mb-3">Status</h3>
                <p className="text-white/80">{tvShow.status}</p>
              </div>
              
              <div className="glass p-6 rounded-xl">
                <h3 className="text-lg font-semibold text-white mb-3">Episodes</h3>
                <p className="text-white/80">{tvShow.number_of_episodes}</p>
              </div>
              
              <div className="glass p-6 rounded-xl">
                <h3 className="text-lg font-semibold text-white mb-3">Seasons</h3>
                <p className="text-white/80">{tvShow.number_of_seasons}</p>
              </div>
            </div>
            
            {tvShow.production_companies.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-white mb-4">Production Companies</h3>
                <div className="flex flex-wrap gap-6">
                  {tvShow.production_companies.map((company) => (
                    <div key={company.id} className="text-center">
                      {company.logo_path ? (
                        <div className="bg-white/10 p-3 rounded-lg w-24 h-16 flex items-center justify-center mb-2">
                          <img 
                            src={`${posterSizes.small}${company.logo_path}`} 
                            alt={company.name} 
                            className="max-w-full max-h-full"
                          />
                        </div>
                      ) : (
                        <div className="bg-white/10 p-3 rounded-lg w-24 h-16 flex items-center justify-center mb-2">
                          <span className="text-white/70 text-xs text-center">{company.name}</span>
                        </div>
                      )}
                      <p className="text-white/70 text-sm">{company.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'reviews' && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-6">User Reviews</h2>
            <ReviewSection mediaId={parseInt(id!, 10)} mediaType="tv" />
          </div>
        )}
      </div>
      
      {recommendations.length > 0 && (
        <ContentRow
          title="More Like This"
          media={recommendations}
        />
      )}
      {userPreferences?.adsEnabled && <Ads />}
    </div>
  );
};

export default TVDetailsPage;