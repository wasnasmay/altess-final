import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2026-01-28.clover',
    });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    // Get the actual base URL from the request
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const host = request.headers.get('host') || 'localhost:3000';
    const baseUrl = `${protocol}://${host}`;

    const body = await request.json();
    const { priceId, userId, itemName, itemType, itemId, amount } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (!priceId && !amount) {
      return NextResponse.json(
        { error: 'Either priceId or amount is required' },
        { status: 400 }
      );
    }

    const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(userId);

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1,
    });

    let customerId: string;

    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: userId,
        },
      });
      customerId = customer.id;
    }

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

    if (priceId) {
      lineItems.push({
        price: priceId,
        quantity: 1,
      });
    } else if (amount) {
      lineItems.push({
        price_data: {
          currency: 'eur',
          product_data: {
            name: itemName || 'Achat Académie',
            description: itemType === 'course' ? 'Cours' : itemType === 'pack' ? 'Pack de formation' : 'Achat',
          },
          unit_amount: Math.round(amount * 100),
        },
        quantity: 1,
      });
    }

    const metadata: Record<string, string> = {
      supabase_user_id: userId,
      payment_type: 'one_time',
    };

    if (itemType) metadata.item_type = itemType;
    if (itemId) metadata.item_id = itemId;
    if (itemName) metadata.item_name = itemName;

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: lineItems,
      success_url: `${baseUrl}/academy?session_id={CHECKOUT_SESSION_ID}&success=true`,
      cancel_url: `${baseUrl}/academy?canceled=true`,
      metadata,
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
    });

    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
    });

  } catch (error: any) {
    console.error('Stripe checkout one-time error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
