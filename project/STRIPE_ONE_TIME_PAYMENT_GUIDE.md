# Guide - Paiements Uniques Stripe (Académie)

## Route API créée

**Endpoint:** `/api/stripe/checkout-one-time`
**Méthode:** `POST`
**Type:** Paiement unique (mode `payment`)

---

## Utilisation

Cette route permet de créer des sessions de paiement Stripe pour des achats uniques, parfaite pour l'Académie (cours, packs de formation, etc.).

### Option 1 : Avec un Price ID Stripe existant

```typescript
const response = await fetch('/api/stripe/checkout-one-time', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    userId: user.id,
    priceId: 'price_XXXXXXXXXXXXX',  // ID du prix Stripe
    itemName: 'Pack Premium - 10 cours',
    itemType: 'pack',  // 'course' ou 'pack'
    itemId: '123',     // ID du cours/pack dans votre DB
  }),
});

const { url } = await response.json();
window.location.href = url;  // Redirige vers Stripe Checkout
```

### Option 2 : Avec un montant dynamique (sans Price ID)

```typescript
const response = await fetch('/api/stripe/checkout-one-time', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    userId: user.id,
    amount: 49.99,     // Montant en euros
    itemName: 'Cours de Oud - Niveau Débutant',
    itemType: 'course',
    itemId: '456',
  }),
});

const { url } = await response.json();
window.location.href = url;
```

---

## Paramètres

| Paramètre | Type | Obligatoire | Description |
|-----------|------|-------------|-------------|
| `userId` | string | ✅ Oui | ID de l'utilisateur Supabase |
| `priceId` | string | ⚠️ Ou `amount` | ID du prix Stripe (recommandé) |
| `amount` | number | ⚠️ Ou `priceId` | Montant en euros (créé dynamiquement) |
| `itemName` | string | ⚡ Recommandé | Nom du cours/pack |
| `itemType` | string | ⚡ Recommandé | Type : `'course'` ou `'pack'` |
| `itemId` | string | ⚡ Recommandé | ID du cours/pack dans votre DB |

---

## Redirections automatiques

### Après paiement réussi
```
/academy?session_id=cs_XXXXX&success=true
```

### Après annulation
```
/academy?canceled=true
```

---

## Exemple d'intégration complète dans un composant

```tsx
'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export function CourseCard({ course }: { course: any }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  async function handlePurchase() {
    if (!user) {
      toast.error('Connectez-vous pour acheter ce cours');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/stripe/checkout-one-time', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          priceId: course.stripe_price_id,  // ou amount: course.price
          itemName: course.title,
          itemType: 'course',
          itemId: course.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la création du paiement');
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      console.error('Purchase error:', error);
      toast.error(error.message);
      setLoading(false);
    }
  }

  return (
    <Button
      onClick={handlePurchase}
      disabled={loading}
      className="w-full"
    >
      {loading ? 'Redirection...' : `Acheter - ${course.price}€`}
    </Button>
  );
}
```

---

## Gestion du retour après paiement

Dans votre page `/academy/page.tsx`, ajoutez ce code pour gérer les redirections :

```tsx
'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

export default function AcademyPage() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');

    if (success === 'true') {
      toast.success('🎉 Paiement réussi ! Vous avez maintenant accès au contenu.', {
        duration: 5000,
      });
      window.history.replaceState({}, '', '/academy');
    } else if (canceled === 'true') {
      toast.error('Paiement annulé. Vous pouvez réessayer quand vous le souhaitez.');
      window.history.replaceState({}, '', '/academy');
    }
  }, [searchParams]);

  return (
    // Votre contenu
  );
}
```

---

## Webhooks Stripe (pour enregistrer l'achat)

Pour enregistrer automatiquement les achats dans votre base de données, vous devrez créer un webhook Stripe qui écoute l'événement `checkout.session.completed`.

**Créer un webhook :** `/api/stripe/webhook`

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
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;

    // Enregistrer l'achat dans votre DB
    if (session.metadata?.payment_type === 'one_time') {
      await supabase.from('course_purchases').insert({
        user_id: session.metadata.supabase_user_id,
        course_id: session.metadata.item_id,
        stripe_session_id: session.id,
        amount: session.amount_total ? session.amount_total / 100 : 0,
        status: 'completed',
      });
    }
  }

  return NextResponse.json({ received: true });
}
```

---

## Tester avec les cartes de test Stripe

Même carte de test que pour les abonnements :

```
Numéro : 4242 4242 4242 4242
Date : 12/34
CVC : 123
```

---

## Différences avec la route d'abonnement

| Caractéristique | Abonnement (`/checkout`) | Paiement unique (`/checkout-one-time`) |
|----------------|--------------------------|----------------------------------------|
| Mode Stripe | `subscription` | `payment` |
| Paiement | Récurrent (mensuel) | Une seule fois |
| Usage | Plans Pro/Premium | Cours, packs, produits |
| Gestion customer | Via `event_providers` | Recherche/création automatique |
| Métadonnées | Plan type, provider ID | Item type, item ID, item name |

---

## Checklist de déploiement

- [ ] Configurer `STRIPE_SECRET_KEY` dans `.env`
- [ ] Configurer `SUPABASE_SERVICE_ROLE_KEY` dans `.env`
- [ ] Créer les Price IDs dans Stripe Dashboard (ou utiliser le montant dynamique)
- [ ] Implémenter la gestion des retours dans `/academy`
- [ ] Créer un webhook pour enregistrer les achats
- [ ] Tester avec la carte `4242 4242 4242 4242`
- [ ] Créer une table `course_purchases` dans Supabase si nécessaire

---

**Votre route de paiement unique est prête ! 🚀**
