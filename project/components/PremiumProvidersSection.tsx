'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, MapPin, Phone, Globe, ArrowRight, Crown } from 'lucide-react';
import Link from 'next/link';

type Partner = {
  id: string;
  name: string;
  short_description: string;
  logo_url: string;
  main_image: string;
  category: string;
  slug: string;
  tagline: string;
  phone?: string;
  website?: string;
  address?: string;
};

const categoryLabels: Record<string, string> = {
  traiteur: 'Traiteur',
  decoration: 'Décoration',
  photo: 'Photographie',
  video: 'Vidéographie',
  salle: 'Salle de Réception',
  animation: 'Animation',
  fleurs: 'Fleurs',
  patisserie: 'Pâtisserie',
  musique: 'Musique',
};

const categoryColors: Record<string, string> = {
  traiteur: 'from-orange-500 to-red-600',
  decoration: 'from-purple-500 to-pink-600',
  photo: 'from-blue-500 to-cyan-600',
  video: 'from-indigo-500 to-purple-600',
  salle: 'from-amber-500 to-orange-600',
  animation: 'from-green-500 to-emerald-600',
  fleurs: 'from-pink-500 to-rose-600',
  patisserie: 'from-yellow-500 to-amber-600',
  musique: 'from-red-500 to-pink-600',
};

export default function PremiumProvidersSection() {
  const [providers, setProviders] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProviders();
  }, []);

  async function loadProviders() {
    try {
      const { data, error } = await supabase
        .from('partners')
        .select('*')
        .eq('is_active', true)
        .eq('is_featured', true)
        .order('priority', { ascending: false })
        .order('display_order')
        .limit(8);

      if (error) throw error;
      setProviders(data || []);
    } catch (error) {
      console.error('Error loading premium providers:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <section className="py-20 bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto"></div>
          </div>
        </div>
      </section>
    );
  }

  if (providers.length === 0) {
    return null;
  }

  return (
    <section className="py-20 bg-gradient-to-br from-gray-900 via-black to-gray-900 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"></div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500/20 to-amber-600/20 backdrop-blur-sm border border-amber-500/30 rounded-full px-6 py-2 mb-4">
            <Crown className="w-5 h-5 text-amber-400" />
            <span className="text-amber-400 font-semibold text-sm tracking-wide uppercase">
              Prestataires Premium
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Nos Prestataires d&apos;Exception
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Découvrez notre sélection de professionnels de confiance pour créer des événements inoubliables
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {providers.map((provider) => (
            <Card
              key={provider.id}
              className="group relative overflow-hidden bg-gradient-to-br from-gray-900 to-black border-2 border-amber-500/20 hover:border-amber-500/60 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-amber-500/20"
            >
              {/* Premium Badge */}
              <div className="absolute top-4 right-4 z-20">
                <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-black px-3 py-1 rounded-full flex items-center gap-1 shadow-lg">
                  <Crown className="w-3 h-3" />
                  <span className="text-xs font-bold">Premium</span>
                </div>
              </div>

              {/* Image */}
              <div className="relative h-48 overflow-hidden">
                <img
                  src={provider.main_image || provider.logo_url}
                  alt={provider.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>

                {/* Category Badge */}
                <div className="absolute bottom-4 left-4">
                  <Badge className={`bg-gradient-to-r ${categoryColors[provider.category] || 'from-gray-500 to-gray-600'} text-white border-0 shadow-lg`}>
                    {categoryLabels[provider.category] || provider.category}
                  </Badge>
                </div>
              </div>

              <CardContent className="p-6">
                {/* Name */}
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-amber-400 transition-colors duration-300">
                  {provider.name}
                </h3>

                {/* Tagline */}
                {provider.tagline && (
                  <p className="text-amber-400/80 text-sm font-medium mb-3 italic">
                    {provider.tagline}
                  </p>
                )}

                {/* Description */}
                <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                  {provider.short_description}
                </p>

                {/* CTA Button */}
                <Link href={`/partenaires/${provider.slug}`}>
                  <Button
                    className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-bold shadow-lg shadow-amber-500/30 group-hover:shadow-amber-500/50 transition-all duration-300"
                  >
                    <span>Découvrir</span>
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* View All Button */}
        <div className="text-center">
          <Link href="/partenaires">
            <Button
              size="lg"
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-bold shadow-xl shadow-amber-500/30 hover:shadow-amber-500/50 transition-all duration-300 px-8 py-6 text-lg"
            >
              <span>Voir Tous Nos Partenaires</span>
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
