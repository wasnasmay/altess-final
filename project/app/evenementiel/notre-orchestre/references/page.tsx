'use client';

import { useRouter } from 'next/navigation';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Footer from '@/components/Footer';
// import WhatsAppChat from '@/components/WhatsAppChat';
import { BookOpen, ArrowLeft, Music2, Sparkles, FileText } from 'lucide-react';

export default function ReferencesPage() {
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
            <BookOpen className="w-12 h-12 text-amber-500" />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 bg-clip-text text-transparent">
            Références & Blog
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Découvrez nos réalisations prestigieuses et nos articles sur l'univers
            de la musique orientale et événementielle.
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
                Nous préparons une section complète avec nos références clients,
                des témoignages, des photos et vidéos d'événements, ainsi qu'un blog
                riche en contenus sur la musique orientale et l'organisation d'événements.
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
              <FileText className="w-12 h-12 text-amber-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Témoignages Clients</h3>
              <p className="text-gray-400 text-sm">
                L'avis de nos clients satisfaits sur nos prestations d'exception
              </p>
            </CardContent>
          </Card>

          <Card className="bg-zinc-950/50 border border-amber-500/20 hover:border-amber-500/40 transition-all">
            <CardContent className="p-8 text-center">
              <Music2 className="w-12 h-12 text-amber-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Portfolio Événements</h3>
              <p className="text-gray-400 text-sm">
                Photos et vidéos de nos plus belles prestations
              </p>
            </CardContent>
          </Card>

          <Card className="bg-zinc-950/50 border border-amber-500/20 hover:border-amber-500/40 transition-all">
            <CardContent className="p-8 text-center">
              <BookOpen className="w-12 h-12 text-amber-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Articles & Conseils</h3>
              <p className="text-gray-400 text-sm">
                Blog avec conseils pour réussir vos événements musicaux
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Stats Section */}
        <div className="max-w-5xl mx-auto mt-20">
          <h2 className="text-3xl font-bold text-center mb-12 text-amber-500">
            Nos Réalisations en Chiffres
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-zinc-950/50 border border-amber-500/20 rounded-xl p-6 text-center">
              <div className="text-4xl font-bold text-amber-500 mb-2">500+</div>
              <div className="text-gray-400 text-sm">Événements Réalisés</div>
            </div>
            <div className="bg-zinc-950/50 border border-amber-500/20 rounded-xl p-6 text-center">
              <div className="text-4xl font-bold text-amber-500 mb-2">30+</div>
              <div className="text-gray-400 text-sm">Années d'Expérience</div>
            </div>
            <div className="bg-zinc-950/50 border border-amber-500/20 rounded-xl p-6 text-center">
              <div className="text-4xl font-bold text-amber-500 mb-2">100%</div>
              <div className="text-gray-400 text-sm">Clients Satisfaits</div>
            </div>
            <div className="bg-zinc-950/50 border border-amber-500/20 rounded-xl p-6 text-center">
              <div className="text-4xl font-bold text-amber-500 mb-2">Premium</div>
              <div className="text-gray-400 text-sm">Qualité Garantie</div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
