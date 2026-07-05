import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SportsMatchGrid from '@/components/SportsMatchGrid';
import PageTransition from '@/components/PageTransition';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Sport } from '@/utils/sports-types';
import {
  getSportsList,
  getAllPopularMatches,
  getLiveMatches,
  getTodayMatches,
  getMatchesBySport,
} from '@/utils/sports-api';
import { useToast } from '@/hooks/use-toast';
import { useUserPreferences } from '@/hooks/user-preferences';
import Ads from '@/components/Ads';
import { Search, Radio, Sparkles, CalendarDays, Activity } from 'lucide-react';

const Sports = () => {
  const [activeTab, setActiveTab] = useState<string>('popular');
  const [selectedSport, setSelectedSport] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const { toast } = useToast();
  const { userPreferences } = useUserPreferences();
  const accentColor = userPreferences?.accentColor || 'hsl(var(--accent))';

  const {
    data: sportsList = [],
    isLoading: sportsLoading,
    error: sportsError
  } = useQuery({
    queryKey: ['sports-list'],
    queryFn: getSportsList
  });

  const { data: popularMatches = [], isLoading: popularLoading } = useQuery({
    queryKey: ['sports-popular-matches'],
    queryFn: getAllPopularMatches
  });

  const { data: liveMatches = [], isLoading: liveLoading } = useQuery({
    queryKey: ['sports-live-matches'],
    queryFn: getLiveMatches
  });

  const { data: todayMatches = [], isLoading: todayLoading } = useQuery({
    queryKey: ['sports-today-matches'],
    queryFn: getTodayMatches
  });

  const {
    data: sportMatches = [],
    isLoading: sportMatchesLoading
  } = useQuery({
    queryKey: ['sports-matches', selectedSport, activeTab],
    queryFn: async () => {
      if (selectedSport === 'all') return [];
      
      if (activeTab === 'popular') {
        const { getPopularMatchesBySport } = await import('@/utils/sports-api');
        return getPopularMatchesBySport(selectedSport);
      } else if (activeTab === 'live') {
        const allMatches = await getMatchesBySport(selectedSport);
        return allMatches.filter(match => match.status === 'live');
      } else {
        return getMatchesBySport(selectedSport);
      }
    },
    enabled: selectedSport !== 'all'
  });

  useEffect(() => {
    if (sportsError) {
      toast({
        title: "Error",
        description: "Failed to load sports. Please try again later.",
        variant: "destructive"
      });
    }
  }, [sportsError, toast]);

  const handleTabChange = (value: string) => setActiveTab(value);
  const handleSportChange = (sportId: string) => setSelectedSport(sportId);

  const filterMatches = (matches: any[]) => {
    if (!searchQuery) return matches;
    const query = searchQuery.toLowerCase();
    return matches.filter(match => 
      match.title?.toLowerCase().includes(query) ||
      match.teams?.home?.name?.toLowerCase().includes(query) ||
      match.teams?.away?.name?.toLowerCase().includes(query) ||
      match.league?.toLowerCase().includes(query)
    );
  };

  const getCurrentMatches = () => {
    if (selectedSport === 'all') {
      switch (activeTab) {
        case 'popular': return popularMatches;
        case 'live': return liveMatches;
        case 'all': return todayMatches;
        default: return [];
      }
    } else {
      return sportMatches;
    }
  };

  const getIsLoading = () => {
    if (selectedSport === 'all') {
      switch (activeTab) {
        case 'popular': return popularLoading;
        case 'live': return liveLoading;
        case 'all': return todayLoading;
        default: return false;
      }
    } else {
      return sportMatchesLoading;
    }
  };

  const getEmptyMessage = () => {
    if (selectedSport === 'all') {
      switch (activeTab) {
        case 'popular': return "No popular matches available at the moment.";
        case 'live': return "No live matches streaming right now.";
        case 'all': return "No matches scheduled for today.";
        default: return "No matches available.";
      }
    } else {
      const sportName = sportsList.find(s => s.id === selectedSport)?.name || '';
      switch (activeTab) {
        case 'popular': return `No popular ${sportName} matches available.`;
        case 'live': return `No live ${sportName} matches right now.`;
        default: return `No ${sportName} matches available.`;
      }
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-black text-neutral-100 font-sans antialiased selection:bg-neutral-800">
        <Navbar />
        <div className="pt-28 pb-20">
          <div className="container mx-auto px-4 md:px-8 max-w-7xl">
            
            {/* Immersive Dashboard Header */}
            <div className="mb-12 border-l-4 pl-6 border-indigo-500 py-2 relative overflow-hidden bg-neutral-900/20 rounded-r-xl">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <Activity className="h-40 w-40 text-white animate-pulse" />
              </div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white uppercase italic">
                BROADCAST <span className="text-indigo-400 not-italic">CENTER</span>
              </h1>
              <p className="text-neutral-400 text-sm md:text-base font-medium tracking-wide mt-1">
                Select an arena profile below to tap into global live streams.
              </p>
            </div>

            {/* Premium Category Strips with Custom Scroll Styling */}
            <div className="mb-8 border-b border-neutral-800/60 pb-4 overflow-x-auto scrollbar-thin scrollbar-thumb-neutral-800 scrollbar-track-transparent">
              <div className="flex gap-3 min-w-max px-1">
                <button
                  onClick={() => handleSportChange('all')}
                  className={`px-6 py-3 rounded-xl text-xs font-black tracking-widest uppercase transition-all duration-300 border ${
                    selectedSport === 'all' 
                      ? 'text-black bg-white border-white shadow-[0_0_20px_rgba(255,255,255,0.15)]' 
                      : 'text-neutral-400 hover:text-white bg-neutral-950 border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  ALL DISCIPLINES
                </button>

                {sportsLoading ? (
                  <div className="flex gap-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="w-32 h-11 rounded-xl bg-neutral-900 animate-pulse border border-neutral-800" />
                    ))}
                  </div>
                ) : (
                  sportsList.map((sport: Sport) => (
                    <button
                      key={sport.id}
                      onClick={() => handleSportChange(sport.id)}
                      className={`px-6 py-3 rounded-xl text-xs font-black tracking-widest uppercase transition-all duration-300 border ${
                        selectedSport === sport.id 
                          ? 'text-white border-transparent shadow-lg' 
                          : 'text-neutral-400 hover:text-white bg-neutral-950 border-neutral-800 hover:border-neutral-700'
                      }`}
                      style={{ 
                        backgroundColor: selectedSport === sport.id ? accentColor : undefined,
                        boxShadow: selectedSport === sport.id ? `0 0 25px ${accentColor}33` : undefined
                      }}
                    >
                      {sport.name}
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* High-Contrast Integrated Action Deck */}
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full space-y-8">
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-neutral-950 p-3 rounded-2xl border border-neutral-900 shadow-3xl">
                <TabsList className="grid grid-cols-3 bg-neutral-900/60 p-1 rounded-xl w-full md:w-[420px] h-12 border border-neutral-800/40">
                  <TabsTrigger value="popular" className="rounded-lg gap-2 text-neutral-400 data-[state=active]:bg-neutral-800 data-[state=active]:text-white font-bold text-xs uppercase tracking-wider transition-all">
                    <Sparkles className="h-3.5 w-3.5 text-amber-400" /> Hot
                  </TabsTrigger>
                  <TabsTrigger value="live" className="rounded-lg gap-2 text-neutral-400 data-[state=active]:bg-neutral-800 data-[state=active]:text-white font-bold text-xs uppercase tracking-wider transition-all">
                    <Radio className="h-3.5 w-3.5 text-red-500 animate-pulse" /> Live
                  </TabsTrigger>
                  <TabsTrigger value="all" className="rounded-lg gap-2 text-neutral-400 data-[state=active]:bg-neutral-800 data-[state=active]:text-white font-bold text-xs uppercase tracking-wider transition-all">
                    <CalendarDays className="h-3.5 w-3.5 text-indigo-400" /> Cards
                  </TabsTrigger>
                </TabsList>

                <div className="relative w-full md:w-96">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                  <input
                    type="text"
                    placeholder="FILTER BY TEAM, LEAGUE OR TOURNAMENT..."
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-neutral-900 text-white border border-neutral-800 focus:border-neutral-700 focus:outline-none text-xs font-bold tracking-wider uppercase placeholder:text-neutral-600 transition-all"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {/* Grid Views */}
              {['popular', 'live', 'all'].map((tabValue) => (
                <TabsContent key={tabValue} value={tabValue} className="outline-none mt-0">
                  {getIsLoading() ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                        <div key={i} className="aspect-video rounded-2xl bg-neutral-950 border border-neutral-900 animate-pulse" />
                      ))}
                    </div>
                  ) : (
                    <SportsMatchGrid
	                      matches={filterMatches(getCurrentMatches())}
	                      emptyMessage={getEmptyMessage()}
	                    />
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </div>
        <Footer />
        {userPreferences?.adsEnabled && <Ads />}
      </div>
    </PageTransition>
  );
};

export default Sports;
