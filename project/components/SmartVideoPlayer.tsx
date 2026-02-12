'use client';

import { forwardRef, useImperativeHandle, useRef, useState, useEffect } from 'react';
import { YouTubePlayer, YouTubePlayerHandle } from './YouTubePlayer';

type SmartVideoPlayerProps = {
  url: string;
  title?: string;
  className?: string;
  fallbackUrl?: string;
  onEnded?: () => void;
  startTimeOffset?: number;
  initialVolume?: number;
  initialMuted?: boolean;
};

export type SmartVideoPlayerHandle = {
  play: () => void;
  pause: () => void;
  stop: () => void;
  setVolume: (volume: number) => void;
  mute: () => void;
  unmute: () => void;
  loadVideo: (url: string, startTimeOffset?: number) => void;
  getCurrentTime: () => number;
  seekTo: (time: number) => void;
};

export const SmartVideoPlayer = forwardRef<SmartVideoPlayerHandle, SmartVideoPlayerProps>(
  ({ url, title = 'Video', className = '', fallbackUrl, onEnded, startTimeOffset = 0, initialVolume = 1, initialMuted = false }, ref) => {
    const youtubePlayerRef = useRef<YouTubePlayerHandle>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const [hasError, setHasError] = useState(false);
    const [useFallback, setUseFallback] = useState(false);
    const [currentVolume, setCurrentVolume] = useState(initialVolume);
    const [isMuted, setIsMuted] = useState(initialMuted);

    const cleanUrl = (rawUrl: string): string => {
      if (!rawUrl) return '';
      let cleaned = rawUrl.trim();
      if (cleaned.includes('" title="')) {
        cleaned = cleaned.split('" title="')[0];
      }
      if (cleaned.includes('"')) {
        cleaned = cleaned.split('"')[0];
      }
      return cleaned;
    };

    const cleanedUrl = cleanUrl(url);
    const actualUrl = useFallback && fallbackUrl ? fallbackUrl : cleanedUrl;

    useEffect(() => {
      if (videoRef.current && startTimeOffset > 0) {
        const video = videoRef.current;

        const handleLoadedMetadata = () => {
          if (video && video.readyState >= 2) {
            video.currentTime = startTimeOffset;
            video.play().catch(err => console.error('Auto-play failed:', err));
          }
        };

        const handleCanPlay = () => {
          if (video && video.paused && startTimeOffset > 0) {
            video.currentTime = startTimeOffset;
          }
        };

        video.addEventListener('loadedmetadata', handleLoadedMetadata);
        video.addEventListener('canplay', handleCanPlay);

        if (video.readyState >= 2) {
          video.currentTime = startTimeOffset;
        }

        return () => {
          video.removeEventListener('loadedmetadata', handleLoadedMetadata);
          video.removeEventListener('canplay', handleCanPlay);
        };
      }
    }, [startTimeOffset, actualUrl]);

    useImperativeHandle(ref, () => ({
      play: () => {
        if (youtubePlayerRef.current) {
          youtubePlayerRef.current.playVideo();
        } else if (videoRef.current) {
          videoRef.current.play().catch(err => console.error('Error playing video:', err));
        }
      },
      pause: () => {
        if (youtubePlayerRef.current) {
          youtubePlayerRef.current.pauseVideo();
        } else if (videoRef.current) {
          videoRef.current.pause();
        }
      },
      stop: () => {
        if (youtubePlayerRef.current) {
          youtubePlayerRef.current.stopVideo();
        } else if (videoRef.current) {
          videoRef.current.pause();
          videoRef.current.currentTime = 0;
        }
      },
      setVolume: (volume: number) => {
        if (youtubePlayerRef.current) {
          youtubePlayerRef.current.setVolume(volume);
        } else if (videoRef.current) {
          videoRef.current.volume = volume;
          setCurrentVolume(volume);
        }
      },
      mute: () => {
        if (youtubePlayerRef.current) {
          youtubePlayerRef.current.mute();
        } else if (videoRef.current) {
          videoRef.current.muted = true;
          setIsMuted(true);
        }
      },
      unmute: () => {
        if (youtubePlayerRef.current) {
          youtubePlayerRef.current.unMute();
        } else if (videoRef.current) {
          videoRef.current.muted = false;
          setIsMuted(false);
        }
      },
      loadVideo: () => {},
      getCurrentTime: () => {
        if (youtubePlayerRef.current && typeof youtubePlayerRef.current.getCurrentTime === 'function') {
          return youtubePlayerRef.current.getCurrentTime();
        } else if (videoRef.current) {
          return videoRef.current.currentTime;
        }
        return 0;
      },
      seekTo: (time: number) => {
        if (youtubePlayerRef.current && typeof youtubePlayerRef.current.seekTo === 'function') {
          youtubePlayerRef.current.seekTo(time);
        } else if (videoRef.current) {
          videoRef.current.currentTime = time;
        }
      }
    }));

    if (!actualUrl) {
      return (
        <div className={`flex items-center justify-center bg-muted ${className}`} style={{ width: '100%', height: '100%' }}>
          <p className="text-muted-foreground">Aucune vidéo</p>
        </div>
      );
    }

    const isDirectVideo = actualUrl.endsWith('.mp4') || actualUrl.endsWith('.webm') || actualUrl.endsWith('.ogg') || actualUrl.includes('supabase') || actualUrl.includes('/storage/v1/');

    if (isDirectVideo) {
      return (
        <div className="relative w-full h-full" style={{ borderRadius: '16px', overflow: 'hidden' }}>
          {hasError && fallbackUrl && !useFallback && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
              <button
                onClick={() => setUseFallback(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white"
              >
                Essayer URL alternative
              </button>
            </div>
          )}
          <video
            ref={videoRef}
            src={actualUrl}
            title={title}
            className={className}
            style={{ width: '100%', height: '100%', objectFit: 'contain', backgroundColor: '#000', borderRadius: '16px' }}
            controls
            preload="auto"
            autoPlay
            muted={isMuted}
            playsInline
            crossOrigin="anonymous"
            x5-video-player-type="h5-page"
            x5-video-player-fullscreen="true"
            x5-video-orientation="portraint"
            webkit-playsinline="true"
            onError={() => setHasError(true)}
            onEnded={onEnded}
            onCanPlay={() => setHasError(false)}
            onLoadStart={() => {
              if (videoRef.current) {
                videoRef.current.playbackRate = 1.0;
                videoRef.current.volume = currentVolume;
                videoRef.current.muted = isMuted;
              }
            }}
            onLoadedMetadata={() => {
              if (videoRef.current) {
                videoRef.current.volume = currentVolume;
                videoRef.current.muted = isMuted;
              }
            }}
          >
            Votre navigateur ne supporte pas la lecture de vidéos.
          </video>
        </div>
      );
    }

    let videoId = '';

    if (actualUrl.includes('youtube.com/watch')) {
      const urlParams = new URLSearchParams(actualUrl.split('?')[1]);
      videoId = urlParams.get('v') || '';
    } else if (actualUrl.includes('youtu.be/')) {
      videoId = actualUrl.split('youtu.be/')[1]?.split('?')[0] || '';
    } else if (actualUrl.includes('youtube.com/embed/')) {
      const match = actualUrl.match(/embed\/([^?&]+)/);
      videoId = match ? match[1] : '';
    } else if (actualUrl.includes('vimeo.com')) {
      let vimeoId = '';
      if (actualUrl.includes('player.vimeo.com')) {
        const match = actualUrl.match(/video\/(\d+)/);
        vimeoId = match ? match[1] : '';
      } else {
        vimeoId = actualUrl.split('vimeo.com/')[1]?.split('?')[0] || '';
      }

      if (vimeoId) {
        return (
          <div style={{ borderRadius: '16px', overflow: 'hidden', width: '100%', height: '100%' }}>
            <iframe
              src={`https://player.vimeo.com/video/${vimeoId}?autoplay=1&muted=1&quality=1080p${startTimeOffset > 0 ? `#t=${Math.floor(startTimeOffset)}s` : ''}`}
              title={title}
              className={className}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                borderRadius: '16px'
              }}
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
            />
          </div>
        );
      }
    }

    if (videoId) {
      return (
        <YouTubePlayer
          ref={youtubePlayerRef}
          videoId={videoId}
          className={className}
          onEnd={onEnded}
          startTimeOffset={startTimeOffset}
        />
      );
    }

    return (
      <div className={`flex items-center justify-center bg-muted ${className}`} style={{ width: '100%', height: '100%' }}>
        <p className="text-muted-foreground">Format vidéo non supporté</p>
      </div>
    );
  }
);

SmartVideoPlayer.displayName = 'SmartVideoPlayer';
