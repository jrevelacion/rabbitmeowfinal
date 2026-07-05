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
import { Search, Radio, Sparkles, CalendarDays, Activity, Zap, Flame } from 'lucide-react';
import { motion } from 'framer-motion';

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

  const liveCount = liveMatches.length;

  return (
    <PageTransition>
      <div className="min-h-screen bg-black text-neutral-100 font-sans antialiased selection:bg-neutral-800">
        <Navbar />
        <div className="pt-28 pb-20">
          <div className="container mx-auto px-4 md:px-8 max-w-7xl">
            
            {/* Immersive Dashboard Header with Enhanced Effects */}
            <motion.div 
              className="mb-12 relative overflow-hidden rounded-2xl"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              {/* Animated Background Gradient */}
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/10 via-transparent to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              {/* Animated Border */}
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-transparent to-indigo-500 opacity-0 group-hover:opacity-20 transition-opacity duration-500" />
              
              <div className="relative border-l-4 pl-6 border-indigo-500 py-6 px-8 bg-gradient-to-r from-neutral-950/60 to-neutral-900/30 rounded-r-2xl backdrop-blur-sm border border-neutral-800">
                {/* Animated Background Icon */}
                <motion.div 
                  className="absolute top-0 right-0 p-8 opacity-5"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                >
                  <Activity className="h-40 w-40 text-white" />
                </motion.div>

                {/* Content */}
                <div className="relative z-10">
                  <motion.h1 
                    className="text-5xl md:text-6xl font-black tracking-tight text-white uppercase"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                  >
                    BROADCAST <span className="text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400 bg-clip-text">CENTER</span>
                  </motion.h1>
                  <motion.p 
                    className="text-neutral-400 text-sm md:text-base font-medium tracking-wide mt-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                  >
                    Select an arena profile below to tap into global live streams.
                    {liveCount > 0 && (
                      <span className="ml-3 inline-flex items-center gap-1.5 text-red-400 font-bold">
                        <motion.span 
                          className="w-2 h-2 rounded-full bg-red-500"
                          animate={{ scale: [1, 1.3, 1] }}
                          transition={{ duration: 1, repeat: Infinity }}
                        />
                        {liveCount} LIVE NOW
                      </span>
                    )}
                  </motion.p>
                </div>
              </div>
            </motion.div>

            {/* Premium Category Strips with Enhanced Styling */}
            <motion.div 
              className="mb-8 border-b border-neutral-800/60 pb-4 overflow-x-auto scrollbar-thin scrollbar-thumb-neutral-800 scrollbar-track-transparent"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <div className="flex gap-3 min-w-max px-1">
                <motion.button
                  onClick={() => handleSportChange('all')}
                  className={`px-6 py-3 rounded-xl text-xs font-black tracking-widest uppercase transition-all duration-300 border relative overflow-hidden group ${
                    selectedSport === 'all' 
                      ? 'text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.15)]' 
                      : 'text-neutral-400 hover:text-white bg-neutral-950 border-neutral-800 hover:border-neutral-700'
                  }`}
                  style={{
                    backgroundColor: selectedSport === 'all' ? 'white' : undefined,
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  ALL DISCIPLINES
                </motion.button>

                {sportsLoading ? (
                  <div className="flex gap-2">
                    {[1, 2, 3, 4].map((i) => (
                      <motion.div 
                        key={i} 
                        className="w-32 h-11 rounded-xl bg-neutral-900 border border-neutral-800"
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                    ))}
                  </div>
                ) : (
                  sportsList.map((sport: Sport, index) => (
                    <motion.button
                      key={sport.id}
                      onClick={() => handleSportChange(sport.id)}
                      className={`px-6 py-3 rounded-xl text-xs font-black tracking-widest uppercase transition-all duration-300 border relative overflow-hidden group ${
                        selectedSport === sport.id 
                          ? 'text-white border-transparent shadow-lg' 
                          : 'text-neutral-400 hover:text-white bg-neutral-950 border-neutral-800 hover:border-neutral-700'
                      }`}
                      style={{ 
                        backgroundColor: selectedSport === sport.id ? accentColor : undefined,
                        boxShadow: selectedSport === sport.id ? `0 0 25px ${accentColor}33` : undefined
                      }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.05 }}
                    >
                      {sport.name}
                    </motion.button>
                  ))
                )}
              </div>
            </motion.div>

            {/* High-Contrast Integrated Action Deck */}
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full space-y-8">
              <motion.div 
                className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-gradient-to-r from-neutral-950 to-neutral-900 p-4 rounded-2xl border border-neutral-800 shadow-3xl"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <TabsList className="grid grid-cols-3 bg-neutral-900/60 p-1 rounded-xl w-full md:w-[420px] h-12 border border-neutral-800/40">
                  <TabsTrigger value="popular" className="rounded-lg gap-2 text-neutral-400 data-[state=active]:bg-neutral-800 data-[state=active]:text-white font-bold text-xs uppercase tracking-wider transition-all">
                    <Flame className="h-3.5 w-3.5 text-amber-400" /> Hot
                  </TabsTrigger>
                  <TabsTrigger value="live" className="rounded-lg gap-2 text-neutral-400 data-[state=active]:bg-neutral-800 data-[state=active]:text-white font-bold text-xs uppercase tracking-wider transition-all">
                    <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1, repeat: Infinity }}>
                      <Radio className="h-3.5 w-3.5 text-red-500" />
                    </motion.div> Live
                  </TabsTrigger>
                  <TabsTrigger value="all" className="rounded-lg gap-2 text-neutral-400 data-[state=active]:bg-neutral-800 data-[state=active]:text-white font-bold text-xs uppercase tracking-wider transition-all">
                    <CalendarDays className="h-3.5 w-3.5 text-indigo-400" /> Cards
                  </TabsTrigger>
                </TabsList>

                <div className="relative w-full md:w-96 group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500 group-focus-within:text-indigo-400 transition-colors" />
                  <input
                    type="text"
                    placeholder="FILTER BY TEAM, LEAGUE OR TOURNAMENT..."
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-neutral-900 text-white border border-neutral-800 focus:border-indigo-500 focus:outline-none focus:shadow-[0_0_20px_rgba(99,102,241,0.2)] text-xs font-bold tracking-wider uppercase placeholder:text-neutral-600 transition-all duration-300"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </motion.div>

              {/* Grid Views */}
              {['popular', 'live', 'all'].map((tabValue) => (
                <TabsContent key={tabValue} value={tabValue} className="outline-none mt-0">
                  {getIsLoading() ? (
                    <motion.div 
                      className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.4 }}
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                        <motion.div 
                          key={i} 
                          className="aspect-video rounded-2xl bg-gradient-to-br from-neutral-900 to-neutral-950 border border-neutral-800"
                          animate={{ opacity: [0.5, 1, 0.5] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        />
                      ))}
                    </motion.div>
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
