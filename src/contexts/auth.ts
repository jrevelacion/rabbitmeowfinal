import { createContext } from 'react';
import { User } from '@/lib/firebase-auth';

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (identifier: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  checkUsername?: (username: string) => Promise<{ available: boolean; message: string }>;
  updateUsername?: (displayName: string) => Promise<User>;
  updateProfile?: (updates: { displayName?: string; photoURL?: string }) => Promise<User>;
  setUser?: (user: User | null) => void; // Add this line
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);