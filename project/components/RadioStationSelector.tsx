'use client';

import { Button } from '@/components/ui/button';
import { Radio } from 'lucide-react';

export type RadioStation = {
  id: string;
  name: string;
  streamUrl: string;
  logo?: string;
  color?: string;
};

interface RadioStationSelectorProps {
  stations: RadioStation[];
  currentStation: RadioStation | null;
  onStationChange: (station: RadioStation) => void;
}

export default function RadioStationSelector({
  stations,
  currentStation,
  onStationChange
}: RadioStationSelectorProps) {
  return (
    <div className="w-full px-2 md:px-4">
      <div className="flex items-center justify-center gap-2 md:gap-3 mb-4 md:mb-5 bg-black/80 backdrop-blur-xl py-3 rounded-2xl border-2 border-amber-500/30" style={{ boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)' }}>
        <Radio className="w-5 h-5 md:w-6 md:h-6 text-amber-400 animate-pulse drop-shadow-lg" />
        <span className="text-sm md:text-base text-white uppercase tracking-widest font-black drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
          Stations Radio
        </span>
        <Radio className="w-5 h-5 md:w-6 md:h-6 text-amber-400 animate-pulse drop-shadow-lg" />
      </div>
      <div className="relative pb-8">
        <div className="flex gap-3 md:gap-5 overflow-x-auto overflow-y-visible scrollbar-hide pb-2 snap-x snap-mandatory scroll-smooth">
          <div className="flex-shrink-0 w-2" />
          {stations.map((station) => (
            <div key={station.id} className="flex-shrink-0 snap-center relative">
              <Button
                onClick={() => onStationChange(station)}
                variant="ghost"
                className={`relative group transition-all duration-300 transform hover:scale-110 ${
                  currentStation?.id === station.id
                    ? 'bg-gradient-to-br from-amber-500 to-orange-600 border-2 border-amber-300 shadow-2xl shadow-amber-500/60 scale-105'
                    : 'bg-gradient-to-br from-gray-700 to-gray-800 border-2 border-gray-400 hover:border-amber-400 hover:shadow-xl hover:shadow-amber-500/30'
                }`}
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  padding: 0
                }}
              >
                <div className="flex flex-col items-center justify-center w-full h-full">
                  {station.logo ? (
                    <img
                      src={station.logo}
                      alt={station.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <>
                      <Radio className={`w-6 h-6 mb-1 ${
                        currentStation?.id === station.id ? 'text-white' : 'text-gray-200'
                      }`} />
                      <span className={`text-[9px] font-black text-center leading-tight px-1 ${
                        currentStation?.id === station.id ? 'text-white' : 'text-gray-100'
                      }`}>
                        {station.name.split(' ').slice(0, 2).join(' ')}
                      </span>
                    </>
                  )}
                </div>
                {currentStation?.id === station.id && (
                  <div className="absolute top-0 right-0 w-5 h-5 bg-green-500 rounded-full border-2 border-white animate-pulse shadow-lg z-10"></div>
                )}
              </Button>
              <p className={`mt-2 text-center text-xs md:text-sm font-bold transition-all duration-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] ${
                currentStation?.id === station.id ? 'text-amber-400 scale-105' : 'text-gray-200'
              }`}>
                {station.name.length > 12 ? station.name.substring(0, 12) + '...' : station.name}
              </p>
            </div>
          ))}
          <div className="flex-shrink-0 w-2" />
        </div>
      </div>
    </div>
  );
}
