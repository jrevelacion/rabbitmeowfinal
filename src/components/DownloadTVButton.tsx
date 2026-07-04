// DownloadTVButton.tsx
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2, AlertCircle, ExternalLink, FileDown } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import {
  getTVDownloadV1,
  getTVDownloadV3,
  getTVDownloadV4,
  getTVDownloadV5,
  getTVDownloadV6,
  getTVDownloadV7,
  getTVDownloadV8,
  getTVDetails,
  getSeasonDetails,
} from '@/utils/api';

import {
  TVDownloadV1Response,
  TVDownloadV3Response,
  TVDownloadV4Response,
  TVDownloadV5Response,
  TVDownloadV6Response,
  TVDownloadV7Response,
  TVDownloadV8Response,
  TVDetails,
  Episode,
} from '@/utils/types';

interface DownloadTVButtonProps {
  tmdbId: string;
  showTitle: string;
  season: number;
}

const DownloadTVButton: React.FC<DownloadTVButtonProps> = ({ tmdbId, showTitle, season: initialSeason }) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState<number>(initialSeason);
  const [selectedEpisode, setSelectedEpisode] = useState<number>(1);
  const [fetchDownloads, setFetchDownloads] = useState(false);

  const { data: tvDetails, isLoading: isTVLoading } = useQuery<TVDetails | null>({
    queryKey: ['tvDetails', tmdbId],
    queryFn: () => getTVDetails(parseInt(tmdbId, 10)),
    enabled: isOpen,
  });

  const { data: episodes, isLoading: isEpisodesLoading } = useQuery<Episode[]>({
    queryKey: ['seasonEpisodes', tmdbId, selectedSeason],
    queryFn: () => getSeasonDetails(parseInt(tmdbId, 10), selectedSeason),
    enabled: isOpen && !!tvDetails,
  });

  const v1Query = useQuery<TVDownloadV1Response | null>({
    queryKey: ['tvDownloadV1', tmdbId, selectedSeason, selectedEpisode],
    queryFn: () => getTVDownloadV1(tmdbId, selectedSeason, selectedEpisode),
    enabled: isOpen && fetchDownloads,
  });

  const v3Query = useQuery<TVDownloadV3Response | null>({
    queryKey: ['tvDownloadV3', tmdbId, selectedSeason, selectedEpisode],
    queryFn: () => getTVDownloadV3(tmdbId, selectedSeason, selectedEpisode),
    enabled: isOpen && fetchDownloads,
  });

  const v4Query = useQuery<TVDownloadV4Response | null>({
    queryKey: ['tvDownloadV4', tmdbId, selectedSeason, selectedEpisode],
    queryFn: () => getTVDownloadV4(tmdbId, selectedSeason, selectedEpisode),
    enabled: isOpen && fetchDownloads,
  });

  const v5Query = useQuery<TVDownloadV5Response | null>({
    queryKey: ['tvDownloadV5', tmdbId, selectedSeason, selectedEpisode],
    queryFn: () => getTVDownloadV5(tmdbId, selectedSeason, selectedEpisode),
    enabled: isOpen && fetchDownloads,
  });

  const v6Query = useQuery<TVDownloadV6Response | null>({
    queryKey: ['tvDownloadV6', tmdbId, selectedSeason, selectedEpisode],
    queryFn: () => getTVDownloadV6(tmdbId, selectedSeason, selectedEpisode),
    enabled: isOpen && fetchDownloads,
  });

  const v7Query = useQuery<TVDownloadV7Response | null>({
    queryKey: ['tvDownloadV7', tmdbId, selectedSeason, selectedEpisode],
    queryFn: () => getTVDownloadV7(tmdbId, selectedSeason, selectedEpisode),
    enabled: isOpen && fetchDownloads,
  });

  const v8Query = useQuery<TVDownloadV8Response | null>({
    queryKey: ['tvDownloadV8', tmdbId, selectedSeason, selectedEpisode],
    queryFn: () => getTVDownloadV8(tmdbId, selectedSeason, selectedEpisode),
    enabled: isOpen && fetchDownloads,
  });

  const isLoadingDownloads = v1Query.isLoading || v3Query.isLoading || v4Query.isLoading ||
                             v5Query.isLoading || v6Query.isLoading || v7Query.isLoading || v8Query.isLoading;

  const hasDownloadLinks = 
    (v1Query.data?.downloadLink && typeof v1Query.data.downloadLink === 'string' && v1Query.data.downloadLink.startsWith('http')) ||
    (v3Query.data && 'download_links' in v3Query.data && Array.isArray(v3Query.data.download_links) && v3Query.data.download_links.length > 0) ||
    (v4Query.data && 'streams' in v4Query.data && Array.isArray(v4Query.data.streams) && v4Query.data.streams.length > 0) ||
    (v5Query.data && 'download_links' in v5Query.data && Array.isArray(v5Query.data.download_links) && v5Query.data.download_links.length > 0) ||
    (v6Query.data && 'download_links' in v6Query.data && Array.isArray(v6Query.data.download_links) && v6Query.data.download_links.length > 0) ||
    (v7Query.data && 'download_links' in v7Query.data && Array.isArray(v7Query.data.download_links) && v7Query.data.download_links.length > 0) ||
    (v8Query.data && 'links' in v8Query.data && Array.isArray(v8Query.data.links) && v8Query.data.links.length > 0);

  useEffect(() => {
    if (!isOpen) {
      setFetchDownloads(false);
      setSelectedSeason(initialSeason);
      setSelectedEpisode(1);
    }
  }, [isOpen, initialSeason]);

  const handleDownloadClick = (url: string) => {
    window.open(url, '_blank');
    toast({
      title: 'Download Started',
      description: `Downloading ${showTitle} S${selectedSeason} E${selectedEpisode}...`,
    });
  };

  const formatFileSize = (bytes: number): string => {
    if (!bytes) return 'Unknown';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const extractQuality = (text: string): string | null => {
    const match = text.match(/(\d{3,4}p|4K|HD|FHD|UHD|CAM|TS|WEB-DL|BluRay|BRRip|DVDRip)/i);
    return match ? match[0] : null;
  };

  const getQualityVariant = (quality: string): "default" | "secondary" | "outline" => {
    const q = quality.toLowerCase();
    if (q.includes('4k') || q.includes('2160p')) return 'default';
    if (q.includes('1080p') || q.includes('bluray')) return 'secondary';
    return 'outline';
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="border-white/20 bg-black/50 text-white hover:bg-black/70 hover:border-accent/50 transition-all duration-200"
        >
          <Download className="h-4 w-4 mr-2" />
          Download
        </Button>
      </DialogTrigger>

      <DialogContent className="bg-gradient-to-b from-black/95 to-black/90 border-white/20 text-white w-[95vw] max-w-2xl max-h-[90vh] flex flex-col overflow-hidden backdrop-blur-xl rounded-lg">
        <DialogHeader className="pb-4 border-b border-white/10 px-2">
          <DialogTitle className="text-xl font-semibold flex items-center gap-3">
            <FileDown className="h-5 w-5 text-accent" />
            Download TV Episode
          </DialogTitle>
          <p className="text-sm text-white/60 mt-1 truncate">{showTitle}</p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-6 px-2 space-y-6">
          {/* Season & Episode Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-white/70 text-sm mb-2 block">Season</label>
              <Select
                value={selectedSeason.toString()}
                onValueChange={(value) => {
                  setSelectedSeason(parseInt(value, 10));
                  setSelectedEpisode(1);
                  setFetchDownloads(false);
                }}
                disabled={isTVLoading || !tvDetails}
              >
                <SelectTrigger className="bg-black/50 border-white/20 text-white w-full">
                  <SelectValue placeholder="Select season" />
                </SelectTrigger>
                <SelectContent className="bg-black/90 border-white/10 text-white">
                  {tvDetails?.seasons
                    ?.filter((s) => s.season_number > 0)
                    .map((season) => (
                      <SelectItem key={season.id} value={season.season_number.toString()}>
                        Season {season.season_number}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-white/70 text-sm mb-2 block">Episode</label>
              <Select
                value={selectedEpisode.toString()}
                onValueChange={(value) => {
                  setSelectedEpisode(parseInt(value, 10));
                  setFetchDownloads(false);
                }}
                disabled={isEpisodesLoading || !episodes || episodes.length === 0}
              >
                <SelectTrigger className="bg-black/50 border-white/20 text-white w-full">
                  <SelectValue placeholder="Select episode" />
                </SelectTrigger>
                <SelectContent className="bg-black/90 border-white/10 text-white max-h-[200px] overflow-y-auto">
                  {episodes?.map((episode) => (
                    <SelectItem key={episode.id} value={episode.episode_number.toString()}>
                      Episode {episode.episode_number} - {episode.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Fetch Button */}
          {!fetchDownloads && (
            <Button
              onClick={() => setFetchDownloads(true)}
              className="w-full bg-accent hover:bg-accent/90 text-white font-medium"
              disabled={isTVLoading || isEpisodesLoading || !episodes || episodes.length === 0}
            >
              Fetch Download Options
            </Button>
          )}

          {/* Download Results */}
          {fetchDownloads && (
            <>
              {isLoadingDownloads ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <Loader2 className="h-10 w-10 animate-spin text-accent mb-4" />
                  <p className="text-white/70">Loading download options...</p>
                </div>
              ) : !hasDownloadLinks ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <AlertCircle className="h-16 w-16 text-white/30 mb-6" />
                  <p className="text-lg text-white/80">No download options available</p>
                  <p className="text-sm text-white/50 mt-2">Please try again later.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* V1 */}
                  {v1Query.data?.downloadLink?.startsWith('http') && (
                    <Button
                      variant="outline"
                      className="w-full justify-between border-white/20 bg-white/5 hover:bg-white/10 hover:border-accent/50 h-auto py-4 px-4 group"
                      onClick={() => handleDownloadClick(v1Query.data!.downloadLink)}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Download className="h-5 w-5 text-accent flex-shrink-0" />
                        <div className="flex flex-col items-start flex-1 min-w-0">
                          <span className="font-medium truncate">Download Episode</span>
                        </div>
                      </div>
                      <ExternalLink className="h-4 w-4 text-white/50 group-hover:text-accent transition-colors flex-shrink-0" />
                    </Button>
                  )}

                  {/* V4 */}
                  {v4Query.data && 'streams' in v4Query.data && Array.isArray(v4Query.data.streams) && v4Query.data.streams.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-orange-600/20 text-orange-400 border-orange-600/30">
                          🇮🇳 Hindi Audio Available
                        </Badge>
                      </div>
                      {v4Query.data.streams.map((stream: any, index: number) => {
                        const isHindi = stream.title?.toLowerCase().includes('hindi') ||
                                       stream.title?.toLowerCase().includes('हिन्दी');
                        return (
                          <Button
                            key={index}
                            variant="outline"
                            className="w-full justify-between border-white/20 bg-white/5 hover:bg-white/10 hover:border-accent/50 h-auto py-4 px-4 group"
                            onClick={() => handleDownloadClick(stream.url)}
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <Download className="h-5 w-5 text-accent flex-shrink-0" />
                              <div className="flex flex-col items-start flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-medium truncate text-left">
                                    {stream.title || `S${selectedSeason} E${selectedEpisode}`}
                                  </span>
                                  {isHindi && (
                                    <Badge className="bg-orange-600/30 text-orange-300 text-xs">Hindi</Badge>
                                  )}
                                </div>
                                <div className="text-xs text-white/50 mt-1 break-words">
                                  {stream.quality} • {stream.size} • {stream.type}
                                </div>
                              </div>
                            </div>
                            <ExternalLink className="h-4 w-4 text-white/50 group-hover:text-accent transition-colors flex-shrink-0" />
                          </Button>
                        );
                      })}
                    </div>
                  )}

                  {/* V3, V5, V6, V7 */}
                  {[v3Query, v5Query, v6Query, v7Query].map((query, idx) => {
                    const data = query.data;
                    if (data && 'download_links' in data && Array.isArray(data.download_links) && data.download_links.length > 0) {
                      return (
                        <div key={idx} className="space-y-2">
                          {data.download_links.map((link: any, i: number) => {
                            const quality = extractQuality(link.text || link.quality || '');
                            return (
                              <Button
                                key={i}
                                variant="outline"
                                className="w-full justify-between border-white/20 bg-white/5 hover:bg-white/10 hover:border-accent/50 h-auto py-4 px-4 group"
                                onClick={() => handleDownloadClick(link.url)}
                              >
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  <Download className="h-5 w-5 text-accent flex-shrink-0" />
                                  <div className="flex flex-col items-start flex-1 min-w-0">
                                    <span className="font-medium truncate text-left">
                                      {link.text || link.quality || `S${selectedSeason} E${selectedEpisode}`}
                                    </span>
                                    {quality && (
                                      <Badge variant={getQualityVariant(quality)} className="text-xs mt-1">
                                        {quality}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                <ExternalLink className="h-4 w-4 text-white/50 group-hover:text-accent transition-colors flex-shrink-0" />
                              </Button>
                            );
                          })}
                        </div>
                      );
                    }
                    return null;
                  })}

                  {/* V8 */}
                  {v8Query.data && 'links' in v8Query.data && Array.isArray(v8Query.data.links) && v8Query.data.links.length > 0 && (
                    <div className="space-y-2">
                      {v8Query.data.links.map((link: any, i: number) => (
                        <Button
                          key={i}
                          variant="outline"
                          className="w-full justify-between border-white/20 bg-white/5 hover:bg-white/10 hover:border-accent/50 h-auto py-4 px-4 group"
                          onClick={() => handleDownloadClick(link.url)}
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <Download className="h-5 w-5 text-accent flex-shrink-0" />
                            <div className="flex flex-col items-start flex-1 min-w-0">
                              <span className="font-medium truncate text-left">{link.name}</span>
                              <span className="text-xs text-white/50 break-words">{formatFileSize(link.size)}</span>
                            </div>
                          </div>
                          <ExternalLink className="h-4 w-4 text-white/50 group-hover:text-accent transition-colors flex-shrink-0" />
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {fetchDownloads && hasDownloadLinks && (
          <div className="pt-4 border-t border-white/10 text-center px-2">
            <p className="text-xs text-white/40">
              Click any option to open the download link in a new tab
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default DownloadTVButton;