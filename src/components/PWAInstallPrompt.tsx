import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

const PWAInstallPrompt = () => {
  const { toast } = useToast()
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isAppInstalled, setIsAppInstalled] = useState(localStorage.getItem('app-installed') === 'true');

  const handleInstallClick = useCallback(async () => {
    console.log('Install button clicked, deferredPrompt:', deferredPrompt);
    if (!deferredPrompt) {
      console.log('No deferred prompt available');
      return;
    }

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      console.log('User choice:', choiceResult);
      
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
        setIsAppInstalled(true);
        localStorage.setItem('app-installed', 'true');
        toast({
          title: "Installation Started",
          description: "The app installation has started.",
        });
      } else {
        console.log('User dismissed the install prompt');
        toast({
          title: "Installation Cancelled",
          description: "You can install the app later from the menu.",
        });
      }
      setDeferredPrompt(null);
    } catch (error) {
      console.error('Error during installation:', error);
      toast({
        title: "Installation Failed",
        description: "There was an error installing the app. Please try again.",
        variant: "destructive"
      });
    }
  }, [deferredPrompt, toast]);

  const showInstallPrompt = useCallback(() => {
    console.log('Showing install prompt, deferredPrompt:', deferredPrompt);
    if (deferredPrompt && !isAppInstalled) {
      toast({
        title: "Install App?",
        description: "Install this app for offline access and a better experience.",
        action: (
          <Button variant="outline" size="sm" onClick={handleInstallClick}>
            Install
          </Button>
        ),
      });
    }
  }, [deferredPrompt, isAppInstalled, toast, handleInstallClick]);

  useEffect(() => {
    console.log('PWAInstallPrompt mounted, isAppInstalled:', isAppInstalled);
    
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      console.log('beforeinstallprompt event captured:', e);
      e.preventDefault();
      setDeferredPrompt(e);
      if (!isAppInstalled) {
        showInstallPrompt();
      }
    };

    const handleAppInstalled = (e: Event) => {
      console.log('appinstalled event fired', e);
      setIsAppInstalled(true);
      setDeferredPrompt(null);
      localStorage.setItem('app-installed', 'true');
      toast({
        title: "Successfully Installed",
        description: "The app has been installed successfully!",
      });
    };

    if (window.matchMedia('(display-mode: standalone)').matches) {
      console.log('App is already installed and running in standalone mode');
      setIsAppInstalled(true);
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [toast, isAppInstalled, showInstallPrompt]);

  return deferredPrompt && !isAppInstalled ? (
    <div className="fixed bottom-4 right-4 z-50">
      <Button 
        variant="default"
        size="lg"
        onClick={handleInstallClick}
        className="shadow-lg bg-primary text-primary-foreground hover:bg-primary/90"
      >
        Install App
      </Button>
    </div>
  ) : null;
};

export default PWAInstallPrompt;
