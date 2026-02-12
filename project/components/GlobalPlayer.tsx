'use client';

import { usePlayer } from '@/contexts/PlayerContext';
import { usePathname } from 'next/navigation';
import { SmartVideoPlayer } from './SmartVideoPlayer';
import { Button } from './ui/button';
import { X, Maximize2, Volume2, VolumeX, Play, Pause, Tv } from 'lucide-react';
import { Slider } from './ui/slider';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AltosLogoMinimal } from './AltosLogo';

export function GlobalPlayer() {
  const pathname = usePathname();
  const {
    currentMedia,
    isPlayerOpen,
    setIsPlayerOpen,
    isPlaying,
    setIsPlaying,
    volume,
    setVolume,
    isMuted,
    setIsMuted,
    mode,
    playerRef,
    userHasInteracted,
    setUserHasInteracted,
    savedPlaybackTime,
    currentProgramStartTime,
    getLivePlaybackTime,
  } = usePlayer();

  const [playerContainer, setPlayerContainer] = useState<HTMLElement | null>(null);
  const [previousMode, setPreviousMode] = useState<'mini' | 'full' | null>(null);
  const isHomePage = pathname === '/';
  const shouldShowPlayer = currentMedia && isPlayerOpen;
  const isMiniMode = !isHomePage && shouldShowPlayer;
  const isFullMode = isHomePage && shouldShowPlayer;
  const currentMode = isMiniMode ? 'mini' : isFullMode ? 'full' : null;

  useEffect(() => {
    if (isHomePage) {
      const container = document.getElementById('home-player-container');
      setPlayerContainer(container);
    } else {
      setPlayerContainer(null);
    }
  }, [isHomePage]);

  const togglePlayPause = () => {
    if (playerRef.current) {
      if (isPlaying) {
        if (typeof playerRef.current.pause === 'function') {
          playerRef.current.pause();
        }
        setIsPlaying(false);
      } else {
        if (typeof playerRef.current.play === 'function') {
          playerRef.current.play();
        }
        setIsPlaying(true);
      }
    }
  };

  useEffect(() => {
    if (!playerRef.current) return;

    const applyVolume = () => {
      if (typeof playerRef.current?.setVolume === 'function') {
        playerRef.current.setVolume(isMuted ? 0 : volume / 100);
      }

      if (isMuted) {
        if (typeof playerRef.current?.mute === 'function') {
          playerRef.current.mute();
        }
      } else {
        if (typeof playerRef.current?.unmute === 'function') {
          playerRef.current.unmute();
        }
      }
    };

    applyVolume();

    const timer = setTimeout(applyVolume, 100);
    return () => clearTimeout(timer);
  }, [volume, isMuted, playerRef, currentMedia]);

  // Re-apply volume when switching between mini and full mode
  useEffect(() => {
    if (currentMode !== previousMode && currentMode !== null) {
      setPreviousMode(currentMode);

      setTimeout(() => {
        if (playerRef.current) {
          if (typeof playerRef.current.setVolume === 'function') {
            playerRef.current.setVolume(isMuted ? 0 : volume / 100);
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
          if (isPlaying) {
            if (typeof playerRef.current.play === 'function') {
              playerRef.current.play();
            }
          }
        }
      }, 100);
    }
  }, [currentMode, previousMode, volume, isMuted, isPlaying]);

  // Force live sync every 10 seconds when in live mode
  useEffect(() => {
    if (!currentProgramStartTime || !playerRef.current) return;

    const syncInterval = setInterval(() => {
      if (playerRef.current && typeof playerRef.current.seekTo === 'function' && typeof playerRef.current.getCurrentTime === 'function') {
        const liveTime = getLivePlaybackTime();
        const currentTime = playerRef.current.getCurrentTime();

        // Only sync if drift is more than 3 seconds
        if (Math.abs(liveTime - currentTime) > 3) {
          console.log('🔄 [Live Sync] Correcting drift:', { liveTime, currentTime, drift: liveTime - currentTime });
          playerRef.current.seekTo(liveTime, true);
        }
      }
    }, 10000);

    return () => clearInterval(syncInterval);
  }, [currentProgramStartTime, getLivePlaybackTime]);

  if (!shouldShowPlayer || mode !== 'tv') return null;

  const playerContent = (
    <div
      id="global-player"
      className={`${
        isMiniMode
          ? 'fixed bottom-6 right-6 w-96 z-50 md:w-96 sm:w-[calc(100vw-2rem)]'
          : 'absolute inset-0'
      } bg-gradient-to-br from-black via-gray-900 to-black transition-all duration-300 ease-in-out`}
      style={
        isMiniMode
          ? {
              borderRadius: '24px',
              boxShadow: '0 30px 60px -12px rgba(251, 191, 36, 0.3), 0 0 0 1px rgba(251, 191, 36, 0.15)',
            }
          : {
              borderRadius: '0 0 24px 24px'
            }
      }
    >
        {isMiniMode && (
          <div className="bg-gradient-to-r from-amber-500/20 to-amber-600/20 backdrop-blur-md border-b border-amber-500/20 p-3 flex items-center justify-between" style={{ borderRadius: '24px 24px 0 0' }}>
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-white font-medium text-sm truncate">
                {currentMedia.title || 'WebTV Live'}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white hover:bg-white/10"
                onClick={() => {
                  window.location.href = '/';
                }}
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white hover:bg-white/10"
                onClick={() => setIsPlayerOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        <div
          className={`relative bg-black ${
            isMiniMode ? 'aspect-video' : 'w-full h-full'
          }`}
          style={{
            overflow: 'hidden',
            borderRadius: isMiniMode ? '0 0 20px 20px' : '0 0 24px 24px'
          }}
        >
          {currentMedia.source_url && (
            <>
              <SmartVideoPlayer
                key={`global-player-${currentMedia.id}`}
                ref={playerRef}
                url={currentMedia.source_url}
                title={currentMedia.title || 'WebTV Live'}
                className="w-full h-full"
                startTimeOffset={currentProgramStartTime ? getLivePlaybackTime() : savedPlaybackTime}
                initialVolume={isMuted ? 0 : volume / 100}
                initialMuted={isMuted}
                onEnded={() => {
                  setIsPlaying(false);
                }}
              />
              <div className={`absolute ${isMiniMode ? 'top-2 left-2' : 'top-6 left-6'} z-10 flex items-center gap-2 opacity-90 hover:opacity-100 transition-opacity`}>
                {isMiniMode ? (
                  <div className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500/20 to-amber-600/20 backdrop-blur-md px-2 py-1 rounded-lg border border-amber-500/30">
                    <Tv className="w-3 h-3 text-amber-400" />
                    <span className="text-white font-bold text-xs tracking-wider">Votre Altesse TV</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 bg-gradient-to-r from-amber-500/20 to-amber-600/20 backdrop-blur-md px-4 py-2 rounded-xl border border-amber-500/30">
                    <Tv className="w-5 h-5 text-amber-400" />
                    <span className="text-white font-bold text-lg tracking-wider drop-shadow-lg">Votre Altesse TV</span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {isMiniMode && (
          <div className="bg-gradient-to-t from-black/95 to-black/80 backdrop-blur-sm p-4 sm:p-6 border-t border-amber-500/10" style={{ borderRadius: '0 0 24px 24px' }}>
            <div className="flex items-center gap-3 sm:gap-4">
              <Button
                size="icon"
                className="h-11 w-11 sm:h-12 sm:w-12 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-lg shadow-amber-500/30 touch-target"
                onClick={() => {
                  setUserHasInteracted(true);
                  togglePlayPause();
                }}
              >
                {isPlaying ? (
                  <Pause className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                ) : (
                  <Play className="h-5 w-5 sm:h-6 sm:w-6 ml-0.5 text-white" />
                )}
              </Button>

              <Button
                size="icon"
                variant="ghost"
                className="h-11 w-11 sm:h-10 sm:w-10 text-white/80 hover:text-white hover:bg-white/10 touch-target"
                onClick={() => {
                  setUserHasInteracted(true);
                  if (isMuted && volume === 0) {
                    setVolume(50);
                    setIsMuted(false);
                  } else if (isMuted) {
                    setIsMuted(false);
                  } else {
                    setIsMuted(true);
                  }
                }}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </Button>

              <div className="flex-1">
                <Slider
                  value={[isMuted ? 0 : volume]}
                  onValueChange={(value) => {
                    setUserHasInteracted(true);
                    const newVolume = value[0];
                    setVolume(newVolume);
                    if (newVolume > 0) {
                      setIsMuted(false);
                    } else {
                      setIsMuted(true);
                    }
                  }}
                  max={100}
                  step={1}
                  className="[&_[role=slider]]:bg-gradient-to-r [&_[role=slider]]:from-amber-400 [&_[role=slider]]:to-amber-600 [&_[role=slider]]:shadow-md [&_[role=slider]]:border [&_[role=slider]]:border-white/20 [&_[role=slider]]:w-3 [&_[role=slider]]:h-3 [&>.relative]:h-1.5 [&>.relative]:bg-white/20"
                />
              </div>

              <div className="flex items-center gap-1 text-amber-500">
                <Tv className="w-4 h-4" />
              </div>
            </div>
          </div>
        )}
      </div>
  );

  if (isFullMode && playerContainer) {
    return createPortal(playerContent, playerContainer);
  }

  if (isMiniMode) {
    return playerContent;
  }

  return null;
}
