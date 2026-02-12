'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Navigation } from '@/components/Navigation';
import { ChatWidget } from '@/components/ChatWidget';
import { OrchestraComposer } from '@/components/OrchestraComposer';
import Footer from '@/components/Footer';
import WhatsAppChat from '@/components/WhatsAppChat';
import NetflixCarousel from '@/components/NetflixCarousel';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { usePlayer } from '@/contexts/PlayerContext';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Tv,
  Radio,
  Calendar,
  Clock,
  Music2,
  CheckCircle
} from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

type ScheduledProgram = {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  media?: {
    source_url: string;
    media_type: string;
    thumbnail_url?: string;
    duration_seconds: number;
  };
  status: string;
};

type DemoVideo = {
  id: string;
  title: string;
  description: string;
  video_url: string;
  thumbnail_url: string;
  display_order: number;
  is_active: boolean;
};

type OrchestraFormula = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price_from: number;
  image_url: string;
  features: string[];
  display_order: number;
  is_active: boolean;
};

type CarouselMediaItem = {
  id: string;
  title: string;
  description: string | null;
  type: 'image' | 'video';
  url: string;
  thumbnail_url: string | null;
  category: string;
  order_position: number;
  is_active: boolean;
};

export default function HomePage() {
  const router = useRouter();

  // Use global player context
  const {
    mode,
    setMode,
    isPlaying,
    setIsPlaying,
    volume,
    setVolume,
    isMuted,
    setIsMuted,
    playerRef: globalPlayerRef,
    userHasInteracted,
    setUserHasInteracted,
    currentMedia,
    setCurrentMedia,
    isPlayerOpen,
    savedPlaybackTime,
    setSavedPlaybackTime,
    currentVideoId,
    setCurrentVideoId,
    setStartTimeOffset,
    onVideoEnd,
    setOnVideoEnd,
  } = usePlayer();

  const [currentProgram, setCurrentProgram] = useState<ScheduledProgram | null>(null);
  const [upcomingPrograms, setUpcomingPrograms] = useState<ScheduledProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedDemoVideo, setSelectedDemoVideo] = useState<DemoVideo | null>(null);
  const [demoVideos, setDemoVideos] = useState<DemoVideo[]>([]);
  const [orchestraFormulas, setOrchestraFormulas] = useState<OrchestraFormula[]>([]);
  const [composerOpen, setComposerOpen] = useState(false);
  const [carouselMedia, setCarouselMedia] = useState<CarouselMediaItem[]>([]);
  const [isProgramsPanelOpen, setIsProgramsPanelOpen] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const startTimeOffsetRef = useRef<number>(0);
  const previousMuteStateRef = useRef<boolean | null>(null);

  // Extract YouTube ID from URL
  function extractYouTubeId(url: string): string | null {
    if (!url) return null;
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /^([a-zA-Z0-9_-]{11})$/
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  }


  useEffect(() => {
    const savedSoundPreference = localStorage.getItem('om-sound-enabled');
    if (savedSoundPreference === 'true') {
      setIsMuted(false);
      setUserHasInteracted(true);
    }
  }, []);

  useEffect(() => {
    if (userHasInteracted) {
      localStorage.setItem('om-sound-enabled', (!isMuted).toString());
    }
  }, [isMuted, userHasInteracted]);

  useEffect(() => {
    loadCurrentProgram();
    loadDemoVideos();
    loadOrchestraFormulas();
    loadCarouselMedia();
    setSelectedDemoVideo(null);
    const interval = setInterval(() => {
      setCurrentTime(new Date());
      loadCurrentProgram();
    }, 30000);
    return () => clearInterval(interval);
  }, [mode]);

  // Calculate start time offset for live stream
  useEffect(() => {
    if (currentProgram?.start_time) {
      const now = new Date();
      const [hours, minutes, seconds] = currentProgram.start_time.split(':').map(Number);
      const startTimeInSeconds = hours * 3600 + minutes * 60 + (seconds || 0);
      const currentTimeInSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
      const offset = currentTimeInSeconds - startTimeInSeconds;
      startTimeOffsetRef.current = offset > 0 ? offset : 0;
      setStartTimeOffset(startTimeOffsetRef.current);
    }
  }, [currentProgram?.start_time, setStartTimeOffset]);

  // Sync current media with global context for mini player
  useEffect(() => {
    if (selectedDemoVideo) {
      setCurrentMedia({
        id: selectedDemoVideo.id,
        title: selectedDemoVideo.title,
        source_url: selectedDemoVideo.video_url,
        thumbnail_url: selectedDemoVideo.thumbnail_url,
        description: selectedDemoVideo.description,
        video_url: selectedDemoVideo.video_url,
      });
    } else if (currentProgram?.media) {
      setCurrentMedia({
        id: currentProgram.id,
        title: currentProgram.title,
        source_url: currentProgram.media.source_url,
        thumbnail_url: currentProgram.media.thumbnail_url,
      });
    } else {
      setCurrentMedia(null);
    }
  }, [selectedDemoVideo, currentProgram, setCurrentMedia]);

  // Update video ID when program changes
  useEffect(() => {
    if (selectedDemoVideo) return;

    const videoUrl = currentProgram?.media?.source_url || upcomingPrograms[0]?.media?.source_url || '';
    const videoId = extractYouTubeId(videoUrl);
    setCurrentVideoId(videoId);
    setOnVideoEnd(() => () => {
      console.log('Vidéo terminée');
      loadCurrentProgram();
    });
  }, [currentProgram, upcomingPrograms, selectedDemoVideo, setCurrentVideoId, setOnVideoEnd]);

  // Audio Intelligence: Auto-mute WebTV when demo video plays
  useEffect(() => {
    if (selectedDemoVideo) {
      // Demo video started: save current mute state and mute WebTV
      if (previousMuteStateRef.current === null) {
        previousMuteStateRef.current = isMuted;
      }
      if (!isMuted) {
        setIsMuted(true);
      }
    } else {
      // Demo video closed: restore previous mute state
      if (previousMuteStateRef.current !== null) {
        setIsMuted(previousMuteStateRef.current);
        previousMuteStateRef.current = null;
      }
    }
  }, [selectedDemoVideo]);

  useEffect(() => {
    if (globalPlayerRef.current) {
      if (typeof globalPlayerRef.current.setVolume === 'function') {
        globalPlayerRef.current.setVolume(volume);
      }
      if (isMuted) {
        if (typeof globalPlayerRef.current.mute === 'function') {
          globalPlayerRef.current.mute();
        }
      } else {
        if (typeof globalPlayerRef.current.unMute === 'function') {
          globalPlayerRef.current.unMute();
        }
      }
    }

    const mediaRef = mode === 'tv' ? videoRef.current : audioRef.current;
    if (mediaRef) {
      mediaRef.volume = isMuted ? 0 : volume / 100;
      mediaRef.muted = isMuted;
    }
  }, [volume, isMuted, mode, globalPlayerRef]);

  useEffect(() => {
    if (userHasInteracted && !isMuted) {
      setTimeout(() => {
        if (globalPlayerRef.current && typeof globalPlayerRef.current.unMute === 'function') {
          globalPlayerRef.current.unMute();
        }
      }, 500);
    }
  }, [userHasInteracted, isMuted, globalPlayerRef]);

  useEffect(() => {
    if (currentProgram?.media?.source_url) {
      setIsPlaying(true);
    }
  }, [currentProgram, mode]);

  useEffect(() => {
    if (!currentProgram?.end_time) return;

    const checkAndAdvance = () => {
      const now = new Date();
      const dateStr = format(now, 'yyyy-MM-dd');
      const currentTimeStr = format(now, 'HH:mm:ss');
      const endTime = currentProgram.end_time;

      if (currentTimeStr >= endTime) {
        console.log('Programme terminé, chargement du suivant...');
        loadCurrentProgram();
      }
    };

    const interval = setInterval(checkAndAdvance, 15000);
    return () => clearInterval(interval);
  }, [currentProgram?.end_time, mode]);

  async function loadCurrentProgram() {
    try {
      const now = new Date();
      const dateStr = format(now, 'yyyy-MM-dd');
      const timeStr = format(now, 'HH:mm:ss');

      const { data: channels } = await supabase
        .from('playout_channels')
        .select('id, type')
        .eq('type', mode === 'tv' ? 'tv' : 'radio')
        .eq('is_active', true)
        .maybeSingle();

      if (!channels) {
        console.log('Aucun canal trouvé');
        setCurrentProgram(null);
        setUpcomingPrograms([]);
        setLoading(false);
        return;
      }

      const { data: schedules, error } = await supabase
        .from('playout_schedules')
        .select(`
          id,
          scheduled_date,
          scheduled_time,
          duration_seconds,
          status,
          media:playout_media_library (
            title,
            media_url,
            type,
            thumbnail_url,
            duration_seconds
          )
        `)
        .eq('channel_id', channels.id)
        .eq('scheduled_date', dateStr)
        .order('scheduled_time');

      if (error) throw error;

      const currentTimeInSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();

      let currentProg = null;
      const upcomingProgs: ScheduledProgram[] = [];

      for (const schedule of schedules || []) {
        const [hours, minutes, seconds] = schedule.scheduled_time.split(':').map(Number);
        const startInSeconds = hours * 3600 + minutes * 60 + (seconds || 0);
        const endInSeconds = startInSeconds + schedule.duration_seconds;

        const startHours = Math.floor(startInSeconds / 3600);
        const startMinutes = Math.floor((startInSeconds % 3600) / 60);
        const startSecs = startInSeconds % 60;
        const start_time = `${startHours.toString().padStart(2, '0')}:${startMinutes.toString().padStart(2, '0')}:${startSecs.toString().padStart(2, '0')}`;

        const endHours = Math.floor(endInSeconds / 3600);
        const endMinutes = Math.floor((endInSeconds % 3600) / 60);
        const endSecs = endInSeconds % 60;
        const end_time = `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}:${endSecs.toString().padStart(2, '0')}`;

        const mediaData = Array.isArray(schedule.media) ? schedule.media[0] : schedule.media;

        const programItem: ScheduledProgram = {
          id: schedule.id,
          title: mediaData?.title || 'Sans titre',
          start_time,
          end_time,
          status: schedule.status,
          media: mediaData ? {
            source_url: mediaData.media_url,
            media_type: mediaData.type,
            thumbnail_url: mediaData.thumbnail_url,
            duration_seconds: mediaData.duration_seconds
          } : undefined
        };

        if (currentTimeInSeconds >= startInSeconds && currentTimeInSeconds < endInSeconds) {
          currentProg = programItem;
        } else if (currentTimeInSeconds < startInSeconds) {
          upcomingProgs.push(programItem);
        }
      }

      // If no current program, use first upcoming as fallback (continuous playback)
      // Only use programs that have valid media to avoid black screen
      let usedFallback = false;
      if (!currentProg && upcomingProgs.length > 0) {
        // Find first upcoming program with valid media
        const validProgram = upcomingProgs.find(prog => prog.media?.source_url);
        if (validProgram) {
          currentProg = validProgram;
          usedFallback = true;
        }
      }

      setCurrentProgram(currentProg);
      // If we used fallback, skip the first upcoming program in the list
      setUpcomingPrograms(usedFallback ? upcomingProgs.slice(1, 11) : upcomingProgs.slice(0, 10));

      if (currentProg) {
        await supabase
          .from('playout_schedules')
          .update({ status: 'playing' })
          .eq('id', currentProg.id);
      }
    } catch (error) {
      console.error('Error loading program:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadDemoVideos() {
    try {
      const { data, error } = await supabase
        .from('demo_videos')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setDemoVideos(data || []);
    } catch (error) {
      console.error('Error loading demo videos:', error);
    }
  }

  async function loadOrchestraFormulas() {
    try {
      const { data, error } = await supabase
        .from('orchestra_formulas')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setOrchestraFormulas(data || []);
    } catch (error) {
      console.error('Error loading orchestra formulas:', error);
    }
  }

  async function loadCarouselMedia() {
    try {
      const { data, error } = await supabase
        .from('carousel_media')
        .select('*')
        .eq('is_active', true)
        .eq('category', 'home')
        .order('order_position', { ascending: true });

      if (error) throw error;
      setCarouselMedia(data || []);
    } catch (error) {
      console.error('Error loading carousel media:', error);
    }
  }

  function togglePlayPause() {
    if (mode === 'tv' && globalPlayerRef.current) {
      if (isPlaying) {
        globalPlayerRef.current.pauseVideo();
      } else {
        globalPlayerRef.current.playVideo();
      }
      setIsPlaying(!isPlaying);
    } else {
      const mediaRef = mode === 'tv' ? videoRef.current : audioRef.current;
      if (!mediaRef) return;

      if (isPlaying) {
        mediaRef.pause();
      } else {
        mediaRef.play();
      }
      setIsPlaying(!isPlaying);
    }
  }

  function handleDemoVideoClick(video: DemoVideo) {
    // Don't pause WebTV - let it continue in background (muted by useEffect)
    setSelectedDemoVideo(video);
    setMode('tv');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleCloseDemoVideo() {
    setSelectedDemoVideo(null);
    // WebTV will auto-unmute via useEffect and continue playing
  }

  function getYouTubeEmbedUrl(url: string): string {
    const videoIdMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube-nocookie\.com\/embed\/)([^&\s?]+)/);
    if (videoIdMatch) {
      return `https://www.youtube-nocookie.com/embed/${videoIdMatch[1]}?autoplay=1&controls=1&rel=0`;
    }
    return url;
  }

  function getVimeoEmbedUrl(url: string): string {
    const vimeoIdMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoIdMatch) {
      return `https://player.vimeo.com/video/${vimeoIdMatch[1]}?autoplay=1`;
    }
    return url;
  }

  function isYouTube(url: string): boolean {
    return url.includes('youtube.com') || url.includes('youtu.be');
  }

  function isVimeo(url: string): boolean {
    return url.includes('vimeo.com');
  }

  function handleBackToLive() {
    handleCloseDemoVideo();
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="pt-20 px-4 pb-8">
        <div className="container mx-auto max-w-7xl">
          {loading ? (
            <div className="flex items-center justify-center h-96">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="relative w-[92%] mx-auto h-[70vh] min-h-[500px] max-h-[750px]">
              {/* Video Player - Full Screen */}
              <Card className="overflow-hidden border-0 h-full flex flex-col relative" style={{ borderRadius: '24px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 8px 16px -8px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(217, 119, 6, 0.1), 0 0 40px rgba(217, 119, 6, 0.15)' }}>
                <div className="flex items-center justify-center gap-4 p-4 bg-card border-b flex-shrink-0 relative z-10">
                  <Button
                    size="lg"
                    variant={mode === 'tv' ? 'default' : 'outline'}
                    onClick={() => {
                      setMode('tv');
                      setIsPlaying(false);
                    }}
                    className="flex items-center gap-2 px-8 transition-all duration-300 hover:scale-105"
                  >
                    <Tv className="w-5 h-5" />
                    <span className="font-semibold">WebTV</span>
                  </Button>
                  <Button
                    size="lg"
                    variant={mode === 'radio' ? 'default' : 'outline'}
                    onClick={() => {
                      setMode('radio');
                      setIsPlaying(false);
                    }}
                    className="flex items-center gap-2 px-8 transition-all duration-300 hover:scale-105"
                  >
                    <Radio className="w-5 h-5" />
                    <span className="font-semibold">WebRadio</span>
                  </Button>
                </div>
                <CardContent className="p-0 flex-1 overflow-hidden relative">
                  <div className="absolute inset-0 bg-black z-0" style={{ borderRadius: '0 0 24px 24px', boxShadow: 'inset 0 0 60px rgba(0, 0, 0, 0.5), 0 8px 32px rgba(217, 119, 6, 0.15)' }}>
                    {selectedDemoVideo ? (
                      <div className="relative w-full h-full">
                        <iframe
                          src={getYouTubeEmbedUrl(selectedDemoVideo.video_url)}
                          className="absolute inset-0 w-full h-full"
                          style={{ borderRadius: '0 0 24px 24px' }}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                        <Button
                          className="absolute top-4 right-4 z-20 bg-black/80 hover:bg-black/90 text-white backdrop-blur-sm"
                          onClick={handleBackToLive}
                        >
                          Retour au direct
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div id="youtube-player-anchor" className="absolute inset-0 w-full h-full" />
                        {!currentProgram && upcomingPrograms.length === 0 && (
                          <div className="absolute inset-0 flex items-center justify-center text-white/70 pointer-events-none z-20">
                            <div className="text-center">
                              <Tv className="w-16 h-16 mx-auto mb-4 opacity-50" />
                              <p className="text-lg">Aucun programme en cours</p>
                              <p className="text-sm opacity-70 mt-2">Sélectionnez un programme dans la liste</p>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Floating Sidebar - Programs Overlay */}
              {/* Invisible Trigger Zone - Fixed 50px wide on the right */}
              <div
                className="fixed top-0 right-0 h-full w-[50px] z-40"
                onMouseEnter={() => setIsProgramsPanelOpen(true)}
              />

              {/* Sliding Panel with Tab */}
              <div
                className={`fixed top-0 right-0 h-full z-[100000] transition-transform duration-500 ease-out ${
                  isProgramsPanelOpen ? 'translate-x-0' : 'translate-x-[calc(100%-3rem)]'
                }`}
                onMouseLeave={() => setIsProgramsPanelOpen(false)}
                style={{ pointerEvents: 'auto' }}
              >
                {/* Tab/Handle - Always visible */}
                <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-12 h-32 bg-gradient-to-r from-black/90 to-black/70 backdrop-blur-md border-2 border-r-0 rounded-l-2xl flex items-center justify-center cursor-pointer shadow-2xl transition-all duration-500 ${
                  isProgramsPanelOpen ? 'border-amber-500/80' : 'border-amber-500/40'
                }`}>
                  <div className="flex flex-col items-center gap-2">
                    <Calendar className={`w-7 h-7 text-amber-500 transition-all duration-300 ${isProgramsPanelOpen ? 'animate-pulse' : ''}`} />
                    <div className={`text-[10px] text-amber-500 font-bold transition-transform duration-500 whitespace-nowrap ${
                      isProgramsPanelOpen ? 'rotate-0' : '-rotate-90'
                    }`}>
                      TV
                    </div>
                  </div>
                </div>

                {/* Panel Content */}
                <div className="w-80 h-full bg-black/95 backdrop-blur-2xl border-l-2 border-amber-500/40 shadow-2xl shadow-black/60 ml-12">
                  <div className="h-full flex flex-col p-6">
                    {/* Header */}
                    <div className="mb-6 flex items-center gap-3 border-b border-amber-500/30 pb-4 flex-shrink-0">
                      <div className="bg-amber-500/20 p-2 rounded-lg">
                        <Calendar className="w-7 h-7 text-amber-500" />
                      </div>
                      <div>
                        <h3 className="font-bold text-xl text-white">Programmes</h3>
                        <p className="text-xs text-gray-400">À venir prochainement</p>
                      </div>
                    </div>

                    {/* Programs List */}
                    <ScrollArea className="flex-1 pr-4">
                      {upcomingPrograms.length > 0 ? (
                        <div className="space-y-4 pb-4">
                          {upcomingPrograms.map((program) => (
                            <Card
                              key={program.id}
                              className="border-2 border-amber-500/20 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-amber-500/30 hover:border-amber-500/60 cursor-pointer group bg-black/40 backdrop-blur-sm overflow-hidden"
                            >
                              <CardContent className="p-0">
                                {program.media?.thumbnail_url && (
                                  <div className="relative aspect-video w-full overflow-hidden bg-black">
                                    <img
                                      src={program.media.thumbnail_url}
                                      alt={program.title}
                                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300" />
                                    <div className="absolute top-3 left-3 bg-amber-500/90 backdrop-blur-sm rounded-lg px-3 py-1.5 group-hover:bg-amber-500 transition-colors duration-300 shadow-lg">
                                      <div className="text-xs text-black/70 font-medium">Début</div>
                                      <div className="text-lg font-bold text-black">
                                        {program.start_time.substring(0, 5)}
                                      </div>
                                    </div>
                                  </div>
                                )}
                                <div className="p-4">
                                  <h4 className="font-semibold text-base mb-3 line-clamp-2 text-white group-hover:text-amber-400 transition-colors duration-300">
                                    {program.title}
                                  </h4>
                                  <div className="space-y-2 text-sm text-gray-400">
                                    <div className="flex items-center gap-2">
                                      <Clock className="w-4 h-4 flex-shrink-0 text-amber-500" />
                                      <span>{program.start_time.substring(0, 5)} - {program.end_time.substring(0, 5)}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Music2 className="w-4 h-4 flex-shrink-0 text-amber-500" />
                                      <span>Durée: {program.media ? Math.floor(program.media.duration_seconds / 60) : '?'} min</span>
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-64 text-center">
                          <Calendar className="w-16 h-16 text-amber-500/20 mb-4" />
                          <p className="text-sm text-gray-500">Aucun programme prévu</p>
                          <p className="text-xs text-gray-600 mt-2">Revenez plus tard</p>
                        </div>
                      )}
                    </ScrollArea>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Orchestra Demo Videos Section */}
          {!loading && (
            <>
              <div className="mt-16">
                <h2 className="text-3xl font-bold mb-8 text-center">
                  Vidéos de démonstration d&apos;orchestre
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {demoVideos.map((video) => (
                    <Card
                      key={video.id}
                      className="overflow-hidden cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-2xl group"
                      onClick={() => handleDemoVideoClick(video)}
                    >
                      <div className="relative aspect-video overflow-hidden bg-black">
                        <img
                          src={video.thumbnail_url}
                          alt={video.title}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center">
                            <Play className="w-8 h-8 text-black ml-1" />
                          </div>
                        </div>
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-bold text-lg mb-2">{video.title}</h3>
                        <p className="text-sm text-muted-foreground">{video.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Carousel Section */}
              {carouselMedia.length > 0 && (
                <div className="mt-16">
                  <h2 className="text-3xl font-bold mb-8 text-center">
                    Galerie Photos &amp; Vidéos
                  </h2>
                  <NetflixCarousel
                    items={carouselMedia.map(item => ({
                      type: item.type,
                      url: item.url,
                      thumbnail: item.thumbnail_url || undefined,
                      title: item.title
                    }))}
                  />
                </div>
              )}

              {/* Orchestra Formula Cards Section */}
            <div className="mt-16 mb-12">
              <h2 className="text-3xl font-bold mb-4 text-center gold-gradient">
                Nos formules d&apos;orchestre
              </h2>
              <p className="text-center text-muted-foreground mb-8 max-w-2xl mx-auto">
                Choisissez la formule qui correspond parfaitement à votre événement
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Special Card: Composer votre orchestre */}
                <Card className="overflow-hidden bg-gradient-to-br from-black via-gray-900 to-black border border-amber-500/20 hover:border-amber-500/40 transition-all duration-500 hover:shadow-2xl hover:shadow-amber-500/20 flex flex-col h-full">
                  <div className="relative h-56 overflow-hidden bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
                    <div className="absolute inset-0 flex items-center justify-center opacity-10">
                      <Music2 className="w-32 h-32 text-amber-500" />
                    </div>
                    <div className="relative z-10 text-center">
                      <div className="inline-flex items-center justify-center p-4 bg-amber-500/10 rounded-full backdrop-blur-sm border border-amber-500/30">
                        <Music2 className="w-12 h-12 text-amber-500" />
                      </div>
                    </div>
                  </div>
                  <CardContent className="p-6 flex-1 flex flex-col">
                    <h3 className="text-xl font-bold mb-3 text-amber-500 text-center">Composer votre orchestre</h3>
                    <p className="text-gray-400 mb-4 text-sm text-center leading-relaxed h-20 flex items-center justify-center">
                      Créez un orchestre 100% personnalisé selon vos besoins et votre budget
                    </p>
                    <div className="space-y-2 mb-6 flex-1">
                      <div className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                        <span className="text-xs text-gray-400">Choisissez vos instruments</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                        <span className="text-xs text-gray-400">Nombre de musiciens flexible</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                        <span className="text-xs text-gray-400">Devis personnalisé gratuit</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                        <span className="text-xs text-gray-400">Réponse sous 24h</span>
                      </div>
                    </div>
                    <div className="space-y-2 mt-auto">
                      <Button
                        className="w-full bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-black font-semibold"
                        onClick={() => router.push('/composer-orchestre')}
                      >
                        Voir les détails
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full border-amber-500/30 text-amber-500 hover:bg-amber-500/10"
                        onClick={() => router.push('/composer-orchestre')}
                      >
                        Réserver / Devis
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Existing formulas */}
                {orchestraFormulas.map((formula) => (
                  <Card
                    key={formula.id}
                    className="overflow-hidden bg-gradient-to-br from-black via-gray-900 to-black border border-amber-500/20 hover:border-amber-500/40 transition-all duration-500 hover:shadow-2xl hover:shadow-amber-500/20 group flex flex-col h-full"
                  >
                    <div className="relative h-56 overflow-hidden bg-black">
                      <img
                        src={formula.image_url}
                        alt={formula.name}
                        className="w-full h-full object-cover opacity-90 transition-all duration-700 group-hover:scale-110 group-hover:opacity-100"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                    </div>
                    <CardContent className="p-6 flex-1 flex flex-col">
                      <h3 className="text-xl font-bold mb-3 text-white text-center">{formula.name}</h3>
                      <p className="text-gray-400 mb-4 text-sm text-center leading-relaxed h-20 flex items-center justify-center">
                        {formula.description}
                      </p>
                      <div className="space-y-2 mb-6 flex-1">
                        {formula.features.slice(0, 4).map((feature, idx) => (
                          <div key={idx} className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                            <span className="text-xs text-gray-400">{feature}</span>
                          </div>
                        ))}
                      </div>
                      <div className="space-y-2 mt-auto">
                        <Button
                          className="w-full bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-black font-semibold"
                          onClick={() => router.push(`/orchestres/${formula.slug}`)}
                        >
                          Voir les détails
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full border-amber-500/30 text-amber-500 hover:bg-amber-500/10"
                          onClick={() => router.push(`/orchestres/${formula.slug}`)}
                        >
                          Réserver / Devis
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
            </>
          )}
        </div>
      </div>

      <OrchestraComposer open={composerOpen} onClose={() => setComposerOpen(false)} />
      <ChatWidget />
      <WhatsAppChat />
      <Footer />
    </div>
  );
}
