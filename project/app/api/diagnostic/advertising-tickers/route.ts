import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    tests: [] as any[],
    status: 'unknown'
  };

  try {
    // Test 1: Connexion Supabase
    diagnostics.tests.push({
      name: 'Supabase URL configured',
      status: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'PASS' : 'FAIL',
      value: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'OK' : 'MISSING'
    });

    diagnostics.tests.push({
      name: 'Supabase Key configured',
      status: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'PASS' : 'FAIL',
      value: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'OK' : 'MISSING'
    });

    // Test 2: Accès à la table (public)
    const { data: publicData, error: publicError, count: publicCount } = await supabase
      .from('advertising_tickers')
      .select('*', { count: 'exact' })
      .eq('is_active', true);

    diagnostics.tests.push({
      name: 'Public access to active tickers',
      status: publicError ? 'FAIL' : 'PASS',
      count: publicCount || 0,
      error: publicError?.message || null,
      sample: publicData?.[0] ? {
        id: publicData[0].id,
        message: publicData[0].message?.substring(0, 50) + '...',
        background_color: publicData[0].background_color,
        text_color: publicData[0].text_color
      } : null
    });

    // Test 3: Vérifier les colonnes
    if (publicData && publicData.length > 0) {
      diagnostics.tests.push({
        name: 'Table structure check',
        status: 'PASS',
        columns: Object.keys(publicData[0])
      });
    }

    // Test 4: Vérifier l'authentification
    const { data: { session } } = await supabase.auth.getSession();
    diagnostics.tests.push({
      name: 'User session',
      status: session ? 'AUTHENTICATED' : 'NOT_AUTHENTICATED',
      user: session?.user?.id || null
    });

    // Déterminer le statut global
    const failedTests = diagnostics.tests.filter(t => t.status === 'FAIL');
    diagnostics.status = failedTests.length === 0 ? 'HEALTHY' : 'UNHEALTHY';

    return NextResponse.json(diagnostics, {
      status: diagnostics.status === 'HEALTHY' ? 200 : 500
    });

  } catch (error: any) {
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      status: 'ERROR',
      error: error.message,
      stack: error.stack,
      tests: diagnostics.tests
    }, { status: 500 });
  }
}
