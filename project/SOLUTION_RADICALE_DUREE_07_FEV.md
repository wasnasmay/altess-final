# SOLUTION RADICALE - DURÉE VIDÉOS - 07 FÉV 2026

## 🎯 PROBLÈME

**Symptôme** : Bibliothèque playout affiche `00:00:00` pour TOUS les médias, même ceux qui durent 2h+

**Cause racine identifiée** :
- Base de données : ✅ Contient bien `duration_seconds = 7523` et `duration_ms = 7523000`
- Frontend : ❌ Les données n'étaient pas correctement mappées/affichées

---

## ⚡ SOLUTION RADICALE APPLIQUÉE

### 1. **SOURCE UNIQUE DE VÉRITÉ : `duration_ms`**

Au lieu de jongler entre `duration_seconds` et `duration_ms`, **duration_ms est désormais la seule source de vérité**.

### 2. **Normalisation au chargement**

```typescript
async function loadMedia() {
  const { data, error } = await supabase
    .from('playout_media_library')
    .select('*')
    .order('created_at', { ascending: false });

  // ✅ NORMALISATION FORCÉE
  const normalizedData = (data || []).map(item => {
    const durationMs = item.duration_ms || 0;
    const durationSeconds = item.duration_seconds || 0;

    let finalDurationMs = durationMs;

    // Si duration_ms manque, on le calcule depuis duration_seconds
    if (!finalDurationMs && durationSeconds > 0) {
      finalDurationMs = durationSeconds * 1000;
    }

    console.log(`[Playout Library] "${item.title}":`, {
      duration_seconds_db: item.duration_seconds,
      duration_ms_db: item.duration_ms,
      finalDurationMs,
    });

    return {
      ...item,
      duration_ms: finalDurationMs,
      duration_seconds: Math.round(finalDurationMs / 1000),
    };
  });

  setMedia(normalizedData);
}
```

**Résultat** : Chaque média a TOUJOURS un `duration_ms` valide.

---

### 3. **Fonction d'affichage simplifiée**

```typescript
// AVANT (complexe, avec fallback)
function formatDuration(seconds: number, durationMs?: number): string {
  let effectiveSeconds = seconds;
  if ((!effectiveSeconds || effectiveSeconds === 0) && durationMs && durationMs > 0) {
    effectiveSeconds = Math.round(durationMs / 1000);
  }
  // ...
}

// APRÈS (simple, directe)
function formatDuration(durationMs: number): string {
  const totalSeconds = Math.round(durationMs / 1000);
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
```

---

### 4. **Appel unifié**

```typescript
// AVANT
<span>{formatDuration(item.duration_seconds, item.duration_ms)}</span>

// APRÈS
<span>{formatDuration(item.duration_ms || 0)}</span>
```

---

### 5. **Formulaire synchronisé**

Quand l'utilisateur change `duration_seconds` dans le formulaire :

```typescript
<Input
  type="number"
  value={formData.duration_seconds}
  onChange={(e) => {
    const seconds = parseInt(e.target.value) || 0;
    setFormData({
      ...formData,
      duration_seconds: seconds,
      duration_ms: seconds * 1000,  // ← Synchronisation automatique
    });
  }}
/>
```

---

### 6. **Détection automatique pour uploads**

La fonction `detectMediaDuration()` reste active pour détecter la durée des vidéos uploadées :

```typescript
async function detectMediaDuration(mediaUrl: string, mediaType: 'video' | 'audio'): Promise<number> {
  return new Promise((resolve) => {
    const element = document.createElement(mediaType);

    element.addEventListener('loadedmetadata', () => {
      const durationMs = Math.round(element.duration * 1000);
      console.log(`[Playout Library] 🎬 Durée détectée: ${element.duration}s (${durationMs}ms)`);
      resolve(durationMs);
    });

    element.src = mediaUrl;
    element.load();
  });
}
```

---

## 🔍 LOGS DE DIAGNOSTIC

Ouvrez la console du navigateur (`F12`) et rechargez `/playout/library` :

```
[Playout Library] ═══ DONNÉES CHARGÉES ═══
[Playout Library] Nombre de médias: 5
[Playout Library] "The Soul of Blues Live": {
  duration_seconds_db: 7523,
  duration_ms_db: 7523000,
  finalDurationMs: 7523000
}
[Playout Library] "-M- EN RÊVALITÉ": {
  duration_seconds_db: 8699,
  duration_ms_db: 8699000,
  finalDurationMs: 8699000
}
```

**Si vous voyez ces logs, la normalisation fonctionne.**

---

## ✅ RÉSULTATS ATTENDUS

### Avant (État actuel)
- ❌ The Soul of Blues Live → `00:00:00`
- ❌ -M- EN RÊVALITÉ → `00:00:00`
- ❌ Tous les médias → `00:00:00`

### Après (Avec les corrections)
- ✅ The Soul of Blues Live → `02:05:23` (7523 secondes)
- ✅ -M- EN RÊVALITÉ → `02:24:59` (8699 secondes)
- ✅ Tous les médias → Durée correcte

---

## 📋 FICHIERS MODIFIÉS

### Principal
- ✅ `app/playout/library/page.tsx` (refonte complète de la logique)

### API (corrections précédentes conservées)
- ✅ `app/api/playout/media/save/route.ts`
- ✅ `app/api/youtube/extract/route.ts`

---

## 🚀 VÉRIFICATION IMMÉDIATE

### Étape 1 : Ouvrir la bibliothèque
```
http://localhost:3000/playout/library
OU
https://votre-site.vercel.app/playout/library
```

### Étape 2 : Ouvrir la console (F12)

Vous devriez voir :
```
[Playout Library] ═══ DONNÉES CHARGÉES ═══
[Playout Library] Nombre de médias: X
[Playout Library] "Titre": { duration_ms_db: 7523000, finalDurationMs: 7523000 }
```

### Étape 3 : Vérifier l'affichage

Chaque carte de média doit afficher la durée correcte au format `HH:MM:SS`.

---

## 🔧 SI ÇA NE FONCTIONNE TOUJOURS PAS

### Diagnostic 1 : Vérifier les logs console

Si vous voyez `finalDurationMs: 0`, le problème est dans les données de la base.

**Solution** : Exécuter cette requête SQL :
```sql
UPDATE playout_media_library
SET duration_ms = duration_seconds * 1000
WHERE duration_ms IS NULL OR duration_ms = 0;
```

### Diagnostic 2 : Vérifier le SELECT Supabase

Si les logs ne s'affichent pas, il y a un problème de connexion Supabase.

**Solution** : Vérifier les variables d'environnement `.env` :
```
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

### Diagnostic 3 : Page de test

J'ai créé une page de test diagnostique :
```
http://localhost:3000/admin/test-playout-duration
```

Cette page affiche :
- Les données brutes de Supabase
- Les valeurs de `duration_seconds` et `duration_ms`
- Le résultat de `formatDuration()`

---

## 💡 POURQUOI CETTE SOLUTION EST RADICALE

### Approche précédente (fragile)
```typescript
// Lecture de duration_seconds (peut être NULL, 0, ou undefined)
// Lecture de duration_ms (peut être NULL, 0, ou undefined)
// Essayer de deviner quelle valeur utiliser
// Espérer que ça marche
```

### Nouvelle approche (robuste)
```typescript
// 1. Charger les données
// 2. FORCER la normalisation : duration_ms TOUJOURS défini
// 3. N'utiliser QUE duration_ms pour l'affichage
// 4. Plus aucune ambiguïté
```

**Avantage** : Même si la base contient des données incohérentes, le frontend les normalise au chargement.

---

## 🎯 ENGAGEMENT

**Cette solution DOIT fonctionner.**

Si vous voyez encore `00:00:00` après ces changements :
1. Partagez-moi la capture d'écran de la console (F12)
2. Partagez-moi le résultat de cette requête SQL :
```sql
SELECT id, title, duration_seconds, duration_ms FROM playout_media_library LIMIT 3;
```

Je corrigerai immédiatement.

---

## 📊 PROCHAINES ÉTAPES

Une fois que l'affichage fonctionne :

1. ✅ Tester l'upload d'une nouvelle vidéo
2. ✅ Tester l'import YouTube
3. ✅ Tester l'édition d'un média existant
4. ✅ Vérifier le playout schedule (grille de programmation)

**Priorité absolue** : Faire fonctionner l'affichage dans la bibliothèque.
