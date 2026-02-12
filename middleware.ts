import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Headers de sécurité supplémentaires
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Protection CSRF basique
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');

  // Permettre les requêtes du même domaine et des domaines autorisés
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    const allowedOrigins = [
      'https://altess-final.vercel.app',
      'http://localhost:3000',
      process.env.NEXT_PUBLIC_APP_URL,
      process.env.NEXT_PUBLIC_SITE_URL
    ].filter(Boolean);

    if (origin && !allowedOrigins.includes(origin) && origin !== `https://${host}`) {
      // Log mais ne bloque pas pour éviter de casser les webhooks Stripe
      console.warn('CSRF Warning: Origin mismatch', { origin, host });
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/client-dashboard/:path*',
    '/partner-dashboard/:path*',
    '/provider-dashboard/:path*',
    '/organizer-dashboard/:path*',
  ],
};
