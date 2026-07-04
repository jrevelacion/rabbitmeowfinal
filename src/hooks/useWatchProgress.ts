import { useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks';
import { watchHistoryService } from '@/lib/auth';

export interface WatchProgressData {
  id: string;
  type: 'movie' | 'tv';
  title?: string;
  poster_path?: string;
  backdrop_path?: string;
  progress: {
    watched: number;
    duration: number;
  };
  last_updated: number;
  number_of_episodes?: number;
  number_of_seasons?: number;
  last_season_watched?: string | number;
  last_episode_watched?: string | number;
  show_progress?: Record<string, {
    season: string | number;
    episode: string | number;
    progress: {
      watched: number;
      duration: number;
    };
    last_updated: number;
  }>;
}

export type AllProgressData = Record<string, WatchProgressData>;

const PLAYER_ORIGINS = {
  vidsrcwtf: 'https://www.vidsrc.wtf',
  videasy: 'https://player.videasy.net',
  vidlink: 'https://vidlink.pro',  
  vidzee: 'https://player.vidzee.wtf',
  vidrock: 'https://vidrock.ru',
  vidup: 'https://vidup.to',
  vidnest: 'https://vidnest.fun',
  vidfast: [
    'https://vidfast.pro', 'https://vidfast.in', 'https://vidfast.io',
    'https://vidfast.me', 'https://vidfast.net', 'https://vidfast.pm', 'https://vidfast.xyz'
  ]
};

const STORAGE_KEYS = {
  vidsrcwtf: 'vidsrcwtf-Progress',
  videasy: 'videasy-new-history',
  vidlink: 'vidlinkProgress',
  vidzee: 'vidZeeProgress',
  vidrock: 'vidRockProgress',
  vidup: 'vidUpProgress',
  vidnest: 'vidNestProgress',
  vidfast: 'vidFastProgress',
};

const lastSaveTime = new Map<string, number>();

const saveProgressToDB = async (
  tmdbId: string | number, 
  mediaType: 'movie' | 'tv', 
  watched: number, 
  duration: number,
  season?: number,
  episode?: number,
  mediaDetails?: any,
  title?: string
) => {
  try {
    if (watched < 30) return;

    const mediaId = typeof tmdbId === 'string' ? parseInt(tmdbId, 10) : tmdbId;
    const uniqueKey = `${mediaId}_${mediaType}_${season || 0}_${episode || 0}`;
    const now = Date.now();
    const lastSaved = lastSaveTime.get(uniqueKey);
    
    if (lastSaved && now - lastSaved < 60000) return;

    const mediaData = {
      id: mediaId,
      media_id: mediaId,
      title: title || mediaDetails?.title || mediaDetails?.name || '',
      name: title || mediaDetails?.title || mediaDetails?.name || '',
      poster_path: mediaDetails?.poster_path || '',
      backdrop_path: mediaDetails?.backdrop_path || '',
      media_type: mediaType,
      overview: mediaDetails?.overview || '',
      vote_average: mediaDetails?.vote_average || 0
    };

    console.log(`💾 Saving progress: ${mediaData.title} - ${Math.floor(watched)}s/${Math.floor(duration)}s`);
    
    await watchHistoryService.addToWatchHistory(
      mediaData, 
      Math.floor(watched),
      Math.floor(duration), 
      season, 
      episode
    );
    
    lastSaveTime.set(uniqueKey, now);
  } catch (error: any) {
    console.error('Error saving progress:', error.message);
  }
};

// Special parser for Videoasy's data format (keys like "movie-617126" or "tv-1396")
const parseVideasyData = (rawData: any): AllProgressData => {
  const result: AllProgressData = {};
  
  if (!rawData || typeof rawData !== 'object') return result;
  
  Object.entries(rawData).forEach(([key, item]: [string, any]) => {
    // Extract ID from keys like "movie-617126" or "tv-1396"
    const match = key.match(/^(movie|tv)-(\d+)$/);
    if (!match) return;
    
    const mediaType = match[1] === 'movie' ? 'movie' : 'tv';
    const id = match[2];
    
    const entry: WatchProgressData = {
      id: id,
      type: mediaType,
      title: item.title,
      poster_path: item.poster ? item.poster.split('/').pop() : null,
      backdrop_path: item.background ? item.background.split('/').pop() : null,
      progress: {
        watched: item.progress?.watched || 0,
        duration: item.progress?.duration || 0
      },
      last_updated: item.last_updated || Date.now()
    };
    
    // Handle TV show episode progress
    if (mediaType === 'tv' && item.show_progress) {
      entry.last_season_watched = item.last_season_watched;
      entry.last_episode_watched = item.last_episode_watched;
      entry.show_progress = {};
      
      Object.entries(item.show_progress).forEach(([epKey, epData]: [string, any]) => {
        entry.show_progress![epKey] = {
          season: epData.season,
          episode: epData.episode,
          progress: {
            watched: epData.progress?.watched || 0,
            duration: epData.progress?.duration || 0
          },
          last_updated: epData.last_updated || Date.now()
        };
      });
    }
    
    result[id] = entry;
  });
  
  return result;
};

export const getAllWatchProgress = (): AllProgressData => {
  const combined: AllProgressData = {};
  
  Object.entries(STORAGE_KEYS).forEach(([source, key]) => {
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        const data = JSON.parse(stored);
        
        // Special handling for Videoasy format
        if (source === 'videasy') {
          const parsed = parseVideasyData(data);
          Object.assign(combined, parsed);
        } else if (Array.isArray(data)) {
          data.forEach(item => {
            if (item.id) {
              const id = String(item.id);
              if (!combined[id] || (item.last_updated > combined[id].last_updated)) {
                combined[id] = { ...item, id };
              }
            }
          });
        } else if (typeof data === 'object') {
          Object.entries(data).forEach(([id, item]: [string, any]) => {
            // Handle different formats: movie-xxx, tv-xxx, mxxx, txxx
            let cleanId = id;
            if (id.startsWith('movie-') || id.startsWith('tv-')) {
              cleanId = id.replace(/^(movie-|tv-)/, '');
            } else if (id.startsWith('m') || id.startsWith('t')) {
              cleanId = id.substring(1);
            }
            
            if (!combined[cleanId] || (item.last_updated > (combined[cleanId]?.last_updated || 0))) {
              combined[cleanId] = { ...item, id: cleanId };
            }
          });
        }
      }
    } catch (e) {
      console.error(`Error parsing ${key}:`, e);
    }
  });
  
  return combined;
};

export const getWatchProgress = (tmdbId: number | string, mediaType?: 'movie' | 'tv', season?: number, episode?: number): { watched: number; duration: number; percentage: number } | null => {
  const allProgress = getAllWatchProgress();
  const id = String(tmdbId);
  const item = allProgress[id];
  if (!item) return null;
  
  if (mediaType === 'tv' && season && episode && item.show_progress) {
    const episodeKey = `s${season}e${episode}`;
    const episodeProgress = item.show_progress[episodeKey];
    if (episodeProgress?.progress) {
      const { watched, duration } = episodeProgress.progress;
      return { watched, duration, percentage: duration > 0 ? Math.min((watched / duration) * 100, 100) : 0 };
    }
  }
  
  if (item.progress) {
    const { watched, duration } = item.progress;
    return { watched, duration, percentage: duration > 0 ? Math.min((watched / duration) * 100, 100) : 0 };
  }
  
  return null;
};

export const useWatchProgress = (tmdbId?: number, mediaType?: 'movie' | 'tv', season?: number, episode?: number, mediaDetails?: any, title?: string) => {
  const { user } = useAuth();
  const processingRef = useRef(false);

  const handleMessage = useCallback((event: MessageEvent) => {
    if (!event.data || !user || !tmdbId || !mediaType) return;
    if (processingRef.current) return;
    processingRef.current = true;
    
    try {
      let eventData = event.data;
      if (typeof eventData === 'string') {
        try { eventData = JSON.parse(eventData); } catch (e) { processingRef.current = false; return; }
      }

      if (eventData?.type === 'MEDIA_DATA') {
        let mediaData = eventData.data;
        if (typeof mediaData === 'string') {
          try { mediaData = JSON.parse(mediaData); } catch (e) { processingRef.current = false; return; }
        }

        let storageKey = STORAGE_KEYS.vidsrcwtf;
        if (event.origin === PLAYER_ORIGINS.vidzee) storageKey = STORAGE_KEYS.vidzee;
        else if (event.origin === PLAYER_ORIGINS.vidrock) storageKey = STORAGE_KEYS.vidrock;
        else if (event.origin === PLAYER_ORIGINS.videasy) storageKey = STORAGE_KEYS.videasy;
        else if (event.origin === PLAYER_ORIGINS.vidlink) storageKey = STORAGE_KEYS.vidlink;
        else if (event.origin === PLAYER_ORIGINS.vidup) storageKey = STORAGE_KEYS.vidup;
        else if (event.origin === PLAYER_ORIGINS.vidnest) storageKey = STORAGE_KEYS.vidnest;
        else if (Array.isArray(PLAYER_ORIGINS.vidfast) && PLAYER_ORIGINS.vidfast.includes(event.origin)) storageKey = STORAGE_KEYS.vidfast;
        
        localStorage.setItem(storageKey, JSON.stringify(mediaData));
        
        // Handle Videoasy format (keys like "movie-xxx", "tv-xxx")
        if (storageKey === STORAGE_KEYS.videasy) {
          const parsedData = parseVideasyData(mediaData);
          
          Object.entries(parsedData).forEach(([id, item]) => {
            const mediaId = parseInt(id, 10);
            
            if (mediaId === tmdbId) {
              if (mediaType === 'tv' && item.show_progress && season && episode) {
                const episodeKey = `s${season}e${episode}`;
                const episodeProgress = item.show_progress[episodeKey];
                
                if (episodeProgress && episodeProgress.progress.watched > 30) {
                  saveProgressToDB(
                    mediaId, mediaType,
                    episodeProgress.progress.watched,
                    episodeProgress.progress.duration,
                    season, episode,
                    mediaDetails, title
                  );
                }
              } else if (item.progress.watched > 30) {
                saveProgressToDB(
                  mediaId, mediaType,
                  item.progress.watched,
                  item.progress.duration,
                  season, episode,
                  mediaDetails, title
                );
              }
            }
          });
        }
        // Handle standard array format
        else if (Array.isArray(mediaData)) {
          mediaData.forEach((item: any) => {
            if (item.id && item.progress && item.id === tmdbId) {
              const watched = item.progress.watched || 0;
              const duration = item.progress.duration || 0;
              
              if (mediaType === 'tv' && item.show_progress && season && episode) {
                const episodeKey = `s${season}e${episode}`;
                const episodeProgress = item.show_progress[episodeKey];
                if (episodeProgress?.progress && episodeProgress.progress.watched > 30) {
                  saveProgressToDB(item.id, mediaType, episodeProgress.progress.watched, episodeProgress.progress.duration, season, episode, mediaDetails, title);
                }
              } else if (watched > 30) {
                saveProgressToDB(item.id, mediaType, watched, duration, season, episode, mediaDetails, title);
              }
            }
          });
        }
        // Handle standard object format
        else if (typeof mediaData === 'object') {
          Object.entries(mediaData).forEach(([id, item]: [string, any]) => {
            // Clean ID by removing prefixes like 'movie-', 'tv-', 'm', 't'
            let cleanId = id;
            if (id.startsWith('movie-') || id.startsWith('tv-')) {
              cleanId = id.replace(/^(movie-|tv-)/, '');
            } else if (id.startsWith('m') || id.startsWith('t')) {
              cleanId = id.substring(1);
            }
            
            const mediaId = parseInt(cleanId, 10);
            
            if (item.progress && mediaId === tmdbId) {
              const watched = item.progress.watched || 0;
              const duration = item.progress.duration || 0;
              
              if (mediaType === 'tv' && item.show_progress && season && episode) {
                const episodeKey = `s${season}e${episode}`;
                const episodeProgress = item.show_progress[episodeKey];
                if (episodeProgress?.progress && episodeProgress.progress.watched > 30) {
                  saveProgressToDB(cleanId, mediaType, episodeProgress.progress.watched, episodeProgress.progress.duration, season, episode, mediaDetails, title);
                }
              } else if (watched > 30) {
                saveProgressToDB(cleanId, mediaType, watched, duration, season, episode, mediaDetails, title);
              }
            }
          });
        }
      }
      
      // Handle PLAYER_EVENT
      if (eventData?.type === 'PLAYER_EVENT') {
        const { currentTime, duration, tmdbId: eventTmdbId, mediaType: eventMediaType, season: eventSeason, episode: eventEpisode } = eventData.data;
        if (eventTmdbId !== tmdbId) return;
        
        if (currentTime > 30) {
          saveProgressToDB(eventTmdbId, mediaType || eventMediaType, currentTime, duration, season || eventSeason, episode || eventEpisode, mediaDetails, title);
        }
      }
    } catch (e) {
      console.error('Error handling player message:', e);
    } finally {
      processingRef.current = false;
    }
  }, [user, tmdbId, mediaType, season, episode, mediaDetails, title]);
  
  useEffect(() => {
    if (!user || !tmdbId || !mediaType) return;
    console.log(`🎬 Setting up watch progress listener for ${mediaType} ${tmdbId}`);
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [handleMessage, user, tmdbId, mediaType]);
};

export default useWatchProgress;