import { useContext } from 'react';
import { UserPreferencesContext } from '@/contexts/types/user-preferences.tsx'; // Explicitly use .tsx

export function useUserPreferences() {
  const context = useContext(UserPreferencesContext);
  if (context === undefined) {
    throw new Error('useUserPreferences must be used within a UserPreferencesProvider');
  }
  
  return context;
}