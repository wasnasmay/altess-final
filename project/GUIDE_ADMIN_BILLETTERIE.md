# 📋 Guide Admin - Gestion de la Billetterie & Rendez-vous

## 🎯 Accès au Système de Billetterie

Toutes les fonctionnalités de billetterie sont maintenant accessibles depuis votre **Dashboard Admin** :

### 1. Accéder au Dashboard Admin

```
URL : /admin
```

Une fois connecté en tant qu'administrateur, vous verrez une nouvelle section dédiée à la billetterie en haut de la page.

---

## 📊 Section Billetterie & Rendez-vous

Cette nouvelle section contient **4 modules principaux** :

### 1️⃣ Événements (`/admin/events`)

**Icône : 📅 Calendrier violet**

Créer et gérer vos événements avec billetterie :

✅ **Fonctionnalités :**
- Créer un nouvel événement
- Définir les catégories de billets (VIP, Standard, Enfant, etc.)
- Fixer les prix et quotas par catégorie
- Définir la date, heure et lieu
- Activer/Désactiver les événements
- Télécharger la liste des participants (CSV)
- Voir les statistiques de vente en temps réel

📋 **Vue d'ensemble :**
- Progression visuelle des ventes
- Billets vendus / disponibles par catégorie
- Taux de remplissage
- Montant total des ventes

---

### 2️⃣ Statistiques (`/admin/rendez-vous`)

**Icône : 📊 Trending rose**

Dashboard analytique complet :

📈 **Métriques affichées :**
- **Total Événements** : Nombre total d'événements créés
- **Événements Actifs** : Événements en vente
- **Billets Vendus** : Total de billets vendus
- **Revenu Total** : Montant brut total
- **Commission ALTESS (10%)** : Votre commission sur les ventes
- **Net Organisateurs** : Montant à reverser aux organisateurs

🎨 **Vue par événement :**
- Image de l'événement
- Date et lieu
- Catégories de billets avec détail des ventes
- Statut (Disponible, Complet, Terminé)
- Boutons d'action (Voir, Activer/Désactiver)

---

### 3️⃣ Réservations (`/admin/bookings`)

**Icône : 🎫 Ticket doré**

Liste complète de toutes les réservations :

📋 **Tableau détaillé avec :**
- Référence de réservation
- Informations client (Nom, Email)
- Événement associé
- Date de réservation
- Nombre de billets
- Montant payé
- Statut (En attente, Confirmée, Annulée)
- Statut de paiement (En attente, Payé, Échoué)
- Check-in (Validé / Non validé)
- Actions (Voir détails)

🔍 **Recherche avancée :**
- Par nom de client
- Par email
- Par référence de réservation
- Par nom d'événement

📥 **Export CSV :**
- Exporter toutes les réservations filtrées
- Format : Référence, Client, Email, Téléphone, Événement, Date, Billets, Montant, Statut, Paiement, Check-in

👁️ **Détails de réservation :**
Cliquez sur l'icône œil pour voir :
- Référence complète
- Informations client détaillées
- Détails de l'événement
- Liste des billets par catégorie
- **QR Code haute résolution**
- Statuts de paiement et check-in

---

### 4️⃣ Scanner QR (`/admin/scanner`)

**Icône : 📱 QR Code vert**

Validation des billets à l'entrée de l'événement :

🎥 **Mode Scanner Caméra :**
1. Cliquez sur "Activer la Caméra"
2. Autorisez l'accès à la caméra
3. Positionnez le QR code du billet dans le cadre jaune
4. La validation est instantanée

⌨️ **Mode Saisie Manuelle :**
- Saisissez le code du billet : `ALTESS-TICKET-{id}-{reference}`
- Cliquez sur "Valider le Code"
- Utile si le QR code est illisible

✅ **Résultats de validation :**

**✅ Billet Valide (Vert) :**
- Affiche les informations du client
- Affiche l'événement
- Affiche le nombre de billets
- Marque le billet comme "Check-in validé"
- Autorise l'entrée

**⚠️ Billet Déjà Utilisé (Orange) :**
- Affiche la date/heure de première utilisation
- Affiche les informations du client
- **REFUSE l'entrée** (billet déjà scanné)

**❌ Billet Invalide (Rouge) :**
- QR code inexistant
- Paiement non confirmé
- Réservation annulée
- **REFUSE l'entrée**

---

## 📊 Statistiques en Temps Réel

### Sur `/admin/events` :

Pour chaque événement, vous voyez :
- **Jauge visuelle** : Barre de progression colorée
- **Billets vendus / Total** : Ex: 45 / 100
- **Disponibles** : Places restantes
- **Taux de remplissage** : Pourcentage

### Sur `/admin/rendez-vous` :

Vue globale avec 4 cartes KPI :
1. **Total Événements** (bleu)
2. **Billets Vendus** (vert)
3. **Revenu Total** (or)
4. **Commission 10%** (violet)

Chaque événement affiche :
- Image de couverture
- Badge de statut (Disponible, Complet, Terminé, Inactif)
- Badge d'approbation (Approuvé, En attente)
- Catégories de billets avec ventes
- Calcul automatique : Revenu total & Commission

### Sur `/admin/bookings` :

4 cartes statistiques :
1. **Total Réservations**
2. **Confirmées** (paiement réussi)
3. **Check-ins** (billets validés)
4. **Revenu Total**

---

## 🔄 Flux Complet d'un Événement

### 1. Création de l'Événement

**Admin → `/admin/events` → "Nouvel Événement"**

Remplir :
- Titre de l'événement
- Type (Concert, Festival, Soirée, etc.)
- Description courte
- Date et heure
- Ville et lieu (venue)
- **Catégories de billets** :
  - Nom (ex: VIP, Standard)
  - Prix en €
  - Quota (nombre de places)
- Politique d'annulation
- Min/Max billets par commande
- Actif : OUI

### 2. Achat par un Client

**Client → `/rendez-vous/{slug}` → "Réserver"**

Le client :
1. Sélectionne une catégorie
2. Choisit la quantité
3. Remplit ses informations
4. Procède au paiement Stripe

### 3. Confirmation Automatique

**Système :**
1. Stripe envoie le webhook `checkout.session.completed`
2. Le système :
   - Confirme la réservation
   - Génère le QR Code unique
   - Envoie l'email au client avec le billet
   - Envoie l'email à l'organisateur (notification de vente)
   - Met à jour les compteurs de billets

### 4. Emails Automatiques

**Email Client :**
- Sujet : `🎫 Votre billet pour {Événement} - ALTESS`
- Contenu : Récapitulatif + QR Code + Bouton téléchargement
- Design : Fond noir, accents or, look gala

**Email Organisateur :**
- Sujet : `💰 Nouvelle vente enregistrée ! - {Événement}`
- Contenu : Info client + Montant + Commission
- Design : Même style élégant

### 5. Jour de l'Événement

**À l'entrée :**

Admin → `/admin/scanner`

1. Active le scanner
2. Scanne chaque QR code
3. Le système vérifie automatiquement :
   - ✅ Billet existe
   - ✅ Paiement confirmé
   - ✅ Pas déjà utilisé
4. Si tout est OK : **Entrée autorisée**
5. Le billet est marqué comme "Check-in validé"

### 6. Après l'Événement

**Analyse :**

Admin → `/admin/rendez-vous` ou `/admin/bookings`

- Consulter les statistiques finales
- Télécharger la liste des participants (CSV)
- Voir le taux de présence (check-ins vs billets vendus)
- Calculer les revenus et commissions

---

## 🎨 Calcul des Commissions

### Formule Automatique

Pour chaque événement :

```
Revenu Brut = Σ (Prix × Quantité vendues) pour toutes les catégories
Commission ALTESS (10%) = Revenu Brut × 0,10
Net Organisateur (90%) = Revenu Brut × 0,90
```

### Exemple Concret

**Événement : Concert de Oud Oriental**

**Catégories :**
- VIP : 50€ × 20 vendus = 1 000€
- Standard : 30€ × 50 vendus = 1 500€
- Enfant : 15€ × 10 vendus = 150€

**Calculs :**
- **Revenu Brut** : 1 000€ + 1 500€ + 150€ = **2 650€**
- **Commission ALTESS (10%)** : 2 650€ × 0,10 = **265€**
- **Net Organisateur** : 2 650€ × 0,90 = **2 385€**

Ces calculs sont **affichés automatiquement** sur `/admin/rendez-vous`.

---

## 🔐 Sécurité

### QR Code Unique

Chaque réservation génère un QR Code au format :
```
ALTESS-TICKET-{booking_id}-{booking_reference}
```

Exemple : `ALTESS-TICKET-123e4567-e89b-12d3-a456-426614174000-BK-20260127-ABC123`

### Protection Anti-Fraude

✅ **Validations automatiques :**
1. Le QR code doit exister en base de données
2. Le statut doit être "confirmed"
3. Le paiement doit être "succeeded"
4. Le billet ne doit pas être déjà utilisé (checked_in = false)

❌ **Si une condition échoue** :
- Entrée refusée
- Message d'erreur clair
- Log de la tentative

### Traçabilité

Chaque check-in enregistre :
- `checked_in` : true
- `checked_in_at` : Timestamp exact
- `checked_in_by` : ID de l'admin qui a scanné

---

## 📱 Mobile-Friendly

Toutes les interfaces admin sont **responsive** :

✅ **Sur smartphone :**
- Cartes empilées verticalement
- Tableaux défilables horizontalement
- Scanner QR utilise la caméra arrière du téléphone
- Navigation simplifiée

✅ **Sur tablette :**
- Grille 2 colonnes pour les cartes
- Tableaux complets visibles
- Interface tactile optimisée

---

## 💡 Conseils d'Utilisation

### Pour les Événements

1. **Créez vos événements à l'avance** (minimum 1 semaine avant)
2. **Testez le QR code** sur quelques billets tests
3. **Désactivez les événements complets** pour éviter les frustrations
4. **Exportez la liste des participants** 24h avant pour préparer l'accueil

### Pour le Scanner

1. **Utilisez une tablette ou smartphone** pour plus de mobilité
2. **Préparez plusieurs scanners** pour les gros événements (éviter la file)
3. **Testez la caméra avant** l'arrivée des invités
4. **Mode manuel en backup** si problème de caméra
5. **Vérifiez la connexion internet** (requis pour validation temps réel)

### Pour les Statistiques

1. **Consultez quotidiennement** pour suivre les ventes
2. **Relancez les événements** qui se vendent lentement (pub, newsletter)
3. **Exportez les données** pour vos rapports financiers
4. **Comparez** les événements entre eux pour identifier les best-sellers

---

## 🚀 Raccourcis Rapides

| Action | URL Directe |
|--------|-------------|
| Dashboard Admin | `/admin` |
| Créer un événement | `/admin/events` → Bouton "Nouvel Événement" |
| Voir toutes les réservations | `/admin/bookings` |
| Scanner les billets | `/admin/scanner` |
| Statistiques globales | `/admin/rendez-vous` |
| Liste d'un événement | `/admin/events` → Icône téléchargement |

---

## 📞 Support Technique

En cas de problème :

1. **Vérifiez la console du navigateur** (F12) pour les erreurs
2. **Vérifiez les logs Supabase** pour les problèmes de base de données
3. **Testez avec la carte Stripe test** : `4242 4242 4242 4242`
4. **Vérifiez que RESEND_API_KEY** est configurée pour les emails

---

## ✅ Checklist de Lancement

Avant votre premier événement en production :

- [ ] Événement créé avec toutes les informations
- [ ] Catégories de billets configurées avec prix et quotas
- [ ] Événement activé (is_active = true)
- [ ] Clé Stripe en mode LIVE configurée
- [ ] RESEND_API_KEY configurée et testée
- [ ] Webhook Stripe configuré
- [ ] Page événement testée (`/rendez-vous/{slug}`)
- [ ] Test d'achat avec vraie carte réalisé
- [ ] Email client reçu avec QR code
- [ ] Email organisateur reçu avec notification
- [ ] Scanner QR testé et fonctionnel
- [ ] Export CSV des participants testé

---

**Version :** 1.0
**Dernière mise à jour :** 27 janvier 2026
**Système :** Opérationnel ✅

🎉 **Votre système de billetterie est prêt pour le déploiement en production !**
