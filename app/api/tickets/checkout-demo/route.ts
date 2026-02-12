import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  console.log('[CHECKOUT-DEMO] 🎯 Mode démo forcé - Pas de Stripe');

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
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

    console.log('[CHECKOUT-DEMO] Données reçues:', { eventId, organizerId, customerEmail });

    if (!eventId || !organizerId || !customerEmail || !customerFirstName || !customerLastName || !ticketTierName) {
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
      console.error('[CHECKOUT-DEMO] Événement non trouvé:', eventError);
      return NextResponse.json(
        { error: 'Événement non trouvé' },
        { status: 404 }
      );
    }

    console.log('[CHECKOUT-DEMO] Événement trouvé:', event.title);

    // Récupérer l'organisateur séparément
    const { data: organizer, error: organizerError } = await supabase
      .from('event_organizers')
      .select('*')
      .eq('user_id', event.organizer_id)
      .single();

    if (organizerError || !organizer) {
      console.error('[CHECKOUT-DEMO] Organisateur non trouvé:', organizerError);
      return NextResponse.json(
        { error: 'Organisateur non trouvé' },
        { status: 404 }
      );
    }

    console.log('[CHECKOUT-DEMO] Organisateur trouvé:', organizer.company_name);

    // Calculer la répartition des frais
    const { data: breakdown, error: breakdownError } = await supabase
      .rpc('calculate_ticket_breakdown', {
        p_ticket_price: unitPrice,
        p_quantity: quantity
      });

    if (breakdownError) {
      console.error('[CHECKOUT-DEMO] Erreur calcul:', breakdownError);
      return NextResponse.json(
        { error: 'Erreur lors du calcul des frais' },
        { status: 500 }
      );
    }

    console.log('[CHECKOUT-DEMO] Calcul effectué:', breakdown);

    // Générer un numéro de billet unique
    const ticketNumber = `ALTESS-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

    console.log('[CHECKOUT-DEMO] Création du billet...');

    // Créer le billet
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
        p_service_fee: 0,
        p_final_amount: breakdown.subtotal - (discountAmount || 0),
        p_ticket_number: ticketNumber,
        p_qr_code_data: ticketNumber,
        p_payment_status: 'pending',
        p_ticket_status: 'valid',
        p_promo_code_used: promoCode || null,
        p_custom_field_responses: {}
      });

    if (ticketError) {
      console.error('[CHECKOUT-DEMO] Erreur création billet:', ticketError);
      return NextResponse.json(
        { error: 'Erreur lors de la création du billet' },
        { status: 500 }
      );
    }

    console.log('[CHECKOUT-DEMO] Billet créé avec ID:', ticketId);

    // Mettre à jour avec les détails financiers
    await supabase
      .from('ticket_purchases')
      .update({
        organizer_amount: breakdown.organizer_amount,
        platform_commission: breakdown.platform_commission,
        stripe_fee: breakdown.stripe_fee,
        breakdown_details: breakdown
      })
      .eq('id', ticketId);

    console.log('[CHECKOUT-DEMO] 🎭 MODE DÉMO - Simulation de paiement réussi');

    // Marquer le billet comme payé (MODE DÉMO)
    await supabase
      .from('ticket_purchases')
      .update({
        payment_status: 'completed',
        stripe_session_id: `demo_session_${ticketId}`,
        stripe_payment_intent: `demo_pi_${ticketId}`
      })
      .eq('id', ticketId);

    console.log('[CHECKOUT-DEMO] Billet marqué comme payé');

    // Retourner l'URL de confirmation
    const confirmationUrl = `${baseUrl}/boutique/${organizer.slug}/confirmation/${ticketId}?demo=true`;

    console.log('[CHECKOUT-DEMO] ✅ Succès! Redirection vers:', confirmationUrl);

    return NextResponse.json({
      url: confirmationUrl,
      ticketId,
      demoMode: true,
      success: true
    });

  } catch (error: any) {
    console.error('[CHECKOUT-DEMO] ❌ Erreur globale:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors du paiement' },
      { status: 500 }
    );
  }
}
