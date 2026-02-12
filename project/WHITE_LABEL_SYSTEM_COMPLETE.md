# Système White Label ALTESS - Documentation Complète

## 🎯 Objectif

Transformer ALTESS en plateforme de billetterie prestige avec mini-sites white label pour organisateurs d'événements. Chaque organisateur dispose de sa propre boutique isolée, sans publicité concurrente, avec un dashboard complet niveau Billetweb.

---

## 🏗️ Architecture Générale

### Base de Données

#### Table `event_organizers`
Profil complet de l'organisateur avec système white label.

**Colonnes principales** :
- `id` : UUID unique
- `user_id` : Lien vers auth.users
- `company_name` : Nom de l'entreprise
- `slug` : URL unique (ex: `oriental-prestige`)
- `logo_url` : Logo de l'organisateur
- `brand_color` : Couleur de marque (#F59E0B par défaut)
- **Réseaux sociaux** : `instagram_url`, `facebook_url`, `tiktok_url`, `twitter_url`, `linkedin_url`
- **Tracking** : `facebook_pixel_id`, `google_analytics_id`, `google_ads_conversion_id`
- **Configuration** : `show_altess_branding`, `allow_ticket_transfer`, `enable_waitlist`
- **Stats** : `total_events`, `total_tickets_sold`, `total_revenue`
- **Statut** : `status` (active/suspended), `verified`, `premium_tier`

#### Table `promo_codes`
Codes promotionnels par organisateur et événement.

**Colonnes** :
- `organizer_id` : Organisateur propriétaire
- `event_id` : Événement ciblé (optionnel)
- `code` : Code promo (ex: EARLYBIRD)
- `discount_type` : 'percentage' ou 'fixed_amount'
- `discount_value` : Montant ou pourcentage
- `max_uses` : Nombre d'utilisations max
- `current_uses` : Compteur actuel
- `valid_until` : Date d'expiration
- `is_active` : Actif/Inactif

#### Table `ticket_purchases`
Achats de billets avec informations complètes.

**Colonnes** :
- Relations : `event_id`, `organizer_id`, `user_id`
- **Client (OBLIGATOIRE)** : `customer_first_name`, `customer_last_name`, `customer_email`, `customer_phone`
- Billet : `ticket_type`, `quantity`, `ticket_number`, `qr_code_data`
- Tarification : `unit_price`, `discount_amount`, `total_price`, `service_fee`, `final_amount`
- Statut : `payment_status`, `ticket_status`
- Tracking : `conversion_tracked`, `stripe_payment_intent_id`

#### Table `organizer_sales_stats`
Statistiques de ventes agrégées quotidiennement.

**Colonnes** :
- `stat_date` : Date de la statistique
- `tickets_sold`, `revenue`, `service_fees`, `net_revenue`
- Par type : `standard_tickets_sold`, `vip_tickets_sold`, `invitation_tickets_used`
- Promo : `promo_discount_total`, `promo_codes_used`

### Modifications `public_events`

Ajout de :
- `organizer_id` : Lien vers l'organisateur
- `show_in_public_feed` : Afficher dans le feed public ALTESS
- `allow_public_discovery` : Permettre la découverte publique

---

## 📱 Pages & Routes

### 1. Mini-Site Organisateur : `/boutique/[slug]`

**Caractéristiques** :
- ✅ **Isolation totale** : Affiche UNIQUEMENT les événements de l'organisateur
- ✅ **Personnalisation complète** : Logo, couleur de marque, réseaux sociaux
- ✅ **Aucune publicité concurrente** : Environnement 100% white label
- ✅ **Branding ALTESS** : Mention discrète "Réalisé par ALTESS.fr" en footer

**Composants** :
- Header avec logo et réseaux sociaux de l'organisateur
- Badge vérifié si applicable
- Grille des événements à venir
- Cards événements avec design adapté à la couleur de marque
- Footer ALTESS (désactivable via `show_altess_branding`)

**Fichier** : `/app/boutique/[slug]/page.tsx`

### 2. Page Événement & Tunnel d'Achat : `/boutique/[slug]/event/[eventId]`

**Caractéristiques** :
- ✅ **Tunnel dédié sans distraction** : Pas de navigation externe
- ✅ **Design branded** : Utilise la couleur de marque de l'organisateur
- ✅ **Formulaire client complet** : Nom, Prénom (OBLIGATOIRES), Email, Téléphone
- ✅ **Codes promo** : Application automatique avec validation
- ✅ **Récapitulatif détaillé** : Sous-total, frais de service, réduction, total
- ✅ **Tracking pixels** : Facebook & Google (intégration côté client)

**Workflow d'achat** :
1. Sélection du tarif (Standard/VIP/etc.)
2. Choix de la quantité
3. Saisie des informations personnelles
4. Application code promo (optionnel)
5. Validation et création du billet
6. Redirection vers paiement Stripe (à intégrer)

**Fichier** : `/app/boutique/[slug]/event/[eventId]/page.tsx`

### 3. Dashboard Organisateur : `/organizer-dashboard`

**Caractéristiques** :
- ✅ **Stats temps réel** : Aujourd'hui, 7 jours, 30 jours, Total
- ✅ **5 Onglets principaux** :
  - 📊 **Participants** : Liste complète avec export CSV
  - 🏷️ **Codes Promo** : Création et gestion
  - 📈 **Pixel Tracking** : Configuration Facebook Pixel & Google Analytics
  - 📅 **Événements** : Gestion des événements
  - ⚙️ **Paramètres** : Lien boutique, réseaux sociaux, promotion Web TV

**Dashboard Features** :

#### Stats Overview (4 Cards)
- **Aujourd'hui** : Billets vendus + Revenus (vert)
- **7 derniers jours** : Billets + Revenus (bleu)
- **30 derniers jours** : Billets + Revenus (violet)
- **Total historique** : Billets + Revenus (amber)

#### Onglet Participants
- Table complète avec : Date, Nom, Email, Téléphone, N° Billet, Quantité, Montant, Statut
- Bouton **Export CSV** pour liste complète
- Nom/Prénom obligatoires par billet

#### Onglet Codes Promo
- Création rapide : Code, Valeur, Type (% ou fixe)
- Liste des codes actifs/inactifs
- Compteur d'utilisations (X/100)
- Date d'expiration
- Statut actif/inactif

#### Onglet Pixel Tracking
- **Facebook Pixel ID** : Pour remarketing et conversion tracking
- **Google Analytics ID** : Format G-XXXXXXXXXX
- Enregistrement direct dans la base
- Les pixels sont chargés automatiquement sur la boutique et le checkout

#### Onglet Événements
- Liste de tous les événements de l'organisateur
- Actions : Modifier, Voir
- Bouton "Nouvel événement"

#### Onglet Paramètres
- **Lien boutique** : Copie rapide du lien `/boutique/slug`
- **Réseaux sociaux** : Affichés en lecture seule
- **Bouton Web TV** : "Promouvoir sur la Web TV ALTESS" → Redirige vers `/admin/advertising-ticker`

**Fichier** : `/app/organizer-dashboard/page.tsx`

---

## 🎨 Design & UX

### Couleurs de Marque

Chaque organisateur peut définir sa couleur de marque via `brand_color`.

**Utilisation** :
```tsx
const brandColor = organizer.brand_color || '#F59E0B';

// Dans les styles
style={{ backgroundColor: brandColor }}
style={{ color: brandColor }}
style={{ background: `linear-gradient(135deg, ${brandColor} 0%, ${brandColor}dd 100%)` }}
```

### Branding ALTESS

Footer discret sur toutes les pages :
```html
<p>Billetterie propulsée par <a href="/">ALTESS.fr</a></p>
```

Désactivable via `show_altess_branding = false` dans `event_organizers`.

### Réseaux Sociaux

Affichage automatique des boutons si les URLs sont définies :
- Instagram : Gradient violet-rose
- Facebook : Bleu
- TikTok : Noir avec bordure blanche
- Site Web : Gris

---

## 🔐 Sécurité & RLS

### Policies Implémentées

#### `event_organizers`
- ✅ Public peut voir organisateurs actifs
- ✅ Organisateurs voient leur propre profil
- ✅ Organisateurs peuvent modifier leur profil

#### `promo_codes`
- ✅ Organisateurs gèrent leurs propres codes
- ✅ Public peut voir codes actifs et valides

#### `ticket_purchases`
- ✅ Clients voient leurs propres billets
- ✅ Organisateurs voient billets de leurs événements
- ✅ Public peut créer des achats
- ✅ Organisateurs peuvent mettre à jour statuts

#### `organizer_sales_stats`
- ✅ Organisateurs voient uniquement leurs stats

---

## 📊 Fonctions & Triggers

### `generate_ticket_number()`
Génère un numéro de billet unique format : `ALTESS-XXXXXXXXXXXX`

### `update_organizer_stats()`
Trigger automatique sur INSERT/UPDATE `ticket_purchases` :
- Met à jour `total_tickets_sold` et `total_revenue` de l'organisateur
- Crée/met à jour les stats quotidiennes dans `organizer_sales_stats`

---

## 🚀 Flux Complet Utilisateur

### 1. Client découvre un organisateur

**Scénario A** : Via lien direct
```
→ https://altess.fr/boutique/oriental-prestige
```

**Scénario B** : Via réseaux sociaux de l'organisateur
```
Instagram Bio → Lien boutique → Page événements
```

### 2. Navigation sur la boutique

1. Arrive sur `/boutique/[slug]`
2. Voit le logo, nom, badges de l'organisateur
3. Peut suivre sur Instagram/Facebook/TikTok
4. Voit UNIQUEMENT les événements de cet organisateur
5. **Aucune publicité concurrente visible**

### 3. Sélection d'un événement

1. Clic sur un événement
2. Redirection vers `/boutique/[slug]/event/[eventId]`
3. **Tunnel d'achat isolé** : Pas de distraction, focus total
4. Header simplifié avec logo organisateur + bouton retour

### 4. Achat de billets

1. Sélectionne un tarif (Standard/VIP/etc.)
2. Choisit la quantité
3. Remplit ses informations :
   - **Prénom** (obligatoire)
   - **Nom** (obligatoire)
   - **Email** (obligatoire)
   - Téléphone (optionnel)
4. Applique code promo si disponible
5. Valide le récapitulatif
6. Passe au paiement Stripe (à intégrer)
7. Reçoit billet PDF par email (à implémenter)

### 5. Réception du billet

**Format PDF Premium Noir & Or** (À implémenter) :
- Design élégant noir et or
- Logo de l'organisateur en haut
- QR Code pour scan à l'entrée
- Numéro de billet unique
- Détails événement
- Réseaux sociaux de l'organisateur
- Mention "Réalisé par ALTESS.fr"

---

## 👨‍💼 Flux Organisateur

### 1. Accès au Dashboard

1. Connexion sur `/organizer-dashboard`
2. Vérification : Doit avoir un profil dans `event_organizers`
3. Si pas de profil → Redirection création

### 2. Visualisation Stats

**Stats temps réel** :
- Aujourd'hui : X billets vendus, Y€
- 7 jours : X billets, Y€
- 30 jours : X billets, Y€
- Total : X billets, Y€

**KPIs clés** :
- Taux de conversion
- Panier moyen
- Utilisation codes promo
- Événements les plus performants

### 3. Gestion des Participants

**Actions disponibles** :
- ✅ Voir liste complète avec filtres
- ✅ Exporter en CSV (Nom, Prénom, Email, Téléphone, N° Billet)
- ✅ Rechercher un participant
- ✅ Voir statut paiement/validation

### 4. Création Codes Promo

**Process** :
1. Onglet "Codes Promo"
2. Entre le code (ex: EARLYBIRD)
3. Choisit type : Pourcentage ou Montant fixe
4. Entre la valeur (ex: 20%)
5. Clic "Créer"
6. Code actif immédiatement avec :
   - Limite 100 utilisations par défaut
   - Validité 30 jours par défaut

### 5. Configuration Tracking

**Pixels Marketing** :
```
Facebook Pixel : 123456789012345
Google Analytics : G-XXXXXXXXXX
```

**Événements trackés** :
- Page vue boutique
- Page vue événement
- Ajout au panier
- Début checkout
- Achat complété (conversion)

### 6. Promotion sur Web TV

Bouton direct : "Promouvoir sur la Web TV ALTESS"
→ Ouvre `/admin/advertising-ticker`
→ L'organisateur peut envoyer son affiche événement
→ Affichage sur le bandeau publicitaire de la Web TV ALTESS

---

## 📈 Modèle Économique

### Frais de Service

**Par défaut** : 5% de frais de service sur chaque billet
```
Prix billet : 50€
Frais : 2.50€ (5%)
Total client : 52.50€
```

### Commission Organisateur

Configurable via `commission_rate` dans `event_organizers`.

**Répartition** :
- Client paie : Total + Frais
- Organisateur reçoit : Total - Commission ALTESS
- ALTESS garde : Frais + Commission

### Tiers Premium

**Standard** (Gratuit) :
- ✅ Boutique white label
- ✅ Dashboard basique
- ✅ Commission 5%

**Premium** (Payant) :
- ✅ Tout Standard
- ✅ Badge vérifié
- ✅ Commission réduite 3%
- ✅ Support prioritaire
- ✅ Analytics avancées

**Enterprise** (Sur mesure) :
- ✅ Tout Premium
- ✅ Domaine personnalisé
- ✅ Commission 1%
- ✅ API dédiée
- ✅ Account manager

---

## 🔌 Intégrations

### Stripe (À implémenter)

**Checkout Session** :
```typescript
const session = await stripe.checkout.sessions.create({
  payment_intent_data: {
    metadata: {
      organizer_id: organizer.id,
      event_id: event.id,
      ticket_purchase_id: ticketData.id
    }
  },
  line_items: [{
    price_data: {
      currency: 'eur',
      product_data: {
        name: event.title,
        description: `Billet ${tierName}`,
        images: [event.poster_url]
      },
      unit_amount: Math.round(finalAmount * 100)
    },
    quantity: quantity
  }],
  mode: 'payment',
  success_url: `${origin}/boutique/${slug}/success?session_id={CHECKOUT_SESSION_ID}`,
  cancel_url: `${origin}/boutique/${slug}/event/${eventId}`
});
```

**Webhook** :
- Écouter `checkout.session.completed`
- Mettre à jour `payment_status = 'paid'`
- Déclencher envoi email billet
- Tracker conversion pixels

### Email (Resend ou SendGrid)

**Email billet** :
- Template HTML premium
- Pièce jointe PDF billet
- Logo organisateur
- Lien ajout calendrier
- Instructions accès événement

### PDF Generation (À implémenter)

**Librairie** : `@react-pdf/renderer` ou `pdfkit`

**Contenu billet** :
- Background noir élégant
- Accents dorés (amber)
- Logo organisateur en haut
- QR Code centré et large
- Numéro billet unique
- Détails événement (date, lieu, heure)
- Réseaux sociaux organisateur
- Footer "Réalisé par ALTESS.fr"

---

## 📝 Données de Test

### Organisateurs de Test

**Oriental Prestige Events** :
```
Slug : oriental-prestige
Email : contact@orientalprestige.com
Tier : Premium
Vérifié : Oui
```

**Maghreb Events VIP** :
```
Slug : maghreb-events-vip
Email : info@maghrebevents.com
Tier : Standard
Vérifié : Oui
```

### URLs de Test

```
Boutique 1 : /boutique/oriental-prestige
Boutique 2 : /boutique/maghreb-events-vip
Dashboard : /organizer-dashboard
```

---

## 🎯 Avantages Compétitifs vs Billetweb

### 1. White Label Total
❌ Billetweb : Branding visible partout
✅ ALTESS : Branding organisateur uniquement

### 2. Isolation Événements
❌ Billetweb : Cross-selling d'autres événements
✅ ALTESS : 100% focus sur l'organisateur

### 3. Design Personnalisé
❌ Billetweb : Template générique
✅ ALTESS : Couleur de marque + Logo partout

### 4. Dashboard Complet
✅ Billetweb : Dashboard professionnel
✅ ALTESS : **Même niveau** + Pixel tracking + Web TV promo

### 5. Commission Transparente
❌ Billetweb : Commission + Frais cachés
✅ ALTESS : Commission claire configurable

### 6. Réseaux Sociaux
❌ Billetweb : Liens basiques
✅ ALTESS : Boutons branded sur boutique ET billets

### 7. Codes Promo
✅ Billetweb : Gestion codes promo
✅ ALTESS : **Même feature** avec compteurs temps réel

### 8. Billet PDF
✅ Billetweb : PDF standard
✅ ALTESS : **PDF Premium Noir & Or** avec réseaux sociaux

---

## 🚀 Prochaines Étapes

### Phase 1 : Finitions Core ✅
- ✅ Base de données complète
- ✅ Pages boutique & checkout
- ✅ Dashboard organisateur
- ✅ Codes promo
- ✅ Stats temps réel

### Phase 2 : Paiements & Billets 🔄
- ⏳ Intégration Stripe Checkout
- ⏳ Webhook Stripe
- ⏳ Génération PDF billets premium
- ⏳ Envoi email automatique
- ⏳ Scanner QR Code

### Phase 3 : Marketing & Growth 📈
- ⏳ Page landing organisateurs
- ⏳ Système d'inscription organisateur
- ⏳ Onboarding automatisé
- ⏳ Tiers Premium payant
- ⏳ Analytics avancées

### Phase 4 : Scale & Features 🚀
- ⏳ Domaines personnalisés
- ⏳ API publique
- ⏳ Marketplace événements
- ⏳ Mobile app scanner
- ⏳ Multi-devise

---

## 📊 Métriques de Succès

### KPIs Organisateurs
- Nombre d'organisateurs actifs
- Billets vendus par organisateur
- Revenu moyen par événement
- Taux de rétention organisateurs

### KPIs Clients
- Taux de conversion checkout
- Panier moyen
- Taux d'utilisation codes promo
- Satisfaction (NPS)

### KPIs Plateforme
- GMV (Gross Merchandise Value)
- Commission totale
- Croissance MoM
- Churn organisateurs

---

## 🎨 Exemples Visuels

### Card Événement Boutique
```
┌─────────────────────────────────────┐
│  [IMAGE POSTER]                     │
│  ┌─────────────┐                    │
│  │ 150 places  │    [Badge Vérifié] │
│  └─────────────┘                    │
│─────────────────────────────────────│
│  TITRE DE L'ÉVÉNEMENT               │
│  Description courte de l'événement  │
│                                     │
│  📅 Vendredi 15 mars 2026          │
│  📍 Paris, France                   │
│                                     │
│  À partir de                        │
│  50.00€ [Couleur Marque]           │
│                                     │
│  [🎫 Acheter des billets]          │
└─────────────────────────────────────┘
```

### Dashboard Card Stats
```
┌─────────────────────────────────┐
│  Aujourd'hui        [Icon]      │
│  ────────────────────────────   │
│  42                             │
│  Billets vendus                 │
│                                 │
│  2,450.00€                      │
└─────────────────────────────────┘
```

### Billet PDF Premium
```
┌───────────────────────────────────┐
│                                   │
│  [LOGO ORGANISATEUR]              │
│                                   │
│  ═══════════════════════════════  │
│                                   │
│        [QR CODE LARGE]            │
│                                   │
│  ALTESS-A3F9E2B1C4D5             │
│                                   │
│  ───────────────────────────────  │
│                                   │
│  SOIRÉE ORIENTALE VIP             │
│  Samedi 20 Mars 2026 - 20h00     │
│  Grand Palais, Paris              │
│                                   │
│  Billet VIP - Place assise        │
│  Nom: DUPONT Jean                 │
│                                   │
│  ───────────────────────────────  │
│                                   │
│  [IG] [FB] [TikTok]              │
│  @orientalprestige                │
│                                   │
│  ───────────────────────────────  │
│  Réalisé par ALTESS.fr           │
└───────────────────────────────────┘
```

---

## 📱 Compatibilité

### Navigateurs
- ✅ Chrome/Edge (dernière version)
- ✅ Firefox (dernière version)
- ✅ Safari (iOS 14+)
- ✅ Mobile browsers

### Responsive
- ✅ Desktop (1920×1080)
- ✅ Laptop (1366×768)
- ✅ Tablette (768×1024)
- ✅ Mobile (375×667)

---

## 🔒 Sécurité & Conformité

### RGPD
- ✅ Collecte consentement
- ✅ Données minimales
- ✅ Droit à l'oubli
- ✅ Export données personnelles

### PCI-DSS
- ✅ Aucune donnée carte stockée
- ✅ Paiement via Stripe (certifié PCI)
- ✅ HTTPS obligatoire
- ✅ Tokens sécurisés

### RLS Supabase
- ✅ Isolation par organisateur
- ✅ Pas d'accès cross-organisateur
- ✅ Policies restrictives par défaut

---

*Document créé le 27 janvier 2026*
*Système White Label ALTESS - Version 1.0*
*Architecture complète pour la transformation en plateforme prestige*
