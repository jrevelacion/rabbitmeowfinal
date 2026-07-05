import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { APIMatch } from '@/utils/sports-types';
import { getMatchPosterUrl, getTeamBadgeUrl } from '@/utils/sports-api';
import { formatDistanceToNow, format } from 'date-fns';
import { Clock, Radio, ShieldAlert, Zap, Eye } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useUserPreferences } from '@/hooks/user-preferences';
import { motion } from 'framer-motion';
import { getColorForSport } from '@/utils/sports-colors';

interface SportMatchCardProps {
  match: APIMatch;
  className?: string;
}

const SportMatchCard = ({ match, className }: SportMatchCardProps) => {
  const { userPreferences } = useUserPreferences();
  const accentColor = userPreferences?.accentColor || 'hsl(var(--accent))';
  const [isHovered, setIsHovered] = useState(false);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  
  const handleImageError = useCallback((badgeUrl: string) => {
    setFailedImages(prev => new Set(prev).add(badgeUrl));
  }, []);
  
  const now = new Date().getTime();
  const matchTime = new Date(match.date);
  const matchTimestamp = matchTime.getTime();
  
  const isLive = matchTimestamp <= now && (now - matchTimestamp < 3 * 60 * 60 * 1000);
  const isUpcoming = matchTimestamp > now;
  const matchId = match.id;
  
  // Determine color based on match category
  const sportColor = getColorForSport(match.category);
  
  return (
    <Link
      to={`/sports/player/${matchId}`}
      className={cn(
        "block group h-full select-none",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Card 
        className={cn(
          "overflow-hidden h-full shadow-2xl flex flex-col justify-between rounded-2xl transition-all duration-300 group-hover:shadow-[0_0_40px_rgba(0,0,0,0.6)] border border-white/20 bg-gradient-to-br",
          sportColor.bg
        )}
        style={{
          boxShadow: isHovered ? `0 0 30px ${sportColor.glow}` : 'none'
        }}
      >
        
        {/* Dynamic Canvas Area with Enhanced Effects */}
        <div className="relative aspect-[16/10] bg-gradient-to-br from-white/20 to-white/5 flex items-center justify-center p-4 border-b border-white/20 overflow-hidden">
          {/* Animated Background Gradient Overlay */}
          <motion.div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-br from-white/10 to-transparent"
            animate={isHovered ? { opacity: 0.15 } : { opacity: 0 }}
            transition={{ duration: 0.4 }}
          />
          
          {match.poster && (
            <>
              <img
                src={getMatchPosterUrl(match.poster)}
                alt=""
                className="absolute inset-0 w-full h-full object-cover opacity-60 scale-100 group-hover:scale-105 transition-all duration-500"
                loading="lazy"
              />
              {/* Overlay Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent z-5" />
            </>
          )}
          
          <div className="absolute inset-0 bg-black/20 z-0" />

          {/* Versus Interface with Enhanced Styling */}
          {match.teams ? (
            <motion.div 
              className="relative z-10 w-full flex items-center justify-between gap-1"
              animate={isHovered ? { scale: 1.02 } : { scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              {/* Home Team */}
              <div className="flex flex-col items-center text-center w-[45%]">
                <motion.div 
                  className="w-20 h-20 rounded-xl bg-gradient-to-br from-white/30 to-white/10 border-2 border-white/40 p-3 flex items-center justify-center shadow-lg group-hover:border-white/60 transition-all duration-300 relative backdrop-blur-sm"
                  animate={isHovered ? { y: -6, boxShadow: `0 12px 30px rgba(255,255,255,0.3)` } : { y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {!failedImages.has(match.teams.home.badge) ? (
                    <img
                      src={getTeamBadgeUrl(match.teams.home.badge)}
                      alt=""
                      className="w-full h-full object-contain drop-shadow-lg"
                      loading="lazy"
                      onError={() => handleImageError(match.teams.home.badge)}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-white/10 to-white/5 rounded-lg">
                      <span className="text-[10px] font-black text-white/60 uppercase">N/A</span>
                    </div>
                  )}
                </motion.div>
                <span className="text-xs font-black text-white truncate w-full mt-2.5 tracking-wide uppercase drop-shadow-lg group-hover:text-yellow-100 transition-all duration-300">
                  {match.teams.home.name}
                </span>
              </div>

              {/* VS Badge */}
              <motion.div 
                className="text-[10px] font-black tracking-widest text-white bg-gradient-to-r from-white/30 to-white/10 px-2 py-1 rounded border border-white/40 backdrop-blur-sm drop-shadow-lg"
                animate={isHovered ? { scale: 1.1, rotate: 360 } : { scale: 1, rotate: 0 }}
                transition={{ duration: 0.5 }}
              >
                VS
              </motion.div>

              {/* Away Team */}
              <div className="flex flex-col items-center text-center w-[45%]">
                <motion.div 
                  className="w-20 h-20 rounded-xl bg-gradient-to-br from-white/30 to-white/10 border-2 border-white/40 p-3 flex items-center justify-center shadow-lg group-hover:border-white/60 transition-all duration-300 relative backdrop-blur-sm"
                  animate={isHovered ? { y: -6, boxShadow: `0 12px 30px rgba(255,255,255,0.3)` } : { y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {!failedImages.has(match.teams.away.badge) ? (
                    <img
                      src={getTeamBadgeUrl(match.teams.away.badge)}
                      alt=""
                      className="w-full h-full object-contain drop-shadow-lg"
                      loading="lazy"
                      onError={() => handleImageError(match.teams.away.badge)}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-white/10 to-white/5 rounded-lg">
                      <span className="text-[10px] font-black text-white/60 uppercase">N/A</span>
                    </div>
                  )}
                </motion.div>
                <span className="text-xs font-black text-white truncate w-full mt-2.5 tracking-wide uppercase drop-shadow-lg group-hover:text-yellow-100 transition-all duration-300">
                  {match.teams.away.name}
                </span>
              </div>
            </motion.div>
          ) : (
            <div className="relative z-10 text-center">
              <ShieldAlert className="h-8 w-8 text-white drop-shadow-lg mx-auto mb-1" />
              <span className="text-[10px] font-black tracking-widest text-white bg-white/20 px-2 py-1 rounded uppercase backdrop-blur-sm drop-shadow-lg">{match.category}</span>
            </div>
          )}

          {/* Floated Indicators with Enhanced Effects */}
          <div className="absolute top-3 right-3 z-20 flex flex-col gap-2">
            {isLive ? (
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <Badge className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-500 hover:to-red-600 text-[9px] font-black tracking-widest px-2 py-0.5 rounded border border-white/40 shadow-[0_0_15px_rgba(239,68,68,0.6)] text-white drop-shadow-lg">
                  🔴 LIVE
                </Badge>
              </motion.div>
            ) : isUpcoming ? (
              <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-500 hover:to-blue-600 text-[9px] font-black tracking-widest px-2 py-0.5 rounded border border-white/40 drop-shadow-lg">
                ⏱️ PENDING
              </Badge>
            ) : match.popular ? (
              <Badge className="bg-gradient-to-r from-yellow-500 to-amber-500 text-white text-[9px] font-black tracking-widest px-2 py-0.5 rounded border border-white/40 shadow-md drop-shadow-lg">
                ⭐ TOP
              </Badge>
            ) : null}
            
            {/* Streaming Quality Indicator */}
            {match.sources && match.sources.length > 0 && (
              <motion.div
                animate={isHovered ? { scale: 1.05 } : { scale: 1 }}
                className="bg-white/20 backdrop-blur-sm text-[9px] font-black tracking-widest px-2 py-0.5 rounded border border-white/40 text-white flex items-center gap-1 drop-shadow-lg"
              >
                <Zap className="h-3 w-3 text-yellow-300" />
                {match.sources.length}
              </motion.div>
            )}
          </div>
        </div>

        {/* Info Deck with Enhanced Typography */}
        <CardContent className="p-4 bg-gradient-to-b from-white/10 to-white/5 flex-grow flex flex-col justify-between backdrop-blur-sm">
          <div>
            <div className="text-[9px] font-black tracking-widest text-white/90 uppercase mb-1 flex items-center gap-1 drop-shadow-lg">
              <span className="w-1.5 h-1.5 rounded-full bg-white/70" />
              {match.league || match.category}
            </div>
            <h3 className="font-bold text-sm text-white line-clamp-2 tracking-wide transition-colors duration-300 drop-shadow-lg">
              {match.title}
            </h3>
          </div>

          {/* Bottom Stats Bar with Hover Effects */}
          <motion.div 
            className="mt-4 pt-3 border-t border-white/20 flex justify-between items-center text-[10px] font-bold text-white/80 tracking-wide uppercase"
            animate={isHovered ? { y: -2 } : { y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center gap-1.5">
              {isLive ? (
                <>
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <Radio className="h-3 w-3 text-red-300" />
                  </motion.div>
                  <span className="text-red-100">Live Now</span>
                </>
              ) : (
                <>
                  <Clock className="h-3 w-3" />
                  <span>{formatDistanceToNow(matchTime, { addSuffix: true })}</span>
                </>
              )}
            </div>

            <motion.div 
              className="bg-white/20 text-white/90 px-2 py-0.5 rounded font-mono text-[9px] border border-white/30 flex items-center gap-1 group-hover:border-white/50 transition-all backdrop-blur-sm drop-shadow-lg"
              animate={isHovered ? { scale: 1.05 } : { scale: 1 }}
            >
              <Eye className="h-3 w-3" />
              {match.sources.length} NODES
            </motion.div>
          </motion.div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default SportMatchCard;
