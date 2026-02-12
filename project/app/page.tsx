'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { Navigation } from '@/components/Navigation';
import { OrchestraComposer } from '@/components/OrchestraComposer';
import Footer from '@/components/Footer';
import NetflixCarousel from '@/components/NetflixCarousel';
import AdvertisingTicker from '@/components/AdvertisingTicker';
import PremiumAdsGrid from '@/components/PremiumAdsGrid';
import FeaturedPartnersSection from '@/components/FeaturedPartnersSection';
import { RadioStationsGrid } from '@/components/RadioStationsGrid';
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
    setCurrentProgramStartTime,
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
  const [activeBackground, setActiveBackground] = useState<string | null>(null);

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
    setSelectedDemoVideo(null);
    const interval = setInterval(() => {
      setCurrentTime(new Date());
      loadCurrentProgram();
    }, 60000);
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
      setCurrentProgramStartTime(null);
    } else if (currentProgram?.media) {
      setCurrentMedia({
        id: currentProgram.id,
        title: currentProgram.title,
        source_url: currentProgram.media.source_url,
        thumbnail_url: currentProgram.media.thumbnail_url,
      });
      setCurrentProgramStartTime(currentProgram.start_time);
    } else {
      setCurrentMedia(null);
      setCurrentProgramStartTime(null);
    }
  }, [selectedDemoVideo, currentProgram, setCurrentMedia, setCurrentProgramStartTime]);

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

    const interval = setInterval(checkAndAdvance, 30000);
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

  async function loadActiveBackground() {
    try {
      const { data, error } = await supabase
        .from('dynamic_backgrounds')
        .select('*')
        .eq('is_active', true)
        .eq('display_mode', mode === 'tv' ? 'tv' : mode === 'radio' ? 'radio' : 'both')
        .order('priority', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setActiveBackground(data.image_url);
      } else {
        const { data: bothData } = await supabase
          .from('dynamic_backgrounds')
          .select('*')
          .eq('is_active', true)
          .eq('display_mode', 'both')
          .order('priority', { ascending: true })
          .limit(1)
          .maybeSingle();

        if (bothData) {
          setActiveBackground(bothData.image_url);
        }
      }
    } catch (error) {
      console.error('Error loading background:', error);
    }
  }

  useEffect(() => {
    loadActiveBackground();
  }, [mode]);

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
      return `https://www.youtube-nocookie.com/embed/${videoIdMatch[1]}?autoplay=1&controls=1&rel=0&vq=hd1080`;
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
            <div className="flex flex-col items-center justify-center h-96 space-y-6">
              <div className="relative">
                <div className="animate-spin rounded-full h-20 w-20 border-4 border-amber-500/20 border-t-amber-500"></div>
                <div className="absolute inset-0 rounded-full bg-amber-500/10 animate-pulse"></div>
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-xl font-bold text-amber-500">Chargement de la WebTV</h3>
                <p className="text-sm text-gray-400">Préparation de votre contenu...</p>
              </div>
            </div>
          ) : (
            <div className="relative w-full max-w-full mx-auto space-y-6 px-[2.5%]">
              {/* Video Player - Enhanced Premium Design */}
              <Card className="overflow-hidden border-4 border-amber-500/30 w-full max-w-full flex flex-col relative bg-gradient-to-br from-gray-950 via-black to-gray-900" style={{ borderRadius: '32px', boxShadow: '0 30px 60px -15px rgba(0, 0, 0, 0.8), 0 10px 25px -10px rgba(217, 119, 6, 0.3), inset 0 0 60px rgba(217, 119, 6, 0.05)' }}>
                <div className="flex items-center justify-center gap-3 sm:gap-6 p-4 sm:p-6 bg-gradient-to-r from-black/80 via-gray-900/80 to-black/80 backdrop-blur-sm border-b-2 border-amber-500/20 flex-shrink-0 relative z-10 flex-wrap">
                  <Button
                    size="lg"
                    variant={mode === 'tv' ? 'default' : 'outline'}
                    onClick={() => {
                      setMode('tv');
                      setIsPlaying(false);
                    }}
                    className={`flex items-center gap-2 sm:gap-3 px-6 sm:px-10 py-4 sm:py-6 min-h-[48px] transition-all duration-300 hover:scale-105 touch-target ${
                      mode === 'tv'
                        ? 'bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-black shadow-lg shadow-amber-500/50'
                        : 'border-2 border-amber-500/40 hover:border-amber-500/70 hover:bg-amber-500/10'
                    }`}
                  >
                    <Tv className="w-5 h-5 sm:w-6 sm:h-6" />
                    <span className="font-bold text-base sm:text-lg">Altess TV</span>
                  </Button>
                  <Button
                    size="lg"
                    variant={mode === 'radio' ? 'default' : 'outline'}
                    onClick={() => {
                      setMode('radio');
                      setIsPlaying(false);
                    }}
                    className={`flex items-center gap-2 sm:gap-3 px-6 sm:px-10 py-4 sm:py-6 min-h-[48px] transition-all duration-300 hover:scale-105 touch-target ${
                      mode === 'radio'
                        ? 'bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-black shadow-lg shadow-amber-500/50'
                        : 'border-2 border-amber-500/40 hover:border-amber-500/70 hover:bg-amber-500/10'
                    }`}
                  >
                    <Radio className="w-5 h-5 sm:w-6 sm:h-6" />
                    <span className="font-bold text-base sm:text-lg">Altess Radio</span>
                  </Button>
                </div>
                <CardContent className="p-0 w-full aspect-video max-h-[70vh] overflow-hidden relative">
                  {mode === 'radio' ? (
                    <div
                      className="p-6 relative"
                      style={{
                        borderRadius: '0 0 32px 32px',
                        ...(activeBackground ? {
                          backgroundImage: `url(${activeBackground})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center'
                        } : {})
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-gray-950/80 to-black/80" style={{ borderRadius: '0 0 32px 32px' }} />
                      <div className="relative z-10">
                        <div className="mb-4">
                          <h3 className="text-xl font-bold text-white mb-2">Stations Disponibles</h3>
                          <p className="text-slate-400 text-sm">Sélectionnez une station pour commencer l'écoute</p>
                        </div>
                        <RadioStationsGrid />
                      </div>
                    </div>
                  ) : (
                  <div
                    className="absolute inset-0 z-0 flex items-center justify-center"
                    style={{
                      borderRadius: '0 0 32px 32px',
                      boxShadow: 'inset 0 0 80px rgba(0, 0, 0, 0.7), inset 0 0 40px rgba(217, 119, 6, 0.1)',
                      willChange: 'transform',
                      ...(activeBackground ? {
                        backgroundImage: `url(${activeBackground})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                      } : {
                        background: 'linear-gradient(to bottom right, rgb(0, 0, 0), rgb(17, 24, 39), rgb(0, 0, 0))'
                      })
                    }}
                  >
                    {activeBackground && (
                      <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-gray-950/60 to-black/60" style={{ borderRadius: '0 0 32px 32px' }} />
                    )}
                    {selectedDemoVideo ? (
                      <div className="relative w-full h-full flex items-center justify-center">
                        <div className="relative w-full aspect-video" style={{ maxHeight: '100%', maxWidth: '100%' }}>
                          <iframe
                            src={getYouTubeEmbedUrl(selectedDemoVideo.video_url)}
                            className="w-full h-full"
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
                      </div>
                    ) : (
                      <>
                        <div id="youtube-player-anchor" className="absolute inset-0 w-full h-full" />
                        {!currentProgram && upcomingPrograms.length === 0 && (
                          <div className="absolute inset-0 flex items-center justify-center text-white/70 pointer-events-none z-20">
                            <div className="text-center space-y-6">
                              <div className="mx-auto w-64 h-64 relative">
                                <Image
                                  src="/image_(4).png"
                                  alt="ALTESS"
                                  fill
                                  className="object-contain"
                                  priority
                                />
                              </div>
                              <div>
                                <p className="text-lg text-white/80 font-medium">Aucun programme en cours</p>
                                <p className="text-sm opacity-70 mt-2">Sélectionnez un programme dans la liste</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  )}
                </CardContent>
              </Card>

              {/* Bandeau Publicitaire - Intégré avec la TV */}
              <div className="w-full">
                <AdvertisingTicker />
              </div>
            </div>
          )}

          {/* Annonces Premium */}
          {!loading && (
            <div className="mt-12 mb-8 sm:mb-12">
              <PremiumAdsGrid />
            </div>
          )}


          {/* Partenaires Premium */}
          {!loading && (
            <div className="mt-8 mb-16 sm:mt-12">
              <FeaturedPartnersSection />
            </div>
          )}
        </div>
      </div>

      <OrchestraComposer open={composerOpen} onClose={() => setComposerOpen(false)} />
      <Footer />
    </div>
  );
}
