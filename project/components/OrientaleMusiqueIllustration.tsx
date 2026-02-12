'use client';

import { Music, Music2, Radio, Disc3, Sparkles, Star } from 'lucide-react';

export default function OrientaleMusiqueIllustration() {
  return (
    <div className="relative w-full h-full min-h-[400px] bg-gradient-to-br from-amber-950/40 via-black to-yellow-950/40 rounded-lg overflow-hidden border border-amber-700/30 shadow-2xl shadow-amber-900/50">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, rgba(251, 191, 36, 0.3) 0%, transparent 50%),
                           radial-gradient(circle at 75% 75%, rgba(234, 179, 8, 0.3) 0%, transparent 50%)`,
        }} />
      </div>

      {/* Decorative Stars */}
      <div className="absolute top-8 left-8 text-amber-400/20 animate-pulse">
        <Star className="w-6 h-6 fill-current" />
      </div>
      <div className="absolute top-16 right-12 text-yellow-400/20 animate-pulse" style={{ animationDelay: '1s' }}>
        <Star className="w-4 h-4 fill-current" />
      </div>
      <div className="absolute bottom-12 left-16 text-amber-400/20 animate-pulse" style={{ animationDelay: '2s' }}>
        <Star className="w-5 h-5 fill-current" />
      </div>
      <div className="absolute bottom-20 right-8 text-yellow-400/20 animate-pulse" style={{ animationDelay: '0.5s' }}>
        <Star className="w-4 h-4 fill-current" />
      </div>

      {/* Central Illustration */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative">
          {/* Outer Glow Ring */}
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-full blur-3xl opacity-20 animate-pulse" style={{ width: '280px', height: '280px', margin: 'auto' }} />

          {/* Main Circle */}
          <div className="relative bg-gradient-to-br from-amber-900/60 to-yellow-900/60 backdrop-blur-sm rounded-full p-12 border-4 border-amber-500/30 shadow-2xl" style={{ width: '260px', height: '260px' }}>
            {/* Inner Glow */}
            <div className="absolute inset-4 bg-gradient-to-br from-yellow-500/10 to-amber-500/10 rounded-full animate-pulse" />

            {/* Music Icons Arrangement */}
            <div className="relative w-full h-full flex items-center justify-center">
              {/* Center Large Icon */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-amber-400 rounded-full blur-xl opacity-50 animate-pulse" />
                  <Music2 className="w-20 h-20 text-amber-300 relative animate-[spin_8s_linear_infinite]" strokeWidth={1.5} />
                </div>
              </div>

              {/* Orbiting Icons */}
              <div className="absolute inset-0 animate-[spin_20s_linear_infinite]">
                <Music className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-8 text-yellow-400" strokeWidth={2} />
              </div>

              <div className="absolute inset-0 animate-[spin_20s_linear_infinite]" style={{ animationDelay: '5s' }}>
                <Radio className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-8 text-amber-400" strokeWidth={2} />
              </div>

              <div className="absolute inset-0 animate-[spin_20s_linear_infinite]" style={{ animationDelay: '10s' }}>
                <Disc3 className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-8 text-yellow-500" strokeWidth={2} />
              </div>

              <div className="absolute inset-0 animate-[spin_20s_linear_infinite]" style={{ animationDelay: '15s' }}>
                <Sparkles className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-8 text-amber-300" strokeWidth={2} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative Text */}
      <div className="absolute bottom-8 left-0 right-0 text-center">
        <div className="inline-block px-6 py-2 bg-gradient-to-r from-amber-900/40 to-yellow-900/40 backdrop-blur-sm rounded-full border border-amber-500/20">
          <p className="text-amber-300 font-bold text-sm tracking-wider">
            Excellence • Tradition • Prestige
          </p>
        </div>
      </div>

      {/* Top Decorative Text */}
      <div className="absolute top-8 left-0 right-0 text-center">
        <div className="inline-block px-6 py-2 bg-gradient-to-r from-yellow-900/40 to-amber-900/40 backdrop-blur-sm rounded-full border border-amber-500/20">
          <p className="text-yellow-300 font-bold text-xs tracking-widest uppercase">
            Musique Orientale
          </p>
        </div>
      </div>

      {/* Corner Accents */}
      <div className="absolute top-0 left-0 w-24 h-24 border-t-4 border-l-4 border-amber-500/20 rounded-tl-lg" />
      <div className="absolute top-0 right-0 w-24 h-24 border-t-4 border-r-4 border-amber-500/20 rounded-tr-lg" />
      <div className="absolute bottom-0 left-0 w-24 h-24 border-b-4 border-l-4 border-amber-500/20 rounded-bl-lg" />
      <div className="absolute bottom-0 right-0 w-24 h-24 border-b-4 border-r-4 border-amber-500/20 rounded-br-lg" />
    </div>
  );
}
