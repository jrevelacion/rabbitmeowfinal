 import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { AuthProvider } from "@/hooks/auth-context";
import { WatchHistoryProvider } from "@/contexts/watch-history";
import { UserPreferencesProvider } from "@/contexts/types/user-preferences"; // Updated import
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Movies from "./pages/Movies";
import TVShows from "./pages/TVShows";
import Trending from "./pages/Trending";
import MovieDetails from "./pages/MovieDetails";
import TVDetails from "./pages/TVDetailsPage";
import Player from "./pages/Player";
import Search from "./pages/Search";
import Profile from "./pages/Profile";
import WatchHistory from "./pages/WatchHistory";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import DMCANotice from "./pages/DMCANotice";
import ContentRemoval from "./pages/ContentRemoval";
import Sports from "./pages/Sports";
import SportMatchPlayer from "./pages/SportsMatchPlayer";
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
        <Route path="/movie" element={<Movies />} />
        <Route path="/movies" element={<Navigate to="/movie" replace />} />
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
