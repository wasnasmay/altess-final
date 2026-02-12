'use client';

import { createContext, useContext, useState, useRef, ReactNode, useEffect } from 'react';
import { usePathname } from 'next/navigation';

interface Media {
  id: string;
  title: string;
  source_url: string;
  thumbnail_url?: string;
  description?: string;
  video_url?: string;
}

export interface RadioStation {
  id: string;
  name: string;
  streamUrl: string;
  logo?: string;
  color?: string;
}

interface PlayerContextType {
  // Player state
  isPlayerOpen: boolean;
  setIsPlayerOpen: (open: boolean) => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  volume: number;
  setVolume: (volume: number) => void;
  isMuted: boolean;
  setIsMuted: (muted: boolean) => void;

  // Mode
  mode: 'tv' | 'radio';
  setMode: (mode: 'tv' | 'radio') => void;

  // Current media
  currentMedia: Media | null;
  setCurrentMedia: (media: Media | null) => void;

  // Player ref
  playerRef: React.MutableRefObject<any>;

  // Mini player
  isMiniPlayer: boolean;

  // User interaction
  userHasInteracted: boolean;
  setUserHasInteracted: (interacted: boolean) => void;

  // Playback position
  savedPlaybackTime: number;
  setSavedPlaybackTime: (time: number) => void;

  // Live stream sync
  currentProgramStartTime: string | null;
  setCurrentProgramStartTime: (time: string | null) => void;
  getLivePlaybackTime: () => number;

  // YouTube Player
  currentVideoId: string | null;
  setCurrentVideoId: (videoId: string | null) => void;
  startTimeOffset: number;
  setStartTimeOffset: (offset: number) => void;
  onVideoEnd: () => void;
  setOnVideoEnd: (callback: () => void) => void;

  // Radio
  currentRadioStation: RadioStation | null;
  setCurrentRadioStation: (station: RadioStation | null) => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [isPlayerOpen, setIsPlayerOpen] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(70);
  const [isMuted, setIsMuted] = useState(false);
  const [mode, setMode] = useState<'tv' | 'radio'>('tv');
  const [currentMedia, setCurrentMedia] = useState<Media | null>(null);
  const [userHasInteracted, setUserHasInteracted] = useState(false);
  const [savedPlaybackTime, setSavedPlaybackTime] = useState(0);
  const [currentProgramStartTime, setCurrentProgramStartTime] = useState<string | null>(null);
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);
  const [startTimeOffset, setStartTimeOffset] = useState(0);
  const [onVideoEnd, setOnVideoEnd] = useState<() => void>(() => () => {});
  const [currentRadioStation, setCurrentRadioStation] = useState<RadioStation | null>(null);
  const playerRef = useRef<any>(null);
  const previousPathname = useRef(pathname);
  const timeUpdateInterval = useRef<NodeJS.Timeout | null>(null);

  // Calculate live playback time based on program start time
  const getLivePlaybackTime = (): number => {
    if (!currentProgramStartTime) return 0;

    const now = new Date();
    const currentTime = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();

    const [hours, minutes, seconds] = currentProgramStartTime.split(':').map(Number);
    const startTime = hours * 3600 + minutes * 60 + (seconds || 0);

    const elapsed = currentTime - startTime;
    return Math.max(0, elapsed);
  };

  // Determine if we should show mini player
  const isMiniPlayer = pathname !== '/' && isPlayerOpen && currentMedia !== null;

  // Continuously update playback time
  useEffect(() => {
    if (playerRef.current) {
      timeUpdateInterval.current = setInterval(() => {
        if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
          const currentTime = playerRef.current.getCurrentTime();
          if (currentTime > 0) {
            setSavedPlaybackTime(currentTime);
          }
        }
      }, 1000);
    }

    return () => {
      if (timeUpdateInterval.current) {
        clearInterval(timeUpdateInterval.current);
      }
    };
  }, []);

  // Synchronize playback position when changing pages
  useEffect(() => {
    const isLeavingHome = previousPathname.current === '/' && pathname !== '/';
    const isReturningHome = previousPathname.current !== '/' && pathname === '/';

    if (playerRef.current) {
      if (isLeavingHome || isReturningHome) {
        // CRITICAL: Use live time calculation if we have a program start time
        const targetTime = currentProgramStartTime ? getLivePlaybackTime() : (
          typeof playerRef.current.getCurrentTime === 'function'
            ? playerRef.current.getCurrentTime()
            : savedPlaybackTime
        );

        if (targetTime >= 0) {
          setSavedPlaybackTime(targetTime);

          setTimeout(() => {
            if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
              const liveTime = currentProgramStartTime ? getLivePlaybackTime() : targetTime;
              console.log('🔄 [Sync] Seeking to live time:', liveTime);
              playerRef.current.seekTo(liveTime, true);
            }
          }, 100);
        }
      }
    }

    previousPathname.current = pathname;
  }, [pathname, currentProgramStartTime, getLivePlaybackTime, savedPlaybackTime]);

  return (
    <PlayerContext.Provider
      value={{
        isPlayerOpen,
        setIsPlayerOpen,
        isPlaying,
        setIsPlaying,
        volume,
        setVolume,
        isMuted,
        setIsMuted,
        mode,
        setMode,
        currentMedia,
        setCurrentMedia,
        playerRef,
        isMiniPlayer,
        userHasInteracted,
        setUserHasInteracted,
        savedPlaybackTime,
        setSavedPlaybackTime,
        currentProgramStartTime,
        setCurrentProgramStartTime,
        getLivePlaybackTime,
        currentVideoId,
        setCurrentVideoId,
        startTimeOffset,
        setStartTimeOffset,
        onVideoEnd,
        setOnVideoEnd,
        currentRadioStation,
        setCurrentRadioStation,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
}
