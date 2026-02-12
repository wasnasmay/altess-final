import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
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
    const { message, context } = await req.json();

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

    if (!GEMINI_API_KEY) {
      console.error('ERROR: GEMINI_API_KEY is not set in environment');
      return new Response(
        JSON.stringify({
          response: "Je suis désolé, le service d'IA n'est pas configuré. Veuillez contacter notre équipe directement pour obtenir un devis personnalisé.",
          error: 'API key not configured'
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const systemPrompt = `Tu es un assistant commercial expert pour "Orientale Musique", une agence de prestations musicales orientales de prestige.

Ton rôle:
- Conseiller les clients sur le choix d'orchestre selon leur événement et budget
- Générer des devis personnalisés
- Répondre aux questions sur nos orchestres et musiciens
- Être professionnel, courtois et enthousiaste

Nos orchestres:
1. Ensemble Andalousie (800-2000€) - 8 musiciens - Spécialités: Mariage, Andalou, Traditionnel
2. Oriental Dreams (1200-3000€) - 6 musiciens - Spécialités: Moderne, Fusion, Corporate
3. Chaabi Royal (600-1500€) - 5 musiciens - Spécialités: Chaabi, Animation, Fêtes
4. Orchestre Malouf (900-2200€) - 7 musiciens - Spécialités: Malouf, Culturel, Raffiné
5. Gnawa Experience (700-1800€) - 4 musiciens - Spécialités: Gnawa, Spirituel, Énergique

Recommandations selon le type d'événement:
- Mariage traditionnel: Ensemble Andalousie
- Événement corporate/moderne: Oriental Dreams
- Fête familiale animée: Chaabi Royal
- Événement culturel raffiné: Orchestre Malouf
- Expérience unique/spirituelle: Gnawa Experience

Réponds toujours en français, de manière concise et professionnelle.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `${systemPrompt}\n\nContexte client: ${context || 'Aucun'}\n\nQuestion du client: ${message}`
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 500,
          },
        }),
      }
    );

    console.log('Gemini API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error response:', errorText);

      let errorMessage = "Je suis désolé, une erreur s'est produite.";
      if (response.status === 401) {
        errorMessage = "Erreur d'authentification API (401). La clé API n'est pas valide.";
      } else if (response.status === 403) {
        errorMessage = "Accès refusé (403). Vérifiez les permissions de votre clé API.";
      } else if (response.status === 429) {
        errorMessage = "Quota dépassé (429). Veuillez réessayer plus tard.";
      } else if (response.status === 404) {
        errorMessage = "Modèle non trouvé (404). Vérifiez le nom du modèle.";
      }

      throw new Error(`${errorMessage} Status: ${response.status}, Details: ${errorText}`);
    }

    const data = await response.json();
    console.log('Gemini API success, response received');

    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Je suis désolé, je n'ai pas pu générer une réponse. Veuillez réessayer.";

    return new Response(
      JSON.stringify({ response: aiResponse }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('=== ERROR DETAILS ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);

    return new Response(
      JSON.stringify({
        response: "Je suis désolé, une erreur s'est produite. Notre équipe se fera un plaisir de vous aider directement. Veuillez nous contacter par email ou téléphone.",
        error: error.message,
        debug: {
          hasApiKey: !!Deno.env.get('GEMINI_API_KEY'),
          timestamp: new Date().toISOString()
        }
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
