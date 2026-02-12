'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import NetflixCarousel from '@/components/NetflixCarousel';
import Footer from '@/components/Footer';
// import WhatsAppChat from '@/components/WhatsAppChat';
import { Play, Music2, Users, Calendar, Award, Sparkles, FileText, Star, BookOpen, Mic2, ExternalLink } from 'lucide-react';

type DemoVideo = {
  id: string;
  title: string;
  description: string;
  video_url: string;
  thumbnail_url: string;
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

export default function OrientaleMusiqueHomePage() {
  const router = useRouter();
  const [demoVideos, setDemoVideos] = useState<DemoVideo[]>([]);
  const [carouselMedia, setCarouselMedia] = useState<CarouselMediaItem[]>([]);
  const [selectedDemoVideo, setSelectedDemoVideo] = useState<DemoVideo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [demoRes, carouselRes] = await Promise.all([
        supabase
          .from('demo_videos')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true }),
        supabase
          .from('carousel_media')
          .select('*')
          .eq('is_active', true)
          .eq('category', 'home')
          .order('order_position', { ascending: true })
      ]);

      if (demoRes.data) setDemoVideos(demoRes.data);
      if (carouselRes.data) setCarouselMedia(carouselRes.data);
    } catch (error) {
      console.error('Error loading orchestra data:', error);
    } finally {
      setLoading(false);
    }
  }

  function getYouTubeEmbedUrl(url: string): string {
    const videoIdMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube-nocookie\.com\/embed\/)([^&\s?]+)/);
    if (videoIdMatch) {
      return `https://www.youtube-nocookie.com/embed/${videoIdMatch[1]}?autoplay=1&controls=1&rel=0`;
    }
    return url;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <Navigation />
        <div className="container mx-auto px-4 py-20 flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Navigation />
      {/* <WhatsAppChat /> */}

      {/* HERO SECTION MAJESTUEUSE */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image with overlay */}
        <div className="absolute inset-0 z-0">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url('https://images.pexels.com/photos/1047442/pexels-photo-1047442.jpeg')`,
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black via-black/80 to-black" />
          <div className="absolute inset-0 bg-gradient-radial from-transparent via-black/50 to-black" />
        </div>

        {/* Content */}
        <div className="relative z-10 container mx-auto px-4 pt-32 pb-20 text-center">
          {/* Logo Icon */}
          <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-amber-500/10 border-4 border-amber-500/30 mb-8 backdrop-blur-sm">
            <Music2 className="w-16 h-16 text-amber-500" />
          </div>

          {/* Title */}
          <h1 className="text-6xl md:text-8xl font-bold mb-8 bg-gradient-to-r from-amber-300 via-amber-500 to-amber-300 bg-clip-text text-transparent animate-pulse">
            Orientale Musique
          </h1>

          {/* Subtitle */}
          <p className="text-2xl md:text-3xl text-amber-400/90 mb-6 font-light tracking-wide">
            L'Excellence Musicale Pour Vos Événements Prestigieux
          </p>

          <p className="text-lg md:text-xl text-gray-300 max-w-4xl mx-auto mb-12 leading-relaxed">
            Des musiciens d'exception, un répertoire incomparable, une prestation sur-mesure.
            Sublimez vos mariages, galas et réceptions avec notre orchestre exclusif.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto mb-16">
            <div className="bg-black/50 backdrop-blur-sm border border-amber-500/20 rounded-xl p-6 hover:border-amber-500/40 transition-all">
              <Users className="w-10 h-10 text-amber-500 mx-auto mb-3" />
              <div className="text-3xl font-bold text-amber-500 mb-1">30+</div>
              <div className="text-sm text-gray-400">Années d'Expérience</div>
            </div>
            <div className="bg-black/50 backdrop-blur-sm border border-amber-500/20 rounded-xl p-6 hover:border-amber-500/40 transition-all">
              <Calendar className="w-10 h-10 text-amber-500 mx-auto mb-3" />
              <div className="text-3xl font-bold text-amber-500 mb-1">500+</div>
              <div className="text-sm text-gray-400">Événements Réalisés</div>
            </div>
            <div className="bg-black/50 backdrop-blur-sm border border-amber-500/20 rounded-xl p-6 hover:border-amber-500/40 transition-all">
              <Award className="w-10 h-10 text-amber-500 mx-auto mb-3" />
              <div className="text-3xl font-bold text-amber-500 mb-1">100%</div>
              <div className="text-sm text-gray-400">Satisfaction Client</div>
            </div>
            <div className="bg-black/50 backdrop-blur-sm border border-amber-500/20 rounded-xl p-6 hover:border-amber-500/40 transition-all">
              <Sparkles className="w-10 h-10 text-amber-500 mx-auto mb-3" />
              <div className="text-3xl font-bold text-amber-500 mb-1">Premium</div>
              <div className="text-sm text-gray-400">Qualité Garantie</div>
            </div>
          </div>

          {/* Site White Label - Bouton mis en avant */}
          <div className="max-w-4xl mx-auto mb-12">
            <Card className="bg-gradient-to-r from-amber-900/40 via-amber-800/40 to-amber-900/40 border-2 border-amber-500 hover:shadow-2xl hover:shadow-amber-500/30 transition-all duration-300 overflow-hidden">
              <CardContent className="p-8 md:p-10 text-center relative">
                <div className="absolute top-0 right-0 bg-amber-500 text-black px-4 py-1 text-sm font-bold rounded-bl-lg">
                  NOUVEAU ✨
                </div>
                <Sparkles className="w-12 h-12 text-amber-500 mx-auto mb-4 animate-pulse" />
                <h3 className="text-3xl font-bold text-white mb-3">Découvrez Notre Site Dédié</h3>
                <p className="text-lg text-amber-100/80 mb-6 max-w-2xl mx-auto">
                  Explorez l'univers complet d'Orientale Musique sur notre site professionnel avec toutes nos prestations, galeries et formules exclusives
                </p>
                <Button
                  size="lg"
                  onClick={() => router.push('/orientale-musique')}
                  className="bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-black font-bold text-lg px-8 py-6 shadow-lg shadow-amber-500/50 group"
                >
                  <ExternalLink className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                  Visiter Orientale-Musique.fr
                  <ExternalLink className="w-5 h-5 ml-2 group-hover:scale-110 transition-transform" />
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Main Navigation Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {/* Composer mon Orchestre */}
            <Card
              className="bg-gradient-to-br from-amber-600 to-amber-700 border-2 border-amber-500 hover:scale-105 transition-transform duration-300 cursor-pointer group"
              onClick={() => router.push('/composer-orchestre')}
            >
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-black/20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-black/30 transition-colors">
                  <Music2 className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-black mb-2">Composer mon Orchestre</h3>
                <p className="text-sm text-black/80">Créez votre formation sur mesure</p>
              </CardContent>
            </Card>

            {/* Nos Formules */}
            <Card
              className="bg-black/70 backdrop-blur-sm border-2 border-amber-500/50 hover:border-amber-500 hover:scale-105 transition-all duration-300 cursor-pointer group"
              onClick={() => router.push('/evenementiel/notre-orchestre/formules')}
            >
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-amber-500/30 transition-colors">
                  <FileText className="w-8 h-8 text-amber-500" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Nos Formules</h3>
                <p className="text-sm text-gray-400">Découvrez nos packages</p>
              </CardContent>
            </Card>

            {/* Nos Stars */}
            <Card
              className="bg-black/70 backdrop-blur-sm border-2 border-amber-500/50 hover:border-amber-500 hover:scale-105 transition-all duration-300 cursor-pointer group"
              onClick={() => router.push('/evenementiel/notre-orchestre/stars')}
            >
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-amber-500/30 transition-colors">
                  <Star className="w-8 h-8 text-amber-500" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Nos Stars</h3>
                <p className="text-sm text-gray-400">Artistes d'exception</p>
              </CardContent>
            </Card>

            {/* Références & Blog */}
            <Card
              className="bg-black/70 backdrop-blur-sm border-2 border-amber-500/50 hover:border-amber-500 hover:scale-105 transition-all duration-300 cursor-pointer group"
              onClick={() => router.push('/evenementiel/notre-orchestre/references')}
            >
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-amber-500/30 transition-colors">
                  <BookOpen className="w-8 h-8 text-amber-500" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Références & Blog</h3>
                <p className="text-sm text-gray-400">Nos réalisations</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* VIDEOS DEMONSTRATION SECTION */}
      {demoVideos.length > 0 && (
        <section className="py-20 bg-gradient-to-b from-black via-zinc-950 to-black">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center gap-3 mb-4">
                <Play className="w-8 h-8 text-amber-500" />
                <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
                  Nos Performances en Vidéo
                </h2>
              </div>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                Découvrez la magie de nos prestations à travers ces moments d'exception
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {demoVideos.map((video) => (
                <Card
                  key={video.id}
                  className="overflow-hidden cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-amber-500/30 group bg-black border-2 border-amber-500/20 hover:border-amber-500"
                  onClick={() => setSelectedDemoVideo(video)}
                >
                  <div className="relative aspect-video overflow-hidden bg-black">
                    <img
                      src={video.thumbnail_url}
                      alt={video.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="w-20 h-20 rounded-full bg-amber-500 flex items-center justify-center shadow-2xl shadow-amber-500/50">
                        <Play className="w-10 h-10 text-black ml-1" />
                      </div>
                    </div>
                  </div>
                  <CardContent className="p-6 bg-gradient-to-b from-black to-zinc-950">
                    <h3 className="font-bold text-xl mb-2 text-amber-500 group-hover:text-amber-400 transition-colors">
                      {video.title}
                    </h3>
                    <p className="text-sm text-gray-400 leading-relaxed">{video.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* GALLERY CAROUSEL SECTION */}
      {carouselMedia.length > 0 && (
        <section className="py-20 bg-black">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center gap-3 mb-4">
                <Mic2 className="w-8 h-8 text-amber-500" />
                <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
                  Galerie Photos & Vidéos
                </h2>
              </div>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                Plongez dans l'univers d'Orientale Musique
              </p>
            </div>
            <NetflixCarousel
              items={carouselMedia.map(item => ({
                type: item.type,
                url: item.url,
                thumbnail: item.thumbnail_url || undefined,
                title: item.title
              }))}
            />
          </div>
        </section>
      )}

      {/* ABOUT SECTION */}
      <section className="py-20 bg-gradient-to-b from-black via-zinc-950 to-black">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="bg-gradient-to-br from-zinc-950 via-black to-zinc-950 border-2 border-amber-500/30 rounded-3xl p-8 md:p-16 shadow-2xl shadow-amber-500/10">
              <div className="flex items-center gap-4 mb-8">
                <Sparkles className="w-12 h-12 text-amber-500" />
                <h2 className="text-4xl md:text-5xl font-bold text-white">
                  L'Excellence Musicale
                </h2>
              </div>

              <div className="space-y-6 text-lg text-gray-300 leading-relaxed">
                <p>
                  <span className="text-amber-400 font-semibold text-xl">Orientale Musique</span> est bien plus qu'un simple orchestre.
                  C'est une formation musicale d'exception, composée de <span className="text-amber-400 font-semibold">musiciens professionnels
                  reconnus</span> sur la scène internationale, qui mettent leur talent au service de vos moments uniques.
                </p>

                <p>
                  Que ce soit pour un <span className="text-amber-400 font-semibold">mariage, une réception d'entreprise, un gala ou tout autre événement prestigieux</span>,
                  notre orchestre s'adapte à vos besoins avec un répertoire riche allant du <span className="text-amber-400 font-semibold">traditionnel oriental
                  au moderne</span>, en passant par le jazz, la variété française et internationale.
                </p>

                <p>
                  Chaque prestation est <span className="text-amber-400 font-semibold">méticuleusement préparée</span> et personnalisée selon vos souhaits.
                  Nous garantissons une <span className="text-amber-400 font-semibold">qualité sonore impeccable</span> et une ambiance inoubliable
                  qui marquera les esprits de vos invités.
                </p>
              </div>

              {/* CTA Button */}
              <div className="mt-12 text-center">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-bold text-lg px-12 py-6 rounded-full shadow-2xl shadow-amber-500/30 hover:scale-105 transition-transform"
                  onClick={() => router.push('/composer-orchestre')}
                >
                  <Music2 className="w-6 h-6 mr-3" />
                  Composer Mon Orchestre Maintenant
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* VIDEO MODAL */}
      {selectedDemoVideo && (
        <div className="fixed inset-0 bg-black/95 z-[100000] flex items-center justify-center p-4">
          <div className="relative w-full max-w-6xl">
            <Button
              className="absolute -top-12 right-0 z-20 bg-amber-500 hover:bg-amber-600 text-black font-semibold"
              onClick={() => setSelectedDemoVideo(null)}
            >
              Fermer
            </Button>
            <div className="aspect-video w-full border-4 border-amber-500/50 rounded-xl overflow-hidden">
              <iframe
                src={getYouTubeEmbedUrl(selectedDemoVideo.video_url)}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
