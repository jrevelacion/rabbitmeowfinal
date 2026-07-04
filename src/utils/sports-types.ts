export interface Sport {
  id: string;
  name: string;
  slug?: string;
  icon?: string;
}

export interface MatchSource {
  source: string;
  id: string;
}

export interface Stream {
  id?: string;
  source?: string;
  streamNo?: number;
  embedUrl: string;
  name?: string;
  quality?: string;
  language?: string;
}

export interface APIMatch {
  id: string;
  title: string;
  date: string;
  category: string;
  league?: string;
  popular?: boolean;
  poster?: string;
  status?: 'live' | 'upcoming' | 'finished';
  teams?: {
    home: {
      name: string;
      badge: string;
    };
    away: {
      name: string;
      badge: string;
    };
  };
  sources: MatchSource[];
}
