import { Media } from '@/utils/types';
import MediaCard from './MediaCard';
import { motion, Variants } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { Clock, Trash2, SquareCheck, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useState } from 'react';

// Extend Media type to include optional string ID and timestamp
interface ExtendedMedia extends Omit<Media, 'id'> {
  id: string | number;
  media_id: number;
  docId?: string;
  created_at?: string;
  episode_info?: string;
  season_number?: number;
  episode_number?: number;
  episode_title?: string;
}

interface MediaGridProps {
  media: ExtendedMedia[];
  title?: string;
  listView?: boolean;
  selectable?: boolean;
  onDelete?: (id: string) => void;
  onDeleteSelected?: (ids: string[]) => void;
  showDeleteButton?: boolean;
  showEpisodeInfo?: boolean;
}

const MediaGrid = ({ 
  media, 
  title, 
  listView = false, 
  selectable = false,
  onDelete,
  onDeleteSelected,
  showDeleteButton = false,
  showEpisodeInfo = false
}: MediaGridProps) => {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [selectMode, setSelectMode] = useState(false);

  if (!media || media.length === 0) {
    return (
      <div className="py-8 text-center text-white">
        <p>No results found.</p>
      </div>
    );
  }

  const container: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  const item: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  const toggleSelectMode = () => {
    setSelectMode(!selectMode);
    setSelectedItems([]);
  };

  const handleSelect = (docId: string) => {
    setSelectedItems(prev => 
      prev.includes(docId) ? prev.filter(item => item !== docId) : [...prev, docId]
    );
  };

  const handleSelectAll = () => {
    setSelectedItems(selectedItems.length === media.length 
      ? [] 
      : media.map(item => item.docId!).filter(Boolean)
    );
  };

  const renderTimestamp = (media: ExtendedMedia) => {
    if (!media.created_at) return null;
    return (
      <div className="flex items-center text-xs text-white/70 mb-2">
        <Clock className="h-3 w-3 mr-1" />
        {formatDistanceToNow(new Date(media.created_at), { addSuffix: true })}
      </div>
    );
  };

  const renderEpisodeInfo = (media: ExtendedMedia) => {
    if (!showEpisodeInfo || !media.episode_info) return null;
    return (
      <div className="mt-1">
        <span className="inline-flex items-center px-2 py-1 bg-accent/90 text-white text-xs font-medium rounded">
          {media.episode_info}
        </span>
      </div>
    );
  };

  const renderSelectionButtons = () => {
    if (!selectable) return null;
    return (
      <div className="flex gap-2 mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={toggleSelectMode}
          className="border-white/20 bg-black/50 text-white hover:bg-black/70"
        >
          {selectMode ? 'Cancel Selection' : 'Select Items'}
        </Button>
        {selectMode && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
              className="border-white/20 bg-black/50 text-white hover:bg-black/70"
            >
              {selectedItems.length === media.length ? (
                <Square className="h-4 w-4 mr-2" />
              ) : (
                <SquareCheck className="h-4 w-4 mr-2" />
              )}
              {selectedItems.length === media.length ? 'Deselect All' : 'Select All'}
            </Button>
            {selectedItems.length > 0 && onDeleteSelected && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onDeleteSelected(selectedItems)}
                className="ml-auto"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Selected ({selectedItems.length})
              </Button>
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <div className="px-4 md:px-8 py-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        {title && <h2 className="text-2xl font-bold text-white">{title}</h2>}
        {renderSelectionButtons()}
      </div>
      
      {listView ? (
        <motion.div className="flex flex-col gap-4" variants={container} initial="hidden" animate="show">
          {media.map((mediaItem) => (
            <motion.div 
              key={`${mediaItem.media_type}-${mediaItem.id}`}
              variants={item}
              className="glass p-4 rounded-lg hover:bg-white/10 transition-colors"
            >
              <div className="flex gap-4 items-center">
                {selectMode && mediaItem.docId && (
                  <div className="flex-shrink-0">
                    <Checkbox 
                      checked={selectedItems.includes(mediaItem.docId)}
                      onCheckedChange={() => handleSelect(mediaItem.docId!)}
                    />
                  </div>
                )}
                <div className="flex-shrink-0 w-16 h-24 md:w-20 md:h-30 overflow-hidden rounded-md">
                  <MediaCard 
                    media={{ ...mediaItem, id: mediaItem.media_id }} 
                    className="h-full w-full" 
                    minimal 
                    showEpisodeInfo={showEpisodeInfo}
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">{mediaItem.title || mediaItem.name}</h3>
                    {!selectMode && showDeleteButton && onDelete && mediaItem.docId && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(mediaItem.docId!)}
                        className="text-white/70 hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <div className="flex items-center text-sm text-white/70 mb-2">
                    <span>
                      {mediaItem.media_type === 'movie'
                        ? mediaItem.release_date?.substring(0, 4)
                        : mediaItem.first_air_date?.substring(0, 4)}
                    </span>
                  </div>
                  {renderTimestamp(mediaItem)}
                  {showEpisodeInfo && mediaItem.episode_info && (
                    <div className="mt-2">
                      <span className="inline-flex items-center px-2 py-1 bg-accent/90 text-white text-xs font-medium rounded">
                        {mediaItem.episode_info}
                      </span>
                      {mediaItem.episode_title && (
                        <p className="text-white/80 text-xs mt-1">
                          {mediaItem.episode_title}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <motion.div 
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {media.map((mediaItem) => (
            <motion.div 
              key={`${mediaItem.media_type}-${mediaItem.id}`} 
              variants={item}
              className="group relative"
            >
              {selectMode && mediaItem.docId && (
                <div className="absolute top-2 left-2 z-10">
                  <Checkbox 
                    checked={selectedItems.includes(mediaItem.docId)}
                    onCheckedChange={() => handleSelect(mediaItem.docId!)}
                  />
                </div>
              )}
              {!selectMode && showDeleteButton && onDelete && mediaItem.docId && (
                <div className="absolute top-2 right-2 z-10">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(mediaItem.docId!)}
                    className="bg-black/50 hover:bg-black/70 text-white/70 hover:text-red-500 rounded-full"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
              <MediaCard 
                media={{ ...mediaItem, id: mediaItem.media_id }} 
                minimal 
                showEpisodeInfo={showEpisodeInfo}
              />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default MediaGrid;