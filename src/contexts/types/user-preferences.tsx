import { createContext, useState, useMemo, ReactNode, useEffect } from 'react';
import { useAuth } from '@/hooks';

export interface UserPreferences {
  id?: string;
  user_id: string;
  preferred_source?: string;
  subtitle_language?: string;
  audio_language?: string;
  created_at?: string;
  updated_at?: string;
  isWatchHistoryEnabled: boolean;
  accentColor?: string;
  adsEnabled: boolean;
  lastAdsDisabled?: string; // New field for timestamp
}

export interface UserPreferencesContextType {
  userPreferences: UserPreferences | null;
  updatePreferences: (preferences: Partial<UserPreferences>) => Promise<void>;
  isLoading: boolean;
  toggleWatchHistory: () => Promise<void>;
  setAccentColor: (color: string) => Promise<void>;
  toggleAds: () => Promise<void>;
}

export const UserPreferencesContext = createContext<UserPreferencesContextType | undefined>(undefined);

interface UserPreferencesProviderProps {
  children: ReactNode;
}

export const UserPreferencesProvider = ({ children }: UserPreferencesProviderProps) => {
  const { user } = useAuth();
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const storedPreferences = localStorage.getItem('userPreferences');
        const initialPreferences: UserPreferences = storedPreferences
          ? JSON.parse(storedPreferences)
          : {
              user_id: user?.uid || 'default_user',
              isWatchHistoryEnabled: true,
              preferred_source: '',
              subtitle_language: '',
              audio_language: '',
              accentColor: '',
              adsEnabled: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };
        // Check if 24 hours have passed since last disable
        if (initialPreferences.lastAdsDisabled) {
          const lastDisabled = new Date(initialPreferences.lastAdsDisabled);
          const now = new Date();
          const hoursPassed = (now.getTime() - lastDisabled.getTime()) / (1000 * 60 * 60);
          if (hoursPassed >= 24 && !initialPreferences.adsEnabled) {
            initialPreferences.adsEnabled = true;
            delete initialPreferences.lastAdsDisabled; // Reset timestamp
            localStorage.setItem('userPreferences', JSON.stringify(initialPreferences));
          }
        }
        setUserPreferences(initialPreferences);
      } catch (error) {
        console.error('Error fetching preferences:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPreferences();
  }, [user]);

  const updatePreferences = async (updates: Partial<UserPreferences>) => {
    setIsLoading(true);
    try {
      setUserPreferences((prev) => {
        const newPreferences = prev
          ? { ...prev, ...updates, updated_at: new Date().toISOString() }
          : {
              ...updates,
              user_id: user?.uid || 'default_user',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            } as UserPreferences;
        localStorage.setItem('userPreferences', JSON.stringify(newPreferences));
        return newPreferences;
      });
    } catch (error) {
      console.error('Error updating preferences:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const toggleWatchHistory = async () => {
    try {
      await updatePreferences({ isWatchHistoryEnabled: !userPreferences?.isWatchHistoryEnabled });
    } catch (error) {
      console.error('Error toggling watch history:', error);
      throw error;
    }
  };

  const setAccentColor = async (color: string) => {
    try {
      await updatePreferences({ accentColor: color });
    } catch (error) {
      console.error('Error setting accent color:', error);
      throw error;
    }
  };

  const toggleAds = async () => {
    try {
      if (userPreferences?.adsEnabled) {
        const confirmDisable = window.confirm(
          "😔 Are you sure you want to disable ads? Ads help keep this site alive and support our team! 💖 Your support means the world to us 🌍, allowing us to bring you more awesome content. 🙏 Please consider keeping them on to help us thrive! Cancel to keep ads, or OK to disable."
        );
        if (!confirmDisable) return; // Cancel the toggle if user declines
      }
      await updatePreferences({
        adsEnabled: !userPreferences?.adsEnabled,
        lastAdsDisabled: !userPreferences?.adsEnabled ? new Date().toISOString() : undefined,
      });
    } catch (error) {
      console.error('Error toggling ads:', error);
      throw error;
    }
  };

  const contextValue: UserPreferencesContextType = useMemo(
    () => ({
      userPreferences,
      updatePreferences,
      isLoading,
      toggleWatchHistory,
      setAccentColor,
      toggleAds,
    }),
    [userPreferences, isLoading]
  );

  return (
    <UserPreferencesContext.Provider value={contextValue}>
      {children}
    </UserPreferencesContext.Provider>
  );
};
