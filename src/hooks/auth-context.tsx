import { useEffect, useState } from 'react';
import { User, authService } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { AuthContext, AuthContextType } from '@/contexts/auth';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const initAuth = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setLoading(false);
      }
    };

    // Check if user is stored in localStorage on initial load
    const storedUser = authService.getStoredUser();
    if (storedUser && authService.isAuthenticated()) {
      setUser(storedUser);
      setLoading(false);
      // Verify token is still valid
      initAuth();
    } else {
      setLoading(false);
    }
  }, []);

  const handleAuthError = (error: Error) => {
    toast({
      title: "Authentication Error",
      description: error.message,
      variant: "destructive",
    });
  };

  const signIn = async (identifier: string, password: string) => {
    try {
      const { user } = await authService.signIn(identifier, password);
      setUser(user);
      toast({
        title: "Welcome back!",
        description: `Signed in as ${user.displayName || user.email}`,
      });
    } catch (error) {
      if (error instanceof Error) {
        handleAuthError(error);
      }
      throw error;
    }
  };

  const signUp = async (email: string, password: string, displayName: string) => {
    try {
      const { user } = await authService.signUp(email, password, displayName);
      setUser(user);
      toast({
        title: "Account created",
        description: `Welcome, ${displayName}! Your account has been created successfully.`,
      });
    } catch (error) {
      if (error instanceof Error) {
        handleAuthError(error);
      }
      throw error;
    }
  };

  const checkUsername = async (username: string): Promise<{ available: boolean; message: string }> => {
    try {
      return await authService.checkUsername(username);
    } catch (error) {
      if (error instanceof Error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      }
      throw error;
    }
  };

  const updateUsername = async (displayName: string) => {
    try {
      const updatedUser = await authService.updateDisplayName(displayName);
      setUser(updatedUser);
      toast({
        title: "Username updated",
        description: "Your username has been updated successfully.",
      });
      return updatedUser;
    } catch (error) {
      if (error instanceof Error) {
        handleAuthError(error);
      }
      throw error;
    }
  };

  const updateProfile = async (updates: { displayName?: string; photoURL?: string }) => {
    try {
      const updatedUser = await authService.updateProfile(updates);
      setUser(updatedUser);
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
      return updatedUser;
    } catch (error) {
      if (error instanceof Error) {
        handleAuthError(error);
      }
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      // For now, we'll disable Google sign-in as it requires additional setup
      toast({
        title: "Coming Soon",
        description: "Google sign-in is not available yet.",
        variant: "destructive",
      });
      throw new Error("Google sign-in not implemented");
    } catch (error) {
      if (error instanceof Error) {
        handleAuthError(error);
      }
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.signOut();
      setUser(null);
      toast({
        title: "Signed out",
        description: "You have been signed out successfully.",
      });
    } catch (error) {
      if (error instanceof Error) {
        handleAuthError(error);
      }
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    logout,
    checkUsername,
    updateUsername,
    updateProfile,
    setUser, 
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}