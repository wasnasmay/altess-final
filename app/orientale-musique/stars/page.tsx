'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, ArrowLeft, Crown, Music, Award, Mail, Phone } from 'lucide-react';

type StarArtist = {
  id: string;
  name: string;
  role: string;
  bio: string;
  photo_url: string;
  specialties?: string[];
};

export default function NosStarsPage() {
  const [stars, setStars] = useState<StarArtist[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStar, setSelectedStar] = useState<StarArtist | null>(null);

  useEffect(() => {
    loadStars();
  }, []);

  async function loadStars() {
    try {
      const { data, error } = await supabase
        .from('stars')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      if (data) setStars(data);
    } catch (error) {
      console.error('Error loading stars:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-black/95 backdrop-blur-xl border-b border-amber-900/30 shadow-2xl shadow-amber-900/20">
        <div className="container mx-auto px-4">
          <nav className="flex items-center justify-between h-20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 via-yellow-600 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-900/50">
                <Crown className="w-6 h-6 text-black" />
              </div>
              <div>
                <h1 className="text-lg font-bold bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-300 bg-clip-text text-transparent">
                  Orientale Musique
                </h1>
                <p className="text-xs text-amber-600/80">Nos Stars</p>
              </div>
            </div>

            <Link href="/orientale-musique">
              <Button variant="ghost" size="sm" className="text-amber-600/60 hover:text-amber-400">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-16 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-950/20 via-black to-black" />
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-600/30 rounded-full filter blur-3xl animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-yellow-600/20 rounded-full filter blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          </div>
        </div>

        <div className="relative z-20 container mx-auto px-4 text-center">
          <Badge className="mb-4 bg-gradient-to-r from-amber-600 to-yellow-600 text-black border-0">
            <Star className="w-3 h-3 mr-1" />
            Artistes d'Exception
          </Badge>
          <h1 className="text-4xl md:text-6xl font-black mb-4 bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-300 bg-clip-text text-transparent">
            Nos Stars
          </h1>
          <p className="text-lg text-amber-200/70 max-w-2xl mx-auto">
            Des artistes talentueux qui ont fait la renommée de notre orchestre
          </p>
        </div>
      </section>

      {/* Stars Grid */}
      <section className="py-16 relative">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="text-center text-amber-400">Chargement...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
              {stars.map((star) => (
                <Card
                  key={star.id}
                  className="bg-gradient-to-br from-amber-950/30 to-black border-amber-700/20 overflow-hidden group hover:border-amber-600/50 transition-all hover:scale-105 cursor-pointer"
                  onClick={() => setSelectedStar(star)}
                >
                  <div className="aspect-square relative overflow-hidden">
                    <img
                      src={star.photo_url || '/image_(4).png'}
                      alt={star.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

                    {/* Badge Artiste d'Excellence en haut à droite */}
                    <div className="absolute top-3 right-3">
                      <div className="bg-gradient-to-br from-amber-600/95 to-yellow-600/95 backdrop-blur-sm border-2 border-amber-400/50 rounded-lg px-3 py-1.5 shadow-2xl shadow-amber-900/50">
                        <div className="flex items-center gap-1.5">
                          <Crown className="w-3.5 h-3.5 text-black" />
                          <span className="text-xs font-bold text-black tracking-wide">Artiste</span>
                        </div>
                      </div>
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                        <Badge className="bg-gradient-to-r from-amber-600 to-yellow-600 text-black text-xs border-0">
                          {star.role}
                        </Badge>
                      </div>
                      <h3 className="text-xl font-bold text-white">{star.name}</h3>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <p className="text-sm text-amber-300/70 line-clamp-3">{star.bio}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Selected Star Modal */}
      {selectedStar && (
        <div
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedStar(null)}
        >
          <Card
            className="bg-gradient-to-br from-amber-950/50 to-black border-amber-700/30 max-w-4xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <CardContent className="p-0">
              <div className="grid md:grid-cols-2 gap-0">
                <div className="aspect-square relative overflow-hidden">
                  <img
                    src={selectedStar.photo_url || '/image_(4).png'}
                    alt={selectedStar.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />

                  {/* Badge Artiste d'Excellence */}
                  <div className="absolute top-4 right-4">
                    <div className="bg-gradient-to-br from-amber-600/95 to-yellow-600/95 backdrop-blur-sm border-2 border-amber-400/50 rounded-lg px-4 py-2 shadow-2xl shadow-amber-900/50">
                      <div className="flex items-center gap-2">
                        <Crown className="w-4 h-4 text-black" />
                        <span className="text-sm font-bold text-black tracking-wide">Artiste d'Excellence</span>
                      </div>
                    </div>
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <Badge className="mb-3 bg-gradient-to-r from-amber-600 to-yellow-600 text-black">
                      {selectedStar.role}
                    </Badge>
                    <h2 className="text-3xl font-black text-white mb-2">{selectedStar.name}</h2>
                    <div className="flex items-center gap-2">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="p-8">
                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-amber-300 mb-3">Biographie</h3>
                    <p className="text-sm text-amber-200/70 leading-relaxed">{selectedStar.bio}</p>
                  </div>

                  {selectedStar.specialties && selectedStar.specialties.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-lg font-bold text-amber-300 mb-3">Spécialités</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedStar.specialties.map((specialty, idx) => (
                          <Badge key={idx} className="bg-amber-900/30 text-amber-300 border border-amber-700/30">
                            {specialty}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 mt-6">
                    <Button
                      className="flex-1 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 text-black font-bold"
                      onClick={() => window.location.href = '/orientale-musique#contact'}
                    >
                      <Phone className="w-4 h-4 mr-2" />
                      Contacter
                    </Button>
                    <Button
                      variant="outline"
                      className="border-amber-600 text-amber-400 hover:bg-amber-600 hover:text-black"
                      onClick={() => setSelectedStar(null)}
                    >
                      Fermer
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* CTA Section */}
      <section className="py-16 relative bg-gradient-to-b from-amber-950/10 to-black">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-amber-300 to-yellow-400 bg-clip-text text-transparent">
            Envie de travailler avec nos artistes ?
          </h2>
          <p className="text-amber-200/60 mb-8 max-w-2xl mx-auto">
            Contactez-nous pour organiser votre événement avec nos stars de la musique orientale
          </p>
          <Link href="/orientale-musique#contact">
            <Button size="lg" className="bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 text-black font-bold shadow-xl shadow-amber-900/50">
              <Mail className="w-5 h-5 mr-2" />
              Demander un Devis
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-amber-900/30 py-6 bg-black/80">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center shadow-lg shadow-amber-900/50">
              <Crown className="w-5 h-5 text-black" />
            </div>
            <span className="font-bold bg-gradient-to-r from-amber-300 to-yellow-400 bg-clip-text text-transparent">
              Orientale Musique
            </span>
          </div>
          <p className="text-amber-600/50 text-xs">
            © 2024 Orientale Musique - Tous droits réservés
          </p>
        </div>
      </footer>
    </div>
  );
}
