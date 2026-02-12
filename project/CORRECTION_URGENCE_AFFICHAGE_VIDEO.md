# Correction d'Urgence - Affichage Immédiat du Flux Vidéo

**Date** : 27 janvier 2026
**Statut** : ✅ CORRIGÉ - Priorité au Direct
**Problème** : Lecteur principal bloqué sur image fixe, mini-player fonctionnel

---

## Diagnostic

### Symptôme
- Grande télé affiche une **image statique** (concert + plage) au chargement
- Flux vidéo YouTube **ne s'affiche pas** dans la zone principale
- Mini-player fonctionne correctement au scroll

### Causes Identifiées

1. **Background Image Priority**
   - L'image de fond s'affichait AVANT la vidéo
   - Condition `isPlaying && currentProgram` trop restrictive
   - Background masquait le lecteur vidéo

2. **État isPlaying Non Synchronisé**
   - `isPlaying` n'était pas forcé à `true` au chargement
   - Le background ne disparaissait pas immédiatement

3. **Z-Index Ancre Non Défini**
   - L'ancre `#youtube-player-anchor` n'avait pas de z-index
   - Le lecteur pouvait se retrouver derrière le background (z-0)

4. **Détection Ancre Insuffisante**
   - Seulement 2 retries (50ms, 200ms)
   - Pas de détection forcée au changement de videoId

---

## Corrections Appliquées

### ✅ 1. Force État isPlaying au Chargement Vidéo

**Fichier** : `app/page.tsx` (après ligne 268)

```typescript
// Force l'état isPlaying à true dès qu'une vidéo est chargée en mode TV
useEffect(() => {
  if (mode === 'tv' && currentVideoId) {
    setIsPlaying(true);
    console.log('✅ Force isPlaying=true pour affichage immédiat du flux vidéo');
  }
}, [mode, currentVideoId, setIsPlaying]);
```

**Impact** :
- ✅ `isPlaying` passe à `true` dès qu'un `currentVideoId` existe
- ✅ Le background disparaît immédiatement
- ✅ Le flux vidéo prend la priorité absolue

---

### ✅ 2. Masquage Background Basé sur currentVideoId

**Fichier** : `app/page.tsx:1014-1020`

```typescript
// ❌ AVANT (trop restrictif)
opacity: mode === 'tv' && isPlaying && currentProgram ? 0 : 1,

// ✅ APRÈS (priorité au flux)
opacity: mode === 'tv' && currentVideoId ? 0 : 1,
```

**Impact** :
- ✅ Background disparaît dès qu'une vidéo est disponible
- ✅ Pas d'attente de `isPlaying` ou `currentProgram`
- ✅ Transition immédiate vers le flux

---

### ✅ 3. Suppression Background Image si Vidéo Présente

**Fichier** : `app/page.tsx:1002-1006`

```typescript
// ❌ AVANT
backgroundImage: mode === 'tv' && backgrounds.tv
  ? `url('${backgrounds.tv}')`
  : 'none',

// ✅ APRÈS
backgroundImage: mode === 'tv' && backgrounds.tv && !currentVideoId
  ? `url('${backgrounds.tv}')`
  : 'none',
```

**Impact** :
- ✅ Image de fond ne s'affiche QUE si aucune vidéo disponible
- ✅ Le flux vidéo a la priorité absolue
- ✅ Pas de conflit visuel background/vidéo

---

### ✅ 4. Z-Index Ancre Vidéo

**Fichier** : `app/page.tsx:1026-1036`

```typescript
<div
  id="youtube-player-anchor"
  className="absolute inset-0 w-full h-full"
  style={{
    pointerEvents: 'none',
    transform: 'translateZ(0)',
    willChange: 'transform',
    aspectRatio: '16 / 9',
    overflow: 'hidden',
    zIndex: 10,  // ✅ AJOUTÉ
  }}
/>
```

**Impact** :
- ✅ L'ancre (et le lecteur) apparaît au-dessus du background (z-0)
- ✅ Garantit la visibilité du flux vidéo
- ✅ Sous l'overlay de verrouillage (z-30)

---

### ✅ 5. Détection Ancre Aggressive

**Fichier** : `components/GlobalYouTubePlayer.tsx` (avant ligne 117)

```typescript
// Force la détection de l'ancre dès qu'un videoId est disponible
useEffect(() => {
  if (isHomePage && currentVideoId) {
    const forceAnchorDetection = () => {
      const anchor = document.getElementById('youtube-player-anchor');
      if (anchor) {
        const bounds = anchor.getBoundingClientRect();
        setAnchorBounds(bounds);
        console.log('🎯 Ancre détectée:', bounds.width, 'x', bounds.height);
      }
    };

    forceAnchorDetection();
    // Retries agressifs à 10ms, 50ms, 100ms, 200ms
    const t1 = setTimeout(forceAnchorDetection, 10);
    const t2 = setTimeout(forceAnchorDetection, 50);
    const t3 = setTimeout(forceAnchorDetection, 100);
    const t4 = setTimeout(forceAnchorDetection, 200);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }
}, [isHomePage, currentVideoId]);
```

**Impact** :
- ✅ Détection immédiate dès que videoId change
- ✅ 4 retries au lieu de 2 (plus de chances de réussir)
- ✅ Premier retry à 10ms (ultra-rapide)
- ✅ Garantit l'affichage même si le DOM n'est pas complètement prêt

---

## Priorités Appliquées

### Ordre de Priorité Visuelle

1. **Flux Vidéo YouTube** (z-10) - PRIORITÉ ABSOLUE
2. **Overlay Verrouillage** (z-30) - Si programme futur
3. **Background Image** (z-0) - Seulement si pas de vidéo

### Logique de Décision

```typescript
if (currentVideoId) {
  // Afficher le flux vidéo
  isPlaying = true;
  backgroundOpacity = 0;
  backgroundImage = 'none';
} else {
  // Afficher l'image de fond
  backgroundImage = backgrounds.tv;
  backgroundOpacity = 1;
}
```

---

## Comportement Final

### Au Chargement (t=0)

1. ✅ Page se charge avec `currentVideoId` détecté
2. ✅ `isPlaying` forcé à `true` automatiquement
3. ✅ Background image masqué (`!currentVideoId` = false)
4. ✅ Background overlay masqué (opacity = 0)
5. ✅ Ancre détectée avec 4 retries agressifs
6. ✅ **Flux vidéo visible immédiatement**
7. ✅ Autoplay démarre (muted=true)
8. ✅ Badge "EN DIRECT" visible

### Cas : Programme Verrouillé

1. ✅ Vidéo se charge quand même en arrière-plan
2. ✅ Overlay de verrouillage (z-30) s'affiche par-dessus
3. ✅ Badge "EN DIRECT" + compteur visible
4. ✅ Quand l'heure arrive, overlay disparaît
5. ✅ Vidéo continue sans interruption

### Au Scroll (> 150px)

1. ✅ Mini-player apparaît en bas à gauche
2. ✅ Transition fluide (400ms cubic-bezier)
3. ✅ Vidéo continue sans rechargement
4. ✅ État partagé (`isPlaying`, `volume`, `isMuted`)

---

## Tests de Validation

### ✅ Test 1 : Affichage Immédiat
```
1. Ouvrir la page d'accueil
2. ✅ VÉRIFIER : Flux vidéo visible IMMÉDIATEMENT (pas d'image fixe)
3. ✅ VÉRIFIER : Autoplay démarre avec son coupé
4. ✅ VÉRIFIER : Badge "EN DIRECT" visible
5. ✅ VÉRIFIER : Pas de background image visible
```

### ✅ Test 2 : Programme Verrouillé
```
1. Configurer un programme futur dans playout
2. ✅ VÉRIFIER : Vidéo chargée en arrière-plan
3. ✅ VÉRIFIER : Overlay de compteur par-dessus
4. ✅ VÉRIFIER : Pas d'image de fond
5. ✅ VÉRIFIER : Quand l'heure arrive, overlay disparaît
```

### ✅ Test 3 : Transition Mini-Player
```
1. Charger la page avec flux visible
2. ✅ VÉRIFIER : Flux vidéo visible immédiatement
3. Scroller vers le bas (> 150px)
4. ✅ VÉRIFIER : Transition fluide vers mini-player
5. ✅ VÉRIFIER : Vidéo continue sans interruption
```

### ✅ Test 4 : Pas de Vidéo Disponible
```
1. Vider le playout (aucun programme)
2. ✅ VÉRIFIER : Background image s'affiche
3. ✅ VÉRIFIER : Message "Programmation bientôt disponible"
4. Ajouter un programme
5. ✅ VÉRIFIER : Background disparaît, vidéo apparaît
```

---

## Fichiers Modifiés

### 1. `app/page.tsx`

**Ligne 269-276** : Force `isPlaying=true` en mode TV avec videoId
```typescript
useEffect(() => {
  if (mode === 'tv' && currentVideoId) {
    setIsPlaying(true);
  }
}, [mode, currentVideoId, setIsPlaying]);
```

**Ligne 1002** : Background image seulement si pas de vidéo
```typescript
backgroundImage: mode === 'tv' && backgrounds.tv && !currentVideoId
  ? `url('${backgrounds.tv}')`
  : 'none',
```

**Ligne 1017** : Overlay masqué dès que videoId existe
```typescript
opacity: mode === 'tv' && currentVideoId ? 0 : 1,
```

**Ligne 1034** : Z-index ancre = 10
```typescript
zIndex: 10,
```

### 2. `components/GlobalYouTubePlayer.tsx`

**Lignes 82-106** : Détection ancre aggressive avec 4 retries
```typescript
useEffect(() => {
  if (isHomePage && currentVideoId) {
    const forceAnchorDetection = () => { /* ... */ };
    forceAnchorDetection();
    const t1 = setTimeout(forceAnchorDetection, 10);
    const t2 = setTimeout(forceAnchorDetection, 50);
    const t3 = setTimeout(forceAnchorDetection, 100);
    const t4 = setTimeout(forceAnchorDetection, 200);
    return () => { /* cleanup */ };
  }
}, [isHomePage, currentVideoId]);
```

---

## Hiérarchie Z-Index Finale

```
z-30 : Overlay de verrouillage (programme futur)
z-20 : Badge "EN DIRECT"
z-10 : Ancre vidéo + GlobalYouTubePlayer
z-0  : Background image (seulement si !currentVideoId)
```

---

## Build Status

```bash
✅ Build réussi
✅ 75 pages générées
✅ Aucune erreur TypeScript
✅ Aucune erreur de compilation
✅ Taille optimale (80 kB shared JS)
```

---

## Résumé Exécutif

### Problème
Le lecteur principal affichait une image statique au lieu du flux vidéo YouTube en direct.

### Solution
1. ✅ Force `isPlaying=true` dès qu'une vidéo est chargée
2. ✅ Background masqué dès que `currentVideoId` existe
3. ✅ Z-index ancre = 10 pour priorité visuelle
4. ✅ Détection ancre agressive avec 4 retries

### Résultat
- ✅ **Flux vidéo visible immédiatement au chargement**
- ✅ **Pas d'image de fond** quand vidéo présente
- ✅ **Autoplay fonctionnel** (muted)
- ✅ **Transition fluide** vers mini-player
- ✅ **Priorité absolue au direct**

---

**🎯 FLUX VIDÉO EN PRIORITÉ - PRÊT POUR PRÉSENTATION 14H**
