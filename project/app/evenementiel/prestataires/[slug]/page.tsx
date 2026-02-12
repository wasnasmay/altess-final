'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Navigation } from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import DynamicWhatsAppButton from '@/components/DynamicWhatsAppButton';
import { supabase } from '@/lib/supabase';
import {
  MapPin,
  Star,
  Crown,
  Phone,
  Mail,
  Globe,
  Award,
  Calendar,
  Clock,
  CheckCircle2,
  ArrowLeft,
  Send
} from 'lucide-react';
import Link from 'next/link';

interface EventProvider {
  id: string;
  company_name: string;
  slug: string;
  category: string;
  short_description: string;
  long_description: string | null;
  main_image: string | null;
  logo_url: string | null;
  city: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  rating: number | null;
  total_reviews: number;
  is_featured: boolean;
  is_verified: boolean;
  pricing_range: string | null;
  services: string[];
  portfolio_images: string[];
  whatsapp_number?: string | null;
}

export default function ProviderDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const [provider, setProvider] = useState<EventProvider | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      loadProvider();
    }
  }, [slug]);

  async function loadProvider() {
    try {
      const { data, error } = await supabase
        .from('event_providers')
        .select(`
          *,
          profile:profiles!event_providers_user_id_fkey(whatsapp_number)
        `)
        .eq('slug', slug)
        .eq('status', 'approved')
        .single();

      if (error) throw error;

      const providerData = {
        ...data,
        whatsapp_number: (data as any).profile?.whatsapp_number || null
      };

      setProvider(providerData);
    } catch (error) {
      console.error('Error loading provider:', error);
      setProvider(null);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <Navigation />
        <div className="container mx-auto px-4 py-20">
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="min-h-screen bg-black">
        <Navigation />
        <div className="container mx-auto px-4 py-20">
          <div className="text-center py-16">
            <h1 className="text-3xl font-bold text-white mb-4">Prestataire non trouvé</h1>
            <Link href="/evenementiel/prestataires">
              <Button className="bg-amber-600 hover:bg-amber-700 text-black">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour à la liste
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Navigation />

      {/* Hero Section */}
      <section className="relative pt-24 pb-12">
        {/* Image de couverture */}
        <div className="absolute inset-0 h-[500px] overflow-hidden">
          {provider.main_image ? (
            <>
              <img
                src={provider.main_image}
                alt={provider.company_name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/80 to-black"></div>
            </>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-amber-500/20 to-black"></div>
          )}
        </div>

        {/* Contenu Hero */}
        <div className="relative container mx-auto px-4 pt-20">
          <Link href="/evenementiel/prestataires">
            <Button
              variant="ghost"
              className="mb-6 text-gray-400 hover:text-white hover:bg-zinc-800/50"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour aux prestataires
            </Button>
          </Link>

          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Logo */}
            {provider.logo_url && (
              <div className="w-32 h-32 rounded-xl bg-white/95 p-4 border-4 border-amber-600/30 shadow-2xl">
                <img
                  src={provider.logo_url}
                  alt={`Logo ${provider.company_name}`}
                  className="w-full h-full object-contain"
                />
              </div>
            )}

            {/* Informations principales */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                {provider.is_featured && (
                  <Badge className="bg-gradient-to-r from-amber-500 to-amber-600 text-black border-none">
                    <Crown className="w-3 h-3 mr-1" />
                    Premium
                  </Badge>
                )}
                {provider.is_verified && (
                  <Badge className="bg-blue-500 text-white border-none">
                    <Award className="w-3 h-3 mr-1" />
                    Vérifié
                  </Badge>
                )}
                {provider.pricing_range && (
                  <Badge variant="outline" className="border-amber-600/40 text-amber-600">
                    {provider.pricing_range}
                  </Badge>
                )}
              </div>

              <h1 className="text-5xl font-bold mb-4 text-white">
                {provider.company_name}
              </h1>

              <p className="text-xl text-gray-300 mb-6 max-w-3xl">
                {provider.short_description}
              </p>

              <div className="flex flex-wrap items-center gap-6 text-gray-400 mb-6">
                {provider.city && (
                  <span className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-amber-600" />
                    <span className="text-white">{provider.city}</span>
                  </span>
                )}
                {provider.rating && (
                  <span className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-amber-600 fill-amber-600" />
                    <span className="text-white font-medium">{provider.rating.toFixed(1)}</span>
                    {provider.total_reviews > 0 && (
                      <span className="text-sm">({provider.total_reviews} avis)</span>
                    )}
                  </span>
                )}
              </div>

              {/* Boutons d'action */}
              <div className="flex flex-wrap gap-4">
                <Link href={`/rendez-vous?provider=${provider.slug}`}>
                  <Button className="bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-black font-semibold shadow-lg shadow-amber-600/30 h-12 px-8">
                    <Calendar className="w-5 h-5 mr-2" />
                    Réserver un rendez-vous
                  </Button>
                </Link>

                {provider.whatsapp_number && (
                  <DynamicWhatsAppButton
                    phoneNumber={provider.whatsapp_number}
                    message={`Bonjour, je souhaite obtenir plus d'informations sur ${provider.company_name}.`}
                    size="lg"
                    className="h-12 px-6 shadow-lg shadow-green-600/30"
                  />
                )}

                {provider.phone && (
                  <Button
                    variant="outline"
                    className="border-amber-600/40 text-amber-600 hover:bg-amber-600/10 h-12 px-6"
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Appeler
                  </Button>
                )}

                {provider.website && (
                  <Button
                    variant="outline"
                    className="border-zinc-700 text-gray-300 hover:bg-zinc-800 h-12 px-6"
                    onClick={() => window.open(provider.website!, '_blank')}
                  >
                    <Globe className="w-4 h-4 mr-2" />
                    Site web
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section principale */}
      <section className="py-16 bg-black">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Colonne principale */}
            <div className="lg:col-span-2 space-y-8">
              {/* Description */}
              <Card className="bg-zinc-900/50 border border-zinc-800">
                <CardContent className="p-8">
                  <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                    <CheckCircle2 className="w-6 h-6 text-amber-600" />
                    À propos
                  </h2>
                  <p className="text-gray-300 leading-relaxed whitespace-pre-line">
                    {provider.long_description || provider.short_description}
                  </p>
                </CardContent>
              </Card>

              {/* Services */}
              {provider.services && provider.services.length > 0 && (
                <Card className="bg-zinc-900/50 border border-zinc-800">
                  <CardContent className="p-8">
                    <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                      <Award className="w-6 h-6 text-amber-600" />
                      Services proposés
                    </h2>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {provider.services.map((service, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-3 p-4 bg-black/40 border border-zinc-800 rounded-lg hover:border-amber-600/30 transition-colors"
                        >
                          <CheckCircle2 className="w-5 h-5 text-amber-600 flex-shrink-0" />
                          <span className="text-gray-300">{service}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Galerie Portfolio */}
              {provider.portfolio_images && provider.portfolio_images.length > 0 && (
                <Card className="bg-zinc-900/50 border border-zinc-800">
                  <CardContent className="p-8">
                    <h2 className="text-2xl font-bold text-white mb-6">Portfolio</h2>
                    <div className="grid sm:grid-cols-2 gap-4">
                      {provider.portfolio_images.map((image, idx) => (
                        <div
                          key={idx}
                          className="relative aspect-video rounded-lg overflow-hidden border border-zinc-800 hover:border-amber-600/30 transition-colors"
                        >
                          <img
                            src={image}
                            alt={`Portfolio ${idx + 1}`}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Colonne latérale */}
            <div className="space-y-6">
              {/* Coordonnées */}
              <Card className="bg-gradient-to-br from-amber-600/10 to-transparent border border-amber-600/30">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-white mb-4">Contact</h3>
                  <div className="space-y-4">
                    {provider.phone && (
                      <a
                        href={`tel:${provider.phone}`}
                        className="flex items-center gap-3 p-3 bg-black/40 border border-zinc-800 rounded-lg hover:border-amber-600/30 transition-colors"
                      >
                        <Phone className="w-5 h-5 text-amber-600" />
                        <span className="text-gray-300">{provider.phone}</span>
                      </a>
                    )}

                    {provider.email && (
                      <a
                        href={`mailto:${provider.email}`}
                        className="flex items-center gap-3 p-3 bg-black/40 border border-zinc-800 rounded-lg hover:border-amber-600/30 transition-colors"
                      >
                        <Mail className="w-5 h-5 text-amber-600" />
                        <span className="text-gray-300 text-sm break-all">{provider.email}</span>
                      </a>
                    )}

                    {provider.address && (
                      <div className="flex items-start gap-3 p-3 bg-black/40 border border-zinc-800 rounded-lg">
                        <MapPin className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-300 text-sm">{provider.address}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* CTA Réservation */}
              <Card className="bg-gradient-to-br from-amber-600 to-amber-500 border-none">
                <CardContent className="p-6 text-center">
                  <Crown className="w-12 h-12 text-black mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-black mb-3">
                    Prêt à réserver ?
                  </h3>
                  <p className="text-black/80 text-sm mb-6">
                    Prenez rendez-vous dès maintenant et donnez vie à votre événement
                  </p>
                  <Link href={`/rendez-vous?provider=${provider.slug}`}>
                    <Button className="w-full bg-black text-amber-600 hover:bg-zinc-900 font-semibold h-12">
                      <Send className="w-4 h-4 mr-2" />
                      Demander un devis
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Horaires (si disponibles) */}
              <Card className="bg-zinc-900/50 border border-zinc-800">
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-amber-600" />
                    Disponibilité
                  </h3>
                  <p className="text-sm text-gray-400">
                    Disponible sur rendez-vous. Contactez-nous pour plus d'informations.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
