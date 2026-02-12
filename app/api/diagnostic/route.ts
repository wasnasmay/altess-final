import { NextResponse } from 'next/server';
import { isStripeConfigured, STRIPE_CONFIG } from '@/lib/stripe-config';

export async function GET() {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    checks: {
      supabase_url: {
        configured: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        value: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✓ Configuré' : '✗ Manquant',
      },
      supabase_service_key: {
        configured: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        value: process.env.SUPABASE_SERVICE_ROLE_KEY
          ? `✓ Configuré (${process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 10)}...)`
          : '✗ Manquant',
      },
      stripe_secret_key: {
        configured: isStripeConfigured(),
        value: isStripeConfigured()
          ? `✓ Configuré (${STRIPE_CONFIG.secretKey.substring(0, 10)}...)`
          : '✗ Manquant',
        starts_with_sk_test: STRIPE_CONFIG.secretKey?.startsWith('sk_test_') || false,
        starts_with_sk_live: STRIPE_CONFIG.secretKey?.startsWith('sk_live_') || false,
        from_env: !!process.env.STRIPE_SECRET_KEY,
        from_fallback: !process.env.STRIPE_SECRET_KEY && isStripeConfigured(),
      },
      stripe_webhook_secret: {
        configured: !!process.env.STRIPE_WEBHOOK_SECRET,
        value: process.env.STRIPE_WEBHOOK_SECRET
          ? `✓ Configuré (${process.env.STRIPE_WEBHOOK_SECRET.substring(0, 10)}...)`
          : '✗ Manquant (normal en local sans CLI)',
      },
      app_url: {
        configured: !!process.env.NEXT_PUBLIC_APP_URL,
        value: process.env.NEXT_PUBLIC_APP_URL || '✗ Manquant',
      },
    },
    status: 'ok',
  };

  // Déterminer le statut global
  const hasStripeKey = isStripeConfigured();
  const hasSupabase = !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!hasStripeKey || !hasSupabase) {
    diagnostics.status = 'error';
  }

  return NextResponse.json(diagnostics, {
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}
