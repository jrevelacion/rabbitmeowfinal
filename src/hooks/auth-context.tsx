import { useEffect, useState } from 'react';
import { authService, User } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { AuthContext, AuthContextType } from '@/contexts/auth';

export function AuthProvider({ children }: { children: React.Node }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Check for stored user on mount
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('authToken');
    
    if (storedUser && token) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Failed to parse stored user', e);
        localStorage.removeItem('user');
        localStorage.removeItem('authToken');
      }
    }
    setLoading(false);
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
      return { available: false, message: "Error checking username" };
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
    toast({
      title: "Coming Soon",
      description: "Google sign-in is not available yet.",
      variant: "destructive",
    });
    throw new Error("Google sign-in not implemented");
  };

  const logout = async () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    setUser(null);
    toast({
      title: "Signed out",
      description: "You have been signed out successfully.",
    });
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
