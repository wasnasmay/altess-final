# Guide du Système de Protection d'Abonnement

## Vue d'ensemble

Le système de protection d'abonnement permet de contrôler l'accès aux fonctionnalités premium de la plateforme en fonction du statut d'abonnement Stripe des prestataires.

## Composants

### 1. Helper Library (`lib/subscription-guard.ts`)

Fonctions utilitaires pour vérifier les abonnements :

- `checkSubscription(userId)` - Récupère les données d'abonnement depuis la base
- `isSubscriptionActive(status)` - Vérifie si l'abonnement est actif
- `canAccessPremiumFeatures(data)` - Vérifie l'accès aux fonctionnalités Pro/Premium
- `canAccessProFeatures(data)` - Vérifie l'accès aux fonctionnalités Pro uniquement
- `canAccessPremiumOnlyFeatures(data)` - Vérifie l'accès aux fonctionnalités Premium uniquement

### 2. Hook React (`hooks/use-subscription.ts`)

Hook personnalisé pour les composants :

```typescript
const {
  subscriptionData,     // Données complètes de l'abonnement
  loading,              // État de chargement
  isActive,             // Boolean : abonnement actif ?
  canAccessPremium,     // Boolean : accès Pro/Premium ?
  canAccessPro,         // Boolean : accès Pro ?
  canAccessPremiumOnly, // Boolean : accès Premium uniquement ?
  needsPaymentAction,   // Boolean : problème de paiement ?
  guardPremiumFeature,  // Fonction : protège une fonctionnalité premium
  guardProFeature,      // Fonction : protège une fonctionnalité pro
  redirectToSubscription, // Fonction : redirige vers /settings/subscription
  refresh,              // Fonction : recharge les données
} = useSubscription();
```

### 3. Composant Alert (`components/SubscriptionAlert.tsx`)

Bandeau d'alerte contextuel qui s'affiche automatiquement si :
- `status === 'past_due'` → Problème de paiement
- `status === 'canceled'` → Abonnement annulé
- `status === 'inactive'` → Aucun abonnement

### 4. Composant Guard (`components/SubscriptionGuard.tsx`)

Wrapper pour protéger visuellement du contenu :

```tsx
<SubscriptionGuard
  level="premium"           // 'pro' | 'premium' | 'premiumOnly'
  featureName="les vidéos premium"
  redirect={true}          // Redirige automatiquement si pas d'accès
  fallback={<CustomUI />}  // UI personnalisée si pas d'accès
>
  <PremiumContent />
</SubscriptionGuard>
```

## Utilisation

### Exemple 1 : Protéger une action (hook)

```tsx
'use client';

import { useSubscription } from '@/hooks/use-subscription';
import { Button } from '@/components/ui/button';

export default function MediaManager() {
  const { guardPremiumFeature } = useSubscription();

  function handleAddVideo() {
    if (!guardPremiumFeature('l\'ajout de vidéos')) {
      return; // Redirection automatique vers /settings/subscription
    }

    // Code pour ajouter la vidéo
  }

  return (
    <Button onClick={handleAddVideo}>
      Ajouter une vidéo
    </Button>
  );
}
```

### Exemple 2 : Protéger une section entière

```tsx
'use client';

import { SubscriptionGuard } from '@/components/SubscriptionGuard';
import AdvancedAnalytics from '@/components/AdvancedAnalytics';

export default function DashboardPage() {
  return (
    <div>
      <h1>Mon Dashboard</h1>

      {/* Contenu gratuit accessible à tous */}
      <BasicStats />

      {/* Contenu premium protégé */}
      <SubscriptionGuard
        level="premium"
        featureName="les analyses avancées"
      >
        <AdvancedAnalytics />
      </SubscriptionGuard>
    </div>
  );
}
```

### Exemple 3 : Afficher le bandeau d'alerte

```tsx
'use client';

import { useSubscription } from '@/hooks/use-subscription';
import { SubscriptionAlert } from '@/components/SubscriptionAlert';

export default function Dashboard() {
  const { subscriptionData } = useSubscription();

  return (
    <div>
      {subscriptionData && (
        <SubscriptionAlert
          status={subscriptionData.status}
          companyName={subscriptionData.companyName}
        />
      )}

      {/* Reste du contenu */}
    </div>
  );
}
```

### Exemple 4 : Protection avec redirection automatique

```tsx
'use client';

import { SubscriptionGuard } from '@/components/SubscriptionGuard';
import CalendarBooking from '@/components/CalendarBooking';

export default function BookingPage() {
  return (
    <SubscriptionGuard
      level="pro"
      featureName="la gestion des rendez-vous"
      redirect={true}  // Redirige automatiquement
    >
      <CalendarBooking />
    </SubscriptionGuard>
  );
}
```

## Niveaux d'accès

### Free (Gratuit)
- Fiche prestataire basique
- Jusqu'à 5 photos
- Réception de devis

### Pro (29€/mois)
- Tout le plan Free
- Photos et vidéos illimitées
- Badge "Vérifié"
- Mise en avant
- Statistiques

### Premium (79€/mois)
- Tout le plan Pro
- Position en tête de liste
- Publicités sponsorisées
- Page personnalisée
- Manager dédié

## Statuts d'abonnement

- `active` → Abonnement actif, accès complet
- `trialing` → Période d'essai, accès complet
- `past_due` → Problème de paiement, accès limité + alerte
- `canceled` → Abonnement annulé, accès limité + alerte
- `inactive` → Aucun abonnement, accès basique + alerte

## Base de données

Table : `event_providers`

Colonnes importantes :
- `subscription_status` : Status de l'abonnement
- `plan_type` : Type de plan (free/pro/premium)
- `stripe_customer_id` : ID client Stripe
- `stripe_subscription_id` : ID abonnement Stripe

## Bonnes pratiques

1. **Toujours utiliser le hook** pour les vérifications côté client
2. **Ajouter des vérifications côté serveur** pour la sécurité (Edge Functions)
3. **Afficher le bandeau d'alerte** sur les dashboards principaux
4. **Utiliser des noms descriptifs** pour les fonctionnalités protégées
5. **Tester tous les statuts** (active, past_due, canceled, inactive)

## Sécurité

⚠️ **IMPORTANT** : Les vérifications côté client ne sont PAS suffisantes pour la sécurité.

Toujours ajouter des vérifications côté serveur dans les Edge Functions :

```typescript
// Dans une Edge Function
const { data: provider } = await supabase
  .from('event_providers')
  .select('subscription_status, plan_type')
  .eq('provider_id', userId)
  .maybeSingle();

if (!provider || provider.subscription_status !== 'active') {
  return new Response('Abonnement requis', { status: 403 });
}
```

## Support

Pour toute question sur l'implémentation, consulter :
- `/lib/subscription-guard.ts` - Logique de base
- `/hooks/use-subscription.ts` - Hook React
- `/components/SubscriptionGuard.tsx` - Composant de protection
- `/components/SubscriptionAlert.tsx` - Bandeau d'alerte
