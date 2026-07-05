import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Home, Film, Tv, TrendingUp, Menu, X, Keyboard, ArrowRight, History, UserCircle, LogIn, UserPlus, Volleyball } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/hooks';
import { searchMedia } from '@/utils/api';
import { Media } from '@/utils/types';

const Logo = '/logo.png';

interface NavItem {
  title: string;
  path: string;
  icon: React.ReactNode;
  external?: boolean;
}

const Navbar = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showKeyboardHint, setShowKeyboardHint] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [searchSuggestions, setSearchSuggestions] = useState<Media[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const mobileFormRef = useRef<HTMLFormElement>(null);
  const clickTimerRef = useRef<NodeJS.Timeout | null>(null);

  const navItems: NavItem[] = [
    { title: 'Home', path: '/', icon: <Home className="h-5 w-5 mr-2" /> },
    { title: 'Movies', path: '/movies', icon: <Film className="h-5 w-5 mr-2" /> },
    { title: 'TV Shows', path: '/tv', icon: <Tv className="h-5 w-7 mr-2" /> },
    { title: 'Sports', path: '/sports', icon: <Volleyball className="h-5 w-5 mr-2" /> },
    { title: 'Trending', path: '/trending', icon: <TrendingUp className="h-5 w-5 mr-2" /> },
    { title: 'Watch History', path: '/watch-history', icon: <History className="h-5 w-5 mr-2" /> },
  ];

  const authItems: NavItem[] = user ? [
    { title: 'Profile', path: '/profile', icon: <UserCircle className="h-4 w-4 mr-2" /> },
  ] : [
    { title: 'Login', path: '/login', icon: <LogIn className="h-4 w-4 mr-2" /> },
    { title: 'Sign Up', path: '/signup', icon: <UserPlus className="h-4 w-4 mr-2" /> },
  ];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const hasSeenHint = localStorage.getItem('hasSeenKeyboardHint');
    if (!hasSeenHint) {
      setTimeout(() => {
        setShowKeyboardHint(true);
        localStorage.setItem('hasSeenKeyboardHint', 'true');
      }, 5000);
    }
  }, []);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target as Node)
      ) {
        if (searchInputRef.current && !searchInputRef.current.contains(event.target as Node)) {
          setShowSuggestions(false);
        }
      }
    };
    
    const handleDocumentClick = (event: MouseEvent | TouchEvent) => {
      if (clickTimerRef.current) {
        clearTimeout(clickTimerRef.current);
      }
      
      clickTimerRef.current = setTimeout(() => {
        handleClickOutside(event);
      }, 100);
    };
    
    document.addEventListener('mousedown', handleDocumentClick);
    document.addEventListener('touchstart', handleDocumentClick);
    
    return () => {
      document.removeEventListener('mousedown', handleDocumentClick);
      document.removeEventListener('touchstart', handleDocumentClick);
      if (clickTimerRef.current) {
        clearTimeout(clickTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchQuery.trim().length > 0) {
        try {
          const results = await searchMedia(searchQuery);
          setSearchSuggestions(results.slice(0, 6));
          setShowSuggestions(true);
        } catch (error) {
          console.error('Error fetching suggestions:', error);
        }
      } else {
        setSearchSuggestions([]);
        setShowSuggestions(false);
      }
    };
    const debounceTimer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setShowSuggestions(false);
      setIsMobileMenuOpen(false);
      toast({
        title: "Searching...",
        description: `Finding results for "${searchQuery.trim()}"`,
        duration: 2000,
      });
    }
  };

  const handleSuggestionClick = (item: Media) => {
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
    }
    
    const path = `/${item.media_type}/${item.id}`;
    navigate(path);
    setSearchQuery('');
    setShowSuggestions(false);
    setIsMobileMenuOpen(false);
    
    toast({
      title: "Redirecting...",
      description: `Opening ${item.media_type === 'movie' ? 'movie' : 'TV show'}`,
      duration: 2000,
    });
  };

  const showKeyboardShortcutToast = () => {
    toast({
      title: "Keyboard Shortcut",
      description: "Press / to quickly focus the search bar from anywhere",
      duration: 5000,
    });
    setShowKeyboardHint(false);
  };

  const getPosterUrl = (item: Media) => {
    const baseUrl = "https://image.tmdb.org/t/p";
    const posterSize = "w92";
    
    if (item.poster_path) {
      return `${baseUrl}/${posterSize}${item.poster_path}`;
    }
    
    return "https://via.placeholder.com/92x138/1a1a1a/666666?text=No+Image";
  };

  const DesktopSuggestionItem = ({ item }: { item: Media }) => (
    <div
      className="flex items-center px-3 py-2 hover:bg-white/10 cursor-pointer text-white/90 text-sm transition-colors"
      onClick={() => handleSuggestionClick(item)}
    >
      <div className="w-10 h-14 flex-shrink-0 mr-3">
        <img
          src={getPosterUrl(item)}
          alt={item.title || item.name}
          className="w-full h-full object-cover rounded"
          loading="lazy"
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center">
          <span className="mr-2">
            {item.media_type === 'movie' ? <Film className="h-3 w-3" /> : <Tv className="h-3 w-3" />}
          </span>
          <span className="truncate font-medium">{item.title || item.name}</span>
        </div>
        <div className="text-xs text-white/60 mt-1 truncate">
          {item.media_type === 'movie' ? 'Movie' : 'TV Show'} • {item.release_date?.split('-')[0] || item.first_air_date?.split('-')[0] || 'N/A'}
        </div>
      </div>
    </div>
  );

  const MobileSuggestionItem = ({ item }: { item: Media }) => {
    const handleClick = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      handleSuggestionClick(item);
    };

    const handleTouch = (e: React.TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();
      handleSuggestionClick(item);
    };

    return (
      <div
        className="flex items-center px-3 py-3 hover:bg-white/10 active:bg-white/20 cursor-pointer text-white/90 text-sm transition-colors"
        onClick={handleClick}
        onTouchEnd={handleTouch}
      >
        <div className="w-12 h-16 flex-shrink-0 mr-3">
          <img
            src={getPosterUrl(item)}
            alt={item.title || item.name}
            className="w-full h-full object-cover rounded"
            loading="lazy"
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center">
            <span className="mr-2">
              {item.media_type === 'movie' ? <Film className="h-4 w-4" /> : <Tv className="h-4 w-4" />}
            </span>
            <span className="truncate font-medium text-base">{item.title || item.name}</span>
          </div>
          <div className="text-xs text-white/60 mt-1 truncate">
            {item.media_type === 'movie' ? 'Movie' : 'TV Show'} • {item.release_date?.split('-')[0] || item.first_air_date?.split('-')[0] || 'N/A'}
          </div>
        </div>
      </div>
    );
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-transparent">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between">
          
          {/* Group container grouping Logo and Desktop menus together */}
          <div className="flex items-center">
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => (
                item.external ? (
                  <a
                    key={item.path}
                    href={item.path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 rounded-md flex items-center text-sm font-medium transition-all duration-200 text-white/80 hover:text-white hover:bg-white/10 hover:scale-105"
                  >
                    {item.icon}
                    {item.title}
                  </a>
                ) : (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`px-3 py-2 rounded-md flex items-center text-sm font-medium transition-all duration-200 ${
                      location.pathname === item.path
                        ? 'text-accent bg-white/10'
                        : 'text-white/80 hover:text-white hover:bg-white/10 hover:scale-105'
                    }`}
                  >
                    {item.icon}
                    {item.title}
                  </Link>
                )
              ))}

              {authItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3 py-2 rounded-md flex items-center text-sm font-medium transition-all duration-200 ${
                    location.pathname === item.path
                      ? 'text-accent bg-white/10'
                      : 'text-white/80 hover:text-white hover:bg-white/10 hover:scale-105'
                  }`}
                >
                  {item.icon}
                  {item.title}
                </Link>
              ))}
            </nav>

            {/* Logo beside menu */}
            <Link
              to="/"
              className="hidden md:flex items-center transition-transform hover:scale-110 ml-2"
            >
              <img
                src={Logo}
                alt="RabbitMeow Logo"
                className="h-12 w-auto"
              />
            </Link>
          </div>

          {/* Mobile Search Bar */}
          <div className="flex-1 mx-4 md:hidden relative">
            <form onSubmit={handleSearch}>
              <div className="relative flex items-center">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60" />
                <Input
                  type="search"
                  placeholder="Search..."
                  className="w-full bg-white/10 border-white/10 pl-9 text-white placeholder:text-white/50 focus:bg-white/15 h-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => searchQuery.trim().length > 0 && setShowSuggestions(true)}
                  ref={searchInputRef}
                />
              </div>
            </form>
            
            {showSuggestions && searchSuggestions.length > 0 && (
              <div 
                ref={suggestionsRef}
                className="absolute top-full left-0 right-0 mt-1 bg-black/95 backdrop-blur-lg border border-white/10 rounded-md shadow-xl z-50"
                style={{ 
                  touchAction: 'manipulation',
                  pointerEvents: 'auto'
                }}
              >
                <div className="max-h-80 overflow-y-auto">
                  {searchSuggestions.map((item) => (
                    <MobileSuggestionItem key={`${item.media_type}-${item.id}`} item={item} />
                  ))}
                  <div className="border-t border-white/10">
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleSearch(e);
                      }}
                      onTouchEnd={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleSearch(e);
                      }}
                      className="w-full px-4 py-3 text-left text-accent hover:bg-white/10 active:bg-white/20 flex items-center justify-between text-sm"
                    >
                      <span className="font-medium">View all results for "{searchQuery}"</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Desktop Search */}
          <div className="hidden md:flex items-center relative ml-4">
            <form onSubmit={handleSearch}>
              <div className="relative group">
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60" />
                  <Input
                    type="search"
                    placeholder="Search... (Press /)"
                    className="w-[180px] lg:w-[220px] bg-white/10 border-white/10 pl-9 text-white placeholder:text-white/50 focus:bg-white/15"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => searchQuery.trim().length > 0 && setShowSuggestions(true)}
                    ref={searchInputRef}
                  />
                </div>
                
                {showSuggestions && searchSuggestions.length > 0 && (
                  <div 
                    ref={suggestionsRef}
                    className="absolute top-full right-0 mt-1 w-[350px] bg-black/95 backdrop-blur-lg border border-white/10 rounded-md shadow-lg z-50"
                  >
                    <div className="max-h-96 overflow-y-auto">
                      <div className="p-2">
                        {searchSuggestions.map((item) => (
                          <DesktopSuggestionItem key={`${item.media_type}-${item.id}`} item={item} />
                        ))}
                      </div>
                      <div className="border-t border-white/10 p-2">
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            handleSearch(e);
                          }}
                          className="w-full px-3 py-2 text-left text-accent hover:bg-white/10 rounded flex items-center justify-between text-sm"
                        >
                          <span>View all results for "{searchQuery}"</span>
                          <ArrowRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                
                {showKeyboardHint && (
                  <div className="absolute right-0 top-full mt-2 bg-black/90 border border-white/10 p-2 rounded text-xs text-white animate-fade-in z-50 cursor-pointer hover:bg-black/80" onClick={showKeyboardShortcutToast}>
                    <div className="flex items-center">
                      <Keyboard className="h-3 w-3 mr-1 text-accent" />
                      Press / for quick search
                    </div>
                  </div>
                )}
              </div>
            </form>
            <Button type="submit" size="sm" variant="ghost" className="ml-2 bg-white/10 hover:bg-white/20 text-white transition-colors" onClick={handleSearch}>
              <ArrowRight className="h-4 w-4" />
              <span className="sr-only">Search</span>
            </Button>
          </div>

          <button 
            className="md:hidden text-white p-2 active:bg-white/10 rounded-lg" 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-black/95 backdrop-blur-lg animate-fade-in border-t border-white/10 mt-2">
            <div className="px-4 py-3 space-y-3">
              {navItems.map((item) => (
                item.external ? (
                  <a
                    key={item.path}
                    href={item.path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block px-3 py-2 rounded-md text-base font-medium flex items-center transition-all duration-200 text-white hover:text-accent hover:bg-white/5 active:bg-white/10"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.icon}
                    {item.title}
                  </a>
                ) : (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`block px-3 py-2 rounded-md text-base font-medium flex items-center transition-all duration-200 ${
                      location.pathname === item.path
                        ? 'text-accent bg-white/10'
                        : 'text-white hover:text-accent hover:bg-white/5 active:bg-white/10'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.icon}
                    {item.title}
                  </Link>
                )
              ))}
              {authItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`block px-3 py-2 rounded-md text-base font-medium flex items-center transition-all duration-200 ${
                    location.pathname === item.path
                      ? 'text-accent bg-white/10'
                      : 'text-white hover:text-accent hover:bg-white/5 active:bg-white/10'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.icon}
                  {item.title}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
