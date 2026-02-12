import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

function extractYouTubeId(url: string): string | null {
  if (!url) return null;

  const cleanUrl = url.trim();

  const watchMatch = cleanUrl.match(/(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/);
  if (watchMatch) return watchMatch[1];

  const shortMatch = cleanUrl.match(/(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (shortMatch) return shortMatch[1];

  const embedMatch = cleanUrl.match(/(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
  if (embedMatch) return embedMatch[1];

  const vMatch = cleanUrl.match(/(?:youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/);
  if (vMatch) return vMatch[1];

  const iframeMatch = cleanUrl.match(/src=["']?[^"']*\/embed\/([a-zA-Z0-9_-]{11})/i);
  if (iframeMatch) return iframeMatch[1];

  const directMatch = cleanUrl.match(/^([a-zA-Z0-9_-]{11})$/);
  if (directMatch) return directMatch[1];

  const paramsMatch = cleanUrl.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (paramsMatch) return paramsMatch[1];

  return null;
}

export async function POST(request: NextRequest) {
  console.log('═══════════════════════════════════════════════════════');
  console.log('[YouTube Extract API] Request received');
  console.log('Timestamp:', new Date().toISOString());
  console.log('URL Path:', request.url);

  try {
    const body = await request.json();
    const { url } = body;

    console.log('[YouTube Extract API] Request body:', { url });

    if (!url) {
      console.error('[YouTube Extract API] ERROR: URL missing in request body');
      return NextResponse.json(
        { success: false, error: 'URL is required' },
        { status: 400 }
      );
    }

    console.log('[YouTube Extract API] Extracting video ID from URL...');
    const videoId = extractYouTubeId(url);

    if (!videoId) {
      console.error('[YouTube Extract API] ERROR: Failed to extract video ID from:', url);
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid YouTube URL. Supported formats: youtube.com/watch?v=..., youtu.be/..., embed/...'
        },
        { status: 400 }
      );
    }

    console.log('[YouTube Extract API] ✅ Video ID detected:', videoId);

    let duration = 0;

    try {
      console.log('[YouTube Extract API] Attempting to get duration from Supabase function...');
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (supabaseUrl && supabaseKey) {
        const durationUrl = `${supabaseUrl}/functions/v1/get-youtube-duration`;
        const durationResponse = await fetch(durationUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({ videoId }),
        });

        if (durationResponse.ok) {
          const durationData = await durationResponse.json();
          duration = durationData.duration || 0;
          console.log('[YouTube Extract API] ✅ Duration retrieved:', duration, 'seconds');
        } else {
          console.warn('[YouTube Extract API] ⚠️  Duration fetch failed:', durationResponse.status);
        }
      }
    } catch (durationError) {
      console.warn('[YouTube Extract API] ⚠️  Could not fetch duration:', durationError);
    }

    try {
      const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
      console.log('[YouTube Extract API] Fetching oEmbed data from:', oembedUrl);

      const response = await fetch(oembedUrl);
      console.log('[YouTube Extract API] oEmbed response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        const thumbnail = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

        console.log('[YouTube Extract API] ✅ Metadata retrieved successfully');
        console.log('[YouTube Extract API] Title:', data.title);
        console.log('[YouTube Extract API] Author:', data.author_name);
        console.log('[YouTube Extract API] Duration:', duration, 'seconds');
        console.log('═══════════════════════════════════════════════════════');

        return NextResponse.json({
          success: true,
          videoId,
          title: data.title,
          author: data.author_name,
          thumbnail,
          embedUrl: `https://www.youtube.com/embed/${videoId}`,
          description: data.author_name ? `Vidéo de ${data.author_name}` : null,
          duration,
          durationMs: duration * 1000,
        });
      }
    } catch (e) {
      console.warn('[YouTube Extract API] ⚠️  oEmbed failed, using fallback');
      console.warn('[YouTube Extract API] Error:', e);
    }

    const thumbnail = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

    console.log('[YouTube Extract API] Using fallback data for video:', videoId);
    console.log('[YouTube Extract API] Fallback duration:', duration, 'seconds');
    console.log('═══════════════════════════════════════════════════════');

    return NextResponse.json({
      success: true,
      videoId,
      title: `Vidéo YouTube ${videoId}`,
      author: 'YouTube',
      thumbnail,
      embedUrl: `https://www.youtube.com/embed/${videoId}`,
      description: null,
      duration,
      durationMs: duration * 1000,
    });

  } catch (error) {
    console.error('═══════════════════════════════════════════════════════');
    console.error('[YouTube Extract API] ❌ FATAL ERROR');
    console.error('[YouTube Extract API] Error type:', error instanceof Error ? error.constructor.name : typeof error);
    console.error('[YouTube Extract API] Error message:', error);
    console.error('[YouTube Extract API] Stack:', error instanceof Error ? error.stack : 'N/A');
    console.error('═══════════════════════════════════════════════════════');

    return NextResponse.json(
      { success: false, error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
