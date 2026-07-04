
import React, { useState, useEffect } from 'react';
import { getReviews } from '@/utils/api';
import { Review } from '@/utils/types';
import { Star, ThumbsUp, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useIsMobile } from '@/hooks/use-mobile';

interface ReviewSectionProps {
  mediaId: number;
  mediaType: 'movie' | 'tv';
}

const ReviewSection = ({ mediaId, mediaType }: ReviewSectionProps) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [visibleReviews, setVisibleReviews] = useState(3);
  const isMobile = useIsMobile();
  
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setIsLoading(true);
        const reviewsData = await getReviews(mediaId, mediaType);
        setReviews(reviewsData);
      } catch (error) {
        console.error('Error fetching reviews:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchReviews();
  }, [mediaId, mediaType]);
  
  const loadMoreReviews = () => {
    setVisibleReviews(prev => prev + 3);
  };
  
  const showLessReviews = () => {
    setVisibleReviews(3);
  };
  
  // Format date to readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="glass p-4 rounded-lg animate-pulse">
            <div className="flex items-center gap-3 mb-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ))}
      </div>
    );
  }
  
  if (reviews.length === 0) {
    return (
      <div className="glass p-6 rounded-lg text-center text-white/70">
        <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-50" />
        <h3 className="text-lg font-medium mb-2">No Reviews Yet</h3>
        <p>There are no reviews available for this title.</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {reviews.slice(0, visibleReviews).map(review => (
        <div key={review.id} className="glass p-4 rounded-lg">
          <div className="flex items-start gap-3 mb-3">
            <Avatar className="h-10 w-10 border border-white/10">
              {review.author_details.avatar_path ? (
                <AvatarImage 
                  src={review.author_details.avatar_path.startsWith('/http') 
                    ? review.author_details.avatar_path.substring(1) 
                    : `https://image.tmdb.org/t/p/w185${review.author_details.avatar_path}`} 
                  alt={review.author}
                />
              ) : null}
              <AvatarFallback className="bg-accent/20 text-accent">
                {getInitials(review.author)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="flex flex-wrap justify-between items-center">
                <h4 className="font-medium text-white">{review.author}</h4>
                {review.author_details.rating && (
                  <div className="flex items-center text-amber-400 text-sm">
                    <Star className="h-4 w-4 mr-1 fill-amber-400" />
                    {review.author_details.rating.toFixed(1)}/10
                  </div>
                )}
              </div>
              
              <p className="text-white/60 text-sm">{formatDate(review.created_at)}</p>
            </div>
          </div>
          
          <div className="text-white/80 text-sm">
            <div className={review.content.length > 300 && !isMobile ? "line-clamp-4" : ""}>
              {review.content}
            </div>
            
            {review.content.length > 300 && !isMobile && (
              <a 
                href={review.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-accent hover:underline mt-2 inline-block"
              >
                Read full review
              </a>
            )}
          </div>
        </div>
      ))}
      
      {reviews.length > 3 && (
        <div className="flex justify-center">
          {visibleReviews < reviews.length ? (
            <Button 
              variant="outline" 
              onClick={loadMoreReviews}
              className="border-white/20 bg-black/50 text-white hover:bg-black/70"
            >
              Load More <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button 
              variant="outline" 
              onClick={showLessReviews}
              className="border-white/20 bg-black/50 text-white hover:bg-black/70"
            >
              Show Less <ChevronUp className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default ReviewSection;
