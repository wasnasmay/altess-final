import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

function generateBookingReference() {
  return 'BK-' + Math.random().toString(36).substring(2, 10).toUpperCase();
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    // Get the actual base URL from the request
    const protocol = req.headers.get('x-forwarded-proto') || 'http';
    const host = req.headers.get('host') || 'localhost:3000';
    const baseUrl = `${protocol}://${host}`;

    const {
      eventId,
      customerId,
      customerName,
      customerEmail,
      customerPhone,
      tickets,
      totalAmount,
      notes
    } = await req.json();

    if (!eventId || !customerId || !customerName || !customerEmail || !tickets || tickets.length === 0) {
      return NextResponse.json(
        { error: 'Données manquantes' },
        { status: 400 }
      );
    }

    const { data: event, error: eventError } = await supabase
      .from('public_events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        { error: 'Événement non trouvé' },
        { status: 404 }
      );
    }

    const totalTickets = tickets.reduce((sum: number, t: any) => sum + t.quantity, 0);

    if (event.tickets_sold + totalTickets > event.total_quota) {
      return NextResponse.json(
        { error: 'Plus assez de billets disponibles' },
        { status: 400 }
      );
    }

    for (const ticket of tickets) {
      const category = event.ticket_categories.find((c: any) => c.name === ticket.category);
      if (!category) {
        return NextResponse.json(
          { error: `Catégorie ${ticket.category} non trouvée` },
          { status: 400 }
        );
      }
      if (category.sold + ticket.quantity > category.quota) {
        return NextResponse.json(
          { error: `Plus assez de billets ${ticket.category} disponibles` },
          { status: 400 }
        );
      }
    }

    const bookingReference = generateBookingReference();

    const { data: booking, error: bookingError } = await supabase
      .from('event_bookings')
      .insert([{
        event_id: eventId,
        customer_id: customerId,
        customer_email: customerEmail,
        customer_name: customerName,
        customer_phone: customerPhone,
        tickets: tickets,
        total_tickets: totalTickets,
        total_amount: totalAmount,
        booking_reference: bookingReference,
        notes: notes,
        status: 'pending',
        payment_status: 'pending'
      }])
      .select()
      .single();

    if (bookingError) {
      console.error('Booking creation error:', bookingError);
      return NextResponse.json(
        { error: 'Erreur lors de la création de la réservation' },
        { status: 500 }
      );
    }

    const lineItems = tickets.map((ticket: any) => ({
      price_data: {
        currency: 'eur',
        product_data: {
          name: `${event.title} - ${ticket.category}`,
          description: `Événement le ${new Date(event.event_date).toLocaleDateString('fr-FR')}`,
        },
        unit_amount: Math.round(ticket.price * 100),
      },
      quantity: ticket.quantity,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${baseUrl}/rendez-vous/confirmation?booking_ref=${bookingReference}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/rendez-vous/${event.slug}`,
      customer_email: customerEmail,
      metadata: {
        booking_id: booking.id,
        booking_reference: bookingReference,
        event_id: eventId,
        customer_id: customerId,
      },
    });

    await supabase
      .from('event_bookings')
      .update({ stripe_session_id: session.id })
      .eq('id', booking.id);

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors du paiement' },
      { status: 500 }
    );
  }
}
