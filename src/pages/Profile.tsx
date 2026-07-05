import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks';
import { useWatchHistory } from '@/hooks/watch-history';
import { useUserPreferences } from '@/hooks/user-preferences';
import { User, History, Settings, Check, Loader2, Heart, Bookmark, Edit2, LogOut, Camera, Clock, Film, Key, AlertTriangle, Mail } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import MediaGrid from '@/components/MediaGrid';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import AccentColorPicker from '@/components/AccentColorPicker';
import { videoSources } from '@/utils/api';
import Ads from '@/components/Ads';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import ChangePasswordDialog from '@/components/ChangePasswordDialog';
import ChangeEmailDialog from '@/components/ChangeEmailDialog';
import DeleteAccountDialog from '@/components/DeleteAccountDialog';

const Profile = () => {
  const { user, logout, updateProfile } = useAuth();
  const { watchHistory, clearWatchHistory, cleanupWatchHistory, hasMore, isLoading, loadMore, favorites, watchlist } = useWatchHistory();
  const { userPreferences, toggleWatchHistory, toggleAds, updatePreferences, isLoading: preferencesLoading } = useUserPreferences();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('history');
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [photoURL, setPhotoURL] = useState(user?.photoURL || '');
  const [isUpdatingName, setIsUpdatingName] = useState(false);
  const [isUpdatingPhoto, setIsUpdatingPhoto] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingPhoto, setIsEditingPhoto] = useState(false);
  const [nameError, setNameError] = useState('');
  const [photoError, setPhotoError] = useState('');
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showChangeEmail, setShowChangeEmail] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const loader = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/');
    }
  }, [user, navigate]);

  useEffect(() => {
    setDisplayName(user?.displayName || '');
    setPhotoURL(user?.photoURL || '');
  }, [user]);

  useEffect(() => {
    const currentLoader = loader.current;
    const currentObserver = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (target.isIntersecting && hasMore && !isLoadingMore && activeTab === 'history') {
          handleLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (currentLoader) {
      currentObserver.observe(currentLoader);
    }

    return () => {
      if (currentLoader) {
        currentObserver.unobserve(currentLoader);
      }
    };
  }, [hasMore, isLoadingMore, activeTab]);

  const handleLoadMore = useCallback(async () => {
    setIsLoadingMore(true);
    await loadMore();
    setIsLoadingMore(false);
  }, [loadMore]);

  const validateDisplayName = (name: string) => {
    if (name.trim().length < 3) {
      return 'Username must be at least 3 characters';
    }
    if (name.length > 20) {
      return 'Username cannot exceed 20 characters';
    }
    if (!/^[a-zA-Z0-9_]+$/.test(name)) {
      return 'Username can only contain letters, numbers, and underscores';
    }
    return '';
  };

  const validatePhotoURL = (url: string) => {
    if (url && !/^https?:\/\/.*\.(?:png|jpg|jpeg|gif|svg|webp)$/i.test(url)) {
      return 'Please provide a valid image URL';
    }
    return '';
  };

  const handleDisplayNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setDisplayName(newName);
    setNameError(validateDisplayName(newName));
  };

  const handlePhotoURLChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newURL = e.target.value;
    setPhotoURL(newURL);
    setPhotoError(validatePhotoURL(newURL));
  };

  const handleUpdateDisplayName = async () => {
    if (!user) return;

    const error = validateDisplayName(displayName);
    if (error) {
      toast({
        title: 'Invalid username',
        description: error,
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsUpdatingName(true);
      await updateProfile({ displayName });
      setIsEditingName(false);
      toast({
        title: 'Username updated',
        description: 'Your username has been successfully updated.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update username',
        variant: 'destructive',
      });
    } finally {
      setIsUpdatingName(false);
    }
  };

  const handleUpdatePhotoURL = async () => {
    if (!user) return;

    const error = validatePhotoURL(photoURL);
    if (error) {
      toast({
        title: 'Invalid photo URL',
        description: error,
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsUpdatingPhoto(true);
      await updateProfile({ photoURL });
      setIsEditingPhoto(false);
      toast({
        title: 'Profile picture updated',
        description: 'Your profile picture has been successfully updated.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update profile picture',
        variant: 'destructive',
      });
    } finally {
      setIsUpdatingPhoto(false);
    }
  };

  const handleClearHistory = () => {
    clearWatchHistory();
    toast({
      title: 'Watch history cleared',
      description: 'Your watch history has been successfully cleared.',
    });
  };

  const handleCleanupHistory = async () => {
    try {
      const result = await cleanupWatchHistory();
      toast({
        title: 'Duplicates removed',
        description: `Removed ${result.removedDuplicates} duplicate entr${result.removedDuplicates === 1 ? 'y' : 'ies'}.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to cleanup watch history.',
        variant: 'destructive',
      });
    }
  };

  const handleSignOut = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to sign out. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
      </div>
    );
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const watchHistoryMedia = watchHistory.map(item => ({
    id: item.media_id,
    media_id: item.media_id,
    title: item.title,
    name: item.title,
    poster_path: item.poster_path,
    backdrop_path: item.backdrop_path,
    overview: item.overview || '',
    vote_average: item.rating || 0,
    media_type: item.media_type,
    genre_ids: [],
    watch_position: item.watch_position,
    duration: item.duration,
    created_at: item.created_at,
  }));

  const favoritesMedia = favorites.map(item => ({
    id: item.media_id,
    media_id: item.media_id,
    title: item.title,
    name: item.title,
    poster_path: item.poster_path,
    backdrop_path: item.backdrop_path,
    overview: item.overview || '',
    vote_average: item.rating || 0,
    media_type: item.media_type,
    genre_ids: [],
    added_at: item.added_at,
  }));

  const watchlistMedia = watchlist.map(item => ({
    id: item.media_id,
    media_id: item.media_id,
    title: item.title,
    name: item.title,
    poster_path: item.poster_path,
    backdrop_path: item.backdrop_path,
    overview: item.overview || '',
    vote_average: item.rating || 0,
    media_type: item.media_type,
    genre_ids: [],
    added_at: item.added_at,
  }));

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <Navbar />
      
      {/* Profile Header */}
      <div className="pt-20 pb-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-card rounded-xl border shadow-sm overflow-hidden"
          >
            {/* Header Background Accent */}
            <div className="h-16 bg-gradient-to-r from-accent/20 to-accent/5" />
            
            <div className="px-4 sm:px-6 pb-6">
              {/* Avatar - Positioned to overlap header */}
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 -mt-8">
                <div className="relative self-start">
                  <Avatar className="h-20 w-20 border-4 border-background">
                    <AvatarImage src={user.photoURL || ''} alt={user.displayName || 'Profile'} />
                    <AvatarFallback className="bg-accent/10 text-accent text-lg font-medium">
                      {user.displayName ? getInitials(user.displayName) : <User className="h-6 w-6" />}
                    </AvatarFallback>
                  </Avatar>
                  <button
                    onClick={() => setIsEditingPhoto(!isEditingPhoto)}
                    className="absolute -bottom-1 -right-1 bg-accent hover:bg-accent/90 text-white rounded-full p-1.5 shadow-sm transition-colors"
                  >
                    <Camera className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* User Info */}
                <div className="flex-1 pt-0 sm:pt-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      {isEditingName ? (
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                          <Input
                            value={displayName}
                            onChange={handleDisplayNameChange}
                            className="w-full sm:w-48 h-8 text-sm"
                            placeholder="Username"
                            autoFocus
                          />
                          <div className="flex items-center gap-2">
                            <Button 
                              size="sm" 
                              onClick={handleUpdateDisplayName}
                              disabled={isUpdatingName || !!nameError}
                              className="h-8 px-2"
                            >
                              {isUpdatingName ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Check className="h-3.5 w-3.5" />
                              )}
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => {
                                setIsEditingName(false);
                                setDisplayName(user.displayName || '');
                                setNameError('');
                              }}
                              className="h-8 px-2"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <h1 className="text-xl sm:text-2xl font-semibold break-all">{user.displayName}</h1>
                          <button
                            onClick={() => setIsEditingName(true)}
                            className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                      {nameError && <p className="text-xs text-destructive">{nameError}</p>}
                      
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                        <span className="text-sm text-muted-foreground break-all">{user.email}</span>
                        <Badge variant="outline" className="text-xs w-fit">
                          Member
                        </Badge>
                      </div>
                    </div>

                    <Button variant="outline" size="sm" onClick={handleSignOut} className="sm:self-start w-full sm:w-auto">
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </Button>
                  </div>

                  {/* Quick Stats */}
                  <div className="flex flex-wrap items-center gap-4 sm:gap-6 mt-4">
                    <div className="flex items-center gap-2">
                      <History className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm whitespace-nowrap">
                        <span className="font-medium">{watchHistory.length}</span>
                        <span className="text-muted-foreground ml-1 hidden sm:inline">watched</span>
                        <span className="text-muted-foreground ml-1 sm:hidden">w</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Heart className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm whitespace-nowrap">
                        <span className="font-medium">{favorites.length}</span>
                        <span className="text-muted-foreground ml-1 hidden sm:inline">favorites</span>
                        <span className="text-muted-foreground ml-1 sm:hidden">fav</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Bookmark className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm whitespace-nowrap">
                        <span className="font-medium">{watchlist.length}</span>
                        <span className="text-muted-foreground ml-1 hidden sm:inline">saved</span>
                        <span className="text-muted-foreground ml-1 sm:hidden">save</span>
                      </span>
                    </div>
                  </div>

                  {/* Photo URL Input - Collapsible */}
                  {isEditingPhoto && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4 max-w-full sm:max-w-md"
                    >
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                        <Input
                          value={photoURL}
                          onChange={handlePhotoURLChange}
                          placeholder="Enter image URL"
                          className="w-full h-8 text-sm"
                        />
                        <Button 
                          size="sm" 
                          onClick={handleUpdatePhotoURL}
                          disabled={isUpdatingPhoto || !!photoError}
                          className="h-8 w-full sm:w-auto"
                        >
                          {isUpdatingPhoto ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            'Update'
                          )}
                        </Button>
                      </div>
                      {photoError && <p className="text-xs text-destructive mt-1">{photoError}</p>}
                    </motion.div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Tabs and Content */}
      <div className="px-4 sm:px-6 lg:px-8 pb-12">
        <div className="max-w-7xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            {/* Mobile: 2x2 grid, Desktop: 4 column grid */}
            <div className="w-full mb-6">
              <TabsList className="grid grid-cols-2 sm:grid-cols-4 w-full bg-card border p-1 h-auto">
                <TabsTrigger 
                  value="history" 
                  className="gap-2 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground px-2 sm:px-4 py-2"
                >
                  <History className="h-4 w-4" />
                  <span>History</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="favorites" 
                  className="gap-2 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground px-2 sm:px-4 py-2"
                >
                  <Heart className="h-4 w-4" />
                  <span>Favorites</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="watchlist" 
                  className="gap-2 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground px-2 sm:px-4 py-2"
                >
                  <Bookmark className="h-4 w-4" />
                  <span>Watchlist</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="preferences" 
                  className="gap-2 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground px-2 sm:px-4 py-2"
                >
                  <Settings className="h-4 w-4" />
                  <span>Preferences</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="history">
              <div className="bg-card rounded-xl border shadow-sm p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div>
                    <h2 className="text-lg font-medium">Watch History</h2>
                    <p className="text-sm text-muted-foreground">
                      {watchHistory.length} {watchHistory.length === 1 ? 'item' : 'items'}
                    </p>
                  </div>
                  {watchHistory.length > 0 && (
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button variant="outline" size="sm" onClick={handleCleanupHistory} className="w-full sm:w-auto">
                        Remove Duplicates
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleClearHistory} className="w-full sm:w-auto">
                        Clear All
                      </Button>
                    </div>
                  )}
                </div>
                
                {watchHistory.length > 0 ? (
                  <>
                    <MediaGrid media={watchHistoryMedia} listView />
                    {(hasMore || isLoadingMore) && (
                      <div ref={loader} className="flex justify-center py-6">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      </div>
                    )}
                  </>
                ) : (
                  <div className="py-12 sm:py-16 text-center">
                    <div className="inline-flex p-3 rounded-full bg-muted mb-4">
                      <Clock className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="font-medium mb-1">No watch history</h3>
                    <p className="text-sm text-muted-foreground mb-4 max-w-xs mx-auto">
                      Start watching movies and shows to build your history.
                    </p>
                    <Button onClick={() => navigate('/')} size="sm" className="w-full sm:w-auto">
                      <Film className="h-4 w-4 mr-2" />
                      Browse Content
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="favorites">
              <div className="bg-card rounded-xl border shadow-sm p-4 sm:p-6">
                <div className="mb-4">
                  <h2 className="text-lg font-medium">Favorites</h2>
                  <p className="text-sm text-muted-foreground">
                    {favorites.length} {favorites.length === 1 ? 'favorite' : 'favorites'}
                    </p>
                </div>
                
                {favoritesMedia.length > 0 ? (
                  <MediaGrid media={favoritesMedia} listView />
                ) : (
                  <div className="py-12 sm:py-16 text-center">
                    <div className="inline-flex p-3 rounded-full bg-muted mb-4">
                      <Heart className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="font-medium mb-1">No favorites yet</h3>
                    <p className="text-sm text-muted-foreground mb-4 max-w-xs mx-auto">
                      Save your favorite movies and shows to find them quickly.
                    </p>
                    <Button onClick={() => navigate('/')} size="sm" className="w-full sm:w-auto">
                      <Film className="h-4 w-4 mr-2" />
                      Browse Content
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="watchlist">
              <div className="bg-card rounded-xl border shadow-sm p-4 sm:p-6">
                <div className="mb-4">
                  <h2 className="text-lg font-medium">Watchlist</h2>
                  <p className="text-sm text-muted-foreground">
                    {watchlist.length} {watchlist.length === 1 ? 'item' : 'items'}
                  </p>
                </div>
                
                {watchlistMedia.length > 0 ? (
                  <MediaGrid media={watchlistMedia} listView />
                ) : (
                  <div className="py-12 sm:py-16 text-center">
                    <div className="inline-flex p-3 rounded-full bg-muted mb-4">
                      <Bookmark className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="font-medium mb-1">No watchlist items</h3>
                    <p className="text-sm text-muted-foreground mb-4 max-w-xs mx-auto">
                      Add content to your watchlist to watch later.
                    </p>
                    <Button onClick={() => navigate('/')} size="sm" className="w-full sm:w-auto">
                      <Film className="h-4 w-4 mr-2" />
                      Browse Content
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="preferences">
              <div className="bg-card rounded-xl border shadow-sm p-4 sm:p-6">
                <h2 className="text-lg font-medium mb-4">Preferences</h2>
                
                <div className="space-y-6">
                  {/* Watch History Toggle */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <div className="font-medium">Watch History</div>
                      <div className="text-sm text-muted-foreground">
                        {userPreferences?.isWatchHistoryEnabled
                          ? 'Recording your watch history'
                          : 'Not recording your watch history'}
                      </div>
                    </div>
                    <Switch
                      checked={userPreferences?.isWatchHistoryEnabled}
                      onCheckedChange={toggleWatchHistory}
                      disabled={preferencesLoading}
                      className="self-start sm:self-center"
                    />
                  </div>

                  <Separator />

                  {/* Accent Color */}
                  <div className="space-y-3">
                    <div className="font-medium">Accent Color</div>
                    <div className="w-full">
                      <AccentColorPicker />
                    </div>
                  </div>

                  <Separator />

                  {/* Preferred Video Source */}
                  <div className="space-y-3">
                    <div>
                      <div className="font-medium">Preferred Video Source</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        Default source for movies and TV shows
                      </div>
                    </div>
                    <Select
                      value={userPreferences?.preferred_source || ''}
                      onValueChange={(value) => updatePreferences({ preferred_source: value })}
                      disabled={preferencesLoading}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select source" />
                      </SelectTrigger>
                      <SelectContent>
                        {videoSources.map(source => (
                          <SelectItem key={source.key} value={source.key}>
                            {source.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  {/* Account Security Section */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-base">Account Security</h3>
                    
                    {/* Email Section - Show current email */}
                    <div className="p-3 bg-muted/50 rounded-md">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Current Email</p>
                            <p className="text-sm font-medium break-all">{user.email}</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowChangeEmail(true)}
                          className="h-8"
                        >
                          Change
                        </Button>
                      </div>
                    </div>
                    
                    {/* Change Password Button */}
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-2"
                      onClick={() => setShowChangePassword(true)}
                    >
                      <Key className="h-4 w-4" />
                      Change Password
                    </Button>

                    {/* Delete Account Button */}
                    <Button
                      variant="destructive"
                      className="w-full justify-start gap-2"
                      onClick={() => setShowDeleteAccount(true)}
                    >
                      <AlertTriangle className="h-4 w-4" />
                      Delete Account
                    </Button>

                    <p className="text-xs text-muted-foreground mt-2">
                      For security reasons, you'll need to confirm your password for these actions.
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Dialogs */}
      <ChangePasswordDialog 
        open={showChangePassword} 
        onOpenChange={setShowChangePassword} 
      />

      <ChangeEmailDialog 
        open={showChangeEmail} 
        onOpenChange={setShowChangeEmail} 
        currentEmail={user.email}
      />

      <DeleteAccountDialog 
        open={showDeleteAccount} 
        onOpenChange={setShowDeleteAccount} 
      />

      <Footer />
      {userPreferences?.adsEnabled && <Ads />}
    </div>
  );
};

export default Profile;