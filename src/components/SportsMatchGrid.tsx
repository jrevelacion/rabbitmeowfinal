import React from 'react';
import { APIMatch } from '@/utils/sports-types';
import SportsMatchCard from './SportsMatchCard';
import { motion, Variants } from 'framer-motion';
import { Zap } from 'lucide-react';

interface SportMatchGridProps {
  matches: APIMatch[];
  title?: string;
  emptyMessage?: string;
}

const SportMatchGrid = ({ matches, title, emptyMessage = "No matches found." }: SportMatchGridProps) => {
  if (!matches || matches.length === 0) {
    return (
      <motion.div 
        className="py-24 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="inline-block">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          >
            <Zap className="h-12 w-12 text-white/50 mx-auto mb-4 drop-shadow-lg" />
          </motion.div>
          <p className="text-white/60 font-bold uppercase tracking-widest text-xs drop-shadow-lg">{emptyMessage}</p>
        </div>
      </motion.div>
    );
  }

  const container: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.04,
        delayChildren: 0.1
      }
    }
  };

  const item: Variants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    show: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15,
        duration: 0.5
      }
    }
  };
  
  return (
    <div className="py-4">
      {title && (
        <motion.h2 
          className="text-sm font-black tracking-widest text-white uppercase mb-8 border-b border-white/20 pb-3 flex items-center gap-2 drop-shadow-lg"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
        >
          <motion.span 
            className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-400 to-purple-400"
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          {title}
        </motion.h2>
      )}
      
      <motion.div 
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {matches.map((match, index) => (
          <motion.div 
            key={match.id} 
            variants={item} 
            className="h-full"
            whileHover={{ y: -8 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <SportsMatchCard match={match} />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

export default SportMatchGrid;
