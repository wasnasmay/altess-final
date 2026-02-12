'use client';

import { useRouter } from 'next/navigation';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Footer from '@/components/Footer';
// import WhatsAppChat from '@/components/WhatsAppChat';
import { Star, ArrowLeft, Music2, Sparkles } from 'lucide-react';

export default function NosStarsPage() {
  const router = useRouter();

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
            <Star className="w-12 h-12 text-amber-500 fill-amber-500" />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 bg-clip-text text-transparent">
            Nos Artistes Stars
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Découvrez nos musiciens d'exception, des artistes reconnus internationalement
            qui sublimeront vos événements les plus prestigieux.
          </p>
        </div>

        {/* Coming Soon Section */}
        <div className="max-w-4xl mx-auto">
          <Card className="bg-gradient-to-br from-zinc-950 via-black to-zinc-950 border-2 border-amber-500/30 overflow-hidden">
            <CardContent className="p-12 text-center">
              <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-amber-500/10 border-4 border-amber-500/20 mb-8">
                <Sparkles className="w-16 h-16 text-amber-500" />
              </div>

              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-amber-500">
                Section en Construction
              </h2>

              <p className="text-lg text-gray-400 mb-8 leading-relaxed max-w-2xl mx-auto">
                Nous préparons une section exclusive dédiée à nos artistes stars.
                Bientôt, vous pourrez découvrir leurs parcours exceptionnels, leurs performances
                et réserver directement nos talents pour vos événements.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-bold"
                  onClick={() => router.push('/composer-orchestre')}
                >
                  <Music2 className="w-5 h-5 mr-2" />
                  Composer Mon Orchestre
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-amber-500/50 text-amber-500 hover:bg-amber-500/10 hover:border-amber-500"
                  onClick={() => router.push('/evenementiel/notre-orchestre/formules')}
                >
                  Voir Nos Formules
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto mt-16">
          <Card className="bg-zinc-950/50 border border-amber-500/20 hover:border-amber-500/40 transition-all">
            <CardContent className="p-8 text-center">
              <Star className="w-12 h-12 text-amber-500 mx-auto mb-4 fill-amber-500" />
              <h3 className="text-xl font-bold text-white mb-2">Artistes Reconnus</h3>
              <p className="text-gray-400 text-sm">
                Des musiciens primés avec une renommée internationale
              </p>
            </CardContent>
          </Card>

          <Card className="bg-zinc-950/50 border border-amber-500/20 hover:border-amber-500/40 transition-all">
            <CardContent className="p-8 text-center">
              <Music2 className="w-12 h-12 text-amber-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Répertoire Varié</h3>
              <p className="text-gray-400 text-sm">
                Du classique oriental au moderne, tous les styles musicaux
              </p>
            </CardContent>
          </Card>

          <Card className="bg-zinc-950/50 border border-amber-500/20 hover:border-amber-500/40 transition-all">
            <CardContent className="p-8 text-center">
              <Sparkles className="w-12 h-12 text-amber-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Prestations Premium</h3>
              <p className="text-gray-400 text-sm">
                Une qualité d'exception pour vos événements prestigieux
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
}
