import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

export async function POST(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const stripe = process.env.STRIPE_SECRET_KEY
    ? new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: '2026-01-28.clover',
      })
    : null;

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

  if (!stripe) {
    return NextResponse.json({ error: 'Stripe non configuré' }, { status: 500 });
  }

  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Signature manquante' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: 'Signature invalide' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const ticketId = session.metadata?.ticket_id;

        if (!ticketId) {
          console.error('No ticket_id in session metadata');
          break;
        }

        await supabase
          .from('ticket_purchases')
          .update({
            payment_status: 'completed',
            ticket_status: 'valid',
            stripe_payment_intent: session.payment_intent as string
          })
          .eq('id', ticketId);

        const { data: ticket } = await supabase
          .from('ticket_purchases')
          .select('event_id, quantity')
          .eq('id', ticketId)
          .single();

        if (ticket) {
          await supabase.rpc('increment_tickets_sold', {
            p_event_id: ticket.event_id,
            p_quantity: ticket.quantity
          });
        }

        console.log('Ticket payment confirmed:', ticketId);
        break;
      }

      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session;
        const ticketId = session.metadata?.ticket_id;

        if (ticketId) {
          await supabase
            .from('ticket_purchases')
            .update({
              payment_status: 'failed',
              ticket_status: 'cancelled'
            })
            .eq('id', ticketId);

          console.log('Ticket payment expired:', ticketId);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Erreur lors du traitement du webhook' },
      { status: 500 }
    );
  }
}
