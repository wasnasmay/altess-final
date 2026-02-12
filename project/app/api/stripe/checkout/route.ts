import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  try {
    // Initialiser Stripe
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2026-01-28.clover',
    });

    // Initialiser Supabase avec la clé service (pour l'API)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Prix IDs pour chaque plan
    const PRICE_IDS = {
      pro: process.env.STRIPE_PRICE_ID_PRO || 'price_1StajJGRPF89i7tPwyrWED71',
      premium: process.env.STRIPE_PRICE_ID_PREMIUM || '',
    };
    // Get the actual base URL from the request
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const host = request.headers.get('host') || 'localhost:3000';
    const baseUrl = `${protocol}://${host}`;

    const body = await request.json();
    const { planType, userId } = body;

    // Validation
    if (!planType || !userId) {
      return NextResponse.json(
        { error: 'Plan type and user ID are required' },
        { status: 400 }
      );
    }

    if (!['pro', 'premium'].includes(planType)) {
      return NextResponse.json(
        { error: 'Invalid plan type' },
        { status: 400 }
      );
    }

    // Récupérer les informations du prestataire
    const { data: provider, error: providerError } = await supabase
      .from('event_providers')
      .select('id, provider_id, company_name, stripe_customer_id')
      .eq('provider_id', userId)
      .maybeSingle();

    if (providerError || !provider) {
      return NextResponse.json(
        { error: 'Provider not found' },
        { status: 404 }
      );
    }

    // Récupérer l'email de l'utilisateur
    const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(userId);

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    let customerId = provider.stripe_customer_id;

    // Créer un customer Stripe si nécessaire
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: userId,
          provider_id: provider.id,
          company_name: provider.company_name,
        },
      });

      customerId = customer.id;

      // Mettre à jour la base de données avec le customer ID
      await supabase
        .from('event_providers')
        .update({ stripe_customer_id: customerId })
        .eq('id', provider.id);
    }

    // Créer la session de checkout
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: PRICE_IDS[planType as 'pro' | 'premium'],
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/settings/subscription?session_id={CHECKOUT_SESSION_ID}&success=true`,
      cancel_url: `${baseUrl}/settings/subscription?canceled=true`,
      metadata: {
        supabase_user_id: userId,
        provider_id: provider.id,
        plan_type: planType,
      },
      subscription_data: {
        metadata: {
          supabase_user_id: userId,
          provider_id: provider.id,
          plan_type: planType,
        },
      },
      allow_promotion_codes: true,
      billing_address_collection: 'required',
    });

    return NextResponse.json({
      url: session.url,
      sessionId: session.id
    });

  } catch (error: any) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
