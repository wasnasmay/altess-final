'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft, CheckCircle, Music2, Users, Clock,
  Crown, Star, Sparkles, Phone, Mail, MapPin,
  Calendar, Send, Check
} from 'lucide-react';
import NetflixCarousel from '@/components/NetflixCarousel';
import OrientaleMusiquelogo from '@/components/OrientaleMusiquelogo';
import { toast } from 'sonner';

type OrchestraFormula = {
  id: string;
  name: string;
  slug: string;
  description: string;
  long_description?: string;
  price_from: number;
  duration_hours: number;
  musicians_count: number;
  features: any;
  is_popular: boolean;
  stripe_payment_link?: string;
  seo_content?: string;
  seo_keywords?: string[];
};

type CarouselMediaItem = {
  id: string;
  title: string;
  description: string | null;
  type: 'image' | 'video';
  url: string;
  thumbnail_url: string | null;
};

export default function FormulaDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [formula, setFormula] = useState<OrchestraFormula | null>(null);
  const [carouselMedia, setCarouselMedia] = useState<CarouselMediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    eventDate: '',
    eventType: '',
    guestCount: '',
    message: ''
  });

  useEffect(() => {
    loadData();
  }, [params.slug]);

  async function loadData() {
    try {
      const { data: formulaData, error: formulaError } = await supabase
        .from('orchestra_formulas')
        .select('*')
        .eq('slug', params.slug)
        .eq('is_active', true)
        .single();

      if (formulaError) throw formulaError;
      setFormula(formulaData);

      if (formulaData) {
        const { data: mediaData } = await supabase
          .from('carousel_media')
          .select('*')
          .eq('formula_id', formulaData.id)
          .eq('is_active', true)
          .order('order_position', { ascending: true });

        if (mediaData) {
          setCarouselMedia(mediaData);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Formule introuvable');
      router.push('/orientale-musique');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));

      toast.success('Demande envoyée avec succès !', {
        description: 'Nous vous contacterons sous 24h'
      });

      setFormData({
        fullName: '',
        email: '',
        phone: '',
        eventDate: '',
        eventType: '',
        guestCount: '',
        message: ''
      });
    } catch (error) {
      toast.error('Erreur lors de l\'envoi');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <Crown className="w-16 h-16 text-amber-500 mx-auto mb-4 animate-pulse" />
          <p className="text-amber-300">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!formula) {
    return null;
  }

  const carouselItems = carouselMedia.map(item => ({
    type: item.type,
    url: item.url,
    thumbnail: item.thumbnail_url || item.url,
    title: item.title
  }));

  return (
    <div className="min-h-screen bg-black text-white">
      <main className="pb-16">
        {/* Hero Section avec Effet Premium */}
        <section className="relative py-16 md:py-24 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-amber-950/20 via-transparent to-transparent"></div>
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <div className="mb-4">
                <Badge className="bg-gradient-to-r from-amber-600 to-yellow-600 text-black px-4 py-1.5 text-sm font-bold">
                  <Crown className="w-4 h-4 mr-1.5" />
                  Formule Premium
                </Badge>
              </div>

              <h1 className="text-4xl md:text-6xl font-black mb-4 bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-300 bg-clip-text text-transparent">
                {formula.name}
              </h1>

              {formula.is_popular && (
                <div className="inline-flex items-center gap-2 mb-4">
                  <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                  <span className="text-amber-400 font-medium">Formule la plus populaire</span>
                  <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                </div>
              )}

              <p className="text-lg text-amber-200/70 mb-8 max-w-2xl mx-auto">
                {formula.description}
              </p>

              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                <Card className="bg-gradient-to-br from-amber-950/40 to-black border-amber-700/30 shadow-xl shadow-amber-900/20">
                  <CardContent className="p-6 text-center">
                    <Users className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-amber-300">{formula.musicians_count}</p>
                    <p className="text-sm text-amber-600/80">Musiciens Professionnels</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-amber-950/40 to-black border-amber-700/30 shadow-xl shadow-amber-900/20">
                  <CardContent className="p-6 text-center">
                    <Clock className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-amber-300">{formula.duration_hours}h</p>
                    <p className="text-sm text-amber-600/80">De Prestation</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Galerie Photos/Vidéos */}
        {carouselMedia.length > 0 && (
          <section className="py-10 bg-gradient-to-b from-transparent to-amber-950/10">
            <div className="container mx-auto px-4">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-amber-300 to-yellow-400 bg-clip-text text-transparent mb-2">
                  Galerie
                </h2>
                <p className="text-amber-600/70">Découvrez notre {formula.name} en images</p>
              </div>
              <NetflixCarousel items={carouselItems} />
            </div>
          </section>
        )}

        {/* Description Longue */}
        {formula.long_description && (
          <section className="py-10 container mx-auto px-4">
            <Card className="bg-gradient-to-br from-amber-950/20 to-black border-amber-700/30 max-w-5xl mx-auto">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-amber-300 flex items-center gap-2">
                  <Sparkles className="w-6 h-6" />
                  Présentation Détaillée
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-amber-200/80 leading-relaxed whitespace-pre-line">
                  {formula.long_description}
                </p>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Toutes les Features */}
        <section className="py-10 bg-gradient-to-b from-amber-950/10 to-transparent">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-amber-300 to-yellow-400 bg-clip-text text-transparent mb-2">
                Ce Qui Est Inclus
              </h2>
              <p className="text-amber-600/70">Tous les avantages de cette formule</p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {(Array.isArray(formula.features) ? formula.features : []).map((feature: string, idx: number) => (
                <Card key={idx} className="bg-gradient-to-br from-amber-950/30 to-black border-amber-700/20 hover:border-amber-600/40 transition-all">
                  <CardContent className="p-4 flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-amber-200/80">{feature}</span>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Pourquoi Choisir */}
        <section className="py-10 container mx-auto px-4 max-w-5xl">
          <Card className="bg-gradient-to-br from-amber-900/20 to-black border-amber-700/30">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-amber-300 flex items-center gap-2">
                <Star className="w-6 h-6 fill-amber-500 text-amber-500" />
                Pourquoi Choisir {formula.name} ?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-amber-500 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-amber-300 mb-1">Professionnalisme Garanti</h3>
                  <p className="text-amber-200/70 text-sm">
                    Nos musiciens sont des professionnels expérimentés avec plus de 15 ans de carrière
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-amber-500 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-amber-300 mb-1">Répertoire Varié</h3>
                  <p className="text-amber-200/70 text-sm">
                    Du classique au moderne, nous adaptons notre répertoire à vos goûts
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-amber-500 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-amber-300 mb-1">Matériel Professionnel</h3>
                  <p className="text-amber-200/70 text-sm">
                    Sonorisation et éclairage de qualité supérieure pour une ambiance parfaite
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Formulaire de Contact */}
        <section className="py-16 bg-gradient-to-b from-transparent via-amber-950/20 to-transparent">
          <div className="container mx-auto px-4 max-w-3xl">
            <div className="text-center mb-10">
              <Badge className="bg-gradient-to-r from-amber-600 to-yellow-600 text-black px-4 py-1.5 mb-4">
                <Send className="w-4 h-4 mr-2" />
                Demande de Renseignements
              </Badge>
              <h2 className="text-4xl font-black mb-3 bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-300 bg-clip-text text-transparent">
                Intéressé par {formula.name} ?
              </h2>
              <p className="text-amber-200/70">
                Remplissez ce formulaire et nous vous contacterons sous 24h pour discuter de votre projet
              </p>
            </div>

            <Card className="bg-gradient-to-br from-amber-950/40 via-black to-black border-amber-700/30 shadow-2xl shadow-amber-900/30">
              <CardContent className="p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="fullName" className="text-amber-300 mb-2 block">
                        Nom complet *
                      </Label>
                      <Input
                        id="fullName"
                        required
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        className="bg-black/50 border-amber-700/30 text-white focus:border-amber-500"
                        placeholder="Jean Dupont"
                      />
                    </div>

                    <div>
                      <Label htmlFor="email" className="text-amber-300 mb-2 block">
                        Email *
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="bg-black/50 border-amber-700/30 text-white focus:border-amber-500"
                        placeholder="jean.dupont@email.com"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="phone" className="text-amber-300 mb-2 block">
                        Téléphone *
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="bg-black/50 border-amber-700/30 text-white focus:border-amber-500"
                        placeholder="06 12 34 56 78"
                      />
                    </div>

                    <div>
                      <Label htmlFor="eventDate" className="text-amber-300 mb-2 block">
                        Date de l'événement
                      </Label>
                      <Input
                        id="eventDate"
                        type="date"
                        value={formData.eventDate}
                        onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                        className="bg-black/50 border-amber-700/30 text-white focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="eventType" className="text-amber-300 mb-2 block">
                        Type d'événement
                      </Label>
                      <select
                        id="eventType"
                        value={formData.eventType}
                        onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                        className="w-full bg-black/50 border border-amber-700/30 text-white rounded-md px-3 py-2 focus:border-amber-500 focus:outline-none"
                      >
                        <option value="">Sélectionnez...</option>
                        <option value="mariage">Mariage</option>
                        <option value="fiancailles">Fiançailles</option>
                        <option value="anniversaire">Anniversaire</option>
                        <option value="gala">Gala</option>
                        <option value="entreprise">Événement d'entreprise</option>
                        <option value="autre">Autre</option>
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="guestCount" className="text-amber-300 mb-2 block">
                        Nombre d'invités
                      </Label>
                      <Input
                        id="guestCount"
                        type="number"
                        value={formData.guestCount}
                        onChange={(e) => setFormData({ ...formData, guestCount: e.target.value })}
                        className="bg-black/50 border-amber-700/30 text-white focus:border-amber-500"
                        placeholder="Ex: 150"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="message" className="text-amber-300 mb-2 block">
                      Votre message
                    </Label>
                    <Textarea
                      id="message"
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="bg-black/50 border-amber-700/30 text-white focus:border-amber-500 min-h-[120px]"
                      placeholder="Parlez-nous de votre événement, vos attentes..."
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 text-black font-bold text-lg py-6 shadow-xl shadow-amber-900/40"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin mr-2"></div>
                        Envoi en cours...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5 mr-2" />
                        Envoyer ma demande
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-amber-600/60 text-center">
                    En soumettant ce formulaire, vous acceptez d'être contacté par Orientale Musique concernant votre demande
                  </p>
                </form>
              </CardContent>
            </Card>

            {/* Contact Info */}
            <div className="mt-10 grid md:grid-cols-3 gap-4">
              <Card className="bg-gradient-to-br from-amber-950/20 to-black border-amber-700/20">
                <CardContent className="p-4 text-center">
                  <Phone className="w-6 h-6 text-amber-500 mx-auto mb-2" />
                  <p className="text-xs text-amber-600/70 mb-1">Téléphone</p>
                  <p className="text-sm text-amber-300 font-medium">06 12 34 56 78</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-amber-950/20 to-black border-amber-700/20">
                <CardContent className="p-4 text-center">
                  <Mail className="w-6 h-6 text-amber-500 mx-auto mb-2" />
                  <p className="text-xs text-amber-600/70 mb-1">Email</p>
                  <p className="text-sm text-amber-300 font-medium">contact@orientale-musique.fr</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-amber-950/20 to-black border-amber-700/20">
                <CardContent className="p-4 text-center">
                  <MapPin className="w-6 h-6 text-amber-500 mx-auto mb-2" />
                  <p className="text-xs text-amber-600/70 mb-1">Région</p>
                  <p className="text-sm text-amber-300 font-medium">Île-de-France</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gradient-to-b from-amber-950/10 to-black border-t border-amber-900/20 py-8">
        <div className="container mx-auto px-4 text-center">
          <OrientaleMusiquelogo className="mx-auto mb-4" />
          <p className="text-amber-600/60 text-sm">
            © 2026 Orientale Musique - Tous droits réservés
          </p>
        </div>
      </footer>
    </div>
  );
}
