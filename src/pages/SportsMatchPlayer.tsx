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
  Terminal
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

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
      <div className="min-h-screen bg-black flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white mb-2" />
        <span className="text-[10px] font-black tracking-widest text-neutral-500 uppercase">FETCHING FEED PARAMS...</span>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-black text-neutral-200 antialiased">
        <Navbar />

        <div className="pt-24 pb-16">
          <div className="container mx-auto px-4 md:px-6 max-w-7xl">
            
            {/* Action Return Header */}
            <div className="mb-6 flex items-center justify-between">
              <button 
                onClick={() => navigate('/sports')}
                className="text-neutral-400 hover:text-white px-4 py-2 rounded-xl bg-neutral-950 border border-neutral-900 hover:border-neutral-800 transition-all flex items-center gap-2 text-xs font-black uppercase tracking-wider"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>TERMINAL INDEX</span>
              </button>
              
              <div className="flex items-center gap-2 text-neutral-600 font-mono text-xs">
                <Terminal className="h-3.5 w-3.5" />
                <span>ID: {matchId?.slice(0, 8)}</span>
              </div>
            </div>

            {/* Split Screen Control Architecture */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              
              {/* Theater View Block */}
              <div className="lg:col-span-2 space-y-6">
                <div ref={playerRef} className="relative bg-black rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.9)] border border-neutral-900">
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
                          <div className="absolute inset-0 flex items-center justify-center bg-black">
                            <Loader2 className="h-6 w-6 animate-spin text-neutral-600" />
                          </div>
                        )}
                      </>
                    ) : hasActiveSources && selectedSource ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-neutral-950">
                        <p className="text-xs font-black tracking-widest text-neutral-500 uppercase">Awaiting Node Routing Confirmation</p>
                      </div>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-neutral-950">
                        <div className="text-center p-6">
                          <Signal className="h-6 w-6 text-neutral-700 mx-auto mb-2" />
                          <p className="text-white font-bold text-xs uppercase tracking-wider mb-4">No feeds active for this entry</p>
                          <Button onClick={handleRefresh} size="sm" className="bg-neutral-900 border border-neutral-800 text-xs font-bold uppercase tracking-wider">
                            Sync Signals
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Strip Interface Controls */}
                  {embedUrl && (
                    <div className="flex items-center justify-between px-4 py-3 bg-neutral-950 border-t border-neutral-900 text-xs font-bold tracking-wide uppercase">
                      <div className="flex items-center gap-2 text-neutral-400">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                        <span>
                          NODE: <span className="text-white">{selectedSource}</span>
                          <span className="text-neutral-600 ml-2 font-mono lowercase">
                            • stream_idx_{currentStream?.streamNo}
                          </span>
                        </span>
                      </div>
                      <Button variant="ghost" size="sm" onClick={toggleFullscreen} className="h-8 w-8 p-0 text-neutral-500 hover:text-white">
                        {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                      </Button>
                    </div>
                  )}
                </div>

                {/* Info Center Banner */}
                {matchInfo && (
                  <div className="bg-neutral-950 rounded-2xl p-6 border border-neutral-900 space-y-4">
                    <div>
                      <span className="text-[10px] font-black tracking-widest text-indigo-400 uppercase bg-neutral-900 px-2 py-1 rounded border border-neutral-800">
                        {matchInfo.category}
                      </span>
                      <h1 className="text-2xl font-black text-white uppercase tracking-tight mt-3">{matchInfo.title}</h1>
                      <div className="flex items-center gap-2 mt-2 text-neutral-500 text-xs font-bold uppercase tracking-wider">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{format(new Date(matchInfo.date), "MMM d, yyyy • h:mm a")}</span>
                      </div>
                    </div>

                    {matchInfo.teams && (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-neutral-900/40 rounded-xl p-4 border border-neutral-900 gap-4">
                        <div className="flex items-center gap-6">
                          <div className="flex items-center gap-2">
                            <img
                              src={`https://streamed.pk/api/images/badge/${matchInfo.teams.home.badge?.replace(/\.(webp|png|jpg|jpeg)$/i, '')}.webp`}
                              className="w-7 h-7 object-contain"
                              onError={(e) => { e.currentTarget.src = '/placeholder.svg' }}
                              alt=""
                            />
                            <span className="text-white font-black text-xs uppercase tracking-wider">{matchInfo.teams.home.name}</span>
                          </div>
                          
                          <span className="text-[9px] font-black text-neutral-600 tracking-widest">VS</span>
                          
                          <div className="flex items-center gap-2">
                            <img
                              src={`https://streamed.pk/api/images/badge/${matchInfo.teams.away.badge?.replace(/\.(webp|png|jpg|jpeg)$/i, '')}.webp`}
                              className="w-7 h-7 object-contain"
                              onError={(e) => { e.currentTarget.src = '/placeholder.svg' }}
                              alt=""
                            />
                            <span className="text-white font-black text-xs uppercase tracking-wider">{matchInfo.teams.away.name}</span>
                          </div>
                        </div>

                        {matchInfo.popular && (
                          <Badge style={{ backgroundColor: userPreferences?.accentColor || 'hsl(var(--accent))' }} className="text-white font-black text-[9px] tracking-widest px-2 py-1 rounded-md border-none uppercase">
                            POPULAR
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Console Station Deck Column */}
              <div className="bg-neutral-950 p-6 rounded-2xl border border-neutral-900 space-y-6 lg:sticky lg:top-24">
                <div>
                  <h3 className="text-xs font-black text-white tracking-widest uppercase mb-1">
                    ROUTING STATION
                  </h3>
                  <p className="text-[11px] text-neutral-500 font-medium tracking-wide uppercase">Toggle channels below if transmission lag hits frames.</p>
                </div>

                {/* Server Dropdown Element */}
                {hasActiveSources && (
                  <div className="space-y-2">
                    <label className="block text-neutral-500 text-[10px] font-black uppercase tracking-widest">Active Server Profile</label>
                    <div className="relative" ref={sourceDropdownRef}>
                      <button
                        onClick={() => setShowSourceDropdown(!showSourceDropdown)}
                        className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-neutral-900 border border-neutral-800/80 hover:bg-neutral-900 transition-all text-left"
                      >
                        <div className="flex items-center gap-2.5">
                          <Wifi className="h-4 w-4 text-indigo-400" />
                          <span className="text-white text-xs font-black uppercase tracking-widest">
                            {selectedSource ? selectedSource : 'Select Server Node'}
                          </span>
                        </div>
                        <ChevronDown className={`h-4 w-4 text-neutral-500 transition-transform duration-300 ${showSourceDropdown ? 'rotate-180' : ''}`} />
                      </button>
                      
                      <AnimatePresence>
                        {showSourceDropdown && (
                          <motion.div
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            className="absolute top-full left-0 mt-2 w-full bg-neutral-900 rounded-xl border border-neutral-800 shadow-3xl z-50 overflow-hidden"
                          >
                            {activeSources.map((sourceInfo) => {
                              const isSelected = selectedSource === sourceInfo.source;
                              return (
                                <button
                                  key={sourceInfo.source}
                                  onClick={() => handleSourceChange(sourceInfo)}
                                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-neutral-800 transition-all text-left border-b border-neutral-950/40"
                                >
                                  <span className="text-neutral-200 text-xs font-black uppercase tracking-wider">{sourceInfo.source}</span>
                                  {isSelected && <Check className="h-4 w-4 text-indigo-400" />}
                                </button>
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
                    <label className="block text-neutral-500 text-[10px] font-black uppercase tracking-widest">Sub-Link Channel Indices</label>
                    <div className="grid grid-cols-2 gap-2">
                      {currentStreams.map((stream) => {
                        const isSelected = selectedStreamNo === stream.streamNo;
                        return (
                          <button
                            key={stream.streamNo}
                            onClick={() => handleStreamChange(stream.streamNo)}
                            className={`px-3 py-2.5 rounded-xl transition-all duration-200 flex flex-col gap-1 text-left border ${
                              isSelected 
                                ? 'text-white border-transparent shadow-md font-bold' 
                                : 'bg-neutral-900 text-neutral-400 border-neutral-800/80 text-xs'
                            }`}
                            style={{ 
                              backgroundColor: isSelected ? userPreferences?.accentColor || 'hsl(var(--accent))' : undefined,
                            }}
                          >
                            <span className="text-[10px] font-black tracking-widest uppercase">NODE #{stream.streamNo}</span>
                            <div className="flex items-center gap-1 font-mono text-[9px] uppercase tracking-tighter opacity-60">
                              {stream.language?.trim() && <span>{stream.language.trim()}</span>}
                              {stream.hd && <span className="font-black">[HD]</span>}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="pt-2 border-t border-neutral-900">
                  <Button
                    variant="outline"
                    onClick={handleRefresh}
                    className="w-full border-neutral-800 text-neutral-400 bg-neutral-900/40 hover:bg-neutral-900 text-xs font-black uppercase tracking-widest h-11 rounded-xl"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    POLL STREAMS
                  </Button>
                </div>
              </div>
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
