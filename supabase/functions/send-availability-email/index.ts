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
    const { musicianEmail, musicianName, eventDate, eventType, clientName } = await req.json();

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); color: #d4af37; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 30px; background: #d4af37; color: #1a1a1a; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎵 Orientale Musique</h1>
            <p>Demande de disponibilité</p>
          </div>
          <div class="content">
            <p>Bonjour ${musicianName},</p>

            <p>Nous avons une nouvelle opportunité de prestation qui pourrait vous intéresser :</p>

            <div style="background: white; padding: 20px; border-left: 4px solid #d4af37; margin: 20px 0;">
              <strong>Type d'événement:</strong> ${eventType}<br>
              <strong>Date:</strong> ${new Date(eventDate).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}<br>
              <strong>Client:</strong> ${clientName}
            </div>

            <p>Merci de nous confirmer votre disponibilité dans les plus brefs délais.</p>

            <p>Pour confirmer votre disponibilité, veuillez répondre à cet email ou nous contacter directement.</p>

            <p>Cordialement,<br>
            <strong>L'équipe Orientale Musique</strong></p>
          </div>
          <div class="footer">
            <p>© 2026 Orientale Musique - Orchestres Orientaux de Prestige</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const emailText = `
Bonjour ${musicianName},

Nous avons une nouvelle opportunité de prestation :

Type d'événement: ${eventType}
Date: ${new Date(eventDate).toLocaleDateString('fr-FR')}
Client: ${clientName}

Merci de nous confirmer votre disponibilité dans les plus brefs délais.

Cordialement,
L'équipe Orientale Musique
    `;

    console.log(`Email prepared for ${musicianEmail}`);
    console.log(`Subject: Demande de disponibilité - ${eventType} le ${new Date(eventDate).toLocaleDateString('fr-FR')}`);
    console.log(`Content: ${emailText}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Email de disponibilité préparé pour ${musicianName} (${musicianEmail})`,
        details: {
          to: musicianEmail,
          subject: `Demande de disponibilité - ${eventType} le ${new Date(eventDate).toLocaleDateString('fr-FR')}`,
          preview: emailText.substring(0, 100) + '...'
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
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
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
