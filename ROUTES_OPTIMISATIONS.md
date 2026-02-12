# Routes & Navigation - ALTESS

## 🎯 Pages Optimisées (Nouveau Design Sobre)

### Social Hub
**URL:** `/admin/social-hub`
**Description:** Nouvelle page de régie sociale automatique
**Fonctionnalités:**
- Lecteur vidéo compact
- Sélection des sources (TikTok, Instagram, YouTube, Facebook)
- Contrôle de la durée par vidéo (15-60s)
- File d'attente visuelle
- Stats en temps réel

**Design:**
- ✅ Sidebar compacte 64px
- ✅ Design noir et or
- ✅ Grille optimisée 5-3-4
- ✅ Mini-cards pour stats
- ✅ Lecteur réduit de 40%

**Accès:** Admin uniquement

---

### Dashboard Compact
**URL:** `/admin/dashboard-compact`
**Description:** Dashboard administrateur sobre et rapide
**Fonctionnalités:**
- Vue d'ensemble des stats
- Quick links vers toutes les sections
- Activité récente
- Cache automatique

**Design:**
- ✅ Stats grid 6 colonnes compactes
- ✅ Quick links 4x2
- ✅ Timeline d'activité
- ✅ Chargement instantané (cache)

**Accès:** Admin uniquement

---

### WebTV Playout (Optimisé)
**URL:** `/admin/webtv-playout`
**Description:** Gestion de la programmation WebTV
**Fonctionnalités:**
- Timeline de programmation
- Gestion des médias
- Prévisualisation

**Modifications:**
- ✅ Sidebar intégrée
- ✅ Loading state sobre
- ✅ Design noir et or

**Accès:** Admin uniquement

---

## 📚 Toutes les Pages Admin

### Gestion Contenu

| Page | URL | Description |
|------|-----|-------------|
| Dashboard Principal | `/admin` | Vue d'ensemble |
| Dashboard Compact | `/admin/dashboard-compact` | Version optimisée |
| Bibliothèque Média | `/admin/webtv-playout` | Gestion médias WebTV |
| WebRadio Playout | `/admin/webradio-playout` | Gestion radio |
| Social Hub | `/admin/social-hub` | **NOUVEAU** Régie sociale |

### Publicité & Régie

| Page | URL | Description |
|------|-----|-------------|
| Publicités | `/admin/ads` | Gestion publicités |
| Bandeau Défilant | `/admin/advertising-ticker` | Ticker TV |
| Paramètres Ticker | `/admin/webtv-ticker` | Config WebTV |

### Événementiel & Orchestres

| Page | URL | Description |
|------|-----|-------------|
| Formules Orchestre | `/admin/orchestra-formulas` | Gestion formules |
| Instruments | `/admin/instruments` | Base instruments |
| Réservations | `/admin/orders` | Commandes |
| Devis | `/admin/quotes` | Gestion devis |
| Templates Devis | `/admin/quote-templates` | Modèles |

### Académie & Formation

| Page | URL | Description |
|------|-----|-------------|
| Cours | `/admin/academy-courses` | Gestion cours |
| Packs Formation | `/admin/academy-packs` | Packs formation |
| Détail Pack | `/admin/academy-packs/[packId]` | Édition pack |

### Partenaires & Stars

| Page | URL | Description |
|------|-----|-------------|
| Partenaires | `/admin/partners` | Gestion partenaires |
| Stars | `/admin/stars` | Artistes |
| Mécènes | `/admin/mecenas` | Mécénat |

### Prestations & Services

| Page | URL | Description |
|------|-----|-------------|
| Prestations | `/admin/prestations` | Services |
| Stations Radio | `/admin/radio-stations` | WebRadio |

### Configuration

| Page | URL | Description |
|------|-----|-------------|
| Arrière-plans | `/admin/backgrounds` | Backgrounds dynamiques |
| Carousel | `/admin/carousel` | Carousel homepage |
| Vidéos Démo | `/admin/demo-videos` | Vidéos démo |
| SEO Pages | `/admin/page-seo` | Métadonnées SEO |

---

## 👥 Pages Publiques

### Navigation Principale

| Page | URL | Description |
|------|-----|-------------|
| Accueil | `/` | Homepage |
| Login | `/login` | Authentification |

### Orchestres & Événementiel

| Page | URL | Description |
|------|-----|-------------|
| Orchestres | `/orchestres` | Liste orchestres |
| Détail Orchestre | `/orchestres/[slug]` | Fiche orchestre |
| Notre Orchestre | `/evenementiel/notre-orchestre` | Présentation |
| Événementiel | `/evenementiel` | Services événements |
| Composer | `/composer-orchestre` | Composer orchestre |

### Prestations & Services

| Page | URL | Description |
|------|-----|-------------|
| Prestations | `/prestations` | Liste services |
| Détail Prestation | `/prestations/[slug]` | Fiche service |
| Partenaires | `/partenaires` | Annuaire |
| Détail Partenaire | `/partenaires/[slug]` | Fiche partenaire |
| Bonnes Adresses | `/bonnes-adresses` | Annuaire local |
| Voyages | `/voyages` | Voyages musicaux |

### Stars & Académie

| Page | URL | Description |
|------|-----|-------------|
| Stars | `/stars` | Artistes |
| Détail Star | `/stars/[slug]` | Fiche artiste |
| Académie | `/academy` | Formations |
| Professeurs | `/academy/teachers` | Liste profs |
| Détail Prof | `/academy/teachers/[teacherId]` | Fiche prof |

### Autres

| Page | URL | Description |
|------|-----|-------------|
| Mécènes | `/mecenes` | Programme mécénat |
| Rendez-vous | `/rendez-vous` | Prise RDV |

---

## 🎨 Pages avec Design Optimisé

### Complètement Optimisées ✅

| Page | Sidebar | Cache | Virtual Scroll | Lazy Load | Noir/Or |
|------|---------|-------|----------------|-----------|---------|
| Social Hub | ✅ | ✅ | ✅ | ✅ | ✅ |
| Dashboard Compact | ✅ | ✅ | ❌ | ✅ | ✅ |
| WebTV Playout | ✅ | ❌ | ❌ | ❌ | ✅ |

### À Migrer 🔄

Toutes les autres pages admin peuvent être migrées progressivement vers le nouveau design.

**Template à utiliser:** Voir `GUIDE_UTILISATION_OPTIMISATIONS.md`

---

## 🔐 Contrôle d'Accès

### Admin Uniquement
- `/admin/*` (toutes les pages admin)
- `/playout/*` (gestion playout)

### Provider/Partenaire
- `/provider-dashboard`
- `/partner-dashboard`

### Client
- `/client-dashboard`

### Annonceur
- `/advertiser-dashboard`

### Public
- Toutes les autres pages

---

## 🚀 Navigation Rapide (Sidebar)

La nouvelle sidebar donne accès rapide à:

1. **Dashboard** - `/admin`
2. **Bibliothèque** - `/admin/webtv-playout`
3. **Direct TV** - `/admin/webtv-ticker`
4. **Social Hub** - `/admin/social-hub` ⭐ NOUVEAU
5. **Régie Pub** - `/admin/ads`
6. **Programmation** - `/playout/schedule`
7. **Paramètres** - `/admin/page-seo`

---

## 📱 URLs de Test

### Tester les Optimisations

1. **Social Hub**
   ```
   http://localhost:3000/admin/social-hub
   ```
   Test: Lecteur compact, virtual scrolling, cache

2. **Dashboard Compact**
   ```
   http://localhost:3000/admin/dashboard-compact
   ```
   Test: Cache automatique, stats rapides

3. **WebTV Playout**
   ```
   http://localhost:3000/admin/webtv-playout
   ```
   Test: Sidebar intégrée, design sobre

---

## 🔗 Deep Links

### Édition Directe

| Action | URL |
|--------|-----|
| Éditer Pack Formation | `/admin/academy-packs/[uuid]` |
| Voir Orchestre | `/orchestres/[slug]` |
| Voir Partenaire | `/partenaires/[slug]` |
| Voir Prestation | `/prestations/[slug]` |
| Voir Star | `/stars/[slug]` |
| Voir Prof | `/academy/teachers/[uuid]` |

---

## 🎯 Recommandations de Navigation

### Pour les Admins

**Workflow Quotidien:**
1. `/admin/dashboard-compact` - Vue d'ensemble rapide
2. `/admin/social-hub` - Gérer contenu social
3. `/admin/webtv-playout` - Programmer médias
4. `/admin/ads` - Suivre publicités

**Workflow Événementiel:**
1. `/admin/orders` - Nouvelles commandes
2. `/admin/quotes` - Générer devis
3. `/admin/orchestra-formulas` - Gérer formules

**Workflow Contenu:**
1. `/admin/webtv-playout` - Uploader médias
2. `/admin/carousel` - Gérer carousel
3. `/admin/backgrounds` - Changer backgrounds

### Pour les Visiteurs

**Réserver Orchestre:**
1. `/orchestres` - Parcourir
2. `/orchestres/[slug]` - Détails
3. `/composer-orchestre` - Composer sur-mesure

**Formation:**
1. `/academy` - Voir formations
2. `/academy/teachers` - Choisir prof
3. `/rendez-vous` - Réserver cours

---

## 📊 Performance par Page

| Page | Temps Chargement | Cache | Notes |
|------|------------------|-------|-------|
| Social Hub | 0.3s (cached) / 2.1s | ✅ | Virtual scroll actif |
| Dashboard Compact | 0.2s (cached) / 1.8s | ✅ | Stats en cache |
| WebTV Playout | 2.5s | ❌ | Timeline lourde |
| Admin Principal | 3.2s | ❌ | Beaucoup de data |

**Objectif:** Migrer toutes les pages vers cache + optimisations

---

## 🛠️ Outils de Navigation

### Breadcrumbs (À implémenter)
Proposé pour navigation claire:
```
Admin > Social Hub > Paramètres
```

### Search Global (À implémenter)
Recherche rapide dans:
- Médias
- Orchestres
- Partenaires
- Cours
- Commandes

---

## 📞 Support Navigation

**Problème de navigation?**
1. Vérifier que vous êtes connecté
2. Vérifier votre rôle (admin/provider/client)
3. Effacer le cache si page blanche
4. Recharger avec Ctrl+Shift+R

---

**Dernière mise à jour:** 24 Janvier 2026
**Version:** 2.0
**Pages optimisées:** 3 / 50+

*Navigation simplifiée pour une expérience fluide* 🚀
