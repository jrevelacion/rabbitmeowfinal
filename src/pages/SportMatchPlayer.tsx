import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PageTransition from '@/components/PageTransition';
import { getActiveSourcesForMatch, getStreamsGroupedBySource, getMatchById } from '@/utils/sports-api';
import { useUserPreferences } from '@/hooks/user-preferences';
import Ads from '@/components/Ads';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Loader2, 
  Wifi, 
  RefreshCw, 
  Signal, 
  ArrowLeft, 
  Tv, 
  Check,
  Maximize2,
  Minimize2,
  ChevronDown,
  Clock,
  Terminal,
  MessageCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import LiveChat from '@/components/LiveChat';

const SportMatchPlayer = () => {
  const { userPreferences } = useUserPreferences();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { matchId } = useParams();
  
  const [selectedSource, setSelectedSource] = useState<string>('');
  const [selectedSourceId, setSelectedSourceId] = useState<string>('');
  const [selectedStreamNo, setSelectedStreamNo] = useState<number>(1);
  const [matchInfo, setMatchInfo] = useState<any>(null);
  const [iframeKey, setIframeKey] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isLoadingPlayer, setIsLoadingPlayer] = useState<boolean>(true);
  const [showSourceDropdown, setShowSourceDropdown] = useState<boolean>(false);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  
  const handleImageError = React.useCallback((badgeUrl: string) => {
    setFailedImages(prev => new Set(prev).add(badgeUrl));
  }, []);
  
  const playerRef = useRef<HTMLDivElement>(null);
  const sourceDropdownRef = useRef<HTMLDivElement>(null);

  const { data: matchData, isLoading: matchLoading } = useQuery({
    queryKey: ['match-info', matchId],
    queryFn: () => matchId ? getMatchById(matchId) : Promise.resolve(null),
    enabled: !!matchId,
  });

  const { data: activeSources = [], isLoading: sourcesLoading, refetch: refetchSources } = useQuery({
    queryKey: ['active-sources', matchId],
    queryFn: () => matchId ? getActiveSourcesForMatch(matchId) : Promise.resolve([]),
    enabled: !!matchId && !!matchData,
  });

  const { data: groupedStreams = {}, isLoading: streamsLoading, refetch: refetchStreams } = useQuery({
    queryKey: ['grouped-streams', matchId],
    queryFn: () => matchId ? getStreamsGroupedBySource(matchId) : Promise.resolve({}),
    enabled: !!matchId && !!matchData,
  });

  useEffect(() => {
    if (matchData) setMatchInfo(matchData);
  }, [matchData]);

  useEffect(() => {
    if (Object.keys(groupedStreams).length > 0 && activeSources.length > 0) {
      if (!selectedSource) {
        const firstSource = activeSources[0];
        if (firstSource) {
          setSelectedSource(firstSource.source);
          setSelectedSourceId(firstSource.sourceId);
          setSelectedStreamNo(1);
          setIsLoadingPlayer(true);
        }
      }
    }
  }, [groupedStreams, activeSources, selectedSource]);

  const currentStreams = selectedSource ? (groupedStreams[selectedSource] || []) : [];
  const currentStream = currentStreams.find(s => s.streamNo === selectedStreamNo) || currentStreams[0];
  const embedUrl = currentStream?.embedUrl || '';

  useEffect(() => {
    if (selectedSource && currentStream) {
      setIsLoadingPlayer(true);
      setIframeKey(prev => prev + 1);
    }
  }, [selectedSource, selectedStreamNo, currentStream]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sourceDropdownRef.current && !sourceDropdownRef.current.contains(event.target as Node)) {
        setShowSourceDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSourceChange = (sourceInfo: {source: string, sourceId: string}) => {
    setSelectedSource(sourceInfo.source);
    setSelectedSourceId(sourceInfo.sourceId);
    setSelectedStreamNo(1);
    setShowSourceDropdown(false);
    toast({
      title: "NODE REDIRECT",
      description: `Targeting feed server: ${sourceInfo.source.toUpperCase()}`,
    });
  };

  const handleStreamChange = (streamNo: number) => {
    setSelectedStreamNo(streamNo);
    const stream = currentStreams.find(s => s.streamNo === streamNo);
    if (stream) {
      toast({
        title: "CHANNEL CHANGED",
        description: `Active subchannel mapped to channel index #${stream.streamNo}`,
      });
    }
  };

  const handleRefresh = () => {
    refetchSources();
    refetchStreams();
    toast({
      title: "RE-INDEXING CHANNELS",
      description: "Refreshing network source registers.",
    });
  };

  const toggleFullscreen = () => {
    if (!playerRef.current) return;
    if (!isFullscreen) {
      playerRef.current.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const isLoading = matchLoading || sourcesLoading || streamsLoading;
  const hasActiveSources = activeSources.length > 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white mb-2" />
        <span className="text-[10px] font-black tracking-widest text-white/60 uppercase">FETCHING FEED PARAMS...</span>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-neutral-200 antialiased">
        <Navbar />

        <div className="pt-24 pb-16">
          <div className="container mx-auto px-4 md:px-6 max-w-7xl">
            
            {/* Action Return Header */}
            <motion.div 
              className="mb-6 flex items-center justify-between"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <motion.button 
                onClick={() => navigate('/sports')}
                className="text-white px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 border border-blue-400/50 hover:border-blue-300 transition-all flex items-center gap-2 text-xs font-black uppercase tracking-wider shadow-lg hover:shadow-xl"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <ArrowLeft className="h-4 w-4" />
                <span>TERMINAL INDEX</span>
              </motion.button>
              
              <div className="flex items-center gap-2 text-white/70 font-mono text-xs bg-white/10 px-3 py-2 rounded-lg border border-white/20 backdrop-blur-sm">
                <Terminal className="h-3.5 w-3.5" />
                <span>ID: {matchId?.slice(0, 8)}</span>
              </div>
            </motion.div>

            {/* Split Screen Control Architecture - SWAPPED LAYOUT */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              
              {/* Live Chat Sidebar - NOW ON LEFT */}
              <motion.div 
                className="lg:h-[calc(100vh-200px)] min-h-[500px] order-2 lg:order-1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                {matchId && <LiveChat matchId={matchId} />}
              </motion.div>

              {/* Theater View Block - NOW IN CENTER AND LARGER */}
              <motion.div 
                className="lg:col-span-2 space-y-6 order-1 lg:order-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div ref={playerRef} className="relative bg-black rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.9)] border border-white/20">
                  <div className="relative aspect-video">
                    {embedUrl ? (
                      <>
                        <iframe
                          key={iframeKey}
                          src={embedUrl}
                          className="absolute inset-0 w-full h-full"
                          title="Media Interface"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          referrerPolicy="strict-origin-when-cross-origin"
                          allowFullScreen
                          onLoad={() => setIsLoadingPlayer(false)}
                        />
                        {isLoadingPlayer && (
                          <motion.div 
                            className="absolute inset-0 flex items-center justify-center bg-black"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                          >
                            <Loader2 className="h-6 w-6 animate-spin text-white/60" />
                          </motion.div>
                        )}
                      </>
                    ) : hasActiveSources && selectedSource ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
                        <p className="text-xs font-black tracking-widest text-white/60 uppercase">Awaiting Node Routing Confirmation</p>
                      </div>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
                        <div className="text-center p-6">
                          <Signal className="h-6 w-6 text-white/50 mx-auto mb-2" />
                          <p className="text-white font-bold text-xs uppercase tracking-wider mb-4">No feeds active for this entry</p>
                          <Button onClick={handleRefresh} size="sm" className="bg-gradient-to-r from-blue-600 to-blue-500 border border-blue-400/50 text-white text-xs font-bold uppercase tracking-wider hover:from-blue-500 hover:to-blue-400">
                            Sync Signals
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Strip Interface Controls */}
                  {embedUrl && (
                    <motion.div 
                      className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-white/10 to-white/5 border-t border-white/20 text-xs font-bold tracking-wide uppercase backdrop-blur-sm"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.2 }}
                    >
                      <div className="flex items-center gap-2 text-white/80">
                        <motion.span 
                          className="w-2 h-2 rounded-full bg-gradient-to-r from-red-500 to-red-400"
                          animate={{ scale: [1, 1.3, 1] }}
                          transition={{ duration: 1, repeat: Infinity }}
                        />
                        <span>
                          NODE: <span className="text-white">{selectedSource}</span>
                          <span className="text-white/60 ml-2 font-mono lowercase">
                            • stream_idx_{currentStream?.streamNo}
                          </span>
                        </span>
                      </div>
                      <Button variant="ghost" size="sm" onClick={toggleFullscreen} className="h-8 w-8 p-0 text-white/60 hover:text-white">
                        {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                      </Button>
                    </motion.div>
                  )}
                </div>

                {/* Info Center Banner */}
                {matchInfo && (
                  <motion.div 
                    className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-2xl p-6 border border-white/20 space-y-4 backdrop-blur-sm"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    <div>
                      <span className="text-[10px] font-black tracking-widest text-white/90 uppercase bg-gradient-to-r from-purple-500/30 to-pink-500/30 px-2 py-1 rounded border border-white/20 backdrop-blur-sm inline-block">
                        {matchInfo.category}
                      </span>
                      <h1 className="text-2xl font-black text-white uppercase tracking-tight mt-3 drop-shadow-lg">{matchInfo.title}</h1>
                      <div className="flex items-center gap-2 mt-2 text-white/70 text-xs font-bold uppercase tracking-wider">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{format(new Date(matchInfo.date), "MMM d, yyyy • h:mm a")}</span>
                      </div>
                    </div>

                    {matchInfo.teams && (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white/10 rounded-xl p-4 border border-white/20 gap-4 backdrop-blur-sm">
                        <div className="flex items-center gap-6">
                          <div className="flex items-center gap-2">
                          {!failedImages.has(matchInfo.teams.home.badge) ? (
                            <img
                              src={`https://streamed.pk/api/images/badge/${matchInfo.teams.home.badge?.replace(/\.(webp|png|jpg|jpeg)$/i, '')}.webp`}
                              className="w-7 h-7 object-contain drop-shadow-lg"
                              onError={() => handleImageError(matchInfo.teams.home.badge)}
                              alt=""
                            />
                          ) : (
                            <div className="w-7 h-7 flex items-center justify-center bg-white/10 rounded text-[8px] font-black text-white/50">N/A</div>
                          )}
                            <span className="text-white font-black text-xs uppercase tracking-wider">{matchInfo.teams.home.name}</span>
                          </div>
                          
                          <span className="text-[9px] font-black text-white/60 tracking-widest">VS</span>
                          
                          <div className="flex items-center gap-2">
                          {!failedImages.has(matchInfo.teams.away.badge) ? (
                            <img
                              src={`https://streamed.pk/api/images/badge/${matchInfo.teams.away.badge?.replace(/\.(webp|png|jpg|jpeg)$/i, '')}.webp`}
                              className="w-7 h-7 object-contain drop-shadow-lg"
                              onError={() => handleImageError(matchInfo.teams.away.badge)}
                              alt=""
                            />
                          ) : (
                            <div className="w-7 h-7 flex items-center justify-center bg-white/10 rounded text-[8px] font-black text-white/50">N/A</div>
                          )}
                            <span className="text-white font-black text-xs uppercase tracking-wider">{matchInfo.teams.away.name}</span>
                          </div>
                        </div>

                        {matchInfo.popular && (
                          <Badge className="bg-gradient-to-r from-yellow-500 to-amber-500 text-white font-black text-[9px] tracking-widest px-2 py-1 rounded-md border-none uppercase drop-shadow-lg">
                            ⭐ POPULAR
                          </Badge>
                        )}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Routing Station - NOW BELOW PLAYER */}
                <motion.div 
                  className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 p-6 rounded-2xl border border-white/20 space-y-6 backdrop-blur-sm"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  <div>
                    <h3 className="text-xs font-black text-white tracking-widest uppercase mb-1 flex items-center gap-2 drop-shadow-lg">
                      <Wifi className="h-4 w-4 text-cyan-400" />
                      ROUTING STATION
                    </h3>
                    <p className="text-[11px] text-white/70 font-medium tracking-wide uppercase">Toggle channels below if transmission lag hits frames.</p>
                  </div>

                  {/* Server Dropdown Element */}
                  {hasActiveSources && (
                    <div className="space-y-2">
                      <label className="block text-white/70 text-[10px] font-black uppercase tracking-widest">Active Server Profile</label>
                      <div className="relative" ref={sourceDropdownRef}>
                        <motion.button
                          onClick={() => setShowSourceDropdown(!showSourceDropdown)}
                          className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-white/10 border-2 border-white/20 hover:border-white/30 hover:bg-white/15 transition-all text-left backdrop-blur-sm"
                          whileHover={{ scale: 1.02 }}
                        >
                          <div className="flex items-center gap-2.5">
                            <Wifi className="h-4 w-4 text-cyan-400" />
                            <span className="text-white text-xs font-black uppercase tracking-widest">
                              {selectedSource ? selectedSource : 'Select Server Node'}
                            </span>
                          </div>
                          <ChevronDown className={`h-4 w-4 text-white/60 transition-transform duration-300 ${showSourceDropdown ? 'rotate-180' : ''}`} />
                        </motion.button>
                        
                        <AnimatePresence>
                          {showSourceDropdown && (
                            <motion.div
                              initial={{ opacity: 0, y: -4 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -4 }}
                              className="absolute top-full left-0 mt-2 w-full bg-gradient-to-br from-white/20 to-white/10 rounded-xl border border-white/30 shadow-3xl z-50 overflow-hidden backdrop-blur-sm"
                            >
                              {activeSources.map((sourceInfo) => {
                                const isSelected = selectedSource === sourceInfo.source;
                                return (
                                  <motion.button
                                    key={sourceInfo.source}
                                    onClick={() => handleSourceChange(sourceInfo)}
                                    className={`w-full flex items-center justify-between px-4 py-3 transition-all text-left border-b border-white/10 ${isSelected ? 'bg-white/20' : 'hover:bg-white/10'}`}
                                    whileHover={{ x: 4 }}
                                  >
                                    <span className="text-white text-xs font-black uppercase tracking-wider">{sourceInfo.source}</span>
                                    {isSelected && <Check className="h-4 w-4 text-cyan-400" />}
                                  </motion.button>
                                );
                              })}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  )}

                  {/* Multi-channel Subchannel buttons layout */}
                  {selectedSource && currentStreams.length > 1 && (
                    <div className="space-y-2">
                      <label className="block text-white/70 text-[10px] font-black uppercase tracking-widest">Sub-Link Channel Indices</label>
                      <div className="grid grid-cols-2 gap-2">
                        {currentStreams.map((stream) => {
                          const isSelected = selectedStreamNo === stream.streamNo;
                          return (
                            <motion.button
                              key={stream.streamNo}
                              onClick={() => handleStreamChange(stream.streamNo)}
                              className={`px-3 py-2.5 rounded-xl transition-all duration-200 flex flex-col gap-1 text-left border-2 ${
                                isSelected 
                                  ? 'text-white border-white/40 shadow-md font-bold bg-gradient-to-r from-cyan-500/30 to-blue-500/30' 
                                  : 'bg-white/10 text-white/70 border-white/20 text-xs hover:bg-white/15 hover:border-white/30'
                              }`}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <span className="text-[10px] font-black tracking-widest uppercase">NODE #{stream.streamNo}</span>
                              <div className="flex items-center gap-1 font-mono text-[9px] uppercase tracking-tighter opacity-60">
                                {stream.language?.trim() && <span>{stream.language.trim()}</span>}
                                {stream.hd && <span className="font-black">[HD]</span>}
                              </div>
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <motion.div 
                    className="pt-2 border-t border-white/20"
                    whileHover={{ scale: 1.02 }}
                  >
                    <Button
                      onClick={handleRefresh}
                      className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 border border-cyan-400/50 text-white text-xs font-black uppercase tracking-widest h-11 rounded-xl hover:from-cyan-500 hover:to-blue-500 shadow-lg"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      POLL STREAMS
                    </Button>
                  </motion.div>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </div>
        
        {userPreferences?.adsEnabled && <Ads />}
        <Footer />
      </div>
    </PageTransition>
  );
};

export default SportMatchPlayer;
