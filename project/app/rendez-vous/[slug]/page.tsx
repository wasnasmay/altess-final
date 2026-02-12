'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Navigation } from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Calendar, MapPin, Clock, Users, Euro, Plus, Minus, ShoppingCart,
  AlertCircle, Info, Sparkles, Ticket
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

type TicketCategory = {
  name: string;
  price: number;
  quota: number;
  sold: number;
};

type Event = {
  id: string;
  title: string;
  slug: string;
  event_type: string;
  short_description: string;
  full_description: string;
  event_date: string;
  event_time: string;
  venue_name: string;
  venue_address: string;
  city: string;
  main_image: string;
  ticket_categories: TicketCategory[];
  total_quota: number;
  tickets_sold: number;
  cancellation_policy: string;
  min_tickets_per_order: number;
  max_tickets_per_order: number;
  organizer_name: string;
  organizer_contact: string;
  is_free: boolean;
};

type CartItem = {
  category: string;
  quantity: number;
  price: number;
};

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const slug = params?.slug as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (slug) {
      loadEvent();
    }
  }, [slug]);

  useEffect(() => {
    if (user) {
      loadUserProfile();
    }
  }, [user]);

  async function loadUserProfile() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, email, phone')
        .eq('id', user?.id)
        .maybeSingle();

      if (data) {
        setCustomerName(data.full_name || '');
        setCustomerEmail(data.email || user?.email || '');
        setCustomerPhone(data.phone || '');
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  }

  async function loadEvent() {
    try {
      const { data, error } = await supabase
        .from('public_events')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        toast.error('Événement non trouvé');
        router.push('/rendez-vous');
        return;
      }

      setEvent(data);
    } catch (error) {
      console.error('Error loading event:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }

  function updateCart(categoryName: string, delta: number) {
    const newQuantity = (cart[categoryName] || 0) + delta;
    if (newQuantity < 0) return;

    const category = event?.ticket_categories.find(c => c.name === categoryName);
    if (!category) return;

    const available = category.quota - category.sold;
    if (newQuantity > available) {
      toast.error(`Plus que ${available} billets disponibles pour ${categoryName}`);
      return;
    }

    const newCart = { ...cart };
    if (newQuantity === 0) {
      delete newCart[categoryName];
    } else {
      newCart[categoryName] = newQuantity;
    }

    setCart(newCart);
  }

  function getTotalTickets() {
    return Object.values(cart).reduce((sum, qty) => sum + qty, 0);
  }

  function getTotalAmount() {
    if (!event) return 0;
    return Object.entries(cart).reduce((sum, [categoryName, qty]) => {
      const category = event.ticket_categories.find(c => c.name === categoryName);
      return sum + (category ? category.price * qty : 0);
    }, 0);
  }

  async function handleCheckout() {
    if (!user) {
      toast.error('Veuillez vous connecter pour réserver');
      router.push('/login');
      return;
    }

    if (!event) return;

    const totalTickets = getTotalTickets();
    if (totalTickets < event.min_tickets_per_order) {
      toast.error(`Minimum ${event.min_tickets_per_order} billets requis`);
      return;
    }
    if (totalTickets > event.max_tickets_per_order) {
      toast.error(`Maximum ${event.max_tickets_per_order} billets autorisés`);
      return;
    }

    if (!customerName || !customerEmail) {
      toast.error('Veuillez remplir vos coordonnées');
      return;
    }

    setProcessing(true);

    try {
      const tickets = Object.entries(cart).map(([categoryName, quantity]) => {
        const category = event.ticket_categories.find(c => c.name === categoryName);
        return {
          category: categoryName,
          quantity,
          price: category?.price || 0
        };
      });

      const response = await fetch('/api/events/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: event.id,
          customerId: user.id,
          customerName,
          customerEmail,
          customerPhone,
          tickets,
          totalAmount: getTotalAmount(),
          notes
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors du paiement');
      }

      window.location.href = data.url;
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast.error(error.message || 'Erreur lors du paiement');
      setProcessing(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
        <Navigation />
        <div className="pt-24 pb-16 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
        </div>
      </div>
    );
  }

  if (!event) {
    return null;
  }

  const totalTickets = getTotalTickets();
  const totalAmount = getTotalAmount();
  const availableTickets = event.total_quota - event.tickets_sold;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      <Navigation />

      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                {event.main_image && (
                  <div className="relative h-96 rounded-xl overflow-hidden mb-6">
                    <img
                      src={event.main_image}
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-4 left-4">
                      <Badge className="bg-gradient-to-r from-amber-500 to-orange-600 text-black font-semibold">
                        {event.event_type}
                      </Badge>
                    </div>
                  </div>
                )}

                <div className="mb-6">
                  <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-600 text-transparent bg-clip-text">
                    {event.title}
                  </h1>

                  <div className="flex flex-wrap gap-4 text-gray-300 mb-6">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-amber-400" />
                      <span>{new Date(event.event_date).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>
                    {event.event_time && (
                      <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-amber-400" />
                        <span>{event.event_time}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-amber-400" />
                      <span>{event.venue_name || event.city}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-amber-400" />
                      <span>{availableTickets} places restantes</span>
                    </div>
                  </div>

                  <p className="text-lg text-gray-300 leading-relaxed mb-6">
                    {event.short_description}
                  </p>

                  {event.full_description && (
                    <div className="prose prose-invert max-w-none">
                      <p className="text-gray-400">{event.full_description}</p>
                    </div>
                  )}
                </div>

                {event.cancellation_policy && (
                  <Card className="bg-blue-950/30 border-blue-800/50 mb-6">
                    <CardContent className="pt-6">
                      <h3 className="font-semibold mb-2 flex items-center gap-2 text-blue-300">
                        <Info className="w-5 h-5" />
                        Politique d'annulation
                      </h3>
                      <p className="text-sm text-gray-300">{event.cancellation_policy}</p>
                    </CardContent>
                  </Card>
                )}
              </div>

              <div className="lg:col-span-1">
                <Card className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 border-gray-700 sticky top-24">
                  <CardContent className="pt-6">
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                      <Ticket className="w-6 h-6 text-amber-400" />
                      Réserver vos billets
                    </h2>

                    <div className="space-y-4 mb-6">
                      {event.ticket_categories.map((category) => {
                        const available = category.quota - category.sold;
                        const inCart = cart[category.name] || 0;

                        return (
                          <div key={category.name} className="bg-gray-900/50 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <p className="font-semibold text-white">{category.name}</p>
                                <p className="text-sm text-gray-400">{category.price}€</p>
                                <p className="text-xs text-gray-500">{available} restants</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8 border-amber-500/30 hover:bg-amber-500/10"
                                  onClick={() => updateCart(category.name, -1)}
                                  disabled={inCart === 0}
                                >
                                  <Minus className="w-4 h-4" />
                                </Button>
                                <span className="w-8 text-center font-semibold">{inCart}</span>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8 border-amber-500/30 hover:bg-amber-500/10"
                                  onClick={() => updateCart(category.name, 1)}
                                  disabled={available === 0}
                                >
                                  <Plus className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {totalTickets > 0 && (
                      <>
                        <div className="border-t border-gray-700 pt-4 mb-4">
                          <div className="flex justify-between text-lg font-semibold mb-2">
                            <span>Total billets:</span>
                            <span className="text-amber-400">{totalTickets}</span>
                          </div>
                          <div className="flex justify-between text-2xl font-bold">
                            <span>Montant total:</span>
                            <span className="text-amber-400">{totalAmount.toFixed(2)}€</span>
                          </div>
                        </div>

                        <div className="space-y-3 mb-4">
                          <div>
                            <Label className="text-gray-300">Nom complet *</Label>
                            <Input
                              value={customerName}
                              onChange={(e) => setCustomerName(e.target.value)}
                              className="bg-gray-900/50 border-gray-700"
                              required
                            />
                          </div>
                          <div>
                            <Label className="text-gray-300">Email *</Label>
                            <Input
                              type="email"
                              value={customerEmail}
                              onChange={(e) => setCustomerEmail(e.target.value)}
                              className="bg-gray-900/50 border-gray-700"
                              required
                            />
                          </div>
                          <div>
                            <Label className="text-gray-300">Téléphone</Label>
                            <Input
                              type="tel"
                              value={customerPhone}
                              onChange={(e) => setCustomerPhone(e.target.value)}
                              className="bg-gray-900/50 border-gray-700"
                            />
                          </div>
                          <div>
                            <Label className="text-gray-300">Notes (optionnel)</Label>
                            <Textarea
                              value={notes}
                              onChange={(e) => setNotes(e.target.value)}
                              className="bg-gray-900/50 border-gray-700"
                              rows={2}
                              placeholder="Informations complémentaires..."
                            />
                          </div>
                        </div>

                        <Button
                          onClick={handleCheckout}
                          disabled={processing || !customerName || !customerEmail}
                          className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-black font-bold py-6 text-lg"
                        >
                          {processing ? (
                            <span className="flex items-center gap-2">
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black"></div>
                              Traitement...
                            </span>
                          ) : (
                            <span className="flex items-center gap-2">
                              <ShoppingCart className="w-5 h-5" />
                              Procéder au paiement
                            </span>
                          )}
                        </Button>

                        {(totalTickets < event.min_tickets_per_order || totalTickets > event.max_tickets_per_order) && (
                          <div className="mt-3 flex items-start gap-2 text-xs text-amber-400">
                            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            <span>
                              {totalTickets < event.min_tickets_per_order
                                ? `Minimum ${event.min_tickets_per_order} billets requis`
                                : `Maximum ${event.max_tickets_per_order} billets autorisés`}
                            </span>
                          </div>
                        )}
                      </>
                    )}

                    {totalTickets === 0 && (
                      <div className="text-center text-gray-400 py-8">
                        <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>Sélectionnez vos billets pour continuer</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
