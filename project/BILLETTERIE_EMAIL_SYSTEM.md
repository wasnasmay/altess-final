# 🎫 Système d'Emails Automatiques pour la Billetterie ALTESS

## Vue d'ensemble

Le système d'emails automatiques envoie des billets électroniques professionnels aux clients et des notifications aux organisateurs lors de chaque vente de billet.

---

## 📧 Types d'Emails

### 1. Email Client (Après Achat)

**Destinataire :** Client ayant acheté des billets

**Sujet :** `🎫 Votre billet pour [Nom de l'événement] - ALTESS`

**Contenu :**
- ✨ Message de félicitations personnalisé
- 📋 Récapitulatif détaillé de la commande
  - Date et heure de l'événement
  - Lieu (venue)
  - Catégorie de place (VIP, Standard, etc.)
  - Quantité de billets
  - Montant total payé
- 📱 **QR Code du billet** (haute résolution 500x500px)
- 📥 Bouton de téléchargement du billet
- ⚠️ Instructions importantes pour l'événement

**Design :** Fond sombre élégant, textes dorés et blancs, logo ALTESS en header, look gala professionnel

### 2. Email Organisateur (Notification de Vente)

**Destinataire :** Organisateur de l'événement

**Sujet :** `💰 Nouvelle vente enregistrée ! - [Nom de l'événement]`

**Contenu :**
- 🎉 Notification de nouvelle vente
- 👤 Informations du client
  - Nom complet
  - Email
  - Téléphone (si fourni)
- 🎫 Détails de la transaction
  - Catégorie achetée
  - Quantité de billets
  - Montant brut
- 💡 Calcul automatique des commissions
  - Total brut
  - Commission ALTESS (10%)
  - **Net à recevoir (90%)**
- 📊 Lien vers le tableau de bord admin

**Design :** Même style élégant que l'email client avec focus sur les données financières

---

## 🔧 Architecture Technique

### Edge Function : `send-ticket-email`

**Localisation :** `/supabase/functions/send-ticket-email/index.ts`

**Service d'envoi :** Resend API (clé RESEND_API_KEY configurée)

**Endpoints :**
- Client : `billetterie@altess.fr`
- Organisateur : `notifications@altess.fr`

### Intégration Stripe Webhook

**Fichier :** `/app/api/events/webhook/route.ts`

**Flux d'exécution :**

1. **Réception du webhook Stripe** (`checkout.session.completed`)
2. **Mise à jour du booking** (status: confirmed, payment_status: succeeded)
3. **Génération du QR Code**
   - Format : `ALTESS-TICKET-{booking_id}-{booking_reference}`
   - Service : QR Server API (https://api.qrserver.com)
   - Taille : 500x500px, fond blanc, noir sur blanc, margin 20px
4. **Récupération des informations de l'organisateur**
   - Email depuis la table `profiles`
   - Nom complet de l'organisateur
5. **Appel à l'Edge Function `send-ticket-email`**
   - Envoi simultané des 2 emails (client + organisateur)
6. **Mise à jour du compteur de billets vendus**

---

## 📊 Données Transmises

```typescript
interface TicketEmailRequest {
  ticketId: string;              // Référence du billet
  customerName: string;          // Nom du client
  customerEmail: string;         // Email du client
  eventTitle: string;            // Titre de l'événement
  eventDate: string;             // Date de l'événement
  eventVenue: string;            // Lieu de l'événement
  categoryName: string;          // Catégorie de billet (VIP, Standard...)
  categoryPrice: number;         // Prix unitaire
  quantity: number;              // Nombre de billets
  totalAmount: number;           // Montant total
  qrCodeUrl: string;             // URL du QR Code généré
  eventImage?: string;           // Image de l'événement (optionnelle)
  organizerEmail?: string;       // Email de l'organisateur
  organizerName?: string;        // Nom de l'organisateur
}
```

---

## 🎨 Design des Templates

### Palette de Couleurs ALTESS

- **Or principal :** `#D4AF37`
- **Or clair :** `#F4E4B0`
- **Noir fond :** `#000000`
- **Noir card :** `#1a1a1a`
- **Blanc texte :** `#FFFFFF`
- **Gris secondaire :** `#AAAAAA`

### Éléments de Design

1. **Header Dégradé Or**
   - Logo ALTESS en grandes lettres espacées
   - Sous-titre "EXCELLENCE ORIENTALE"
   - Effet de brillance avec gradient radial

2. **Image de l'événement**
   - Full-width, hauteur 300px
   - Overlay gradient noir en bas
   - Titre de l'événement en or sur l'overlay

3. **Sections à Bordure Or**
   - Fond semi-transparent
   - Bordure gauche or de 4px
   - Textures et dégradés subtils

4. **QR Code Section**
   - Fond blanc pur pour contraste maximum
   - QR Code centré avec bordure or
   - Numéro de billet en police monospace

5. **Boutons CTA**
   - Dégradé or horizontal
   - Texte noir en gras
   - Shadow or pour effet de profondeur
   - Coins arrondis (50px pour effet pilule)

---

## 🔐 Sécurité

- ✅ QR Code unique et non-réutilisable
- ✅ Vérification de la signature Stripe
- ✅ Service role key pour accès sécurisé à Supabase
- ✅ Validation des métadonnées avant traitement
- ✅ Logs de toutes les transactions

---

## 📱 Scan des Billets

### Processus de Validation

1. **Scanner le QR Code** via l'interface admin `/admin/events`
2. **Format du QR Code :** `ALTESS-TICKET-{booking_id}-{booking_reference}`
3. **Vérification en base de données :**
   - Booking existe
   - Status = confirmed
   - Pas encore check-in (checked_in = false)
4. **Marquage du billet comme utilisé**
   - checked_in = true
   - checked_in_at = timestamp actuel
   - checked_in_by = ID de l'admin

---

## 🧪 Test du Système

### Pour tester l'envoi d'emails :

1. **Aller sur un événement avec billetterie** (ex: `/rendez-vous/[slug]`)
2. **Cliquer sur "Réserver"**
3. **Utiliser une carte de test Stripe :**
   - Numéro : `4242 4242 4242 4242`
   - Date : n'importe quelle date future
   - CVC : n'importe quel code à 3 chiffres
4. **Compléter le paiement**
5. **Vérifier la réception :**
   - Email client avec QR Code
   - Email organisateur avec notification de vente

### Données de test disponibles

Les événements de test créés incluent :
- Concert de Oud Oriental
- Stage de Danse Orientale
- Dîner-Spectacle Méditerranéen

---

## 📈 Métriques et Suivi

Le système enregistre automatiquement :
- ✅ Nombre total de billets vendus
- ✅ Montant total des ventes
- ✅ Commission ALTESS (10%)
- ✅ Net à reverser aux organisateurs
- ✅ Notifications dans `event_notifications`
- ✅ Historique des check-ins

---

## 🛠️ Configuration Requise

### Variables d'Environnement

```env
# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Resend (déjà configuré)
RESEND_API_KEY=re_...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### Edge Function Déployée

```bash
✅ send-ticket-email (déployée et fonctionnelle)
```

---

## 🎯 Prochaines Étapes

- [ ] Ajouter des rappels d'événements (J-7, J-1)
- [ ] Export PDF des billets
- [ ] Statistiques détaillées par événement
- [ ] Templates d'emails personnalisables par organisateur
- [ ] Support multi-langues (FR/EN/AR)

---

## 📞 Support

Pour toute question technique :
- Email technique : `tech@altess.fr`
- Email billetterie : `billetterie@altess.fr`
- Email organisateurs : `organisateurs@altess.fr`

---

**Version :** 1.0
**Dernière mise à jour :** 27 janvier 2026
**Système :** Opérationnel ✅
