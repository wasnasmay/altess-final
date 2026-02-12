import { NextRequest, NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { getStripeKey, isStripeConfigured, STRIPE_CONFIG } from '@/lib/stripe-config';

export async function POST(req: NextRequest) {
  console.log('[WEBHOOK] Received Stripe webhook request');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  if (!isStripeConfigured()) {
    console.error('[WEBHOOK] STRIPE_SECRET_KEY is not configured');
    return NextResponse.json(
      { error: 'Stripe configuration error' },
      { status: 500 }
    );
  }

  const stripe = new Stripe(getStripeKey(), {
    apiVersion: '2026-01-28.clover',
  });

  const webhookSecret = STRIPE_CONFIG.webhookSecret;

  if (!webhookSecret) {
    console.error('[WEBHOOK] STRIPE_WEBHOOK_SECRET is not configured');
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    );
  }

  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      console.error('[WEBHOOK] Missing stripe-signature header');
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      console.log('[WEBHOOK] Signature verified successfully');
    } catch (err: any) {
      console.error('[WEBHOOK] Signature verification failed:', err.message);
      return NextResponse.json(
        { error: `Webhook Error: ${err.message}` },
        { status: 400 }
      );
    }

    console.log('[WEBHOOK] Event type:', event.type);

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(supabase, event.data.object as Stripe.Checkout.Session);
        break;

      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(supabase, event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(supabase, event.data.object as Stripe.PaymentIntent);
        break;

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(supabase, event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(supabase, event.data.object as Stripe.Invoice);
        break;

      case 'customer.subscription.created':
        await handleSubscriptionCreated(supabase, event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(supabase, event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(supabase, event.data.object as Stripe.Subscription);
        break;

      default:
        console.log('[WEBHOOK] Unhandled event type:', event.type);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('[WEBHOOK] Handler error:', error);
    return NextResponse.json(
      { error: error.message || 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handleCheckoutSessionCompleted(supabase: SupabaseClient, session: Stripe.Checkout.Session) {
  console.log('[WEBHOOK] Processing checkout.session.completed:', session.id);

  const metadata = session.metadata || {};
  const paymentType = metadata.payment_type;

  switch (paymentType) {
    case 'ticket':
      await handleTicketPurchase(supabase, session);
      break;

    case 'product':
      await handleProductPurchase(supabase, session);
      break;

    case 'subscription':
      await handleSubscriptionPurchase(supabase, session);
      break;

    default:
      console.log('[WEBHOOK] Unknown payment type:', paymentType);
      await handleTicketPurchase(supabase, session);
  }
}

async function handleTicketPurchase(supabase: SupabaseClient, session: Stripe.Checkout.Session) {
  const ticketId = session.metadata?.ticket_id;

  if (!ticketId) {
    console.error('[WEBHOOK] No ticket_id in session metadata');
    return;
  }

  console.log('[WEBHOOK] Processing ticket purchase:', ticketId);

  const { error: updateError } = await supabase
    .from('ticket_purchases')
    .update({
      payment_status: 'completed',
      ticket_status: 'valid',
      stripe_session_id: session.id,
      stripe_payment_intent: session.payment_intent as string,
      paid_at: new Date().toISOString()
    })
    .eq('id', ticketId);

  if (updateError) {
    console.error('[WEBHOOK] Error updating ticket:', updateError);
    return;
  }

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
    console.error('[WEBHOOK] Error fetching ticket:', ticketError);
    return;
  }

  if (ticket.event) {
    await supabase
      .from('public_events')
      .update({
        tickets_sold: (ticket.event.tickets_sold || 0) + ticket.quantity
      })
      .eq('id', ticket.event.id);
  }

  if (ticket.organizer && ticket.organizer_amount) {
    const newPendingEarnings = (ticket.organizer.pending_earnings || 0) + ticket.organizer_amount;
    await supabase
      .from('event_organizers')
      .update({
        pending_earnings: newPendingEarnings
      })
      .eq('id', ticket.organizer.id);
  }

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
      console.error('[WEBHOOK] Error sending ticket email:', await emailResponse.text());
    } else {
      console.log('[WEBHOOK] Ticket email sent successfully');
    }
  } catch (emailError) {
    console.error('[WEBHOOK] Error calling send-ticket-email function:', emailError);
  }

  console.log('[WEBHOOK] Ticket payment confirmed:', ticketId);
}

async function handleProductPurchase(supabase: SupabaseClient, session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.order_id;

  if (!orderId) {
    console.error('[WEBHOOK] No order_id in session metadata');
    return;
  }

  console.log('[WEBHOOK] Processing product purchase:', orderId);

  const { error: updateError } = await supabase
    .from('orders')
    .update({
      payment_status: 'paid',
      stripe_payment_intent: session.payment_intent as string,
      paid_at: new Date().toISOString()
    })
    .eq('id', orderId);

  if (updateError) {
    console.error('[WEBHOOK] Error updating order:', updateError);
    return;
  }

  console.log('[WEBHOOK] Product order confirmed:', orderId);
}

async function handleSubscriptionPurchase(supabase: SupabaseClient, session: Stripe.Checkout.Session) {
  const userId = session.metadata?.user_id;
  const subscriptionId = session.subscription as string;

  if (!userId || !subscriptionId) {
    console.error('[WEBHOOK] Missing user_id or subscription_id in metadata');
    return;
  }

  console.log('[WEBHOOK] Processing subscription purchase:', subscriptionId);

  const { error: updateError } = await supabase
    .from('provider_subscriptions')
    .update({
      stripe_subscription_id: subscriptionId,
      status: 'active',
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    })
    .eq('provider_id', userId);

  if (updateError) {
    console.error('[WEBHOOK] Error updating subscription:', updateError);
  }

  console.log('[WEBHOOK] Subscription activated:', subscriptionId);
}

async function handlePaymentIntentSucceeded(supabase: SupabaseClient, paymentIntent: Stripe.PaymentIntent) {
  console.log('[WEBHOOK] Payment succeeded:', paymentIntent.id);
}

async function handlePaymentIntentFailed(supabase: SupabaseClient, paymentIntent: Stripe.PaymentIntent) {
  console.log('[WEBHOOK] Payment failed:', paymentIntent.id);

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

    console.log('[WEBHOOK] Ticket cancelled due to payment failure:', ticket.id);
  }
}

async function handleInvoicePaymentSucceeded(supabase: SupabaseClient, invoice: Stripe.Invoice) {
  console.log('[WEBHOOK] Invoice payment succeeded:', invoice.id);

  const invoiceAny = invoice as any;
  const subscriptionId = typeof invoiceAny.subscription === 'string'
    ? invoiceAny.subscription
    : invoiceAny.subscription?.id;

  if (subscriptionId) {
    const { error } = await supabase
      .from('provider_subscriptions')
      .update({
        status: 'active',
        last_payment_date: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscriptionId);

    if (error) {
      console.error('[WEBHOOK] Error updating subscription after invoice payment:', error);
    }
  }
}

async function handleInvoicePaymentFailed(supabase: SupabaseClient, invoice: Stripe.Invoice) {
  console.log('[WEBHOOK] Invoice payment failed:', invoice.id);

  const invoiceAny = invoice as any;
  const subscriptionId = typeof invoiceAny.subscription === 'string'
    ? invoiceAny.subscription
    : invoiceAny.subscription?.id;

  if (subscriptionId) {
    const { error } = await supabase
      .from('provider_subscriptions')
      .update({
        status: 'past_due'
      })
      .eq('stripe_subscription_id', subscriptionId);

    if (error) {
      console.error('[WEBHOOK] Error updating subscription after invoice failure:', error);
    }
  }
}

async function handleSubscriptionCreated(supabase: SupabaseClient, subscription: Stripe.Subscription) {
  console.log('[WEBHOOK] Subscription created:', subscription.id);
}

async function handleSubscriptionUpdated(supabase: SupabaseClient, subscription: Stripe.Subscription) {
  console.log('[WEBHOOK] Subscription updated:', subscription.id);

  const periodStart = (subscription as any).current_period_start;
  const periodEnd = (subscription as any).current_period_end;

  const updateData: any = {
    status: subscription.status,
  };

  if (periodStart) {
    updateData.current_period_start = new Date(periodStart * 1000).toISOString();
  }

  if (periodEnd) {
    updateData.current_period_end = new Date(periodEnd * 1000).toISOString();
  }

  const { error } = await supabase
    .from('provider_subscriptions')
    .update(updateData)
    .eq('stripe_subscription_id', subscription.id);

  if (error) {
    console.error('[WEBHOOK] Error updating subscription:', error);
  }
}

async function handleSubscriptionDeleted(supabase: SupabaseClient, subscription: Stripe.Subscription) {
  console.log('[WEBHOOK] Subscription deleted:', subscription.id);

  const { error } = await supabase
    .from('provider_subscriptions')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString()
    })
    .eq('stripe_subscription_id', subscription.id);

  if (error) {
    console.error('[WEBHOOK] Error cancelling subscription:', error);
  }
}
