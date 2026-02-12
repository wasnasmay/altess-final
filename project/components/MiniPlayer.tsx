'use client';

import { usePlayer } from '@/contexts/PlayerContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Maximize2, Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { SmartVideoPlayer } from '@/components/SmartVideoPlayer';
import { Slider } from '@/components/ui/slider';
import { Card } from '@/components/ui/card';

export default function MiniPlayer() {
  const router = useRouter();
  const pathname = usePathname();
  const {
    currentMedia,
    isPlaying,
    setIsPlaying,
    volume,
    setVolume,
    isMuted,
    setIsMuted,
    setIsPlayerOpen,
    playerRef,
    mode,
    setUserHasInteracted,
    isPlayerOpen,
    savedPlaybackTime,
  } = usePlayer();

  // Show mini player only when NOT on home page and has media
  const showMiniPlayer = pathname !== '/' && isPlayerOpen && currentMedia;

  if (!showMiniPlayer) {
    return null;
  }

  const togglePlayPause = () => {
    if (playerRef.current) {
      if (typeof playerRef.current.pause === 'function' && typeof playerRef.current.play === 'function') {
        if (isPlaying) {
          playerRef.current.pause();
        } else {
          playerRef.current.play();
        }
      }
    }
    setIsPlaying(!isPlaying);
  };

  const handleClose = () => {
    if (playerRef.current && typeof playerRef.current.pause === 'function') {
      playerRef.current.pause();
    }
    setIsPlayerOpen(false);
    setIsPlaying(false);
  };

  const handleMaximize = () => {
    router.push('/');
  };

  const handleVolumeToggle = () => {
    setUserHasInteracted(true);
    if (isMuted && volume === 0) {
      setVolume(50);
      setIsMuted(false);
    } else if (isMuted) {
      setIsMuted(false);
    } else {
      setIsMuted(true);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    setUserHasInteracted(true);
    const newVolume = value[0];
    setVolume(newVolume);
    if (newVolume > 0) {
      setIsMuted(false);
    } else {
      setIsMuted(true);
    }
  };

  // Apply volume and mute to player
  useEffect(() => {
    if (playerRef.current) {
      if (typeof playerRef.current.setVolume === 'function') {
        playerRef.current.setVolume(volume);
      }
      if (isMuted) {
        if (typeof playerRef.current.mute === 'function') {
          playerRef.current.mute();
        }
      } else {
        if (typeof playerRef.current.unmute === 'function') {
          playerRef.current.unmute();
        }
      }
    }
  }, [volume, isMuted, playerRef]);

  return (
    <div className="fixed bottom-6 right-6 z-[99999] w-96" style={{
      transform: 'translate3d(0, 0, 0)',
      WebkitTransform: 'translate3d(0, 0, 0)',
      backfaceVisibility: 'hidden',
      WebkitBackfaceVisibility: 'hidden'
    }}>
    <Card className="overflow-hidden border-0 w-full" style={{
      borderRadius: '28px',
      boxShadow: '0 30px 80px -15px rgba(0, 0, 0, 0.9), 0 10px 40px -10px rgba(0, 0, 0, 0.7), 0 0 0 4px rgba(245, 158, 11, 0.3), inset 0 0 0 2px rgba(255, 255, 255, 0.1)',
      background: 'linear-gradient(145deg, #1a1a1a 0%, #0a0a0a 100%)',
      border: '4px solid rgba(245, 158, 11, 0.4)'
    }}>
      {/* Header - Modern TV Style */}
      <div className="bg-gradient-to-r from-amber-500/20 via-amber-600/10 to-amber-500/20 backdrop-blur-xl border-b-2 border-amber-500/30 p-4 flex items-center justify-between relative overflow-hidden shadow-lg" style={{ transform: 'translateZ(0)' }}>
        <div className="flex items-center gap-3 flex-1 min-w-0 relative z-10">
          <div className="flex items-center gap-2 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-full border border-red-500/30">
            <div className="w-2.5 h-2.5 bg-red-500 rounded-full shadow-lg shadow-red-500/80" style={{ animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}></div>
            <div className="text-[11px] font-black text-red-500 tracking-wider">EN DIRECT</div>
          </div>
          <span className="text-white font-bold text-sm truncate tracking-wide drop-shadow-lg">
            {currentMedia.title || 'WebTV Live'}
          </span>
        </div>
        <div className="flex items-center gap-2 relative z-10">
          <Button
            size="icon"
            variant="ghost"
            className="h-10 w-10 hover:bg-amber-500/30 text-white rounded-xl transition-all duration-300 hover:scale-110 border border-amber-500/20 shadow-lg"
            onClick={handleMaximize}
            title="Retour à la WebTV"
          >
            <Maximize2 className="h-5 w-5 drop-shadow-lg" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-10 w-10 hover:bg-red-500/30 text-white rounded-xl transition-all duration-300 hover:scale-110 border border-red-500/20 shadow-lg"
            onClick={handleClose}
            title="Fermer"
          >
            <X className="h-5 w-5 drop-shadow-lg" />
          </Button>
        </div>
      </div>

      {/* Video Player - Modern TV Screen */}
      <div className="relative aspect-video bg-black group" style={{
        overflow: 'hidden',
        boxShadow: 'inset 0 0 40px rgba(0, 0, 0, 0.8)'
      }}>
        {mode === 'tv' && currentMedia.source_url && (
          <SmartVideoPlayer
            key={`mini-player-${currentMedia.id}`}
            ref={playerRef}
            url={currentMedia.source_url}
            title={currentMedia.title || 'WebTV Live'}
            className="w-full h-full"
            startTimeOffset={0}
            initialVolume={isMuted ? 0 : volume / 100}
            initialMuted={isMuted}
            onEnded={() => {
              setIsPlaying(false);
            }}
          />
        )}

        {mode === 'radio' && currentMedia.source_url && (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-amber-500/20 via-gray-900 to-black">
            <audio
              ref={playerRef}
              src={currentMedia.source_url}
              autoPlay={isPlaying}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />
            {currentMedia.thumbnail_url ? (
              <img
                src={currentMedia.thumbnail_url}
                alt={currentMedia.title || 'WebRadio'}
                className="w-32 h-32 rounded-2xl shadow-2xl object-cover"
                style={{
                  boxShadow: '0 20px 40px rgba(245, 158, 11, 0.3)',
                  transform: 'translateZ(0)',
                  backfaceVisibility: 'hidden'
                }}
              />
            ) : (
              <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-2xl">
                <Volume2 className="w-16 h-16 text-white" />
              </div>
            )}
          </div>
        )}

        {/* Enhanced Controls - ULTRA VISIBLE - Always On Top */}
        <div
          className="absolute bottom-0 left-0 right-0 z-[9999] pointer-events-auto"
          style={{
            transform: 'translateZ(100px)',
            position: 'absolute'
          }}
        >
          <div className="bg-gradient-to-t from-black via-black to-transparent backdrop-blur-2xl p-6 border-t-4 border-amber-500"
            style={{
              boxShadow: '0 -20px 60px rgba(0, 0, 0, 0.9), inset 0 4px 20px rgba(245, 158, 11, 0.3)'
            }}
          >
            <div className="flex items-center gap-5">
              {/* Play/Pause - ULTRA VISIBLE */}
              <Button
                size="icon"
                variant="ghost"
                className="w-20 h-20 rounded-3xl transition-all duration-300 hover:scale-110 shrink-0 group/play"
                onClick={() => {
                  setUserHasInteracted(true);
                  togglePlayPause();
                }}
                style={{
                  background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)',
                  boxShadow: '0 16px 48px rgba(251, 191, 36, 0.9), 0 8px 24px rgba(217, 119, 6, 0.8), inset 0 -3px 12px rgba(0, 0, 0, 0.5), 0 0 0 4px rgba(255, 255, 255, 0.25)',
                  border: '3px solid rgba(255, 255, 255, 0.3)'
                }}
              >
                {isPlaying ? (
                  <Pause className="w-9 h-9 text-white drop-shadow-2xl" style={{ filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.8))' }} />
                ) : (
                  <Play className="w-9 h-9 ml-1 text-white drop-shadow-2xl" style={{ filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.8))' }} />
                )}
              </Button>

              {/* Volume - ULTRA VISIBLE */}
              <div className="flex items-center gap-4 flex-1 bg-gradient-to-r from-black via-gray-900 to-black backdrop-blur-2xl rounded-3xl px-6 py-4 shadow-2xl"
                style={{
                  border: '3px solid rgba(245, 158, 11, 0.6)',
                  boxShadow: '0 12px 40px rgba(0, 0, 0, 0.9), inset 0 2px 10px rgba(245, 158, 11, 0.2)'
                }}
              >
                <Button
                  size="icon"
                  variant="ghost"
                  className="w-14 h-14 rounded-2xl transition-all duration-300 hover:scale-110 shrink-0"
                  onClick={handleVolumeToggle}
                  style={{
                    background: isMuted || volume === 0
                      ? 'linear-gradient(135deg, #374151 0%, #1f2937 100%)'
                      : 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                    border: '3px solid rgba(255, 255, 255, 0.2)',
                    boxShadow: isMuted || volume === 0
                      ? '0 8px 24px rgba(0, 0, 0, 0.6)'
                      : '0 8px 24px rgba(245, 158, 11, 0.6)'
                  }}
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-7 h-7 text-white" style={{ filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.8))' }} />
                  ) : (
                    <Volume2 className="w-7 h-7 text-white" style={{ filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.8))' }} />
                  )}
                </Button>

                <div className="flex-1 relative group/volume min-w-0 py-2">
                  <Slider
                    value={[isMuted ? 0 : volume]}
                    onValueChange={handleVolumeChange}
                    max={100}
                    step={1}
                    className="cursor-pointer [&_[role=slider]]:w-8 [&_[role=slider]]:h-8 [&_[role=slider]]:cursor-grab [&_[role=slider]]:active:cursor-grabbing [&_[role=slider]]:active:scale-110 [&>.relative]:h-4 [&>.relative]:bg-white/20 [&>.relative]:border-2 [&>.relative]:border-white/30 [&>.relative]:rounded-full [&>.relative]:overflow-hidden [&_span]:rounded-full [&_span]:h-full"
                    style={{
                      height: '24px'
                    }}
                  />
                  <style dangerouslySetInnerHTML={{
                    __html: `
                      .group\\/volume [role=slider] {
                        background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%) !important;
                        border: 4px solid rgba(255, 255, 255, 0.8) !important;
                        box-shadow: 0 8px 32px rgba(251, 191, 36, 0.9), 0 4px 16px rgba(217, 119, 6, 0.8) !important;
                      }
                      .group\\/volume span[data-orientation="horizontal"] {
                        background: linear-gradient(90deg, #fbbf24 0%, #f59e0b 100%) !important;
                        box-shadow: 0 0 20px rgba(251, 191, 36, 0.8) !important;
                      }
                    `
                  }} />

                  <div className="absolute -top-16 left-1/2 -translate-x-1/2 px-5 py-3 rounded-2xl opacity-0 group-hover/volume:opacity-100 transition-all duration-300 pointer-events-none z-[100]"
                    style={{
                      background: 'linear-gradient(135deg, #000000 0%, #1f2937 100%)',
                      border: '3px solid rgba(245, 158, 11, 0.8)',
                      boxShadow: '0 12px 40px rgba(0, 0, 0, 0.9), 0 0 30px rgba(245, 158, 11, 0.4)'
                    }}
                  >
                    <div className="text-white text-lg font-black tracking-wider" style={{ textShadow: '0 2px 8px rgba(0, 0, 0, 0.8)' }}>
                      {Math.round(isMuted ? 0 : volume)}%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
    </div>
  );
}
