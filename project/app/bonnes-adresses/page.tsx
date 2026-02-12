'use client';

import { Navigation } from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Utensils, Coffee, Palette, ShoppingBag, Sparkles } from 'lucide-react';

export default function BonnesAdressesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      <Navigation />

      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-full px-4 py-2 mb-6">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-medium text-amber-300">ALTESS Bonnes Adresses</span>
            </div>

            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-600 text-transparent bg-clip-text">
              Les Bonnes Adresses
            </h1>

            <p className="text-xl text-gray-300 mb-8 leading-relaxed">
              Découvrez notre sélection de restaurants, cafés, lieux culturels et boutiques d'exception.
            </p>

            <Card className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 border-gray-700">
              <CardContent className="p-12">
                <MapPin className="w-16 h-16 text-amber-400 mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-4">Prochainement disponible</h2>
                <p className="text-gray-300 mb-6">
                  Le guide des bonnes adresses ALTESS est en cours de préparation.
                  Revenez bientôt pour découvrir les meilleurs lieux de votre région !
                </p>
                <Button className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700">
                  M'informer du lancement
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
