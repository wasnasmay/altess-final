'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import * as LucideIcons from 'lucide-react';
import Footer from '@/components/Footer';
// import WhatsAppChat from '@/components/WhatsAppChat';
import { PageSEOSection } from '@/components/PageSEOSection';

type Partner = {
  id: string;
  name: string;
  slug: string;
  category: string;
  short_description: string;
  main_image: string | null;
  services: string[];
  display_order: number;
};

type PartnerCategory = {
  id: string;
  code: string;
  label: string;
  icon_name: string;
  display_order: number;
};

// Function to get icon dynamically
const getIcon = (iconName: string) => {
  const icons = LucideIcons as any;
  return icons[iconName] || icons.MapPin;
};

export default function PartenairesPage() {
  const router = useRouter();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [categories, setCategories] = useState<PartnerCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('tous');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [partnersResult, categoriesResult] = await Promise.all([
        supabase
          .from('partners')
          .select('id, name, slug, category, short_description, main_image, services, display_order')
          .eq('is_active', true)
          .order('display_order'),
        supabase
          .from('partner_categories')
          .select('id, code, label, icon_name, display_order')
          .eq('is_active', true)
          .order('display_order')
      ]);

      if (partnersResult.error) {
        console.error('Error loading partners:', partnersResult.error);
      } else {
        setPartners(partnersResult.data || []);
      }

      if (categoriesResult.error) {
        console.error('Error loading categories:', categoriesResult.error);
        setCategories([{
          id: 'default',
          code: 'tous',
          label: 'Tous',
          icon_name: 'Users',
          display_order: 0
        }]);
      } else {
        setCategories(categoriesResult.data || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredPartners = selectedCategory === 'tous'
    ? partners
    : partners.filter(p => p.category === selectedCategory);

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
        <header className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400 bg-clip-text text-transparent">
            Nos Partenaires
          </h1>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
            Découvrez notre réseau de partenaires de confiance pour réussir vos événements.
            Des professionnels triés sur le volet pour vous garantir un service d'excellence.
          </p>
        </header>

        <PageSEOSection pageSlug="partenaires" />

        <div className="mb-12">
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            {categories.map((category) => {
              const Icon = getIcon(category.icon_name);
              const isSelected = selectedCategory === category.code;
              return (
                <Button
                  key={category.code}
                  onClick={() => setSelectedCategory(category.code)}
                  className={`
                    group relative overflow-hidden transition-all duration-300
                    ${isSelected
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30 scale-105'
                      : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white border border-amber-500/20 hover:border-amber-500/40'
                    }
                  `}
                  size="lg"
                >
                  <Icon className={`w-5 h-5 mr-2 transition-transform duration-300 ${isSelected ? 'scale-110' : 'group-hover:scale-110'}`} />
                  {category.label}
                  {isSelected && (
                    <span className="absolute bottom-0 left-0 w-full h-1 bg-white/30" />
                  )}
                </Button>
              );
            })}
          </div>

          <div className="text-center mb-8">
            <p className="text-slate-400 text-sm">
              <span className="font-semibold text-amber-400">{filteredPartners.length}</span>
              {filteredPartners.length > 1 ? ' partenaires' : ' partenaire'}
              {selectedCategory !== 'tous' && (
                <span> dans la catégorie <span className="text-amber-400">{categories.find(c => c.code === selectedCategory)?.label}</span></span>
              )}
            </p>
          </div>
        </div>

        {filteredPartners.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-xl text-slate-400 mb-4">Aucun partenaire trouvé dans cette catégorie</p>
            <Button
              onClick={() => setSelectedCategory('tous')}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
            >
              Voir tous les partenaires
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {filteredPartners.map((partner) => {
            const partnerCategory = categories.find(c => c.code === partner.category);
            const Icon = partnerCategory ? getIcon(partnerCategory.icon_name) : getIcon('MapPin');
            return (
              <Card
                key={partner.id}
                className="overflow-hidden bg-gradient-to-br from-black via-gray-900 to-black border border-amber-500/20 hover:border-amber-500/40 transition-all duration-500 hover:shadow-2xl hover:shadow-amber-500/20 group flex flex-col h-full"
              >
                <div className="relative h-64 overflow-hidden bg-black">
                  {partner.main_image ? (
                    <>
                      <img
                        src={partner.main_image}
                        alt={partner.name}
                        className="w-full h-full object-cover opacity-90 transition-all duration-700 group-hover:scale-110 group-hover:opacity-100"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                    </>
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
                      <Icon className="w-20 h-20 text-amber-500/20" />
                    </div>
                  )}
                  <Badge className="absolute top-4 right-4 bg-amber-500/90 text-black">
                    {partnerCategory?.label || partner.category}
                  </Badge>
                </div>

                <CardContent className="p-6 flex-1 flex flex-col">
                  <h3 className="text-2xl font-bold mb-3 text-white text-center">
                    {partner.name}
                  </h3>

                  <p className="text-gray-400 mb-6 text-sm text-center leading-relaxed flex-grow">
                    {partner.short_description}
                  </p>

                  <div className="space-y-2 mb-6">
                    {partner.services.slice(0, 3).map((service, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0 mt-1.5" />
                        <span className="text-xs text-gray-400">{service}</span>
                      </div>
                    ))}
                    {partner.services.length > 3 && (
                      <p className="text-xs text-gray-500 text-center pt-2">
                        +{partner.services.length - 3} autres services
                      </p>
                    )}
                  </div>

                  <Button
                    className="w-full bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-black font-semibold mt-auto"
                    onClick={() => router.push(`/partenaires/${partner.slug}`)}
                  >
                    Découvrir
                  </Button>
                </CardContent>
              </Card>
            );
          })}
          </div>
        )}

        <section className="text-center bg-gradient-to-br from-black via-gray-900 to-black border border-amber-500/30 rounded-2xl p-12 shadow-2xl shadow-amber-500/10">
          <h2 className="text-4xl font-bold mb-6 bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
            Vous Souhaitez Devenir Partenaire ?
          </h2>
          <p className="text-xl text-slate-300 mb-4 max-w-2xl mx-auto leading-relaxed">
            Rejoignez notre réseau de professionnels de l'événementiel oriental et développez votre activité.
          </p>
          <p className="text-lg text-slate-400 mb-8 max-w-2xl mx-auto">
            Contactez-nous pour discuter d'une collaboration bénéfique à long terme.
          </p>
          <Button
            onClick={() => router.push('/composer-orchestre')}
            size="lg"
            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold px-12 py-6 text-lg shadow-2xl hover:shadow-amber-500/50 transition-all"
          >
            Nous contacter
          </Button>
        </section>
      </div>

      <Footer />
    </div>
  );
}
