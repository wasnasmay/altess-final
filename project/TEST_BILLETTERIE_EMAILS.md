# 🎫 Guide de Test - Emails Automatiques Billetterie

## ✅ Prérequis Validés

- ✅ RESEND_API_KEY configurée et testée
- ✅ Edge Function `send-ticket-email` déployée
- ✅ Templates HTML élégants (Noir & Or)
- ✅ Webhook Stripe intégré
- ✅ QR Code automatique
- ✅ Double envoi (Client + Organisateur)

---

## 🚀 Test en 5 Minutes

### Étape 1 : Accéder à un Événement Test

Allez sur l'un de ces événements de démonstration :
```
/rendez-vous/concert-oud-oriental
/rendez-vous/stage-danse-orientale
/rendez-vous/diner-spectacle-mediterraneen
```

### Étape 2 : Créer une Réservation

1. Cliquez sur **"Réserver vos places"**
2. Sélectionnez une catégorie (ex: VIP - 50€)
3. Choisissez la quantité (ex: 2 billets)
4. Remplissez vos informations :
   - **Email :** Utilisez votre email réel pour recevoir le billet
   - **Nom :** Votre nom complet
   - **Téléphone :** Optionnel

### Étape 3 : Paiement Stripe Test

Utilisez la carte de test Stripe :
```
Numéro : 4242 4242 4242 4242
Date : 12/26 (n'importe quelle date future)
CVC : 123 (n'importe quel code)
```

### Étape 4 : Validation

Cliquez sur **"Payer"**

---

## 📬 Emails que Vous Allez Recevoir

### 1️⃣ Email Client (Votre Billet)

**De :** `ALTESS Billetterie <billetterie@altess.fr>`

**Sujet :** `🎫 Votre billet pour [Nom de l'événement] - ALTESS`

**Contenu attendu :**
- ✨ Message de félicitations personnalisé avec votre nom
- 📋 Tableau récapitulatif élégant :
  - 📅 Date : samedi 15 février 2026
  - 📍 Lieu : Théâtre Oriental de Paris
  - 🎫 Catégorie : VIP
  - 🔢 Quantité : 2 billets
  - 💰 Total payé : 100,00 €
- **📱 QR CODE en haute résolution** (500x500px)
  - Fond blanc, bordure or
  - Format : `ALTESS-TICKET-{id}-{reference}`
- 📥 Bouton "TÉLÉCHARGER MON BILLET"
- ⚠️ Instructions importantes (arrivée 30min avant, etc.)

**Design :**
- Header dégradé or avec logo ALTESS
- Image de l'événement en hero
- Fond sombre avec accents dorés
- Look invitation gala professionnelle

### 2️⃣ Email Organisateur (Si Configuré)

**De :** `ALTESS Notifications <notifications@altess.fr>`

**Sujet :** `💰 Nouvelle vente enregistrée ! - [Nom de l'événement]`

**Contenu attendu :**
- 🎉 Badge "Nouvelle Vente Enregistrée" en vert
- 👤 Informations du client :
  - Nom
  - Email
  - Téléphone (si fourni)
- 💵 Détails financiers :
  - Total brut : 100,00 €
  - Commission ALTESS (10%) : 10,00 €
  - **Net à recevoir : 90,00 €**
- 📊 Bouton "VOIR MON TABLEAU DE BORD"

---

## 🔍 Vérifications Post-Test

### Dans la Base de Données

1. **Table `event_bookings` :**
   ```sql
   SELECT * FROM event_bookings
   WHERE customer_email = 'votre-email@test.com'
   ORDER BY created_at DESC LIMIT 1;
   ```

   Vérifier :
   - ✅ `status` = 'confirmed'
   - ✅ `payment_status` = 'succeeded'
   - ✅ `qr_code_data` est rempli
   - ✅ `stripe_payment_intent_id` présent
   - ✅ `confirmed_at` avec timestamp

2. **Table `public_events` :**
   ```sql
   SELECT ticket_categories, tickets_sold
   FROM public_events
   WHERE slug = 'concert-oud-oriental';
   ```

   Vérifier :
   - ✅ `tickets_sold` augmenté
   - ✅ `ticket_categories[].sold` mis à jour

3. **Table `event_notifications` :**
   ```sql
   SELECT * FROM event_notifications
   WHERE notification_type = 'new_booking'
   ORDER BY created_at DESC LIMIT 1;
   ```

   Vérifier :
   - ✅ Notification créée pour l'organisateur
   - ✅ `email_sent` = false (sera true après envoi)

### Dans l'Interface Admin

1. Allez sur `/admin/events`
2. Vérifiez que le nombre de billets vendus est mis à jour
3. Cliquez sur l'événement pour voir les détails
4. Vérifiez la présence du nouveau booking

---

## 📱 Test du QR Code Scanner

### Dans l'Admin Dashboard

1. Allez sur `/admin/events`
2. Cliquez sur "Scanner les billets"
3. Autorisez l'accès à la caméra
4. **Scannez le QR Code** reçu par email :
   - ✅ Le système doit reconnaître le billet
   - ✅ Afficher les infos du client
   - ✅ Permettre de valider l'entrée
5. **Validez l'entrée** (bouton "Check-in")
6. **Vérification :**
   - Le billet ne peut plus être utilisé
   - `checked_in` = true
   - `checked_in_at` = timestamp
   - `checked_in_by` = votre user_id

---

## 🎨 Aperçu Visuel des Emails

### Email Client - Sections Clés

```
┌─────────────────────────────────────────┐
│   🏛️  ALTESS - EXCELLENCE ORIENTALE     │  ← Header Or
├─────────────────────────────────────────┤
│     [IMAGE DE L'ÉVÉNEMENT]              │  ← Hero 300px
│                                         │
│     🎭 Nom de l'événement               │
└─────────────────────────────────────────┘
│                                         │
│  🎉 Félicitations [Nom du client] !     │  ← Message perso
│                                         │
├─────────────────────────────────────────┤
│  📋 RÉCAPITULATIF DE VOTRE COMMANDE     │
│                                         │
│  📅 Date : samedi 15 février 2026       │
│  📍 Lieu : Théâtre Oriental             │
│  🎫 Catégorie : VIP                     │
│  🔢 Quantité : 2 billets                │
│  💰 Total payé : 100,00 €               │
└─────────────────────────────────────────┘
│                                         │
│    VOTRE BILLET ÉLECTRONIQUE            │
│                                         │
│    ┌─────────────────────┐             │
│    │                     │             │
│    │   [QR CODE 500x500] │             │  ← QR Code HD
│    │                     │             │
│    └─────────────────────┘             │
│                                         │
│    Billet N° ABC-123456                 │
│                                         │
│  [📥 TÉLÉCHARGER MON BILLET]           │  ← CTA Or
│                                         │
└─────────────────────────────────────────┘
```

### Email Organisateur - Sections Clés

```
┌─────────────────────────────────────────┐
│   🏛️  ALTESS - EXCELLENCE ORIENTALE     │  ← Header Or
├─────────────────────────────────────────┤
│                                         │
│        💰                               │
│   NOUVELLE VENTE ENREGISTRÉE !          │  ← Badge vert
│   Un billet vient d'être vendu          │
│                                         │
├─────────────────────────────────────────┤
│  DÉTAILS DE LA TRANSACTION              │
│                                         │
│  🎭 Événement : Concert de Oud          │
│  👤 Client : Jean Dupont                │
│  📧 Email : jean@example.com            │
│  🎫 Catégorie : VIP                     │
│  🔢 Quantité : 2 billets                │
│  💵 Montant : 100,00 €                  │
└─────────────────────────────────────────┘
│                                         │
│  💡 INFORMATIONS FINANCIÈRES            │
│                                         │
│  Total brut : 100,00 €                  │
│  Commission ALTESS (10%) : 10,00 €      │
│  Net à recevoir : 90,00 €               │  ← Focus or
│                                         │
│  [📊 VOIR MON TABLEAU DE BORD]         │  ← CTA Or
│                                         │
└─────────────────────────────────────────┘
```

---

## 🐛 Dépannage

### Email non reçu ?

1. **Vérifier les logs Supabase :**
   ```
   /admin → Logs → Edge Functions → send-ticket-email
   ```

2. **Vérifier le webhook Stripe :**
   - Aller sur Stripe Dashboard
   - Webhooks → Événements récents
   - Vérifier `checkout.session.completed`

3. **Vérifier la console :**
   ```javascript
   console.log('Ticket emails sent successfully');
   // ou
   console.error('Failed to send ticket email');
   ```

### QR Code non généré ?

Vérifier dans `event_bookings` :
```sql
SELECT qr_code_data FROM event_bookings
WHERE id = 'votre-booking-id';
```

Si NULL, le webhook n'a pas été déclenché correctement.

### Commission incorrecte ?

Le calcul est automatique :
- **Commission ALTESS :** 10% du montant total
- **Net organisateur :** 90% du montant total

Formules :
```javascript
commission = totalAmount * 0.10
netToOrganizer = totalAmount * 0.90
```

---

## 📊 Métriques de Test Réussi

✅ Email client reçu en < 30 secondes
✅ Email organisateur reçu en < 30 secondes
✅ QR Code visible et scannable
✅ Design élégant (Noir & Or)
✅ Toutes les informations présentes
✅ Bouton de téléchargement fonctionnel
✅ Compteur de billets mis à jour
✅ Notification admin créée

---

## 🎯 Résultat Attendu

Après le test, vous devriez avoir :
- 📧 Un email professionnel avec votre billet et QR Code
- 💰 Une notification de vente pour l'organisateur
- 📊 Des statistiques mises à jour dans l'admin
- ✅ Un système de billetterie complet et fonctionnel

**Le système est maintenant prêt pour la production ! 🚀**

---

**Date de test :** 27 janvier 2026
**Status :** ✅ OPÉRATIONNEL
**Version :** 1.0
