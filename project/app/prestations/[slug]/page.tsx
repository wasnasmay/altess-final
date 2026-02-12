'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from 'sonner';
import {
  Check,
  Calendar as CalendarIcon,
  Star,
  Shield,
  Award,
  ArrowLeft,
  Sparkles,
  Share2
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Footer from '@/components/Footer';
// import WhatsAppChat from '@/components/WhatsAppChat';
import NetflixCarousel from '@/components/NetflixCarousel';
import Image from 'next/image';
import Head from 'next/head';

type Prestation = {
  id: string;
  title: string;
  slug: string;
  short_description: string;
  full_description: string;
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string | null;
  og_image: string | null;
  main_image: string | null;
  gallery_images: string[];
  features: string[];
};

export default function PrestationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const [prestation, setPrestation] = useState<Prestation | null>(null);
  const [loading, setLoading] = useState(true);
  const [isQuoteDialogOpen, setIsQuoteDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>();

  const [quoteForm, setQuoteForm] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    event_location: '',
    event_type: '',
    duration_hours: 3,
    notes: '',
  });

  useEffect(() => {
    loadPrestationData();
  }, [slug]);

  useEffect(() => {
    if (prestation) {
      document.title = prestation.seo_title || `${prestation.title} | Orientale Musique`;

      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', prestation.seo_description || prestation.short_description);
      }

      const ogTitle = document.querySelector('meta[property="og:title"]');
      if (ogTitle) {
        ogTitle.setAttribute('content', prestation.seo_title || prestation.title);
      }

      const ogDescription = document.querySelector('meta[property="og:description"]');
      if (ogDescription) {
        ogDescription.setAttribute('content', prestation.seo_description || prestation.short_description);
      }

      const ogImage = document.querySelector('meta[property="og:image"]');
      if (ogImage && (prestation.og_image || prestation.main_image)) {
        ogImage.setAttribute('content', prestation.og_image || prestation.main_image || '');
      }
    }
  }, [prestation]);

  async function loadPrestationData() {
    try {
      const { data, error } = await supabase
        .from('prestations')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        router.push('/prestations');
        return;
      }

      setPrestation(data);
    } catch (error) {
      console.error('Error loading prestation:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }

  async function handleQuoteSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!selectedDate) {
      toast.error('Veuillez sélectionner une date');
      return;
    }

    try {
      const { error } = await supabase
        .from('custom_orders')
        .insert([{
          customer_name: quoteForm.customer_name,
          customer_email: quoteForm.customer_email,
          customer_phone: quoteForm.customer_phone,
          event_date: format(selectedDate, 'yyyy-MM-dd'),
          event_location: quoteForm.event_location,
          event_type: quoteForm.event_type,
          duration_hours: quoteForm.duration_hours,
          total_price: 0,
          notes: `Prestation: ${prestation?.title}\n${quoteForm.notes}`,
          status: 'pending'
        }]);

      if (error) throw error;

      toast.success('Demande de devis envoyée avec succès !');
      setIsQuoteDialogOpen(false);
      setQuoteForm({
        customer_name: '',
        customer_email: '',
        customer_phone: '',
        event_location: '',
        event_type: '',
        duration_hours: 3,
        notes: '',
      });
      setSelectedDate(undefined);
    } catch (error) {
      console.error('Error submitting quote:', error);
      toast.error('Erreur lors de l\'envoi de la demande');
    }
  }

  async function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: prestation?.title,
          text: prestation?.short_description,
          url: url,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      navigator.clipboard.writeText(url);
      toast.success('Lien copié dans le presse-papier');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-black">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  if (!prestation) {
    return null;
  }

  const galleryMedia = prestation.gallery_images.length > 0
    ? prestation.gallery_images.map(url => ({
        type: 'image' as const,
        url,
      }))
    : [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-black text-white">
      <Navigation />
      {/* <WhatsAppChat /> */}

      <header className="relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-950/50 to-slate-950 z-10" />

        <div className="relative h-[70vh] overflow-hidden">
          {prestation.main_image ? (
            <Image
              src={prestation.main_image}
              alt={`${prestation.title} - Animation musicale orientale professionnelle`}
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
              <div className="text-9xl text-amber-500/20">♪</div>
            </div>
          )}
        </div>

        <div className="absolute inset-0 z-20">
          <div className="container mx-auto px-4 py-8 h-full flex flex-col">
            <div className="flex items-center justify-between mb-auto">
              <Button
                variant="ghost"
                onClick={() => router.push('/prestations')}
                className="text-white hover:text-amber-400 hover:bg-white/10"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour aux prestations
              </Button>
              <Button
                variant="ghost"
                onClick={handleShare}
                className="text-white hover:text-amber-400 hover:bg-white/10"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Partager
              </Button>
            </div>

            <div className="mt-auto mb-12">
              <h1 className="text-5xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400 bg-clip-text text-transparent drop-shadow-2xl">
                {prestation.title}
              </h1>
              <p className="text-2xl text-slate-200 mb-8 max-w-3xl drop-shadow-lg">
                {prestation.short_description}
              </p>
              <div className="flex flex-wrap gap-4">
                <Button
                  onClick={() => setIsQuoteDialogOpen(true)}
                  size="lg"
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold px-8 py-6 text-lg shadow-2xl"
                >
                  Demander un devis gratuit
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16">
        <div className="grid lg:grid-cols-3 gap-12 mb-16">
          <article className="lg:col-span-2 space-y-8">
            <section>
              <h2 className="text-3xl font-bold mb-6 flex items-center gap-3 bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                <Sparkles className="w-8 h-8 text-amber-400" />
                Présentation Détaillée
              </h2>
              <div className="prose prose-invert prose-lg max-w-none">
                <div className="text-slate-300 leading-relaxed text-lg space-y-6 whitespace-pre-line">
                  {prestation.full_description}
                </div>
              </div>
            </section>

            <section className="grid md:grid-cols-3 gap-6">
              <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20 hover:border-amber-500/40 transition-all">
                <CardContent className="p-6 text-center">
                  <Star className="w-12 h-12 text-amber-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">Qualité Premium</h3>
                  <p className="text-slate-400 text-sm">Musiciens professionnels certifiés avec expérience internationale</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20 hover:border-blue-500/40 transition-all">
                <CardContent className="p-6 text-center">
                  <Shield className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">Garantie Satisfait</h3>
                  <p className="text-slate-400 text-sm">Service client réactif et engagement qualité</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20 hover:border-green-500/40 transition-all">
                <CardContent className="p-6 text-center">
                  <Award className="w-12 h-12 text-green-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">Expérience Reconnue</h3>
                  <p className="text-slate-400 text-sm">Plus de 10 ans d'expertise en animation orientale</p>
                </CardContent>
              </Card>
            </section>
          </article>

          <aside>
            <Card className="bg-gradient-to-br from-black via-gray-900 to-black border border-amber-500/30 sticky top-24 shadow-2xl shadow-amber-500/10">
              <CardContent className="p-6 space-y-4">
                <h3 className="text-2xl font-bold flex items-center gap-2 text-amber-400">
                  <Check className="w-6 h-6" />
                  Ce qui est inclus
                </h3>
                <ul className="space-y-3">
                  {prestation.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3 text-slate-300">
                      <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <span className="text-base">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={() => setIsQuoteDialogOpen(true)}
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 py-6 text-lg font-semibold shadow-lg hover:shadow-amber-500/50 transition-all"
                >
                  Réserver maintenant
                </Button>
              </CardContent>
            </Card>
          </aside>
        </div>

        {galleryMedia.length > 0 && (
          <section className="mb-16">
            <h2 className="text-4xl font-bold mb-8 text-center bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
              Galerie Photos - Nos Prestations en Images
            </h2>
            <NetflixCarousel items={galleryMedia} />
          </section>
        )}

        <section className="text-center bg-gradient-to-br from-black via-gray-900 to-black border border-amber-500/30 rounded-2xl p-12 shadow-2xl shadow-amber-500/10">
          <h2 className="text-4xl font-bold mb-6 bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
            Prêt à Réserver Cette Prestation ?
          </h2>
          <p className="text-xl text-slate-300 mb-4 max-w-2xl mx-auto leading-relaxed">
            <strong>Disponible partout en France</strong> - Paris, Lyon, Marseille, Lille, Toulouse et toutes les régions.
          </p>
          <p className="text-lg text-slate-400 mb-8 max-w-2xl mx-auto">
            Contactez-nous dès maintenant pour vérifier nos disponibilités et obtenir un <strong>devis personnalisé gratuit</strong>.
            Réponse rapide garantie sous 24h.
          </p>
          <Button
            onClick={() => setIsQuoteDialogOpen(true)}
            size="lg"
            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold px-12 py-6 text-lg shadow-2xl hover:shadow-amber-500/50 transition-all"
          >
            Demander un devis gratuit
          </Button>
        </section>
      </main>

      <Dialog open={isQuoteDialogOpen} onOpenChange={setIsQuoteDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-2xl text-amber-400">
              Demander un devis - {prestation.title}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleQuoteSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customer_name" className="text-white">Nom complet *</Label>
                <Input
                  id="customer_name"
                  value={quoteForm.customer_name}
                  onChange={(e) => setQuoteForm({ ...quoteForm, customer_name: e.target.value })}
                  required
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div>
                <Label htmlFor="customer_email" className="text-white">Email *</Label>
                <Input
                  id="customer_email"
                  type="email"
                  value={quoteForm.customer_email}
                  onChange={(e) => setQuoteForm({ ...quoteForm, customer_email: e.target.value })}
                  required
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customer_phone" className="text-white">Téléphone *</Label>
                <Input
                  id="customer_phone"
                  type="tel"
                  value={quoteForm.customer_phone}
                  onChange={(e) => setQuoteForm({ ...quoteForm, customer_phone: e.target.value })}
                  required
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div>
                <Label htmlFor="event_type" className="text-white">Type d'événement *</Label>
                <Input
                  id="event_type"
                  value={quoteForm.event_type}
                  onChange={(e) => setQuoteForm({ ...quoteForm, event_type: e.target.value })}
                  placeholder="Mariage, anniversaire, etc."
                  required
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className="text-white">Date de l'événement *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, 'PPP', { locale: fr }) : 'Sélectionner une date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-slate-800 border-slate-700">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      locale={fr}
                      disabled={(date) => date < new Date()}
                      className="bg-slate-800 text-white"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label htmlFor="duration_hours" className="text-white">Durée (heures) *</Label>
                <Input
                  id="duration_hours"
                  type="number"
                  min="1"
                  max="12"
                  value={quoteForm.duration_hours}
                  onChange={(e) => setQuoteForm({ ...quoteForm, duration_hours: parseInt(e.target.value) })}
                  required
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="event_location" className="text-white">Lieu de l'événement *</Label>
              <Input
                id="event_location"
                value={quoteForm.event_location}
                onChange={(e) => setQuoteForm({ ...quoteForm, event_location: e.target.value })}
                placeholder="Ville ou adresse"
                required
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>

            <div>
              <Label htmlFor="notes" className="text-white">Message / Demandes spéciales</Label>
              <Textarea
                id="notes"
                value={quoteForm.notes}
                onChange={(e) => setQuoteForm({ ...quoteForm, notes: e.target.value })}
                placeholder="Décrivez vos besoins spécifiques..."
                rows={4}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 py-6 text-lg"
            >
              Envoyer la demande
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
