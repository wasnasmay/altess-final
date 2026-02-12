import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getStripeKey, isStripeConfigured } from '@/lib/stripe-config';

export async function GET() {
  try {
    // Check if Stripe is configured
    if (!isStripeConfigured()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Stripe n\'est pas configuré',
          details: 'Les clés API Stripe sont manquantes ou invalides',
          configured: false,
        },
        { status: 500 }
      );
    }

    // Get Stripe key
    const secretKey = getStripeKey();

    // Initialize Stripe
    const stripe = new Stripe(secretKey, {
      apiVersion: '2026-01-28.clover',
    });

    // Test connection by retrieving products
    const products = await stripe.products.list({
      limit: 10,
      active: true,
    });

    // Get prices for each product
    const productsWithPrices = await Promise.all(
      products.data.map(async (product) => {
        const prices = await stripe.prices.list({
          product: product.id,
          active: true,
        });

        return {
          id: product.id,
          name: product.name,
          description: product.description,
          active: product.active,
          images: product.images,
          metadata: product.metadata,
          prices: prices.data.map((price) => ({
            id: price.id,
            amount: price.unit_amount,
            currency: price.currency,
            interval: price.recurring?.interval || null,
            type: price.type,
          })),
        };
      })
    );

    return NextResponse.json({
      success: true,
      configured: true,
      products: productsWithPrices,
      totalProducts: products.data.length,
      message: 'Connexion Stripe réussie',
    });
  } catch (error: any) {
    console.error('Stripe connection error:', error);

    return NextResponse.json(
      {
        success: false,
        configured: isStripeConfigured(),
        error: error.message || 'Erreur lors de la connexion à Stripe',
        details: error.stack,
      },
      { status: 500 }
    );
  }
}
