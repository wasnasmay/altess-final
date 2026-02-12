'use client';

import { Music } from 'lucide-react';

export default function OrientaleMusiquelogo({ className = "w-48 h-auto" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="relative group flex-shrink-0">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-yellow-600 rounded-full blur-lg opacity-50 animate-pulse"></div>
        <div className="relative bg-gradient-to-br from-amber-500 via-yellow-500 to-amber-600 p-3 rounded-full shadow-lg shadow-amber-900/50 transition-transform group-hover:scale-110">
          <Music className="w-6 h-6 text-black animate-[spin_3s_ease-in-out_infinite]" strokeWidth={2.5} />
        </div>
      </div>
      <div className="flex flex-col items-start">
        <span className="text-2xl font-black bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-300 bg-clip-text text-transparent leading-tight tracking-tight animate-[pulse_2s_ease-in-out_infinite] whitespace-nowrap">
          Orientale
        </span>
        <span className="text-xl font-bold text-amber-500/90 -mt-1 tracking-wider whitespace-nowrap">
          MUSIQUE
        </span>
      </div>
    </div>
  );
}
