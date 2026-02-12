# 🚀 Guide de déploiement rapide

## ✅ Votre projet est prêt!

Tous les problèmes de build ont été corrigés. Le webhook Stripe est configuré et sécurisé.

## 🎯 Vérification rapide

```bash
npm run verify
```

**Résultat attendu:** Tous les ✅ verts

## 📦 Déployer en 3 étapes

### 1. Push vers GitHub

```bash
git add .
git commit -m "Ready for production - Stripe webhook configured"
git push origin main
```

### 2. Déployer sur Vercel

1. Allez sur [vercel.com](https://vercel.com)
2. Cliquez sur "New Project"
3. Importez votre repo
4. Ajoutez ces variables d'environnement:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_... (à obtenir à l'étape 3)
```

5. Cliquez sur "Deploy"
6. Attendez 2-5 minutes ⏳

### 3. Configurer le webhook Stripe

1. Récupérez votre URL: `https://votre-app.vercel.app`
2. Allez sur [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/test/webhooks)
3. Ajoutez l'endpoint:
   ```
   https://votre-app.vercel.app/api/webhooks/stripe
   ```
4. Sélectionnez ces événements:
   - ✅ `checkout.session.completed`
   - ✅ `payment_intent.succeeded`
   - ✅ `payment_intent.payment_failed`
   - ✅ `invoice.payment_succeeded`
   - ✅ `invoice.payment_failed`
   - ✅ `customer.subscription.*`

5. Copiez le "Signing secret" (`whsec_...`)
6. Ajoutez-le dans Vercel:
   - Settings → Environment Variables
   - `STRIPE_WEBHOOK_SECRET=whsec_...`
7. Redéployez: `vercel --prod`

## 🧪 Tester

### Test 1: Webhook

```bash
stripe listen --forward-to https://votre-app.vercel.app/api/webhooks/stripe
stripe trigger checkout.session.completed
```

**Attendu:** `✅ Webhook called [200]`

### Test 2: Achat de billet

1. Visitez votre site
2. Achetez un billet
3. Carte de test: `4242 4242 4242 4242`
4. Vérifiez la redirection vers la confirmation

## 📚 Documentation complète

- `DEPLOYMENT_READY.md` - Guide complet de déploiement
- `STRIPE_WEBHOOK_SETUP.md` - Configuration détaillée du webhook
- `BUILD_FIXES.md` - Détails techniques des correctifs

## ⚡ Résolution rapide

### "Build failed" sur Vercel

**Solution:** Vérifiez les variables d'environnement. Toutes doivent être configurées.

### "Webhook signature verification failed"

**Solution:** Vérifiez que `STRIPE_WEBHOOK_SECRET` correspond au secret de l'endpoint Stripe.

### "No ticket_id in metadata"

**Solution:** Le code est correct. Vérifiez que vous utilisez la bonne API (`/api/tickets/checkout-demo`).

## 🎉 C'est tout!

Votre système de billetterie avec paiement Stripe est maintenant opérationnel!

---

**Questions?** Consultez `BUILD_FIXES.md` pour plus de détails techniques.
