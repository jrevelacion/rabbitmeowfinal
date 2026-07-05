import React from 'react';
import { APIMatch } from '@/utils/sports-types';
import SportsMatchCard from './SportsMatchCard';
import { motion, Variants } from 'framer-motion';

interface SportMatchGridProps {
  matches: APIMatch[];
  title?: string;
  emptyMessage?: string;
}

const SportMatchGrid = ({ matches, title, emptyMessage = "No matches found." }: SportMatchGridProps) => {
  if (!matches || matches.length === 0) {
    return (
      <div className="py-20 text-center text-neutral-600 font-bold uppercase tracking-widest text-xs">
        <p>{emptyMessage}</p>
      </div>
    );
  }

  const container: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.03
      }
    }
  };

  const item: Variants = {
    hidden: { opacity: 0, scale: 0.96 },
    show: { 
      opacity: 1, 
      scale: 1,
      transition: {
        type: "tween",
        duration: 0.2,
        ease: "easeOut"
      }
    }
  };
  
  return (
    <div className="py-2">
      {title && (
        <h2 className="text-sm font-black tracking-widest text-neutral-400 uppercase mb-6 border-b border-neutral-900 pb-2">
          {title}
        </h2>
      )}
      
      <motion.div 
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {matches.map((match) => (
          <motion.div key={match.id} variants={item} className="h-full">
            <SportsMatchCard match={match} />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

export default SportMatchGrid;
