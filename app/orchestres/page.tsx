'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useSiteSettings } from '@/hooks/use-site-settings';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Music, Star, Award, Phone, Mail, MapPin, Check } from 'lucide-react';
// import WhatsAppChat from '@/components/WhatsAppChat';
import { PageSEOSection } from '@/components/PageSEOSection';
import Image from 'next/image';

type OrchestraFormula = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price_from: number;
  image_url: string;
  features: string[];
};

export default function OrchestresPage() {
  const router = useRouter();
  const settings = useSiteSettings();
  const [orchestras, setOrchestras] = useState<OrchestraFormula[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('formules');

  useEffect(() => {
    loadOrchestras();
  }, []);

  async function loadOrchestras() {
    try {
      const { data, error } = await supabase
        .from('orchestra_formulas')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (error) throw error;
      setOrchestras(data || []);
    } catch (error) {
      console.error('Error loading orchestras:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-slate-950 to-black">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-black text-white">
      {/* <WhatsAppChat /> */}

      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-lg border-b border-amber-500/20">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Button
              variant="ghost"
              onClick={() => router.push('/')}
              className="text-white/90 hover:text-amber-400 hover:bg-white/10"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Accueil
            </Button>

            <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
              Orientale Musique
            </h1>

            <div className="flex gap-2">
              <Button
                onClick={() => setActiveTab('contact')}
                size="sm"
                variant="outline"
                className="border-amber-500/30 hover:bg-amber-500/10 hover:border-amber-500 text-amber-400"
              >
                <Phone className="w-4 h-4 md:mr-2" />
                <span className="hidden md:inline">Contact</span>
              </Button>
            </div>
          </div>

          <TabsList className="grid w-full grid-cols-3 bg-transparent border-0 h-auto gap-1 pb-2">
            <TabsTrigger
              value="formules"
              onClick={() => setActiveTab('formules')}
              className={`data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400 border-b-2 border-transparent data-[state=active]:border-amber-500 rounded-none ${activeTab === 'formules' ? 'border-amber-500 text-amber-400' : ''}`}
            >
              <Music className="w-4 h-4 mr-2" />
              Nos Formules
            </TabsTrigger>
            <TabsTrigger
              value="avantages"
              onClick={() => setActiveTab('avantages')}
              className={`data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400 border-b-2 border-transparent data-[state=active]:border-amber-500 rounded-none ${activeTab === 'avantages' ? 'border-amber-500 text-amber-400' : ''}`}
            >
              <Star className="w-4 h-4 mr-2" />
              Avantages
            </TabsTrigger>
            <TabsTrigger
              value="contact"
              onClick={() => setActiveTab('contact')}
              className={`data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400 border-b-2 border-transparent data-[state=active]:border-amber-500 rounded-none ${activeTab === 'contact' ? 'border-amber-500 text-amber-400' : ''}`}
            >
              <Phone className="w-4 h-4 mr-2" />
              Contact
            </TabsTrigger>
          </TabsList>
        </div>
      </nav>

      <main className="pt-32">
        <div className="container mx-auto px-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsContent value="formules" className="mt-0">
              <div className="mb-6 text-center">
                <h2 className="text-2xl md:text-3xl font-bold mb-2 bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                  Nos Orchestres Orientaux Professionnels
                </h2>
                <p className="text-slate-300 text-sm md:text-base">
                  Choisissez la formule qui correspond à votre événement
                </p>
              </div>

              <PageSEOSection pageSlug="orchestres" />

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6">
                {orchestras.map((orchestra) => (
                  <Card
                    key={orchestra.id}
                    className="bg-slate-900/50 border-slate-800 overflow-hidden group hover:border-amber-500/50 transition-all cursor-pointer"
                    onClick={() => router.push(`/orchestres/${orchestra.slug}`)}
                  >
                    <div className="relative aspect-video">
                      <Image
                        src={orchestra.image_url}
                        alt={orchestra.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                      <div className="absolute bottom-3 left-3 right-3">
                        <h3 className="text-lg md:text-xl font-bold text-white mb-1">
                          {orchestra.name}
                        </h3>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <p className="text-slate-300 text-xs md:text-sm mb-3 line-clamp-2">
                        {orchestra.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs text-slate-400">À partir de</div>
                          <div className="text-lg md:text-xl font-bold text-amber-400">
                            {orchestra.price_from.toLocaleString('fr-FR')} €
                          </div>
                        </div>
                        <Button
                          size="sm"
                          className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                        >
                          Découvrir
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="avantages" className="mt-0">
              <div className="max-w-5xl mx-auto">
                <div className="mb-6 text-center">
                  <h2 className="text-2xl md:text-3xl font-bold mb-2 bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                    Pourquoi Choisir Orientale Musique ?
                  </h2>
                  <p className="text-slate-300 text-sm md:text-base">
                    L'excellence au service de vos événements
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-4 md:gap-6 mb-8">
                  <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/30">
                    <CardContent className="p-6">
                      <Star className="w-12 h-12 text-amber-400 mb-4" />
                      <h3 className="text-xl font-bold mb-3 text-amber-400">Musiciens Professionnels</h3>
                      <ul className="space-y-2 text-slate-300 text-sm">
                        <li className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                          <span>Artistes certifiés et expérimentés</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                          <span>Répertoire riche et varié (oriental, maghrébin, khaleeji)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                          <span>Équipement son et lumière professionnel</span>
                        </li>
                      </ul>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/30">
                    <CardContent className="p-6">
                      <Award className="w-12 h-12 text-blue-400 mb-4" />
                      <h3 className="text-xl font-bold mb-3 text-blue-400">+10 Ans d'Expérience</h3>
                      <ul className="space-y-2 text-slate-300 text-sm">
                        <li className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                          <span>Plus de 500 événements réussis</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                          <span>Satisfaction client garantie</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                          <span>Service personnalisé et réactif</span>
                        </li>
                      </ul>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/30">
                    <CardContent className="p-6">
                      <MapPin className="w-12 h-12 text-green-400 mb-4" />
                      <h3 className="text-xl font-bold mb-3 text-green-400">Disponible Partout en France</h3>
                      <ul className="space-y-2 text-slate-300 text-sm">
                        <li className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                          <span>Paris, Lyon, Marseille, Lille, Toulouse...</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                          <span>Déplacements dans toute la France</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                          <span>Organisation clé en main</span>
                        </li>
                      </ul>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/30">
                    <CardContent className="p-6">
                      <Music className="w-12 h-12 text-purple-400 mb-4" />
                      <h3 className="text-xl font-bold mb-3 text-purple-400">Formules Sur Mesure</h3>
                      <ul className="space-y-2 text-slate-300 text-sm">
                        <li className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                          <span>Orchestres de 3 à 15+ musiciens</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                          <span>Options DJ, danseurs, animations</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                          <span>Devis gratuit personnalisé sous 24h</span>
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>

                <Card className="bg-gradient-to-br from-black via-gray-900 to-black border border-amber-500/30 text-center">
                  <CardContent className="p-8">
                    <h3 className="text-2xl font-bold mb-3 text-amber-400">Réservez Votre Orchestre</h3>
                    <p className="text-slate-300 mb-6 text-sm md:text-base">
                      Mariages, anniversaires, soirées d'entreprise, événements culturels...
                    </p>
                    <Button
                      onClick={() => setActiveTab('contact')}
                      size="lg"
                      className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 px-8 py-6 text-base md:text-lg"
                    >
                      <Phone className="w-5 h-5 mr-2" />
                      Demander un Devis Gratuit
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="contact" className="mt-0">
              <div className="max-w-3xl mx-auto">
                <div className="mb-6 text-center">
                  <h2 className="text-2xl md:text-3xl font-bold mb-2 bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                    Contactez-Nous
                  </h2>
                  <p className="text-slate-300 text-sm md:text-base">
                    Nous sommes à votre écoute pour créer l'événement de vos rêves
                  </p>
                </div>

                <Card className="bg-gradient-to-br from-slate-900/80 to-black/80 border-amber-500/30">
                  <CardContent className="p-8">
                    <div className="space-y-6">
                      <div className="flex items-start gap-4">
                        <div className="bg-amber-500/20 p-3 rounded-lg">
                          <Phone className="w-6 h-6 text-amber-400" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg mb-1 text-amber-400">Téléphone</h3>
                          <a href={`tel:+${settings.contact_phone.replace(/\D/g, '')}`} className="text-slate-300 hover:text-amber-400 transition-colors">
                            {settings.contact_phone}
                          </a>
                          <p className="text-xs text-slate-400 mt-1">Disponible 7j/7 de 9h à 21h</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4">
                        <div className="bg-blue-500/20 p-3 rounded-lg">
                          <Mail className="w-6 h-6 text-blue-400" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg mb-1 text-blue-400">Email</h3>
                          <a href={`mailto:${settings.contact_email}`} className="text-slate-300 hover:text-blue-400 transition-colors">
                            {settings.contact_email}
                          </a>
                          <p className="text-xs text-slate-400 mt-1">Réponse sous 24h garantie</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4">
                        <div className="bg-green-500/20 p-3 rounded-lg">
                          <MapPin className="w-6 h-6 text-green-400" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg mb-1 text-green-400">Zone d'intervention</h3>
                          <p className="text-slate-300">Toute la France</p>
                          <p className="text-xs text-slate-400 mt-1">Paris, Lyon, Marseille, Lille, Toulouse et régions</p>
                        </div>
                      </div>

                      <div className="border-t border-slate-700 pt-6 mt-6">
                        <h3 className="font-bold text-lg mb-4 text-center text-amber-400">Demande de Devis Express</h3>
                        <div className="grid gap-3">
                          <Button
                            onClick={() => router.push('/orchestres/trio-orientale')}
                            variant="outline"
                            className="w-full border-amber-500/30 hover:bg-amber-500/10 hover:border-amber-500 text-white justify-start"
                          >
                            <Music className="w-4 h-4 mr-3 text-amber-400" />
                            Voir nos formules et demander un devis
                          </Button>
                          <Button
                            onClick={() => window.open(`https://wa.me/${settings.whatsapp_number}`, '_blank')}
                            variant="outline"
                            className="w-full border-green-500/30 hover:bg-green-500/10 hover:border-green-500 text-white justify-start"
                          >
                            <Phone className="w-4 h-4 mr-3 text-green-400" />
                            WhatsApp: Contact direct
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="mt-6 text-center">
                  <p className="text-slate-400 text-sm">
                    Besoin d'aide pour choisir ? Notre équipe vous conseille gratuitement !
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="h-8"></div>
      </main>
    </div>
  );
}
