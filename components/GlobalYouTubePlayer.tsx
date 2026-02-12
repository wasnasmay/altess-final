"use client";

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { YouTubePlayer, YouTubePlayerHandle } from './YouTubePlayer';
import { usePlayer } from '@/contexts/PlayerContext';
import { Button } from './ui/button';
import { X, Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { Slider } from './ui/slider';
import { supabase } from '@/lib/supabase';

export function GlobalYouTubePlayer() {
  const pathname = usePathname();
  const {
    currentVideoId,
    setCurrentVideoId,
    onVideoEnd,
    volume,
    setVolume,
    isMuted,
    setIsMuted,
    playerRef: globalPlayerRef,
    savedPlaybackTime,
    setSavedPlaybackTime,
    isPlaying,
    setIsPlaying,
    startTimeOffset,
    userHasInteracted,
    setUserHasInteracted,
    currentProgramStartTime,
    getLivePlaybackTime,
  } = usePlayer();

  const [isMounted, setIsMounted] = useState(false);
  const [effectiveStartTime, setEffectiveStartTime] = useState(startTimeOffset);
  const [newsText, setNewsText] = useState('En direct - WebTV Orientale Musique - Programmation continue 24h/24');
  const [tickerSpeed, setTickerSpeed] = useState('25s');
  const [tickerColor, setTickerColor] = useState('amber');
  const [tickerEnabled, setTickerEnabled] = useState(true);
  const [liveVideoId, setLiveVideoId] = useState<string | null>(null);
  const [anchorBounds, setAnchorBounds] = useState<DOMRect | null>(null);
  const [scrollY, setScrollY] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const playerRef = useRef<YouTubePlayerHandle>(null);
  const timeUpdateInterval = useRef<NodeJS.Timeout | null>(null);
  const syncInterval = useRef<NodeJS.Timeout | null>(null);
  const controlsTimeout = useRef<NodeJS.Timeout | null>(null);

  const isHomePage = pathname === '/';
  const shouldBeSticky = !isHomePage || scrollY > 200;

  // Auto-hide controls after 2 seconds of inactivity on mini-player
  useEffect(() => {
    if (shouldBeSticky && showControls) {
      if (controlsTimeout.current) {
        clearTimeout(controlsTimeout.current);
      }
      controlsTimeout.current = setTimeout(() => {
        setShowControls(false);
      }, 2000);
    }
    return () => {
      if (controlsTimeout.current) {
        clearTimeout(controlsTimeout.current);
      }
    };
  }, [shouldBeSticky, showControls, isHovered]);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  useEffect(() => {
    if (isHomePage) {
      const updateAnchorPosition = () => {
        const anchor = document.getElementById('youtube-player-anchor');
        if (anchor) {
          const bounds = anchor.getBoundingClientRect();
          setAnchorBounds(bounds);
        } else {
          setAnchorBounds(null);
        }
      };

      // Mise à jour immédiate
      updateAnchorPosition();

      // Réessayer après un court délai pour s'assurer que le DOM est complètement rendu
      const timeoutId = setTimeout(updateAnchorPosition, 50);
      const timeoutId2 = setTimeout(updateAnchorPosition, 200);

      const resizeObserver = new ResizeObserver(updateAnchorPosition);
      const anchor = document.getElementById('youtube-player-anchor');
      if (anchor) resizeObserver.observe(anchor);

      window.addEventListener('resize', updateAnchorPosition);
      window.addEventListener('scroll', updateAnchorPosition, { passive: true });

      return () => {
        clearTimeout(timeoutId);
        clearTimeout(timeoutId2);
        resizeObserver.disconnect();
        window.removeEventListener('resize', updateAnchorPosition);
        window.removeEventListener('scroll', updateAnchorPosition);
      };
    }
  }, [isHomePage]);

  // Force la détection de l'ancre dès qu'un videoId est disponible
  useEffect(() => {
    if (isHomePage && currentVideoId) {
      console.log('🔍 [GlobalYouTubePlayer] Tentative détection ancre, currentVideoId:', currentVideoId);

      const forceAnchorDetection = () => {
        const anchor = document.getElementById('youtube-player-anchor');

        if (anchor) {
          // Force un reflow complet
          void anchor.offsetHeight;

          const bounds = anchor.getBoundingClientRect();

          // Créer un objet DOMRect avec les bonnes valeurs
          const finalBounds = {
            width: bounds.width,
            height: bounds.height,
            top: bounds.top,
            left: bounds.left,
            right: bounds.right,
            bottom: bounds.bottom,
            x: bounds.x,
            y: bounds.y,
            toJSON: () => ({})
          } as DOMRect;

          console.log('📐 Dimensions détectées:', finalBounds.width, 'x', finalBounds.height);
          setAnchorBounds(finalBounds);
        }
      };

      // Détection immédiate et retries agressifs
      forceAnchorDetection();
      const t1 = setTimeout(forceAnchorDetection, 10);
      const t2 = setTimeout(forceAnchorDetection, 50);
      const t3 = setTimeout(forceAnchorDetection, 100);
      const t4 = setTimeout(forceAnchorDetection, 300);
      const t5 = setTimeout(forceAnchorDetection, 500);
      const t6 = setTimeout(forceAnchorDetection, 1000);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
        clearTimeout(t4);
        clearTimeout(t5);
        clearTimeout(t6);
      };
    }
  }, [isHomePage, currentVideoId]);

  useEffect(() => {
    setIsMounted(true);
    loadTickerSettings();

    const channel = supabase
      .channel('ticker-settings')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'webtv_ticker_settings',
        },
        (payload) => {
          if (payload.new) {
            const settings = payload.new as any;
            setNewsText(settings.text);
            setTickerEnabled(settings.is_enabled);
            setTickerColor(settings.color);
            setLiveVideoId(settings.live_video_id);
            const speedMap: Record<string, string> = {
              slow: '35s',
              medium: '25s',
              fast: '15s',
            };
            setTickerSpeed(speedMap[settings.speed] || '25s');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadTickerSettings = async () => {
    try {
      const { data } = await supabase
        .from('webtv_ticker_settings')
        .select('*')
        .single();

      if (data) {
        setNewsText(data.text);
        setTickerEnabled(data.is_enabled);
        setTickerColor(data.color);
        setLiveVideoId(data.live_video_id);
        const speedMap: Record<string, string> = {
          slow: '35s',
          medium: '25s',
          fast: '15s',
        };
        setTickerSpeed(speedMap[data.speed] || '25s');
      }
    } catch (error) {
      console.error('Erreur chargement ticker:', error);
    }
  };

  useEffect(() => {
    setEffectiveStartTime(startTimeOffset);
  }, [startTimeOffset]);

  useEffect(() => {
    if (playerRef.current) {
      globalPlayerRef.current = playerRef.current;
    }
  }, [globalPlayerRef]);

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
        if (typeof playerRef.current.unMute === 'function') {
          playerRef.current.unMute();
        }
      }
    }
  }, [volume, isMuted]);

  useEffect(() => {
    if (timeUpdateInterval.current) {
      clearInterval(timeUpdateInterval.current);
    }

    if (currentVideoId) {
      timeUpdateInterval.current = setInterval(() => {
        if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
          const time = playerRef.current.getCurrentTime();
          if (time > 0.5) {
            setSavedPlaybackTime(time);
          }
        }
      }, 1000);
    }

    return () => {
      if (timeUpdateInterval.current) {
        clearInterval(timeUpdateInterval.current);
      }
    };
  }, [currentVideoId, setSavedPlaybackTime]);

  useEffect(() => {
    if (syncInterval.current) {
      clearInterval(syncInterval.current);
    }

    // CONTINUITÉ DU DIRECT : Resynchronisation automatique avec l'heure système
    // Toutes les 30 secondes, on recalcule la position en fonction du temps écoulé
    if (currentVideoId && !liveVideoId && currentProgramStartTime) {
      syncInterval.current = setInterval(() => {
        if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
          const liveTime = getLivePlaybackTime();
          const currentTime = playerRef.current.getCurrentTime?.() || 0;

          // Ne resync que si l'écart est supérieur à 5 secondes (évite les saccades)
          const drift = Math.abs(currentTime - liveTime);
          if (drift > 5) {
            console.log('🔄 [Sync Auto] Resynchronisation:', { currentTime, liveTime, drift });
            playerRef.current.seekTo(liveTime, true);
          }
        }
      }, 30000); // Toutes les 30 secondes
    }

    return () => {
      if (syncInterval.current) {
        clearInterval(syncInterval.current);
      }
    };
  }, [currentVideoId, liveVideoId, currentProgramStartTime, getLivePlaybackTime]);

  const handleClosePlayer = () => {
    if (playerRef.current && typeof playerRef.current.pauseVideo === 'function') {
      playerRef.current.pauseVideo();
    }
    setIsPlaying(false);
    setCurrentVideoId(null);
  };

  const togglePlayPause = () => {
    setUserHasInteracted(true);
    if (playerRef.current) {
      if (isPlaying) {
        if (typeof playerRef.current.pauseVideo === 'function') {
          playerRef.current.pauseVideo();
        }
      } else {
        if (typeof playerRef.current.playVideo === 'function') {
          playerRef.current.playVideo();
        }
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleVolumeToggle = () => {
    setUserHasInteracted(true);
    if (isMuted && volume === 0) {
      setVolume(70);
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

  const handleMouseActivity = () => {
    if (shouldBeSticky) {
      setShowControls(true);
    }
  };

  const isAnchored = isHomePage && !shouldBeSticky;

  // BRUTE FORCE: Affichage immédiat dès que vidéo existe
  if (!isMounted || !currentVideoId) {
    return null;
  }

  // CONTINUITÉ DU DIRECT : Calculer le temps de démarrage basé sur l'heure système
  const calculatedStartTime = liveVideoId
    ? 0
    : (currentProgramStartTime ? getLivePlaybackTime() : effectiveStartTime);

  // PERSISTANCE AUDIO : Toujours utiliser position fixed (jamais de portal qui remonte le composant)
  // Calculer les coordonnées en fonction de l'ancre ou du mini-player
  let positionStyle: React.CSSProperties;

  if (shouldBeSticky) {
    // Mini-player en bas à droite
    positionStyle = {
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      left: 'auto',
      top: 'auto',
      width: '320px',
      height: '180px',
      zIndex: 9999,
    };
  } else if (isAnchored && anchorBounds) {
    // Positionné dans l'ancre via fixed avec coordonnées calculées
    positionStyle = {
      position: 'fixed',
      top: `${anchorBounds.top}px`,
      left: `${anchorBounds.left}px`,
      width: `${anchorBounds.width}px`,
      height: `${anchorBounds.height}px`,
      zIndex: 10,
    };
  } else {
    // Fallback: caché en attendant les coordonnées
    positionStyle = {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      zIndex: 10,
      opacity: 0,
      pointerEvents: 'none',
    };
  }

  return (
    <div
      id="global-youtube-player-container"
      onMouseMove={handleMouseActivity}
      style={{
        ...positionStyle,
        margin: 0,
        padding: 0,
        pointerEvents: 'auto',
        transition: shouldBeSticky ? 'width 0.3s ease, height 0.3s ease, bottom 0.3s ease, right 0.3s ease' : 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        opacity: (isAnchored && !anchorBounds) ? 0 : 1,
        visibility: (isAnchored && !anchorBounds) ? 'hidden' : 'visible',
        display: 'block',
        transform: 'translate3d(0, 0, 0)',
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          margin: 0,
          padding: 0,
          display: 'block',
          opacity: 1,
          visibility: 'visible',
          pointerEvents: 'auto',
        }}
      >
        {shouldBeSticky && (
          <div
            className={`absolute -top-12 right-0 flex items-center gap-3 bg-gradient-to-r backdrop-blur-md px-4 py-2.5 rounded-t-xl border-2 border-b-0 ${
              liveVideoId
                ? 'from-red-900/95 to-red-800/90 border-red-500/50'
                : 'from-black/95 to-black/90 border-amber-500/50'
            }`}
            style={{ zIndex: 52 }}
          >
            <div className={`w-2.5 h-2.5 rounded-full animate-pulse shadow-lg ${
              liveVideoId ? 'bg-red-500 shadow-red-500/50' : 'bg-red-500 shadow-red-500/50'
            }`}></div>
            <span className="text-white text-sm font-bold tracking-wide">
              {liveVideoId ? 'LIVE YOUTUBE' : 'EN DIRECT'}
            </span>
            <Button
              size="icon"
              variant="ghost"
              className={`h-7 w-7 ml-2 transition-all ${
                liveVideoId
                  ? 'hover:bg-red-500/30 text-red-400 hover:text-red-300'
                  : 'hover:bg-amber-500/30 text-amber-400 hover:text-amber-300'
              }`}
              onClick={handleClosePlayer}
              title="Fermer"
              style={{
                background: 'rgba(0, 0, 0, 0.5)',
                borderRadius: '50%',
                padding: '4px'
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        <div
          className="overflow-hidden group"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100%',
            height: '100%',
            margin: 0,
            padding: 0,
            display: 'block',
            visibility: 'visible',
            borderRadius: shouldBeSticky ? '12px' : (isAnchored ? '0 0 16px 16px' : '0'),
            boxShadow: shouldBeSticky
              ? '0 10px 30px rgba(0, 0, 0, 0.5)'
              : 'none',
            backgroundColor: '#000',
            pointerEvents: 'auto',
            overflow: 'hidden',
          }}
        >
          {isAnchored && (
            <div
              className={`absolute top-6 left-6 flex items-center gap-2 backdrop-blur-md px-3 py-2 rounded-lg border shadow-lg ${
                liveVideoId
                  ? 'bg-red-900/80 border-red-500/50 shadow-red-500/30'
                  : 'bg-black/80 border-red-500/50 shadow-red-500/30'
              }`}
              style={{ zIndex: 20 }}
            >
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-lg shadow-red-500/70"></div>
              <span className="text-white text-xs font-bold tracking-wider">
                {liveVideoId ? 'LIVE YOUTUBE' : 'EN DIRECT'}
              </span>
            </div>
          )}

          <div className="force-fullscreen-player" style={{
            display: 'block',
            zIndex: 5
          }}>
            <YouTubePlayer
              ref={playerRef}
              videoId={liveVideoId || currentVideoId}
              className="w-full h-full"
              startTimeOffset={calculatedStartTime}
              onEnd={onVideoEnd}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />
          </div>

{((shouldBeSticky && showControls) || (isAnchored && isHovered)) && (
            <div
              className="absolute left-0 right-0 bg-gradient-to-t from-black/95 via-black/90 to-transparent p-6 pt-16"
              style={{
                bottom: shouldBeSticky ? '32px' : '44px',
                zIndex: 15,
                pointerEvents: 'auto',
                opacity: shouldBeSticky ? (showControls ? 1 : 0) : (isHovered ? 1 : 0),
                transition: 'opacity 0.2s ease-out',
              }}
            >
              <div className="flex items-center gap-4 mb-4">
                <Button
                  size="icon"
                  className={`${shouldBeSticky ? 'h-11 w-11' : 'h-14 w-14'} rounded-full bg-gradient-to-br from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-xl shadow-amber-500/50 transition-all hover:scale-105`}
                  onClick={togglePlayPause}
                >
                  {isPlaying ? (
                    <Pause className={`${shouldBeSticky ? 'h-5 w-5' : 'h-6 w-6'} text-black`} />
                  ) : (
                    <Play className={`${shouldBeSticky ? 'h-5 w-5 ml-0.5' : 'h-6 w-6 ml-1'} text-black`} />
                  )}
                </Button>

                <Button
                  size="icon"
                  variant="ghost"
                  className={`${shouldBeSticky ? 'h-9 w-9' : 'h-11 w-11'} text-amber-400 hover:text-amber-300 hover:bg-amber-500/20 transition-all`}
                  onClick={handleVolumeToggle}
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className={`${shouldBeSticky ? 'h-5 w-5' : 'h-6 w-6'}`} />
                  ) : (
                    <Volume2 className={`${shouldBeSticky ? 'h-5 w-5' : 'h-6 w-6'}`} />
                  )}
                </Button>

                <div className="flex-1">
                  <Slider
                    value={[isMuted ? 0 : volume]}
                    onValueChange={handleVolumeChange}
                    max={100}
                    step={1}
                    className={`[&_[role=slider]]:bg-gradient-to-r [&_[role=slider]]:from-amber-400 [&_[role=slider]]:to-amber-600 [&_[role=slider]]:shadow-lg [&_[role=slider]]:border-2 [&_[role=slider]]:border-black/20 [&_[role=slider]]:w-4 [&_[role=slider]]:h-4 ${shouldBeSticky ? '[&>.relative]:h-2' : '[&>.relative]:h-2.5'} [&>.relative]:bg-white/20 [&>.relative]:rounded-full`}
                  />
                </div>
              </div>
            </div>
          )}

          {tickerEnabled && (shouldBeSticky || isAnchored) && (
            <div
              className="absolute bottom-0 left-0 right-0 bg-black/90 backdrop-blur-sm border-t border-amber-500/30 overflow-hidden"
              style={{
                height: shouldBeSticky ? '28px' : '44px',
                zIndex: 10,
              }}
            >
              <div
                className={`whitespace-nowrap text-${tickerColor}-400 ${shouldBeSticky ? 'text-sm' : 'text-base'} font-medium py-2 px-6`}
                style={{
                  animation: `scroll-left ${tickerSpeed} linear infinite`,
                }}
              >
                {newsText} • {newsText} • {newsText}
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes scroll-left {
          0% {
            transform: translateX(100%);
          }
          100% {
            transform: translateX(-100%);
          }
        }
      `}</style>
    </div>
  );
}
