'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Music } from 'lucide-react';
import Footer from '@/components/Footer';
// import WhatsAppChat from '@/components/WhatsAppChat';
import { PageSEOSection } from '@/components/PageSEOSection';

type StarArtist = {
  id: string;
  name: string;
  slug: string;
  instrument: string;
  speciality: string;
  short_bio: string;
  main_image: string | null;
  achievements: string[];
  display_order: number;
};

export default function StarsPage() {
  const router = useRouter();
  const [stars, setStars] = useState<StarArtist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStars();
  }, []);

  async function loadStars() {
    try {
      const { data, error } = await supabase
        .from('stars')
        .select('id, name, slug, instrument, speciality, short_bio, main_image, achievements, display_order')
        .eq('is_active', true)
        .order('display_order');

      if (error) throw error;
      setStars(data || []);
    } catch (error) {
      console.error('Error loading stars:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black">
        <Navigation />
        <div className="container mx-auto px-4 py-20">
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white">
      <Navigation />
      {/* <WhatsAppChat /> */}

      <div className="container mx-auto px-4 pt-32 pb-16">
        <header className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400 bg-clip-text text-transparent">
            Nos Stars
          </h1>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
            Découvrez nos artistes d'exception, virtuoses de la musique orientale.
            Des talents reconnus internationalement pour sublimer vos événements les plus prestigieux.
          </p>
        </header>

        <PageSEOSection pageSlug="stars" />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {stars.map((star) => (
            <Card
              key={star.id}
              className="overflow-hidden bg-gradient-to-br from-black via-gray-900 to-black border border-amber-500/20 hover:border-amber-500/40 transition-all duration-500 hover:shadow-2xl hover:shadow-amber-500/20 group flex flex-col h-full"
            >
              <div className="relative h-80 overflow-hidden bg-black">
                {star.main_image ? (
                  <>
                    <img
                      src={star.main_image}
                      alt={star.name}
                      className="w-full h-full object-cover opacity-90 transition-all duration-700 group-hover:scale-110 group-hover:opacity-100"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                  </>
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
                    <Music className="w-20 h-20 text-amber-500/20" />
                  </div>
                )}
                <div className="absolute top-4 left-4">
                  <Star className="w-8 h-8 text-amber-400 fill-amber-400" />
                </div>
                <Badge className="absolute top-4 right-4 bg-amber-500/90 text-black">
                  {star.instrument}
                </Badge>
              </div>

              <CardContent className="p-6 flex-1 flex flex-col">
                <h3 className="text-2xl font-bold mb-2 text-white text-center">
                  {star.name}
                </h3>

                <p className="text-sm text-amber-400 text-center mb-4 font-medium">
                  {star.speciality}
                </p>

                <p className="text-gray-400 mb-6 text-sm text-center leading-relaxed flex-grow">
                  {star.short_bio}
                </p>

                {star.achievements.length > 0 && (
                  <div className="space-y-2 mb-6">
                    {star.achievements.slice(0, 2).map((achievement, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400 flex-shrink-0 mt-1" />
                        <span className="text-xs text-gray-400">{achievement}</span>
                      </div>
                    ))}
                    {star.achievements.length > 2 && (
                      <p className="text-xs text-gray-500 text-center pt-2">
                        +{star.achievements.length - 2} autres réalisations
                      </p>
                    )}
                  </div>
                )}

                <Button
                  className="w-full bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-black font-semibold mt-auto"
                  onClick={() => router.push(`/stars/${star.slug}`)}
                >
                  Découvrir le profil
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <section className="text-center bg-gradient-to-br from-black via-gray-900 to-black border border-amber-500/30 rounded-2xl p-12 shadow-2xl shadow-amber-500/10">
          <h2 className="text-4xl font-bold mb-6 bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
            Réservez nos Artistes d'Exception
          </h2>
          <p className="text-xl text-slate-300 mb-4 max-w-2xl mx-auto leading-relaxed">
            Disponibles pour mariages, galas, concerts privés et événements prestigieux partout en France.
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
      </div>

      <Footer />
    </div>
  );
}
