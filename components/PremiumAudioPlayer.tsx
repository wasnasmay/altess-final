'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, SkipBack, SkipForward, Volume2, Music2, Disc3 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type AudioTrack = {
  id: string;
  title: string;
  artist: string;
  audio_url: string;
  cover_image_url: string | null;
  duration_seconds: number;
  album: string | null;
  display_order: number;
};

export default function PremiumAudioPlayer() {
  const [tracks, setTracks] = useState<AudioTrack[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    loadTracks();
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => nextTrack();

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [currentTrackIndex]);

  async function loadTracks() {
    const { data } = await supabase
      .from('orientale_musique_audio_tracks')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (data) {
      setTracks(data);
    }
  }

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  }

  function nextTrack() {
    setCurrentTrackIndex((prev) => (prev + 1) % tracks.length);
    setIsPlaying(true);
    setTimeout(() => audioRef.current?.play(), 100);
  }

  function previousTrack() {
    setCurrentTrackIndex((prev) => (prev - 1 + tracks.length) % tracks.length);
    setIsPlaying(true);
    setTimeout(() => audioRef.current?.play(), 100);
  }

  function handleSeek(e: React.ChangeEvent<HTMLInputElement>) {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  }

  function handleVolumeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  }

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  if (tracks.length === 0) {
    return null;
  }

  const currentTrack = tracks[currentTrackIndex];

  return (
    <section className="py-20 relative bg-gradient-to-b from-black via-amber-950/10 to-black overflow-hidden">
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: 'radial-gradient(circle, #FFD700 1px, transparent 1px)',
        backgroundSize: '40px 40px'
      }} />

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-gradient-to-r from-amber-600 to-yellow-600 text-black border-0 px-6 py-2 text-base shadow-lg shadow-amber-600/30">
            <Music2 className="w-4 h-4 mr-2" />
            Écouter Notre Album
          </Badge>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-300 bg-clip-text text-transparent">
            Collection Prestige
          </h2>
          <p className="text-lg md:text-xl text-amber-200/70 max-w-3xl mx-auto">
            Découvrez nos compositions exclusives qui sublimeront votre événement
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
          <Card className="bg-gradient-to-br from-amber-950/60 via-amber-900/30 to-black border-2 border-amber-700/40 backdrop-blur-xl shadow-2xl shadow-amber-900/30 overflow-hidden">
            <CardContent className="p-0">
              <div className="grid md:grid-cols-2 gap-0">
                {/* Carrousel d'images */}
                <div className="relative aspect-square md:aspect-auto overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-900/20 to-black/40 z-10" />
                  <img
                    src={currentTrack.cover_image_url || '/image_(4).png'}
                    alt={currentTrack.title}
                    className="w-full h-full object-cover transition-all duration-700"
                    style={{
                      filter: isPlaying ? 'brightness(1.1) saturate(1.2)' : 'brightness(0.9)'
                    }}
                  />

                  {isPlaying && (
                    <div className="absolute inset-0 flex items-center justify-center z-20">
                      <div className="w-32 h-32 rounded-full border-4 border-amber-400/40 animate-spin" style={{ animationDuration: '3s' }}>
                        <Disc3 className="w-full h-full text-amber-400/30" />
                      </div>
                    </div>
                  )}

                  {/* Miniatures des autres tracks */}
                  <div className="absolute bottom-4 left-4 right-4 z-30 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {tracks.map((track, index) => (
                      <button
                        key={track.id}
                        onClick={() => {
                          setCurrentTrackIndex(index);
                          setIsPlaying(true);
                          setTimeout(() => audioRef.current?.play(), 100);
                        }}
                        className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                          index === currentTrackIndex
                            ? 'border-amber-400 scale-110 shadow-lg shadow-amber-600/50'
                            : 'border-amber-700/30 hover:border-amber-500 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img
                          src={track.cover_image_url || '/image_(4).png'}
                          alt={track.title}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Contrôles du lecteur */}
                <div className="p-8 flex flex-col justify-between bg-gradient-to-br from-black/90 to-amber-950/20">
                  {/* Info du morceau */}
                  <div className="mb-6">
                    <h3 className="text-2xl font-bold text-amber-200 mb-2">{currentTrack.title}</h3>
                    <p className="text-amber-400/70 mb-1">{currentTrack.artist}</p>
                    {currentTrack.album && (
                      <Badge variant="outline" className="border-amber-700/50 text-amber-500 text-xs">
                        {currentTrack.album}
                      </Badge>
                    )}
                  </div>

                  {/* Barre de progression */}
                  <div className="mb-6">
                    <input
                      type="range"
                      min="0"
                      max={duration || 0}
                      value={currentTime}
                      onChange={handleSeek}
                      className="w-full h-2 bg-amber-900/30 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-r [&::-webkit-slider-thumb]:from-amber-500 [&::-webkit-slider-thumb]:to-yellow-500 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-amber-600/50"
                    />
                    <div className="flex justify-between text-xs text-amber-500/60 mt-2">
                      <span>{formatTime(currentTime)}</span>
                      <span>{formatTime(duration)}</span>
                    </div>
                  </div>

                  {/* Boutons de contrôle */}
                  <div className="flex items-center justify-center gap-4 mb-6">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={previousTrack}
                      className="text-amber-400 hover:text-amber-300 hover:bg-amber-900/20"
                    >
                      <SkipBack className="w-6 h-6" />
                    </Button>

                    <Button
                      size="icon"
                      onClick={togglePlay}
                      className="w-16 h-16 rounded-full bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 shadow-xl shadow-amber-900/50"
                    >
                      {isPlaying ? (
                        <Pause className="w-8 h-8 text-black" />
                      ) : (
                        <Play className="w-8 h-8 text-black ml-1" />
                      )}
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={nextTrack}
                      className="text-amber-400 hover:text-amber-300 hover:bg-amber-900/20"
                    >
                      <SkipForward className="w-6 h-6" />
                    </Button>
                  </div>

                  {/* Contrôle du volume */}
                  <div className="flex items-center gap-3">
                    <Volume2 className="w-5 h-5 text-amber-500" />
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={volume}
                      onChange={handleVolumeChange}
                      className="flex-1 h-1 bg-amber-900/30 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-500"
                    />
                  </div>

                  {/* Liste des tracks */}
                  <div className="mt-6 max-h-40 overflow-y-auto scrollbar-thin scrollbar-thumb-amber-700 scrollbar-track-amber-950/20">
                    {tracks.map((track, index) => (
                      <button
                        key={track.id}
                        onClick={() => {
                          setCurrentTrackIndex(index);
                          setIsPlaying(true);
                          setTimeout(() => audioRef.current?.play(), 100);
                        }}
                        className={`w-full text-left p-2 rounded transition-all ${
                          index === currentTrackIndex
                            ? 'bg-amber-900/30 text-amber-300'
                            : 'text-amber-500/60 hover:bg-amber-900/10 hover:text-amber-400'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold w-6">{index + 1}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm truncate">{track.title}</p>
                          </div>
                          <span className="text-xs">{formatTime(track.duration_seconds)}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <audio
        ref={audioRef}
        src={currentTrack?.audio_url}
        preload="metadata"
      />
    </section>
  );
}
