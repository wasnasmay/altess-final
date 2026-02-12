import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface TicketEmailRequest {
  ticketId: string;
  customerName: string;
  customerEmail: string;
  eventTitle: string;
  eventDate: string;
  eventVenue: string;
  categoryName: string;
  categoryPrice: number;
  quantity: number;
  totalAmount: number;
  qrCodeUrl: string;
  eventImage?: string;
  organizerEmail?: string;
  organizerName?: string;
  organizerAmount?: number;
  platformCommission?: number;
  stripeFees?: number;
}

// Fonction pour générer le template HTML du billet client
function generateClientEmailHTML(data: TicketEmailRequest): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Votre billet - ${data.eventTitle}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #000000;">
  <div style="max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1a1a1a 0%, #000000 100%);">

    <!-- Header avec logo ALTESS -->
    <div style="background: linear-gradient(90deg, #D4AF37 0%, #F4E4B0 50%, #D4AF37 100%); padding: 40px 30px; text-align: center; position: relative; overflow: hidden;">
      <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%); pointer-events: none;"></div>
      <h1 style="margin: 0; color: #000000; font-size: 42px; font-weight: 900; letter-spacing: 4px; text-shadow: 0 2px 4px rgba(0,0,0,0.1); position: relative; z-index: 1;">
        ALTESS
      </h1>
      <p style="margin: 8px 0 0 0; color: #000000; font-size: 14px; letter-spacing: 2px; font-weight: 600; position: relative; z-index: 1;">
        EXCELLENCE ORIENTALE
      </p>
    </div>

    <!-- Image de l'événement -->
    ${data.eventImage ? `
    <div style="width: 100%; height: 300px; overflow: hidden; position: relative;">
      <img src="${data.eventImage}" alt="${data.eventTitle}" style="width: 100%; height: 100%; object-fit: cover;" />
      <div style="position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 100%); padding: 30px; color: white;">
        <h2 style="margin: 0; font-size: 28px; font-weight: 700; color: #D4AF37;">
          ${data.eventTitle}
        </h2>
      </div>
    </div>
    ` : `
    <div style="background: linear-gradient(135deg, #D4AF37 0%, #F4E4B0 100%); padding: 40px 30px; text-align: center;">
      <h2 style="margin: 0; font-size: 32px; font-weight: 700; color: #000000;">
        ${data.eventTitle}
      </h2>
    </div>
    `}

    <!-- Message de félicitations -->
    <div style="padding: 40px 30px; color: #FFFFFF;">
      <div style="background: linear-gradient(135deg, rgba(212, 175, 55, 0.15) 0%, rgba(212, 175, 55, 0.05) 100%); border-left: 4px solid #D4AF37; padding: 25px; border-radius: 8px; margin-bottom: 30px;">
        <h3 style="margin: 0 0 15px 0; color: #D4AF37; font-size: 24px; font-weight: 700;">
          🎉 Félicitations ${data.customerName} !
        </h3>
        <p style="margin: 0; color: #FFFFFF; font-size: 16px; line-height: 1.6;">
          Votre réservation est confirmée. Nous avons hâte de vous accueillir pour cet événement exceptionnel.
        </p>
      </div>

      <!-- Récapitulatif de la commande -->
      <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(212, 175, 55, 0.2); border-radius: 12px; padding: 30px; margin-bottom: 30px;">
        <h4 style="margin: 0 0 20px 0; color: #D4AF37; font-size: 18px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">
          Récapitulatif de votre commande
        </h4>

        <div style="margin-bottom: 20px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.1); color: #AAAAAA; font-size: 14px;">
                📅 Date de l'événement
              </td>
              <td style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.1); color: #FFFFFF; font-size: 14px; text-align: right; font-weight: 600;">
                ${new Date(data.eventDate).toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </td>
            </tr>
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.1); color: #AAAAAA; font-size: 14px;">
                📍 Lieu
              </td>
              <td style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.1); color: #FFFFFF; font-size: 14px; text-align: right; font-weight: 600;">
                ${data.eventVenue}
              </td>
            </tr>
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.1); color: #AAAAAA; font-size: 14px;">
                🎫 Catégorie
              </td>
              <td style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.1); color: #FFFFFF; font-size: 14px; text-align: right; font-weight: 600;">
                ${data.categoryName}
              </td>
            </tr>
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.1); color: #AAAAAA; font-size: 14px;">
                🔢 Quantité
              </td>
              <td style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.1); color: #FFFFFF; font-size: 14px; text-align: right; font-weight: 600;">
                ${data.quantity} billet${data.quantity > 1 ? 's' : ''}
              </td>
            </tr>
            <tr>
              <td style="padding: 16px 0 0 0; color: #D4AF37; font-size: 16px; font-weight: 700;">
                💰 Total payé
              </td>
              <td style="padding: 16px 0 0 0; color: #D4AF37; font-size: 20px; text-align: right; font-weight: 700;">
                ${data.totalAmount.toFixed(2)} €
              </td>
            </tr>
          </table>
        </div>
      </div>

      <!-- QR Code du billet -->
      <div style="background: #FFFFFF; border-radius: 16px; padding: 30px; text-align: center; margin-bottom: 30px; box-shadow: 0 8px 32px rgba(212, 175, 55, 0.2);">
        <h4 style="margin: 0 0 20px 0; color: #000000; font-size: 18px; font-weight: 700;">
          Votre Billet Électronique
        </h4>
        <p style="margin: 0 0 25px 0; color: #666666; font-size: 14px;">
          Présentez ce QR Code à l'entrée de l'événement
        </p>
        <img src="${data.qrCodeUrl}" alt="QR Code du billet" style="width: 250px; height: 250px; border: 4px solid #D4AF37; border-radius: 12px; display: inline-block;" />
        <p style="margin: 25px 0 0 0; color: #999999; font-size: 12px; font-family: 'Courier New', monospace;">
          Billet N° ${data.ticketId}
        </p>
      </div>

      <!-- Bouton télécharger PDF -->
      <div style="text-align: center; margin: 40px 0;">
        <a href="${data.qrCodeUrl}" download="billet-${data.ticketId}.png" style="display: inline-block; background: linear-gradient(90deg, #D4AF37 0%, #F4E4B0 50%, #D4AF37 100%); color: #000000; padding: 18px 50px; text-decoration: none; border-radius: 50px; font-size: 16px; font-weight: 700; letter-spacing: 1px; box-shadow: 0 6px 20px rgba(212, 175, 55, 0.4); transition: transform 0.2s;">
          📥 TÉLÉCHARGER MON BILLET
        </a>
      </div>

      <!-- Instructions importantes -->
      <div style="background: rgba(239, 68, 68, 0.1); border-left: 4px solid #EF4444; padding: 20px; margin-top: 30px; border-radius: 4px;">
        <h4 style="margin: 0 0 12px 0; color: #EF4444; font-size: 16px; font-weight: 700;">
          ⚠️ Informations Importantes
        </h4>
        <ul style="margin: 0; padding-left: 20px; color: #CCCCCC; font-size: 14px; line-height: 1.8;">
          <li>Arrivez 30 minutes avant le début de l'événement</li>
          <li>Présentez votre billet (QR Code) à l'entrée - version numérique ou imprimée</li>
          <li>Ce billet est nominatif et personnel</li>
          <li>Conservez ce mail précieusement</li>
        </ul>
      </div>

      <!-- Footer -->
      <div style="margin-top: 50px; padding-top: 30px; border-top: 1px solid rgba(212, 175, 55, 0.2); text-align: center; color: #888888; font-size: 14px;">
        <p style="margin: 0 0 15px 0;">
          Besoin d'aide ? Contactez-nous à <a href="mailto:billetterie@altess.fr" style="color: #D4AF37; text-decoration: none; font-weight: 600;">billetterie@altess.fr</a>
        </p>
        <p style="margin: 0; font-size: 12px; color: #666666;">
          ALTESS - Excellence Orientale<br>
          Votre plateforme de référence pour les événements culturels
        </p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

// Fonction pour générer le template HTML pour l'organisateur
function generateOrganizerEmailHTML(data: TicketEmailRequest): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nouvelle vente - ${data.eventTitle}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #000000;">
  <div style="max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1a1a1a 0%, #000000 100%);">

    <!-- Header avec logo ALTESS -->
    <div style="background: linear-gradient(90deg, #D4AF37 0%, #F4E4B0 50%, #D4AF37 100%); padding: 40px 30px; text-align: center;">
      <h1 style="margin: 0; color: #000000; font-size: 42px; font-weight: 900; letter-spacing: 4px;">
        ALTESS
      </h1>
      <p style="margin: 8px 0 0 0; color: #000000; font-size: 14px; letter-spacing: 2px; font-weight: 600;">
        EXCELLENCE ORIENTALE
      </p>
    </div>

    <!-- Notification de vente -->
    <div style="padding: 40px 30px; color: #FFFFFF;">
      <div style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(16, 185, 129, 0.05) 100%); border: 2px solid #10B981; padding: 30px; border-radius: 12px; margin-bottom: 30px; text-align: center;">
        <div style="font-size: 48px; margin-bottom: 15px;">💰</div>
        <h2 style="margin: 0 0 10px 0; color: #10B981; font-size: 28px; font-weight: 700;">
          Nouvelle Vente Enregistrée !
        </h2>
        <p style="margin: 0; color: #FFFFFF; font-size: 18px;">
          Un billet vient d'être vendu pour votre événement
        </p>
      </div>

      <!-- Détails de la vente -->
      <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(212, 175, 55, 0.2); border-radius: 12px; padding: 30px; margin-bottom: 30px;">
        <h3 style="margin: 0 0 25px 0; color: #D4AF37; font-size: 20px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">
          Détails de la transaction
        </h3>

        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 15px 0; border-bottom: 1px solid rgba(255,255,255,0.1); color: #AAAAAA; font-size: 14px;">
              🎭 Événement
            </td>
            <td style="padding: 15px 0; border-bottom: 1px solid rgba(255,255,255,0.1); color: #FFFFFF; font-size: 15px; text-align: right; font-weight: 600;">
              ${data.eventTitle}
            </td>
          </tr>
          <tr>
            <td style="padding: 15px 0; border-bottom: 1px solid rgba(255,255,255,0.1); color: #AAAAAA; font-size: 14px;">
              👤 Client
            </td>
            <td style="padding: 15px 0; border-bottom: 1px solid rgba(255,255,255,0.1); color: #FFFFFF; font-size: 15px; text-align: right; font-weight: 600;">
              ${data.customerName}
            </td>
          </tr>
          <tr>
            <td style="padding: 15px 0; border-bottom: 1px solid rgba(255,255,255,0.1); color: #AAAAAA; font-size: 14px;">
              📧 Email
            </td>
            <td style="padding: 15px 0; border-bottom: 1px solid rgba(255,255,255,0.1); color: #FFFFFF; font-size: 15px; text-align: right; font-weight: 600;">
              ${data.customerEmail}
            </td>
          </tr>
          <tr>
            <td style="padding: 15px 0; border-bottom: 1px solid rgba(255,255,255,0.1); color: #AAAAAA; font-size: 14px;">
              🎫 Catégorie
            </td>
            <td style="padding: 15px 0; border-bottom: 1px solid rgba(255,255,255,0.1); color: #FFFFFF; font-size: 15px; text-align: right; font-weight: 600;">
              ${data.categoryName}
            </td>
          </tr>
          <tr>
            <td style="padding: 15px 0; border-bottom: 1px solid rgba(255,255,255,0.1); color: #AAAAAA; font-size: 14px;">
              🔢 Quantité
            </td>
            <td style="padding: 15px 0; border-bottom: 1px solid rgba(255,255,255,0.1); color: #FFFFFF; font-size: 15px; text-align: right; font-weight: 600;">
              ${data.quantity} billet${data.quantity > 1 ? 's' : ''}
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 0 0 0; color: #10B981; font-size: 16px; font-weight: 700;">
              💵 Montant
            </td>
            <td style="padding: 20px 0 0 0; color: #10B981; font-size: 24px; text-align: right; font-weight: 700;">
              ${data.totalAmount.toFixed(2)} €
            </td>
          </tr>
        </table>
      </div>

      <!-- Informations commission détaillées -->
      <div style="background: rgba(212, 175, 55, 0.1); border-left: 4px solid #D4AF37; padding: 20px; margin-bottom: 30px; border-radius: 4px;">
        <h4 style="margin: 0 0 15px 0; color: #D4AF37; font-size: 16px; font-weight: 700;">
          💡 Répartition Financière Détaillée
        </h4>
        <p style="margin: 0 0 10px 0; color: #CCCCCC; font-size: 14px; line-height: 1.6;">
          <strong>Total brut :</strong> ${data.totalAmount.toFixed(2)} €<br>
          ${data.stripeFees ? `<strong>Frais bancaires (Stripe) :</strong> -${data.stripeFees.toFixed(2)} €<br>` : ''}
          ${data.platformCommission ? `<strong>Commission ALTESS :</strong> -${data.platformCommission.toFixed(2)} €<br>` : ''}
          <strong style="color: #10B981;">Net à recevoir (48h après événement) :</strong> <span style="font-size: 16px;">${data.organizerAmount ? data.organizerAmount.toFixed(2) : (data.totalAmount * 0.90).toFixed(2)} €</span>
        </p>
      </div>

      <!-- Accès au dashboard -->
      <div style="text-align: center; margin: 40px 0;">
        <a href="https://altess.fr/admin/events" style="display: inline-block; background: linear-gradient(90deg, #D4AF37 0%, #F4E4B0 50%, #D4AF37 100%); color: #000000; padding: 18px 40px; text-decoration: none; border-radius: 50px; font-size: 16px; font-weight: 700; letter-spacing: 1px; box-shadow: 0 6px 20px rgba(212, 175, 55, 0.4);">
          📊 VOIR MON TABLEAU DE BORD
        </a>
      </div>

      <!-- Footer -->
      <div style="margin-top: 50px; padding-top: 30px; border-top: 1px solid rgba(212, 175, 55, 0.2); text-align: center; color: #888888; font-size: 14px;">
        <p style="margin: 0 0 15px 0;">
          Questions ? Contactez-nous à <a href="mailto:organisateurs@altess.fr" style="color: #D4AF37; text-decoration: none; font-weight: 600;">organisateurs@altess.fr</a>
        </p>
        <p style="margin: 0; font-size: 12px; color: #666666;">
          ALTESS - Excellence Orientale<br>
          Plateforme de billetterie événementielle
        </p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const data: TicketEmailRequest = await req.json();
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY not configured');
    }

    // 1. Envoyer l'email au client avec son billet
    const clientEmailHTML = generateClientEmailHTML(data);

    const clientEmailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'ALTESS Billetterie <billetterie@altess.fr>',
        to: data.customerEmail,
        subject: `🎫 Votre billet pour ${data.eventTitle} - ALTESS`,
        html: clientEmailHTML
      })
    });

    if (!clientEmailResponse.ok) {
      const errorText = await clientEmailResponse.text();
      console.error('Error sending client email:', errorText);
      throw new Error(`Failed to send client email: ${errorText}`);
    }

    const clientEmailResult = await clientEmailResponse.json();
    console.log('Client email sent:', clientEmailResult);

    // 2. Envoyer l'email à l'organisateur (si email fourni)
    let organizerEmailResult = null;
    if (data.organizerEmail) {
      const organizerEmailHTML = generateOrganizerEmailHTML(data);

      const organizerEmailResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'ALTESS Notifications <notifications@altess.fr>',
          to: data.organizerEmail,
          subject: `💰 Nouvelle vente enregistrée ! - ${data.eventTitle}`,
          html: organizerEmailHTML
        })
      });

      if (organizerEmailResponse.ok) {
        organizerEmailResult = await organizerEmailResponse.json();
        console.log('Organizer email sent:', organizerEmailResult);
      } else {
        console.error('Error sending organizer email:', await organizerEmailResponse.text());
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Emails sent successfully',
        clientEmail: clientEmailResult,
        organizerEmail: organizerEmailResult
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
    console.error('Error sending ticket emails:', error);
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
