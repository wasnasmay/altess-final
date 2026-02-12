# Configuration du Webhook Stripe

## Fichier créé

✅ **`app/api/webhooks/stripe/route.ts`**

Ce webhook unifié gère tous les événements Stripe pour:
- Billetterie
- Boutique (produits)
- Abonnements prestataires

## Configuration requise

### 1. Variables d'environnement

Ajoutez dans votre fichier `.env`:

```bash
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 2. Configuration dans Stripe Dashboard

#### Étape 1: Accéder aux Webhooks

1. Connectez-vous à [Stripe Dashboard](https://dashboard.stripe.com/)
2. Allez dans **Developers** → **Webhooks**
3. Cliquez sur **Add endpoint**

#### Étape 2: Configurer l'endpoint

**URL du webhook:**
```
https://votre-domaine.com/api/webhooks/stripe
```

Pour le développement local, utilisez Stripe CLI:
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

#### Étape 3: Sélectionner les événements

Cochez les événements suivants:

**Paiements:**
- ✅ `checkout.session.completed`
- ✅ `payment_intent.succeeded`
- ✅ `payment_intent.payment_failed`

**Abonnements:**
- ✅ `invoice.payment_succeeded`
- ✅ `invoice.payment_failed`
- ✅ `customer.subscription.created`
- ✅ `customer.subscription.updated`
- ✅ `customer.subscription.deleted`

#### Étape 4: Récupérer le Webhook Secret

1. Après avoir créé l'endpoint, cliquez dessus
2. Cliquez sur **Reveal** dans la section "Signing secret"
3. Copiez la valeur (commence par `whsec_...`)
4. Ajoutez-la dans votre `.env`:
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

## Événements gérés

### 🎟️ Billetterie (`payment_type: 'ticket'`)

**Événement:** `checkout.session.completed`

**Métadonnées requises:**
```typescript
{
  payment_type: 'ticket',
  ticket_id: 'uuid-du-billet'
}
```

**Actions:**
- ✅ Marque le billet comme `paid` et `valid`
- ✅ Incrémente `tickets_sold` de l'événement
- ✅ Ajoute le montant aux `pending_earnings` de l'organisateur
- ✅ Envoie l'email de confirmation avec QR code

### 🛍️ Boutique (`payment_type: 'product'`)

**Événement:** `checkout.session.completed`

**Métadonnées requises:**
```typescript
{
  payment_type: 'product',
  order_id: 'uuid-de-la-commande'
}
```

**Actions:**
- ✅ Marque la commande comme `paid`
- ✅ Enregistre le `payment_intent`

### 💳 Abonnements (`payment_type: 'subscription'`)

**Événement:** `checkout.session.completed`

**Métadonnées requises:**
```typescript
{
  payment_type: 'subscription',
  user_id: 'uuid-du-prestataire'
}
```

**Actions:**
- ✅ Active l'abonnement du prestataire
- ✅ Enregistre le `subscription_id`
- ✅ Définit les dates de période

**Événements de renouvellement:**
- `invoice.payment_succeeded` → Marque comme `active`
- `invoice.payment_failed` → Marque comme `past_due`

**Événements de cycle de vie:**
- `customer.subscription.updated` → Met à jour le statut et les dates
- `customer.subscription.deleted` → Marque comme `cancelled`

## Test en développement

### Avec Stripe CLI

1. **Installer Stripe CLI:**
   ```bash
   brew install stripe/stripe-cli/stripe
   # ou
   scoop install stripe
   ```

2. **Se connecter:**
   ```bash
   stripe login
   ```

3. **Démarrer le forwarding:**
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

4. **Copier le webhook secret** affiché:
   ```
   > Ready! Your webhook signing secret is whsec_... (^C to quit)
   ```

5. **Mettre à jour `.env`:**
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

6. **Tester un événement:**
   ```bash
   stripe trigger checkout.session.completed
   ```

### Vérifier les logs

Les logs détaillés s'affichent dans la console:

```
[WEBHOOK] Received Stripe webhook request
[WEBHOOK] Signature verified successfully
[WEBHOOK] Event type: checkout.session.completed
[WEBHOOK] Processing checkout.session.completed: cs_test_...
[WEBHOOK] Processing ticket purchase: 12345-abcde
[WEBHOOK] Ticket payment confirmed: 12345-abcde
[WEBHOOK] Ticket email sent successfully
```

## Sécurité

### ✅ Ce qui est implémenté:

1. **Vérification de signature** avec `stripe.webhooks.constructEvent()`
2. **Validation du webhook secret** avant traitement
3. **Logs détaillés** pour débogage et audit
4. **Gestion d'erreurs** avec retours appropriés
5. **Service role key** Supabase pour bypasser RLS

### ⚠️ Points importants:

- Le webhook secret **DOIT** être configuré
- Le webhook **NE FONCTIONNE PAS** sans signature valide
- Les métadonnées **DOIVENT** contenir les IDs nécessaires
- Le webhook utilise la **SERVICE_ROLE_KEY** pour accéder à Supabase

## Dépannage

### Erreur: "Missing signature"

**Cause:** Header `stripe-signature` manquant
**Solution:** Vérifiez que la requête vient bien de Stripe

### Erreur: "Webhook Error: ..."

**Cause:** Signature invalide
**Solution:**
1. Vérifiez que `STRIPE_WEBHOOK_SECRET` est correct
2. Utilisez le secret du bon environnement (test vs prod)
3. Avec Stripe CLI, utilisez le secret affiché dans le terminal

### Erreur: "No ticket_id in session metadata"

**Cause:** Métadonnées manquantes lors de la création du checkout
**Solution:** Ajoutez les métadonnées lors du `stripe.checkout.sessions.create()`:
```typescript
const session = await stripe.checkout.sessions.create({
  // ...
  metadata: {
    payment_type: 'ticket',
    ticket_id: ticketId
  }
});
```

### Les emails ne sont pas envoyés

**Cause:** Edge function `send-ticket-email` non déployée ou erreur
**Solution:**
1. Vérifiez que la fonction existe dans Supabase
2. Vérifiez les logs: `[WEBHOOK] Error sending ticket email`
3. Testez la fonction directement

## Monitoring en production

### Stripe Dashboard

1. Allez dans **Developers** → **Webhooks**
2. Cliquez sur votre endpoint
3. Consultez l'onglet **Attempts** pour voir les requêtes
4. Vérifiez les statuts (2xx = succès, 4xx/5xx = erreur)

### Logs serveur

Utilisez votre plateforme d'hébergement pour consulter les logs:
- Vercel: `vercel logs`
- Netlify: Logs dans le dashboard
- Custom: `pm2 logs`, `docker logs`, etc.

### Retry automatique

Si votre webhook retourne une erreur (status 4xx/5xx), Stripe réessaie automatiquement:
- Immédiatement
- Après 5 minutes
- Après 30 minutes
- Après 2 heures
- Après 12 heures

Assurez-vous que votre webhook est **idempotent** (peut être appelé plusieurs fois sans effet de bord).

## Migration depuis les anciens webhooks

Si vous aviez des webhooks spécifiques (`/api/tickets/webhook`, `/api/boutique/webhook`):

1. ✅ Gardez-les actifs pendant la transition
2. ✅ Ajoutez le nouveau webhook en parallèle
3. ✅ Testez avec des paiements de test
4. ✅ Migrez les événements vers le nouveau endpoint
5. ✅ Supprimez les anciens webhooks

---

**Date:** 1er février 2026
**Status:** ✅ Webhook unifié créé et documenté
**Fichier:** `app/api/webhooks/stripe/route.ts`
