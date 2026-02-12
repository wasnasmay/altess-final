'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Music2, Plus, Minus, ArrowLeft, Check, Send, Home, Star, Briefcase } from 'lucide-react';
import Footer from '@/components/Footer';
// import WhatsAppChat from '@/components/WhatsAppChat';
import AltosLogo from '@/components/AltosLogo';

interface Instrument {
  id: string;
  name: string;
  category: string;
  price_per_hour: number;
  description: string;
  image_url: string;
}

export default function ComposerOrchestrePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [selectedInstruments, setSelectedInstruments] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [eventType, setEventType] = useState('');
  const [durationHours, setDurationHours] = useState('3');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadInstruments();
    if (user) {
      supabase
        .from('profiles')
        .select('full_name, email, phone')
        .eq('id', user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data) {
            setCustomerName(data.full_name || '');
            setCustomerEmail(data.email || '');
            setCustomerPhone(data.phone || '');
          }
        });
    }
  }, [user]);

  async function loadInstruments() {
    try {
      const { data, error } = await supabase
        .from('instruments')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      setInstruments(data || []);
    } catch (error) {
      console.error('Error loading instruments:', error);
      toast.error('Erreur lors du chargement des instruments');
    } finally {
      setLoading(false);
    }
  }

  function handleInstrumentChange(instrumentId: string, change: number) {
    const newMap = new Map(selectedInstruments);
    const current = newMap.get(instrumentId) || 0;
    const newCount = Math.max(0, current + change);

    if (newCount === 0) {
      newMap.delete(instrumentId);
    } else {
      newMap.set(instrumentId, newCount);
    }

    setSelectedInstruments(newMap);
  }

  function calculateTotal() {
    let total = 0;
    const hours = parseInt(durationHours) || 0;

    selectedInstruments.forEach((count, instrumentId) => {
      const instrument = instruments.find(i => i.id === instrumentId);
      if (instrument) {
        total += instrument.price_per_hour * count * hours;
      }
    });

    return total;
  }

  async function handleSubmit() {
    if (!customerName || !customerEmail || !customerPhone || !eventDate || !eventLocation || !eventType) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (selectedInstruments.size === 0) {
      toast.error('Veuillez sélectionner au moins un instrument');
      return;
    }

    setSubmitting(true);

    try {
      const selectedItems = Array.from(selectedInstruments.entries()).map(([instrumentId, quantity]) => {
        const instrument = instruments.find(i => i.id === instrumentId);
        return {
          instrument_id: instrumentId,
          instrument_name: instrument?.name,
          quantity,
          price_per_hour: instrument?.price_per_hour
        };
      });

      const totalPrice = calculateTotal();

      const { data, error } = await supabase
        .from('custom_orders')
        .insert({
          user_id: user?.id,
          customer_name: customerName,
          customer_email: customerEmail,
          customer_phone: customerPhone,
          event_date: eventDate,
          event_location: eventLocation,
          event_type: eventType,
          duration_hours: parseInt(durationHours),
          total_price: totalPrice,
          notes: notes,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      const { error: itemsError } = await supabase
        .from('custom_order_items')
        .insert(
          selectedItems.map(item => ({
            order_id: data.id,
            instrument_id: item.instrument_id,
            quantity: item.quantity
          }))
        );

      if (itemsError) throw itemsError;

      toast.success('Votre demande a été envoyée avec succès !');

      setTimeout(() => {
        router.push('/');
      }, 1500);
    } catch (error) {
      console.error('Error submitting order:', error);
      toast.error('Erreur lors de l\'envoi de la demande');
    } finally {
      setSubmitting(false);
    }
  }

  const groupedInstruments = instruments.reduce((acc, instrument) => {
    if (!acc[instrument.category]) {
      acc[instrument.category] = [];
    }
    acc[instrument.category].push(instrument);
    return acc;
  }, {} as Record<string, Instrument[]>);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-black text-white">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-amber-500/20">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <button onClick={() => router.push('/')} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <AltosLogo size="sm" />
            </button>
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/')}
                className="text-slate-200 hover:text-amber-400 hover:bg-amber-500/10"
              >
                <Home className="w-4 h-4 mr-2" />
                Accueil
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/prestations')}
                className="text-slate-200 hover:text-amber-400 hover:bg-amber-500/10"
              >
                <Briefcase className="w-4 h-4 mr-2" />
                Nos Prestations
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/stars')}
                className="text-slate-200 hover:text-amber-400 hover:bg-amber-500/10"
              >
                <Star className="w-4 h-4 mr-2" />
                Nos Stars
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 pt-24 pb-8">
        <div className="mb-8">
          <Button variant="ghost" onClick={() => router.push('/evenementiel/notre-orchestre')} className="mb-4 text-slate-300 hover:text-amber-400">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour à Orientale Musique
          </Button>
          <div className="text-center">
            <div className="inline-flex items-center justify-center p-4 bg-amber-500/10 border-2 border-amber-500/20 rounded-full mb-4">
              <Music2 className="w-12 h-12 text-amber-500" />
            </div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400 bg-clip-text text-transparent">
              Composer votre orchestre
            </h1>
            <p className="text-slate-300 text-lg max-w-2xl mx-auto">
              Créez un orchestre sur mesure en sélectionnant les instruments de votre choix.
              Nous vous enverrons un devis personnalisé dans les 24h.
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {Object.entries(groupedInstruments).map(([category, categoryInstruments]) => (
              <Card key={category} className="bg-gradient-to-br from-black via-slate-900 to-black border border-amber-500/20">
                <CardHeader>
                  <CardTitle className="text-2xl text-amber-400">{category}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    {categoryInstruments.map((instrument) => {
                      const count = selectedInstruments.get(instrument.id) || 0;
                      return (
                        <Card key={instrument.id} className={`transition-all bg-black/40 ${count > 0 ? 'border-amber-500 border-2 shadow-lg shadow-amber-500/20' : 'border-amber-500/20'}`}>
                          <CardContent className="p-4">
                            <div className="flex items-start gap-4">
                              <div className="w-20 h-20 rounded-lg overflow-hidden bg-amber-500/5 flex-shrink-0 border border-amber-500/20">
                                <img
                                  src={instrument.image_url}
                                  alt={instrument.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold mb-1 text-white">{instrument.name}</h4>
                                <p className="text-xs text-slate-400 line-clamp-2 mb-2">
                                  {instrument.description}
                                </p>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Button
                                      size="icon"
                                      variant="outline"
                                      className="h-8 w-8 border-amber-500/30 text-slate-300 hover:bg-amber-500/10 hover:text-amber-400"
                                      onClick={() => handleInstrumentChange(instrument.id, -1)}
                                      disabled={count === 0}
                                    >
                                      <Minus className="w-4 h-4" />
                                    </Button>
                                    <span className="w-8 text-center font-semibold text-amber-400">{count}</span>
                                    <Button
                                      size="icon"
                                      variant="outline"
                                      className="h-8 w-8 border-amber-500/30 text-slate-300 hover:bg-amber-500/10 hover:text-amber-400"
                                      onClick={() => handleInstrumentChange(instrument.id, 1)}
                                    >
                                      <Plus className="w-4 h-4" />
                                    </Button>
                                  </div>
                                  {count > 0 && (
                                    <Badge variant="default" className="ml-2 bg-amber-500 text-black">
                                      <Check className="w-3 h-3 mr-1" />
                                      Ajouté
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-28 bg-gradient-to-br from-black via-slate-900 to-black border border-amber-500/20">
              <CardHeader>
                <CardTitle className="text-amber-400">Votre demande</CardTitle>
                <CardDescription className="text-slate-400">Informations nécessaires pour le devis</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ScrollArea className="h-[calc(100vh-300px)]">
                  <div className="space-y-4 pr-4">
                    <div className="bg-amber-500/5 p-4 rounded-lg border border-amber-500/20">
                      <h4 className="font-semibold mb-2 text-amber-400">Instruments sélectionnés</h4>
                      {selectedInstruments.size === 0 ? (
                        <p className="text-sm text-slate-400">Aucun instrument sélectionné</p>
                      ) : (
                        <div className="space-y-2">
                          {Array.from(selectedInstruments.entries()).map(([id, count]) => {
                            const instrument = instruments.find(i => i.id === id);
                            return (
                              <div key={id} className="flex justify-between text-sm text-slate-300">
                                <span>{instrument?.name}</span>
                                <span className="font-semibold text-amber-400">×{count}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="name" className="text-slate-300">Nom complet *</Label>
                      <Input
                        id="name"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Votre nom"
                        className="bg-black/40 border-amber-500/30 text-white placeholder:text-slate-500"
                      />
                    </div>

                    <div>
                      <Label htmlFor="email" className="text-slate-300">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        placeholder="votre@email.com"
                        className="bg-black/40 border-amber-500/30 text-white placeholder:text-slate-500"
                      />
                    </div>

                    <div>
                      <Label htmlFor="phone" className="text-slate-300">Téléphone *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="+33 6 12 34 56 78"
                        className="bg-black/40 border-amber-500/30 text-white placeholder:text-slate-500"
                      />
                    </div>

                    <div>
                      <Label htmlFor="eventType" className="text-slate-300">Type d'événement *</Label>
                      <Input
                        id="eventType"
                        value={eventType}
                        onChange={(e) => setEventType(e.target.value)}
                        placeholder="Mariage, Concert, etc."
                        className="bg-black/40 border-amber-500/30 text-white placeholder:text-slate-500"
                      />
                    </div>

                    <div>
                      <Label htmlFor="eventDate" className="text-slate-300">Date de l'événement *</Label>
                      <Input
                        id="eventDate"
                        type="date"
                        value={eventDate}
                        onChange={(e) => setEventDate(e.target.value)}
                        className="bg-black/40 border-amber-500/30 text-white"
                      />
                    </div>

                    <div>
                      <Label htmlFor="location" className="text-slate-300">Lieu *</Label>
                      <Input
                        id="location"
                        value={eventLocation}
                        onChange={(e) => setEventLocation(e.target.value)}
                        placeholder="Ville, région"
                        className="bg-black/40 border-amber-500/30 text-white placeholder:text-slate-500"
                      />
                    </div>

                    <div>
                      <Label htmlFor="duration" className="text-slate-300">Durée (heures) *</Label>
                      <Input
                        id="duration"
                        type="number"
                        min="1"
                        value={durationHours}
                        onChange={(e) => setDurationHours(e.target.value)}
                        className="bg-black/40 border-amber-500/30 text-white"
                      />
                    </div>

                    <div>
                      <Label htmlFor="notes" className="text-slate-300">Notes additionnelles</Label>
                      <Textarea
                        id="notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Détails supplémentaires..."
                        rows={3}
                        className="bg-black/40 border-amber-500/30 text-white placeholder:text-slate-500"
                      />
                    </div>

                    <div className="bg-amber-500/5 p-4 rounded-lg border border-amber-500/20">
                      <p className="text-sm text-slate-400 mb-2">Prix estimatif (non contractuel)</p>
                      <p className="text-xs text-slate-500 italic mb-3">
                        Le prix final sera déterminé dans votre devis personnalisé
                      </p>
                      <p className="text-2xl font-bold text-amber-400">
                        ~{calculateTotal().toFixed(0)}€
                      </p>
                    </div>

                    <Button
                      className="w-full bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-black font-semibold"
                      size="lg"
                      onClick={handleSubmit}
                      disabled={submitting || selectedInstruments.size === 0}
                    >
                      {submitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2" />
                          Envoi en cours...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Demander un devis
                        </>
                      )}
                    </Button>

                    <p className="text-xs text-center text-slate-400">
                      * Champs obligatoires<br />
                      Vous recevrez un devis personnalisé sous 24h
                    </p>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* <WhatsAppChat /> */}
      <Footer />
    </div>
  );
}
