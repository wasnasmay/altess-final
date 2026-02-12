import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  console.log('═══════════════════════════════════════════════════════');
  console.log('[Radio Validator] Request received');
  console.log('Timestamp:', new Date().toISOString());

  try {
    const body = await request.json();
    const { streamUrl } = body;

    console.log('[Radio Validator] Request body:', { streamUrl });

    if (!streamUrl) {
      console.error('[Radio Validator] ERROR: streamUrl missing');
      return NextResponse.json(
        { success: false, error: 'streamUrl is required' },
        { status: 400 }
      );
    }

    console.log('[Radio Validator] Testing stream:', streamUrl);
    console.log('[Radio Validator] Timeout set to: 10 seconds');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(streamUrl, {
        method: 'HEAD',
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      clearTimeout(timeoutId);

      const contentType = response.headers.get('content-type') || '';
      const isAudioStream =
        contentType.includes('audio') ||
        contentType.includes('mpeg') ||
        contentType.includes('ogg') ||
        contentType.includes('aacp') ||
        contentType.includes('aac');

      if (response.ok && isAudioStream) {
        console.log('[Radio Validator] Stream is valid:', contentType);
        return NextResponse.json({
          success: true,
          valid: true,
          contentType,
          message: 'Flux audio valide',
        });
      }

      if (response.ok && !isAudioStream) {
        console.log('[Radio Validator] Stream accessible but not audio:', contentType);
        return NextResponse.json({
          success: true,
          valid: false,
          contentType,
          message: 'URL accessible mais ne semble pas être un flux audio',
        });
      }

      console.log('[Radio Validator] Stream not accessible:', response.status);
      return NextResponse.json({
        success: true,
        valid: false,
        status: response.status,
        message: `Flux non accessible (HTTP ${response.status})`,
      });

    } catch (fetchError: any) {
      clearTimeout(timeoutId);

      if (fetchError.name === 'AbortError') {
        console.log('[Radio Validator] Stream timeout');
        return NextResponse.json({
          success: true,
          valid: false,
          message: 'Délai d\'attente dépassé (10s)',
        });
      }

      try {
        const getResponse = await fetch(streamUrl, {
          method: 'GET',
          signal: AbortSignal.timeout(5000),
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Range': 'bytes=0-1024',
          },
        });

        const contentType = getResponse.headers.get('content-type') || '';
        const isAudioStream =
          contentType.includes('audio') ||
          contentType.includes('mpeg') ||
          contentType.includes('ogg') ||
          contentType.includes('aacp') ||
          contentType.includes('aac');

        if (getResponse.ok && isAudioStream) {
          console.log('[Radio Validator] Stream valid via GET:', contentType);
          return NextResponse.json({
            success: true,
            valid: true,
            contentType,
            message: 'Flux audio valide',
          });
        }
      } catch (e) {
        console.error('[Radio Validator] GET fallback failed:', e);
      }

      console.error('[Radio Validator] Fetch error:', fetchError.message);
      return NextResponse.json({
        success: true,
        valid: false,
        message: 'Impossible de se connecter au flux',
      });
    }

  } catch (error: any) {
    console.error('═══════════════════════════════════════════════════════');
    console.error('[Radio Validator] ❌ FATAL ERROR');
    console.error('Error type:', error.constructor?.name || typeof error);
    console.error('Error message:', error.message || error);
    console.error('Error stack:', error.stack || 'N/A');
    console.error('═══════════════════════════════════════════════════════');

    return NextResponse.json(
      { success: false, error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
