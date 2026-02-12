'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

type PlayoutStatus = 'on_air' | 'off_air' | 'standby';

type PlayoutMedia = {
  id: string;
  title: string;
  type: 'video' | 'audio' | 'jingle' | 'ad' | 'live';
  media_url: string;
  thumbnail_url: string | null;
  duration_seconds: number;
};

type PlayoutScheduleItem = {
  id: string;
  media_id: string;
  scheduled_datetime: string;
  duration_seconds: number;
  order_position: number;
  status: string;
  media: PlayoutMedia;
};

type PlayoutChannel = {
  id: string;
  name: string;
  type: 'tv' | 'radio' | 'web';
  status: PlayoutStatus;
  auto_advance: boolean;
  current_item_id: string | null;
};

type PlayoutContextType = {
  channel: PlayoutChannel | null;
  currentItem: PlayoutScheduleItem | null;
  nextItem: PlayoutScheduleItem | null;
  playlist: PlayoutScheduleItem[];
  status: PlayoutStatus;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  autoAdvance: boolean;

  loadChannel: (channelId: string) => Promise<void>;
  loadPlaylist: (date: Date) => Promise<void>;
  play: () => void;
  pause: () => void;
  stop: () => void;
  next: () => void;
  setAutoAdvance: (value: boolean) => void;
  setStatus: (status: PlayoutStatus) => void;
  logPlayback: (item: PlayoutScheduleItem, status: 'completed' | 'interrupted' | 'error', error?: string) => Promise<void>;
};

const PlayoutContext = createContext<PlayoutContextType | undefined>(undefined);

export function PlayoutProvider({ children }: { children: React.ReactNode }) {
  const [channel, setChannel] = useState<PlayoutChannel | null>(null);
  const [currentItem, setCurrentItem] = useState<PlayoutScheduleItem | null>(null);
  const [nextItem, setNextItem] = useState<PlayoutScheduleItem | null>(null);
  const [playlist, setPlaylist] = useState<PlayoutScheduleItem[]>([]);
  const [status, setStatusState] = useState<PlayoutStatus>('off_air');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [autoAdvance, setAutoAdvanceState] = useState(true);

  const playlistCacheRef = useRef<{[key: string]: PlayoutScheduleItem[]}>({});
  const lastLoadDateRef = useRef<string>('');

  const loadChannel = async (channelId: string) => {
    try {
      const { data, error } = await supabase
        .from('playout_channels')
        .select('*')
        .eq('id', channelId)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setChannel(data);
        setStatusState(data.status);
        setAutoAdvanceState(data.auto_advance);
      }
    } catch (error) {
      console.error('Error loading channel:', error);
    }
  };

  const loadPlaylist = useCallback(async (date: Date) => {
    if (!channel) return;

    try {
      const dateStr = date.toISOString().split('T')[0];
      const cacheKey = `${channel.id}-${dateStr}`;

      if (playlistCacheRef.current[cacheKey] && lastLoadDateRef.current === dateStr) {
        const cachedItems = playlistCacheRef.current[cacheKey];
        setPlaylist(cachedItems);

        if (cachedItems.length > 0 && !currentItem) {
          setCurrentItem(cachedItems[0]);
          if (cachedItems.length > 1) {
            setNextItem(cachedItems[1]);
          }
        }
        return;
      }

      const { data, error } = await supabase
        .from('playout_schedules')
        .select(`
          *,
          media:playout_media_library(*)
        `)
        .eq('channel_type', channel.name)
        .eq('scheduled_date', dateStr)
        .in('status', ['scheduled', 'playing'])
        .order('start_time');

      if (error) throw error;

      const items = (data || []).map(item => {
        const [startHours, startMinutes, startSeconds] = (item.start_time || '00:00:00').split(':').map(Number);
        const [endHours, endMinutes, endSeconds] = (item.end_time || '00:01:00').split(':').map(Number);
        const durationSeconds = (endHours * 3600 + endMinutes * 60 + (endSeconds || 0)) - (startHours * 3600 + startMinutes * 60 + (startSeconds || 0));

        return {
          ...item,
          scheduled_datetime: `${item.scheduled_date}T${item.start_time}`,
          duration_seconds: durationSeconds,
          order_position: 0,
          media: item.media as unknown as PlayoutMedia
        };
      }) as PlayoutScheduleItem[];

      playlistCacheRef.current[cacheKey] = items;
      lastLoadDateRef.current = dateStr;
      setPlaylist(items);

      if (items.length > 0 && !currentItem) {
        setCurrentItem(items[0]);
        if (items.length > 1) {
          setNextItem(items[1]);
        }
      }
    } catch (error) {
      console.error('Error loading playlist:', error);
    }
  }, [channel, currentItem]);

  const play = () => {
    if (currentItem) {
      setIsPlaying(true);
      if (status === 'off_air') {
        setStatus('on_air');
      }
    }
  };

  const pause = () => {
    setIsPlaying(false);
  };

  const stop = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    setStatus('off_air');
  };

  const next = useCallback(async () => {
    if (!currentItem) return;

    const currentIndex = playlist.findIndex(item => item.id === currentItem.id);

    if (currentIndex < playlist.length - 1) {
      const nextItemData = playlist[currentIndex + 1];
      const nextNextItem = currentIndex + 2 < playlist.length ? playlist[currentIndex + 2] : null;

      setCurrentItem(nextItemData);
      setNextItem(nextNextItem);
      setCurrentTime(0);

      if (autoAdvance && isPlaying) {
        setIsPlaying(true);
      } else {
        setIsPlaying(false);
      }

      logPlayback(currentItem, 'completed');
    } else {
      setCurrentItem(null);
      setNextItem(null);
      setIsPlaying(false);
      setStatus('off_air');
      logPlayback(currentItem, 'completed');
    }
  }, [currentItem, playlist, autoAdvance, isPlaying]);

  const setAutoAdvance = async (value: boolean) => {
    setAutoAdvanceState(value);

    if (channel) {
      await supabase
        .from('playout_channels')
        .update({ auto_advance: value })
        .eq('id', channel.id);
    }
  };

  const setStatus = async (newStatus: PlayoutStatus) => {
    setStatusState(newStatus);

    if (channel) {
      await supabase
        .from('playout_channels')
        .update({ status: newStatus })
        .eq('id', channel.id);
    }
  };

  const logPlayback = async (
    item: PlayoutScheduleItem,
    playbackStatus: 'completed' | 'interrupted' | 'error',
    error?: string
  ) => {
    if (!channel) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();

      await supabase.from('playout_logs').insert({
        channel_id: channel.id,
        schedule_id: item.id,
        media_id: item.media_id,
        media_title: item.media.title,
        start_time: new Date().toISOString(),
        end_time: new Date().toISOString(),
        duration_seconds: Math.floor(currentTime),
        status: playbackStatus,
        error_message: error || null,
        played_by: user?.id || null,
      });

      await supabase
        .from('playout_schedules')
        .update({
          status: 'completed',
          actual_end_time: new Date().toISOString()
        })
        .eq('id', item.id);
    } catch (error) {
      console.error('Error logging playback:', error);
    }
  };

  return (
    <PlayoutContext.Provider
      value={{
        channel,
        currentItem,
        nextItem,
        playlist,
        status,
        isPlaying,
        currentTime,
        duration,
        autoAdvance,
        loadChannel,
        loadPlaylist,
        play,
        pause,
        stop,
        next,
        setAutoAdvance,
        setStatus,
        logPlayback,
      }}
    >
      {children}
    </PlayoutContext.Provider>
  );
}

export function usePlayout() {
  const context = useContext(PlayoutContext);
  if (context === undefined) {
    throw new Error('usePlayout must be used within a PlayoutProvider');
  }
  return context;
}
