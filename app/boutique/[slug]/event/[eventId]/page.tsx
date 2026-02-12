'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Clock, User, Mail, Phone, Ticket, ShoppingCart, ArrowLeft, Check, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface Organizer {
  id: string;
  user_id: string;
  company_name: string;
  slug: string;
  logo_url: string | null;
  brand_color: string;
  instagram_url: string | null;
  facebook_url: string | null;
  show_altess_branding: boolean;
}

interface Event {
  id: string;
  title: string;
  short_description: string;
  full_description: string;
  event_date: string;
  event_time: string | null;
  venue_name: string | null;
  venue_address: string | null;
  city: string;
  main_image: string | null;
  ticket_categories: any[];
}

interface TicketTier {
  id: string;
  name: string;
  price: number;
  description: string | null;
  available_quantity: number;
}

export default function EventCheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;
  const eventId = params?.eventId as string;

  const [organizer, setOrganizer] = useState<Organizer | null>(null);
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Formulaire
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoDiscount, setPromoDiscount] = useState(0);

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (slug && eventId) {
      loadData();
    }
  }, [slug, eventId]);

  async function loadData() {
    try {
      // Charger l'organisateur
      const { data: organizerData, error: organizerError } = await supabase
        .from('event_organizers')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'active')
        .single();

      if (organizerError) throw organizerError;
      if (!organizerData) {
        setError('Organisateur introuvable');
        setLoading(false);
        return;
      }

      console.log('Organizer loaded:', { id: organizerData.id, user_id: organizerData.user_id, slug: organizerData.slug });
      setOrganizer(organizerData);

      // Charger l'événement
      console.log('Loading event:', eventId, 'for organizer user_id:', organizerData.user_id);
      const { data: eventData, error: eventError } = await supabase
        .from('public_events')
        .select('*')
        .eq('id', eventId)
        .eq('organizer_id', organizerData.user_id)
        .single();

      if (eventError) {
        console.error('Event query error:', eventError);
        throw eventError;
      }

      if (!eventData) {
        console.error('No event data found');
        setError('Événement introuvable');
        setLoading(false);
        return;
      }

      console.log('Event loaded:', { id: eventData.id, title: eventData.title, organizer_id: eventData.organizer_id });
      setEvent(eventData);

      // Sélectionner le premier tarif par défaut
      if (eventData.ticket_categories && eventData.ticket_categories.length > 0) {
        setSelectedTier('0'); // Utiliser l'index au lieu d'un ID
      }
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }

  async function applyPromoCode() {
    if (!promoCode.trim() || !organizer || !event) return;

    try {
      const { data, error } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('code', promoCode.toUpperCase())
        .eq('organizer_id', organizer.id)
        .eq('event_id', event.id)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        alert('Code promo invalide ou expiré');
        return;
      }

      // Vérifier la validité
      if (data.valid_until && new Date(data.valid_until) < new Date()) {
        alert('Code promo expiré');
        return;
      }

      // Calculer la réduction
      const selectedTierData = selectedTier !== null ? event.ticket_categories?.[parseInt(selectedTier)] : null;
      if (!selectedTierData) return;

      const subtotal = selectedTierData.price * quantity;

      let discount = 0;
      if (data.discount_type === 'percentage') {
        discount = (subtotal * data.discount_value) / 100;
      } else {
        discount = data.discount_value;
      }

      setPromoDiscount(discount);
      setPromoApplied(true);
      alert(`Code promo appliqué ! Réduction de ${discount.toFixed(2)}€`);
    } catch (err) {
      console.error('Error applying promo:', err);
      alert('Erreur lors de l\'application du code promo');
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!organizer || !event || !selectedTier) return;

    setSubmitting(true);

    try {
      const selectedTierData = selectedTier !== null ? event.ticket_categories?.[parseInt(selectedTier)] : null;
      if (!selectedTierData) {
        alert('Veuillez sélectionner un tarif');
        setSubmitting(false);
        return;
      }

      const unitPrice = selectedTierData.price;
      const subtotal = unitPrice * quantity;
      const serviceFee = subtotal * 0.05; // 5% frais de service
      const discount = promoApplied ? promoDiscount : 0;
      const finalAmount = subtotal + serviceFee - discount;

      // Créer une session de paiement Stripe (qui créera le billet)
      try {
        // Utiliser l'API de démo forcée
        const apiUrl = '/api/tickets/checkout-demo';
        console.log('🎯 Calling DEMO checkout API:', apiUrl);

        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            eventId: event.id,
            organizerId: organizer.id,
            customerEmail: email,
            customerFirstName: firstName,
            customerLastName: lastName,
            customerPhone: phone,
            ticketTierName: selectedTierData.name,
            quantity,
            unitPrice,
            totalPrice: subtotal,
            discountAmount: discount,
            serviceFee,
            finalAmount,
            promoCode: promoApplied ? promoCode : null,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          console.error('API error response:', data);
          throw new Error(data.error || 'Erreur lors de la création de la session de paiement');
        }

        console.log('Checkout response:', data);

        // En mode démo ou avec Stripe, rediriger vers l'URL fournie
        if (data.url) {
          window.location.href = data.url;
        } else {
          throw new Error('Aucune URL de redirection reçue');
        }
      } catch (fetchError: any) {
        console.error('Stripe checkout error:', fetchError);
        throw fetchError;
      }

    } catch (err: any) {
      console.error('Error creating ticket:', err);
      const errorMessage = err?.message || 'Erreur inconnue';
      const errorDetails = err?.details || '';
      const errorHint = err?.hint || '';

      console.error('Full error details:', {
        message: errorMessage,
        details: errorDetails,
        hint: errorHint,
        code: err?.code
      });

      alert(`Erreur lors de la création du billet:\n${errorMessage}\n${errorDetails}\n${errorHint}`);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  if (error || !organizer || !event) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Page introuvable</h1>
          <p className="text-slate-400 mb-6">{error}</p>
          <Button onClick={() => router.push(`/boutique/${slug}`)}>
            Retour à la boutique
          </Button>
        </div>
      </div>
    );
  }

  const brandColor = organizer.brand_color || '#F59E0B';
  const selectedTierData = selectedTier !== null ? event.ticket_categories?.[parseInt(selectedTier)] : null;
  const subtotal = selectedTierData ? selectedTierData.price * quantity : 0;
  const serviceFee = subtotal * 0.05;
  const discount = promoApplied ? promoDiscount : 0;
  const total = subtotal + serviceFee - discount;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header simplifié - pas de navigation distrayante */}
      <header className="py-4 px-4 border-b border-gray-800">
        <div className="container mx-auto max-w-6xl flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => router.push(`/boutique/${slug}`)}
            className="text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>

          {organizer.logo_url && (
            <img
              src={organizer.logo_url}
              alt={organizer.company_name}
              className="h-10 object-contain"
            />
          )}
        </div>
      </header>

      {success && (
        <div className="bg-green-500/10 border-b border-green-500/30 py-4 px-4">
          <div className="container mx-auto max-w-6xl flex items-center gap-3 text-green-400">
            <Check className="w-5 h-5" />
            <span className="font-semibold">Commande en cours de traitement...</span>
          </div>
        </div>
      )}

      <main className="py-8 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Colonne Gauche: Détails de l'événement */}
            <div>
              {/* Image de l'événement */}
              {event.main_image && (
                <div className="relative h-64 md:h-96 rounded-2xl overflow-hidden mb-6 shadow-2xl">
                  <img
                    src={event.main_image}
                    alt={event.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <Card className="bg-gray-900 border-gray-800">
                <CardContent className="p-6">
                  <h1 className="text-3xl font-bold mb-4">{event.title}</h1>

                  <div className="space-y-3 text-sm mb-6">
                    <div className="flex items-center gap-3 text-slate-300">
                      <Calendar className="w-5 h-5" style={{ color: brandColor }} />
                      <span>
                        {new Date(event.event_date).toLocaleDateString('fr-FR', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                        {event.event_time && ` à ${event.event_time.substring(0, 5)}`}
                      </span>
                    </div>
                    {event.venue_name && (
                      <div className="flex items-center gap-3 text-slate-300">
                        <MapPin className="w-5 h-5" style={{ color: brandColor }} />
                        <span>{event.venue_name}, {event.city}</span>
                      </div>
                    )}
                  </div>

                  <p className="text-slate-300 leading-relaxed whitespace-pre-line">
                    {event.full_description}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Colonne Droite: Formulaire d'achat */}
            <div>
              <Card className="bg-gray-900 border-gray-800 sticky top-4">
                <CardContent className="p-6">
                  <h2 className="text-2xl font-bold mb-6">Commander vos billets</h2>

                  <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Sélection du tarif */}
                    <div>
                      <Label className="text-sm font-semibold mb-3 block">
                        Type de billet
                      </Label>
                      <div className="space-y-2">
                        {event.ticket_categories?.map((tier: any, index: number) => {
                          const available = tier.quota - tier.sold;
                          return (
                            <div
                              key={index}
                              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                                selectedTier === index.toString()
                                  ? 'border-amber-500 bg-amber-500/10'
                                  : 'border-gray-700 hover:border-gray-600'
                              }`}
                              onClick={() => setSelectedTier(index.toString())}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="font-semibold">{tier.name}</div>
                                  {tier.description && (
                                    <div className="text-xs text-slate-400">{tier.description}</div>
                                  )}
                                </div>
                                <div className="text-xl font-bold" style={{ color: brandColor }}>
                                  {tier.price.toFixed(2)}€
                                </div>
                              </div>
                              <div className="text-xs text-slate-500 mt-2">
                                {available} places restantes
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Quantité */}
                    <div>
                      <Label htmlFor="quantity">Nombre de billets</Label>
                      <Input
                        id="quantity"
                        type="number"
                        min="1"
                        max="10"
                        value={quantity}
                        onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                        className="bg-black border-gray-700 text-white"
                        required
                      />
                    </div>

                    {/* Informations personnelles */}
                    <div className="pt-4 border-t border-gray-800">
                      <h3 className="font-semibold mb-4">Vos informations</h3>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="firstName">Prénom *</Label>
                          <Input
                            id="firstName"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            className="bg-black border-gray-700 text-white"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="lastName">Nom *</Label>
                          <Input
                            id="lastName"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            className="bg-black border-gray-700 text-white"
                            required
                          />
                        </div>
                      </div>

                      <div className="mt-3">
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="bg-black border-gray-700 text-white"
                          required
                        />
                      </div>

                      <div className="mt-3">
                        <Label htmlFor="phone">Téléphone</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="bg-black border-gray-700 text-white"
                        />
                      </div>
                    </div>

                    {/* Code promo */}
                    <div className="pt-4 border-t border-gray-800">
                      <Label htmlFor="promo">Code promo</Label>
                      <div className="flex gap-2">
                        <Input
                          id="promo"
                          value={promoCode}
                          onChange={(e) => setPromoCode(e.target.value)}
                          placeholder="EARLYBIRD"
                          className="bg-black border-gray-700 text-white"
                          disabled={promoApplied}
                        />
                        <Button
                          type="button"
                          onClick={applyPromoCode}
                          disabled={promoApplied || !promoCode.trim()}
                          variant="outline"
                          className="border-amber-500/50 hover:bg-amber-500/10"
                        >
                          {promoApplied ? 'Appliqué' : 'Appliquer'}
                        </Button>
                      </div>
                    </div>

                    {/* Récapitulatif */}
                    <div className="pt-4 border-t border-gray-800 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Sous-total</span>
                        <span className="font-semibold">{subtotal.toFixed(2)}€</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Frais de service</span>
                        <span className="font-semibold">{serviceFee.toFixed(2)}€</span>
                      </div>
                      {promoApplied && discount > 0 && (
                        <div className="flex justify-between text-sm text-green-400">
                          <span>Réduction</span>
                          <span className="font-semibold">-{discount.toFixed(2)}€</span>
                        </div>
                      )}
                      <div className="flex justify-between text-xl font-bold pt-2 border-t border-gray-700">
                        <span>Total</span>
                        <span style={{ color: brandColor }}>{total.toFixed(2)}€</span>
                      </div>
                    </div>

                    {/* Bouton de soumission */}
                    <Button
                      type="submit"
                      className="w-full h-12 text-lg font-bold text-black"
                      style={{
                        background: `linear-gradient(135deg, ${brandColor} 0%, ${brandColor}dd 100%)`
                      }}
                      disabled={submitting || success}
                    >
                      {submitting ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black mr-2"></div>
                          Traitement...
                        </>
                      ) : success ? (
                        <>
                          <Check className="w-5 h-5 mr-2" />
                          Commande validée
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="w-5 h-5 mr-2" />
                          Passer au paiement
                        </>
                      )}
                    </Button>

                    <p className="text-xs text-center text-slate-500">
                      Paiement sécurisé par Stripe
                    </p>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Footer ALTESS */}
      {organizer.show_altess_branding && (
        <footer className="py-6 border-t border-gray-800 mt-12">
          <div className="container mx-auto px-4 text-center">
            <p className="text-xs text-slate-500">
              Billetterie propulsée par{' '}
              <Link href="/" className="text-amber-400 hover:text-amber-300">
                ALTESS.fr
              </Link>
            </p>
          </div>
        </footer>
      )}
    </div>
  );
}
