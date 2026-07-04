import React from 'react';
import { Link } from 'react-router-dom';
import { APIMatch } from '@/utils/sports-types';
import { getMatchPosterUrl, getTeamBadgeUrl } from '@/utils/sports-api';
import { formatDistanceToNow, format } from 'date-fns';
import { Clock, Radio, ShieldAlert } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useUserPreferences } from '@/hooks/user-preferences';

interface SportMatchCardProps {
  match: APIMatch;
  className?: string;
}

const SportMatchCard = ({ match, className }: SportMatchCardProps) => {
  const { userPreferences } = useUserPreferences();
  const accentColor = userPreferences?.accentColor || 'hsl(var(--accent))';
  
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
    >
      <Card className="overflow-hidden bg-neutral-950 border border-neutral-900 group-hover:border-neutral-700 h-full shadow-2xl flex flex-col justify-between rounded-2xl transition-all duration-300 group-hover:shadow-[0_0_30px_rgba(0,0,0,0.8)]">
        
        {/* Dynamic Canvas Area */}
        <div className="relative aspect-[16/10] bg-neutral-900 flex items-center justify-center p-4 border-b border-neutral-900 overflow-hidden">
          {match.poster && (
            <img
              src={getMatchPosterUrl(match.poster)}
              alt=""
              className="absolute inset-0 w-full h-full object-cover opacity-20 blur-sm scale-110 group-hover:scale-105 transition-all duration-500"
              loading="lazy"
            />
          )}
          
          <div className="absolute inset-0 bg-neutral-950/40 z-0" />

          {/* Versus Interface */}
          {match.teams ? (
            <div className="relative z-10 w-full flex items-center justify-between gap-1">
              <div className="flex flex-col items-center text-center w-[45%]">
                <div className="w-14 h-14 rounded-xl bg-black/60 border border-neutral-800/60 p-2.5 flex items-center justify-center shadow-lg group-hover:border-neutral-600 transition-all duration-300">
                  <img
                    src={getTeamBadgeUrl(match.teams.home.badge)}
                    alt=""
                    className="w-full h-full object-contain"
                    loading="lazy"
                    onError={(e) => { e.currentTarget.src = '/placeholder.svg' }}
                  />
                </div>
                <span className="text-xs font-black text-white truncate w-full mt-2 tracking-wide uppercase">{match.teams.home.name}</span>
              </div>

              <div className="text-[10px] font-black tracking-widest text-neutral-600 bg-black/80 px-2 py-1 rounded border border-neutral-800">
                VS
              </div>

              <div className="flex flex-col items-center text-center w-[45%]">
                <div className="w-14 h-14 rounded-xl bg-black/60 border border-neutral-800/60 p-2.5 flex items-center justify-center shadow-lg group-hover:border-neutral-600 transition-all duration-300">
                  <img
                    src={getTeamBadgeUrl(match.teams.away.badge)}
                    alt=""
                    className="w-full h-full object-contain"
                    loading="lazy"
                    onError={(e) => { e.currentTarget.src = '/placeholder.svg' }}
                  />
                </div>
                <span className="text-xs font-black text-white truncate w-full mt-2 tracking-wide uppercase">{match.teams.away.name}</span>
              </div>
            </div>
          ) : (
            <div className="relative z-10 text-center">
              <ShieldAlert className="h-8 w-8 text-neutral-700 mx-auto mb-1" />
              <span className="text-[10px] font-black tracking-widest text-neutral-400 bg-neutral-900 px-2 py-1 rounded uppercase">{match.category}</span>
            </div>
          )}

          {/* Floated Indicators */}
          <div className="absolute top-3 right-3 z-20">
            {isLive ? (
              <Badge className="bg-red-600 hover:bg-red-600 text-[9px] font-black tracking-widest px-2 py-0.5 rounded border border-red-500 shadow-[0_0_15px_rgba(220,38,38,0.4)]">
                LIVE
              </Badge>
            ) : isUpcoming ? (
              <Badge className="bg-neutral-800 text-neutral-300 hover:bg-neutral-800 text-[9px] font-black tracking-widest px-2 py-0.5 rounded border border-neutral-700">
                PENDING
              </Badge>
            ) : match.popular ? (
              <Badge style={{ background: accentColor }} className="text-[9px] font-black tracking-widest px-2 py-0.5 rounded border-none shadow-md">
                TOP
              </Badge>
            ) : null}
          </div>
        </div>

        {/* Info Deck */}
        <CardContent className="p-4 bg-neutral-950 flex-grow flex flex-col justify-between">
          <div>
            <div className="text-[9px] font-black tracking-widest text-indigo-400 uppercase mb-1">
              {match.league || match.category}
            </div>
            <h3 className="font-bold text-sm text-neutral-200 group-hover:text-white line-clamp-1 tracking-wide transition-colors">
              {match.title}
            </h3>
          </div>

          <div className="mt-4 pt-3 border-t border-neutral-900 flex justify-between items-center text-[10px] font-bold text-neutral-500 tracking-wide uppercase">
            <div className="flex items-center gap-1.5">
              {isLive ? <Radio className="h-3 w-3 text-red-500 animate-pulse" /> : <Clock className="h-3 w-3" />}
              <span>
                {isLive ? 'Live Now' : formatDistanceToNow(matchTime, { addSuffix: true })}
              </span>
            </div>

            <div className="bg-neutral-900 text-neutral-400 px-2 py-0.5 rounded font-mono text-[9px] border border-neutral-800/40">
              {match.sources.length} NODES
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default SportMatchCard;
