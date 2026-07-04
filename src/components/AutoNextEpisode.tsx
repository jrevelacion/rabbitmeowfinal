import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { SkipForward, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';

interface AutoNextEpisodeProps {
  isEnabled: boolean;
  onToggle: (enabled: boolean) => void;
  currentSource: string;
  mediaType: 'movie' | 'tv';
  currentEpisode?: {
    season: number;
    episode: number;
  };
  onNextEpisode: () => void;
  onPreviousEpisode?: () => void;
  hasNextEpisode: boolean;
  className?: string;
}

interface SourceConfig {
  name: string;
  storageKey: string;
  supportsEvents: boolean;
  origins: string[];
}

const SUPPORTED_SOURCES: Record<string, SourceConfig> = {
  'vidzee': {
    name: 'Vidzee',
    storageKey: 'vidZeeProgress',
    supportsEvents: true,
    origins: ['https://player.vidzee.wtf'],
  },
  'vidrock': {
    name: 'VidRock',
    storageKey: 'vidRockProgress',
    supportsEvents: true,
    origins: ['https://vidrock.ru', 'https://vidrock.net'],
  },
  'vidsrc-wtf-1': {
    name: 'VidSrc.wtf',
    storageKey: 'vidsrcwtf-Progress',
    supportsEvents: true,
    origins: ['https://www.vidsrc.wtf'],
  },
  'vidlink': {
    name: 'VidLink',
    storageKey: 'vidlinkProgress',
    supportsEvents: true,
    origins: ['https://vidlink.pro'],
  },
  'vidfast': {
    name: 'VidFast',
    storageKey: 'vidFastProgress',
    supportsEvents: true,
    origins: [
      'https://vidfast.pro', 'https://vidfast.in', 'https://vidfast.io',
      'https://vidfast.me', 'https://vidfast.net', 'https://vidfast.pm', 'https://vidfast.xyz'
    ],
  },
  'videasy': {
    name: 'Videasy',
    storageKey: 'videasy-new-history',
    supportsEvents: true,
    origins: ['https://player.videasy.net'],
  },
  'vidup': {
    name: 'VidUp',
    storageKey: 'vidUpProgress',
    supportsEvents: true,
    origins: ['https://vidup.to'],
  },
  'vidnest': {
    name: 'VidNest',
    storageKey: 'vidNestProgress',
    supportsEvents: true,
    origins: ['https://vidnest.fun'],
  }
};

export const AutoNextEpisode: React.FC<AutoNextEpisodeProps> = ({
  isEnabled,
  onToggle,
  currentSource,
  mediaType,
  currentEpisode,
  onNextEpisode,
  hasNextEpisode,
  className
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [lastProgress, setLastProgress] = useState<number>(0);
  const [isSourceSupported, setIsSourceSupported] = useState(true);
  const { toast } = useToast();
  const messageListenerRef = useRef<(event: MessageEvent) => void>();
  const autoNextTriggeredRef = useRef<boolean>(false);

  useEffect(() => {
    const isSupported = Object.keys(SUPPORTED_SOURCES).includes(currentSource);
    setIsSourceSupported(isSupported);
    
    if (!isSupported && isEnabled) {
      onToggle(false);
      toast({
        title: "Auto-Next Unsupported",
        description: "Current video source does not support auto-next functionality.",
        variant: "destructive",
        duration: 3000,
      });
    }
  }, [currentSource, isEnabled, onToggle, toast]);

  const handleMessage = useCallback((event: MessageEvent) => {
    if (!isEnabled || mediaType !== 'tv' || !currentEpisode) return;

    const sourceConfig = SUPPORTED_SOURCES[currentSource];
    if (!sourceConfig) return;

    const isValidOrigin = sourceConfig.origins.includes(event.origin);
    if (!isValidOrigin || !event.data) return;

    console.log(`📨 AutoNext received from ${event.origin}:`, event.data);

    let eventData = event.data;
    if (typeof eventData === 'string') {
      try { eventData = JSON.parse(eventData); } catch (e) { return; }
    }

    if (eventData?.type === 'MEDIA_DATA') {
      let mediaData = eventData.data;
      
      if (typeof mediaData === 'string') {
        try { mediaData = JSON.parse(mediaData); } catch (e) { return; }
      }
      
      if (sourceConfig.storageKey) {
        localStorage.setItem(sourceConfig.storageKey, JSON.stringify(mediaData));
      }

      // Handle Videoasy format (keys like "tv-1396" or "movie-617126")
      if (currentSource === 'videasy') {
        // Find TV show data by looking for key starting with "tv-"
        const tvKey = Object.keys(mediaData).find(key => key.startsWith('tv-'));
        const showData = tvKey ? mediaData[tvKey] : null;
        
        if (showData && showData.show_progress) {
          const episodeKey = `s${currentEpisode.season}e${currentEpisode.episode}`;
          const episodeProgress = showData.show_progress[episodeKey];
          
          if (episodeProgress && episodeProgress.progress && episodeProgress.progress.duration > 0) {
            const watched = episodeProgress.progress.watched || 0;
            const duration = episodeProgress.progress.duration;
            const percentage = (watched / duration) * 100;
            
            setLastProgress(percentage);
            
            if (percentage >= 95 && hasNextEpisode && !autoNextTriggeredRef.current) {
              autoNextTriggeredRef.current = true;
              console.log(`📺 Videoasy: Episode ${episodeKey} at ${percentage.toFixed(1)}%, triggering next episode`);
              onNextEpisode();
              
              toast({
                title: "Playing Next Episode",
                description: "Auto-next triggered",
                duration: 2000,
              });
              
              setTimeout(() => { autoNextTriggeredRef.current = false; }, 5000);
            }
          }
        }
      }
      // Handle VidUp/VidNest format (keys like "t63174")
      else if (currentSource === 'vidup' || currentSource === 'vidnest') {
        const tvKey = Object.keys(mediaData).find(key => key.startsWith('t'));
        const showData = tvKey ? mediaData[tvKey] : null;
        
        if (showData && showData.show_progress) {
          const episodeKey = `s${currentEpisode.season}e${currentEpisode.episode}`;
          const episodeProgress = showData.show_progress[episodeKey];
          
          if (episodeProgress && episodeProgress.progress && episodeProgress.progress.duration > 0) {
            const watched = episodeProgress.progress.watched || 0;
            const duration = episodeProgress.progress.duration;
            const percentage = (watched / duration) * 100;
            
            setLastProgress(percentage);
            
            if (percentage >= 95 && hasNextEpisode && !autoNextTriggeredRef.current) {
              autoNextTriggeredRef.current = true;
              console.log(`📺 ${currentSource}: Episode at ${percentage.toFixed(1)}%, triggering next episode`);
              onNextEpisode();
              
              toast({
                title: "Playing Next Episode",
                description: "Auto-next triggered",
                duration: 2000,
              });
              
              setTimeout(() => { autoNextTriggeredRef.current = false; }, 5000);
            }
          }
        }
      }
      // Handle standard format
      else {
        const mediaId = Object.keys(mediaData).find(key => {
          const entry = mediaData[key];
          return entry && (entry.type === 'tv' || entry.mediaType === 'tv');
        });

        if (mediaId && mediaData[mediaId]) {
          const showData = mediaData[mediaId];
          const episodeKey = `s${currentEpisode.season}e${currentEpisode.episode}`;
          const showProgress = showData.show_progress || showData.showProgress;
          
          if (showProgress && showProgress[episodeKey]) {
            const episodeProgress = showProgress[episodeKey];
            const progress = episodeProgress.progress || episodeProgress;
            
            if (progress && progress.duration > 0) {
              const watchedPercentage = (progress.watched / progress.duration) * 100;
              setLastProgress(watchedPercentage);
              
              if (watchedPercentage >= 95 && hasNextEpisode && !autoNextTriggeredRef.current) {
                autoNextTriggeredRef.current = true;
                console.log(`Episode ${episodeKey} at ${watchedPercentage.toFixed(1)}%, triggering next episode`);
                onNextEpisode();
                
                toast({
                  title: "Playing Next Episode",
                  description: "Auto-next triggered",
                  duration: 2000,
                });
                
                setTimeout(() => { autoNextTriggeredRef.current = false; }, 5000);
              }
            }
          }
        }
      }
    }

    if (eventData?.type === 'PLAYER_EVENT') {
      const { event: eventType, currentTime, duration } = eventData.data;
      
      if (eventType === 'ended' && hasNextEpisode && !autoNextTriggeredRef.current) {
        autoNextTriggeredRef.current = true;
        console.log('Video ended, triggering next episode');
        onNextEpisode();
        toast({ title: "Playing Next Episode", description: "Auto-next triggered on video end", duration: 2000 });
        setTimeout(() => { autoNextTriggeredRef.current = false; }, 5000);
      }
      
      if (eventType === 'timeupdate' && duration > 0) {
        const watchedPercentage = (currentTime / duration) * 100;
        setLastProgress(watchedPercentage);
        
        if (watchedPercentage >= 95 && hasNextEpisode && !autoNextTriggeredRef.current) {
          autoNextTriggeredRef.current = true;
          console.log(`PLAYER_EVENT: Episode at ${watchedPercentage.toFixed(1)}%, triggering next episode`);
          onNextEpisode();
          toast({ title: "Playing Next Episode", description: "Auto-next triggered", duration: 2000 });
          setTimeout(() => { autoNextTriggeredRef.current = false; }, 5000);
        }
      }
    }
  }, [isEnabled, mediaType, currentEpisode, currentSource, hasNextEpisode, onNextEpisode, toast]);

  useEffect(() => {
    if (isEnabled && mediaType === 'tv' && isSourceSupported) {
      messageListenerRef.current = handleMessage;
      window.addEventListener('message', handleMessage);
      setIsListening(true);
      autoNextTriggeredRef.current = false;
      console.log(`🎬 Auto-next listener activated for ${currentSource}`);
    } else {
      if (messageListenerRef.current) {
        window.removeEventListener('message', messageListenerRef.current);
        messageListenerRef.current = undefined;
      }
      setIsListening(false);
    }

    return () => {
      if (messageListenerRef.current) {
        window.removeEventListener('message', messageListenerRef.current);
      }
    };
  }, [isEnabled, mediaType, isSourceSupported, currentSource, handleMessage]);

  const handleToggle = (checked: boolean) => {
    onToggle(checked);
    localStorage.setItem('autoNextEnabled', checked.toString());
    
    if (checked && !isSourceSupported) {
      toast({ title: "Not Supported", description: "Auto-next is not supported for this video source.", variant: "destructive", duration: 3000 });
      return;
    }
    
    toast({
      title: checked ? "Auto-Next Enabled" : "Auto-Next Disabled",
      description: checked ? "Next episode will play automatically" : "Auto-next feature is now disabled.",
      duration: 3000,
    });
  };

  const sourceConfig = SUPPORTED_SOURCES[currentSource];
  const sourceName = sourceConfig?.name || currentSource;

  return (
    <div className={cn("relative", className)}>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "border-white/10 bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-all duration-300",
            isEnabled && "border-accent/30 bg-accent/10",
            !isSourceSupported && "opacity-50 cursor-not-allowed"
          )}
          disabled={!isSourceSupported}
        >
          <SkipForward className="h-4 w-4 mr-2" />
          AutoNext
          {isEnabled && isListening && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="ml-2 h-2 w-2 rounded-full bg-green-500" />
          )}
        </Button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute top-full right-0 mt-2 w-80 bg-black/90 backdrop-blur-md p-4 rounded-lg shadow-xl border border-white/10 z-50"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Label className="text-white font-medium">Auto-Next Episode</Label>
                    {isListening && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />}
                  </div>
                  <p className="text-white/60 text-xs">Automatically play next episode at 95%</p>
                </div>
                <Switch checked={isEnabled} onCheckedChange={handleToggle} disabled={!isSourceSupported} className={cn("data-[state=checked]:bg-accent", !isSourceSupported && "opacity-50")} />
              </div>

              {!isSourceSupported ? (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-md p-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-amber-400 text-sm font-medium">Not Supported</p>
                      <p className="text-amber-400/70 text-xs mt-1">Auto-next is not available for {sourceName}.</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-white/70 text-sm">Current Source</span>
                    <span className="text-accent text-sm font-medium">{sourceName}</span>
                  </div>
                  {mediaType === 'tv' && currentEpisode && (
                    <div className="flex items-center justify-between">
                      <span className="text-white/70 text-sm">Current Episode</span>
                      <span className="text-white text-sm">S{currentEpisode.season}E{currentEpisode.episode}</span>
                    </div>
                  )}
                  {lastProgress > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-white/70 text-sm">Watch Progress</span>
                      <span className="text-green-400 text-sm font-medium">{lastProgress.toFixed(1)}%</span>
                    </div>
                  )}
                  {isListening && (
                    <div className="flex items-center justify-between">
                      <span className="text-white/70 text-sm">Status</span>
                      <span className="text-green-400 text-sm font-medium flex items-center gap-1">
                        <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="h-2 w-2 rounded-full bg-green-500" />
                        Listening
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};