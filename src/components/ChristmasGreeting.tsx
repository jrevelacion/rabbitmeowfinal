import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Volume2, VolumeX, Play } from 'lucide-react';

const ChristmasGreeting = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const today = new Date();
    // Force show on December 25 only (month 11 = December, day 25)
    const isChristmasDay = today.getMonth() === 11 && today.getDate() === 25;
    
    const dismissedDate = localStorage.getItem('christmas-greeting-dismissed');
    const alreadyDismissed = dismissedDate === today.toDateString();
    
    if (isChristmasDay && !alreadyDismissed) {
      setTimeout(() => setIsVisible(true), 1000);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('christmas-greeting-dismissed', new Date().toDateString());
  };

  const handleVideoClick = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        // User gesture → safe to play with sound
        videoRef.current.muted = false;
        videoRef.current.play().then(() => {
          setIsPlaying(true);
          setIsMuted(false);
        }).catch((err) => {
          console.error('Playback failed:', err);
          // Fallback to muted if something goes wrong
          videoRef.current!.muted = true;
          videoRef.current!.play();
          setIsMuted(true);
        });
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMuted(prev => !prev);
  };

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div 
            className="absolute inset-0 bg-gradient-to-br from-gray-950 via-purple-950/10 to-emerald-950/10"
            style={{
              backgroundImage: `radial-gradient(circle at 25% 25%, rgba(120, 119, 198, 0.05) 0%, transparent 55%),
                                radial-gradient(circle at 75% 75%, rgba(20, 184, 166, 0.05) 0%, transparent 55%)`
            }}
            onClick={handleDismiss}
          />

          <motion.div
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            className="relative w-full max-w-md"
          >
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-emerald-600/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="relative bg-gray-900/80 backdrop-blur-md rounded-2xl border border-gray-800/70 shadow-2xl overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-blue-600 via-purple-600 to-emerald-600" />
                
                <div className="relative aspect-video overflow-hidden cursor-pointer" onClick={handleVideoClick}>
                  <video
                    ref={videoRef}
                    src="https://files.catbox.moe/i5derp.mp4"
                    loop
                    playsInline
                    muted={isMuted}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-transparent to-gray-900/40" />

                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className={`transition-opacity duration-300 ${isPlaying ? 'opacity-0' : 'opacity-100'}`}>
                      <div className="bg-black/60 rounded-full p-5 backdrop-blur-sm">
                        <Play className="w-14 h-14 text-white" fill="white" />
                      </div>
                    </div>
                  </div>

                  {isPlaying && (
                    <button
                      onClick={toggleMute}
                      className="absolute bottom-3 left-3 p-2 rounded-lg bg-black/50 backdrop-blur-sm hover:bg-black/70 transition-colors"
                    >
                      {isMuted ? (
                        <VolumeX className="w-5 h-5 text-white/70" />
                      ) : (
                        <Volume2 className="w-5 h-5 text-white/70" />
                      )}
                    </button>
                  )}
                </div>

                <div className="p-8">
                  <button
                    onClick={handleDismiss}
                    className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    <X className="w-4 h-4 text-white/50 hover:text-white" />
                  </button>

                  <div className="text-center">
                    <div className="relative inline-block mb-6">
                      <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-green-500/20 rounded-full blur-lg" />
                      <motion.span
                        animate={{ 
                          rotate: [0, 5, -5, 0],
                          scale: [1, 1.05, 0.95, 1]
                        }}
                        transition={{
                          duration: 4,
                          repeat: Infinity,
                          repeatType: 'reverse'
                        }}
                        className="relative text-6xl"
                      >
                        🎄
                      </motion.span>
                    </div>

                    <h3 className="text-2xl font-normal text-white mb-2 tracking-wide">
                      Merry Christmas!
                    </h3>
                    
                    <div className="flex items-center justify-center gap-2 mb-4">
                      <div className="w-12 h-px bg-gradient-to-r from-transparent to-gray-600" />
                      <span className="text-xs text-gray-400 font-light">from</span>
                      <div className="w-12 h-px bg-gradient-to-l from-transparent to-gray-600" />
                    </div>
                    
                    <p className="text-sm text-gray-400 mb-6">
                      FlickyStream Team
                    </p>

                    <div className="relative mb-8">
                      <div className="absolute -left-2 top-1/2 -translate-y-1/2 text-xl text-blue-500/50">"</div>
                      <p className="text-white/80 text-sm px-4 italic font-light leading-relaxed">
                        May your day be filled with joy, warmth, and perfect entertainment
                      </p>
                      <div className="absolute -right-2 top-1/2 -translate-y-1/2 text-xl text-emerald-500/50">"</div>
                    </div>

                    <div className="pt-6 border-t border-gray-800/50">
                      <div className="flex justify-center gap-3 mb-3">
                        {['🎅', '✨', '🎁', '🌟', '🍿'].map((emoji, i) => (
                          <motion.span
                            key={i}
                            animate={{ y: [0, -2, 0] }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              delay: i * 0.3,
                            }}
                            className="text-lg opacity-70 hover:opacity-100 transition-opacity"
                          >
                            {emoji}
                          </motion.span>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500">
                        Happy Holidays • December 25, {new Date().getFullYear()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ChristmasGreeting;