'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, ArrowLeft, Mail, Smartphone } from 'lucide-react';
import GoldenTicket from '@/components/GoldenTicket';
import Link from 'next/link';

interface TicketData {
  id: string;
  ticket_number: string;
  qr_code_data: string;
  customer_first_name: string;
  customer_last_name: string;
  customer_email: string;
  ticket_tier_name: string;
  final_amount: number;
  event: {
    id: string;
    title: string;
    event_date: string;
    event_time: string | null;
    venue_name: string;
    city: string;
    custom_slug: string | null;
    main_image: string | null;
  };
  organizer: {
    company_name: string;
    logo_url: string | null;
    slug: string;
  };
}

export default function TicketConfirmationPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;
  const ticketId = params?.ticketId as string;

  const [ticket, setTicket] = useState<TicketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (slug && ticketId) {
      loadTicketWithRetry();
    }
  }, [slug, ticketId]);

  async function loadTicketWithRetry(retryCount = 0) {
    const maxRetries = 10; // Essayer pendant 10 secondes
    const retryDelay = 1000; // 1 seconde entre chaque tentative

    try {
      console.log(`Loading ticket with ID: ${ticketId} (attempt ${retryCount + 1}/${maxRetries})`);

      const { data, error } = await supabase
        .from('ticket_purchases')
        .select(`
          id,
          ticket_number,
          qr_code_data,
          customer_first_name,
          customer_last_name,
          customer_email,
          ticket_tier_name,
          final_amount,
          payment_status,
          event:public_events (
            id,
            title,
            event_date,
            event_time,
            venue_name,
            city,
            custom_slug,
            main_image
          ),
          organizer:event_organizers!ticket_purchases_organizer_id_fkey (
            company_name,
            logo_url,
            slug
          )
        `)
        .eq('id', ticketId)
        .single();

      if (error) {
        console.error('Ticket query error:', error);

        // Si le billet n'existe pas et qu'on a encore des retries, réessayer
        if (retryCount < maxRetries) {
          console.log(`Retrying in ${retryDelay}ms...`);
          setTimeout(() => loadTicketWithRetry(retryCount + 1), retryDelay);
          return;
        }

        throw error;
      }

      if (!data) {
        console.error('No ticket data found');

        // Réessayer si on n'a pas atteint le maximum
        if (retryCount < maxRetries) {
          console.log(`Ticket not found, retrying in ${retryDelay}ms...`);
          setTimeout(() => loadTicketWithRetry(retryCount + 1), retryDelay);
          return;
        }

        setError('Billet introuvable');
        setLoading(false);
        return;
      }

      // Si le billet existe mais est encore en attente de paiement, réessayer
      if (data.payment_status === 'pending' && retryCount < maxRetries) {
        console.log(`Ticket payment still pending, retrying in ${retryDelay}ms...`);
        setTimeout(() => loadTicketWithRetry(retryCount + 1), retryDelay);
        return;
      }

      console.log('Ticket loaded successfully:', data);
      setTicket(data as any);
      setLoading(false);
    } catch (err: any) {
      console.error('Error loading ticket:', err);
      console.error('Full error:', {
        message: err?.message,
        details: err?.details,
        hint: err?.hint,
        code: err?.code
      });

      // Si on a encore des retries, réessayer
      if (retryCount < maxRetries) {
        console.log(`Error occurred, retrying in ${retryDelay}ms...`);
        setTimeout(() => loadTicketWithRetry(retryCount + 1), retryDelay);
        return;
      }

      setError('Erreur lors du chargement du billet');
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Card className="bg-gray-900 border-gray-800 max-w-md">
          <CardContent className="p-8 text-center">
            <h1 className="text-2xl font-bold text-white mb-4">Billet introuvable</h1>
            <p className="text-slate-400 mb-6">{error}</p>
            <Button onClick={() => router.push(`/boutique/${slug}`)}>
              Retour à la boutique
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const customerName = `${ticket.customer_first_name} ${ticket.customer_last_name}`;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="py-4 px-4 border-b border-gray-800">
        <div className="container mx-auto max-w-4xl flex items-center justify-between">
          <Link
            href={`/boutique/${slug}`}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour à la boutique
          </Link>
          {ticket.organizer.logo_url && (
            <img
              src={ticket.organizer.logo_url}
              alt={ticket.organizer.company_name}
              className="h-10 object-contain"
            />
          )}
        </div>
      </header>

      <main className="py-12 px-4">
        <div className="container mx-auto max-w-4xl">
          {/* Message de confirmation */}
          <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/30 mb-8">
            <CardContent className="p-8 text-center">
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h1 className="text-3xl font-bold mb-2">
                Commande confirmée !
              </h1>
              <p className="text-slate-300 text-lg">
                Votre billet doré a été généré avec succès
              </p>
            </CardContent>
          </Card>

          {/* Récapitulatif */}
          <Card className="bg-gray-900 border-gray-800 mb-8">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold mb-4">Récapitulatif de votre commande</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-500 mb-1">Événement</p>
                  <p className="text-white font-semibold">{ticket.event.title}</p>
                </div>
                <div>
                  <p className="text-slate-500 mb-1">Catégorie</p>
                  <p className="text-white font-semibold">{ticket.ticket_tier_name}</p>
                </div>
                <div>
                  <p className="text-slate-500 mb-1">Titulaire</p>
                  <p className="text-white font-semibold">{customerName}</p>
                </div>
                <div>
                  <p className="text-slate-500 mb-1">Montant payé</p>
                  <p
                    className="text-2xl font-bold"
                    style={{
                      background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}
                  >
                    {ticket.final_amount.toFixed(2)}€
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Billet Doré */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-6 text-center">
              Votre{' '}
              <span
                style={{
                  background: 'linear-gradient(135deg, #d97706, #fbbf24)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Billet Doré
              </span>
            </h2>

            <GoldenTicket
              ticketNumber={ticket.ticket_number}
              eventTitle={ticket.event.title}
              eventDate={ticket.event.event_date}
              eventTime={ticket.event.event_time || undefined}
              venueName={ticket.event.venue_name}
              city={ticket.event.city}
              customerName={customerName}
              ticketTier={ticket.ticket_tier_name}
              qrCodeData={ticket.qr_code_data}
              organizerLogo={ticket.organizer.logo_url || undefined}
              organizerName={ticket.organizer.company_name}
              eventSlug={ticket.event.custom_slug || undefined}
              eventImage={ticket.event.main_image || undefined}
            />
          </div>

          {/* Instructions */}
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-6">
              <h3 className="text-lg font-bold mb-4">Prochaines étapes</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-white mb-1">
                      Confirmation par email
                    </p>
                    <p className="text-sm text-slate-400">
                      Un email de confirmation avec votre billet a été envoyé à{' '}
                      <span className="text-amber-400">{ticket.customer_email}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Smartphone className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-white mb-1">
                      Gardez votre billet accessible
                    </p>
                    <p className="text-sm text-slate-400">
                      Téléchargez votre billet doré ou conservez-le dans vos emails.
                      Présentez le QR code à l'entrée de l'événement.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-white mb-1">
                      Le jour de l'événement
                    </p>
                    <p className="text-sm text-slate-400">
                      Arrivez à l'heure et présentez votre billet à l'entrée.
                      Notre équipe scannera votre QR code pour valider votre accès.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
