import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2026-01-28.clover',
    });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const body = await request.json();
    const { quoteDocumentId, userId } = body;

    if (!quoteDocumentId || !userId) {
      return NextResponse.json(
        { error: 'Quote document ID and user ID are required' },
        { status: 400 }
      );
    }

    // Récupérer le devis
    const { data: quote, error: quoteError } = await supabase
      .from('quote_documents')
      .select('*')
      .eq('id', quoteDocumentId)
      .maybeSingle();

    if (quoteError || !quote) {
      return NextResponse.json(
        { error: 'Quote document not found' },
        { status: 404 }
      );
    }

    // Vérifier que le devis est accepté
    if (quote.status !== 'accepted') {
      return NextResponse.json(
        { error: 'Quote must be accepted before creating an invoice' },
        { status: 400 }
      );
    }

    // Vérifier qu'une facture n'existe pas déjà
    if (quote.stripe_invoice_id) {
      return NextResponse.json(
        { error: 'Invoice already exists for this quote', invoiceUrl: quote.stripe_invoice_url },
        { status: 400 }
      );
    }

    // Récupérer les informations de l'utilisateur
    const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(userId);

    if (userError || !user || !user.email) {
      return NextResponse.json(
        { error: 'User not found or email missing' },
        { status: 404 }
      );
    }

    let customerId = quote.stripe_customer_id;

    // Créer ou récupérer le customer Stripe
    if (!customerId) {
      const customers = await stripe.customers.list({
        email: user.email,
        limit: 1,
      });

      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
      } else {
        const customer = await stripe.customers.create({
          email: user.email,
          name: user.user_metadata?.full_name || user.email,
          metadata: {
            supabase_user_id: userId,
            quote_document_id: quoteDocumentId,
          },
        });
        customerId = customer.id;
      }

      // Mettre à jour le customer ID dans le devis
      await supabase
        .from('quote_documents')
        .update({ stripe_customer_id: customerId })
        .eq('id', quoteDocumentId);
    }

    // Créer la facture Stripe (draft)
    const invoice = await stripe.invoices.create({
      customer: customerId,
      collection_method: 'send_invoice',
      days_until_due: 30,
      auto_advance: false,
      metadata: {
        supabase_user_id: userId,
        quote_document_id: quoteDocumentId,
        quote_number: quote.quote_number,
      },
      description: `Devis ${quote.quote_number}`,
    });

    // Ajouter les lignes de la facture
    const items = quote.items || [];

    if (items.length > 0) {
      // Si le devis a des items détaillés
      for (const item of items) {
        const itemPrice = item.price || 0;
        const itemQuantity = item.quantity || 1;
        const totalItemAmount = Math.round(itemPrice * itemQuantity * 100);

        await stripe.invoiceItems.create({
          customer: customerId,
          invoice: invoice.id,
          description: item.name || 'Prestation',
          amount: totalItemAmount,
          currency: 'eur',
        });
      }
    } else {
      // Sinon, créer une ligne unique avec le montant total
      await stripe.invoiceItems.create({
        customer: customerId,
        invoice: invoice.id,
        description: `Prestation musicale - Devis ${quote.quote_number}`,
        amount: Math.round(quote.total_amount * 100),
        currency: 'eur',
      });
    }

    // Finaliser la facture pour la rendre payable
    const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id, {
      auto_advance: true,
    });

    // Mettre à jour le devis avec les informations Stripe
    const { error: updateError } = await supabase
      .from('quote_documents')
      .update({
        stripe_invoice_id: finalizedInvoice.id,
        stripe_invoice_url: finalizedInvoice.hosted_invoice_url,
        stripe_invoice_status: finalizedInvoice.status,
        stripe_invoice_created_at: new Date().toISOString(),
      })
      .eq('id', quoteDocumentId);

    if (updateError) {
      console.error('Error updating quote document:', updateError);
    }

    return NextResponse.json({
      success: true,
      invoiceId: finalizedInvoice.id,
      invoiceUrl: finalizedInvoice.hosted_invoice_url,
      invoiceStatus: finalizedInvoice.status,
      amountDue: finalizedInvoice.amount_due / 100,
    });

  } catch (error: any) {
    console.error('Stripe invoice creation error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
