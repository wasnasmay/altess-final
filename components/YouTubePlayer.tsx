'use client';

import { useImperativeHandle, forwardRef, useRef, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

const ReactPlayer = dynamic(() => import('react-player/youtube'), {
  ssr: false,
  loading: () => <div style={{ width: '100%', height: '100%', backgroundColor: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ color: '#fff' }}>Chargement...</div></div>
});

type YouTubePlayerProps = {
  videoId: string;
  onReady?: () => void;
  onStateChange?: (state: number) => void;
  onEnd?: () => void;
  onError?: () => void;
  onPlay?: () => void;
  onPause?: () => void;
  className?: string;
  startTimeOffset?: number;
};

export type YouTubePlayerHandle = {
  playVideo: () => void;
  pauseVideo: () => void;
  stopVideo: () => void;
  setVolume: (volume: number) => void;
  mute: () => void;
  unMute: () => void;
  isMuted: () => boolean;
  getPlayerState: () => number;
  loadVideoById: (videoId: string, startSeconds?: number) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  seekTo: (time: number, allowSeekAhead?: boolean) => void;
};

export const YouTubePlayer = forwardRef<YouTubePlayerHandle, YouTubePlayerProps>(
  ({ videoId, className, startTimeOffset = 0, onEnd, onError, onPlay, onPause }, ref) => {
    const playerRef = useRef<any>(null);
    const [playing, setPlaying] = useState(true);
    const [muted, setMuted] = useState(true);
    const [volume, setVolumeState] = useState(0.8);
    const [currentUrl, setCurrentUrl] = useState(() => `https://www.youtube.com/watch?v=${videoId}`);
    const lastVideoId = useRef(videoId);
    const lastSeekTime = useRef(0);
    const isReady = useRef(false);

    useEffect(() => {
      if (videoId !== lastVideoId.current) {
        lastVideoId.current = videoId;
        // IMPORTANT : Ne jamais inclure &t= dans l'URL - seekTo() gère tout
        setCurrentUrl(`https://www.youtube.com/watch?v=${videoId}`);
        isReady.current = false;
        lastSeekTime.current = 0;
      }
    }, [videoId]);

    // OPTIMISATION PERFORMANCE : Ne plus forcer seekTo() en continu
    // La synchronisation se fait uniquement au chargement initial
    // Cela évite les micro-saccades causées par les recalculs périodiques

    useImperativeHandle(ref, () => ({
      playVideo: () => setPlaying(true),
      pauseVideo: () => setPlaying(false),
      stopVideo: () => setPlaying(false),
      setVolume: (vol: number) => setVolumeState(vol / 100),
      mute: () => setMuted(true),
      unMute: () => setMuted(false),
      isMuted: () => muted,
      getPlayerState: () => (playing ? 1 : 2),
      loadVideoById: () => {},
      getCurrentTime: () => {
        if (playerRef.current && playerRef.current.getCurrentTime) {
          return playerRef.current.getCurrentTime();
        }
        return 0;
      },
      getDuration: () => {
        if (playerRef.current && playerRef.current.getDuration) {
          return playerRef.current.getDuration();
        }
        return 0;
      },
      seekTo: (time: number, allowSeekAhead: boolean = true) => {
        if (playerRef.current && playerRef.current.seekTo) {
          playerRef.current.seekTo(time, allowSeekAhead);
          lastSeekTime.current = time;
        }
      }
    }));

    const handleReady = (player: any) => {
      isReady.current = true;
      playerRef.current = player;

      // LIVE-SYNC CRITIQUE : Forcer seekTo immédiatement, même si startTimeOffset = 0
      if (player && player.seekTo) {
        const targetTime = startTimeOffset > 0 ? startTimeOffset : 0;
        console.log('🎬 [handleReady] Force seekTo =>', targetTime, 'secondes');
        player.seekTo(targetTime, true);
        lastSeekTime.current = targetTime;

        // Double application pour garantir la position (iOS/Android)
        setTimeout(() => {
          if (player.seekTo) {
            console.log('🔁 [handleReady] Double seekTo =>', targetTime, 'secondes');
            player.seekTo(targetTime, true);
          }
          if (player.getInternalPlayer) {
            const internalPlayer = player.getInternalPlayer();
            if (internalPlayer && internalPlayer.playVideo) {
              internalPlayer.playVideo();
            }
          }
        }, 500);
      }

      setPlaying(true);
    };

    return (
      <>
        <div className={`${className} force-fullscreen-player`} style={{
          backgroundColor: '#000',
          overflow: 'hidden',
          pointerEvents: 'auto',
          position: 'relative',
          width: '100%',
          height: '100%',
        }}>
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '100%',
            height: '100%',
            minWidth: '100%',
            minHeight: '100%',
          }}>
            <ReactPlayer
            className="force-fullscreen-player"
            ref={playerRef}
            url={currentUrl}
            playing={playing}
            volume={volume}
            muted={muted}
            controls={false}
            width="100%"
            height="100%"
            onReady={handleReady}
            onEnded={onEnd}
            onError={onError}
            onPlay={onPlay}
            onPause={onPause}
            pip={false}
            config={{
              playerVars: {
                autoplay: 1,
                modestbranding: 1,
                rel: 0,
                vq: 'hd1080',
                controls: 0,
                disablekb: 1,
                fs: 0,
                iv_load_policy: 3,
                playsinline: 1,
                start: Math.floor(startTimeOffset),
                enablejsapi: 1,
                origin: typeof window !== 'undefined' ? window.location.origin : '',
                preload: '1',
                cc_load_policy: 0,
                showinfo: 0
              },
              embedOptions: {
                loading: 'eager',
                host: 'https://www.youtube-nocookie.com'
              }
            }}
            style={{
              pointerEvents: 'none',
            }}
          />
          </div>
        </div>
      </>
    );
  }
);

YouTubePlayer.displayName = 'YouTubePlayer';
