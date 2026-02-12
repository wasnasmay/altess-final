import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { getStripeKey, isStripeConfigured } from '@/lib/stripe-config';

export async function POST(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  // MODE DEMO - FORCE ACTIVÉ pour soutenance
  // Cette valeur est en dur pour éviter les problèmes de variables d'environnement
  const FORCE_DEMO_MODE = true;

  const isDemoMode = FORCE_DEMO_MODE || process.env.DEMO_MODE === 'true' || process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

  console.log('[CHECKOUT] 🎯 FORCE Demo mode:', FORCE_DEMO_MODE, 'Final isDemoMode:', isDemoMode);

  // Si pas en mode demo, vérifier que Stripe est configuré
  if (!isDemoMode && !isStripeConfigured()) {
    console.error('STRIPE_SECRET_KEY is not configured');
    return NextResponse.json(
      { error: 'Stripe n\'est pas configuré. Veuillez contacter l\'administrateur pour activer les paiements.' },
      { status: 500 }
    );
  }

  // Initialiser Stripe seulement si pas en mode demo
  const stripe = isDemoMode ? null : new Stripe(getStripeKey(), {
    apiVersion: '2026-01-28.clover',
  });

  try {
    // Get the actual base URL from the request
    const protocol = req.headers.get('x-forwarded-proto') || 'http';
    const host = req.headers.get('host') || 'localhost:3000';
    const baseUrl = `${protocol}://${host}`;

    const {
      eventId,
      organizerId,
      customerEmail,
      customerFirstName,
      customerLastName,
      customerPhone,
      ticketTierName,
      quantity,
      unitPrice,
      totalPrice,
      discountAmount,
      serviceFee,
      finalAmount,
      promoCode,
    } = await req.json();

    if (!eventId || !organizerId || !customerEmail || !customerFirstName || !customerLastName || !ticketTierName) {
      return NextResponse.json(
        { error: 'Données manquantes' },
        { status: 400 }
      );
    }

    const { data: event, error: eventError } = await supabase
      .from('public_events')
      .select('*, organizer:event_organizers!public_events_organizer_id_fkey(*)')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        { error: 'Événement non trouvé' },
        { status: 404 }
      );
    }

    // Calculer la répartition détaillée des frais avec la fonction de base de données
    const { data: breakdown, error: breakdownError } = await supabase
      .rpc('calculate_ticket_breakdown', {
        p_ticket_price: unitPrice,
        p_quantity: quantity
      });

    if (breakdownError) {
      console.error('Breakdown calculation error:', breakdownError);
      return NextResponse.json(
        { error: 'Erreur lors du calcul des frais' },
        { status: 500 }
      );
    }

    // Générer un numéro de billet unique (temporaire, en attente du paiement)
    const ticketNumber = `ALTESS-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

    // Créer le billet en statut "pending" avec les détails de frais
    const { data: ticketId, error: ticketError } = await supabase
      .rpc('create_ticket_purchase', {
        p_event_id: eventId,
        p_organizer_id: organizerId,
        p_customer_email: customerEmail,
        p_customer_first_name: customerFirstName,
        p_customer_last_name: customerLastName,
        p_customer_phone: customerPhone || null,
        p_ticket_type: 'standard',
        p_ticket_tier_name: ticketTierName,
        p_quantity: quantity,
        p_unit_price: unitPrice,
        p_total_price: breakdown.subtotal,
        p_discount_amount: discountAmount || 0,
        p_service_fee: 0, // Les frais sont maintenant calculés dans breakdown
        p_final_amount: breakdown.subtotal - (discountAmount || 0),
        p_ticket_number: ticketNumber,
        p_qr_code_data: ticketNumber,
        p_payment_status: 'pending',
        p_ticket_status: 'valid',
        p_promo_code_used: promoCode || null,
        p_custom_field_responses: {}
      });

    if (ticketError) {
      console.error('Ticket creation error:', ticketError);
      return NextResponse.json(
        { error: 'Erreur lors de la création du billet' },
        { status: 500 }
      );
    }

    // Mettre à jour le billet avec les détails financiers calculés
    await supabase
      .from('ticket_purchases')
      .update({
        organizer_amount: breakdown.organizer_amount,
        platform_commission: breakdown.platform_commission,
        stripe_fee: breakdown.stripe_fee,
        breakdown_details: breakdown
      })
      .eq('id', ticketId);

    // MODE DEMO - Paiement simulé pour soutenance
    if (isDemoMode) {
      console.log('DEMO MODE: Simulating successful payment for ticket:', ticketId);

      // Marquer le billet comme payé
      await supabase
        .from('ticket_purchases')
        .update({
          payment_status: 'completed',
          stripe_session_id: `demo_session_${ticketId}`,
          stripe_payment_intent: `demo_pi_${ticketId}`
        })
        .eq('id', ticketId);

      // Retourner l'URL de confirmation directement
      const confirmationUrl = `${baseUrl}/boutique/${event.organizer.slug}/confirmation/${ticketId}?demo=true`;
      return NextResponse.json({ url: confirmationUrl, ticketId, demoMode: true });
    }

    console.log('Creating Stripe session with base URL:', baseUrl);

    // Créer une session Stripe Checkout
    const session = await stripe!.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `${event.title} - ${ticketTierName}`,
              description: `Billet Doré pour ${event.title}`,
              images: event.main_image ? [event.main_image] : undefined,
            },
            unit_amount: Math.round(finalAmount * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${baseUrl}/boutique/${event.organizer.slug}/confirmation/${ticketId}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/boutique/${event.organizer.slug}/event/${eventId}`,
      customer_email: customerEmail,
      metadata: {
        ticket_id: ticketId,
        event_id: eventId,
        organizer_id: organizerId,
        ticket_number: ticketNumber,
      },
    });

    // Mettre à jour le billet avec le stripe_session_id
    await supabase
      .from('ticket_purchases')
      .update({
        stripe_session_id: session.id,
        stripe_payment_intent: session.payment_intent as string || null
      })
      .eq('id', ticketId);

    return NextResponse.json({ url: session.url, ticketId });
  } catch (error: any) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors du paiement' },
      { status: 500 }
    );
  }
}
