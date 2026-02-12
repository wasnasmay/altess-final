# Guide de Test Stripe - Intégration Complète

## ✅ Intégration Terminée

Votre intégration Stripe est maintenant **100% fonctionnelle** avec :

1. ✅ **API Route configurée** (`app/api/stripe/checkout/route.ts`)
   - ID de prix Pro intégré : `price_1StajJGRPF89i7tPwyrWED71`
   - Création automatique de session Stripe Checkout
   - Gestion des customers Stripe

2. ✅ **Boutons de paiement connectés** (`app/settings/subscription/page.tsx`)
   - Bouton "Choisir ce plan" fonctionnel
   - Indicateur de chargement pendant la redirection
   - Désactivation des plans gratuits et actuels

3. ✅ **Redirections automatiques**
   - Après paiement réussi → `/settings/subscription?success=true`
   - Après annulation → `/settings/subscription?canceled=true`
   - Messages toast automatiques

---

## 🔧 Configuration Requise

Avant de tester, vous devez configurer ces variables dans votre fichier `.env` :

```env
# Stripe (OBLIGATOIRE)
STRIPE_SECRET_KEY=sk_test_VOTRE_CLE_SECRETE_ICI

# Supabase Service Role (OBLIGATOIRE)
SUPABASE_SERVICE_ROLE_KEY=votre_service_role_key_ici

# URL de l'application (déjà configuré)
NEXT_PUBLIC_APP_URL=http://localhost:3000
STRIPE_PRICE_ID_PRO=price_1StajJGRPF89i7tPwyrWED71
```

### Comment obtenir ces clés ?

1. **STRIPE_SECRET_KEY** :
   - Aller sur https://dashboard.stripe.com/test/apikeys
   - Copier la "Secret key" (commence par `sk_test_`)

2. **SUPABASE_SERVICE_ROLE_KEY** :
   - Aller sur votre dashboard Supabase
   - Settings → API → Service Role Key
   - Copier la clé (commence par `eyJhbGc...`)

---

## 💳 Test avec Carte Bancaire de Test Stripe

Une fois les variables configurées, utilisez ces informations pour tester :

### Carte de test qui RÉUSSIT :
```
Numéro : 4242 4242 4242 4242
Date d'expiration : N'importe quelle date future (ex: 12/34)
CVC : N'importe quel 3 chiffres (ex: 123)
Code postal : N'importe lequel (ex: 75001)
```

### Autres cartes de test utiles :
- **Carte refusée** : `4000 0000 0000 0002`
- **Nécessite authentification 3D Secure** : `4000 0027 6000 3184`
- **Fonds insuffisants** : `4000 0000 0000 9995`

---

## 🧪 Étapes de Test Complètes

### 1. Démarrer l'application
```bash
npm run dev
```

### 2. Se connecter en tant que prestataire
- Aller sur `/login`
- Se connecter avec un compte prestataire (event_provider)

### 3. Accéder à la page d'abonnement
- Aller sur `/settings/subscription`
- Vous devriez voir les 3 plans (Gratuit, Professionnel, Premium)

### 4. Cliquer sur "Choisir ce plan" (Professionnel)
- Le bouton affichera "Redirection..." pendant 1-2 secondes
- Vous serez redirigé vers la page de paiement Stripe

### 5. Remplir le formulaire de paiement
- Utiliser la carte de test : `4242 4242 4242 4242`
- Date : `12/34`
- CVC : `123`
- Adresse : Remplir avec des données factices

### 6. Valider le paiement
- Cliquer sur "S'abonner" ou "Pay"
- Vous serez automatiquement redirigé vers `/settings/subscription`
- Un message de succès s'affichera : "🎉 Paiement réussi ! Votre abonnement est maintenant actif."

### 7. Vérifier l'abonnement
- La page devrait maintenant afficher votre abonnement actif
- Vous verrez votre Stripe Customer ID
- Le plan "Professionnel" sera marqué comme "Plan actuel"

---

## 🔍 Vérifications dans Stripe Dashboard

Après le test, vérifiez dans https://dashboard.stripe.com/test :

1. **Customers** : Un nouveau customer a été créé avec l'email du prestataire
2. **Subscriptions** : Un abonnement actif au plan Pro
3. **Payments** : Le paiement de 29€ est enregistré

---

## 🐛 Dépannage

### Erreur "STRIPE_SECRET_KEY is undefined"
→ Vérifiez que la variable est bien dans `.env` et redémarrez `npm run dev`

### Erreur "Provider not found"
→ Assurez-vous d'être connecté avec un compte prestataire (présent dans `event_providers`)

### Erreur "Module not found: stripe"
→ Exécutez `npm install stripe`

### La redirection ne fonctionne pas
→ Vérifiez que `NEXT_PUBLIC_APP_URL` correspond à votre URL locale

---

## ✅ Checklist Finale

- [ ] Variables d'environnement configurées dans `.env`
- [ ] Application démarrée avec `npm run dev`
- [ ] Connecté en tant que prestataire
- [ ] Carte de test Stripe prête (`4242 4242 4242 4242`)
- [ ] Page `/settings/subscription` accessible
- [ ] Prêt à cliquer sur "Choisir ce plan" !

---

**Vous êtes prêt à tester ! 🚀**

Si tout fonctionne correctement, vous verrez :
1. Redirection vers Stripe Checkout ✅
2. Formulaire de paiement Stripe ✅
3. Retour automatique sur votre site ✅
4. Message de succès ✅
5. Abonnement actif ✅
