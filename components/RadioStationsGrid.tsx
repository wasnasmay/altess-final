'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Radio, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { usePlayer } from '@/contexts/PlayerContext';

interface RadioStation {
  id: string;
  name: string;
  stream_url: string;
  logo_url: string;
  color: string;
  display_order: number;
  is_active: boolean;
}

export function RadioStationsGrid() {
  const [stations, setStations] = useState<RadioStation[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentMedia, setCurrentMedia, setIsPlayerOpen, setMode } = usePlayer();

  useEffect(() => {
    loadStations();
  }, []);

  async function loadStations() {
    try {
      const { data, error } = await supabase
        .from('radio_stations')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setStations(data || []);
    } catch (error) {
      console.error('Error loading stations:', error);
      toast.error('Erreur lors du chargement des stations');
    } finally {
      setLoading(false);
    }
  }

  function handleStationClick(station: RadioStation) {
    setMode('radio');
    setCurrentMedia({
      id: station.id,
      title: station.name,
      source_url: station.stream_url,
      thumbnail_url: station.logo_url || undefined,
      description: `Station de radio: ${station.name}`
    });
    setIsPlayerOpen(true);
    toast.success(`Lecture de ${station.name}`);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  if (stations.length === 0) {
    return (
      <Card className="bg-slate-900/30 border-slate-800 p-8 text-center">
        <Radio className="w-12 h-12 mx-auto mb-3 text-slate-600" />
        <p className="text-slate-400">Aucune station disponible pour le moment</p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
      {stations.map((station) => {
        const isCurrentStation = currentMedia?.id === station.id;

        return (
          <Card
            key={station.id}
            className={`bg-slate-900/40 backdrop-blur-sm border transition-all cursor-pointer hover:scale-105 group ${
              isCurrentStation
                ? 'border-amber-500 shadow-lg shadow-amber-500/20'
                : 'border-slate-800 hover:border-amber-500/50'
            }`}
            onClick={() => handleStationClick(station)}
          >
            <div className="p-3 md:p-4 flex flex-col items-center text-center gap-2 md:gap-3">
              <div
                className="w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center relative transition-transform group-hover:scale-110"
                style={{
                  backgroundColor: station.color || '#f59e0b'
                }}
              >
                {station.logo_url ? (
                  <img
                    src={station.logo_url}
                    alt={station.name}
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <Radio className="w-6 h-6 md:w-7 md:h-7 text-white" />
                )}
                {isCurrentStation && (
                  <div className="absolute inset-0 rounded-full border-2 border-amber-500 animate-pulse" />
                )}
              </div>

              <div className="flex-1 min-w-0 w-full">
                <h3 className="text-xs md:text-sm font-semibold text-white truncate">{station.name}</h3>
                {isCurrentStation && (
                  <div className="flex items-center justify-center gap-0.5 mt-1">
                    <span className="w-0.5 h-2 bg-amber-500 animate-pulse" style={{ animationDelay: '0ms' }} />
                    <span className="w-0.5 h-3 bg-amber-500 animate-pulse" style={{ animationDelay: '150ms' }} />
                    <span className="w-0.5 h-2 bg-amber-500 animate-pulse" style={{ animationDelay: '300ms' }} />
                  </div>
                )}
              </div>

              <Button
                size="sm"
                className={`w-full text-xs ${
                  isCurrentStation
                    ? 'bg-amber-500 hover:bg-amber-600'
                    : 'bg-slate-800 hover:bg-slate-700'
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleStationClick(station);
                }}
              >
                <Play className="w-3 h-3 mr-1" />
                {isCurrentStation ? 'En cours' : 'Écouter'}
              </Button>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
