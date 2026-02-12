import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface TestResult {
  success: boolean;
  message: string;
  details: {
    streamAccessible: boolean;
    contentType: string;
    icecastServer: boolean;
    metadataAvailable: boolean;
    title?: string;
    artist?: string;
    bitrate?: string;
    sampleRate?: string;
    error?: string;
  };
}

async function testRadioStream(streamUrl: string): Promise<TestResult> {
  const details: TestResult['details'] = {
    streamAccessible: false,
    contentType: '',
    icecastServer: false,
    metadataAvailable: false,
  };

  try {
    console.log(`Testing stream: ${streamUrl}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(streamUrl, {
        method: 'GET',
        headers: {
          'Icy-MetaData': '1',
          'User-Agent': 'ALTESS Radio Test/1.0',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      details.streamAccessible = response.ok;
      details.contentType = response.headers.get('content-type') || 'unknown';

      const icyName = response.headers.get('icy-name');
      const icyBr = response.headers.get('icy-br');
      const icySr = response.headers.get('icy-sr');
      const icyMetaint = response.headers.get('icy-metaint');
      const server = response.headers.get('server');

      details.icecastServer = !!(icyName || icyMetaint || server?.includes('Icecast'));
      details.metadataAvailable = !!(icyName || icyMetaint);

      if (icyName) {
        const parts = icyName.split(' - ');
        details.title = parts.length > 1 ? parts[1] : icyName;
        details.artist = parts.length > 1 ? parts[0] : '';
      }

      if (icyBr) details.bitrate = `${icyBr} kbps`;
      if (icySr) details.sampleRate = `${icySr} Hz`;

      if (!response.ok) {
        return {
          success: false,
          message: `Le flux n'est pas accessible (HTTP ${response.status})`,
          details,
        };
      }

      if (!details.contentType.includes('audio') && !details.contentType.includes('mpeg') && !details.contentType.includes('octet-stream')) {
        return {
          success: false,
          message: `Type de contenu invalide: ${details.contentType}. Attendu: audio/mpeg`,
          details,
        };
      }

      if (details.icecastServer && details.metadataAvailable) {
        return {
          success: true,
          message: 'Flux radio valide avec métadonnées disponibles',
          details,
        };
      } else if (details.streamAccessible) {
        return {
          success: true,
          message: 'Flux audio accessible (métadonnées limitées)',
          details,
        };
      }

      return {
        success: true,
        message: 'Flux audio accessible',
        details,
      };

    } catch (fetchError: any) {
      clearTimeout(timeoutId);

      if (fetchError.name === 'AbortError') {
        details.error = 'Timeout: Le flux n\'a pas répondu dans les 10 secondes';
        return {
          success: false,
          message: 'Timeout: Le flux est trop lent ou inaccessible',
          details,
        };
      }

      details.error = fetchError.message;
      return {
        success: false,
        message: `Erreur de connexion: ${fetchError.message}`,
        details,
      };
    }

  } catch (error: any) {
    details.error = error.message;
    return {
      success: false,
      message: `Erreur lors du test: ${error.message}`,
      details,
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
    const { streamUrl } = await req.json();

    if (!streamUrl) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'streamUrl est requis',
          details: {
            streamAccessible: false,
            contentType: '',
            icecastServer: false,
            metadataAvailable: false,
            error: 'streamUrl manquant',
          }
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const result = await testRadioStream(streamUrl);

    return new Response(
      JSON.stringify(result),
      {
        status: result.success ? 200 : 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );

  } catch (error: any) {
    console.error('Error in test-radio-stream function:', error);

    return new Response(
      JSON.stringify({
        success: false,
        message: `Erreur serveur: ${error.message}`,
        details: {
          streamAccessible: false,
          contentType: '',
          icecastServer: false,
          metadataAvailable: false,
          error: error.message,
        }
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
