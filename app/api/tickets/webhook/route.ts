import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { getStripeKey, isStripeConfigured, STRIPE_CONFIG } from '@/lib/stripe-config';

export async function POST(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  // Vérifier que Stripe est configuré
  if (!isStripeConfigured()) {
    console.error('STRIPE_SECRET_KEY is not configured');
    return NextResponse.json(
      { error: 'Stripe configuration error' },
      { status: 500 }
    );
  }

  const stripe = new Stripe(getStripeKey(), {
    apiVersion: '2026-01-28.clover',
  });

  const webhookSecret = STRIPE_CONFIG.webhookSecret;
  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return NextResponse.json(
        { error: `Webhook Error: ${err.message}` },
        { status: 400 }
      );
    }

    // Traiter l'événement
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const ticketId = session.metadata?.ticket_id;

        if (!ticketId) {
          console.error('No ticket_id in session metadata');
          break;
        }

        // Mettre à jour le statut du billet
        const { error: updateError } = await supabase
          .from('ticket_purchases')
          .update({
            payment_status: 'paid',
            ticket_status: 'valid',
            stripe_payment_intent: session.payment_intent as string,
            paid_at: new Date().toISOString()
          })
          .eq('id', ticketId);

        if (updateError) {
          console.error('Error updating ticket:', updateError);
          break;
        }

        // Récupérer les infos du billet avec détails financiers
        const { data: ticket, error: ticketError } = await supabase
          .from('ticket_purchases')
          .select(`
            *,
            event:public_events(id, title, organizer_id, tickets_sold, total_quota, event_date, venue_name, main_image),
            organizer:event_organizers(id, company_name, total_revenue, pending_earnings, email)
          `)
          .eq('id', ticketId)
          .single();

        if (ticketError || !ticket) {
          console.error('Error fetching ticket:', ticketError);
          break;
        }

        // Mettre à jour les statistiques de l'événement
        if (ticket.event) {
          await supabase
            .from('public_events')
            .update({
              tickets_sold: (ticket.event.tickets_sold || 0) + ticket.quantity
            })
            .eq('id', ticket.event.id);
        }

        // Mettre à jour les statistiques de l'organisateur (montant net + pending)
        if (ticket.organizer && ticket.organizer_amount) {
          const newPendingEarnings = (ticket.organizer.pending_earnings || 0) + ticket.organizer_amount;
          await supabase
            .from('event_organizers')
            .update({
              pending_earnings: newPendingEarnings
            })
            .eq('id', ticket.organizer.id);
        }

        // Envoyer l'email de confirmation avec le billet et détails financiers
        try {
          const emailResponse = await fetch(
            `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-ticket-email`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
              },
              body: JSON.stringify({
                ticketId: ticket.id,
                customerName: `${ticket.customer_first_name} ${ticket.customer_last_name}`,
                customerEmail: ticket.customer_email,
                eventTitle: ticket.event.title,
                eventDate: ticket.event.event_date,
                eventVenue: ticket.event.venue_name || 'À confirmer',
                categoryName: ticket.ticket_tier_name,
                categoryPrice: ticket.unit_price,
                quantity: ticket.quantity,
                totalAmount: ticket.final_amount,
                qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(ticket.qr_code_data)}`,
                eventImage: ticket.event.main_image || undefined,
                organizerEmail: ticket.organizer.email || undefined,
                organizerName: ticket.organizer.company_name,
                organizerAmount: ticket.organizer_amount || undefined,
                platformCommission: ticket.platform_commission || undefined,
                stripeFees: ticket.stripe_fee || undefined,
              }),
            }
          );

          if (!emailResponse.ok) {
            console.error('Error sending ticket email:', await emailResponse.text());
          } else {
            console.log('Ticket email sent successfully');
          }
        } catch (emailError) {
          console.error('Error calling send-ticket-email function:', emailError);
        }

        console.log('Ticket payment confirmed:', ticketId);

        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;

        // Trouver le billet correspondant
        const { data: ticket } = await supabase
          .from('ticket_purchases')
          .select('id')
          .eq('stripe_payment_intent', paymentIntent.id)
          .single();

        if (ticket) {
          await supabase
            .from('ticket_purchases')
            .update({
              payment_status: 'cancelled',
              ticket_status: 'cancelled'
            })
            .eq('id', ticket.id);
        }

        console.log('Payment failed for:', paymentIntent.id);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: error.message || 'Webhook handler failed' },
      { status: 500 }
    );
  }
}
