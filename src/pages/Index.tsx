import { useState, useEffect } from 'react';
import {
  getTrending,
  getPopularMovies,
  getPopularTVShows,
  getTopRatedMovies,
  getTopRatedTVShows,
  getUpcomingMovies,
  getActionMovies,
  getComedySeries
} from '@/utils/api';
import { Media } from '@/utils/types';
import { useAuth } from '@/hooks';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import ContentRow from '@/components/ContentRow';
import ContinueWatching from '@/components/ContinueWatching';
import Footer from '@/components/Footer';
import Spinner from '@/components/ui/spinner';
import PWAInstallPrompt from '@/components/PWAInstallPrompt';
import Chatbot from '@/components/Chatbot';
import DiscordButton from '@/components/DiscordButton';
import Ads from '@/components/Ads';
import { Helmet } from 'react-helmet';
import { useUserPreferences } from '@/hooks/user-preferences';
import WelcomeDialog from '@/components/WelcomeDialog';

const Index = () => {
  const { userPreferences } = useUserPreferences();
  const { user } = useAuth();

  const [trendingMedia, setTrendingMedia] = useState<Media[]>([]);
  const [popularMovies, setPopularMovies] = useState<Media[]>([]);
  const [popularTVShows, setPopularTVShows] = useState<Media[]>([]);
  const [topRatedMovies, setTopRatedMovies] = useState<Media[]>([]);
  const [topRatedTVShows, setTopRatedTVShows] = useState<Media[]>([]);
  const [upcomingMovies, setUpcomingMovies] = useState<Media[]>([]);
  const [actionMovies, setActionMovies] = useState<Media[]>([]);
  const [comedySeries, setComedySeries] = useState<Media[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [contentVisible, setContentVisible] = useState(false);

  const [showWelcomeCard, setShowWelcomeCard] = useState(() => {
    return localStorage.getItem('hideWelcomeCard') !== 'true';
  });

  const [showWelcomeDialog, setShowWelcomeDialog] = useState(() => {
    return localStorage.getItem('hideWelcomeDialog') !== 'true';
  });

  const closeWelcomeDialog = () => {
    localStorage.setItem('hideWelcomeDialog', 'true');
    setShowWelcomeDialog(false);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [
          trendingData,
          popularMoviesData,
          popularTVData,
          topMoviesData,
          topTVData,
          upcomingMoviesData,
          actionMoviesData,
          comedySeriesData
        ] = await Promise.all([
          getTrending(),
          getPopularMovies(),
          getPopularTVShows(),
          getTopRatedMovies(),
          getTopRatedTVShows(),
          getUpcomingMovies(),
          getActionMovies(),
          getComedySeries()
        ]);

        const filteredTrendingData = trendingData.filter(
          item => item.backdrop_path
        );

        setTrendingMedia(filteredTrendingData);
        setPopularMovies(popularMoviesData);
        setPopularTVShows(popularTVData);
        setTopRatedMovies(topMoviesData);
        setTopRatedTVShows(topTVData);
        setUpcomingMovies(upcomingMoviesData);
        setActionMovies(actionMoviesData);
        setComedySeries(comedySeriesData);
      } catch (error) {
        console.error('Error fetching homepage data:', error);
      } finally {
        setIsLoading(false);
        setTimeout(() => setContentVisible(true), 300);
      }
    };

    fetchData();
  }, []);

  const closeWelcomeCard = () => {
    localStorage.setItem('hideWelcomeCard', 'true');
    setShowWelcomeCard(false);
  };

  return (
    <>
      <WelcomeDialog isOpen={showWelcomeDialog} onClose={closeWelcomeDialog} />

      <main className="min-h-screen bg-background pb-16">
        <Navbar />
        <PWAInstallPrompt />

        {isLoading ? (
          <div className="flex items-center justify-center min-h-screen">
            <Spinner size="lg" className="text-accent" />
          </div>
        ) : (
          <>
             <div className="pt-16">
                 {trendingMedia.length > 0 && (
                   <Hero
                     media={trendingMedia.slice(0, 5)}
                     className="hero"
                   />
                 )}
            </div>

            <div
              className={`mt-8 md:mt-12 transition-opacity duration-500 ${
                contentVisible ? 'opacity-100' : 'opacity-0'
              }`}
            >
              {user && <ContinueWatching />}

              <ContentRow title="Trending Now" media={trendingMedia} />
              <ContentRow title="Popular Movies" media={popularMovies} />
              <ContentRow title="Popular TV Shows" media={popularTVShows} />
              <ContentRow title="Top Rated Movies" media={topRatedMovies} />
              <ContentRow title="Top Rated TV Shows" media={topRatedTVShows} />
              <ContentRow title="Upcoming Movies" media={upcomingMovies} />
              <ContentRow title="Action Movies" media={actionMovies} />
              <ContentRow title="Comedy Series" media={comedySeries} />
            </div>
          </>
        )}

        <Footer />

        {userPreferences?.adsEnabled && <Ads />}
      </main>
    </>
  );
};

export default Index;
