import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { authService } from '@/lib/auth';
import { Loader2, Eye, EyeOff, Mail, AlertCircle } from 'lucide-react';
import { Separator } from './ui/separator';

interface ChangeEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentEmail: string;
}

const ChangeEmailDialog = ({ open, onOpenChange, currentEmail }: ChangeEmailDialogProps) => {
  const [password, setPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const { toast } = useToast();

  const validateEmail = (email: string) => {
    if (!email) return 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return 'Please enter a valid email address';
    }
    if (email.toLowerCase() === currentEmail.toLowerCase()) {
      return 'New email must be different from current email';
    }
    return '';
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const email = e.target.value;
    setNewEmail(email);
    setEmailError(validateEmail(email));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate emails match
    if (newEmail !== confirmEmail) {
      toast({
        title: 'Emails do not match',
        description: 'New email and confirmation must match.',
        variant: 'destructive',
      });
      return;
    }

    const emailValidationError = validateEmail(newEmail);
    if (emailValidationError) {
      toast({
        title: 'Invalid email',
        description: emailValidationError,
        variant: 'destructive',
      });
      return;
    }

    if (!password) {
      toast({
        title: 'Password required',
        description: 'Please enter your password to confirm this change.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsLoading(true);
      await authService.changeEmail(password, newEmail);
      
      toast({
        title: 'Email changed',
        description: 'Your email has been successfully updated. Please use your new email for future logins.',
      });
      
      onOpenChange(false);
      setPassword('');
      setNewEmail('');
      setConfirmEmail('');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to change email',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Change Email Address</DialogTitle>
          <DialogDescription>
            Update your email address. You'll need to confirm your password to make this change.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Current Email Display */}
          <div className="space-y-2">
            <Label>Current Email</Label>
            <div className="p-3 bg-muted rounded-md flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{currentEmail}</span>
            </div>
          </div>

          {/* Password Confirmation */}
          <div className="space-y-2">
            <Label htmlFor="password">Confirm Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Separator className="my-2" />

          {/* New Email */}
          <div className="space-y-2">
            <Label htmlFor="new-email">New Email Address</Label>
            <Input
              id="new-email"
              type="email"
              value={newEmail}
              onChange={handleEmailChange}
              placeholder="Enter new email"
              required
            />
            {emailError && (
              <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                <AlertCircle className="h-3 w-3" />
                {emailError}
              </p>
            )}
          </div>

          {/* Confirm New Email */}
          <div className="space-y-2">
            <Label htmlFor="confirm-email">Confirm New Email Address</Label>
            <Input
              id="confirm-email"
              type="email"
              value={confirmEmail}
              onChange={(e) => setConfirmEmail(e.target.value)}
              placeholder="Confirm new email"
              required
            />
            {confirmEmail && newEmail !== confirmEmail && (
              <p className="text-xs text-destructive">Emails do not match</p>
            )}
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              After changing your email, you'll need to use your new email for future logins.
            </AlertDescription>
          </Alert>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || !!emailError || newEmail !== confirmEmail || !password}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Change Email'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ChangeEmailDialog;