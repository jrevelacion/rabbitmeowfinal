import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Home, Film, Tv, TrendingUp, Menu, X, Keyboard, ArrowRight, History, UserCircle, LogIn, UserPlus, Volleyball } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from '@/hooks/useAuth';
import { searchMedia } from '@/utils/api';
import { Media } from '@/utils/types';

const Logo = '/logo2.png';

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
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-black/80 backdrop-blur-md py-3' : 'bg-transparent py-5'}`}>
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center transition-transform hover:scale-105">
              <img src={Logo} alt="RabbitMeow" className="h-8 md:h-10 w-auto" />
            </Link>

            <nav className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3 py-2 rounded-md flex items-center text-sm font-medium transition-all duration-200 ${
                    location.pathname === item.path
                      ? 'text-accent bg-white/10'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {item.icon}
                  {item.title}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden md:block relative">
              <form onSubmit={handleSearch} className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60" />
                <Input
                  ref={searchInputRef}
                  type="search"
                  placeholder="Search... (Press /)"
                  className="w-[200px] lg:w-[300px] bg-white/10 border-white/10 pl-9 text-white placeholder:text-white/50 focus:bg-white/20 transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => searchQuery.trim().length > 0 && setShowSuggestions(true)}
                />
              </form>

              {showSuggestions && searchSuggestions.length > 0 && (
                <div ref={suggestionsRef} className="absolute top-full left-0 right-0 mt-2 bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
                  <div className="py-2">
                    {searchSuggestions.map((item) => (
                      <DesktopSuggestionItem key={`${item.media_type}-${item.id}`} item={item} />
                    ))}
                  </div>
                  <div className="p-2 border-t border-white/10">
                    <Button variant="ghost" className="w-full justify-between text-xs text-accent hover:text-accent hover:bg-white/5" onClick={handleSearch}>
                      See all results
                      <ArrowRight className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className="hidden md:flex items-center space-x-2 ml-4">
              {authItems.map((item) => (
                <Link key={item.path} to={item.path}>
                  <Button variant={location.pathname === item.path ? "secondary" : "ghost"} size="sm" className="gap-2">
                    {item.icon}
                    {item.title}
                  </Button>
                </Link>
              ))}
            </div>

            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-black/95 backdrop-blur-xl border-b border-white/10 py-6 px-4 space-y-4 animate-in fade-in slide-in-from-top-4">
          <form onSubmit={handleSearch} className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60" />
            <Input
              type="search"
              placeholder="Search movies, TV shows..."
              className="w-full bg-white/10 border-white/10 pl-9 h-12"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>

          <nav className="grid grid-cols-1 gap-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`p-4 rounded-xl flex items-center text-lg font-medium transition-colors ${
                  location.pathname === item.path ? 'bg-white/10 text-accent' : 'text-white/80'
                }`}
              >
                {item.icon}
                <span className="ml-3">{item.title}</span>
              </Link>
            ))}
            <div className="h-px bg-white/10 my-2" />
            {authItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`p-4 rounded-xl flex items-center text-lg font-medium transition-colors ${
                  location.pathname === item.path ? 'bg-white/10 text-accent' : 'text-white/80'
                }`}
              >
                {item.icon}
                <span className="ml-3">{item.title}</span>
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Navbar;
