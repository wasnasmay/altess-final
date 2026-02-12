# SYSTÈME DE SYNCHRONISATION EN TEMPS RÉEL (LIVE-SYNC)

## Vue d'ensemble

Le système de Live-Sync garantit que tous les spectateurs visionnent **exactement la même image au même moment**, peu importe quand ils rejoignent la diffusion ou rafraîchissent leur page.

---

## 1. VERROUILLAGE PRÉ-PROGRAMME

### Comportement
- Si l'heure actuelle < heure de début du programme → **Verrouillage activé**
- Affichage d'un écran d'attente élégant avec :
  - Horloge animée
  - Message "Début du programme à [HEURE]"
  - Titre du programme à venir
- La vidéo **n'est pas chargée** pour économiser la bande passante

### Implémentation
```typescript
// app/page.tsx (ligne ~610)
if (offset < 0) {
  console.log('🔒 Programme verrouillé - Début prévu à', currentProg.start_time);
  setIsProgramLocked(true);
  setProgramStartTime(currentProg.start_time);
  startTimeOffsetRef.current = 0;
  setStartTimeOffset(0);
}
```

---

## 2. CALCUL DU DÉCALAGE EN TEMPS RÉEL

### Formule Critique
```typescript
const now = new Date();
const currentTimeInSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();

const [hours, minutes, seconds] = programStartTime.split(':').map(Number);
const startTimeInSeconds = hours * 3600 + minutes * 60 + (seconds || 0);

const offset = currentTimeInSeconds - startTimeInSeconds;
```

### Exemple Concret
- Programme démarre à **14:00:00**
- Utilisateur rafraîchit la page à **14:05:30**
- Calcul : `(14*3600 + 5*60 + 30) - (14*3600 + 0 + 0) = 330 secondes`
- Résultat : **La vidéo démarre à 5 minutes et 30 secondes**

---

## 3. APPLICATION IMMÉDIATE DU SEEKTO()

### Au chargement initial (YouTubePlayer.tsx)
```typescript
const handleReady = (player: any) => {
  isReady.current = true;
  playerRef.current = player;

  // LIVE-SYNC CRITIQUE : Forcer seekTo immédiatement
  if (player && player.seekTo) {
    const targetTime = startTimeOffset > 0 ? startTimeOffset : 0;
    console.log('🎬 [handleReady] Force seekTo =>', targetTime, 'secondes');
    player.seekTo(targetTime, true);
    lastSeekTime.current = targetTime;

    // Double application pour garantir la position (iOS/Android)
    setTimeout(() => {
      if (player.seekTo) {
        console.log('🔁 [handleReady] Double seekTo =>', targetTime, 'secondes');
        player.seekTo(targetTime, true);
      }
    }, 500);
  }

  setPlaying(true);
};
```

### Pourquoi deux appels seekTo() ?
1. **Premier appel** : Application immédiate dès que le player est prêt
2. **Deuxième appel (500ms)** : Contournement des bugs iOS/Android qui réinitialisent parfois la position

---

## 4. RESYNCHRONISATION AUTOMATIQUE

### Vérification toutes les 5 secondes (GlobalYouTubePlayer.tsx)
```typescript
syncInterval.current = setInterval(() => {
  if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
    const playerTime = playerRef.current.getCurrentTime();

    // effectiveStartTime est mis à jour depuis le contexte toutes les 10s
    if (Math.abs(playerTime - effectiveStartTime) > 3) {
      console.log('🔄 Resync: playerTime=' + playerTime.toFixed(1) + 's, expected=' + effectiveStartTime.toFixed(1) + 's');
      playerRef.current.seekTo(effectiveStartTime, true);
    }
  }
}, 5000);
```

### Tolérance de 3 secondes
- Si la différence entre `playerTime` et `effectiveStartTime` > 3 secondes → Resynchronisation
- Évite les micro-ajustements permanents qui perturberaient la lecture

---

## 5. MISE À JOUR CONTINUE DE L'OFFSET

### Recalcul toutes les 10 secondes (app/page.tsx)
```typescript
useEffect(() => {
  const updateOffset = () => {
    if (currentProgram?.start_time) {
      const now = new Date();
      const [hours, minutes, seconds] = currentProgram.start_time.split(':').map(Number);
      const startTimeInSeconds = hours * 3600 + minutes * 60 + (seconds || 0);
      const currentTimeInSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
      const offset = currentTimeInSeconds - startTimeInSeconds;

      if (offset < 0) {
        // Programme pas encore débuté
        setIsProgramLocked(true);
      } else {
        // Programme en cours - calcul en temps réel
        setIsProgramLocked(false);
        startTimeOffsetRef.current = offset;
        setStartTimeOffset(offset);
        console.log('⏱️ Mise à jour Live-Sync:', offset, 'secondes');
      }
    }
  };

  updateOffset();
  const interval = setInterval(updateOffset, 10000);
  return () => clearInterval(interval);
}, [currentProgram?.start_time, setStartTimeOffset]);
```

---

## 6. SUPPRESSION DE TOUTE RÉINITIALISATION

### ❌ Ce qui a été supprimé
- Paramètre `&t=` dans l'URL YouTube (interférait avec seekTo)
- Logique de démarrage à 0 au montage du composant
- Reset de currentTime lors des changements de state

### ✅ Ce qui reste
- Uniquement le calcul basé sur l'horloge système
- Application forcée du seekTo() à chaque mise à jour d'offset
- Resynchronisation automatique toutes les 5 secondes

---

## 7. SCÉNARIOS D'UTILISATION

### Scénario A : Utilisateur arrive à 14h00 pile
1. Calcul : `offset = 0` (juste à l'heure)
2. Vidéo démarre à `0 seconde`
3. Lecture normale sans décalage

### Scénario B : Utilisateur arrive à 14h10
1. Calcul : `offset = 600` secondes (10 minutes)
2. `seekTo(600)` appliqué immédiatement
3. Vidéo démarre à **10 minutes** exactement

### Scénario C : Utilisateur rafraîchit à 14h15
1. Recalcul : `offset = 900` secondes (15 minutes)
2. Nouveau `seekTo(900)` appliqué
3. Vidéo repositionnée à **15 minutes**

### Scénario D : Utilisateur arrive à 13h50 (avant l'heure)
1. Calcul : `offset = -600` (négatif)
2. **Verrouillage activé**
3. Écran d'attente affiché
4. À 14h00 précises, déverrouillage automatique et lancement de la vidéo

---

## 8. LOGS DE DÉBOGAGE

### Recherchez ces messages dans la console
```
🔒 Programme verrouillé - Début prévu à 14:00:00
🎯 Live-Sync activé - Offset: 330 secondes pour [Titre]
🎬 [handleReady] Force seekTo => 330.0 secondes
🔁 [handleReady] Double seekTo => 330.0 secondes
⏱️ Mise à jour Live-Sync: 340 secondes
🔄 Resync: playerTime=335.2s, expected=340.0s
```

---

## 9. AVANTAGES DU SYSTÈME

✅ **Synchronisation parfaite** : Tous les utilisateurs voient la même chose
✅ **Zéro redémarrage** : Pas de retour à 0 lors des rafraîchissements
✅ **Gestion intelligente** : Verrouillage avant l'heure de début
✅ **Auto-correction** : Resynchronisation automatique toutes les 5 secondes
✅ **Performance** : Pas de chargement vidéo avant l'heure prévue
✅ **Mobile-friendly** : Double application du seekTo() pour iOS/Android

---

## 10. POINTS D'ATTENTION

⚠️ **Ne jamais** ajouter `&t=` dans l'URL YouTube
⚠️ **Ne jamais** réinitialiser `currentTime` à 0 manuellement
⚠️ **Toujours** baser le calcul sur l'horloge système
⚠️ **Toujours** vérifier que `offset >= 0` avant de charger la vidéo

---

## RÉSUMÉ TECHNIQUE

| Élément | Fréquence | Objectif |
|---------|-----------|----------|
| Calcul offset initial | 1 fois au chargement | Positionner la vidéo au bon moment |
| Mise à jour offset | Toutes les 10s | Suivre la progression du programme |
| Resynchronisation | Toutes les 5s | Corriger les dérives de lecture |
| Vérification verrouillage | Toutes les 10s | Déverrouiller à l'heure exacte |
| Double seekTo() | 1 fois au chargement | Garantir la position (mobile) |

---

**Système opérationnel et testé pour la soutenance.**
