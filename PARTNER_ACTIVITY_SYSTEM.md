# ✅ Système de Gestion des Comptes Professionnels - COMPLET

## 📋 Résumé

Le système ALTESS utilise maintenant un **rôle unique 'partner'** avec des **sous-types d'activité** pour simplifier la gestion des comptes professionnels.

---

## 🎯 Philosophie du Système

### Avant (Complexe)
```
❌ Multiples rôles : provider, partner, organizer
❌ Confusion sur quel rôle choisir
❌ Dashboards séparés non communicants
```

### Après (Simplifié)
```
✅ Un seul rôle : 'partner'
✅ Distinction par activités : événements ET/OU bonnes adresses
✅ Dashboard unique et dynamique
```

---

## 🔑 Architecture du Système

### 1. Rôle Unique : Partner

Tous les professionnels ont le rôle `'partner'` dans la table `profiles`.

### 2. Sous-types d'Activité

Deux champs booléens dans `profiles` :

| Champ | Description | Accès |
|-------|-------------|-------|
| `can_create_events` | Peut créer des événements et vendre des billets | Interface Organisateur |
| `can_create_places` | Peut créer des bonnes adresses et prestations | Interface Prestataire |

**Les deux peuvent être `true`** : Un utilisateur peut proposer les deux types de services.

### 3. Détection Automatique

Le système vérifie aussi le contenu réel :
- Si l'utilisateur a des entrées dans `public_events` → Affiche interface Organisateur
- Si l'utilisateur a des entrées dans `good_addresses` → Affiche interface Prestataire

---

## 🔄 Migration Base de Données

**Migration appliquée** : `add_partner_activity_preferences`

### Champs Ajoutés

```sql
ALTER TABLE profiles ADD COLUMN can_create_events boolean DEFAULT false;
ALTER TABLE profiles ADD COLUMN can_create_places boolean DEFAULT false;
```

### Mise à Jour Automatique

La migration configure automatiquement :

1. **Admins** : `can_create_events = true`, `can_create_places = true`
2. **Partenaires avec événements existants** : `can_create_events = true`
3. **Partenaires avec adresses existantes** : `can_create_places = true`

---

## 📝 Formulaire d'Inscription

**Fichier** : `/app/login/page.tsx`

### Options Simplifiées

Le sélecteur d'espace propose maintenant :

```
1. Compte Personnel
   └─ Gérer mon profil, mes cours et billets

2. Compte Professionnel  ← NOUVEAU
   └─ Événements, Prestations et Bonnes Adresses

3. Administration
   └─ Gestion de la plateforme
```

### Cases à Cocher pour Professionnels

Quand l'utilisateur choisit **"Compte Professionnel"**, il voit :

```
┌─────────────────────────────────────────┐
│ Que souhaitez-vous proposer ?           │
│                                          │
│ ☑ Événements / Billetterie              │
│   Organiser des événements, vendre      │
│   des billets, scanner les QR codes     │
│                                          │
│ ☑ Services / Bonnes Adresses            │
│   Gérer une vitrine, prestations        │
│   événementielles, statistiques         │
│                                          │
│ Vous pouvez sélectionner les deux       │
└─────────────────────────────────────────┘
```

### Validation

- **Au moins une case** doit être cochée pour créer un compte professionnel
- Message d'erreur si aucune activité n'est sélectionnée

---

## 🏠 Dashboard Partenaire Dynamique

**Fichier** : `/app/partner-dashboard/page.tsx` (complètement réécrit)

### Interface Adaptative

Le dashboard affiche des sections différentes selon les permissions :

#### Vue d'ensemble

```
┌──────────────────────────────────────────────┐
│  VUE D'ENSEMBLE                               │
├──────────────────────────────────────────────┤
│                                               │
│  [SI can_create_events = true]               │
│  📊 Événements totaux : 5                    │
│  🎫 Billets vendus : 247                     │
│                                               │
│  [SI can_create_places = true]              │
│  📍 Mes adresses : 3                         │
│  👁 Vues totales : 1,250                     │
│                                               │
└──────────────────────────────────────────────┘
```

#### Onglets Conditionnels

```
┌─────────────────────────────────────────────┐
│ [Vue d'ensemble] │ [Événements*] │ [Places*] │ [Paramètres] │
└─────────────────────────────────────────────┘

* Affichés seulement si permissions activées
```

### Section Événements (si `can_create_events`)

```
📅 ORGANISATEUR D'ÉVÉNEMENTS
├── Créer et gérer vos événements
├── Vendre des billets en ligne
│
├─ [Gérer mes événements] → /admin/events
└─ [Scanner des billets] → /admin/scanner
```

### Section Bonnes Adresses (si `can_create_places`)

```
📍 BONNES ADRESSES & SERVICES
├── Gérer vos établissements
├── Consulter les statistiques
│
├─ [Gérer mes adresses] → Onglet Places
├─ [Statistiques détaillées] → /provider-dashboard
└─ Composants intégrés :
    ├── ProviderMediaCarousel
    ├── ProviderAvailabilityCalendar
    └── ProviderQuoteRequests
```

### Aucune Permission

Si un utilisateur n'a ni `can_create_events` ni `can_create_places` :

```
┌─────────────────────────────────────┐
│  ⚙️  CONFIGURATION NÉCESSAIRE       │
│                                      │
│  Votre compte professionnel n'a     │
│  pas encore été configuré.          │
│                                      │
│  Contactez l'administration pour    │
│  activer vos permissions.           │
│                                      │
│  [Retour à l'accueil]               │
└─────────────────────────────────────┘
```

---

## 🔐 Logique de Permissions

### Au Login

```javascript
// Redirection après connexion
const getRedirectPath = (role) => {
  if (role === 'admin') return '/admin';
  if (role === 'partner') return '/partner-dashboard';
  return '/client-dashboard';
};
```

### À l'Inscription

```javascript
// Enregistrement des préférences
await supabase
  .from('profiles')
  .update({
    role: 'partner',
    can_create_events: canCreateEvents,
    can_create_places: canCreatePlaces
  })
  .eq('id', user.id);
```

### Au Chargement du Dashboard

```javascript
// Vérification des permissions
const hasEventAccess = profile.can_create_events;
const hasPlaceAccess = profile.can_create_places;

// Affichage conditionnel
{hasEventAccess && (
  <TabsTrigger value="events">
    Événements
  </TabsTrigger>
)}

{hasPlaceAccess && (
  <TabsTrigger value="places">
    Mes Adresses
  </TabsTrigger>
)}
```

---

## 📊 Statistiques Dynamiques

### Pour les Événements

```javascript
const eventStats = {
  total_events: events.length,
  active_events: events.filter(e =>
    e.is_active && e.approval_status === 'approved'
  ).length,
  pending_events: events.filter(e =>
    e.approval_status === 'pending'
  ).length,
  total_tickets_sold: events.reduce((sum, e) =>
    sum + (e.tickets_sold || 0), 0
  )
};
```

### Pour les Bonnes Adresses

```javascript
const placeStats = {
  total_places: places.length,
  approved_places: places.filter(p =>
    p.approval_status === 'approved'
  ).length,
  pending_places: places.filter(p =>
    p.approval_status === 'pending'
  ).length,
  total_views: places.reduce((sum, p) =>
    sum + (p.view_count || 0), 0
  )
};
```

---

## 🎨 Design & UX

### Codes Couleur

| Activité | Couleur | Icône | Usage |
|----------|---------|-------|-------|
| **Événements** | Violet `#9333EA` | 📅 Calendar | Boutons, badges, cards |
| **Bonnes Adresses** | Bleu `#3B82F6` | 📍 MapPin | Boutons, badges, cards |

### Interface Responsive

#### Mobile (< 768px)
- Tabs empilés
- Cards pleine largeur
- Navigation simplifiée

#### Tablette (768px - 1024px)
- Grille 2 colonnes pour les stats
- Tabs horizontaux

#### Desktop (> 1024px)
- Grille 4 colonnes pour les stats
- Tabs avec icônes
- Toutes les fonctionnalités visibles

---

## 🔄 Flux Utilisateur Complet

### 1. Inscription

```
Utilisateur arrive sur /login
  └─> Clique "S'inscrire"
  └─> Sélectionne "Compte Professionnel"
  └─> Coche "Événements" et/ou "Services"
  └─> Valide le formulaire
  └─> Profil créé avec permissions
  └─> Redirection vers /partner-dashboard
```

### 2. Premier Accès Dashboard

```
Dashboard charge le profil
  └─> Vérifie can_create_events et can_create_places
  └─> Charge les stats correspondantes
  └─> Affiche les onglets disponibles
  └─> Par défaut : Onglet "Vue d'ensemble"
```

### 3. Utilisation Quotidienne

**Si Organisateur :**
```
/partner-dashboard
  └─> Vue d'ensemble : Stats événements
  └─> Onglet Événements : Accès rapide
  └─> Bouton "Gérer mes événements" → /admin/events
  └─> Bouton "Scanner des billets" → /admin/scanner
```

**Si Prestataire :**
```
/partner-dashboard
  └─> Vue d'ensemble : Stats adresses
  └─> Onglet Places : Gestion complète
      ├── Carousel médias
      ├── Calendrier disponibilités
      └── Demandes de devis
  └─> Bouton "Statistiques détaillées" → /provider-dashboard
```

**Si les deux :**
```
/partner-dashboard
  └─> Vue d'ensemble : Stats combinées
  └─> Onglets : Événements + Places + Paramètres
  └─> Accès à toutes les fonctionnalités
```

---

## 🛠 Administration

### Modifier les Permissions d'un Utilisateur

L'admin peut modifier les permissions depuis l'interface d'administration :

```sql
-- Activer les événements pour un utilisateur
UPDATE profiles
SET can_create_events = true
WHERE email = 'utilisateur@example.com';

-- Activer les bonnes adresses pour un utilisateur
UPDATE profiles
SET can_create_places = true
WHERE email = 'utilisateur@example.com';

-- Activer les deux
UPDATE profiles
SET can_create_events = true, can_create_places = true
WHERE email = 'utilisateur@example.com';
```

### Convertir Anciens Rôles

Si vous avez des utilisateurs avec les anciens rôles :

```sql
-- Convertir les providers en partners avec can_create_places
UPDATE profiles
SET role = 'partner', can_create_places = true
WHERE role = 'provider';

-- Vérifier que les organisateurs ont can_create_events
UPDATE profiles
SET can_create_events = true
WHERE role = 'partner'
  AND id IN (
    SELECT DISTINCT organizer_id
    FROM public_events
    WHERE organizer_id IS NOT NULL
  );
```

---

## 📱 Navigation du Site

### Menu Principal

Le menu de navigation s'adapte selon le rôle :

```
[Client]     → Lien vers /client-dashboard
[Partner]    → Lien vers /partner-dashboard
[Admin]      → Lien vers /admin
```

### Liens Contextuels

Dans le dashboard partenaire, les liens s'adaptent :

```
✅ Scanner des billets → Visible si can_create_events
✅ Gérer mes événements → Visible si can_create_events
✅ Gérer mes adresses → Visible si can_create_places
✅ Statistiques détaillées → Visible si can_create_places
```

---

## ✅ Checklist de Déploiement

### Base de Données
- [x] Migration `add_partner_activity_preferences` appliquée
- [x] Champs `can_create_events` et `can_create_places` ajoutés
- [x] Permissions par défaut configurées pour admins
- [x] Permissions configurées pour utilisateurs existants

### Interface
- [x] Formulaire d'inscription simplifié (3 options au lieu de 4)
- [x] Cases à cocher pour sélectionner les activités
- [x] Validation : au moins une activité requise
- [x] Dashboard partenaire dynamique créé
- [x] Affichage conditionnel des onglets
- [x] Statistiques séparées par type d'activité
- [x] Design responsive et cohérent

### Expérience Utilisateur
- [x] Message d'erreur si aucune activité sélectionnée
- [x] Message si aucune permission configurée
- [x] Liens contextuels selon permissions
- [x] Stats en temps réel
- [x] Navigation intuitive

---

## 🚀 Avantages du Nouveau Système

### Pour les Utilisateurs

✅ **Simplicité**
- Un seul compte pour tout gérer
- Choix clair dès l'inscription
- Interface unique et cohérente

✅ **Flexibilité**
- Peut activer les deux types d'activités
- Évolution possible du compte
- Permissions modifiables par admin

✅ **Clarté**
- Dashboard qui s'adapte automatiquement
- Pas de confusion sur où aller
- Stats pertinentes affichées

### Pour les Administrateurs

✅ **Gestion Simplifiée**
- Un seul rôle 'partner' à gérer
- Permissions granulaires et flexibles
- Facile de modifier les accès

✅ **Maintenance**
- Code plus simple et maintenable
- Moins de duplication
- Logique claire et documentée

✅ **Évolutivité**
- Facile d'ajouter de nouveaux types d'activités
- Système modulaire et extensible
- Pas de refonte majeure nécessaire

---

## 🔍 Cas d'Usage

### Cas 1 : Restaurant Organisateur d'Événements

```
Inscription :
☑ Événements / Billetterie
☑ Services / Bonnes Adresses

Dashboard :
├── Stats événements : 12 soirées organisées
├── Stats adresses : 1 restaurant référencé
├── Accès billetterie complète
└── Accès gestion vitrine
```

### Cas 2 : Organisateur Pur

```
Inscription :
☑ Événements / Billetterie
☐ Services / Bonnes Adresses

Dashboard :
├── Stats événements uniquement
├── Onglet Événements visible
├── Onglet Places masqué
└── Focus sur la billetterie
```

### Cas 3 : Prestataire Pur

```
Inscription :
☐ Événements / Billetterie
☑ Services / Bonnes Adresses

Dashboard :
├── Stats adresses uniquement
├── Onglet Événements masqué
├── Onglet Places visible
└── Focus sur la vitrine
```

---

## 📞 Support & Maintenance

### Requêtes SQL Utiles

#### Lister tous les partenaires avec leurs permissions

```sql
SELECT
  email,
  full_name,
  can_create_events,
  can_create_places,
  created_at
FROM profiles
WHERE role = 'partner'
ORDER BY created_at DESC;
```

#### Compter les partenaires par type

```sql
SELECT
  COUNT(*) FILTER (WHERE can_create_events AND NOT can_create_places) as only_events,
  COUNT(*) FILTER (WHERE can_create_places AND NOT can_create_events) as only_places,
  COUNT(*) FILTER (WHERE can_create_events AND can_create_places) as both,
  COUNT(*) FILTER (WHERE NOT can_create_events AND NOT can_create_places) as none
FROM profiles
WHERE role = 'partner';
```

#### Utilisateurs sans permissions configurées

```sql
SELECT email, full_name, created_at
FROM profiles
WHERE role = 'partner'
  AND NOT can_create_events
  AND NOT can_create_places
ORDER BY created_at DESC;
```

---

## 🎓 Formation Utilisateurs

### Message pour les Nouveaux Inscrits

```
Bienvenue sur ALTESS !

Votre compte professionnel vous permet de :

✅ [Si Événements activé]
   • Créer des événements
   • Vendre des billets en ligne
   • Scanner les QR codes à l'entrée

✅ [Si Places activé]
   • Référencer votre établissement
   • Gérer votre vitrine en ligne
   • Consulter vos statistiques de visite

Accédez à votre espace : /partner-dashboard
```

### Email de Confirmation

```
Objet : Votre compte ALTESS est prêt !

Bonjour [Nom],

Votre compte professionnel a été créé avec succès.

Activités sélectionnées :
[Liste des activités cochées]

Prochaines étapes :
1. Connectez-vous sur ALTESS
2. Accédez à votre dashboard partenaire
3. [Si événements] Créez votre premier événement
4. [Si places] Complétez votre profil établissement

Besoin d'aide ? Contactez notre support.

L'équipe ALTESS
```

---

**Version** : 3.0
**Date** : 27 janvier 2026
**Statut** : ✅ PRODUCTION READY
**Migration** : `add_partner_activity_preferences`

🎉 **Le système de gestion des comptes professionnels est opérationnel !**
