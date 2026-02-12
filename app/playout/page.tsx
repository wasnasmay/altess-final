'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Play,
  Pause,
  Square,
  SkipForward,
  Radio,
  Tv,
  Calendar as CalendarIcon,
  Clock,
  AlertCircle,
  Library,
  LayoutGrid,
  Users,
  Timer,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import AdminNavigation from '@/components/AdminNavigation';
import { SmartVideoPlayer, SmartVideoPlayerHandle } from '@/components/SmartVideoPlayer';

type PlayoutMedia = {
  id: string;
  title: string;
  type: 'video' | 'audio' | 'jingle' | 'ad' | 'live';
  media_url: string;
  thumbnail_url: string | null;
  duration_seconds: number;
  duration_ms?: number;
};

type PlayoutScheduleItem = {
  id: string;
  media_id: string;
  scheduled_datetime: string;
  duration_seconds: number;
  duration_ms?: number;
  order_position: number;
  status: string;
  media: PlayoutMedia;
};

type PlayoutChannel = {
  id: string;
  name: string;
  type: 'tv' | 'radio' | 'web';
  status: 'on_air' | 'off_air' | 'standby';
  auto_advance: boolean;
};

export default function PlayoutPage() {
  const [channels, setChannels] = useState<PlayoutChannel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<PlayoutChannel | null>(null);
  const [playlist, setPlaylist] = useState<PlayoutScheduleItem[]>([]);
  const [currentItem, setCurrentItem] = useState<PlayoutScheduleItem | null>(null);
  const [nextItem, setNextItem] = useState<PlayoutScheduleItem | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [viewerCount, setViewerCount] = useState(0);

  const videoRef = useRef<SmartVideoPlayerHandle>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const intervalRef = useRef<NodeJS.Timeout>();
  const playlistCacheRef = useRef<{[key: string]: PlayoutScheduleItem[]}>({});
  const userHasUnmutedRef = useRef(false);
  const currentVideoUrlRef = useRef<string>('');

  useEffect(() => {
    loadChannels();

    const baseViewers = Math.floor(Math.random() * 50) + 10;
    setViewerCount(baseViewers);

    const viewerInterval = setInterval(() => {
      setViewerCount(prev => {
        const change = Math.floor(Math.random() * 5) - 2;
        return Math.max(0, prev + change);
      });
    }, 5000);

    return () => clearInterval(viewerInterval);
  }, []);

  useEffect(() => {
    if (selectedChannel) {
      loadPlaylist(selectedDate);
    }
  }, [selectedChannel, selectedDate]);

  useEffect(() => {
    if (currentItem && currentItem.media.type === 'video') {
      if (!currentVideoUrlRef.current) {
        currentVideoUrlRef.current = currentItem.media.media_url;
      }
    }
  }, [currentItem]);


  useEffect(() => {
    if (isPlaying && currentItem) {
      intervalRef.current = setInterval(() => {
        setCurrentTime(prev => {
          const newTime = prev + 1;
          if (newTime >= currentItem.duration_seconds) {
            if (autoAdvance) {
              handleNext();
            } else {
              handlePause();
            }
            return 0;
          }
          return newTime;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, currentItem, autoAdvance]);

  async function loadChannels() {
    try {
      const { data, error } = await supabase
        .from('playout_channels')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setChannels(data || []);

      if (data && data.length > 0) {
        setSelectedChannel(data[0]);
        setAutoAdvance(data[0].auto_advance);
      }
    } catch (error: any) {
      toast.error('Erreur lors du chargement des canaux');
    }
  }

  async function loadPlaylist(date: Date) {
    if (!selectedChannel) return;

    try {
      const dateStr = date.toISOString().split('T')[0];
      const cacheKey = `${selectedChannel.id}-${dateStr}`;

      if (playlistCacheRef.current[cacheKey]) {
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
        .eq('channel_id', selectedChannel.id)
        .eq('scheduled_date', dateStr)
        .in('status', ['scheduled', 'playing'])
        .order('order_position');

      if (error) throw error;

      const items = (data || []).map(item => ({
        ...item,
        media: item.media as unknown as PlayoutMedia
      })) as PlayoutScheduleItem[];

      playlistCacheRef.current[cacheKey] = items;
      setPlaylist(items);

      if (items.length > 0 && !currentItem) {
        setCurrentItem(items[0]);
        if (items.length > 1) {
          setNextItem(items[1]);
        }
      }
    } catch (error: any) {
      toast.error('Erreur lors du chargement de la playlist');
    }
  }

  function handlePlay() {
    if (currentItem) {
      setIsPlaying(true);
      updateChannelStatus('on_air');

      if (currentItem.media.type === 'video' && videoRef.current) {
        videoRef.current.play();
        if (userHasUnmutedRef.current) {
          videoRef.current.unmute();
        }
      } else if (currentItem.media.type === 'audio' && audioRef.current) {
        audioRef.current.play();
      }
    }
  }

  function handleUnmute() {
    userHasUnmutedRef.current = true;
    if (videoRef.current) {
      videoRef.current.unmute();
    }
    toast.success('Son activé pour tous les clips suivants');
  }

  function handlePause() {
    setIsPlaying(false);

    if (videoRef.current) {
      videoRef.current.pause();
    }
    if (audioRef.current) {
      audioRef.current.pause();
    }
  }

  function handleStop() {
    setIsPlaying(false);
    setCurrentTime(0);
    updateChannelStatus('off_air');

    if (videoRef.current) {
      videoRef.current.pause();
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }

  async function handleNext() {
    if (!currentItem) return;

    const currentIndex = playlist.findIndex(item => item.id === currentItem.id);

    if (currentIndex < playlist.length - 1) {
      const nextItemData = playlist[currentIndex + 1];
      const shouldAutoPlay = autoAdvance && isPlaying;

      if (currentIndex + 2 < playlist.length) {
        setNextItem(playlist[currentIndex + 2]);
      } else {
        setNextItem(null);
      }

      setCurrentTime(0);

      if (nextItemData.media.type === 'video' && videoRef.current) {
        currentVideoUrlRef.current = nextItemData.media.media_url;
        videoRef.current.loadVideo(nextItemData.media.media_url, 0);

        if (shouldAutoPlay) {
          requestAnimationFrame(() => {
            if (videoRef.current) {
              videoRef.current.play();
              if (userHasUnmutedRef.current) {
                videoRef.current.unmute();
              }
            }
          });
        }
      } else if (nextItemData.media.type === 'audio' && audioRef.current) {
        audioRef.current.src = nextItemData.media.media_url;
        audioRef.current.load();

        if (shouldAutoPlay) {
          audioRef.current.play().catch(err => console.error('Play error:', err));
        }
      }

      setCurrentItem(nextItemData);

      if (!shouldAutoPlay) {
        setIsPlaying(false);
      }

      logPlayback(currentItem, 'completed');
    } else {
      setCurrentItem(null);
      setNextItem(null);
      setIsPlaying(false);
      updateChannelStatus('off_air');
      logPlayback(currentItem, 'completed');
    }
  }

  async function updateChannelStatus(status: 'on_air' | 'off_air' | 'standby') {
    if (!selectedChannel) return;

    try {
      await supabase
        .from('playout_channels')
        .update({ status })
        .eq('id', selectedChannel.id);

      setSelectedChannel({ ...selectedChannel, status });
    } catch (error) {
      console.error('Error updating channel status:', error);
    }
  }

  async function handleAutoAdvanceToggle(checked: boolean) {
    setAutoAdvance(checked);

    if (selectedChannel) {
      await supabase
        .from('playout_channels')
        .update({ auto_advance: checked })
        .eq('id', selectedChannel.id);
    }
  }

  async function logPlayback(
    item: PlayoutScheduleItem,
    playbackStatus: 'completed' | 'interrupted' | 'error',
    error?: string
  ) {
    if (!selectedChannel) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();

      await supabase.from('playout_logs').insert({
        channel_id: selectedChannel.id,
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
  }

  function formatTime(seconds: number): string {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  const progress = currentItem ? (currentTime / currentItem.duration_seconds) * 100 : 0;
  const timeRemaining = currentItem ? currentItem.duration_seconds - currentTime : 0;

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-6 flex flex-col w-full">
        <AdminNavigation title="Play Out System" />

        <div className="flex items-center justify-between mb-4 bg-slate-900 p-3 rounded-lg border border-slate-800">
          <div className="flex items-center gap-3">
            <Select
              value={selectedChannel?.id || ''}
              onValueChange={(id) => {
                const channel = channels.find(c => c.id === id);
                if (channel) {
                  setSelectedChannel(channel);
                  setAutoAdvance(channel.auto_advance);
                }
              }}
            >
              <SelectTrigger className="w-[180px] bg-slate-800 border-slate-700 h-9">
                <SelectValue placeholder="Sélectionner un canal" />
              </SelectTrigger>
              <SelectContent>
                {channels.map(channel => (
                  <SelectItem key={channel.id} value={channel.id}>
                    <div className="flex items-center gap-2">
                      {channel.type === 'tv' ? <Tv className="w-4 h-4" /> : <Radio className="w-4 h-4" />}
                      {channel.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="bg-slate-800 border-slate-700 h-9 text-sm">
                  <CalendarIcon className="w-3 h-3 mr-2" />
                  {format(selectedDate, 'dd MMM', { locale: fr })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-slate-800 border-slate-700">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  locale={fr}
                  className="bg-slate-800"
                />
              </PopoverContent>
            </Popover>

            <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
              <Users className="w-4 h-4 text-green-400" />
              <span className="text-sm font-bold text-green-400">{viewerCount}</span>
              <span className="text-xs text-slate-400">live</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="auto-advance" className="text-xs">Auto-avance</Label>
              <Switch
                id="auto-advance"
                checked={autoAdvance}
                onCheckedChange={handleAutoAdvanceToggle}
              />
            </div>

            <div className={cn(
              'px-3 py-1.5 rounded-lg font-bold text-xs border-2 flex items-center gap-2',
              selectedChannel?.status === 'on_air'
                ? 'bg-red-600 border-red-500'
                : 'bg-slate-700 border-slate-600'
            )}>
              <div className={cn(
                'w-2 h-2 rounded-full',
                selectedChannel?.status === 'on_air'
                  ? 'bg-white animate-pulse'
                  : 'bg-slate-500'
              )}></div>
              {selectedChannel?.status === 'on_air' ? 'ON AIR' : 'OFF AIR'}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-4">
          {/* Colonne gauche: Lecteur Vidéo */}
          <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/20">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-amber-400 text-base">
                <LayoutGrid className="w-4 h-4" />
                Lecteur Direct
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
                {currentItem ? (
                  currentItem.media.type === 'video' ? (
                    <>
                      <SmartVideoPlayer
                        ref={videoRef}
                        url={currentVideoUrlRef.current || currentItem.media.media_url}
                        title={currentItem.media.title}
                        className="w-full h-full object-contain"
                        onEnded={handleNext}
                      />
                      {!userHasUnmutedRef.current && (
                        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10">
                          <Button
                            size="lg"
                            onClick={handleUnmute}
                            className="bg-amber-600 hover:bg-amber-700 shadow-xl animate-pulse"
                          >
                            🔊 Activer le son
                          </Button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
                      <div className="text-center">
                        <Radio className="w-24 h-24 mx-auto mb-4 text-amber-500" />
                        <h3 className="text-2xl font-bold">{currentItem.media.title}</h3>
                        <p className="text-slate-400 mt-2">Audio en cours</p>
                      </div>
                      <audio
                        ref={audioRef}
                        src={currentItem.media.media_url}
                        onTimeUpdate={(e) => {
                          const audio = e.target as HTMLAudioElement;
                          setCurrentTime(Math.floor(audio.currentTime));
                        }}
                        onEnded={handleNext}
                      />
                    </div>
                  )
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
                    <div className="text-center">
                      <AlertCircle className="w-24 h-24 mx-auto mb-4 text-slate-600" />
                      <p className="text-slate-500">Aucun média sélectionné</p>
                    </div>
                  </div>
                )}
              </div>

              {currentItem && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">En cours:</span>
                    <span className="font-bold text-sm truncate max-w-[60%]">{currentItem.media.title}</span>
                  </div>

                  <div className="bg-slate-900 rounded-lg p-4 border-2 border-amber-600/30">
                    <div className="flex items-center justify-center gap-3 mb-3">
                      <Timer className="w-6 h-6 text-amber-400" />
                      <div className="text-center">
                        <div className="text-xs text-slate-400 mb-1">Temps restant</div>
                        <div className="text-4xl font-bold text-amber-400 tracking-wider font-mono">
                          {formatTime(timeRemaining)}
                        </div>
                      </div>
                    </div>

                    <div className="w-full bg-slate-800 rounded-full h-2 mb-2">
                      <div
                        className="bg-amber-500 h-2 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>{formatTime(currentTime)}</span>
                      <span>{formatTime(currentItem.duration_seconds)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-2">
                    {!isPlaying ? (
                      <Button
                        size="sm"
                        onClick={handlePlay}
                        className="bg-green-600 hover:bg-green-700 flex-1"
                        disabled={!currentItem}
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Play
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={handlePause}
                        className="bg-amber-600 hover:bg-amber-700 flex-1"
                      >
                        <Pause className="w-4 h-4 mr-2" />
                        Pause
                      </Button>
                    )}

                    <Button
                      size="sm"
                      onClick={handleStop}
                      variant="outline"
                      className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                    >
                      <Square className="w-4 h-4" />
                    </Button>

                    <Button
                      size="sm"
                      onClick={handleNext}
                      className="bg-blue-600 hover:bg-blue-700 border-2 border-blue-400"
                      disabled={!nextItem}
                      title="Passer au média suivant"
                    >
                      <SkipForward className="w-4 h-4 mr-2" />
                      Skip
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Colonne droite: Programmes à venir */}
          <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/20 lg:max-h-[calc(100vh-200px)]">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-amber-400 text-base">
                  <Clock className="w-4 h-4" />
                  À venir
                </span>
                <span className="text-xs font-normal text-amber-400 bg-amber-600/20 px-2 py-1 rounded">
                  {playlist.length}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3">
              {playlist.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Library className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Aucun élément programmé</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-amber-500 scrollbar-track-slate-800">
                  {playlist.map((item, index) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        setCurrentItem(item);
                        if (index < playlist.length - 1) {
                          setNextItem(playlist[index + 1]);
                        }
                        setCurrentTime(0);
                      }}
                      className={cn(
                        "group cursor-pointer rounded-lg overflow-hidden transition-all duration-200 border-2",
                        item.id === currentItem?.id
                          ? 'border-amber-500 bg-amber-500/10'
                          : item.id === nextItem?.id
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-slate-800 hover:border-slate-600 bg-slate-900/50'
                      )}
                    >
                      <div className="flex gap-2 p-2">
                        <div className="relative w-24 h-16 flex-shrink-0 rounded overflow-hidden bg-slate-800">
                          {item.media.thumbnail_url ? (
                            <img
                              src={item.media.thumbnail_url}
                              alt={item.media.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-700 to-slate-900">
                              {item.media.type === 'video' ? (
                                <Tv className="w-6 h-6 text-slate-600" />
                              ) : (
                                <Radio className="w-6 h-6 text-slate-600" />
                              )}
                            </div>
                          )}

                          <div className="absolute top-1 left-1">
                            {item.id === currentItem?.id && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-amber-500 text-black animate-pulse">
                                LIVE
                              </span>
                            )}
                            {item.id === nextItem?.id && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-blue-500 text-white">
                                NEXT
                              </span>
                            )}
                          </div>

                          <div className="absolute bottom-1 right-1">
                            <span className="text-[10px] px-1 py-0.5 rounded font-bold bg-black/80 text-white">
                              {formatTime(item.duration_seconds)}
                            </span>
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1 mb-1">
                            <span className="text-[10px] text-slate-500">#{index + 1}</span>
                            <span className="text-xs text-amber-400 font-mono">
                              {format(new Date(item.scheduled_datetime), 'HH:mm', { locale: fr })}
                            </span>
                            <span className={cn(
                              'text-[10px] px-1.5 py-0.5 rounded font-semibold ml-auto',
                              item.media.type === 'video' ? 'bg-slate-700 text-white' :
                              item.media.type === 'audio' ? 'bg-blue-600/80 text-white' :
                              item.media.type === 'jingle' ? 'bg-green-600/80 text-white' :
                              'bg-amber-600/80 text-white'
                            )}>
                              {item.media.type}
                            </span>
                          </div>
                          <h4 className="font-semibold text-xs line-clamp-2 group-hover:text-amber-400 transition-colors">
                            {item.media.title}
                          </h4>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
