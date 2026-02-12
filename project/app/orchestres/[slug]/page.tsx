'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
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
  Sparkles
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Footer from '@/components/Footer';
// import WhatsAppChat from '@/components/WhatsAppChat';
import NetflixCarousel from '@/components/NetflixCarousel';
import Image from 'next/image';

type OrchestraFormula = {
  id: string;
  name: string;
  slug: string;
  description: string;
  seo_content: string;
  price_from: number;
  features: string[];
  image_url: string;
  gallery_images: string[];
  gallery_videos: any[];
};

type DemoVideo = {
  id: string;
  title: string;
  description: string;
  video_url: string;
  thumbnail_url: string;
};

type CarouselMediaItem = {
  id: string;
  title: string;
  type: 'image' | 'video';
  url: string;
  thumbnail_url: string | null;
};

export default function OrchestraDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const [orchestra, setOrchestra] = useState<OrchestraFormula | null>(null);
  const [demoVideos, setDemoVideos] = useState<DemoVideo[]>([]);
  const [carouselMedia, setCarouselMedia] = useState<CarouselMediaItem[]>([]);
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
    loadOrchestraData();
    loadDemoVideos();
  }, [slug]);

  async function loadOrchestraData() {
    try {
      const { data, error } = await supabase
        .from('orchestra_formulas')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        router.push('/');
        return;
      }

      setOrchestra(data);
      loadCarouselMedia(data.id);
    } catch (error) {
      console.error('Error loading orchestra:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }

  async function loadCarouselMedia(formulaId: string) {
    try {
      const { data, error } = await supabase
        .from('carousel_media')
        .select('id, title, type, url, thumbnail_url')
        .eq('orchestra_formula_id', formulaId)
        .eq('is_active', true)
        .order('order_position');

      if (error) throw error;
      setCarouselMedia(data || []);
    } catch (error) {
      console.error('Error loading carousel media:', error);
    }
  }

  async function loadDemoVideos() {
    try {
      const { data, error } = await supabase
        .from('demo_videos')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (error) throw error;
      setDemoVideos(data || []);
    } catch (error) {
      console.error('Error loading videos:', error);
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
          total_price: orchestra?.price_from || 0,
          notes: `Formule: ${orchestra?.name}\n${quoteForm.notes}`,
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  if (!orchestra) {
    return null;
  }

  const galleryMedia = carouselMedia.length > 0
    ? carouselMedia.map(item => ({
        type: item.type,
        url: item.url,
        thumbnail: item.thumbnail_url || undefined,
        title: item.title,
      }))
    : [
        ...(orchestra.gallery_images || []).map(url => ({
          type: 'image' as const,
          url,
        })),
        ...(demoVideos || []).map(video => ({
          type: 'video' as const,
          url: video.video_url,
          thumbnail: video.thumbnail_url,
          title: video.title,
        })),
      ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-black text-white">
      {/* <WhatsAppChat /> */}

      <header className="relative">
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-slate-950/70 to-slate-950 z-10" />

        <div className="relative h-[70vh] md:h-[85vh] overflow-hidden">
          <Image
            src={orchestra.image_url}
            alt={`${orchestra.name} - Orchestre mariage oriental professionnel`}
            fill
            className="object-cover"
            priority
          />
        </div>

        <div className="absolute inset-0 z-20">
          <div className="container mx-auto px-4 md:px-6 py-4 md:py-6 h-full flex flex-col">
            <Button
              variant="ghost"
              onClick={() => router.push('/orchestres')}
              className="self-start text-white/90 hover:text-amber-400 hover:bg-white/10 backdrop-blur-sm border border-white/20 shadow-lg"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour à l'accueil
            </Button>

            <div className="mt-auto mb-8 md:mb-12">
              <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold mb-3 md:mb-4 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400 bg-clip-text text-transparent drop-shadow-2xl">
                {orchestra.name}
              </h1>
              <p className="text-base md:text-lg lg:text-xl text-slate-200 mb-6 max-w-2xl drop-shadow-lg">
                {orchestra.description}
              </p>
              <div className="flex flex-wrap gap-3 md:gap-4">
                <Button
                  onClick={() => setIsQuoteDialogOpen(true)}
                  size="lg"
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold px-6 md:px-8 py-4 md:py-6 text-base md:text-lg shadow-2xl"
                >
                  Demander un devis gratuit
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 md:px-6 py-8 md:py-12">
        <div className="grid lg:grid-cols-3 gap-6 md:gap-8 mb-8 md:mb-12">
          <article className="lg:col-span-2 space-y-6">
            <section className="grid md:grid-cols-3 gap-4">
              <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20 hover:border-amber-500/40 transition-all">
                <CardContent className="p-4 md:p-5 text-center">
                  <Star className="w-8 md:w-10 text-amber-400 mx-auto mb-2 md:mb-3" />
                  <h3 className="text-base md:text-lg font-bold mb-1">Qualité Premium</h3>
                  <p className="text-slate-400 text-xs md:text-sm">Musiciens professionnels certifiés</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20 hover:border-blue-500/40 transition-all">
                <CardContent className="p-4 md:p-5 text-center">
                  <Shield className="w-8 md:w-10 text-blue-400 mx-auto mb-2 md:mb-3" />
                  <h3 className="text-base md:text-lg font-bold mb-1">Garantie Satisfait</h3>
                  <p className="text-slate-400 text-xs md:text-sm">Service client réactif</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20 hover:border-green-500/40 transition-all">
                <CardContent className="p-4 md:p-5 text-center">
                  <Award className="w-8 md:w-10 text-green-400 mx-auto mb-2 md:mb-3" />
                  <h3 className="text-base md:text-lg font-bold mb-1">+10 ans d'expérience</h3>
                  <p className="text-slate-400 text-xs md:text-sm">Expertise en animation orientale</p>
                </CardContent>
              </Card>
            </section>

            <section>
              <h2 className="text-xl md:text-2xl font-bold mb-4 flex items-center gap-2 bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                <Sparkles className="w-5 md:w-6 text-amber-400" />
                Orchestre Oriental Professionnel
              </h2>
              <div className="prose prose-invert max-w-none">
                <div className="text-slate-300 leading-relaxed text-sm md:text-base space-y-3 md:space-y-4">
                  {orchestra.seo_content ? (
                    <p className="whitespace-pre-line line-clamp-6 md:line-clamp-none">{orchestra.seo_content}</p>
                  ) : (
                    <p>
                      Notre <strong>{orchestra.name}</strong> est la formule idéale pour votre <strong>mariage oriental</strong>,
                      événement familial ou soirée d'entreprise. Spécialisés dans la <strong>musique orientale live</strong>,
                      nos musiciens professionnels apportent l'ambiance authentique et festive qui fera de votre événement
                      un moment inoubliable. Disponible partout en France.
                    </p>
                  )}
                </div>
              </div>
            </section>
          </article>

          <aside>
            <Card className="bg-gradient-to-br from-black via-gray-900 to-black border border-amber-500/30 lg:sticky lg:top-20 shadow-2xl shadow-amber-500/10">
              <CardContent className="p-4 md:p-6 space-y-3 md:space-y-4">
                <h3 className="text-lg md:text-xl font-bold flex items-center gap-2 text-amber-400">
                  <Check className="w-5 h-5" />
                  Prestations Incluses
                </h3>
                <ul className="space-y-2 md:space-y-2.5">
                  {orchestra.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 text-slate-300">
                      <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                      <span className="text-xs md:text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={() => setIsQuoteDialogOpen(true)}
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 py-4 md:py-5 text-sm md:text-base font-semibold shadow-lg hover:shadow-amber-500/50 transition-all"
                >
                  Demander un devis gratuit
                </Button>
              </CardContent>
            </Card>
          </aside>
        </div>

        {galleryMedia.length > 0 && (
          <section className="mb-8 md:mb-12">
            <h2 className="text-xl md:text-3xl font-bold mb-4 md:mb-6 text-center bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
              Galerie Photos & Vidéos
            </h2>
            <NetflixCarousel items={galleryMedia} />
          </section>
        )}

        <section className="text-center bg-gradient-to-br from-black via-gray-900 to-black border border-amber-500/30 rounded-xl md:rounded-2xl p-6 md:p-10 shadow-2xl shadow-amber-500/10">
          <h2 className="text-xl md:text-3xl font-bold mb-3 md:mb-4 bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
            Réservez Votre Orchestre Oriental
          </h2>
          <p className="text-sm md:text-base text-slate-300 mb-4 md:mb-6 max-w-2xl mx-auto">
            <strong>Disponible partout en France</strong> - Devis personnalisé gratuit sous 24h
          </p>
          <Button
            onClick={() => setIsQuoteDialogOpen(true)}
            size="lg"
            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold px-8 md:px-12 py-4 md:py-6 text-sm md:text-base shadow-2xl hover:shadow-amber-500/50 transition-all"
          >
            Demander un devis gratuit
          </Button>
        </section>
      </main>

      <Dialog open={isQuoteDialogOpen} onOpenChange={setIsQuoteDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-2xl text-amber-400">
              Demander un devis - {orchestra.name}
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
