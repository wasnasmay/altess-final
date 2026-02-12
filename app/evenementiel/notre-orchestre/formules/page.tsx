'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Footer from '@/components/Footer';
// import WhatsAppChat from '@/components/WhatsAppChat';
import { CheckCircle, Music2, ArrowLeft } from 'lucide-react';

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

export default function NosFormulesPage() {
  const router = useRouter();
  const [orchestraFormulas, setOrchestraFormulas] = useState<OrchestraFormula[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFormulas();
  }, []);

  async function loadFormulas() {
    try {
      const { data } = await supabase
        .from('orchestra_formulas')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (data) setOrchestraFormulas(data);
    } catch (error) {
      console.error('Error loading formulas:', error);
    } finally {
      setLoading(false);
    }
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

      <div className="container mx-auto px-4 pt-32 pb-20">
        {/* Back Button */}
        <Button
          variant="ghost"
          className="mb-8 text-amber-500 hover:text-amber-400 hover:bg-amber-500/10"
          onClick={() => router.push('/evenementiel/notre-orchestre')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour à l'Accueil
        </Button>

        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-amber-500/10 border-4 border-amber-500/30 mb-6">
            <Music2 className="w-12 h-12 text-amber-500" />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 bg-clip-text text-transparent">
            Nos Formules d'Orchestre
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Choisissez la formule qui correspond parfaitement à votre événement.
            Des prestations d'exception pour tous vos moments précieux.
          </p>
        </div>

        {/* Formules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {/* Custom Orchestra Card */}
          <Card className="overflow-hidden bg-gradient-to-br from-amber-600 to-amber-700 border-2 border-amber-500 hover:scale-105 transition-all duration-500 hover:shadow-2xl hover:shadow-amber-500/50 flex flex-col h-full">
            <div className="relative h-64 overflow-hidden bg-gradient-to-br from-amber-700 via-amber-600 to-amber-700 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center justify-center opacity-20">
                <Music2 className="w-40 h-40 text-black" />
              </div>
              <div className="relative z-10 text-center">
                <div className="inline-flex items-center justify-center p-6 bg-black/30 rounded-full backdrop-blur-sm border-2 border-black/40">
                  <Music2 className="w-16 h-16 text-black" />
                </div>
              </div>
            </div>
            <CardContent className="p-8 flex-1 flex flex-col bg-gradient-to-b from-amber-600 to-amber-700">
              <h3 className="text-2xl font-bold mb-4 text-black text-center">Composer Votre Orchestre</h3>
              <p className="text-black/80 mb-6 text-center leading-relaxed">
                Créez un orchestre 100% personnalisé selon vos besoins et votre budget
              </p>
              <div className="space-y-3 mb-8 flex-1">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-black flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-black/90">Choisissez vos instruments</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-black flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-black/90">Nombre de musiciens flexible</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-black flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-black/90">Devis personnalisé gratuit</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-black flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-black/90">Réponse sous 24h</span>
                </div>
              </div>
              <Button
                size="lg"
                className="w-full bg-black hover:bg-black/80 text-amber-500 font-bold"
                onClick={() => router.push('/composer-orchestre')}
              >
                Composer Mon Orchestre
              </Button>
            </CardContent>
          </Card>

          {/* Orchestra Formulas */}
          {orchestraFormulas.map((formula) => (
            <Card
              key={formula.id}
              className="overflow-hidden bg-black border-2 border-amber-500/30 hover:border-amber-500 transition-all duration-500 hover:shadow-2xl hover:shadow-amber-500/30 group flex flex-col h-full"
            >
              <div className="relative h-64 overflow-hidden bg-black">
                <img
                  src={formula.image_url}
                  alt={formula.name}
                  className="w-full h-full object-cover opacity-90 transition-all duration-700 group-hover:scale-110 group-hover:opacity-100"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
              </div>
              <CardContent className="p-8 flex-1 flex flex-col bg-gradient-to-b from-zinc-950 to-black">
                <h3 className="text-2xl font-bold mb-4 text-amber-500 text-center">{formula.name}</h3>
                <p className="text-gray-400 mb-6 text-center leading-relaxed">
                  {formula.description}
                </p>
                <div className="space-y-3 mb-8 flex-1">
                  {formula.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-400">{feature}</span>
                    </div>
                  ))}
                </div>
                <div className="space-y-3">
                  <Button
                    size="lg"
                    className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-bold"
                    onClick={() => router.push(`/orchestres/${formula.slug}`)}
                  >
                    Voir les Détails
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full border-amber-500/50 text-amber-500 hover:bg-amber-500/10 hover:border-amber-500"
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

      <Footer />
    </div>
  );
}
