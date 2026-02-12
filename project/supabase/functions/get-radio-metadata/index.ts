import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface RadioMetadata {
  title?: string;
  artist?: string;
  album?: string;
  artwork?: string;
  station?: string;
  listeners?: number;
}

async function fetchIcecastMetadata(streamUrl: string): Promise<RadioMetadata> {
  try {
    const url = new URL(streamUrl);
    const baseUrl = `${url.protocol}//${url.host}`;

    const statusUrls = [
      `${baseUrl}/status-json.xsl`,
      `${baseUrl}/status.xsl`,
      `${baseUrl}/7.html`
    ];

    for (const statusUrl of statusUrls) {
      try {
        const response = await fetch(statusUrl, {
          headers: {
            'User-Agent': 'ALTESS Radio Player/1.0',
          },
          signal: AbortSignal.timeout(5000),
        });

        if (!response.ok) continue;

        const contentType = response.headers.get('content-type') || '';

        if (contentType.includes('application/json')) {
          const data = await response.json();

          if (data.icestats && data.icestats.source) {
            const sources = Array.isArray(data.icestats.source)
              ? data.icestats.source
              : [data.icestats.source];

            const matchingSource = sources.find((s: any) =>
              streamUrl.includes(s.listenurl) || streamUrl.includes(s.mount)
            ) || sources[0];

            if (matchingSource) {
              const title = matchingSource.title || matchingSource.server_name || '';
              const parts = title.split(' - ');

              return {
                title: parts.length > 1 ? parts[1] : title,
                artist: parts.length > 1 ? parts[0] : matchingSource.server_description || '',
                station: matchingSource.server_name || '',
                listeners: matchingSource.listeners || 0,
              };
            }
          }
        } else if (contentType.includes('text/html') || contentType.includes('text/plain')) {
          const text = await response.text();

          const streamTitleMatch = text.match(/StreamTitle='([^']+)'/);
          if (streamTitleMatch) {
            const fullTitle = streamTitleMatch[1];
            const parts = fullTitle.split(' - ');

            return {
              title: parts.length > 1 ? parts[1] : fullTitle,
              artist: parts.length > 1 ? parts[0] : '',
            };
          }
        }
      } catch (error) {
        console.log(`Failed to fetch from ${statusUrl}:`, error);
        continue;
      }
    }

    const metadataResponse = await fetch(streamUrl, {
      method: 'GET',
      headers: {
        'Icy-MetaData': '1',
        'User-Agent': 'ALTESS Radio Player/1.0',
      },
      signal: AbortSignal.timeout(5000),
    });

    const icyName = metadataResponse.headers.get('icy-name');
    const icyDescription = metadataResponse.headers.get('icy-description');
    const icyMetadata = metadataResponse.headers.get('icy-metadata');

    if (icyMetadata || icyName) {
      return {
        title: icyMetadata || icyName || 'En cours de lecture',
        artist: icyDescription || '',
        station: icyName || '',
      };
    }

    return {
      title: 'En cours de lecture',
      artist: 'Radio en direct',
    };

  } catch (error) {
    console.error('Error fetching radio metadata:', error);
    return {
      title: 'En cours de lecture',
      artist: 'Radio en direct',
    };
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    // Support both query parameters and JSON body
    const url = new URL(req.url);
    let streamUrl = url.searchParams.get('url');

    // Fallback to JSON body if no query parameter
    if (!streamUrl && req.method === 'POST') {
      const body = await req.json();
      streamUrl = body.streamUrl;
    }

    if (!streamUrl) {
      return new Response(
        JSON.stringify({ error: 'streamUrl is required. Use ?url=YOUR_STREAM_URL or POST with {streamUrl: "..."}' }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const metadata = await fetchIcecastMetadata(streamUrl);

    return new Response(
      JSON.stringify(metadata),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }
    );
  } catch (error) {
    console.error('Error in get-radio-metadata function:', error);

    return new Response(
      JSON.stringify({
        error: 'Failed to fetch radio metadata',
        title: 'En cours de lecture',
        artist: 'Radio en direct',
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
