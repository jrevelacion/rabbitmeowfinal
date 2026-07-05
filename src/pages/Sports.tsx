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
import { getColorForSport } from '@/utils/sports-colors';
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
  const selectedColor = getColorForSport(selectedSport);

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-neutral-100 font-sans antialiased selection:bg-neutral-800">
        <Navbar />
        <div className="pt-28 pb-20">
          <div className="container mx-auto px-4 md:px-8 max-w-7xl">
            
            {/* Immersive Dashboard Header with Vibrant Gradient */}
            <motion.div 
              className="mb-12 relative overflow-hidden rounded-3xl"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              {/* Animated Gradient Background */}
              <div className={`absolute inset-0 bg-gradient-to-r ${selectedColor.bg} opacity-90`} />
              
              {/* Animated Overlay Pattern */}
              <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-transparent to-white/5" />
              
              {/* Animated Background Icon */}
              <motion.div 
                className="absolute top-0 right-0 p-8 opacity-15"
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              >
                <Activity className="h-40 w-40 text-white" />
              </motion.div>

              {/* Content */}
              <div className="relative z-10 px-8 py-8">
                <motion.h1 
                  className="text-5xl md:text-6xl font-black tracking-tight text-white uppercase drop-shadow-lg"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                >
                  RABBITMEOW <span className="text-white drop-shadow-xl">SPORTS CENTER</span>
                </motion.h1>
                <motion.p 
                  className="text-white/90 text-sm md:text-base font-bold tracking-wide mt-3 drop-shadow-md"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  Select an arena profile below to tap into global live streams.
                  {liveCount > 0 && (
                    <span className="ml-3 inline-flex items-center gap-1.5 text-white font-black">
                      <motion.span 
                        className="w-2 h-2 rounded-full bg-white"
                        animate={{ scale: [1, 1.3, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                      />
                      {liveCount} LIVE NOW
                    </span>
                  )}
                </motion.p>
              </div>
            </motion.div>

            {/* Premium Category Strips with Colorful Buttons */}
            <motion.div 
              className="mb-8 border-b border-white/10 pb-4 overflow-x-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <div className="flex gap-3 min-w-max px-1">
                <motion.button
                  onClick={() => handleSportChange('all')}
                  className={`px-6 py-3 rounded-xl text-xs font-black tracking-widest uppercase transition-all duration-300 border-2 relative overflow-hidden group shadow-lg hover:shadow-2xl`}
                  style={{
                    background: selectedSport === 'all' ? `linear-gradient(135deg, rgb(59, 130, 246), rgb(34, 211, 238))` : 'rgba(255,255,255,0.1)',
                    borderColor: selectedSport === 'all' ? 'rgb(147, 197, 253)' : 'rgba(255,255,255,0.2)',
                    color: selectedSport === 'all' ? 'white' : 'rgba(255,255,255,0.7)',
                    boxShadow: selectedSport === 'all' ? '0 0 30px rgba(59, 130, 246, 0.4)' : 'none'
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
                        className="w-32 h-11 rounded-xl bg-gradient-to-r from-white/10 to-white/5 border border-white/20"
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                    ))}
                  </div>
                ) : (
                  sportsList.map((sport: Sport, index) => {
                    const sportColor = getColorForSport(sport.id);
                    const isSelected = selectedSport === sport.id;
                    
                    return (
                      <motion.button
                        key={sport.id}
                        onClick={() => handleSportChange(sport.id)}
                        className={`px-6 py-3 rounded-xl text-xs font-black tracking-widest uppercase transition-all duration-300 border-2 relative overflow-hidden group shadow-lg hover:shadow-2xl text-white`}
                        style={{
                          background: isSelected ? sportColor.gradient : 'rgba(255,255,255,0.05)',
                          borderColor: isSelected ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.1)',
                          boxShadow: isSelected ? `0 0 30px ${sportColor.glow}` : 'none'
                        }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.05 }}
                      >
                        {sport.name}
                      </motion.button>
                    );
                  })
                )}
              </div>
            </motion.div>

            {/* High-Contrast Integrated Action Deck */}
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full space-y-8">
              <motion.div 
                className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-gradient-to-r from-white/10 to-white/5 p-4 rounded-2xl border border-white/20 shadow-2xl backdrop-blur-sm"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <TabsList className="grid grid-cols-3 bg-white/10 p-1 rounded-xl w-full md:w-[420px] h-12 border border-white/20 backdrop-blur-sm">
                  <TabsTrigger value="popular" className="rounded-lg gap-2 text-white/70 data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-500 data-[state=active]:text-white font-bold text-xs uppercase tracking-wider transition-all">
                    <Flame className="h-3.5 w-3.5" /> Hot
                  </TabsTrigger>
                  <TabsTrigger value="live" className="rounded-lg gap-2 text-white/70 data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-pink-500 data-[state=active]:text-white font-bold text-xs uppercase tracking-wider transition-all">
                    <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1, repeat: Infinity }}>
                      <Radio className="h-3.5 w-3.5" />
                    </motion.div> Live
                  </TabsTrigger>
                  <TabsTrigger value="all" className="rounded-lg gap-2 text-white/70 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white font-bold text-xs uppercase tracking-wider transition-all">
                    <CalendarDays className="h-3.5 w-3.5" /> Cards
                  </TabsTrigger>
                </TabsList>

                <div className="relative w-full md:w-96 group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50 group-focus-within:text-white transition-colors" />
                  <input
                    type="text"
                    placeholder="FILTER BY TEAM, LEAGUE OR TOURNAMENT..."
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/10 text-white border-2 border-white/20 focus:border-white/40 focus:outline-none focus:shadow-[0_0_20px_rgba(255,255,255,0.2)] text-xs font-bold tracking-wider uppercase placeholder:text-white/40 transition-all duration-300 backdrop-blur-sm"
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
                          className="aspect-video rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/20 backdrop-blur-sm"
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
