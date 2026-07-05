export interface SportColor {
  bg: string;
  border: string;
  text: string;
  glow: string;
  gradient: string;
}

export const sportColors: { [key: string]: SportColor } = {
  all: { 
    bg: 'from-blue-600 to-cyan-500', 
    border: 'border-blue-400', 
    text: 'text-blue-100', 
    glow: 'rgba(59, 130, 246, 0.3)',
    gradient: 'linear-gradient(135deg, rgb(37, 99, 235), rgb(6, 182, 212))'
  },
  football: { 
    bg: 'from-green-600 to-emerald-500', 
    border: 'border-green-400', 
    text: 'text-green-100', 
    glow: 'rgba(34, 197, 94, 0.3)',
    gradient: 'linear-gradient(135deg, rgb(22, 163, 74), rgb(16, 185, 129))'
  },
  soccer: { 
    bg: 'from-green-600 to-emerald-500', 
    border: 'border-green-400', 
    text: 'text-green-100', 
    glow: 'rgba(34, 197, 94, 0.3)',
    gradient: 'linear-gradient(135deg, rgb(22, 163, 74), rgb(16, 185, 129))'
  },
  basketball: { 
    bg: 'from-orange-600 to-amber-500', 
    border: 'border-orange-400', 
    text: 'text-orange-100', 
    glow: 'rgba(234, 88, 12, 0.3)',
    gradient: 'linear-gradient(135deg, rgb(234, 88, 12), rgb(245, 158, 11))'
  },
  tennis: { 
    bg: 'from-yellow-500 to-lime-500', 
    border: 'border-yellow-400', 
    text: 'text-yellow-100', 
    glow: 'rgba(234, 179, 8, 0.3)',
    gradient: 'linear-gradient(135deg, rgb(234, 179, 8), rgb(132, 204, 22))'
  },
  cricket: { 
    bg: 'from-blue-500 to-indigo-600', 
    border: 'border-blue-400', 
    text: 'text-blue-100', 
    glow: 'rgba(99, 102, 241, 0.3)',
    gradient: 'linear-gradient(135deg, rgb(59, 130, 246), rgb(79, 70, 229))'
  },
  hockey: { 
    bg: 'from-red-600 to-pink-500', 
    border: 'border-red-400', 
    text: 'text-red-100', 
    glow: 'rgba(220, 38, 38, 0.3)',
    gradient: 'linear-gradient(135deg, rgb(220, 38, 38), rgb(236, 72, 153))'
  },
  volleyball: { 
    bg: 'from-purple-600 to-pink-500', 
    border: 'border-purple-400', 
    text: 'text-purple-100', 
    glow: 'rgba(147, 51, 234, 0.3)',
    gradient: 'linear-gradient(135deg, rgb(147, 51, 234), rgb(236, 72, 153))'
  },
  baseball: { 
    bg: 'from-red-500 to-orange-600', 
    border: 'border-red-400', 
    text: 'text-red-100', 
    glow: 'rgba(239, 68, 68, 0.3)',
    gradient: 'linear-gradient(135deg, rgb(239, 68, 68), rgb(234, 88, 12))'
  },
  fighting: { 
    bg: 'from-slate-700 to-slate-900', 
    border: 'border-slate-500', 
    text: 'text-slate-100', 
    glow: 'rgba(71, 85, 105, 0.3)',
    gradient: 'linear-gradient(135deg, rgb(51, 65, 85), rgb(15, 23, 42))'
  },
  motorsport: { 
    bg: 'from-zinc-700 to-black', 
    border: 'border-zinc-500', 
    text: 'text-zinc-100', 
    glow: 'rgba(63, 63, 70, 0.3)',
    gradient: 'linear-gradient(135deg, rgb(63, 63, 70), rgb(0, 0, 0))'
  },
};

export const getColorForSport = (sportId: string): SportColor => {
  const normalizedId = sportId?.toLowerCase();
  return sportColors[normalizedId] || sportColors.all;
};
