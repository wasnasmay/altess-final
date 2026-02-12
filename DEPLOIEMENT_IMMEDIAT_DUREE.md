# DÉPLOIEMENT IMMÉDIAT - CORRECTIF DURÉE

## 🚨 PROBLÈME IDENTIFIÉ

Les modifications sont dans les **fichiers locaux** mais **PAS sur Vercel**.

Tu regardes : `altess-final.vercel.app/playout/library`
Qui affiche : La **vieille version** (avant mes corrections)

## 📋 FICHIERS À DÉPLOYER

### 1. `app/playout/library/page.tsx` (CRITIQUE)

**Localisation** : `/tmp/cc-agent/62678032/project/app/playout/library/page.tsx`

**Changements principaux** :

**A. Fonction `loadMedia()` - Lignes 103-145**
```typescript
async function loadMedia() {
  try {
    const { data, error } = await supabase
      .from('playout_media_library')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    console.log('[Playout Library] ═══ DONNÉES CHARGÉES ═══');
    console.log('[Playout Library] Nombre de médias:', data?.length);

    // ✅ NORMALISATION FORCÉE
    const normalizedData = (data || []).map(item => {
      const durationMs = item.duration_ms || 0;
      const durationSeconds = item.duration_seconds || 0;

      let finalDurationMs = durationMs;

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
  } catch (error: any) {
    toast.error('Erreur lors du chargement des médias');
    console.error(error);
  } finally {
    setLoading(false);
  }
}
```

**B. Fonction `formatDuration()` - Ligne ~394**
```typescript
function formatDuration(durationMs: number): string {
  const totalSeconds = Math.round(durationMs / 1000);
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
```

**C. Affichage dans le JSX - Ligne ~532**
```typescript
<span>{formatDuration(item.duration_ms || 0)}</span>
```

**D. Fonction `resetForm()` - Ligne ~378**
```typescript
function resetForm() {
  setEditingId(null);
  setFormData({
    title: '',
    type: 'video',
    category: '',
    description: '',
    media_url: '',
    thumbnail_url: '',
    duration_seconds: 0,
    duration_ms: 0,  // ← AJOUTÉ
    file_size_mb: 0,
    tags: '',
    is_active: true,
  });
}
```

**E. Fonction `openEditDialog()` - Ligne ~363**
```typescript
setFormData({
  title: item.title,
  type: item.type,
  category: item.category,
  description: item.description,
  media_url: item.media_url,
  thumbnail_url: item.thumbnail_url,
  duration_seconds: item.duration_seconds,
  duration_ms: item.duration_ms || item.duration_seconds * 1000,  // ← AJOUTÉ
  file_size_mb: item.file_size_mb,
  tags: Array.isArray(item.tags) ? item.tags.join(', ') : '',
  is_active: item.is_active,
});
```

**F. Input durée dans le formulaire - Ligne ~692**
```typescript
<Input
  type="number"
  min="0"
  value={formData.duration_seconds}
  onChange={(e) => {
    const seconds = parseInt(e.target.value) || 0;
    setFormData({
      ...formData,
      duration_seconds: seconds,
      duration_ms: seconds * 1000,  // ← SYNCHRONISATION AUTO
    });
  }}
  required
  className="bg-slate-800 border-slate-700"
/>
```

---

### 2. `app/api/playout/media/save/route.ts` (DÉJÀ MODIFIÉ)

**Lignes 68-98** : Conversion bidirectionnelle `duration_ms` ↔ `duration_seconds`

---

### 3. `app/api/youtube/extract/route.ts` (DÉJÀ MODIFIÉ)

**Lignes 126, 148** : Ajout de `durationMs: duration * 1000`

---

### 4. `app/admin/test-playout-duration/page.tsx` (NOUVEAU - OPTIONNEL)

Page de diagnostic pour vérifier le chargement des données.

---

## 🚀 MÉTHODE DE DÉPLOIEMENT

### Option A : Copie manuelle (RAPIDE)

1. **Ouvre ton projet Git local**
2. **Copie le contenu** de ces fichiers depuis `/tmp/cc-agent/62678032/project/` vers ton projet
3. **Commit et push** :
```bash
git add app/playout/library/page.tsx
git add app/api/playout/media/save/route.ts
git add app/api/youtube/extract/route.ts
git commit -m "fix: Correction affichage durées bibliothèque playout"
git push
```

### Option B : Via interface Vercel

1. Va sur **Vercel Dashboard**
2. Trouve ton projet **altess-final**
3. Clique sur **"Redeploy"** avec les nouveaux fichiers

---

## ✅ VÉRIFICATION APRÈS DÉPLOIEMENT

1. **Attendre la fin du build Vercel** (2-3 minutes)

2. **Ouvrir** : `https://altess-final.vercel.app/playout/library`

3. **Ouvrir la console (F12)**

4. **Tu DOIS voir** :
```
[Playout Library] ═══ DONNÉES CHARGÉES ═══
[Playout Library] Nombre de médias: 5
[Playout Library] "The Soul of Blues Live": {
  duration_seconds_db: 7523,
  duration_ms_db: 7523000,
  finalDurationMs: 7523000
}
```

5. **Les durées doivent être** : `02:05:23` au lieu de `00:00:00`

---

## 🔧 SI TU N'AS PAS ACCÈS AU GIT

Je peux créer un **fichier ZIP** avec tous les fichiers modifiés que tu pourras extraire directement dans ton projet.

**OU**

Je peux créer un **patch file** que tu appliqueras avec :
```bash
patch -p1 < correctif-duree.patch
```

---

## 🎯 FICHIER COMPLET

Si tu veux le fichier complet sans chercher les lignes :

- **Fichier source** : `/tmp/cc-agent/62678032/project/app/playout/library/page.tsx`
- **À copier vers** : `ton-projet/app/playout/library/page.tsx`

Je peux aussi te l'afficher en entier si tu veux le copier-coller.

---

## ⚡ ACTION IMMÉDIATE

**Dis-moi quelle méthode tu préfères :**

1. Je crée un ZIP avec les fichiers modifiés
2. Je crée un patch Git
3. J'affiche le contenu complet des fichiers pour copier-coller
4. Autre méthode ?

Une fois déployé, le problème sera résolu !
