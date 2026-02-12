import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface QuoteRequest {
  orderId: string;
  templateId?: string;
  formulaName?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { orderId, templateId, formulaName } = await req.json() as QuoteRequest;

    const { data: order, error: orderError } = await supabase
      .from("custom_orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      throw new Error("Order not found");
    }

    let template = null;

    if (templateId) {
      const { data: templateData } = await supabase
        .from("quote_templates")
        .select("*")
        .eq("id", templateId)
        .eq("is_active", true)
        .single();

      template = templateData;
    } else if (formulaName) {
      const { data: templateData } = await supabase
        .from("quote_templates")
        .select("*")
        .ilike("name", `%${formulaName}%`)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      template = templateData;
    }

    const basePrice = template ? template.base_price : order.total_price;

    const distanceKm = calculateDistance(order.event_location);
    const distanceSurcharge = calculateDistanceSurcharge(distanceKm);

    const durationHours = order.duration_hours || 3;
    const durationSurcharge = calculateDurationSurcharge(durationHours);

    const totalPrice = basePrice + distanceSurcharge + durationSurcharge;

    const quoteNumber = `DEV-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}-${orderId.substring(0, 8).toUpperCase()}`;

    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + (template?.validity_days || 30));

    const { data: quoteDoc, error: quoteError } = await supabase
      .from("quote_documents")
      .insert({
        quote_number: quoteNumber,
        user_id: order.user_id,
        custom_order_id: orderId,
        items: template?.items || [
          { name: "Prestation musicale", quantity: 1, unit: "forfait", price: basePrice }
        ],
        subtotal: basePrice,
        tax_rate: 20,
        tax_amount: totalPrice * 0.20,
        total_amount: totalPrice * 1.20,
        status: "sent",
        valid_until: validUntil.toISOString(),
        notes: template?.terms_conditions || "Conditions générales applicables.",
        distance_km: distanceKm,
        distance_surcharge: distanceSurcharge,
        duration_surcharge: durationSurcharge
      })
      .select()
      .single();

    if (quoteError) throw quoteError;

    await supabase
      .from("custom_orders")
      .update({ status: "quote_sent" })
      .eq("id", orderId);

    const emailHtml = generateQuoteEmailHtml(order, quoteDoc, template, distanceKm, distanceSurcharge, durationSurcharge);

    console.log(`Quote email prepared for ${order.customer_email}`);
    console.log(`Quote Number: ${quoteNumber}`);
    console.log(`Total Amount: ${(totalPrice * 1.20).toFixed(2)}€`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Devis envoyé à ${order.customer_name} (${order.customer_email})`,
        quoteNumber,
        totalAmount: totalPrice * 1.20,
        details: {
          basePrice,
          distanceSurcharge,
          durationSurcharge,
          distanceKm,
          taxAmount: totalPrice * 0.20
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

function calculateDistance(location: string): number {
  const parisLocations = ['paris', '75', 'île-de-france', 'idf'];
  const isInParis = parisLocations.some(loc =>
    location.toLowerCase().includes(loc)
  );

  if (isInParis) return 0;

  return 50;
}

function calculateDistanceSurcharge(distanceKm: number): number {
  if (distanceKm <= 20) return 0;
  if (distanceKm <= 50) return 100;
  if (distanceKm <= 100) return 200;
  if (distanceKm <= 200) return 400;
  return 600;
}

function calculateDurationSurcharge(hours: number): number {
  if (hours <= 3) return 0;
  if (hours <= 4) return 150;
  if (hours <= 6) return 300;
  return 500;
}

function generateQuoteEmailHtml(order: any, quote: any, template: any, distanceKm: number, distanceSurcharge: number, durationSurcharge: number): string {
  const itemsHtml = (template?.items || []).map((item: any) => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.quantity}x ${item.name}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${item.unit || 'forfait'}</td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
          background-color: #f5f5f5;
        }
        .container {
          max-width: 650px;
          margin: 40px auto;
          background: white;
          box-shadow: 0 0 20px rgba(0,0,0,0.1);
        }
        .header {
          background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
          color: #d4af37;
          padding: 40px 30px;
          text-align: center;
        }
        .header h1 { margin: 0; font-size: 32px; }
        .header p { margin: 10px 0 0; font-size: 18px; }
        .content {
          padding: 40px 30px;
        }
        .quote-box {
          background: #f9f9f9;
          border-left: 4px solid #d4af37;
          padding: 20px;
          margin: 25px 0;
        }
        .price-section {
          background: linear-gradient(135deg, #d4af37 0%, #f4e5a1 100%);
          color: #1a1a1a;
          padding: 25px;
          text-align: center;
          border-radius: 8px;
          margin: 25px 0;
        }
        .price-section h2 {
          margin: 0 0 10px;
          font-size: 28px;
        }
        .price-section .total {
          font-size: 42px;
          font-weight: bold;
          margin: 10px 0;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        .button {
          display: inline-block;
          padding: 15px 35px;
          background: #d4af37;
          color: #1a1a1a;
          text-decoration: none;
          border-radius: 5px;
          font-weight: bold;
          margin: 20px 0;
          text-align: center;
        }
        .footer {
          background: #f9f9f9;
          text-align: center;
          padding: 30px;
          color: #666;
          font-size: 13px;
          border-top: 1px solid #eee;
        }
        .surcharges {
          background: #fff9e6;
          padding: 15px;
          border-radius: 5px;
          margin: 20px 0;
        }
        .surcharges h4 {
          margin: 0 0 10px;
          color: #d4af37;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎵 Orientale Musique</h1>
          <p>Votre Devis Personnalisé</p>
        </div>

        <div class="content">
          <p>Bonjour <strong>${order.customer_name}</strong>,</p>

          <p>Merci pour votre demande de devis. Nous avons le plaisir de vous présenter notre proposition pour votre événement.</p>

          <div class="quote-box">
            <strong>N° de Devis:</strong> ${quote.quote_number}<br>
            <strong>Type d'événement:</strong> ${order.event_type}<br>
            <strong>Date:</strong> ${new Date(order.event_date).toLocaleDateString('fr-FR', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}<br>
            <strong>Lieu:</strong> ${order.event_location}<br>
            <strong>Durée:</strong> ${order.duration_hours} heures<br>
            <strong>Valable jusqu'au:</strong> ${new Date(quote.valid_until).toLocaleDateString('fr-FR')}
          </div>

          ${template ? `
          <h3 style="color: #d4af37; border-bottom: 2px solid #d4af37; padding-bottom: 10px;">
            Formule: ${template.name}
          </h3>
          <p>${template.description || ''}</p>

          <table>
            <thead>
              <tr style="background: #f5f5f5;">
                <th style="padding: 10px; text-align: left;">Prestation</th>
                <th style="padding: 10px; text-align: right;">Unité</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          ` : ''}

          ${(distanceSurcharge > 0 || durationSurcharge > 0) ? `
          <div class="surcharges">
            <h4>Suppléments appliqués:</h4>
            ${distanceSurcharge > 0 ? `<p>• Frais de déplacement (${distanceKm}km): +${distanceSurcharge.toFixed(2)}€</p>` : ''}
            ${durationSurcharge > 0 ? `<p>• Supplément durée (${order.duration_hours}h): +${durationSurcharge.toFixed(2)}€</p>` : ''}
          </div>
          ` : ''}

          <div class="price-section">
            <h2>Prix Total TTC</h2>
            <div class="total">${quote.total_amount.toFixed(2)}€</div>
            <p style="margin: 5px 0; font-size: 14px;">
              (dont TVA 20%: ${quote.tax_amount.toFixed(2)}€)
            </p>
          </div>

          <div style="text-align: center;">
            <a href="#" class="button">Accepter ce devis</a>
          </div>

          ${template?.terms_conditions ? `
          <div style="background: #f9f9f9; padding: 20px; margin-top: 30px; border-radius: 5px;">
            <h4 style="margin: 0 0 10px; color: #d4af37;">Conditions:</h4>
            <p style="font-size: 14px; margin: 0;">${template.terms_conditions}</p>
          </div>
          ` : ''}

          <p style="margin-top: 30px;">
            Pour toute question ou modification, n'hésitez pas à nous contacter.
          </p>

          <p>Cordialement,<br>
          <strong>L'équipe Orientale Musique</strong></p>
        </div>

        <div class="footer">
          <p><strong>Orientale Musique</strong><br>
          Orchestres Orientaux de Prestige<br>
          📧 contact@orientale-musique.fr | 📱 +33 1 23 45 67 89</p>
          <p style="margin-top: 15px;">© 2026 Orientale Musique - Tous droits réservés</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
