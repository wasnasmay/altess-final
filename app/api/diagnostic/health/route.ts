import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  const checks = {
    timestamp: new Date().toISOString(),
    supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'OK' : 'MISSING',
    supabase_key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'OK' : 'MISSING',
    tables: {} as Record<string, any>,
    overall_status: 'healthy'
  };

  // Vérifier les tables critiques
  const criticalTables = [
    'advertising_tickers',
    'webtv_ticker_settings',
    'media_library',
    'playout_schedule',
    'radio_stations',
    'profiles'
  ];

  for (const table of criticalTables) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        checks.tables[table] = {
          status: 'ERROR',
          error: error.message
        };
        checks.overall_status = 'unhealthy';
      } else {
        checks.tables[table] = {
          status: 'OK',
          count: count || 0
        };
      }
    } catch (e: any) {
      checks.tables[table] = {
        status: 'EXCEPTION',
        error: e.message
      };
      checks.overall_status = 'unhealthy';
    }
  }

  return NextResponse.json(checks, {
    status: checks.overall_status === 'healthy' ? 200 : 503
  });
}
