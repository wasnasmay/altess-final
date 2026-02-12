import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  console.log('═══════════════════════════════════════════════════════');
  console.log('[Playout Media Diagnostic] Starting diagnostic...');
  console.log('Timestamp:', new Date().toISOString());

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  console.log('[Playout Media Diagnostic] Environment check:');
  console.log('  - SUPABASE_URL present:', !!supabaseUrl);
  console.log('  - SUPABASE_URL value:', supabaseUrl);
  console.log('  - SUPABASE_KEY present:', !!supabaseKey);
  console.log('  - SUPABASE_KEY length:', supabaseKey?.length || 0);

  if (!supabaseUrl || !supabaseKey) {
    console.error('[Playout Media Diagnostic] ❌ Missing environment variables!');
    return NextResponse.json({
      success: false,
      error: 'Missing Supabase configuration',
      env_check: {
        url_present: !!supabaseUrl,
        key_present: !!supabaseKey
      }
    }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: {
      supabase_url: supabaseUrl,
      anon_key_length: supabaseKey.length
    },
    tests: [] as any[],
  };

  try {
    console.log('[Playout Media Diagnostic] Checking authorization header...');
    const authHeader = request.headers.get('authorization');
    const hasAuthHeader = !!authHeader;
    console.log('  - Auth header present:', hasAuthHeader);

    diagnostics.tests.push({
      name: 'Authorization Header',
      status: hasAuthHeader ? 'PASS' : 'FAIL',
      details: hasAuthHeader ? 'Present' : 'Missing',
    });

    console.log('[Playout Media Diagnostic] Checking user authentication...');
    const { data: authData, error: authError } = await supabase.auth.getUser();
    console.log('  - Authenticated:', !!authData?.user);
    console.log('  - User ID:', authData?.user?.id || 'N/A');
    console.log('  - Auth error:', authError?.message || 'None');

    diagnostics.tests.push({
      name: 'User Authentication',
      status: authData?.user ? 'PASS' : 'FAIL',
      details: authData?.user ? `User ID: ${authData.user.id}` : authError?.message || 'Not authenticated',
    });

    console.log('[Playout Media Diagnostic] Querying media_library...');
    const { data: mediaLibrary, error: mediaLibraryError, count: mediaLibraryCount } = await supabase
      .from('media_library')
      .select('*', { count: 'exact', head: false });

    console.log('  - Success:', !mediaLibraryError);
    console.log('  - Count:', mediaLibraryCount);
    console.log('  - Error:', mediaLibraryError?.message || 'None');
    console.log('  - Error code:', mediaLibraryError?.code || 'N/A');
    console.log('  - Error hint:', mediaLibraryError?.hint || 'N/A');

    diagnostics.tests.push({
      name: 'media_library Access',
      status: !mediaLibraryError ? 'PASS' : 'FAIL',
      count: mediaLibraryCount || 0,
      details: mediaLibraryError?.message || `${mediaLibraryCount} records accessible`,
      error_code: mediaLibraryError?.code,
      error_hint: mediaLibraryError?.hint,
    });

    console.log('[Playout Media Diagnostic] Querying playout_media_library...');
    const { data: playoutMedia, error: playoutMediaError, count: playoutMediaCount } = await supabase
      .from('playout_media_library')
      .select('*', { count: 'exact', head: false });

    console.log('  - Success:', !playoutMediaError);
    console.log('  - Count:', playoutMediaCount);
    console.log('  - Error:', playoutMediaError?.message || 'None');
    console.log('  - Error code:', playoutMediaError?.code || 'N/A');
    console.log('  - Error hint:', playoutMediaError?.hint || 'N/A');

    diagnostics.tests.push({
      name: 'playout_media_library Access',
      status: !playoutMediaError ? 'PASS' : 'FAIL',
      count: playoutMediaCount || 0,
      details: playoutMediaError?.message || `${playoutMediaCount} records accessible`,
      error_code: playoutMediaError?.code,
      error_hint: playoutMediaError?.hint,
    });

    if (authData?.user) {
      console.log('[Playout Media Diagnostic] Querying user profile...');
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .maybeSingle();

      console.log('  - Profile found:', !!profile);
      console.log('  - Role:', profile?.role || 'N/A');
      console.log('  - Error:', profileError?.message || 'None');

      diagnostics.tests.push({
        name: 'User Profile',
        status: profile ? 'PASS' : 'FAIL',
        details: profile ? `Role: ${profile.role || 'N/A'}` : profileError?.message || 'No profile found',
        profile_data: profile || null,
      });
    }

    const summary = {
      total: diagnostics.tests.length,
      passed: diagnostics.tests.filter(t => t.status === 'PASS').length,
      failed: diagnostics.tests.filter(t => t.status === 'FAIL').length,
    };

    console.log('[Playout Media Diagnostic] ✅ Diagnostic complete');
    console.log('Summary:', summary);
    console.log('═══════════════════════════════════════════════════════');

    return NextResponse.json({
      success: true,
      summary,
      diagnostics,
    });

  } catch (error: any) {
    console.error('═══════════════════════════════════════════════════════');
    console.error('[Playout Media Diagnostic] ❌ FATAL ERROR');
    console.error('Error type:', error.constructor?.name || typeof error);
    console.error('Error message:', error.message || error);
    console.error('Error stack:', error.stack || 'N/A');
    console.error('═══════════════════════════════════════════════════════');

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Unknown error',
        error_type: error.constructor?.name,
        diagnostics,
      },
      { status: 500 }
    );
  }
}
