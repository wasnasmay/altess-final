# Guide Stripe - Mode Test et Configuration

## Système de Paiement Prêt pour Stripe

Le système de billetterie Altess est maintenant prêt pour l'intégration Stripe. Voici comment le configurer et l'utiliser.

---

## 🎯 Fonctionnalités Implémentées

### 1. Tunnel de Paiement Complet
- ✅ API de checkout (`/api/boutique/checkout`)
- ✅ Webhook de confirmation (`/api/boutique/webhook`)
- ✅ Gestion des paiements réussis/échoués
- ✅ Incrémentation atomique des ventes

### 2. Flux Utilisateur
```
Client achète un billet
    ↓
Création du billet (statut: pending)
    ↓
Redirection vers Stripe Checkout
    ↓
Paiement validé par Stripe
    ↓
Webhook reçu → Billet activé (statut: valid)
    ↓
Redirection vers page de confirmation
    ↓
Affichage du Billet Doré téléchargeable
```

### 3. Mode Test (Actuel)
**Sans clé Stripe configurée**, le système fonctionne en mode test :
- Les billets sont créés immédiatement
- Statut : `completed` (pas d'attente de paiement)
- Redirection directe vers la page de confirmation
- Parfait pour les démonstrations

---

## 🔧 Configuration Stripe en Mode Production

### Étape 1: Créer un Compte Stripe

1. Allez sur [https://dashboard.stripe.com/register](https://dashboard.stripe.com/register)
2. Créez votre compte (gratuit)
3. Complétez les informations de votre entreprise

### Étape 2: Obtenir les Clés API

1. Dans votre dashboard Stripe, cliquez sur **"Developers"** (en haut à droite)
2. Allez dans **"API keys"**
3. Vous verrez deux types de clés :
   - **Publishable key** (commence par `pk_test_...` en test, `pk_live_...` en prod)
   - **Secret key** (commence par `sk_test_...` en test, `sk_live_...` en prod)

**⚠️ Important :** Utilisez d'abord les clés de TEST pour vos tests !

### Étape 3: Configurer les Variables d'Environnement

Dans votre fichier `.env` ou `.env.local`, ajoutez :

```bash
# Clés Stripe (MODE TEST)
STRIPE_SECRET_KEY=sk_test_VOTRE_CLE_SECRETE_TEST
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_VOTRE_CLE_PUBLIQUE_TEST

# Webhook Secret (voir étape 4)
STRIPE_WEBHOOK_SECRET=whsec_VOTRE_SECRET_WEBHOOK

# URL du site (pour les redirections)
NEXT_PUBLIC_SITE_URL=https://votre-domaine.com
```

### Étape 4: Configurer les Webhooks

1. Dans Stripe Dashboard → **Developers** → **Webhooks**
2. Cliquez sur **"Add endpoint"**
3. URL du webhook : `https://votre-domaine.com/api/boutique/webhook`
4. Sélectionnez les événements :
   - ✅ `checkout.session.completed`
   - ✅ `checkout.session.expired`
5. Copiez le **Signing secret** qui commence par `whsec_...`
6. Ajoutez-le dans votre `.env` comme `STRIPE_WEBHOOK_SECRET`

### Étape 5: Test avec Cartes de Test Stripe

Utilisez ces numéros de carte pour tester :

| Carte | Numéro | Résultat |
|-------|--------|----------|
| Visa réussie | `4242 4242 4242 4242` | Paiement accepté ✅ |
| Visa échouée | `4000 0000 0000 0002` | Paiement refusé ❌ |
| 3D Secure | `4000 0027 6000 3184` | Nécessite authentification 🔐 |

**Autres informations** (peu importe les valeurs en test) :
- Date d'expiration : n'importe quelle date future (ex: `12/25`)
- CVC : n'importe quels 3 chiffres (ex: `123`)
- Code postal : n'importe quel code (ex: `75001`)

---

## 🚀 Passage en Mode Production

### 1. Activer le Mode Live dans Stripe

Dans votre Stripe Dashboard :
1. Cliquez sur le toggle **"Test mode"** (en haut à droite)
2. Désactivez-le pour passer en **"Live mode"**
3. Complétez les informations bancaires (pour recevoir les paiements)

### 2. Obtenir les Clés Live

1. **Developers** → **API keys**
2. Copiez les clés qui commencent par `pk_live_...` et `sk_live_...`

### 3. Mettre à Jour les Variables d'Environnement

```bash
# Clés Stripe (MODE PRODUCTION)
STRIPE_SECRET_KEY=sk_live_VOTRE_CLE_SECRETE_LIVE
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_VOTRE_CLE_PUBLIQUE_LIVE

# Recréer le webhook en mode LIVE et copier le nouveau secret
STRIPE_WEBHOOK_SECRET=whsec_VOTRE_NOUVEAU_SECRET_LIVE
```

### 4. Configurer le Webhook Live

Répétez l'étape 4 de la configuration, mais cette fois en **mode LIVE** :
- Même URL : `https://votre-domaine.com/api/boutique/webhook`
- Mêmes événements
- Nouveau `whsec_...` secret à copier

---

## 💳 Frais et Tarification Stripe

### Tarifs Standard
- **2,9% + 0,25€** par transaction réussie (cartes européennes)
- Pas de frais d'abonnement
- Pas de frais cachés

### Exemple de Calcul
Pour un billet à **50€** :
- Prix du billet : 50,00€
- Frais Stripe : 1,70€ (2,9% + 0,25€)
- **Vous recevez : 48,30€**

💡 **Astuce** : Vous pouvez répercuter les frais sur le client en ajoutant des "frais de service" de 5% lors du checkout.

---

## 🧪 Tester le Système

### Mode Test Actuel (Sans Stripe)
1. Allez sur `/boutique/[slug]/event/[eventId]`
2. Remplissez le formulaire
3. Cliquez sur "Commander"
4. Vous êtes redirigé directement vers `/boutique/[slug]/confirmation/[ticketId]`
5. Le Billet Doré s'affiche et est téléchargeable

### Mode Test avec Stripe
1. Ajoutez les clés de test dans `.env`
2. Redémarrez l'application
3. Même processus, mais avec :
   - Redirection vers Stripe Checkout
   - Page de paiement Stripe
   - Utilisation des cartes de test
   - Retour sur la page de confirmation

---

## 📊 Suivi des Ventes dans Stripe

### Dashboard Stripe
- **Payments** : Liste de tous les paiements
- **Customers** : Base de données clients
- **Analytics** : Graphiques de revenus
- **Reports** : Exports CSV pour la comptabilité

### Filtres Utiles
- Par statut (succeeded, failed, pending)
- Par période
- Par montant
- Par client

---

## 🔒 Sécurité

### ✅ Bonnes Pratiques Implémentées
- Vérification de la signature des webhooks
- Clés secrètes côté serveur uniquement
- Paiements traités par Stripe (PCI-DSS compliant)
- Statuts atomiques pour éviter les duplications

### ⚠️ À Ne JAMAIS Faire
- ❌ Exposer `STRIPE_SECRET_KEY` dans le code client
- ❌ Valider un paiement sans webhook
- ❌ Stocker des numéros de carte
- ❌ Partager vos clés API publiquement

---

## 🎫 Liens Courts et Partage

Chaque événement a maintenant une URL courte :

### Format
```
https://altess.fr/e/[slug-personnalisé]
```

### Exemples Réels
- `https://altess.fr/e/mediterranee`
- `https://altess.fr/e/danse-orientale`
- `https://altess.fr/e/festival-chaabi`

### Où Trouver le Lien
1. **Dashboard Organisateur** : Lien de la boutique affiché en permanence avec bouton "Copier"
2. **Création d'événement** : Champ personnalisable à l'étape 2
3. **Billet Doré** : Imprimé automatiquement sous le QR Code

### Utilisation
- Réseaux sociaux (Facebook, Instagram)
- Flyers et affiches
- Email marketing
- WhatsApp
- Publicités Google/Facebook

---

## 🆘 Support et Aide

### Documentation Stripe
- [Guide de démarrage](https://stripe.com/docs/payments/checkout)
- [Webhooks](https://stripe.com/docs/webhooks)
- [Cartes de test](https://stripe.com/docs/testing)

### Support Stripe
- Email : support@stripe.com
- Chat : disponible dans le dashboard

### Aide Altess
- Les routes API sont dans `/app/api/boutique/`
- Les webhooks logs sont visibles dans Stripe Dashboard
- En cas de problème, vérifiez d'abord les logs Stripe

---

## ✨ Résumé

### Ce qui est Prêt
✅ Tunnel de paiement complet
✅ Webhooks configurés
✅ Mode test intégré
✅ Page de confirmation avec Billet Doré
✅ Liens courts partageables
✅ Graphique de ventes avec données de test

### Ce qu'il Reste à Faire
1. Ajouter vos clés Stripe dans `.env`
2. Tester avec les cartes de test
3. Configurer le webhook
4. Passer en mode LIVE quand vous êtes prêt

**Le système est 100% opérationnel en mode TEST** et prêt pour la production dès que vous ajoutez vos clés Stripe !
