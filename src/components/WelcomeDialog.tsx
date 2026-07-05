import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WelcomeDialogProps {
  onClose: () => void;
  isOpen: boolean;
}

const WelcomeDialog: React.FC<WelcomeDialogProps> = ({ onClose, isOpen }) => {
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (isOpen && !hasAnimated) {
      setHasAnimated(true);
    }
  }, [isOpen, hasAnimated]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
    exit: { opacity: 0, transition: { duration: 0.3 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: 'easeOut' },
    },
  };

  const logoVariants = {
    hidden: { scale: 0, rotate: -180 },
    visible: {
      scale: 1,
      rotate: 0,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 15,
        duration: 0.8,
      },
    },
  };

  const pulseVariants = {
    animate: {
      scale: [1, 1.05, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />

          {/* Dialog */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              className="relative w-full max-w-md bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl shadow-2xl border border-white/10 overflow-hidden"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              {/* Animated background gradient */}
              <div className="absolute inset-0 opacity-30">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
              </div>

              {/* Close button */}
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              >
                <X className="h-5 w-5 text-white" />
              </motion.button>

              {/* Content */}
              <div className="relative z-10 px-8 py-12 text-center">
                {/* Logo */}
                <motion.div
                  variants={logoVariants}
                  className="mb-8 flex justify-center"
                >
                  <motion.div
                    variants={pulseVariants}
                    animate="animate"
                    className="relative"
                  >
                    <img
                      src="/logo.png"
                      alt="RabbitMeow"
                      className="h-32 w-32 object-contain drop-shadow-lg"
                    />
                    {/* Glow effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/20 to-purple-500/0 rounded-full blur-2xl" />
                  </motion.div>
                </motion.div>

                {/* Title */}
                <motion.div variants={itemVariants} className="mb-4">
                  <h2 className="text-3xl font-black bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent mb-2">
                    Welcome to RabbitMeow
                  </h2>
                  <div className="flex items-center justify-center gap-2 text-sm text-white/60">
                    <Sparkles className="h-4 w-4 text-yellow-400" />
                    <span>Your Entertainment Hub</span>
                    <Sparkles className="h-4 w-4 text-yellow-400" />
                  </div>
                </motion.div>

                {/* Description */}
                <motion.p
                  variants={itemVariants}
                  className="text-white/70 text-sm leading-relaxed mb-8"
                >
                  Stream unlimited movies and TV shows in stunning quality. Discover your next favorite with our curated collections and personalized recommendations.
                </motion.p>

                {/* Features */}
                <motion.div
                  variants={itemVariants}
                  className="grid grid-cols-3 gap-4 mb-8"
                >
                  {[
                    { icon: '🎬', label: 'Movies' },
                    { icon: '📺', label: 'TV Shows' },
                    { icon: '⭐', label: 'Trending' },
                  ].map((feature, index) => (
                    <motion.div
                      key={index}
                      whileHover={{ scale: 1.05, y: -5 }}
                      className="p-3 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-colors"
                    >
                      <div className="text-2xl mb-1">{feature.icon}</div>
                      <div className="text-xs font-medium text-white/80">{feature.label}</div>
                    </motion.div>
                  ))}
                </motion.div>

                {/* Action Buttons */}
                <motion.div variants={itemVariants} className="space-y-3">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      onClick={onClose}
                      className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 shadow-lg shadow-blue-500/30"
                    >
                      <Play className="h-4 w-4" />
                      Start Watching
                    </Button>
                  </motion.div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onClose}
                    className="w-full py-3 rounded-xl bg-white/5 border border-white/20 hover:bg-white/10 text-white font-semibold transition-all duration-300"
                  >
                    Maybe Later
                  </motion.button>
                </motion.div>

                {/* Footer text */}
                <motion.p
                  variants={itemVariants}
                  className="text-xs text-white/40 mt-6"
                >
                  This dialog won't show again until you clear your browser data
                </motion.p>
              </div>

              {/* Decorative corners */}
              <div className="absolute top-0 left-0 w-20 h-20 border-t-2 border-l-2 border-white/10 rounded-br-3xl" />
              <div className="absolute bottom-0 right-0 w-20 h-20 border-b-2 border-r-2 border-white/10 rounded-tl-3xl" />
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default WelcomeDialog;
