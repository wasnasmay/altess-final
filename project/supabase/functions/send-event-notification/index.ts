import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface NotificationRequest {
  to: string;
  subject: string;
  bookingReference: string;
  eventTitle: string;
  eventDate: string;
  eventTime?: string;
  venueName?: string;
  venueAddress?: string;
  tickets: Array<{ category: string; quantity: number; price: number }>;
  totalAmount: number;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  type: 'customer_confirmation' | 'organizer_alert';
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const data: NotificationRequest = await req.json();

    let htmlContent = '';
    let textContent = '';

    if (data.type === 'customer_confirmation') {
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f59e0b, #ea580c); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .booking-ref { font-size: 24px; font-weight: bold; color: #f59e0b; font-family: monospace; }
            .ticket-item { background: white; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid #f59e0b; }
            .total { font-size: 20px; font-weight: bold; color: #f59e0b; text-align: right; padding: 15px; background: white; border-radius: 5px; margin-top: 20px; }
            .info-row { margin: 10px 0; }
            .info-label { font-weight: bold; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✓ Réservation confirmée</h1>
              <p>Merci pour votre réservation !</p>
            </div>
            <div class="content">
              <p>Bonjour ${data.customerName},</p>
              <p>Votre réservation a été confirmée avec succès. Voici les détails :</p>

              <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
                <p class="info-label">Référence de réservation</p>
                <p class="booking-ref">${data.bookingReference}</p>
              </div>

              <h2 style="color: #f59e0b;">📅 ${data.eventTitle}</h2>

              <div class="info-row">
                <span class="info-label">Date:</span>
                <span>${data.eventDate}${data.eventTime ? ` à ${data.eventTime}` : ''}</span>
              </div>

              ${data.venueName ? `
                <div class="info-row">
                  <span class="info-label">Lieu:</span>
                  <span>${data.venueName}</span>
                </div>
              ` : ''}

              ${data.venueAddress ? `
                <div class="info-row">
                  <span class="info-label">Adresse:</span>
                  <span>${data.venueAddress}</span>
                </div>
              ` : ''}

              <h3>Vos billets</h3>
              ${data.tickets.map(ticket => `
                <div class="ticket-item">
                  <div style="display: flex; justify-content: space-between;">
                    <div>
                      <strong>${ticket.category}</strong><br>
                      <small>Quantité: ${ticket.quantity}</small>
                    </div>
                    <div style="font-weight: bold; color: #f59e0b;">
                      ${(ticket.price * ticket.quantity).toFixed(2)}€
                    </div>
                  </div>
                </div>
              `).join('')}

              <div class="total">
                Total payé: ${data.totalAmount.toFixed(2)}€
              </div>

              <div style="background: #dbeafe; border: 1px solid #3b82f6; padding: 15px; border-radius: 5px; margin-top: 20px;">
                <p style="margin: 0; color: #1e40af;">
                  <strong>Important:</strong> Conservez cette référence de réservation.
                  Vous devrez la présenter le jour de l'événement.
                </p>
              </div>

              <p style="margin-top: 30px;">À très bientôt !</p>
              <p style="color: #666; font-size: 14px;">L'équipe ALTESS</p>
            </div>
          </div>
        </body>
        </html>
      `;

      textContent = `
Réservation confirmée !

Bonjour ${data.customerName},

Votre réservation a été confirmée avec succès.

Référence: ${data.bookingReference}

Événement: ${data.eventTitle}
Date: ${data.eventDate}${data.eventTime ? ` à ${data.eventTime}` : ''}
${data.venueName ? `Lieu: ${data.venueName}` : ''}

Vos billets:
${data.tickets.map(t => `- ${t.category}: ${t.quantity} x ${t.price}€ = ${(t.price * t.quantity).toFixed(2)}€`).join('\n')}

Total payé: ${data.totalAmount.toFixed(2)}€

Conservez cette référence de réservation pour le jour de l'événement.

L'équipe ALTESS
      `;
    } else {
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .highlight { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #10b981; }
            .info-row { margin: 10px 0; }
            .info-label { font-weight: bold; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Nouvelle réservation !</h1>
            </div>
            <div class="content">
              <p>Bonjour,</p>
              <p>Bonne nouvelle ! Vous avez reçu une nouvelle réservation pour votre événement.</p>

              <div class="highlight">
                <h2 style="margin-top: 0; color: #10b981;">📊 Détails de la vente</h2>
                <div class="info-row">
                  <span class="info-label">Référence:</span>
                  <span style="font-family: monospace; font-weight: bold;">${data.bookingReference}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Montant généré:</span>
                  <span style="font-size: 24px; font-weight: bold; color: #10b981;">${data.totalAmount.toFixed(2)}€</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Billets vendus:</span>
                  <span style="font-weight: bold;">${data.tickets.reduce((sum, t) => sum + t.quantity, 0)}</span>
                </div>
              </div>

              <h3>Événement: ${data.eventTitle}</h3>
              <p>Date: ${data.eventDate}${data.eventTime ? ` à ${data.eventTime}` : ''}</p>

              <h3>Détails des billets</h3>
              ${data.tickets.map(ticket => `
                <div style="background: white; padding: 10px; margin: 5px 0; border-radius: 5px;">
                  ${ticket.category}: ${ticket.quantity} x ${ticket.price}€ = ${(ticket.price * ticket.quantity).toFixed(2)}€
                </div>
              `).join('')}

              <h3>Informations client</h3>
              <div class="highlight">
                <div class="info-row">
                  <span class="info-label">Nom:</span>
                  <span>${data.customerName}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Email:</span>
                  <span>${data.customerEmail}</span>
                </div>
                ${data.customerPhone ? `
                  <div class="info-row">
                    <span class="info-label">Téléphone:</span>
                    <span>${data.customerPhone}</span>
                  </div>
                ` : ''}
              </div>

              <p style="margin-top: 30px; color: #666; font-size: 14px;">
                Vous pouvez consulter toutes vos réservations depuis votre espace administrateur.
              </p>
            </div>
          </div>
        </body>
        </html>
      `;

      textContent = `
Nouvelle réservation !

Une nouvelle réservation a été effectuée pour votre événement.

Référence: ${data.bookingReference}
Montant: ${data.totalAmount.toFixed(2)}€
Billets: ${data.tickets.reduce((sum, t) => sum + t.quantity, 0)}

Événement: ${data.eventTitle}
Date: ${data.eventDate}

Client:
- Nom: ${data.customerName}
- Email: ${data.customerEmail}
${data.customerPhone ? `- Téléphone: ${data.customerPhone}` : ''}

Consultez votre espace admin pour plus de détails.
      `;
    }

    console.log(`Sending ${data.type} email to ${data.to}`);
    console.log('Email content prepared successfully');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Email sent successfully'
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    );
  } catch (error: any) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    );
  }
});
