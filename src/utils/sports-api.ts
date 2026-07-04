import { APIMatch, Sport, Stream, MatchSource } from './sports-types';

const API_BASE_URL = 'https://streamed.pk';

// ALL available sources from the API documentation
export const ALL_SOURCES = ['alpha', 'bravo', 'charlie', 'delta', 'echo', 'foxtrot', 'golf', 'hotel', 'intel', 'admin'];

export const getSportsList = async (): Promise<Sport[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/sports`);
    if (!response.ok) {
      throw new Error('Failed to fetch sports list');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching sports list:', error);
    return [];
  }
};

export const getMatchesBySport = async (sportId: string): Promise<APIMatch[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/matches/${sportId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch matches for sport: ${sportId}`);
    }
    const matches: APIMatch[] = await response.json();
    return matches;
  } catch (error) {
    console.error(`Error fetching matches for sport ${sportId}:`, error);
    return [];
  }
};

export const getPopularMatchesBySport = async (sportId: string): Promise<APIMatch[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/matches/${sportId}/popular`);
    if (!response.ok) {
      throw new Error(`Failed to fetch popular matches for sport: ${sportId}`);
    }
    const matches: APIMatch[] = await response.json();
    return matches;
  } catch (error) {
    console.error(`Error fetching popular matches for sport ${sportId}:`, error);
    return [];
  }
};

export const getAllMatches = async (): Promise<APIMatch[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/matches/all`);
    if (!response.ok) {
      throw new Error('Failed to fetch all matches');
    }
    const matches: APIMatch[] = await response.json();
    return matches;
  } catch (error) {
    console.error('Error fetching all matches:', error);
    return [];
  }
};

export const getAllPopularMatches = async (): Promise<APIMatch[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/matches/all/popular`);
    if (!response.ok) {
      throw new Error('Failed to fetch all popular matches');
    }
    const matches: APIMatch[] = await response.json();
    return matches;
  } catch (error) {
    console.error('Error fetching all popular matches:', error);
    return [];
  }
};

export const getTodayMatches = async (): Promise<APIMatch[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/matches/all-today`);
    if (!response.ok) {
      throw new Error("Failed to fetch today's matches");
    }
    const matches: APIMatch[] = await response.json();
    return matches;
  } catch (error) {
    console.error("Error fetching today's matches:", error);
    return [];
  }
};

export const getTodayPopularMatches = async (): Promise<APIMatch[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/matches/all-today/popular`);
    if (!response.ok) {
      throw new Error("Failed to fetch today's popular matches");
    }
    const matches: APIMatch[] = await response.json();
    return matches;
  } catch (error) {
    console.error("Error fetching today's popular matches:", error);
    return [];
  }
};

export const getLiveMatches = async (): Promise<APIMatch[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/matches/live`);
    if (!response.ok) {
      throw new Error('Failed to fetch live matches');
    }
    const matches: APIMatch[] = await response.json();
    return matches;
  } catch (error) {
    console.error('Error fetching live matches:', error);
    return [];
  }
};

export const getLivePopularMatches = async (): Promise<APIMatch[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/matches/live/popular`);
    if (!response.ok) {
      throw new Error('Failed to fetch live popular matches');
    }
    const matches: APIMatch[] = await response.json();
    return matches;
  } catch (error) {
    console.error('Error fetching live popular matches:', error);
    return [];
  }
};

// Helper function to find source ID for a specific source
const findSourceIdForSource = (sources: MatchSource[], sourceName: string): string | null => {
  const source = sources.find(s => s.source === sourceName);
  return source ? source.id : null;
};

export const getMatchStreams = async (source: string | null, sourceId: string): Promise<Stream[]> => {
  if (source) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/stream/${source}/${sourceId}`);
      if (!response.ok) {
        return [];
      }
      const streams: Stream[] = await response.json();
      return streams.map((stream: Stream, index) => ({
        ...stream,
        source: source,
        id: stream.id || `${source}_${sourceId}_${index + 1}`,
        streamNo: index + 1
      }));
    } catch (error) {
      console.error(`Error fetching streams from ${source} for match ${sourceId}:`, error);
      return [];
    }
  } else {
    return [];
  }
};

// Get only sources that have active streams
export const getActiveSourcesForMatch = async (matchId: string): Promise<Array<{source: string, sourceId: string, streamCount: number}>> => {
  // First, get the match to access its sources array
  const match = await getMatchById(matchId);
  if (!match) {
    return [];
  }
  
  const sourcePromises = match.sources.map(async (sourceInfo) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/stream/${sourceInfo.source}/${sourceInfo.id}`);
      if (response.ok) {
        const streams: Stream[] = await response.json();
        if (streams.length > 0) {
          return {
            source: sourceInfo.source,
            sourceId: sourceInfo.id,
            streamCount: streams.length
          };
        }
      }
      return null;
    } catch {
      return null;
    }
  });

  const results = await Promise.all(sourcePromises);
  const activeSources = results.filter(result => result !== null) as Array<{source: string, sourceId: string, streamCount: number}>;
  
  return activeSources;
};

// Get streams grouped by source
export const getStreamsGroupedBySource = async (matchId: string): Promise<Record<string, Stream[]>> => {
  const activeSources = await getActiveSourcesForMatch(matchId);
  if (activeSources.length === 0) {
    return {};
  }
  
  const streamPromises = activeSources.map(async (sourceInfo) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/stream/${sourceInfo.source}/${sourceInfo.sourceId}`);
      if (response.ok) {
        const streams: Stream[] = await response.json();
        return {
          source: sourceInfo.source,
          streams: streams.map((stream, index) => ({
            ...stream,
            source: sourceInfo.source,
            id: stream.id || `${sourceInfo.source}_${sourceInfo.sourceId}_${index + 1}`,
            streamNo: index + 1
          }))
        };
      }
      return {
        source: sourceInfo.source,
        streams: []
      };
    } catch {
      return {
        source: sourceInfo.source,
        streams: []
      };
    }
  });

  const results = await Promise.all(streamPromises);
  const groupedStreams: Record<string, Stream[]> = {};
  
  results.forEach(result => {
    if (result.streams.length > 0) {
      groupedStreams[result.source] = result.streams;
    }
  });
  
  return groupedStreams;
};

// Get all streams from active sources
export const getAllActiveStreams = async (matchId: string): Promise<Stream[]> => {
  const activeSources = await getActiveSourcesForMatch(matchId);
  if (activeSources.length === 0) {
    return [];
  }
  
  const streamPromises = activeSources.map(async (sourceInfo) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/stream/${sourceInfo.source}/${sourceInfo.sourceId}`);
      if (response.ok) {
        const streams: Stream[] = await response.json();
        return streams.map((stream, index) => ({
          ...stream,
          source: sourceInfo.source,
          id: stream.id || `${sourceInfo.source}_${sourceInfo.sourceId}_${index + 1}`,
          streamNo: index + 1
        }));
      }
      return [];
    } catch {
      return [];
    }
  });

  const results = await Promise.all(streamPromises);
  const allStreams: Stream[] = [];
  
  results.forEach(streams => {
    if (streams.length > 0) {
      allStreams.push(...streams);
    }
  });
  
  // Sort by source and stream number
  allStreams.sort((a, b) => {
    if (a.source === b.source) {
      return a.streamNo - b.streamNo;
    }
    return activeSources.findIndex(s => s.source === a.source) - 
           activeSources.findIndex(s => s.source === b.source);
  });
  
  return allStreams;
};

export const getTeamBadgeUrl = (badgeId: string): string => {
  if (!badgeId) return '/placeholder.svg';
  const cleanBadgeId = badgeId.replace(/\.(webp|png|jpg|jpeg)$/i, '');
  return `${API_BASE_URL}/api/images/badge/${cleanBadgeId}.webp`;
};

const DEFAULT_POSTER_URL = '/placeholder.svg';

export const getMatchPosterUrl = (posterId?: string, homeBadge?: string, awayBadge?: string): string => {
  if (posterId) {
    if (posterId.includes(`${API_BASE_URL}/api/images/proxy/`)) {
      return posterId;
    }
    
    if (posterId.startsWith('http')) {
      const encodedUrl = encodeURIComponent(posterId);
      return `${API_BASE_URL}/api/images/proxy/${encodedUrl}.webp`;
    }
    
    if (posterId.length > 30 && !posterId.includes('/') && !posterId.endsWith('.webp')) {
      return `${API_BASE_URL}/api/images/proxy/${posterId}.webp`;
    }
    
    if (posterId.includes('/proxy/')) {
      const proxyPath = posterId.split('/proxy/')[1];
      return `${API_BASE_URL}/api/images/proxy/${proxyPath}`;
    }
    
    return `${API_BASE_URL}/api/images/poster/${posterId}.webp`;
  }
  
  if (homeBadge && awayBadge) {
    const cleanHomeBadge = homeBadge.replace(/\.(webp|png|jpg|jpeg)$/i, '');
    const cleanAwayBadge = awayBadge.replace(/\.(webp|png|jpg|jpeg)$/i, '');
    return `${API_BASE_URL}/api/images/poster/${cleanHomeBadge}/${cleanAwayBadge}.webp`;
  }
  
  return DEFAULT_POSTER_URL;
};

export const getMatchById = async (matchId: string): Promise<APIMatch | null> => {
  try {
    const allMatches = await getAllMatches();
    let match = allMatches.find(m => m.id === matchId);
    
    if (!match) {
      const popularMatches = await getAllPopularMatches();
      match = popularMatches.find(m => m.id === matchId);
    }
    
    if (!match) {
      const todayMatches = await getTodayMatches();
      match = todayMatches.find(m => m.id === matchId);
    }
    
    if (!match) {
      const liveMatches = await getLiveMatches();
      match = liveMatches.find(m => m.id === matchId);
    }
    
    return match || null;
  } catch (error) {
    console.error(`Error finding match ${matchId}:`, error);
    return null;
  }
};

// Helper function to get source ID for a specific source
export const getSourceIdForSource = async (matchId: string, sourceName: string): Promise<string | null> => {
  const match = await getMatchById(matchId);
  if (!match) return null;
  
  const source = match.sources.find(s => s.source === sourceName);
  return source ? source.id : null;
};
