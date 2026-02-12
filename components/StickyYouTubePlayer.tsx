'use client';

import { useEffect, useState, useRef, forwardRef, useImperativeHandle } from 'react';
import { YouTubePlayer, YouTubePlayerHandle } from './YouTubePlayer';
import { Button } from '@/components/ui/button';
import { X, Maximize2 } from 'lucide-react';

type StickyYouTubePlayerProps = {
  videoId: string | null;
  onEnd?: () => void;
  onPause?: () => void;
  onPlay?: () => void;
};

export type StickyYouTubePlayerHandle = YouTubePlayerHandle;

export const StickyYouTubePlayer = forwardRef<StickyYouTubePlayerHandle, StickyYouTubePlayerProps>(
  ({ videoId, onEnd, onPause, onPlay }, ref) => {
    const [isSticky, setIsSticky] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const playerRef = useRef<YouTubePlayerHandle>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const anchorRef = useRef<HTMLDivElement>(null);

    useImperativeHandle(ref, () => ({
      playVideo: () => playerRef.current?.playVideo(),
      pauseVideo: () => playerRef.current?.pauseVideo(),
      stopVideo: () => playerRef.current?.stopVideo(),
      seekTo: (seconds: number, allowSeekAhead?: boolean) =>
        playerRef.current?.seekTo(seconds, allowSeekAhead),
      getCurrentTime: () => playerRef.current?.getCurrentTime() || 0,
      getDuration: () => playerRef.current?.getDuration() || 0,
      setVolume: (volume: number) => playerRef.current?.setVolume(volume),
      mute: () => playerRef.current?.mute(),
      unMute: () => playerRef.current?.unMute(),
      isMuted: () => playerRef.current?.isMuted() || false,
      getPlayerState: () => playerRef.current?.getPlayerState() || -1,
      loadVideoById: (videoId: string, startSeconds?: number) =>
        playerRef.current?.loadVideoById(videoId, startSeconds),
    }));

    useEffect(() => {
      setIsMounted(true);
    }, []);

    useEffect(() => {
      const handleScroll = () => {
        if (!anchorRef.current) return;

        const anchorRect = anchorRef.current.getBoundingClientRect();
        const scrollThreshold = 100;

        if (anchorRect.top < -scrollThreshold) {
          setIsSticky(true);
        } else {
          setIsSticky(false);
        }
      };

      handleScroll();
      window.addEventListener('scroll', handleScroll);
      window.addEventListener('resize', handleScroll);

      return () => {
        window.removeEventListener('scroll', handleScroll);
        window.removeEventListener('resize', handleScroll);
      };
    }, []);

    const handleBackToTop = () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    if (!isMounted || !videoId) {
      return <div ref={anchorRef} className="absolute inset-0" />;
    }

    return (
      <>
        <div ref={anchorRef} id="youtube-player-anchor" className="absolute inset-0" />

        <div
          ref={containerRef}
          className={`transition-all duration-500 ease-out ${
            isSticky
              ? 'fixed bottom-6 right-6 w-96 shadow-2xl'
              : 'absolute inset-0 w-full h-full'
          }`}
          style={{
            borderRadius: '24px',
            boxShadow: isSticky
              ? '0 25px 50px -12px rgba(217, 119, 6, 0.4), 0 8px 16px -8px rgba(217, 119, 6, 0.3)'
              : 'inset 0 0 60px rgba(0, 0, 0, 0.5)',
            zIndex: isSticky ? 9999 : 10,
          }}
        >
          {isSticky && (
            <div className="absolute -top-12 right-0 flex items-center gap-2 bg-black/90 backdrop-blur-md px-4 py-2 rounded-t-xl border-2 border-b-0 border-amber-500/40" style={{ zIndex: 9999 }}>
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-white text-sm font-medium">En direct</span>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 hover:bg-amber-500/20 text-white ml-2"
                onClick={handleBackToTop}
                title="Retour en haut"
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>
          )}

          <div
            className={`relative w-full ${isSticky ? 'aspect-video' : 'h-full'} overflow-hidden`}
            style={{ borderRadius: '24px' }}
          >
            <YouTubePlayer
              ref={playerRef}
              videoId={videoId}
              className="absolute inset-0 w-full h-full"
              onEnd={onEnd}
              onPause={onPause}
              onPlay={onPlay}
            />
          </div>
        </div>
      </>
    );
  }
);

StickyYouTubePlayer.displayName = 'StickyYouTubePlayer';
