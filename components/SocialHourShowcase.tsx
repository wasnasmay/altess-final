'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { supabase } from '@/lib/supabase';
import {
  Play,
  Pause,
  Crown,
  SkipForward,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Sparkles,
  MapPin,
  ArrowRight,
  Info,
  MessageCircle,
  Phone,
  FileText
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import QuoteRequestDrawer from '@/components/QuoteRequestDrawer';

interface SocialVideo {
  id: string;
  video_url: string;
  platform: string;
  title: string;
  duration: number;
  provider_id: string;
  event_provider?: {
    slug: string;
    company_name: string;
    city: string;
    profile: {
      full_name: string;
    };
  };
}

const DEMO_VIDEOS: SocialVideo[] = [
  {
    id: '1',
    video_url: 'https://example.com/video1',
    platform: 'instagram',
    title: 'Décoration mariage oriental de luxe',
    duration: 30,
    provider_id: 'demo-1',
    event_provider: {
      slug: 'royal-palace-decoration',
      company_name: 'Royal Palace Décoration',
      city: 'Paris',
      profile: { full_name: 'Royal Palace Décoration' }
    }
  },
  {
    id: '2',
    video_url: 'https://example.com/video2',
    platform: 'tiktok',
    title: 'Buffet oriental premium',
    duration: 45,
    provider_id: 'demo-2',
    event_provider: {
      slug: 'delices-orient-traiteur',
      company_name: 'Délices d\'Orient Traiteur',
      city: 'Lyon',
      profile: { full_name: 'Délices d\'Orient Traiteur' }
    }
  },
  {
    id: '3',
    video_url: 'https://example.com/video3',
    platform: 'instagram',
    title: 'Animation DJ oriental',
    duration: 25,
    provider_id: 'demo-3',
    event_provider: {
      slug: 'beats-oriental-music',
      company_name: 'Beats & Oriental Music',
      city: 'Marseille',
      profile: { full_name: 'Beats & Oriental Music' }
    }
  },
  {
    id: '4',
    video_url: 'https://example.com/video4',
    platform: 'youtube',
    title: 'Showreel événementiel de prestige',
    duration: 60,
    provider_id: 'demo-4',
    event_provider: {
      slug: 'prestige-events-production',
      company_name: 'Prestige Events Production',
      city: 'Nice',
      profile: { full_name: 'Prestige Events Production' }
    }
  },
];

export default function SocialHourShowcase() {
  const [videos, setVideos] = useState<SocialVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedPlatform, setSelectedPlatform] = useState<'all' | 'instagram' | 'tiktok' | 'youtube'>('all');
  const [quoteDrawerOpen, setQuoteDrawerOpen] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  const filteredVideos = selectedPlatform === 'all'
    ? videos
    : videos.filter(v => v.platform === selectedPlatform);

  useEffect(() => {
    loadActiveVideos();
  }, []);

  useEffect(() => {
    if (isPlaying && filteredVideos.length > 0) {
      startVideoTimer();
    } else {
      stopVideoTimer();
    }
    return () => stopVideoTimer();
  }, [isPlaying, currentIndex, filteredVideos]);

  useEffect(() => {
    setCurrentIndex(0);
    setProgress(0);
  }, [selectedPlatform]);

  async function loadActiveVideos() {
    try {
      // Récupérer les vidéos avec les infos du prestataire
      const { data, error } = await supabase
        .from('provider_social_videos')
        .select(`
          *,
          event_provider:event_providers!provider_social_videos_provider_id_fkey(
            slug,
            company_name,
            city,
            profile:profiles(full_name)
          )
        `)
        .eq('is_active', true)
        .eq('is_premium', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        setVideos(data as any);
      } else {
        setVideos(DEMO_VIDEOS);
      }
    } catch (error) {
      console.error('Error loading videos:', error);
      setVideos(DEMO_VIDEOS);
    } finally {
      setLoading(false);
    }
  }

  const startVideoTimer = useCallback(() => {
    stopVideoTimer();
    startTimeRef.current = Date.now();

    const currentVideo = filteredVideos[currentIndex];
    if (!currentVideo) return;

    const duration = (currentVideo.duration || 30) * 1000;

    const updateProgress = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const newProgress = Math.min((elapsed / duration) * 100, 100);
      setProgress(newProgress);

      if (newProgress >= 100) {
        nextVideo();
      } else {
        timerRef.current = setTimeout(updateProgress, 100);
      }
    };

    updateProgress();
  }, [currentIndex, filteredVideos]);

  const stopVideoTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const nextVideo = useCallback(() => {
    setProgress(0);
    setCurrentIndex((prev) => (prev + 1) % filteredVideos.length);
    startTimeRef.current = Date.now();
  }, [filteredVideos]);

  const prevVideo = useCallback(() => {
    setProgress(0);
    setCurrentIndex((prev) => (prev - 1 + filteredVideos.length) % filteredVideos.length);
    startTimeRef.current = Date.now();
  }, [filteredVideos]);

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const currentVideo = filteredVideos[currentIndex];
  const avgDuration = videos.length > 0
    ? Math.round(videos.reduce((acc, v) => acc + (v.duration || 30), 0) / videos.length)
    : 30;

  if (loading) return null;
  if (filteredVideos.length === 0) return null;

  return (
    <section className="relative py-6 md:py-8 px-2 sm:px-4 bg-gradient-to-b from-zinc-950 via-black to-zinc-950 pt-24 md:pt-32">
      <div className="container mx-auto max-w-6xl w-full">
        {/* Header compact mobile */}
        <div className="text-center mb-4 md:mb-6 px-2 md:px-0">
          <div className="inline-flex items-center gap-1.5 md:gap-2 border border-amber-600/30 rounded-full px-3 md:px-4 py-1 md:py-1.5 mb-2 md:mb-3 bg-amber-600/5 backdrop-blur-sm">
            <Crown className="w-3 md:w-3.5 h-3 md:h-3.5 text-amber-500" />
            <span className="text-[11px] md:text-xs font-medium text-amber-500 tracking-wide">
              SÉLECTION PRESTIGE
            </span>
          </div>

          <h2 className="text-lg md:text-2xl lg:text-3xl font-semibold mb-1 md:mb-2 text-white">
            La Sélection Prestige ALTESS
          </h2>

          <p className="text-xs md:text-sm text-gray-400 max-w-md mx-auto">
            L'élite des prestataires événementiels
          </p>
        </div>

        <div className="flex flex-col lg:flex-row items-center justify-center gap-4 md:gap-6 lg:gap-8 max-w-5xl mx-auto">
          {/* Smartphone Frame - Optimisé Mobile */}
          <div className="relative w-full lg:w-auto flex justify-center">
            {/* Cadre Smartphone Doré */}
            <div className="relative w-full max-w-[320px] sm:max-w-[340px] lg:w-[320px] mx-auto">
              {/* Notch supérieure */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-gradient-to-b from-amber-600 to-amber-700 rounded-b-3xl z-10 shadow-lg">
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-16 h-1 bg-black/30 rounded-full" />
              </div>

              {/* Corps du téléphone */}
              <div className="relative bg-gradient-to-br from-amber-600 via-amber-500 to-amber-600 rounded-[2.5rem] p-3 shadow-2xl shadow-amber-600/30">
                {/* Écran */}
                <div className="relative aspect-[9/19.5] bg-black rounded-[2rem] overflow-hidden border-2 border-black">
                  {/* Contenu vidéo */}
                  <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-black to-zinc-900 flex items-center justify-center p-4">
                    {currentVideo && (
                      <div className="text-center w-full">
                        {/* Bouton Play/Pause */}
                        <button
                          onClick={togglePlayPause}
                          className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
                        >
                          {isPlaying ? (
                            <Pause className="w-8 h-8 text-black" />
                          ) : (
                            <Play className="w-8 h-8 text-black ml-0.5" />
                          )}
                        </button>

                        {/* Infos vidéo */}
                        <h3 className="text-sm font-medium text-white mb-1 px-2 line-clamp-2">
                          {currentVideo.title}
                        </h3>

                        <p className="text-xs text-amber-400 font-light mb-1">
                          {currentVideo.event_provider?.company_name || currentVideo.event_provider?.profile?.full_name}
                        </p>

                        {currentVideo.event_provider?.city && (
                          <div className="flex items-center justify-center gap-1 text-gray-500 mb-2">
                            <MapPin className="w-3 h-3" />
                            <span className="text-xs">{currentVideo.event_provider.city}</span>
                          </div>
                        )}

                        <Badge variant="outline" className="border-amber-600/40 text-amber-600 text-xs capitalize">
                          {currentVideo.platform.charAt(0).toUpperCase() + currentVideo.platform.slice(1)}
                        </Badge>
                      </div>
                    )}
                  </div>

                  {/* Badge Live */}
                  <div className="absolute top-2 right-2 z-20">
                    <div className="bg-black/80 backdrop-blur-sm border border-amber-600/40 rounded-full px-2 py-1 flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse" />
                      <span className="text-xs font-light text-amber-600">LIVE</span>
                    </div>
                  </div>

                  {/* Barre de progression */}
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-900">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-amber-600 transition-all duration-100"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Bouton home simulé */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-20 h-1 bg-amber-700/50 rounded-full" />

              {/* Bouton WhatsApp flottant sur le smartphone */}
              <a
                href={`https://wa.me/?text=Je souhaite en savoir plus sur ${currentVideo?.event_provider?.company_name}`}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute bottom-20 right-6 z-30 w-12 h-12 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center shadow-2xl shadow-green-500/50 transition-all hover:scale-110"
              >
                <MessageCircle className="w-6 h-6 text-white" />
              </a>
            </div>
          </div>

          {/* Panneau Info Desktop uniquement */}
          <div className="hidden lg:block lg:flex-1 max-w-sm space-y-3">
            {/* Accroche Éditoriale */}
            <Card className="bg-gradient-to-br from-amber-600/10 to-transparent border border-amber-600/30">
              <CardContent className="p-4">
                <div className="flex items-start gap-3 mb-3">
                  <Sparkles className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-300 leading-relaxed">
                    <span className="font-medium text-white">Ne perdez plus de temps à scroller sur les réseaux sociaux.</span>
                    {' '}ALTESS a sélectionné pour vous l'élite des prestataires.
                  </p>
                </div>
                <p className="text-xs text-amber-400/80 italic">
                  Découvrez notre synthèse exclusive mise à jour en temps réel.
                </p>
              </CardContent>
            </Card>

            {/* Statistiques Compactes */}
            <Card className="bg-zinc-900/50 border border-amber-600/20">
              <CardContent className="p-4">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <div className="text-lg font-bold text-amber-600">{currentIndex + 1}/{filteredVideos.length}</div>
                    <div className="text-xs text-gray-500">Vidéo</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-amber-600">{avgDuration}s</div>
                    <div className="text-xs text-gray-500">Durée</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-amber-600">9:16</div>
                    <div className="text-xs text-gray-500">Format</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Filtres Plateforme */}
            <Card className="bg-zinc-900/50 border border-zinc-800">
              <CardContent className="p-3">
                <div className="grid grid-cols-2 gap-1.5">
                  <Button
                    onClick={() => setSelectedPlatform('all')}
                    size="sm"
                    variant="ghost"
                    className={`h-7 text-xs ${
                      selectedPlatform === 'all'
                        ? 'bg-amber-600/10 text-amber-600 border border-amber-600/30'
                        : 'border border-zinc-800 text-gray-500'
                    }`}
                  >
                    Tous
                  </Button>
                  <Button
                    onClick={() => setSelectedPlatform('instagram')}
                    size="sm"
                    variant="ghost"
                    className={`h-7 text-xs ${
                      selectedPlatform === 'instagram'
                        ? 'bg-amber-600/10 text-amber-600 border border-amber-600/30'
                        : 'border border-zinc-800 text-gray-500'
                    }`}
                  >
                    IG
                  </Button>
                  <Button
                    onClick={() => setSelectedPlatform('tiktok')}
                    size="sm"
                    variant="ghost"
                    className={`h-7 text-xs ${
                      selectedPlatform === 'tiktok'
                        ? 'bg-amber-600/10 text-amber-600 border border-amber-600/30'
                        : 'border border-zinc-800 text-gray-500'
                    }`}
                  >
                    TikTok
                  </Button>
                  <Button
                    onClick={() => setSelectedPlatform('youtube')}
                    size="sm"
                    variant="ghost"
                    className={`h-7 text-xs ${
                      selectedPlatform === 'youtube'
                        ? 'bg-amber-600/10 text-amber-600 border border-amber-600/30'
                        : 'border border-zinc-800 text-gray-500'
                    }`}
                  >
                    YouTube
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* CTA Réservation */}
            <Button
              onClick={() => setQuoteDrawerOpen(true)}
              className="w-full bg-gradient-to-r from-amber-600 to-amber-500 text-black hover:from-amber-500 hover:to-amber-600 h-10 text-sm font-medium shadow-lg"
            >
              <FileText className="w-4 h-4 mr-2" />
              Demander un Devis
            </Button>

            {/* Features compactes */}
            <Card className="bg-zinc-900/30 border border-zinc-800">
              <CardContent className="p-3">
                <div className="space-y-1.5 text-xs text-gray-500">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3 h-3 text-amber-600" />
                    <span>Cadre smartphone doré exclusif</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3 h-3 text-amber-600" />
                    <span>Enchaînement automatique</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3 h-3 text-amber-600" />
                    <span>Diffusion Premium 24/7</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Barre d'Action Flottante Mobile */}
        <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/98 to-transparent lg:hidden z-40 pb-safe backdrop-blur-lg border-t border-amber-600/10">
          <div className="px-3 py-3 space-y-2">
            {/* Navigation Vidéos + Drawer Info */}
            <div className="flex items-center gap-2">
              <Button
                onClick={prevVideo}
                size="sm"
                variant="ghost"
                className="border border-amber-600/30 bg-black/40 text-amber-500 hover:bg-amber-600/10 hover:border-amber-500 h-11 px-4 backdrop-blur-sm"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>

              <Sheet>
                <SheetTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 border-amber-600/40 bg-black/40 text-amber-500 hover:bg-amber-600/10 h-11 text-sm font-medium backdrop-blur-sm"
                  >
                    <Info className="w-4 h-4 mr-2" />
                    Informations
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="bg-zinc-950 border-t border-zinc-800 h-[70vh]">
                  <div className="space-y-4 py-4">
                    {/* Statistiques */}
                    <Card className="bg-zinc-900/50 border border-amber-600/20">
                      <CardContent className="p-4">
                        <div className="grid grid-cols-3 gap-3 text-center">
                          <div>
                            <div className="text-lg font-bold text-amber-600">{currentIndex + 1}/{filteredVideos.length}</div>
                            <div className="text-xs text-gray-500">Vidéo</div>
                          </div>
                          <div>
                            <div className="text-lg font-bold text-amber-600">{avgDuration}s</div>
                            <div className="text-xs text-gray-500">Durée</div>
                          </div>
                          <div>
                            <div className="text-lg font-bold text-amber-600">9:16</div>
                            <div className="text-xs text-gray-500">Format</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Accroche */}
                    <Card className="bg-gradient-to-br from-amber-600/10 to-transparent border border-amber-600/30">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3 mb-3">
                          <Sparkles className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                          <p className="text-sm text-gray-300 leading-relaxed">
                            <span className="font-medium text-white">Ne perdez plus de temps à scroller sur les réseaux sociaux.</span>
                            {' '}ALTESS a sélectionné pour vous l'élite des prestataires.
                          </p>
                        </div>
                        <p className="text-xs text-amber-400/80 italic">
                          Découvrez notre synthèse exclusive mise à jour en temps réel.
                        </p>
                      </CardContent>
                    </Card>

                    {/* Filtres */}
                    <Card className="bg-zinc-900/50 border border-zinc-800">
                      <CardContent className="p-3">
                        <p className="text-xs text-gray-400 mb-2">Filtrer par plateforme</p>
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            onClick={() => setSelectedPlatform('all')}
                            size="sm"
                            variant="ghost"
                            className={`h-9 text-xs ${
                              selectedPlatform === 'all'
                                ? 'bg-amber-600/10 text-amber-600 border border-amber-600/30'
                                : 'border border-zinc-800 text-gray-500'
                            }`}
                          >
                            Tous
                          </Button>
                          <Button
                            onClick={() => setSelectedPlatform('instagram')}
                            size="sm"
                            variant="ghost"
                            className={`h-9 text-xs ${
                              selectedPlatform === 'instagram'
                                ? 'bg-amber-600/10 text-amber-600 border border-amber-600/30'
                                : 'border border-zinc-800 text-gray-500'
                            }`}
                          >
                            Instagram
                          </Button>
                          <Button
                            onClick={() => setSelectedPlatform('tiktok')}
                            size="sm"
                            variant="ghost"
                            className={`h-9 text-xs ${
                              selectedPlatform === 'tiktok'
                                ? 'bg-amber-600/10 text-amber-600 border border-amber-600/30'
                                : 'border border-zinc-800 text-gray-500'
                            }`}
                          >
                            TikTok
                          </Button>
                          <Button
                            onClick={() => setSelectedPlatform('youtube')}
                            size="sm"
                            variant="ghost"
                            className={`h-9 text-xs ${
                              selectedPlatform === 'youtube'
                                ? 'bg-amber-600/10 text-amber-600 border border-amber-600/30'
                                : 'border border-zinc-800 text-gray-500'
                            }`}
                          >
                            YouTube
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Features */}
                    <Card className="bg-zinc-900/30 border border-zinc-800">
                      <CardContent className="p-3">
                        <div className="space-y-2 text-xs text-gray-500">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-amber-600" />
                            <span>Cadre smartphone doré exclusif</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-amber-600" />
                            <span>Enchaînement automatique</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-amber-600" />
                            <span>Diffusion Premium 24/7</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </SheetContent>
              </Sheet>

              <Button
                onClick={nextVideo}
                size="sm"
                variant="ghost"
                className="border border-amber-600/30 bg-black/40 text-amber-500 hover:bg-amber-600/10 hover:border-amber-500 h-11 px-4 backdrop-blur-sm"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>

            {/* CTA Principal */}
            <Button
              onClick={() => setQuoteDrawerOpen(true)}
              className="w-full bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-black hover:from-amber-500 hover:to-amber-400 h-12 text-sm font-bold shadow-2xl shadow-amber-600/50 hover:shadow-amber-500/70 transition-all"
            >
              <FileText className="w-4 h-4 mr-2" />
              Demander un Devis
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </div>

      {/* Drawer de Demande de Devis */}
      <QuoteRequestDrawer
        open={quoteDrawerOpen}
        onOpenChange={setQuoteDrawerOpen}
        providerName={currentVideo?.event_provider?.company_name || currentVideo?.event_provider?.profile?.full_name}
        providerSlug={currentVideo?.event_provider?.slug}
      />
    </section>
  );
}
