import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey, Range",
  "Access-Control-Expose-Headers": "Content-Type, Content-Length, Accept-Ranges",
};

/**
 * Radio Stream Proxy with Auto-Reconnect
 *
 * This edge function acts as a proxy for radio streams to solve:
 * - CORS issues
 * - Mixed Content (HTTP/HTTPS) problems
 * - DNS errors and 404s
 * - Connection stability
 *
 * Features:
 * - Persistent connection with keep-alive
 * - Automatic reconnection on failure
 * - Stream buffering
 * - Error recovery
 */

async function streamRadio(url: string, maxRetries = 5): Promise<ReadableStream<Uint8Array>> {
  let retryCount = 0;

  const attemptConnection = async (): Promise<Response> => {
    try {
      console.log(`[Proxy] Connecting to stream: ${url} (attempt ${retryCount + 1}/${maxRetries})`);

      // Use mobile User-Agent to bypass mobile-only restrictions
      const mobileUserAgents = [
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
        'Mozilla/5.0 (Linux; Android 13; SM-S908B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36',
        'Mozilla/5.0 (iPad; CPU OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1'
      ];

      const randomUserAgent = mobileUserAgents[Math.floor(Math.random() * mobileUserAgents.length)];

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': randomUserAgent,
          'Accept': 'audio/mpeg, audio/*, */*',
          'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
          'Connection': 'keep-alive',
          'Range': 'bytes=0-',
        },
        redirect: 'follow', // Follow redirects automatically
        // @ts-ignore - Deno specific option
        keepalive: true,
      });

      if (!response.ok) {
        throw new Error(`Stream returned ${response.status}: ${response.statusText}`);
      }

      console.log(`[Proxy] Connected successfully. Content-Type: ${response.headers.get('content-type')}`);
      return response;
    } catch (error) {
      console.error(`[Proxy] Connection attempt ${retryCount + 1} failed:`, error);

      if (retryCount < maxRetries - 1) {
        retryCount++;
        // Exponential backoff: 1s, 2s, 4s, 8s, 16s
        const delay = Math.min(1000 * Math.pow(2, retryCount), 16000);
        console.log(`[Proxy] Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return attemptConnection();
      }

      throw error;
    }
  };

  const response = await attemptConnection();

  // Create a readable stream that handles reconnection
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let currentResponse = response;
      let reader = currentResponse.body?.getReader();

      if (!reader) {
        controller.error(new Error('No stream body available'));
        return;
      }

      const pump = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();

            if (done) {
              console.log('[Proxy] Stream ended, attempting reconnection...');

              // Try to reconnect
              try {
                retryCount = 0; // Reset retry count for reconnection
                currentResponse = await attemptConnection();
                reader = currentResponse.body?.getReader();

                if (!reader) {
                  controller.close();
                  return;
                }

                console.log('[Proxy] Reconnected successfully');
                continue; // Continue pumping with new reader
              } catch (reconnectError) {
                console.error('[Proxy] Failed to reconnect:', reconnectError);
                controller.close();
                return;
              }
            }

            // Enqueue the chunk
            controller.enqueue(value);
          }
        } catch (error) {
          console.error('[Proxy] Stream error:', error);

          // Try to reconnect on error
          try {
            retryCount = 0;
            currentResponse = await attemptConnection();
            reader = currentResponse.body?.getReader();

            if (reader) {
              console.log('[Proxy] Recovered from error, reconnected');
              pump(); // Restart pumping
            } else {
              controller.error(error);
            }
          } catch (reconnectError) {
            console.error('[Proxy] Failed to recover:', reconnectError);
            controller.error(error);
          }
        }
      };

      pump();
    },

    cancel() {
      console.log('[Proxy] Stream cancelled by client');
    }
  });

  return stream;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    // Get the stream URL from query parameters
    const url = new URL(req.url);
    const streamUrl = url.searchParams.get('url');

    if (!streamUrl) {
      return new Response(
        JSON.stringify({
          error: 'Missing stream URL',
          usage: 'Add ?url=YOUR_STREAM_URL to the request'
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

    // Validate URL
    let targetUrl: URL;
    try {
      targetUrl = new URL(streamUrl);
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid stream URL' }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    console.log(`[Proxy] New stream request for: ${targetUrl.href}`);

    // Create the proxied stream
    const stream = await streamRadio(targetUrl.href);

    // Return the stream with appropriate headers for audio streaming
    return new Response(stream, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'audio/mpeg', // Force audio/mpeg for browser recognition
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Accept-Ranges': 'bytes',
        'Connection': 'keep-alive',
        'X-Content-Type-Options': 'nosniff',
      },
    });

  } catch (error) {
    console.error('[Proxy] Fatal error:', error);

    return new Response(
      JSON.stringify({
        error: 'Stream proxy error',
        message: error instanceof Error ? error.message : String(error)
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
