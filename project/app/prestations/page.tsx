'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';
import Footer from '@/components/Footer';
// import WhatsAppChat from '@/components/WhatsAppChat';
import { PageSEOSection } from '@/components/PageSEOSection';

type Prestation = {
  id: string;
  title: string;
  slug: string;
  short_description: string;
  main_image: string | null;
  features: string[];
  display_order: number;
};

export default function PrestationsPage() {
  const router = useRouter();
  const [prestations, setPrestations] = useState<Prestation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPrestations();
  }, []);

  async function loadPrestations() {
    try {
      const { data, error } = await supabase
        .from('prestations')
        .select('id, title, slug, short_description, main_image, features, display_order')
        .eq('is_active', true)
        .order('display_order');

      if (error) throw error;
      setPrestations(data || []);
    } catch (error) {
      console.error('Error loading prestations:', error);
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
            Nos Prestations
          </h1>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
            Découvrez nos services d'animation musicale orientale pour tous vos événements.
            Des prestations sur-mesure avec des musiciens professionnels partout en France.
          </p>
        </header>

        <PageSEOSection pageSlug="prestations" />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {prestations.map((prestation) => (
            <Card
              key={prestation.id}
              className="overflow-hidden bg-gradient-to-br from-black via-gray-900 to-black border border-amber-500/20 hover:border-amber-500/40 transition-all duration-500 hover:shadow-2xl hover:shadow-amber-500/20 group flex flex-col h-full"
            >
              <div className="relative h-64 overflow-hidden bg-black">
                {prestation.main_image ? (
                  <>
                    <img
                      src={prestation.main_image}
                      alt={prestation.title}
                      className="w-full h-full object-cover opacity-90 transition-all duration-700 group-hover:scale-110 group-hover:opacity-100"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                  </>
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
                    <div className="text-6xl text-amber-500/20">♪</div>
                  </div>
                )}
              </div>

              <CardContent className="p-6 flex-1 flex flex-col">
                <h3 className="text-2xl font-bold mb-3 text-white text-center">
                  {prestation.title}
                </h3>

                <p className="text-gray-400 mb-6 text-sm text-center leading-relaxed flex-grow">
                  {prestation.short_description}
                </p>

                <div className="space-y-2 mb-6">
                  {prestation.features.slice(0, 4).map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                      <span className="text-xs text-gray-400">{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-2 mt-auto">
                  <Button
                    className="w-full bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-black font-semibold"
                    onClick={() => router.push(`/prestations/${prestation.slug}`)}
                  >
                    Voir les détails
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full border-amber-500/30 text-amber-500 hover:bg-amber-500/10"
                    onClick={() => router.push(`/prestations/${prestation.slug}`)}
                  >
                    Réserver / Devis
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <section className="text-center bg-gradient-to-br from-black via-gray-900 to-black border border-amber-500/30 rounded-2xl p-12 shadow-2xl shadow-amber-500/10">
          <h2 className="text-4xl font-bold mb-6 bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
            Besoin d'une Prestation Sur-Mesure ?
          </h2>
          <p className="text-xl text-slate-300 mb-4 max-w-2xl mx-auto leading-relaxed">
            Chaque événement est unique. Contactez-nous pour créer ensemble une prestation parfaitement adaptée à vos besoins.
          </p>
          <p className="text-lg text-slate-400 mb-8 max-w-2xl mx-auto">
            Disponible partout en France - Réponse rapide garantie sous 24h
          </p>
          <Button
            onClick={() => router.push('/composer-orchestre')}
            size="lg"
            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold px-12 py-6 text-lg shadow-2xl hover:shadow-amber-500/50 transition-all"
          >
            Composer votre prestation
          </Button>
        </section>
      </div>

      <Footer />
    </div>
  );
}
