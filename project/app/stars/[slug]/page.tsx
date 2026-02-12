'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import {
  Star,
  ArrowLeft,
  Share2,
  Award,
  Music,
  Play
} from 'lucide-react';
import Footer from '@/components/Footer';
// import WhatsAppChat from '@/components/WhatsAppChat';
import NetflixCarousel from '@/components/NetflixCarousel';
import Image from 'next/image';

type StarArtist = {
  id: string;
  name: string;
  slug: string;
  instrument: string;
  speciality: string;
  short_bio: string;
  full_bio: string;
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string | null;
  og_image: string | null;
  main_image: string | null;
  gallery_images: string[];
  achievements: string[];
  repertoire: string[];
  youtube_videos: string[];
};

export default function StarDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const [star, setStar] = useState<StarArtist | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStarData();
  }, [slug]);

  useEffect(() => {
    if (star) {
      document.title = star.seo_title || `${star.name} | Orientale Musique`;

      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', star.seo_description || star.short_bio);
      }

      const ogTitle = document.querySelector('meta[property="og:title"]');
      if (ogTitle) {
        ogTitle.setAttribute('content', star.seo_title || star.name);
      }

      const ogDescription = document.querySelector('meta[property="og:description"]');
      if (ogDescription) {
        ogDescription.setAttribute('content', star.seo_description || star.short_bio);
      }

      const ogImage = document.querySelector('meta[property="og:image"]');
      if (ogImage && (star.og_image || star.main_image)) {
        ogImage.setAttribute('content', star.og_image || star.main_image || '');
      }
    }
  }, [star]);

  async function loadStarData() {
    try {
      const { data, error } = await supabase
        .from('stars')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        router.push('/stars');
        return;
      }

      setStar(data);
    } catch (error) {
      console.error('Error loading star:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }

  async function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: star?.name,
          text: star?.short_bio,
          url: url,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      navigator.clipboard.writeText(url);
      toast.success('Lien copié dans le presse-papier');
    }
  }

  function extractYouTubeId(url: string): string | null {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-black">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  if (!star) {
    return null;
  }

  const galleryMedia = star.gallery_images.length > 0
    ? star.gallery_images.map(url => ({
        type: 'image' as const,
        url,
      }))
    : [];

  const videoMedia = star.youtube_videos.length > 0
    ? star.youtube_videos
        .map(url => {
          const videoId = extractYouTubeId(url);
          return videoId ? {
            type: 'video' as const,
            url: videoId,
          } : null;
        })
        .filter((item): item is { type: 'video'; url: string } => item !== null)
    : [];

  const allMedia = [...galleryMedia, ...videoMedia];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-black text-white">
      <Navigation />
      {/* <WhatsAppChat /> */}

      <header className="relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-950/50 to-slate-950 z-10" />

        <div className="relative h-[70vh] overflow-hidden">
          {star.main_image ? (
            <Image
              src={star.main_image}
              alt={`${star.name} - Artiste Orientale Musique`}
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
              <Music className="text-9xl text-amber-500/20" />
            </div>
          )}
        </div>

        <div className="absolute inset-0 z-20">
          <div className="container mx-auto px-4 py-8 h-full flex flex-col">
            <div className="flex items-center justify-between mb-auto">
              <Button
                variant="ghost"
                onClick={() => router.push('/stars')}
                className="text-white hover:text-amber-400 hover:bg-white/10"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour aux stars
              </Button>
              <Button
                variant="ghost"
                onClick={handleShare}
                className="text-white hover:text-amber-400 hover:bg-white/10"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Partager
              </Button>
            </div>

            <div className="mt-auto mb-12">
              <div className="flex items-center gap-2 mb-4">
                <Star className="w-8 h-8 text-amber-400 fill-amber-400" />
                <span className="px-4 py-2 bg-amber-500/90 text-black rounded-full text-sm font-semibold">
                  {star.instrument}
                </span>
              </div>
              <h1 className="text-5xl lg:text-7xl font-bold mb-4 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400 bg-clip-text text-transparent drop-shadow-2xl">
                {star.name}
              </h1>
              <p className="text-2xl text-amber-400 font-semibold mb-6 drop-shadow-lg">
                {star.speciality}
              </p>
              <p className="text-xl text-slate-200 max-w-3xl drop-shadow-lg">
                {star.short_bio}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16">
        <div className="grid lg:grid-cols-3 gap-12 mb-16">
          <article className="lg:col-span-2 space-y-8">
            <section>
              <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                Biographie
              </h2>
              <div className="prose prose-invert prose-lg max-w-none">
                <div className="text-slate-300 leading-relaxed text-lg space-y-6 whitespace-pre-line">
                  {star.full_bio}
                </div>
              </div>
            </section>

            {star.achievements.length > 0 && (
              <section>
                <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent flex items-center gap-3">
                  <Award className="w-8 h-8" />
                  Réalisations
                </h2>
                <div className="grid gap-3">
                  {star.achievements.map((achievement, index) => (
                    <Card
                      key={index}
                      className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/30"
                    >
                      <CardContent className="p-4 flex items-center gap-3">
                        <Star className="w-5 h-5 text-amber-400 fill-amber-400 flex-shrink-0" />
                        <span className="text-slate-300">{achievement}</span>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )}
          </article>

          <aside className="space-y-6">
            {star.repertoire.length > 0 && (
              <Card className="bg-gradient-to-br from-black via-gray-900 to-black border border-amber-500/30 shadow-2xl shadow-amber-500/10">
                <CardContent className="p-6">
                  <h3 className="text-2xl font-bold mb-4 flex items-center gap-2 text-amber-400">
                    <Music className="w-6 h-6" />
                    Répertoire
                  </h3>
                  <ul className="space-y-3">
                    {star.repertoire.map((item, index) => (
                      <li key={index} className="flex items-start gap-3 text-slate-300">
                        <Play className="w-4 h-4 text-amber-400 flex-shrink-0 mt-1" />
                        <span className="text-sm">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            <Card className="bg-gradient-to-br from-black via-gray-900 to-black border border-amber-500/30 shadow-2xl shadow-amber-500/10">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-4 text-amber-400">Réserver cet artiste</h3>
                <p className="text-sm text-slate-300 mb-4">
                  Disponible pour mariages, galas, concerts privés et événements prestigieux.
                </p>
                <Button
                  onClick={() => router.push('/composer-orchestre')}
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold"
                >
                  Demander un devis
                </Button>
              </CardContent>
            </Card>
          </aside>
        </div>

        {allMedia.length > 0 && (
          <section className="mb-16">
            <h2 className="text-4xl font-bold mb-8 text-center bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
              Galerie Multimédia
            </h2>
            <NetflixCarousel items={allMedia} />
          </section>
        )}

        <section className="text-center bg-gradient-to-br from-black via-gray-900 to-black border border-amber-500/30 rounded-2xl p-12 shadow-2xl shadow-amber-500/10">
          <h2 className="text-4xl font-bold mb-6 bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
            Réservez {star.name}
          </h2>
          <p className="text-xl text-slate-300 mb-4 max-w-2xl mx-auto leading-relaxed">
            Disponible partout en France pour vos événements prestigieux.
          </p>
          <p className="text-lg text-slate-400 mb-8 max-w-2xl mx-auto">
            Contactez-nous pour vérifier les disponibilités et recevoir un devis personnalisé.
          </p>
          <Button
            onClick={() => router.push('/composer-orchestre')}
            size="lg"
            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold px-12 py-6 text-lg shadow-2xl hover:shadow-amber-500/50 transition-all"
          >
            Demander un devis
          </Button>
        </section>
      </main>

      <Footer />
    </div>
  );
}
