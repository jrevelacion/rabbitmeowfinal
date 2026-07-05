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

              {true && (
                <div className="mx-4 md:mx-8 mt-6">
                  <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-gradient-to-r from-zinc-900 to-zinc-950 shadow-xl">

                    <button
                      onClick={closeWelcomeCard}
                      className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-zinc-400 transition hover:bg-zinc-700 hover:text-white"
                    >
                      ✕
                    </button>

                    <div className="flex flex-col md:flex-row items-center gap-6 p-6 md:p-8">

                      <img
                        src="/logo2.png"
                        alt="RabbitMeow"
                        className="w-24 h-24 md:w-32 md:h-32 object-contain"
                      />

                      <div className="flex-1 text-center md:text-left">
                        <h2 className="text-2xl md:text-3xl font-bold text-white">
                          🐰🐱 Welcome to RabbitMeow
                        </h2>

                        <p className="mt-3 text-zinc-300">
                          Your cozy home for movies, TV shows, and sports.
                          Multiple streaming servers are available to help
                          you find the best viewing experience.
                        </p>

                        <div className="mt-4 flex flex-wrap gap-2 justify-center md:justify-start">
                          <span className="rounded-full bg-blue-500/20 px-3 py-1 text-sm text-blue-400">
                            Movies
                          </span>

                          <span className="rounded-full bg-purple-500/20 px-3 py-1 text-sm text-purple-400">
                            TV Shows
                          </span>

                          <span className="rounded-full bg-green-500/20 px-3 py-1 text-sm text-green-400">
                            Sports
                          </span>

                          <span className="rounded-full bg-pink-500/20 px-3 py-1 text-sm text-pink-400">
                            Rabbit & Cat Approved
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )} 
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
