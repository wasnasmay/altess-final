import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface RenewalRequest {
  entityType: 'event' | 'address' | 'partner';
  entityId: string;
  reminderType: '30_days' | '7_days' | '1_day';
  recipientEmail: string;
  recipientName: string;
  entityTitle: string;
  expiresAt: string;
  stripeLink?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const data: RenewalRequest = await req.json();

    const {
      entityType,
      entityId,
      reminderType,
      recipientEmail,
      recipientName,
      entityTitle,
      expiresAt,
      stripeLink
    } = data;

    // Déterminer le message selon le type de relance
    let subject = '';
    let daysLeft = 0;
    let urgencyColor = '#F59E0B'; // Amber

    switch (reminderType) {
      case '30_days':
        subject = `Votre annonce expire dans 30 jours - ${entityTitle}`;
        daysLeft = 30;
        urgencyColor = '#10B981'; // Green
        break;
      case '7_days':
        subject = `⚠️ Votre annonce expire dans 7 jours - ${entityTitle}`;
        daysLeft = 7;
        urgencyColor = '#F59E0B'; // Amber
        break;
      case '1_day':
        subject = `🚨 URGENT: Votre annonce expire demain - ${entityTitle}`;
        daysLeft = 1;
        urgencyColor = '#EF4444'; // Red
        break;
    }

    // Construire le template HTML (Noir & Or ALTESS)
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #000000;">
  <div style="max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1a1a1a 0%, #000000 100%);">
    <!-- Header -->
    <div style="background: linear-gradient(90deg, #D4AF37 0%, #F4E4B0 50%, #D4AF37 100%); padding: 30px; text-align: center;">
      <h1 style="margin: 0; color: #000000; font-size: 32px; font-weight: 700; letter-spacing: 2px;">
        ALTESS
      </h1>
      <p style="margin: 5px 0 0 0; color: #000000; font-size: 12px; letter-spacing: 1px;">
        EXCELLENCE ORIENTALE
      </p>
    </div>

    <!-- Content -->
    <div style="padding: 40px 30px; color: #FFFFFF;">
      <div style="background: ${urgencyColor}; padding: 15px; border-radius: 8px; margin-bottom: 30px; text-align: center;">
        <h2 style="margin: 0; color: #000000; font-size: 24px; font-weight: 700;">
          ${daysLeft} ${daysLeft === 1 ? 'jour restant' : 'jours restants'}
        </h2>
      </div>

      <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
        Bonjour ${recipientName},
      </p>

      <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
        Votre annonce <strong style="color: #D4AF37;">${entityTitle}</strong> expire le
        <strong>${new Date(expiresAt).toLocaleDateString('fr-FR', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        })}</strong>.
      </p>

      <p style="font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
        Pour continuer à bénéficier de la visibilité sur notre plateforme, renouvelez dès maintenant votre annonce pour 12 mois supplémentaires.
      </p>

      ${stripeLink ? `
      <!-- CTA Button -->
      <div style="text-align: center; margin: 40px 0;">
        <a href="${stripeLink}" style="display: inline-block; background: linear-gradient(90deg, #D4AF37 0%, #F4E4B0 50%, #D4AF37 100%); color: #000000; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-size: 18px; font-weight: 700; letter-spacing: 1px; box-shadow: 0 4px 15px rgba(212, 175, 55, 0.3);">
          RENOUVELER MAINTENANT
        </a>
      </div>
      ` : ''}

      <!-- Benefits -->
      <div style="background: rgba(212, 175, 55, 0.1); border-left: 4px solid #D4AF37; padding: 20px; margin-top: 30px; border-radius: 4px;">
        <h3 style="margin: 0 0 15px 0; color: #D4AF37; font-size: 18px;">
          Pourquoi renouveler ?
        </h3>
        <ul style="margin: 0; padding-left: 20px; color: #CCCCCC;">
          <li style="margin-bottom: 10px;">Visibilité continue sur notre plateforme</li>
          <li style="margin-bottom: 10px;">Accès à notre communauté engagée</li>
          <li style="margin-bottom: 10px;">Support prioritaire</li>
          <li style="margin-bottom: 10px;">Statistiques et analytics détaillés</li>
        </ul>
      </div>

      <!-- Footer Info -->
      <div style="margin-top: 40px; padding-top: 30px; border-top: 1px solid #333333; text-align: center; color: #888888; font-size: 14px;">
        <p style="margin: 0 0 10px 0;">
          Une question ? Contactez-nous à <a href="mailto:contact@altess.fr" style="color: #D4AF37; text-decoration: none;">contact@altess.fr</a>
        </p>
        <p style="margin: 0; font-size: 12px;">
          ALTESS - Excellence Orientale
        </p>
      </div>
    </div>
  </div>
</body>
</html>
    `;

    // Dans un environnement de production, vous utiliseriez un service d'email
    // comme SendGrid, Resend, ou AWS SES
    // Pour cette démo, on simule l'envoi

    console.log(`[DEMO] Email de relance envoyé à ${recipientEmail}`);
    console.log(`Type: ${reminderType}, Entity: ${entityType}, ID: ${entityId}`);

    // TODO: Intégrer avec votre service d'email préféré
    // Exemple avec Resend:
    // const res = await fetch('https://api.resend.com/emails', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify({
    //     from: 'ALTESS <noreply@altess.fr>',
    //     to: recipientEmail,
    //     subject: subject,
    //     html: htmlContent
    //   })
    // });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Email de relance envoyé',
        details: {
          recipient: recipientEmail,
          reminderType,
          daysLeft,
          entityTitle
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
    console.error('Error sending renewal reminder:', error);
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
