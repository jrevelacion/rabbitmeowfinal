import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from "@/lib/utils";
import { Media } from '@/utils/types';
import { posterSizes } from '@/utils/api';
import { Star, Info } from 'lucide-react';
import { motion } from 'framer-motion';

interface MediaCardProps {
  media: Media & {
    docId?: string;
    episode_info?: string;
    season_number?: number;
    episode_number?: number;
    episode_title?: string;
    media_id?: number; // Add media_id as optional property
  };
  className?: string;
  featured?: boolean;
  minimal?: boolean;
  showEpisodeInfo?: boolean;
}

const MediaCard = ({ 
  media, 
  className, 
  featured = false, 
  minimal = false,
  showEpisodeInfo = false 
}: MediaCardProps) => {
  console.log(`MediaCard: ${media.media_type}/${media.id} - ${media.title || media.name}`);
  console.log('Full Media Object:', media);
  
  // Use id as primary, fallback to media_id
  const mediaId = media.id || media.media_id;
  
  // Validate mediaId and media_type
  if (!mediaId) {
    console.error(`Invalid media data: Missing ID`, media);
    return (
      <div className={cn("text-white/70 text-center p-2 bg-red-500/20 rounded", className)}>
        Invalid Media Item
      </div>
    );
  }

  if (!media.media_type || !['movie', 'tv'].includes(media.media_type)) {
    console.error(`Invalid media type: ${media.media_type}`, media);
    return (
      <div className={cn("text-white/70 text-center p-2 bg-red-500/20 rounded", className)}>
        Invalid Media Type
      </div>
    );
  }

  const detailPath = media.media_type === 'movie' 
    ? `/movie/${mediaId}` 
    : `/tv/${mediaId}`;
  
  // Get the title with fallbacks
  const title = media.title || media.name || 'Untitled';
  
  // Get the poster path with fallback
  const posterPath = media.poster_path 
    ? `${posterSizes.medium}${media.poster_path}`
    : '/placeholder-image.jpg';
  
  // Get the year based on media type
  const year = media.media_type === 'movie'
    ? media.release_date?.substring(0, 4)
    : media.first_air_date?.substring(0, 4);
  
  if (minimal) {
    return (
      <Link 
        to={detailPath} 
        className={cn(
          "block h-full",
          className
        )}
      >
        <div className="relative h-full rounded-md overflow-hidden shadow-md group">
          <img
            src={posterPath}
            alt={title}
            className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />
          
          {/* Gradient overlay for better text visibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
          
          {/* Content overlay - always visible on minimal cards */}
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <h3 className="text-white font-semibold text-sm md:text-base line-clamp-2 drop-shadow-lg">
              {title}
            </h3>
            
            {/* Show episode info for TV shows in watch history */}
            {showEpisodeInfo && media.episode_info && (
              <div className="mt-2">
                <span className="inline-flex items-center px-2 py-1 bg-accent/90 text-white text-xs font-medium rounded">
                  {media.episode_info}
                </span>
                {media.episode_title && (
                  <p className="text-white/80 text-xs mt-1 line-clamp-1 drop-shadow-lg">
                    {media.episode_title}
                  </p>
                )}
              </div>
            )}
            
            {/* Show year for non-history items or as fallback */}
            {!showEpisodeInfo && year && (
              <p className="text-white/80 text-xs mt-1 drop-shadow-lg">
                {year || 'N/A'}
              </p>
            )}
          </div>
        </div>
      </Link>
    );
  }
  
  return (
    <Link 
      to={detailPath} 
      className={cn(
        "relative block group/card transform transition-all duration-300 hover:-translate-y-2",
        className
      )}
    >
      <div className="relative rounded-md overflow-hidden shadow-md aspect-[2/3]">
        <img
          src={posterPath}
          alt={title}
          className="object-cover w-full h-full transition-transform duration-500 group-hover/card:scale-110"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-300" />
        
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 to-transparent translate-y-full group-hover/card:translate-y-0 transition-transform duration-300">
          <p className="text-white/80 text-xs line-clamp-3">{media.overview || 'No description available'}</p>
          <div className="flex justify-center mt-2">
            <button className="glass px-3 py-1 rounded text-xs flex items-center gap-1 text-white hover:bg-white/20 transition-colors">
              <Info size={12} /> Details
            </button>
          </div>
        </div>
      </div>
      
      <div className="mt-2 px-1 transition-all duration-300 group-hover/card:translate-y-0">
        <h3 className="text-white font-medium line-clamp-1 text-balance">{title}</h3>
        
        <div className="flex items-center justify-between mt-1 text-sm text-white/70">
          <span className="line-clamp-1">
            {year || 'N/A'}
          </span>
          
          {media.vote_average && media.vote_average > 0 && (
            <div className="flex items-center text-amber-400">
              <Star className="h-4 w-4 mr-1 fill-amber-400 group-hover/card:animate-pulse" />
              {media.vote_average.toFixed(1)}
            </div>
          )}
        </div>
        
        {/* Show episode info for TV shows in watch history (non-minimal mode) */}
        {showEpisodeInfo && media.episode_info && (
          <div className="mt-2">
            <span className="inline-flex items-center px-2 py-1 bg-accent/90 text-white text-xs font-medium rounded">
              {media.episode_info}
            </span>
            {media.episode_title && (
              <p className="text-white/80 text-xs mt-1 line-clamp-1">
                {media.episode_title}
              </p>
            )}
          </div>
        )}
      </div>
    </Link>
  );
};

export default MediaCard;