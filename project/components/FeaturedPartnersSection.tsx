'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mail, Phone, ExternalLink, MapPin } from 'lucide-react';

type Partner = {
  id: string;
  name: string;
  slug: string;
  category: string;
  logo_url: string | null;
  tagline: string | null;
  main_image: string | null;
  short_description: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  address: string | null;
  priority: number;
};

const categoryLabels: Record<string, string> = {
  voyages: 'Voyages',
  gastronomie: 'Gastronomie',
  orchestres: 'Orchestres',
  services_premium: 'Services Premium',
  academie: 'Académie',
  salle: 'Salles de Réception',
  traiteur: 'Traiteurs',
  photo: 'Photographie',
  decoration: 'Décoration',
};

const categoryColors: Record<string, string> = {
  voyages: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  gastronomie: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  orchestres: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  services_premium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  academie: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  salle: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  traiteur: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  photo: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
  decoration: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
};

export default function FeaturedPartnersSection() {
  const router = useRouter();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeaturedPartners();
  }, []);

  async function loadFeaturedPartners() {
    try {
      const { data, error } = await supabase
        .from('partners')
        .select('*')
        .eq('is_featured', true)
        .eq('is_active', true)
        .order('priority', { ascending: true });

      if (error) throw error;
      setPartners(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des partenaires:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  if (partners.length === 0) {
    return null;
  }

  return (
    <section className="mb-16 max-w-7xl mx-auto px-4">
      <div className="mb-12 text-center relative">
        <div className="inline-block mb-4">
          <div className="w-16 h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent rounded-full mb-6" />
        </div>
        <h2 className="text-4xl md:text-5xl font-light font-serif tracking-wide mb-4 bg-gradient-to-r from-amber-300 via-amber-400 to-amber-300 bg-clip-text text-transparent">
          Partenaires d'Excellence
        </h2>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
          Une sélection exclusive de prestataires premium pour vos événements d'exception
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {partners.map((partner) => (
          <Card
            key={partner.id}
            className="group cursor-pointer overflow-hidden bg-gradient-to-br from-black/60 via-slate-900/60 to-black/60 backdrop-blur-xl border-2 border-amber-500/20 hover:border-amber-400/60 transition-all duration-700 hover:shadow-[0_20px_80px_-15px_rgba(251,191,36,0.4)] hover:-translate-y-2 relative"
            onClick={() => router.push(`/partenaires/${partner.slug}`)}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

            <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-slate-950 to-black">
              <div className="absolute inset-0 overflow-hidden">
                <img
                  src={partner.main_image || 'https://images.pexels.com/photos/2306281/pexels-photo-2306281.jpeg'}
                  alt={partner.name}
                  className="w-full h-full object-cover transition-all duration-1000 group-hover:scale-125 group-hover:rotate-2"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent opacity-90 group-hover:opacity-95 transition-opacity duration-700" />

              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700 mix-blend-overlay" />

              {partner.logo_url && (
                <div className="absolute top-4 right-4 w-20 h-20 rounded-2xl bg-white/98 backdrop-blur-md p-3 shadow-2xl border-2 border-white/30 overflow-hidden transform transition-all duration-500 group-hover:scale-110 group-hover:rotate-3">
                  <img
                    src={partner.logo_url}
                    alt={`${partner.name} logo`}
                    className="w-full h-full object-contain"
                  />
                </div>
              )}

              <div className="absolute top-4 left-4">
                <Badge className={`${categoryColors[partner.category] || categoryColors.services_premium} border-2 backdrop-blur-md font-semibold shadow-2xl text-xs px-4 py-2 transition-all duration-500 group-hover:scale-110`}>
                  {categoryLabels[partner.category] || partner.category}
                </Badge>
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-6 pb-7 transform transition-all duration-500">
                <div className="space-y-3">
                  <h3 className="text-2xl font-bold text-white mb-1 group-hover:text-amber-400 transition-colors duration-500 line-clamp-1 tracking-wide drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                    {partner.name}
                  </h3>
                  {partner.tagline && (
                    <p className="text-sm text-amber-200/90 italic mb-2 line-clamp-2 leading-relaxed font-light drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">
                      "{partner.tagline}"
                    </p>
                  )}
                  {partner.short_description && (
                    <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed mb-3 opacity-90 drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">
                      {partner.short_description}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2 text-xs">
                    {partner.email && (
                      <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-3 py-2 rounded-full border border-amber-500/30 text-amber-400/90 font-medium transition-all duration-300 group-hover:bg-amber-500/20 group-hover:border-amber-400/50 shadow-lg">
                        <Mail className="w-3.5 h-3.5" />
                        <span>Contact</span>
                      </div>
                    )}
                    {partner.phone && (
                      <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-3 py-2 rounded-full border border-amber-500/30 text-amber-400/90 font-medium transition-all duration-300 group-hover:bg-amber-500/20 group-hover:border-amber-400/50 shadow-lg">
                        <Phone className="w-3.5 h-3.5" />
                        <span>Appeler</span>
                      </div>
                    )}
                    {partner.website && (
                      <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-3 py-2 rounded-full border border-amber-500/30 text-amber-400/90 font-medium transition-all duration-300 group-hover:bg-amber-500/20 group-hover:border-amber-400/50 shadow-lg">
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Visiter</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent transform scale-x-0 group-hover:scale-x-100 transition-transform duration-700" />
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
