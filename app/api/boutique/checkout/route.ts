import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

function generateTicketNumber() {
  return `ALTESS-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const stripe = process.env.STRIPE_SECRET_KEY
      ? new Stripe(process.env.STRIPE_SECRET_KEY, {
          apiVersion: '2026-01-28.clover',
        })
      : null;
    // Get the actual base URL from the request
    const protocol = req.headers.get('x-forwarded-proto') || 'http';
    const host = req.headers.get('host') || 'localhost:3000';
    const baseUrl = `${protocol}://${host}`;

    const {
      eventId,
      organizerId,
      organizerSlug,
      firstName,
      lastName,
      email,
      phone,
      ticketTierName,
      quantity,
      unitPrice,
      subtotal,
      serviceFee,
      discount,
      finalAmount,
      promoCode
    } = await req.json();

    if (!eventId || !organizerId || !firstName || !lastName || !email || !ticketTierName || !quantity) {
      return NextResponse.json(
        { error: 'Données manquantes' },
        { status: 400 }
      );
    }

    const { data: event, error: eventError } = await supabase
      .from('public_events')
      .select('id, title, event_date, custom_slug')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        { error: 'Événement non trouvé' },
        { status: 404 }
      );
    }

    const ticketNumber = generateTicketNumber();

    const pendingTicket = {
      event_id: eventId,
      organizer_id: organizerId,
      customer_email: email,
      customer_first_name: firstName,
      customer_last_name: lastName,
      customer_phone: phone || null,
      ticket_type: 'standard',
      ticket_tier_name: ticketTierName,
      quantity: quantity,
      unit_price: unitPrice,
      total_price: subtotal,
      discount_amount: discount || 0,
      service_fee: serviceFee,
      final_amount: finalAmount,
      ticket_number: ticketNumber,
      qr_code_data: ticketNumber,
      payment_status: 'pending',
      ticket_status: 'pending',
      promo_code: promoCode || null
    };

    const { data: ticket, error: ticketError } = await supabase
      .from('ticket_purchases')
      .insert(pendingTicket)
      .select()
      .single();

    if (ticketError) {
      console.error('Ticket creation error:', ticketError);
      return NextResponse.json(
        { error: 'Erreur lors de la création du billet' },
        { status: 500 }
      );
    }

    if (!stripe) {
      await supabase
        .from('ticket_purchases')
        .update({
          payment_status: 'completed',
          ticket_status: 'valid'
        })
        .eq('id', ticket.id);

      return NextResponse.json({
        success: true,
        ticketId: ticket.id,
        mode: 'test',
        redirect: `/boutique/${organizerSlug}/confirmation/${ticket.id}`
      });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `${event.title} - ${ticketTierName}`,
              description: `Événement le ${new Date(event.event_date).toLocaleDateString('fr-FR')}`,
              images: []
            },
            unit_amount: Math.round(finalAmount * 100),
          },
          quantity: 1,
        }
      ],
      mode: 'payment',
      success_url: `${baseUrl}/boutique/${organizerSlug}/confirmation/${ticket.id}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/boutique/${organizerSlug}/event/${eventId}`,
      customer_email: email,
      metadata: {
        ticket_id: ticket.id,
        event_id: eventId,
        organizer_id: organizerId,
        ticket_number: ticketNumber
      }
    });

    await supabase
      .from('ticket_purchases')
      .update({ stripe_session_id: session.id })
      .eq('id', ticket.id);

    return NextResponse.json({
      success: true,
      url: session.url,
      ticketId: ticket.id,
      mode: 'stripe'
    });
  } catch (error: any) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors du paiement' },
      { status: 500 }
    );
  }
}
