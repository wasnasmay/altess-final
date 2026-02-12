'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Navigation } from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Calendar, MapPin, Users, Euro, Download, Home } from 'lucide-react';

type Booking = {
  id: string;
  booking_reference: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  tickets: any[];
  total_tickets: number;
  total_amount: number;
  status: string;
  payment_status: string;
  confirmed_at: string;
  event: {
    title: string;
    slug: string;
    event_date: string;
    event_time: string;
    venue_name: string;
    venue_address: string;
    city: string;
    organizer_name: string;
    organizer_contact: string;
  };
};

export default function BookingConfirmationPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const bookingRef = searchParams?.get('booking_ref');
  const sessionId = searchParams?.get('session_id');

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (bookingRef) {
      loadBooking();
    }
  }, [bookingRef]);

  async function loadBooking() {
    try {
      const { data, error } = await supabase
        .from('event_bookings')
        .select(`
          *,
          event:public_events(*)
        `)
        .eq('booking_reference', bookingRef)
        .single();

      if (error) throw error;
      setBooking(data as any);
    } catch (error) {
      console.error('Error loading booking:', error);
    } finally {
      setLoading(false);
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

  if (!booking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
        <Navigation />
        <div className="pt-24 pb-16">
          <div className="container mx-auto px-4">
            <Card className="max-w-2xl mx-auto bg-gradient-to-br from-gray-800/80 to-gray-900/80 border-gray-700 p-12 text-center">
              <h2 className="text-2xl font-bold mb-4">Réservation non trouvée</h2>
              <p className="text-gray-300 mb-6">Impossible de trouver votre réservation.</p>
              <Button onClick={() => router.push('/rendez-vous')} className="bg-gradient-to-r from-amber-500 to-orange-600">
                Retour aux événements
              </Button>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  const event = booking.event;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      <Navigation />

      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <Card className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 border-gray-700 overflow-hidden">
              <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-8 text-center">
                <CheckCircle className="w-20 h-20 mx-auto mb-4 text-white" />
                <h1 className="text-3xl font-bold mb-2">Réservation confirmée !</h1>
                <p className="text-green-100 text-lg">
                  Votre paiement a été traité avec succès
                </p>
              </div>

              <CardContent className="p-8">
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <p className="text-sm text-gray-400">Référence de réservation</p>
                      <p className="text-2xl font-bold text-amber-400 font-mono">
                        {booking.booking_reference}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-amber-500/30"
                      onClick={() => window.print()}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Imprimer
                    </Button>
                  </div>

                  <div className="border-t border-gray-700 pt-6">
                    <h2 className="text-2xl font-bold mb-4">{event.title}</h2>

                    <div className="space-y-3 text-gray-300">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-amber-400" />
                        <span>
                          {new Date(event.event_date).toLocaleDateString('fr-FR', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                          {event.event_time && ` à ${event.event_time}`}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <MapPin className="w-5 h-5 text-amber-400" />
                        <div>
                          <p>{event.venue_name || event.city}</p>
                          {event.venue_address && (
                            <p className="text-sm text-gray-400">{event.venue_address}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Users className="w-5 h-5 text-amber-400" />
                        <span>{booking.total_tickets} billet{booking.total_tickets > 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-700 mt-6 pt-6">
                    <h3 className="font-semibold mb-4">Détails des billets</h3>
                    <div className="space-y-2">
                      {booking.tickets.map((ticket: any, index: number) => (
                        <div key={index} className="flex justify-between items-center bg-gray-900/50 rounded-lg p-3">
                          <div>
                            <p className="font-medium">{ticket.category}</p>
                            <p className="text-sm text-gray-400">Quantité: {ticket.quantity}</p>
                          </div>
                          <p className="font-semibold text-amber-400">
                            {(ticket.price * ticket.quantity).toFixed(2)}€
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-700">
                      <span className="text-xl font-bold">Total payé</span>
                      <span className="text-2xl font-bold text-amber-400">
                        {booking.total_amount.toFixed(2)}€
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-gray-700 mt-6 pt-6">
                    <h3 className="font-semibold mb-3">Informations client</h3>
                    <div className="space-y-1 text-gray-300">
                      <p><span className="text-gray-400">Nom:</span> {booking.customer_name}</p>
                      <p><span className="text-gray-400">Email:</span> {booking.customer_email}</p>
                      {booking.customer_phone && (
                        <p><span className="text-gray-400">Téléphone:</span> {booking.customer_phone}</p>
                      )}
                    </div>
                  </div>

                  {(event.organizer_name || event.organizer_contact) && (
                    <div className="border-t border-gray-700 mt-6 pt-6">
                      <h3 className="font-semibold mb-3">Contact organisateur</h3>
                      <div className="space-y-1 text-gray-300">
                        {event.organizer_name && (
                          <p><span className="text-gray-400">Organisateur:</span> {event.organizer_name}</p>
                        )}
                        {event.organizer_contact && (
                          <p><span className="text-gray-400">Contact:</span> {event.organizer_contact}</p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="mt-8 p-4 bg-blue-950/30 border border-blue-800/50 rounded-lg">
                    <p className="text-sm text-blue-300">
                      <strong>Important:</strong> Un email de confirmation a été envoyé à {booking.customer_email}.
                      Conservez cette référence de réservation: <strong className="text-amber-400">{booking.booking_reference}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button
                    onClick={() => router.push('/rendez-vous')}
                    className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
                  >
                    <Home className="w-4 h-4 mr-2" />
                    Retour aux événements
                  </Button>
                  <Button
                    onClick={() => router.push(`/rendez-vous/${event.slug}`)}
                    variant="outline"
                    className="flex-1 border-amber-500/30"
                  >
                    Voir l'événement
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
