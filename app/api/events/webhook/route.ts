import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

export async function POST(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  const body = await req.text();
  const signature = req.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const metadata = session.metadata;

    if (!metadata || !metadata.booking_id) {
      console.error('Missing metadata in session');
      return NextResponse.json({ error: 'Missing metadata' }, { status: 400 });
    }

    try {
      const { data: booking, error: bookingError } = await supabase
        .from('event_bookings')
        .select('*, event:public_events(*, organizer_id)')
        .eq('id', metadata.booking_id)
        .single();

      if (bookingError || !booking) {
        console.error('Booking not found:', bookingError);
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
      }

      await supabase
        .from('event_bookings')
        .update({
          status: 'confirmed',
          payment_status: 'succeeded',
          stripe_payment_intent_id: session.payment_intent as string,
          confirmed_at: new Date().toISOString()
        })
        .eq('id', booking.id);

      const event = booking.event as any;
      const updatedCategories = event.ticket_categories.map((cat: any) => {
        const ticketForCategory = booking.tickets.find((t: any) => t.category === cat.name);
        if (ticketForCategory) {
          return {
            ...cat,
            sold: cat.sold + ticketForCategory.quantity
          };
        }
        return cat;
      });

      await supabase
        .from('public_events')
        .update({
          ticket_categories: updatedCategories,
          tickets_sold: event.tickets_sold + booking.total_tickets
        })
        .eq('id', booking.event_id);

      if (event.organizer_id) {
        await supabase
          .from('event_notifications')
          .insert([{
            event_id: booking.event_id,
            booking_id: booking.id,
            recipient_id: event.organizer_id,
            notification_type: 'new_booking',
            title: 'Nouvelle réservation',
            message: `${booking.customer_name} a réservé ${booking.total_tickets} billet(s) pour ${event.title}. Montant: ${booking.total_amount}€`,
            is_read: false,
            email_sent: false
          }]);
      }

      const qrCodeData = `ALTESS-TICKET-${booking.id}-${booking.booking_reference}`;
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(qrCodeData)}&bgcolor=FFFFFF&color=000000&margin=20`;

      await supabase
        .from('event_bookings')
        .update({ qr_code_data: qrCodeData })
        .eq('id', booking.id);

      let organizerEmail = null;
      let organizerName = null;
      if (event.organizer_id) {
        const { data: organizerProfile } = await supabase
          .from('profiles')
          .select('email, full_name')
          .eq('id', event.organizer_id)
          .single();

        if (organizerProfile) {
          organizerEmail = organizerProfile.email;
          organizerName = organizerProfile.full_name;
        }
      }

      const firstTicket = booking.tickets?.[0] || {};

      try {
        const emailResponse = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-ticket-email`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
            },
            body: JSON.stringify({
              ticketId: booking.booking_reference,
              customerName: booking.customer_name,
              customerEmail: booking.customer_email,
              eventTitle: event.title,
              eventDate: event.event_date,
              eventVenue: event.venue_name || event.venue_address || 'Lieu à confirmer',
              categoryName: firstTicket.category || 'Standard',
              categoryPrice: firstTicket.price || 0,
              quantity: booking.total_tickets,
              totalAmount: parseFloat(booking.total_amount),
              qrCodeUrl: qrCodeUrl,
              eventImage: event.main_image,
              organizerEmail: organizerEmail,
              organizerName: organizerName
            })
          }
        );

        if (!emailResponse.ok) {
          console.error('Failed to send ticket email:', await emailResponse.text());
        } else {
          console.log('Ticket emails sent successfully');
        }
      } catch (emailError) {
        console.error('Error sending ticket email:', emailError);
      }

      console.log('Booking confirmed successfully:', booking.booking_reference);
    } catch (error) {
      console.error('Error processing webhook:', error);
      return NextResponse.json({ error: 'Processing error' }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
