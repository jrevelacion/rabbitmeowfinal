import { useEffect, useState } from 'react';
import { firebaseAuthService, User } from '@/lib/firebase-auth';
import { useToast } from '@/components/ui/use-toast';
import { AuthContext, AuthContextType } from '@/contexts/auth';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Listen to auth state changes
    const unsubscribe = firebaseAuthService.onAuthStateChanged((authUser) => {
      setUser(authUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAuthError = (error: Error) => {
    toast({
      title: "Authentication Error",
      description: error.message,
      variant: "destructive",
    });
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { user } = await firebaseAuthService.signIn(email, password);
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
      const { user } = await firebaseAuthService.signUp(email, password, displayName);
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
    // For now, always return available as Firebase doesn't have a built-in username check
    return { available: true, message: "Username is available" };
  };

  const updateUsername = async (displayName: string) => {
    try {
      const updatedUser = await firebaseAuthService.updateDisplayName(displayName);
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
      const updatedUser = await firebaseAuthService.updateProfile(updates);
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
      await firebaseAuthService.signOut();
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
