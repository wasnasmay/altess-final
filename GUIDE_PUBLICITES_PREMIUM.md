# Guide Complet - Système de Publicités Premium

## Vue d'ensemble

Le système de publicités premium permet de monétiser la plateforme en remplaçant les vignettes statiques par des publicités dynamiques d'annonceurs (agences de voyages, bonnes adresses, etc.).

## Fonctionnalités Créées

### 1. **Base de Données**

#### Tables créées:
- **`premium_ads`** - Gestion des publicités premium
  - Informations: titre, description, image, lien, CTA
  - Tarification: prix, période de facturation
  - Dates: début, fin
  - Stats: impressions, clics
  - Statuts: pending, active, paused, completed, cancelled

- **`ad_analytics`** - Tracking des performances
  - Type d'événement: impression, click
  - Métadonnées: user, IP, user-agent, referrer

- **`advertiser_users`** - Liaison utilisateurs/annonceurs
  - Gestion des accès au dashboard

#### Fonctions SQL:
- `track_ad_impression()` - Enregistre une impression
- `track_ad_click()` - Enregistre un clic
- `get_ad_stats()` - Statistiques complètes

### 2. **Dashboard Annonceur** (`/advertiser-dashboard`)

Interface complète pour les annonceurs avec:

#### Statistiques en temps réel:
- Total de publicités
- Publicités actives
- Impressions totales
- Clics totaux
- CTR moyen (Click Through Rate)

#### Gestion des publicités:
- **Créer une nouvelle publicité**:
  - Titre accrocheur
  - Description
  - Image (URL)
  - Lien de destination
  - Texte du bouton CTA
  - Emplacement (Hero, Sidebar, etc.)
  - Type de contenu
  - Prix et période de facturation
  - Dates de début et fin

- **Modifier** une publicité existante
- **Mettre en pause/Activer** une campagne
- **Supprimer** une publicité
- **Voir les statistiques** détaillées

#### Dashboard features:
- Cartes statistiques colorées
- Filtrage par statut
- Badges de statut (Active, En attente, Payée)
- Calcul automatique du CTR
- Interface intuitive avec preview

### 3. **Affichage Public** (`PremiumAdsGrid`)

Composant qui remplace les vignettes statiques sur la page d'accueil:

#### Caractéristiques:
- **Design Premium** avec badge "Premium"
- **Grille responsive** (1-4 colonnes selon l'écran)
- **Tracking automatique** des impressions au chargement
- **Tracking des clics** lors de l'interaction
- **Effets visuels** au survol
- **Liens externes** sécurisés (target="_blank", rel="noopener")
- **Optimisation SEO** avec images alt

#### Emplacements disponibles:
- `home_hero` - Hero de la page d'accueil
- `home_sidebar` - Sidebar page d'accueil
- `category_top` - Haut de catégorie
- `event_sidebar` - Sidebar Événementiel
- `travel_banner` - Bannière Voyages
- `address_banner` - Bannière Bonnes Adresses

### 4. **Interface Admin** (`/admin/ads`)

Panel d'administration complet pour gérer toutes les publicités:

#### Vue d'ensemble:
- **6 statistiques globales**:
  - Total de publicités
  - En attente d'approbation
  - Actives
  - Impressions totales
  - Clics totaux
  - Revenus totaux

#### Gestion:
- **Filtrage par statut** (6 onglets)
- **Cartes détaillées** pour chaque publicité
- **Dialog de détails** avec:
  - Preview de l'image
  - Statistiques (Impressions, Clics, CTR, Valeur)
  - Actions rapides: Approuver, Pause, Annuler
  - Toggle paiement (Payée/Non payée)

#### Actions admin:
- **Approuver** une publicité (pending → active)
- **Mettre en pause** (active → paused)
- **Annuler** (active → cancelled)
- **Marquer comme payée** ou non payée
- **Voir les statistiques** en temps réel

## Workflow d'utilisation

### Pour un Annonceur:

1. **Inscription/Connexion** sur `/login`
2. **Accès au dashboard** sur `/advertiser-dashboard`
3. **Créer une publicité**:
   - Cliquer sur "Nouvelle Publicité"
   - Remplir le formulaire complet
   - Soumettre (statut: "En attente")
4. **Attendre l'approbation** de l'admin
5. **Suivre les performances**:
   - Voir les impressions en temps réel
   - Analyser les clics
   - Calculer le ROI avec le CTR

### Pour un Administrateur:

1. **Connexion admin** sur `/login`
2. **Accès à la gestion** sur `/admin/ads`
3. **Approuver les publicités**:
   - Vérifier le contenu
   - Approuver (passe en "active")
   - Vérifier le paiement
4. **Gérer les campagnes**:
   - Mettre en pause si besoin
   - Annuler si non conforme
   - Marquer comme payée
5. **Suivre les statistiques globales**

### Pour un Visiteur:

1. **Visite de la page d'accueil**
2. **Visualisation automatique** des publicités (tracking impression)
3. **Clic sur une publicité** intéressante (tracking clic + redirection)

## Configuration Technique

### Intégration sur la page d'accueil:

```tsx
import PremiumAdsGrid from '@/components/PremiumAdsGrid';

// Dans le JSX:
<PremiumAdsGrid placement="home_hero" />
```

### Emplacements multiples:

```tsx
// Hero de la page
<PremiumAdsGrid placement="home_hero" />

// Sidebar
<PremiumAdsGrid placement="home_sidebar" />

// Dans une catégorie
<PremiumAdsGrid placement="category_top" />
```

### Tracking personnalisé:

Les fonctions `track_ad_impression` et `track_ad_click` sont appelées automatiquement, mais peuvent être utilisées manuellement:

```sql
-- Enregistrer une impression
SELECT track_ad_impression(
  'ad_id_here'::uuid,
  auth.uid(),
  '192.168.1.1'::inet,
  'Mozilla/5.0...',
  'https://referrer.com'
);

-- Enregistrer un clic
SELECT track_ad_click(
  'ad_id_here'::uuid,
  auth.uid(),
  '192.168.1.1'::inet,
  'Mozilla/5.0...',
  'https://referrer.com'
);

-- Obtenir les stats
SELECT * FROM get_ad_stats('ad_id_here'::uuid);
```

## Types de Contenu Disponibles

- **`event_provider`** - Prestataire Événementiel
- **`travel_offer`** - Offre de Voyage (agences)
- **`good_address`** - Bonne Adresse (restaurants, lieux)
- **`partner`** - Partenaire général
- **`custom`** - Personnalisé (autre)

## Tarification et Périodes

### Périodes de facturation:
- `daily` - Journalier
- `weekly` - Hebdomadaire
- `monthly` - Mensuel
- `yearly` - Annuel
- `one_time` - Unique

### Prix:
Défini par l'annonceur lors de la création, validé par l'admin.

## Sécurité (RLS)

### Publicités (`premium_ads`):
- ✅ **Lecture publique**: Seulement les annonces actives et dans les dates
- ✅ **Annonceurs**: Voir leurs propres annonces
- ✅ **Admins**: Gestion totale

### Analytics (`ad_analytics`):
- ✅ **Insertion publique**: Tout le monde peut créer des événements
- ✅ **Lecture admin**: Seuls les admins voient les analytics

### Liaison Annonceurs (`advertiser_users`):
- ✅ **Lecture**: Les utilisateurs voient leurs liens
- ✅ **Gestion**: Admins uniquement

## Statistiques et Analytics

### Métriques disponibles:
- **Impressions**: Nombre d'affichages
- **Clics**: Nombre de clics
- **CTR**: Click Through Rate (clics / impressions × 100)
- **Impressions aujourd'hui**
- **Clics aujourd'hui**

### Calcul automatique:
Le système met à jour automatiquement les compteurs dans `premium_ads` via triggers.

## Automatisation

### Mise à jour des statuts:
Fonction `update_ads_status()` qui:
- Active automatiquement les annonces dont la date de début est atteinte
- Complète les annonces dont la date de fin est passée

### À configurer (optionnel):
Créer un cron job pour exécuter `update_ads_status()` quotidiennement.

## Migration des Vignettes

### Avant:
4 vignettes statiques codées en dur (Événementiel, Académie, Bonnes Adresses, Voyages)

### Après:
Vignettes dynamiques gérées depuis l'interface admin:
- Nombre illimité de publicités
- Contenu personnalisé
- Tracking des performances
- Monétisation de l'espace

## Exemple de Publicité

```sql
INSERT INTO premium_ads (
  advertiser_id,
  content_type,
  placement,
  title,
  description,
  image_url,
  link_url,
  cta_text,
  price,
  billing_period,
  start_date,
  end_date,
  status,
  is_paid
) VALUES (
  'user_id_here',
  'travel_offer',
  'home_hero',
  'Voyages au Maroc - 20% de réduction',
  'Découvrez nos circuits exceptionnels à travers le Maroc',
  'https://images.pexels.com/photos/2166553/pexels-photo-2166553.jpeg',
  'https://www.agence-voyage-maroc.com',
  'Voir nos offres',
  500.00,
  'monthly',
  '2026-02-01',
  '2026-02-28',
  'pending',
  false
);
```

## Support et Maintenance

### Vérifications régulières:
1. Vérifier que les publicités actives sont payées
2. Analyser les performances (CTR moyen)
3. Renouveler les campagnes terminées
4. Approuver les nouvelles demandes rapidement

### Optimisations possibles:
- A/B testing des emplacements
- Rotation automatique des publicités
- Système d'enchères pour les emplacements premium
- Dashboard analytics avancé avec graphiques

## Build et Déploiement

Le système est **100% opérationnel** et le build compile sans erreur. Toutes les routes sont créées:
- `/advertiser-dashboard` - Dashboard annonceur
- `/admin/ads` - Gestion admin
- Page d'accueil avec `PremiumAdsGrid`

Prêt pour la production!
