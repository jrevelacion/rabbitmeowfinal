 import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { AuthProvider } from "@/hooks";
import { WatchHistoryProvider } from "@/contexts/watch-history";
import { UserPreferencesProvider } from "@/contexts/types/user-preferences"; // Updated import
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./src/pages/Index";
import Movies from "./src/pages/Movies";
import TVShows from "./src/pages/TVShows";
import Trending from "./src/pages/Trending";
import MovieDetails from "./src/pages/MovieDetails";
import TVDetails from "./src/pages/TVDetails";
import Player from "./src/pages/Player";
import Search from "./src/pages/Search";
import Profile from "./src/pages/Profile";
import WatchHistory from "./src/pages/WatchHistory";
import NotFound from "./src/pages/NotFound";
import Login from "./src/pages/Login";
import Signup from "./src/pages/Signup";
import TermsOfService from "./src/pages/TermsOfService";
import PrivacyPolicy from "./src/pages/PrivacyPolicy";
import DMCANotice from "./src/pages/DMCANotice";
import ContentRemoval from "./src/pages/ContentRemoval";
import Sports from "./src/pages/Sports";
import SportMatchPlayer from "./src/pages/SportMatchPlayer";
import { useEffect } from "react";
import ChristmasGreeting from "./components/ChristmasGreeting";

const queryClient = new QueryClient();

const GA_MEASUREMENT_ID = import.meta.env.VITE_FIREBASE_MEASUREMENT_ID;

const usePageTracking = () => {
  const location = useLocation();

  useEffect(() => {
    if (!window.gtag) return;
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_path: location.pathname + location.search,
    });
  }, [location]);
};

const AnimatedRoutes = () => {
  const location = useLocation();
  usePageTracking();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Index />} />
        <Route path="/movies" element={<Movies />} />
        <Route path="/movie" element={<Navigate to="/movies" replace />} />
        <Route path="/tv" element={<TVShows />} />
        <Route path="/trending" element={<Trending />} />
        <Route path="/sports" element={<Sports />} />
        <Route path="/sports/player/:matchId" element={<SportMatchPlayer />} />
        <Route path="/movie/:id" element={<MovieDetails />} />
        <Route path="/tv/:id" element={<TVDetails />} />
        <Route path="/player/movie/:id" element={
          <ProtectedRoute>
            <Player />
          </ProtectedRoute>
        } />
        <Route path="/player/tv/:id/:season/:episode" element={
          <ProtectedRoute>
            <Player />
          </ProtectedRoute>
        } />
        <Route path="/search" element={<Search />} />
        <Route path="/profile" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />
        <Route path="/watch-history" element={
          <ProtectedRoute>
            <WatchHistory />
          </ProtectedRoute>
        } />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/dmca" element={<DMCANotice />} />
        <Route path="/content-removal" element={<ContentRemoval />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <UserPreferencesProvider>
          <WatchHistoryProvider>
            <Toaster />
            <Sonner />
            <Router>
              <ChristmasGreeting />
              <AnimatedRoutes />
            </Router>
          </WatchHistoryProvider>
        </UserPreferencesProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
