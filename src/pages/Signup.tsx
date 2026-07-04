import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import Navbar from '@/components/Navbar';
import Ads from '@/components/Ads';
import { useUserPreferences } from '@/hooks/user-preferences';
import { authService } from '@/lib/auth';

// Add this to window type
declare global {
  interface Window {
    usernameTimeout?: NodeJS.Timeout;
  }
}

export default function Signup() {
  const { userPreferences } = useUserPreferences();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  // Debounce username check
  const checkUsernameAvailability = async (value: string) => {
    if (value.length < 3) {
      setUsernameError('Username must be at least 3 characters');
      setUsernameAvailable(null);
      return;
    }
    
    if (value.length > 20) {
      setUsernameError('Username cannot exceed 20 characters');
      setUsernameAvailable(null);
      return;
    }
    
    if (!/^[a-zA-Z0-9_]+$/.test(value)) {
      setUsernameError('Username can only contain letters, numbers, and underscores');
      setUsernameAvailable(null);
      return;
    }
    
    setIsCheckingUsername(true);
    try {
      const result = await authService.checkUsername(value);
      if (result.available) {
        setUsernameError('');
        setUsernameAvailable(true);
      } else {
        setUsernameError('Username already taken');
        setUsernameAvailable(false);
      }
    } catch (error) {
      console.error('Error checking username:', error);
      setUsernameError('Error checking username availability');
      setUsernameAvailable(null);
    } finally {
      setIsCheckingUsername(false);
    }
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUsername(value);
    
    // Clear timeout if exists
    if (window.usernameTimeout) {
      clearTimeout(window.usernameTimeout);
    }
    
    // Set new timeout for debounce
    window.usernameTimeout = setTimeout(() => {
      if (value.trim()) {
        checkUsernameAvailability(value);
      } else {
        setUsernameError('');
        setUsernameAvailable(null);
      }
    }, 500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    
    if (!usernameAvailable) {
      alert('Please choose a valid and available username');
      return;
    }
    
    setIsLoading(true);
    try {
      await signUp(email, password, username); // username is used as displayName
      navigate('/');
    } catch (error) {
      // Error is handled in auth context
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Create an account</CardTitle>
          <CardDescription>Enter your details below to create your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="username">
                Username
                {isCheckingUsername && (
                  <span className="ml-2 text-xs text-muted-foreground">Checking...</span>
                )}
                {usernameAvailable === true && (
                  <span className="ml-2 text-xs text-green-600">✓ Available</span>
                )}
                {usernameAvailable === false && (
                  <span className="ml-2 text-xs text-red-600">✗ Taken</span>
                )}
              </Label>
              <Input
                id="username"
                type="text"
                placeholder="Choose a username"
                value={username}
                onChange={handleUsernameChange}
                required
                className={usernameError ? 'border-red-500' : usernameAvailable ? 'border-green-500' : ''}
              />
              {usernameError && (
                <p className="text-xs text-red-500 mt-1">{usernameError}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Username must be 3-20 characters and can only contain letters, numbers, and underscores
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading || !usernameAvailable || isCheckingUsername}
            >
              {isLoading ? 'Creating account...' : 'Create account'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </div>
        </CardFooter>
      </Card>
      <Navbar />
      {userPreferences?.adsEnabled && <Ads />}
    </div>
  );
}
