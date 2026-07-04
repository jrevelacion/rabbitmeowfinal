import { useState, useEffect } from 'react';
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { getPopularTVShows, getTopRatedTVShows } from '@/utils/api';
import { Media } from '@/utils/types';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import MediaGrid from '@/components/MediaGrid';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Tv, ChevronDown, Grid3X3, List } from 'lucide-react';
import PageTransition from '@/components/PageTransition';
import { useToast } from '@/hooks/use-toast';
import { MediaGridSkeleton } from '@/components/MediaSkeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Ads from '@/components/Ads';
import { useUserPreferences } from '@/hooks/user-preferences';

const ITEMS_PER_PAGE = 20;

const TVShows = () => {
  const { userPreferences } = useUserPreferences();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'popular' | 'top_rated'>('popular');
  const [popularPage, setPopularPage] = useState(1);
  const [topRatedPage, setTopRatedPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [allPopularShows, setAllPopularShows] = useState<Media[]>([]);
  const [allTopRatedShows, setAllTopRatedShows] = useState<Media[]>([]);
  const [sortBy, setSortBy] = useState<'default' | 'name' | 'first_air_date' | 'rating'>('default');
  const [genreFilter, setGenreFilter] = useState<string>('all');

  const popularTVQuery = useQuery({
    queryKey: ['popularTV', popularPage],
    queryFn: () => getPopularTVShows(popularPage),
    placeholderData: keepPreviousData,
  });

  const topRatedTVQuery = useQuery({
    queryKey: ['topRatedTV', topRatedPage],
    queryFn: () => getTopRatedTVShows(topRatedPage),
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    if (popularTVQuery.data) {
      console.log('Raw Popular TV Data:', popularTVQuery.data);
      setAllPopularShows(prev => {
        const newShows = popularTVQuery.data
          .filter(show => !prev.some(p => p.id === (show.id || show.media_id || show.tmdb_id)))
          .map(show => {
            const transformedShow = {
              ...show,
              id: show.id || show.media_id || show.tmdb_id,
              media_id: show.id || show.media_id || show.tmdb_id,
              media_type: 'tv',
            };
            console.log('Transformed Popular Show:', transformedShow);
            return transformedShow;
          });
        return [...prev, ...newShows];
      });
    }
  }, [popularTVQuery.data]);

  useEffect(() => {
    if (topRatedTVQuery.data) {
      console.log('Raw Top Rated TV Data:', topRatedTVQuery.data);
      setAllTopRatedShows(prev => {
        const newShows = topRatedTVQuery.data
          .filter(show => !prev.some(p => p.id === (show.id || show.media_id || show.tmdb_id)))
          .map(show => {
            const transformedShow = {
              ...show,
              id: show.id || show.media_id || show.tmdb_id,
              media_id: show.id || show.media_id || show.tmdb_id,
              media_type: 'tv',
            };
            console.log('Transformed Top Rated Show:', transformedShow);
            return transformedShow;
          });
        return [...prev, ...newShows];
      });
    }
  }, [topRatedTVQuery.data]);

  useEffect(() => {
    if (popularTVQuery.data?.length === ITEMS_PER_PAGE) {
      queryClient.prefetchQuery({
        queryKey: ['popularTV', popularPage + 1],
        queryFn: () => getPopularTVShows(popularPage + 1),
      });
    }
  }, [popularPage, queryClient, popularTVQuery.data]);

  useEffect(() => {
    if (topRatedTVQuery.data?.length === ITEMS_PER_PAGE) {
      queryClient.prefetchQuery({
        queryKey: ['topRatedTV', topRatedPage + 1],
        queryFn: () => getTopRatedTVShows(topRatedPage + 1),
      });
    }
  }, [topRatedPage, queryClient, topRatedTVQuery.data]);

  const applyFiltersAndSort = (shows: Media[]) => {
    let filteredShows = [...shows];
    if (genreFilter !== 'all') {
      filteredShows = filteredShows.filter(show => 
        show.genre_ids?.includes(parseInt(genreFilter))
      );
    }
    switch (sortBy) {
      case 'name':
        filteredShows.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'first_air_date':
        filteredShows.sort((a, b) => 
          new Date(b.first_air_date).getTime() - new Date(a.first_air_date).getTime()
        );
        break;
      case 'rating':
        filteredShows.sort((a, b) => b.vote_average - a.vote_average);
        break;
      default:
        break;
    }
    return filteredShows;
  };

  const filteredPopularShows = applyFiltersAndSort(allPopularShows);
  const filteredTopRatedShows = applyFiltersAndSort(allTopRatedShows);

  const handleShowMorePopular = () => setPopularPage(prev => prev + 1);
  const handleShowMoreTopRated = () => setTopRatedPage(prev => prev + 1);
  const toggleViewMode = () => setViewMode(prev => prev === 'grid' ? 'list' : 'grid');
  const hasMorePopular = popularTVQuery.data?.length === ITEMS_PER_PAGE;
  const hasMoreTopRated = topRatedTVQuery.data?.length === ITEMS_PER_PAGE;

  return (
    <PageTransition>
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 animate-fade-in" style={{ animationDuration: '0.5s' }}>
          <div className="container px-4 py-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
              <div className="flex items-center gap-3 pt-10">
                <h1 className="text-3xl font-bold text-white"></h1>
              </div>
              <div className="flex items-center gap-4 pt-6">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[180px] border-white/10 text-white bg-transparent">
                    <SelectValue placeholder="Sort By" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border-white/10 text-white">
                    <SelectItem value="default">Default</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="first_air_date">First Air Date</SelectItem>
                    <SelectItem value="rating">Rating</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={genreFilter} onValueChange={setGenreFilter}>
                  <SelectTrigger className="w-[180px] border-white/10 text-white bg-transparent">
                    <SelectValue placeholder="Filter by Genre" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border-white/10 text-white">
                    <SelectItem value="all">All Genres</SelectItem>
                    <SelectItem value="10759">Action & Adventure</SelectItem>
                    <SelectItem value="35">Comedy</SelectItem>
                    <SelectItem value="18">Drama</SelectItem>
                    <SelectItem value="10765">Sci-Fi & Fantasy</SelectItem>
                    <SelectItem value="80">Crime</SelectItem>
                    <SelectItem value="9648">Mystery</SelectItem>
                    <SelectItem value="10762">Kids</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-white/10 text-white hover:bg-white/10 group"
                  onClick={toggleViewMode}
                >
                  {viewMode === 'grid' ? (
                    <>
                      <List className="mr-2 h-4 w-4 transition-transform group-hover:scale-110" />
                      List View
                    </>
                  ) : (
                    <>
                      <Grid3X3 className="mr-2 h-4 w-4 transition-transform group-hover:scale-110" />
                      Grid View
                    </>
                  )}
                </Button>
              </div>
            </div>
            <Tabs defaultValue="popular" onValueChange={(value) => setActiveTab(value as 'popular' | 'top_rated')}>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <TabsList className="mb-4 md:mb-0">
                  <TabsTrigger value="popular" className="data-[state=active]:bg-accent/20">Popular</TabsTrigger>
                  <TabsTrigger value="top_rated" className="data-[state=active]:bg-accent/20">Top Rated</TabsTrigger>
                </TabsList>
              </div>
              <TabsContent value="popular" className="focus-visible:outline-none animate-fade-in">
                {popularTVQuery.isLoading ? (
                  <MediaGridSkeleton listView={viewMode === 'list'} />
                ) : popularTVQuery.isError ? (
                  <div className="py-12 text-center text-white">Error loading TV shows. Please try again.</div>
                ) : (
                  <>
                     <MediaGrid media={filteredPopularShows} title="Popular TV Shows" listView={viewMode === 'list'} />
                    {hasMorePopular && (
                      <div className="flex justify-center my-8">
                        <Button
                          onClick={handleShowMorePopular}
                          variant="outline"
                          className="border-white/10 text-white hover:bg-accent/20 hover:border-accent/50 hover:text-white transition-all duration-300"
                        >
                          {popularTVQuery.isFetching ? (
                            <>Loading...</>
                          ) : (
                            <>Show More <ChevronDown className="ml-2 h-4 w-4 animate-bounce" /></>
                          )}
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </TabsContent>
              <TabsContent value="top_rated" className="focus-visible:outline-none animate-fade-in">
                {topRatedTVQuery.isLoading ? (
                  <MediaGridSkeleton listView={viewMode === 'list'} />
                ) : topRatedTVQuery.isError ? (
                  <div className="py-12 text-center text-white">Error loading TV shows. Please try again.</div>
                ) : (
                  <>
                    <MediaGrid media={filteredTopRatedShows} title="Top Rated TV Shows" listView={viewMode === 'list'} />
                    {hasMoreTopRated && (
                      <div className="flex justify-center my-8">
                        <Button
                          onClick={handleShowMoreTopRated}
                          variant="outline"
                          className="border-white/10 text-white hover:bg-accent/20 hover:border-accent/50 hover:text-white transition-all duration-300"
                        >
                          {topRatedTVQuery.isFetching ? (
                            <>Loading...</>
                          ) : (
                            <>Show More <ChevronDown className="ml-2 h-4 w-4 animate-bounce" /></>
                          )}
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </main>
        <Footer />
{userPreferences?.adsEnabled && <Ads />}      </div>
    </PageTransition>
  );
};

export default TVShows;