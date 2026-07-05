import React, { useState } from 'react';
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

interface SportMatchCardProps {
  match: APIMatch;
  className?: string;
}

const SportMatchCard = ({ match, className }: SportMatchCardProps) => {
  const { userPreferences } = useUserPreferences();
  const accentColor = userPreferences?.accentColor || 'hsl(var(--accent))';
  const [isHovered, setIsHovered] = useState(false);
  
  const now = new Date().getTime();
  const matchTime = new Date(match.date);
  const matchTimestamp = matchTime.getTime();
  
  const isLive = matchTimestamp <= now && (now - matchTimestamp < 3 * 60 * 60 * 1000);
  const isUpcoming = matchTimestamp > now;
  const matchId = match.id;
  
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
      <Card className="overflow-hidden bg-gradient-to-br from-neutral-950 to-neutral-900 border border-neutral-800 group-hover:border-neutral-700 h-full shadow-2xl flex flex-col justify-between rounded-2xl transition-all duration-300 group-hover:shadow-[0_0_40px_rgba(0,0,0,0.9)]">
        
        {/* Dynamic Canvas Area with Enhanced Effects */}
        <div className="relative aspect-[16/10] bg-neutral-900 flex items-center justify-center p-4 border-b border-neutral-800 overflow-hidden">
          {/* Animated Background Gradient */}
          <motion.div
            className="absolute inset-0 opacity-0 group-hover:opacity-100"
            style={{ backgroundColor: accentColor }}
            animate={isHovered ? { opacity: 0.05 } : { opacity: 0 }}
            transition={{ duration: 0.4 }}
          />
          
          {match.poster && (
            <>
              <img
                src={getMatchPosterUrl(match.poster)}
                alt=""
                className="absolute inset-0 w-full h-full object-cover opacity-25 blur-sm scale-110 group-hover:scale-105 transition-all duration-500"
                loading="lazy"
              />
              {/* Overlay Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/50 to-transparent z-5" />
            </>
          )}
          
          <div className="absolute inset-0 bg-neutral-950/30 z-0" />

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
                  className="w-16 h-16 rounded-xl bg-gradient-to-br from-neutral-800 to-black border-2 border-neutral-700 p-2.5 flex items-center justify-center shadow-lg group-hover:border-neutral-600 transition-all duration-300 relative"
                  animate={isHovered ? { y: -4, boxShadow: `0 8px 20px ${accentColor}20` } : { y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <img
                    src={getTeamBadgeUrl(match.teams.home.badge)}
                    alt=""
                    className="w-full h-full object-contain"
                    loading="lazy"
                    onError={(e) => { e.currentTarget.src = '/placeholder.svg' }}
                  />
                </motion.div>
                <span className="text-xs font-black text-white truncate w-full mt-2 tracking-wide uppercase group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-neutral-400 group-hover:bg-clip-text transition-all duration-300">
                  {match.teams.home.name}
                </span>
              </div>

              {/* VS Badge */}
              <motion.div 
                className="text-[10px] font-black tracking-widest text-white bg-gradient-to-r from-neutral-800 to-black px-2 py-1 rounded border border-neutral-700"
                animate={isHovered ? { scale: 1.1, rotate: 360 } : { scale: 1, rotate: 0 }}
                transition={{ duration: 0.5 }}
              >
                VS
              </motion.div>

              {/* Away Team */}
              <div className="flex flex-col items-center text-center w-[45%]">
                <motion.div 
                  className="w-16 h-16 rounded-xl bg-gradient-to-br from-neutral-800 to-black border-2 border-neutral-700 p-2.5 flex items-center justify-center shadow-lg group-hover:border-neutral-600 transition-all duration-300 relative"
                  animate={isHovered ? { y: -4, boxShadow: `0 8px 20px ${accentColor}20` } : { y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <img
                    src={getTeamBadgeUrl(match.teams.away.badge)}
                    alt=""
                    className="w-full h-full object-contain"
                    loading="lazy"
                    onError={(e) => { e.currentTarget.src = '/placeholder.svg' }}
                  />
                </motion.div>
                <span className="text-xs font-black text-white truncate w-full mt-2 tracking-wide uppercase group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-neutral-400 group-hover:bg-clip-text transition-all duration-300">
                  {match.teams.away.name}
                </span>
              </div>
            </motion.div>
          ) : (
            <div className="relative z-10 text-center">
              <ShieldAlert className="h-8 w-8 text-neutral-700 mx-auto mb-1" />
              <span className="text-[10px] font-black tracking-widest text-neutral-400 bg-neutral-900 px-2 py-1 rounded uppercase">{match.category}</span>
            </div>
          )}

          {/* Floated Indicators with Enhanced Effects */}
          <div className="absolute top-3 right-3 z-20 flex flex-col gap-2">
            {isLive ? (
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <Badge className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-600 hover:to-red-700 text-[9px] font-black tracking-widest px-2 py-0.5 rounded border border-red-500 shadow-[0_0_15px_rgba(220,38,38,0.6)]">
                  🔴 LIVE
                </Badge>
              </motion.div>
            ) : isUpcoming ? (
              <Badge className="bg-neutral-800 text-neutral-300 hover:bg-neutral-800 text-[9px] font-black tracking-widest px-2 py-0.5 rounded border border-neutral-700">
                ⏱️ PENDING
              </Badge>
            ) : match.popular ? (
              <Badge style={{ background: accentColor }} className="text-[9px] font-black tracking-widest px-2 py-0.5 rounded border-none shadow-md">
                ⭐ TOP
              </Badge>
            ) : null}
            
            {/* Streaming Quality Indicator */}
            {match.sources && match.sources.length > 0 && (
              <motion.div
                animate={isHovered ? { scale: 1.05 } : { scale: 1 }}
                className="bg-neutral-900/80 backdrop-blur-sm text-[9px] font-black tracking-widest px-2 py-0.5 rounded border border-neutral-700 text-neutral-300 flex items-center gap-1"
              >
                <Zap className="h-3 w-3 text-amber-400" />
                {match.sources.length}
              </motion.div>
            )}
          </div>
        </div>

        {/* Info Deck with Enhanced Typography */}
        <CardContent className="p-4 bg-gradient-to-b from-neutral-950 to-neutral-900 flex-grow flex flex-col justify-between">
          <div>
            <div className="text-[9px] font-black tracking-widest text-indigo-400 uppercase mb-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: accentColor }} />
              {match.league || match.category}
            </div>
            <h3 className="font-bold text-sm text-neutral-200 group-hover:text-white line-clamp-2 tracking-wide transition-colors duration-300">
              {match.title}
            </h3>
          </div>

          {/* Bottom Stats Bar with Hover Effects */}
          <motion.div 
            className="mt-4 pt-3 border-t border-neutral-800 flex justify-between items-center text-[10px] font-bold text-neutral-500 tracking-wide uppercase"
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
                    <Radio className="h-3 w-3 text-red-500" />
                  </motion.div>
                  <span className="text-red-400">Live Now</span>
                </>
              ) : (
                <>
                  <Clock className="h-3 w-3" />
                  <span>{formatDistanceToNow(matchTime, { addSuffix: true })}</span>
                </>
              )}
            </div>

            <motion.div 
              className="bg-neutral-900 text-neutral-400 px-2 py-0.5 rounded font-mono text-[9px] border border-neutral-700/60 flex items-center gap-1 group-hover:border-neutral-600 transition-all"
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
