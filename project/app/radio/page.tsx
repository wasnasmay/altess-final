'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Pause, Radio, Volume2, VolumeX, ChevronLeft, ChevronRight } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import Hls from 'hls.js';

interface RadioStation {
  id: string;
  name: string;
  stream_url: string;
  logo_url: string;
  color: string;
  display_order: number;
  is_active: boolean;
}

export default function RadioPage() {
  const [stations, setStations] = useState<RadioStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentStation, setCurrentStation] = useState<RadioStation | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(70);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    loadStations();

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume / 100;
    }
  }, [volume, isMuted]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleError = (e: Event) => {
      console.error('Audio error:', e);
      setIsPlaying(false);
      toast.error('Erreur de lecture audio');
    };

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('error', handleError);
    };
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

  function getProxiedStreamUrl(streamUrl: string): string {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      if (!baseUrl) {
        console.error('❌ NEXT_PUBLIC_SUPABASE_URL not configured, using direct stream');
        return streamUrl;
      }
      const encodedUrl = encodeURIComponent(streamUrl);
      const proxiedUrl = `${baseUrl}/functions/v1/stream-radio-proxy?url=${encodedUrl}`;
      console.log('🔗 Using proxy stream:', proxiedUrl);
      return proxiedUrl;
    } catch (error) {
      console.error('❌ Error creating proxied URL:', error);
      return streamUrl;
    }
  }

  function handleStationClick(station: RadioStation) {
    if (currentStation?.id === station.id) {
      if (isPlaying) {
        audioRef.current?.pause();
        setIsPlaying(false);
      } else {
        audioRef.current?.play().catch(err => {
          console.error('Play error:', err);
          toast.error('Erreur lors de la lecture');
        });
        setIsPlaying(true);
      }
    } else {
      playStation(station);
    }
  }

  function playStation(station: RadioStation) {
    const audio = audioRef.current;
    if (!audio) return;

    console.log('🎵 Playing station:', station.name, station.stream_url);

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const streamUrl = station.stream_url;
    const proxiedUrl = getProxiedStreamUrl(streamUrl);

    if (streamUrl.includes('.m3u8')) {
      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 90,
          maxBufferLength: 30,
          maxMaxBufferLength: 60,
        });

        hls.loadSource(proxiedUrl);
        hls.attachMedia(audio);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          console.log('✅ HLS manifest parsed');
          audio.play().catch(err => {
            console.error('Play error:', err);
            toast.error('Erreur lors de la lecture');
          });
        });

        hls.on(Hls.Events.ERROR, (event, data) => {
          console.error('❌ HLS error:', data);
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                console.log('🔄 Network error, attempting to recover...');
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                console.log('🔄 Media error, attempting to recover...');
                hls.recoverMediaError();
                break;
              default:
                console.error('💥 Fatal error, destroying HLS instance');
                hls.destroy();
                toast.error('Erreur de lecture audio');
                break;
            }
          }
        });

        hlsRef.current = hls;
      } else if (audio.canPlayType('application/vnd.apple.mpegurl')) {
        audio.src = proxiedUrl;
        audio.play().catch(err => {
          console.error('Play error:', err);
          toast.error('Erreur lors de la lecture');
        });
      }
    } else {
      audio.src = proxiedUrl;
      audio.play().catch(err => {
        console.error('Play error:', err);
        toast.error('Erreur lors de la lecture');
      });
    }

    setCurrentStation(station);
    setIsPlaying(true);
  }

  function togglePlayPause() {
    if (!currentStation) return;

    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    } else {
      audioRef.current?.play();
      setIsPlaying(true);
    }
  }

  function toggleMute() {
    setIsMuted(!isMuted);
  }

  function scrollLeft() {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: -400,
        behavior: 'smooth'
      });
    }
  }

  function scrollRight() {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: 400,
        behavior: 'smooth'
      });
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pt-24 pb-32">
      <audio ref={audioRef} preload="none" />

      {/* Custom Scrollbar Styles */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          height: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.7);
          border-radius: 10px;
          margin: 0 48px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(90deg, #f59e0b, #d97706);
          border-radius: 10px;
          border: 2px solid rgba(15, 23, 42, 0.5);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(90deg, #fbbf24, #f59e0b);
        }
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #f59e0b rgba(15, 23, 42, 0.7);
        }

        /* Smooth scroll behavior */
        .custom-scrollbar {
          scroll-behavior: smooth;
        }
      `}</style>

      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Radio className="w-10 h-10 text-amber-500" />
              <h1 className="text-4xl md:text-5xl font-bold text-white">ALTESS Radio</h1>
            </div>
            <p className="text-slate-400 text-lg">Écoutez vos stations préférées en direct</p>
          </div>

          {stations.length === 0 ? (
            <Card className="bg-slate-900/50 border-slate-800 p-12 text-center">
              <Radio className="w-16 h-16 mx-auto mb-4 text-slate-600" />
              <p className="text-slate-400 text-lg">Aucune station disponible pour le moment</p>
            </Card>
          ) : (
            <>
              {/* Section Titre Stations */}
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">Stations Disponibles</h2>
                <p className="text-slate-400">Faites défiler horizontalement pour découvrir toutes nos stations</p>
              </div>

              {/* Conteneur Carrousel Horizontal */}
              <div className="relative mb-8">
                {/* Bouton Scroll Gauche */}
                <Button
                  onClick={scrollLeft}
                  size="icon"
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-slate-900/90 hover:bg-slate-800 border-2 border-amber-500/50 shadow-xl backdrop-blur-sm"
                  aria-label="Défiler vers la gauche"
                >
                  <ChevronLeft className="w-6 h-6 text-amber-500" />
                </Button>

                {/* Conteneur Scrollable Horizontal */}
                <div
                  ref={scrollContainerRef}
                  className="overflow-x-auto overflow-y-hidden custom-scrollbar scroll-smooth px-12"
                  style={{ scrollbarWidth: 'thin' }}
                >
                  <div className="flex gap-6 pb-4">
                {stations.map((station) => {
                  const isCurrentStation = currentStation?.id === station.id;
                  const isCurrentPlaying = isCurrentStation && isPlaying;

                  return (
                    <Card
                      key={station.id}
                      className={`flex-shrink-0 w-72 bg-slate-900/50 border-2 transition-all cursor-pointer hover:scale-105 overflow-hidden ${
                        isCurrentStation
                          ? 'border-amber-500 shadow-lg shadow-amber-500/20'
                          : 'border-slate-800 hover:border-amber-500/50'
                      }`}
                      onClick={() => handleStationClick(station)}
                    >
                      <div className="p-6 flex flex-col items-center text-center gap-4">
                        <div
                          className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white relative"
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
                            <Radio className="w-8 h-8" />
                          )}
                          {isCurrentPlaying && (
                            <div className="absolute inset-0 rounded-full border-4 border-amber-500 animate-pulse" />
                          )}
                        </div>

                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-white mb-1">{station.name}</h3>
                          {isCurrentPlaying && (
                            <div className="flex items-center justify-center gap-1">
                              <span className="w-1 h-3 bg-amber-500 animate-pulse" style={{ animationDelay: '0ms' }} />
                              <span className="w-1 h-4 bg-amber-500 animate-pulse" style={{ animationDelay: '150ms' }} />
                              <span className="w-1 h-3 bg-amber-500 animate-pulse" style={{ animationDelay: '300ms' }} />
                            </div>
                          )}
                        </div>

                        <Button
                          size="lg"
                          className={`w-full ${
                            isCurrentPlaying
                              ? 'bg-amber-500 hover:bg-amber-600'
                              : 'bg-slate-800 hover:bg-slate-700'
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStationClick(station);
                          }}
                        >
                          {isCurrentPlaying ? (
                            <>
                              <Pause className="w-4 h-4 mr-2" />
                              En lecture
                            </>
                          ) : (
                            <>
                              <Play className="w-4 h-4 mr-2" />
                              Écouter
                            </>
                          )}
                        </Button>
                      </div>
                    </Card>
                  );
                })}
                  </div>
                </div>

                {/* Bouton Scroll Droite */}
                <Button
                  onClick={scrollRight}
                  size="icon"
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-slate-900/90 hover:bg-slate-800 border-2 border-amber-500/50 shadow-xl backdrop-blur-sm"
                  aria-label="Défiler vers la droite"
                >
                  <ChevronRight className="w-6 h-6 text-amber-500" />
                </Button>
              </div>

              {currentStation && (
                <Card className="bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/30 border-amber-500 border-2 fixed bottom-0 left-0 right-0 z-50 rounded-none shadow-2xl shadow-amber-500/20">
                  <div className="container mx-auto px-4 py-5">
                    <div className="flex items-center gap-6">
                      {/* Station Info */}
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div
                          className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 ring-2 ring-amber-500/50"
                          style={{ backgroundColor: currentStation.color || '#f59e0b' }}
                        >
                          {currentStation.logo_url ? (
                            <img
                              src={currentStation.logo_url}
                              alt={currentStation.name}
                              className="w-full h-full object-cover rounded-full"
                            />
                          ) : (
                            <Radio className="w-7 h-7 text-white" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-white truncate text-lg">{currentStation.name}</h4>
                          <div className="flex items-center gap-2">
                            {isPlaying && (
                              <div className="flex items-center gap-1">
                                <span className="w-1 h-2.5 bg-amber-500 animate-pulse rounded-full" style={{ animationDelay: '0ms' }} />
                                <span className="w-1 h-3.5 bg-amber-500 animate-pulse rounded-full" style={{ animationDelay: '150ms' }} />
                                <span className="w-1 h-2.5 bg-amber-500 animate-pulse rounded-full" style={{ animationDelay: '300ms' }} />
                              </div>
                            )}
                            <p className="text-sm font-medium text-amber-400">
                              {isPlaying ? 'En Direct' : 'En Pause'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Audio Controls */}
                      <div className="flex items-center gap-4">
                        {/* Play/Pause Button - Prominent */}
                        <Button
                          size="lg"
                          onClick={togglePlayPause}
                          className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-xl shadow-amber-500/30 px-8 font-bold text-base"
                        >
                          {isPlaying ? (
                            <>
                              <Pause className="w-5 h-5 mr-2" />
                              Pause
                            </>
                          ) : (
                            <>
                              <Play className="w-5 h-5 mr-2" />
                              Lecture
                            </>
                          )}
                        </Button>

                        {/* Volume Control - Enhanced */}
                        <div className="flex flex-col gap-1 min-w-[180px] bg-slate-800/70 rounded-xl px-4 py-3 backdrop-blur-md border border-amber-500/20">
                          <label className="text-xs font-semibold text-amber-400 uppercase tracking-wide">
                            Volume
                          </label>
                          <div className="flex items-center gap-3">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={toggleMute}
                              className="text-white hover:bg-slate-700 h-9 w-9 hover:text-amber-400 transition-colors"
                              title={isMuted ? "Réactiver le son" : "Couper le son"}
                            >
                              {isMuted ? (
                                <VolumeX className="w-5 h-5 text-red-400" />
                              ) : (
                                <Volume2 className="w-5 h-5" />
                              )}
                            </Button>
                            <Slider
                              value={[isMuted ? 0 : volume]}
                              onValueChange={(value) => {
                                setVolume(value[0]);
                                if (isMuted) setIsMuted(false);
                              }}
                              max={100}
                              step={1}
                              className="flex-1 cursor-pointer"
                            />
                            <span className="text-sm text-white font-bold w-10 text-right bg-slate-900 px-2 py-1 rounded">
                              {isMuted ? '0' : volume}%
                            </span>
                          </div>
                        </div>

                        {/* Mute Quick Button */}
                        <Button
                          variant="outline"
                          size="lg"
                          onClick={toggleMute}
                          className={`border-2 font-semibold ${
                            isMuted
                              ? 'border-red-500 bg-red-500/10 text-red-400 hover:bg-red-500/20'
                              : 'border-amber-500 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'
                          }`}
                          title={isMuted ? "Réactiver le son" : "Couper le son"}
                        >
                          {isMuted ? (
                            <>
                              <VolumeX className="w-5 h-5 mr-2" />
                              Muet
                            </>
                          ) : (
                            <>
                              <Volume2 className="w-5 h-5 mr-2" />
                              Son
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
