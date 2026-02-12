# Système "L'Heure des Réseaux Sociaux" - Régie Publicitaire Automatisée

## Vue d'ensemble

Le système "L'Heure des Réseaux Sociaux" est une régie publicitaire entièrement automatisée qui diffuse en boucle les vidéos des prestataires Premium sur la page Événementiel.

## Architecture du Système

### 1. Activation Automatique par Paiement

#### Flux d'Activation
```
Paiement validé → status: 'active' dans user_subscriptions
                ↓
         Trigger automatique activé
                ↓
         is_active: true pour toutes les vidéos du prestataire
                ↓
         Diffusion immédiate dans la régie
```

#### Trigger Database (Automatique)
- **Fonction**: `activate_premium_videos_on_subscription()`
- **Déclenchement**: INSERT ou UPDATE sur `user_subscriptions.status`
- **Actions**:
  - Status = 'active' → Active toutes les vidéos (`is_active = true`)
  - Status = 'canceled/expired/suspended' → Désactive les vidéos

#### Fonction Helper
```sql
is_user_premium_active(user_id) → Boolean
```
Vérifie si un utilisateur a un abonnement actif.

---

## 2. Lecteur Dynamique

### Caractéristiques Principales

#### Design Prestige
- **Fond**: Noir mat (bg-black)
- **Cadre**: Doré ALTESS exclusif (border-4 border-amber-600/50)
- **Format**: 9:16 (aspect-[9/16]) - Format Stories
- **Shadow**: Ombre dorée (shadow-2xl shadow-amber-600/20)

#### Badge "Direct Premium"
- Position: Top-right
- Indicateur LIVE animé (pulse)
- Couleur: Doré ALTESS
- Background: Noir/80 avec backdrop-blur

#### Barre de Progression
- Position: Bottom (h-1)
- Couleur: Gradient amber-500 → amber-600
- Animation: Transition fluide (duration-100)
- Reset automatique à chaque changement de vidéo

---

## 3. Système de Rotation Automatique

### Logique de Diffusion

```typescript
// Démarrage automatique
useEffect(() => {
  if (isPlaying && videos.length > 0) {
    startVideoTimer();
  }
}, [isPlaying, currentIndex, videos]);

// Timer intelligent
const updateProgress = () => {
  const elapsed = Date.now() - startTimeRef.current;
  const newProgress = (elapsed / duration) * 100;

  if (newProgress >= 100) {
    nextVideo(); // Passage automatique
  }
};
```

### Boucle Infinie
- Chaque vidéo se joue pendant sa durée définie
- Passage automatique à la suivante
- Retour au début après la dernière vidéo
- Pas d'interruption (24/7)

---

## 4. Panneau de Statistiques Live

### Statistiques Affichées

#### Vidéo Actuelle
```
Format: X / Y
Exemple: 3 / 15 (3ème vidéo sur 15 au total)
```

#### Durée Moyenne
```typescript
avgDuration = videos.reduce((acc, v) => acc + v.duration, 0) / videos.length
```

#### Format
- Fixe: "Stories 9:16"
- Représente le format mobile vertical

---

## 5. Fonctionnalités Premium

### Liste des Avantages

1. **Cadre doré exclusif ALTESS**
   - Border-4 amber-600/50
   - Signature visuelle Premium

2. **Enchaînement automatique**
   - Pas d'intervention manuelle
   - Diffusion fluide 24/7

3. **Diffusion continue 24/7**
   - Boucle infinie
   - Visibilité permanente

4. **Badge Premium certifié**
   - Indicateur LIVE
   - Animation pulse

5. **Visibilité haute priorité**
   - Position stratégique (après moteur de recherche)
   - Format grand écran

---

## 6. Filtres par Plateforme

### Options Disponibles

```typescript
type Platform = 'all' | 'instagram' | 'tiktok';
```

#### Filtrage Dynamique
```typescript
const filteredVideos = selectedPlatform === 'all'
  ? videos
  : videos.filter(v => v.platform === selectedPlatform);
```

### Design des Boutons
- **Actif**: bg-amber-600/10, text-amber-600, border-amber-600/30
- **Inactif**: border-zinc-800, text-gray-400

---

## 7. Contrôles Utilisateur

### Boutons Disponibles

#### Lecture / Pause
```tsx
<Button onClick={togglePlayPause}>
  {isPlaying ? 'Pause' : 'Lecture'}
</Button>
```

#### Vidéo Suivante
```tsx
<Button onClick={nextVideo}>
  <SkipForward />
</Button>
```

### Indicateur de Position
```
Format: X / Y
Centré sous le lecteur
```

---

## 8. Intégration dans la Page Événementiel

### Structure de la Page

```
1. [Moteur de Recherche Avancé]
   ↓
2. [L'Heure des Réseaux Sociaux] ← Lecteur Dynamique
   ↓
3. [Galerie Prestataires Premium]
   ↓
4. [Galerie Prestataires Standards]
```

### Position Stratégique
- Immédiatement après la recherche
- Avant la galerie des prestataires
- Maximum de visibilité

---

## 9. Tables Database

### provider_social_videos

```sql
CREATE TABLE provider_social_videos (
  id UUID PRIMARY KEY,
  provider_id UUID REFERENCES profiles(id),
  video_url TEXT NOT NULL,
  platform TEXT NOT NULL, -- 'instagram' | 'tiktok' | 'youtube'
  title TEXT,
  duration INTEGER, -- en secondes
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### user_subscriptions

```sql
CREATE TABLE user_subscriptions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  plan_id UUID,
  status TEXT NOT NULL, -- 'active' | 'canceled' | 'expired' | 'suspended'
  billing_cycle TEXT NOT NULL,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 10. Workflow Complet

### Pour le Prestataire

1. **Inscription** → Création compte
2. **Souscription Premium** → Paiement
3. **Activation automatique** → Trigger database
4. **Ajout vidéo** → URL TikTok/Instagram
5. **Diffusion immédiate** → Apparition dans le lecteur

### Pour les Visiteurs

1. **Visite page Événementiel**
2. **Recherche prestataire** (optionnel)
3. **Découverte régie vidéo** → Vitrine Premium
4. **Visualisation créations** → Rotation automatique
5. **Contact prestataire** → Bouton "Consulter le profil"

---

## 11. Avantages du Système

### Pour les Prestataires
- Activation instantanée post-paiement
- Zéro configuration manuelle
- Visibilité 24/7
- Format adapté aux réseaux sociaux
- Badge Premium valorisant

### Pour ALTESS
- Régie pub automatisée
- Pas d'intervention admin
- Workflow fluide
- Monétisation claire
- Design premium uniforme

### Pour les Clients
- Découverte dynamique
- Contenu frais et varié
- Format engageant (Stories)
- Informations claires
- Expérience premium

---

## 12. Maintenance & Évolution

### Points de Vigilance

1. **Durée des vidéos**
   - Vérifier que les durées sont correctes
   - Fallback: 30s par défaut

2. **URLs vidéos**
   - Valider les liens externes
   - Gérer les vidéos supprimées

3. **Performance**
   - Optimiser le timer (useCallback)
   - Cleanup des timers (return cleanup)

### Évolutions Possibles

1. **Lecteur vidéo réel**
   - Intégration React Player
   - Support embed Instagram/TikTok

2. **Analytics**
   - Compteur de vues
   - Durée de visionnage
   - Taux de clics

3. **Personnalisation**
   - Ordre de diffusion (priorité)
   - Créneaux horaires
   - Ciblage géographique

---

## Résumé Technique

### Technologies Utilisées
- **Frontend**: React, Next.js, TypeScript
- **UI**: Tailwind CSS, shadcn/ui
- **Database**: Supabase (PostgreSQL)
- **Triggers**: PL/pgSQL Functions
- **State**: React Hooks (useState, useEffect, useRef, useCallback)

### Performance
- Chargement: ~100ms (query Supabase)
- Timer: Update toutes les 100ms
- Transition: Instantanée
- Memory: Cleanup automatique des timers

### Sécurité
- RLS activé sur toutes les tables
- SECURITY DEFINER pour les triggers
- Validation des statuts d'abonnement
- Protection contre les injections SQL

---

## Support & Contact

Pour toute question sur le système :
- Documentation technique : Ce fichier
- Logs : Console navigateur
- Database : Supabase Dashboard
- Code : `components/SocialHourShowcase.tsx`
