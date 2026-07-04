// DownloadButton.tsx
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2, AlertCircle, ExternalLink, FileDown, ChevronDown, ChevronUp } from 'lucide-react';
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

import {
  getMovieDownloadV1,
  getMovieDownloadV3,
  getMovieDownloadV4,
  getMovieDownloadV5,
  getMovieDownloadV6,
  getMovieDownloadV7,
  getMovieDownloadV8,
  getMovieDownloadV9,
} from '@/utils/api';

import {
  DownloadV1Response,
  DownloadV3Response,
  DownloadV4Response,
  DownloadV5Response,
  DownloadV6Response,
  DownloadV7Response,
  DownloadV8Response,
  DownloadV9Response,
} from '@/utils/types';

interface DownloadButtonProps {
  tmdbId: string;
  movieTitle: string;
}

const DownloadButton: React.FC<DownloadButtonProps> = ({ tmdbId, movieTitle }) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [expandedQualities, setExpandedQualities] = useState<Set<number>>(new Set());

  const v1Query = useQuery<DownloadV1Response | null>({
    queryKey: ['downloadV1', tmdbId],
    queryFn: () => getMovieDownloadV1(tmdbId),
    enabled: isOpen,
  });

  const v3Query = useQuery<DownloadV3Response | null>({
    queryKey: ['downloadV3', tmdbId],
    queryFn: () => getMovieDownloadV3(tmdbId),
    enabled: isOpen,
  });

  const v4Query = useQuery<DownloadV4Response | null>({
    queryKey: ['downloadV4', tmdbId],
    queryFn: () => getMovieDownloadV4(tmdbId),
    enabled: isOpen,
  });

  const v5Query = useQuery<DownloadV5Response | null>({
    queryKey: ['downloadV5', tmdbId],
    queryFn: () => getMovieDownloadV5(tmdbId),
    enabled: isOpen,
  });

  const v6Query = useQuery<DownloadV6Response | null>({
    queryKey: ['downloadV6', tmdbId],
    queryFn: () => getMovieDownloadV6(tmdbId),
    enabled: isOpen,
  });

  const v7Query = useQuery<DownloadV7Response | null>({
    queryKey: ['downloadV7', tmdbId],
    queryFn: () => getMovieDownloadV7(tmdbId),
    enabled: isOpen,
  });

  const v8Query = useQuery<DownloadV8Response | null>({
    queryKey: ['downloadV8', tmdbId],
    queryFn: () => getMovieDownloadV8(tmdbId),
    enabled: isOpen,
  });

  const v9Query = useQuery<DownloadV9Response[] | null>({
    queryKey: ['downloadV9', tmdbId],
    queryFn: () => getMovieDownloadV9(tmdbId),
    enabled: isOpen,
  });

  const isLoading = v1Query.isLoading || v3Query.isLoading || v4Query.isLoading ||
                   v5Query.isLoading || v6Query.isLoading || v7Query.isLoading ||
                   v8Query.isLoading || v9Query.isLoading;

  const hasDownloadLinks = 
    (v1Query.data?.downloadLink && typeof v1Query.data.downloadLink === 'string' && v1Query.data.downloadLink.startsWith('http')) ||
    (v3Query.data && 'download_links' in v3Query.data && Array.isArray(v3Query.data.download_links) && v3Query.data.download_links.length > 0) ||
    (v4Query.data && 'streams' in v4Query.data && Array.isArray(v4Query.data.streams) && v4Query.data.streams.length > 0) ||
    (v5Query.data && 'download_links' in v5Query.data && Array.isArray(v5Query.data.download_links) && v5Query.data.download_links.length > 0) ||
    (v6Query.data && 'download_links' in v6Query.data && Array.isArray(v6Query.data.download_links) && v6Query.data.download_links.length > 0) ||
    (v7Query.data && 'download_links' in v7Query.data && Array.isArray(v7Query.data.download_links) && v7Query.data.download_links.length > 0) ||
    (v8Query.data && 'links' in v8Query.data && Array.isArray(v8Query.data.links) && v8Query.data.links.length > 0) ||
    (Array.isArray(v9Query.data) && v9Query.data.length > 0);

  const handleDownloadClick = (url: string, sourceType?: string) => {
    window.open(url, '_blank');
    toast({
      title: 'Download Started',
      description: sourceType ? `From ${sourceType}` : `Downloading ${movieTitle}...`,
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

  const toggleQuality = (index: number) => {
    const newExpanded = new Set(expandedQualities);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedQualities(newExpanded);
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
            Download Options
          </DialogTitle>
          <p className="text-sm text-white/60 mt-1 truncate">{movieTitle}</p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-6 px-2 space-y-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <Loader2 className="h-10 w-10 animate-spin text-accent" />
              <p className="text-white/70">Searching for download options...</p>
            </div>
          ) : !hasDownloadLinks ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
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
                      <span className="font-medium truncate">{v1Query.data.movieTitle || movieTitle}</span>
                      {v1Query.data.releaseYear && (
                        <span className="text-xs text-white/50">{v1Query.data.releaseYear}</span>
                      )}
                    </div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-white/50 group-hover:text-accent transition-colors flex-shrink-0" />
                </Button>
              )}

              {/* V3, V5, V6 */}
              {[v3Query, v5Query, v6Query].map((query, idx) => {
                const data = query.data;
                if (data && 'download_links' in data && Array.isArray(data.download_links) && data.download_links.length > 0) {
                  return (
                    <div key={idx} className="space-y-2">
                      {data.download_links.map((link: any, i: number) => {
                        const quality = extractQuality(link.text);
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
                                <span className="font-medium truncate text-left">{link.text}</span>
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

              {/* V4 */}
              {v4Query.data && 'streams' in v4Query.data && Array.isArray(v4Query.data.streams) && v4Query.data.streams.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-orange-600/20 text-orange-400 border-orange-600/30">
                      🇮🇳 Hindi Audio Available
                    </Badge>
                  </div>
                  {v4Query.data.streams.map((stream: any, i: number) => {
                    const isHindi = stream.title?.toLowerCase().includes('hindi') || 
                                   stream.title?.toLowerCase().includes('हिन्दी');
                    return (
                      <Button
                        key={i}
                        variant="outline"
                        className="w-full justify-between border-white/20 bg-white/5 hover:bg-white/10 hover:border-accent/50 h-auto py-4 px-4 group"
                        onClick={() => handleDownloadClick(stream.url, stream.name)}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <Download className="h-5 w-5 text-accent flex-shrink-0" />
                          <div className="flex flex-col items-start flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium truncate text-left">{stream.title || `${movieTitle} - ${stream.quality}`}</span>
                              {isHindi && <Badge className="bg-orange-600/30 text-orange-300 text-xs">Hindi</Badge>}
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

              {/* V7 */}
              {v7Query.data && 'download_links' in v7Query.data && Array.isArray(v7Query.data.download_links) && v7Query.data.download_links.length > 0 && (
                <div className="space-y-4">
                  {v7Query.data.download_links.map((group, groupIndex) => (
                    <div key={groupIndex} className="space-y-2">
                      <div className="flex items-center gap-3 px-3 py-2 bg-white/5 rounded-lg flex-wrap">
                        <Badge variant={getQualityVariant(group.quality)}>{group.quality}</Badge>
                        <span className="text-sm text-white/70">{group.size}</span>
                      </div>
                      <div className="pl-4 sm:pl-6 space-y-2 border-l border-white/10">
                        {group.links.map((link: any, linkIndex: number) => (
                          <Button
                            key={linkIndex}
                            variant="outline"
                            className="w-full justify-between border-white/20 bg-white/5 hover:bg-white/10 hover:border-accent/50 h-auto py-3.5 px-4 group"
                            onClick={() => handleDownloadClick(link.url)}
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <Download className="h-5 w-5 text-accent flex-shrink-0" />
                              <span className="font-medium truncate text-left">{link.source}</span>
                            </div>
                            <ExternalLink className="h-4 w-4 text-white/50 group-hover:text-accent transition-colors flex-shrink-0" />
                          </Button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

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

              {/* V9 */}
              {Array.isArray(v9Query.data) && v9Query.data.length > 0 && (
                <div className="space-y-4">
                  {v9Query.data.map((qualityGroup, groupIndex) => {
                    const isExpanded = expandedQualities.has(groupIndex);
                    return (
                      <div key={groupIndex} className="space-y-2">
                        <button
                          onClick={() => toggleQuality(groupIndex)}
                          className="w-full flex items-center justify-between bg-white/10 hover:bg-white/15 rounded-xl px-4 py-4 transition-all duration-200"
                        >
                          <div className="flex items-center gap-3 flex-wrap">
                            <Badge variant={getQualityVariant(qualityGroup.quality)} className="px-3 py-1">
                              {qualityGroup.quality}
                            </Badge>
                            <div className="text-left">
                              <div className="font-medium text-white/90">{qualityGroup.title}</div>
                              <div className="text-xs text-white/50">{qualityGroup.size}</div>
                            </div>
                          </div>
                          {isExpanded ? <ChevronUp className="h-5 w-5 text-white/60 flex-shrink-0" /> : <ChevronDown className="h-5 w-5 text-white/60 flex-shrink-0" />}
                        </button>

                        {isExpanded && (
                          <div className="pl-4 sm:pl-8 space-y-2 border-l-2 border-white/10">
                            {qualityGroup.final_downloads.map((download: any, downloadIndex: number) => (
                              <Button
                                key={downloadIndex}
                                variant="outline"
                                className="w-full justify-between border-white/20 bg-white/5 hover:bg-white/10 hover:border-accent/50 h-auto py-4 px-4 group"
                                onClick={() => handleDownloadClick(download.url, download.type)}
                              >
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  <Download className="h-5 w-5 text-accent flex-shrink-0" />
                                  <span className="font-medium truncate text-left">{download.type}</span>
                                </div>
                                <ExternalLink className="h-4 w-4 text-white/50 group-hover:text-accent transition-colors flex-shrink-0" />
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {hasDownloadLinks && (
          <div className="pt-4 border-t border-white/10 text-center px-2">
            <p className="text-xs text-white/40">Click any option to open the download link in a new tab</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default DownloadButton;