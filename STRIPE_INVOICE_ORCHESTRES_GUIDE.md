# Guide - Stripe Invoices pour les Devis d'Orchestre

## Vue d'ensemble

Ce système permet de générer automatiquement des factures Stripe pour les devis d'orchestre acceptés. Les clients reçoivent un lien de paiement sécurisé hébergé par Stripe avec 30 jours pour payer.

---

## Architecture du système

### Tables modifiées

**`quote_documents`** - Nouveaux champs ajoutés :
- `stripe_customer_id` : ID du customer Stripe
- `stripe_invoice_id` : ID de la facture Stripe
- `stripe_invoice_url` : URL hébergée de la facture pour le paiement
- `stripe_invoice_status` : Statut de la facture (draft, open, paid, void, uncollectible)
- `stripe_invoice_created_at` : Date de création de la facture

---

## Route API

**Endpoint :** `/api/stripe/create-invoice`
**Méthode :** `POST`

### Paramètres requis

```typescript
{
  quoteDocumentId: string,  // ID du devis dans la table quote_documents
  userId: string            // ID de l'utilisateur Supabase
}
```

### Réponse en cas de succès

```typescript
{
  success: true,
  invoiceId: string,        // ID de la facture Stripe
  invoiceUrl: string,       // URL hébergée pour le paiement
  invoiceStatus: string,    // Statut de la facture
  amountDue: number        // Montant à payer en euros
}
```

---

## Utilisation dans un composant React

### Exemple 1 : Bouton pour générer une facture

```tsx
'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ExternalLink, FileText } from 'lucide-react';

interface QuoteInvoiceButtonProps {
  quoteId: string;
  quoteNumber: string;
  totalAmount: number;
  status: string;
  stripeInvoiceUrl?: string | null;
}

export function QuoteInvoiceButton({
  quoteId,
  quoteNumber,
  totalAmount,
  status,
  stripeInvoiceUrl,
}: QuoteInvoiceButtonProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [invoiceUrl, setInvoiceUrl] = useState(stripeInvoiceUrl);

  async function handleGenerateInvoice() {
    if (!user) {
      toast.error('Vous devez être connecté');
      return;
    }

    if (status !== 'accepted') {
      toast.error('Le devis doit être accepté avant de générer une facture');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/stripe/create-invoice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quoteDocumentId: quoteId,
          userId: user.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la création de la facture');
      }

      setInvoiceUrl(data.invoiceUrl);
      toast.success('Facture créée avec succès !', {
        description: 'Vous pouvez maintenant procéder au paiement',
      });

      // Ouvrir l'URL de la facture dans un nouvel onglet
      if (data.invoiceUrl) {
        window.open(data.invoiceUrl, '_blank');
      }
    } catch (error: any) {
      console.error('Invoice creation error:', error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  // Si une facture existe déjà, afficher un bouton pour l'ouvrir
  if (invoiceUrl) {
    return (
      <Button
        onClick={() => window.open(invoiceUrl, '_blank')}
        variant="outline"
        className="gap-2"
      >
        <ExternalLink className="h-4 w-4" />
        Voir la facture ({totalAmount.toFixed(2)}€)
      </Button>
    );
  }

  // Si le devis est accepté mais pas encore de facture
  if (status === 'accepted') {
    return (
      <Button
        onClick={handleGenerateInvoice}
        disabled={loading}
        className="gap-2"
      >
        <FileText className="h-4 w-4" />
        {loading ? 'Génération...' : `Générer la facture (${totalAmount.toFixed(2)}€)`}
      </Button>
    );
  }

  // Si le devis n'est pas encore accepté
  return (
    <Button disabled variant="secondary">
      Devis non accepté
    </Button>
  );
}
```

### Exemple 2 : Section administrative des devis

```tsx
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { QuoteInvoiceButton } from './QuoteInvoiceButton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function AdminQuotesPanel() {
  const [quotes, setQuotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQuotes();
  }, []);

  async function loadQuotes() {
    const { data, error } = await supabase
      .from('quote_documents')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading quotes:', error);
    } else {
      setQuotes(data || []);
    }
    setLoading(false);
  }

  function getStatusBadge(status: string) {
    const variants: Record<string, any> = {
      draft: 'secondary',
      sent: 'default',
      accepted: 'success',
      rejected: 'destructive',
      expired: 'outline',
    };

    const labels: Record<string, string> = {
      draft: 'Brouillon',
      sent: 'Envoyé',
      accepted: 'Accepté',
      rejected: 'Refusé',
      expired: 'Expiré',
    };

    return (
      <Badge variant={variants[status] || 'default'}>
        {labels[status] || status}
      </Badge>
    );
  }

  function getInvoiceStatusBadge(status?: string) {
    if (!status) return null;

    const variants: Record<string, any> = {
      draft: 'secondary',
      open: 'default',
      paid: 'success',
      void: 'destructive',
      uncollectible: 'destructive',
    };

    const labels: Record<string, string> = {
      draft: 'Brouillon',
      open: 'En attente',
      paid: 'Payée',
      void: 'Annulée',
      uncollectible: 'Impayée',
    };

    return (
      <Badge variant={variants[status] || 'default'}>
        Facture : {labels[status] || status}
      </Badge>
    );
  }

  if (loading) {
    return <div>Chargement...</div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Gestion des Devis</h2>

      {quotes.map((quote) => (
        <Card key={quote.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{quote.quote_number}</CardTitle>
              <div className="flex gap-2">
                {getStatusBadge(quote.status)}
                {getInvoiceStatusBadge(quote.stripe_invoice_status)}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Montant total :</span>
                <span className="font-semibold">{quote.total_amount.toFixed(2)}€</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date de création :</span>
                <span>{new Date(quote.created_at).toLocaleDateString('fr-FR')}</span>
              </div>
              {quote.valid_until && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Valide jusqu'au :</span>
                  <span>{new Date(quote.valid_until).toLocaleDateString('fr-FR')}</span>
                </div>
              )}

              <div className="pt-4">
                <QuoteInvoiceButton
                  quoteId={quote.id}
                  quoteNumber={quote.quote_number}
                  totalAmount={quote.total_amount}
                  status={quote.status}
                  stripeInvoiceUrl={quote.stripe_invoice_url}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

---

## Webhook Stripe pour synchroniser les paiements

Pour mettre à jour automatiquement le statut des devis quand une facture est payée, créez un webhook.

### Créer `/app/api/stripe/webhook-invoice/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  // Traiter les événements de facture
  switch (event.type) {
    case 'invoice.paid':
      const paidInvoice = event.data.object as Stripe.Invoice;

      // Mettre à jour le devis
      await supabase
        .from('quote_documents')
        .update({
          stripe_invoice_status: 'paid',
        })
        .eq('stripe_invoice_id', paidInvoice.id);

      // Enregistrer le paiement
      if (paidInvoice.metadata.quote_document_id) {
        await supabase.from('quote_payments').insert({
          quote_document_id: paidInvoice.metadata.quote_document_id,
          amount: paidInvoice.amount_paid / 100,
          payment_method: 'stripe_invoice',
          payment_status: 'completed',
          payment_date: new Date().toISOString(),
          transaction_id: paidInvoice.id,
        });
      }
      break;

    case 'invoice.payment_failed':
      const failedInvoice = event.data.object as Stripe.Invoice;

      await supabase
        .from('quote_documents')
        .update({
          stripe_invoice_status: 'open',
        })
        .eq('stripe_invoice_id', failedInvoice.id);
      break;

    case 'invoice.voided':
      const voidedInvoice = event.data.object as Stripe.Invoice;

      await supabase
        .from('quote_documents')
        .update({
          stripe_invoice_status: 'void',
        })
        .eq('stripe_invoice_id', voidedInvoice.id);
      break;

    case 'invoice.updated':
      const updatedInvoice = event.data.object as Stripe.Invoice;

      await supabase
        .from('quote_documents')
        .update({
          stripe_invoice_status: updatedInvoice.status || 'open',
        })
        .eq('stripe_invoice_id', updatedInvoice.id);
      break;
  }

  return NextResponse.json({ received: true });
}
```

---

## Configurer le webhook dans Stripe

1. Allez sur [Stripe Dashboard > Developers > Webhooks](https://dashboard.stripe.com/webhooks)
2. Cliquez sur "Add endpoint"
3. URL : `https://votre-domaine.com/api/stripe/webhook-invoice`
4. Sélectionnez les événements :
   - `invoice.paid`
   - `invoice.payment_failed`
   - `invoice.voided`
   - `invoice.updated`
5. Copiez le "Signing secret" et ajoutez-le dans `.env` :

```env
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

---

## Flux complet d'utilisation

### 1. Client demande un devis
- Remplir le formulaire de devis
- Le devis est créé avec status `draft`

### 2. Admin prépare et envoie le devis
- Modifier les items, prix, conditions
- Changer le status à `sent`
- Envoyer par email au client

### 3. Client accepte le devis
- Voir le devis
- Cliquer sur "Accepter"
- Status passe à `accepted`

### 4. Génération de la facture Stripe
```typescript
// L'admin ou le client clique sur "Générer la facture"
const response = await fetch('/api/stripe/create-invoice', {
  method: 'POST',
  body: JSON.stringify({
    quoteDocumentId: quote.id,
    userId: user.id,
  }),
});

const { invoiceUrl } = await response.json();
// Rediriger vers invoiceUrl
```

### 5. Client paie la facture
- Ouvrir l'URL hébergée Stripe
- Entrer les informations de carte
- Payer (délai de 30 jours)

### 6. Webhook met à jour le système
- Stripe envoie `invoice.paid`
- Status de la facture → `paid`
- Paiement enregistré dans `quote_payments`

---

## Avantages de Stripe Invoices

✅ **Délai de paiement** : 30 jours pour payer (configurable)
✅ **URL hébergée** : Pas besoin de gérer le checkout
✅ **Rappels automatiques** : Stripe envoie des emails de rappel
✅ **Facture PDF** : Générée automatiquement par Stripe
✅ **Multi-devises** : Support de plusieurs devises
✅ **Historique** : Toutes les factures dans le Dashboard Stripe

---

## Différences avec Checkout Sessions

| Caractéristique | Checkout Session | Invoice |
|----------------|------------------|---------|
| Paiement | Immédiat | Différé (30 jours) |
| Usage | Vente en ligne | B2B, devis |
| URL | Expire après 24h | Valide 30 jours |
| PDF | Non | Oui, automatique |
| Rappels | Non | Oui, automatiques |
| Personnalisation | Limitée | Très flexible |

---

## Tests avec des cartes test

Carte de test Stripe :
```
Numéro : 4242 4242 4242 4242
Date : 12/34
CVC : 123
```

Pour tester un paiement échoué :
```
Numéro : 4000 0000 0000 0002
```

---

## Sécurité et bonnes pratiques

1. **Validation** : Toujours vérifier que le devis est `accepted` avant de créer la facture
2. **Unicité** : Une seule facture par devis (vérification dans l'API)
3. **Webhooks** : Toujours valider la signature Stripe
4. **Logs** : Logger toutes les erreurs Stripe pour debug
5. **Montants** : Toujours vérifier les montants avant de créer la facture

---

## Checklist de déploiement

- [ ] Migration appliquée (champs Stripe ajoutés)
- [ ] `STRIPE_SECRET_KEY` configuré dans `.env`
- [ ] `SUPABASE_SERVICE_ROLE_KEY` configuré
- [ ] Route `/api/stripe/create-invoice` déployée
- [ ] Webhook `/api/stripe/webhook-invoice` déployé
- [ ] Webhook configuré dans Stripe Dashboard
- [ ] `STRIPE_WEBHOOK_SECRET` configuré
- [ ] Tests effectués avec carte test
- [ ] Interface admin pour gérer les factures
- [ ] Emails de notification configurés (optionnel)

---

## Support et dépannage

### La facture n'est pas créée
- Vérifier que le devis a le status `accepted`
- Vérifier les logs de l'API route
- Vérifier que `STRIPE_SECRET_KEY` est correcte

### Le webhook ne fonctionne pas
- Vérifier la signature du webhook
- Vérifier que l'URL du webhook est accessible publiquement
- Voir les logs dans Stripe Dashboard > Webhooks > Logs

### Le montant est incorrect
- Vérifier `quote.total_amount` dans la base de données
- S'assurer que les items sont correctement formatés
- Vérifier la conversion euros → centimes (x100)

---

**Votre système de facturation Stripe est prêt ! 🎵💳**
