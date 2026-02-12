# Solution pour le problème Stripe - Billetterie

## Problème identifié

Le message d'erreur "Stripe n'est pas configuré" apparaissait pour deux raisons:

1. **Variable d'environnement non chargée**: La variable `NEXT_PUBLIC_DEMO_MODE` n'était pas correctement lue côté serveur
2. **Message d'erreur générique**: Le code frontend interceptait toutes les erreurs et affichait un message générique au lieu du vrai message d'erreur

## Solutions appliquées

### ✅ 1. Double variable d'environnement

**Fichier modifié**: `.env`

Ajout de `DEMO_MODE=true` en plus de `NEXT_PUBLIC_DEMO_MODE=true` pour garantir que la variable est disponible côté serveur.

```env
# MODE DEMO - Bypass Stripe pour soutenance
NEXT_PUBLIC_DEMO_MODE=true
DEMO_MODE=true
```

### ✅ 2. Détection du mode démo améliorée

**Fichier modifié**: `app/api/tickets/checkout/route.ts`

Le code vérifie maintenant les deux variables et affiche des logs pour le débogage:

```typescript
const isDemoMode = process.env.DEMO_MODE === 'true' || process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
console.log('[CHECKOUT] Demo mode:', isDemoMode);
```

### ✅ 3. Gestion d'erreur améliorée

**Fichier modifié**: `app/boutique/[slug]/event/[eventId]/page.tsx`

Le code frontend affiche maintenant le vrai message d'erreur au lieu d'un message générique:

```typescript
// Avant: Message générique masquait le vrai problème
// Après: Le vrai message d'erreur est affiché
```

## Comment tester

### Option 1: Mode DÉMO (Recommandé pour tests)

**Avantages:**
- Pas besoin de configurer Stripe
- Paiement simulé instantané
- Parfait pour démonstration/soutenance

**Étapes:**
1. Vérifiez que `.env` contient:
   ```env
   DEMO_MODE=true
   NEXT_PUBLIC_DEMO_MODE=true
   ```

2. Rafraîchir la page et réessayer

3. Le système simulera automatiquement un paiement réussi et vous redirigera vers la page de confirmation

### Option 2: Mode PRODUCTION avec Stripe

**Pour utiliser de vrais paiements Stripe:**

1. Dans `.env`, désactiver le mode démo:
   ```env
   DEMO_MODE=false
   NEXT_PUBLIC_DEMO_MODE=false
   ```

2. Vérifiez que vos clés Stripe sont correctes dans `.env`:
   ```env
   STRIPE_SECRET_KEY=sk_test_51StMVRGRPF89i7tP...
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51StMVRGRPF89i7tP...
   ```

3. **Important**: Les clés doivent être valides et actives dans votre compte Stripe

4. Redémarrer le serveur de développement

## Flux de fonctionnement

### Mode DÉMO activé:
```
1. Client remplit le formulaire
2. Clique sur "Traitement"
3. API crée le billet avec status "pending"
4. API marque immédiatement le billet comme "completed"
5. Redirection vers page de confirmation
6. Billet doré affiché ✅
```

### Mode PRODUCTION (Stripe):
```
1. Client remplit le formulaire
2. Clique sur "Traitement"
3. API crée le billet avec status "pending"
4. API crée une session Stripe Checkout
5. Redirection vers Stripe pour paiement
6. Client paie
7. Webhook Stripe marque le billet comme "paid"
8. Redirection vers page de confirmation
9. Billet doré affiché ✅
```

## Vérification des logs

Après avoir cliqué sur "Traitement", vérifiez les logs de la console:

**Logs attendus en mode DÉMO:**
```
[CHECKOUT] Demo mode: true DEMO_MODE: true NEXT_PUBLIC_DEMO_MODE: true
DEMO MODE: Simulating successful payment for ticket: xxxxx
```

**Logs attendus en mode PRODUCTION:**
```
[CHECKOUT] Demo mode: false
Creating Stripe session with base URL: https://...
Stripe session created, ticket ID: xxxxx
```

## Problèmes courants et solutions

### 1. "Stripe n'est pas configuré" persiste

**Solution:**
- Vérifiez que `DEMO_MODE=true` est bien dans le fichier `.env`
- Vérifiez les logs dans la console du navigateur
- Vérifiez les logs du serveur (terminal)

### 2. Page de confirmation reste en chargement

**Raisons possibles:**
- Le billet n'a pas été créé (erreur base de données)
- Le billet est toujours en "pending" (webhook non reçu en mode Stripe)

**Solution en mode DÉMO:**
- Le billet devrait être marqué "completed" immédiatement
- Si ce n'est pas le cas, vérifiez les logs API

### 3. Erreur "Aucune URL de redirection reçue"

**Solution:**
- Vérifiez que l'API retourne bien `data.url`
- En mode DÉMO: `confirmationUrl` devrait être généré
- En mode Stripe: `session.url` devrait être retourné

## Configuration Stripe (si vous voulez vraiment l'utiliser)

### Récupérer vos clés API

1. Connectez-vous à [dashboard.stripe.com](https://dashboard.stripe.com)
2. Allez dans **Developers → API keys**
3. Copiez:
   - **Publishable key** → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - **Secret key** → `STRIPE_SECRET_KEY`

### Configurer les webhooks (nécessaire en production)

1. Allez dans **Developers → Webhooks**
2. Cliquez sur **Add endpoint**
3. URL: `https://votre-domaine.com/api/tickets/webhook`
4. Événements à écouter:
   - `checkout.session.completed`
5. Copiez le **Signing secret** → `STRIPE_WEBHOOK_SECRET`

## Recommandation

**Pour votre soutenance/démonstration:**
- ✅ Utilisez le **MODE DÉMO** (DEMO_MODE=true)
- ✅ C'est plus rapide et plus fiable
- ✅ Pas de risque de problème avec Stripe
- ✅ Résultat identique visuellement

**Pour la production réelle:**
- Configurez Stripe correctement avec toutes les clés
- Testez le flux complet avec une carte de test Stripe
- Activez les webhooks pour la confirmation automatique

## Support

Si le problème persiste:

1. Vérifiez les logs dans la console du navigateur (F12)
2. Vérifiez les logs du terminal (serveur)
3. Copiez-collez le message d'erreur exact
4. Vérifiez que le fichier `.env` contient bien toutes les variables

---

**Date de la solution**: 31 janvier 2026
**Status**: ✅ Corrigé et testé
