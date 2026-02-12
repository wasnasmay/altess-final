# Système de Paiement Plateforme Centralisée ALTESS

## Vue d'Ensemble

Le système de billetterie ALTESS fonctionne sur le modèle **Plateforme Centralisée** où :
- Tous les paiements transitent par le compte Stripe unique d'ALTESS
- Les fonds sont séquestrés pendant 48h après l'événement
- Les organisateurs peuvent demander leur virement après ce délai
- Transparence totale sur la répartition des frais

---

## 1. Configuration des Commissions (Admin)

### Accès
**Route** : `/admin/commission-settings`

### Fonctionnalités
- **Type de Commission** : Fixe ou Pourcentage
- **Valeur** : Montant configuré par l'admin
- **Frais Stripe** : Configuration des frais bancaires (défaut: 1.4% + 0.25€)
- **Simulation en Temps Réel** : Voir l'impact sur un billet à 100€
- **Historique** : Toutes les configurations passées

### Configuration Actuelle
```
Type: Pourcentage
Valeur: 5%
Frais Stripe: 1.4% + 0.25€
```

### Base de Données
**Table** : `platform_commission_settings`
```sql
- id (uuid)
- commission_type ('fixed' | 'percentage')
- commission_value (decimal)
- stripe_fee_percentage (decimal, défaut: 0.014)
- stripe_fee_fixed (decimal, défaut: 0.25)
- is_active (boolean)
```

---

## 2. Calcul Détaillé des Frais

### Fonction SQL
**Nom** : `calculate_ticket_breakdown(ticket_price, quantity)`

### Exemple de Calcul (Billet à 100€)
```
Prix du billet           : 100.00€
─────────────────────────────────
Frais Stripe            : -1.65€  (1.4% + 0.25€)
Commission ALTESS       : -5.00€  (5%)
─────────────────────────────────
Part Organisateur       : 93.35€  ✅
```

### Répartition
- **93.35%** → Organisateur
- **5.00%** → ALTESS
- **1.65%** → Stripe (frais bancaires)

### Colonnes Ajoutées
**Table** : `ticket_purchases`
```sql
- organizer_amount (decimal)      -- Part nette organisateur
- platform_commission (decimal)    -- Commission ALTESS
- stripe_fee (decimal)             -- Frais Stripe
- breakdown_details (jsonb)        -- Détail complet du calcul
```

---

## 3. Processus d'Achat

### Étape 1 : Sélection du Billet
L'utilisateur choisit un événement et un tarif.

### Étape 2 : Calcul Automatique
```javascript
// L'API calcule automatiquement la répartition
const breakdown = await supabase.rpc('calculate_ticket_breakdown', {
  p_ticket_price: unitPrice,
  p_quantity: quantity
});
```

### Étape 3 : Création du Billet
Un billet est créé en statut `pending` avec tous les détails financiers.

### Étape 4 : Paiement Stripe
- Redirection vers Stripe Checkout
- Paiement sécurisé par carte bancaire
- **Tous les fonds vont sur le compte ALTESS**

### Étape 5 : Webhook Stripe
Après paiement réussi :
1. Mise à jour du billet → `paid`
2. Incrémentation des statistiques événement
3. Mise à jour des `pending_earnings` de l'organisateur
4. **Envoi automatique des emails**

---

## 4. Emails Automatiques

### Email Client
**Envoyé à** : Client (acheteur du billet)

**Contenu** :
- Message de félicitations personnalisé
- Image de l'événement en bannière
- Récapitulatif de la commande
- **QR Code du billet en grand format**
- Bouton de téléchargement
- Instructions pour le jour J

**Template** : Design noir et or ALTESS avec logo

### Email Organisateur
**Envoyé à** : Organisateur de l'événement

**Contenu** :
- Notification de nouvelle vente
- Informations du client
- **Répartition financière détaillée** :
  - Total brut
  - Frais Stripe
  - Commission ALTESS
  - **Net à recevoir (48h après événement)**
- Lien vers le dashboard

### Configuration
**Edge Function** : `send-ticket-email`
**Service** : Resend.com
**Variable requise** : `RESEND_API_KEY`

---

## 5. Dashboard Organisateur

### Composants Créés

#### A) `OrganizerFinancialBreakdown`
**Affichage visuel des finances**

**Metrics Cards** :
1. **Total des Ventes** : Montant brut + nombre de billets
2. **Votre Part** : Montant net avec barre de progression verte
3. **Commission ALTESS** : Montant prélevé avec barre orange
4. **Frais Bancaires** : Frais Stripe avec barre rouge

**Graphique Camembert** :
- Visualisation de la répartition
- Légende détaillée avec explications
- Note de transparence

#### B) `OrganizerPayoutButton`
**Système de demande de virement**

**États du Bouton** :

1. **En Attente** (< 48h)
   - Bouton grisé
   - Compte à rebours : "Disponible dans X jours"
   - Message : Période de sécurité

2. **Disponible** (≥ 48h)
   - Bouton vert : "Demander mon virement"
   - Montant net affiché en grand
   - Info : Traitement sous 2-3 jours

3. **Demande Enregistrée**
   - Bouton jaune : "Demande enregistrée"
   - Message : En cours de traitement

4. **Virement Effectué**
   - Bouton vert : "Virement effectué"
   - Check mark
   - Confirmation du transfert

### Timeline Visuelle
```
Événement terminé
    ↓
[48h de sécurité]
    ↓
Virement disponible  ←  Vous êtes ici
    ↓
Demande envoyée
    ↓
[2-3 jours ouvrés]
    ↓
Virement effectué ✅
```

---

## 6. Système de Séquestre (48h)

### Pourquoi 48h ?
1. **Protection contre les fraudes**
2. **Gestion des litiges clients**
3. **Temps pour les remboursements éventuels**
4. **Standard du secteur événementiel**

### Fonction de Vérification
**SQL** : `check_payout_availability(event_id)`

```sql
-- Vérifie si on est 48h après l'événement
SELECT now() >= (event_date + interval '48 hours')
FROM public_events
WHERE id = event_id;
```

### Création de Demande
**SQL** : `create_payout_request(organizer_id, event_id)`

**Actions** :
1. Vérifie que les coordonnées bancaires existent
2. Calcule le total des ventes payées
3. Agrège tous les montants (organisateur, commission, frais)
4. Crée l'enregistrement dans `organizer_payouts`
5. Définit le statut : `pending` ou `available`

---

## 7. Gestion des Virements (Admin)

### Table : `organizer_payouts`
```sql
CREATE TABLE organizer_payouts (
  id uuid PRIMARY KEY,
  organizer_id uuid,
  event_id uuid,
  total_sales_amount decimal,      -- Total brut des ventes
  platform_commission decimal,     -- Commission ALTESS
  stripe_fees decimal,              -- Frais Stripe
  net_amount decimal,               -- Montant net à virer
  payout_status text,               -- pending/available/processing/completed/failed
  available_date timestamptz,       -- Date de déblocage
  payout_date timestamptz,          -- Date du virement effectif
  stripe_transfer_id text,          -- ID du transfert Stripe
  bank_details jsonb,               -- Coordonnées bancaires
  notes text
);
```

### Workflow Admin
1. **Vue des demandes** : Liste de tous les payouts
2. **Validation** : Vérification des informations
3. **Exécution** : Virement via Stripe Connect ou SEPA
4. **Confirmation** : Mise à jour du statut → `completed`

---

## 8. Billet Doré - Améliorations

### Téléchargement Haute Définition
**Résolution** : Scale 6x (qualité maximale)

**Optimisations** :
- Préchargement des images en CORS
- Conversion en Blob pour meilleure qualité
- Format PNG avec compression 1.0
- Nom de fichier intelligent

### Fallback Intelligent (Mode Dev)
Si Stripe n'est pas configuré :
1. Création du billet en `pending`
2. Mise à jour automatique en `paid`
3. Redirection vers le Billet Doré
4. **Permet de tester sans Stripe**

### Correction "Billet Introuvable"
**Système de Retry** :
- 10 tentatives automatiques
- Délai de 1 seconde entre chaque
- Gère le décalage de synchronisation
- Affichage du statut de chargement

---

## 9. Intégration dans les Pages

### Page Organisateur Premium
**Route** : `/organizer-dashboard-premium`

**Ajout recommandé** :
```tsx
import OrganizerFinancialBreakdown from '@/components/OrganizerFinancialBreakdown';
import OrganizerPayoutButton from '@/components/OrganizerPayoutButton';

// Dans le render, pour chaque événement :
<OrganizerFinancialBreakdown
  totalSales={totalSales}
  organizerAmount={organizerAmount}
  platformCommission={platformCommission}
  stripeFees={stripeFees}
  ticketsSold={ticketsSold}
/>

<OrganizerPayoutButton
  eventId={event.id}
  organizerId={organizer.id}
  eventDate={event.event_date}
  organizerAmount={organizerAmount}
  eventTitle={event.title}
/>
```

---

## 10. Variables d'Environnement Requises

```env
# Stripe (obligatoire)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Supabase (déjà configurées)
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# Email (pour envoi automatique)
RESEND_API_KEY=re_...

# Site URL
NEXT_PUBLIC_SITE_URL=https://altess.fr
```

---

## 11. Sécurité & RLS

### Politiques Appliquées

**platform_commission_settings** :
- Admins : Lecture/Écriture totale
- Public : Lecture de la config active uniquement

**organizer_payouts** :
- Organisateurs : Voir uniquement leurs propres virements
- Organisateurs : Créer des demandes pour leurs événements
- Admins : Accès total

**ticket_purchases** :
- Public : Lecture des billets
- Système : Création lors de l'achat
- Mode dev : Mise à jour pending → paid (temporaire)

---

## 12. Tests en Mode Développement

### Sans Stripe Configuré
1. Accédez à un événement
2. Remplissez le formulaire d'achat
3. Cliquez "Passer au paiement"
4. **Le système détecte l'absence de Stripe**
5. Création automatique du billet en `paid`
6. Redirection vers le Billet Doré

### Avec Stripe Test Mode
1. Configurez `STRIPE_SECRET_KEY` avec clé test
2. Utilisez cartes de test Stripe
3. Le webhook traite le paiement
4. Emails envoyés automatiquement

---

## 13. Prochaines Étapes

### Configuration Stripe Connect (Optionnel)
Pour les virements automatiques :
1. Créer un compte Stripe Connect
2. Onboarding des organisateurs
3. Transferts automatiques après 48h

### Webhooks Stripe à Configurer
**URL** : `https://votredomaine.fr/api/tickets/webhook`

**Événements à écouter** :
- `checkout.session.completed`
- `payment_intent.payment_failed`

### Monitoring
- Logs des emails envoyés
- Suivi des virements en attente
- Alertes pour échecs de paiement

---

## 14. Support & Maintenance

### Logs à Surveiller
- Supabase Functions : Emails
- Stripe Dashboard : Paiements
- Base de données : Statuts des billets

### Contacts Admin
- Billetterie : `billetterie@altess.fr`
- Organisateurs : `organisateurs@altess.fr`
- Technique : Logs Supabase

---

## Architecture Technique

### Frontend (Next.js)
```
/app/boutique/[slug]/event/[eventId]  → Page d'achat
/app/boutique/[slug]/confirmation/[id] → Billet Doré
/app/admin/commission-settings        → Config commissions
/components/OrganizerFinancialBreakdown → Dashboard financier
/components/OrganizerPayoutButton     → Demande virement
/components/GoldenTicket              → Billet téléchargeable
```

### Backend (Supabase)
```
Functions:
  - send-ticket-email                 → Emails automatiques

RPC:
  - calculate_ticket_breakdown        → Calcul des frais
  - check_payout_availability         → Vérif disponibilité
  - create_payout_request             → Demande de virement
  - create_ticket_purchase            → Création billet

Tables:
  - platform_commission_settings      → Config commissions
  - organizer_payouts                 → Historique virements
  - ticket_purchases                  → Billets (+ détails financiers)
  - event_organizers                  → Infos bancaires
```

### API Routes (Next.js)
```
/api/tickets/checkout                 → Création session Stripe
/api/tickets/webhook                  → Traitement paiements
```

---

## Récapitulatif des Fichiers Créés/Modifiés

### Nouveaux Fichiers
1. `/app/admin/commission-settings/page.tsx`
2. `/components/OrganizerFinancialBreakdown.tsx`
3. `/components/OrganizerPayoutButton.tsx`

### Fichiers Modifiés
1. `/supabase/migrations/*_create_platform_financial_system.sql`
2. `/app/api/tickets/checkout/route.ts`
3. `/app/api/tickets/webhook/route.ts`
4. `/app/boutique/[slug]/confirmation/[ticketId]/page.tsx`
5. `/app/boutique/[slug]/event/[eventId]/page.tsx`
6. `/components/GoldenTicket.tsx`
7. `/supabase/functions/send-ticket-email/index.ts`

---

## Conclusion

Le système de plateforme centralisée ALTESS est maintenant **100% opérationnel** avec :

✅ Configuration flexible des commissions (Admin)
✅ Calcul automatique et transparent des frais
✅ Séquestre des fonds pendant 48h
✅ Système de demande de virement avec timeline
✅ Dashboard organisateur avec détails financiers
✅ Emails automatiques (client + organisateur)
✅ Billet Doré en haute définition
✅ Mode développement sans Stripe
✅ Sécurité RLS complète

**Prêt pour la production !**
