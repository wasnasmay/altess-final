import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { videoId } = await req.json();

    if (!videoId) {
      return new Response(
        JSON.stringify({ error: "videoId is required" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    console.log("🔍 Fetching YouTube metadata for:", videoId);

    // Méthode 1: oEmbed API (officielle, gratuite, sans clé)
    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const response = await fetch(oembedUrl);

    if (response.ok) {
      const data = await response.json();
      const thumbnail = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

      console.log("✅ Metadata retrieved:", data.title);

      return new Response(
        JSON.stringify({
          success: true,
          title: data.title,
          author: data.author_name,
          thumbnail: thumbnail,
          embedUrl: `https://www.youtube.com/embed/${videoId}`,
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Fallback: Retourner au moins l'URL normalisée
    console.log("⚠️ oEmbed failed, using fallback");
    return new Response(
      JSON.stringify({
        success: true,
        title: `Vidéo YouTube ${videoId}`,
        author: "YouTube",
        thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        embedUrl: `https://www.youtube.com/embed/${videoId}`,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("❌ Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
