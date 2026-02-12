# CHANGEMENTS CRITIQUES À APPLIQUER

## 🎯 FICHIER : `app/playout/library/page.tsx`

### CHANGEMENT 1 : Fonction `loadMedia()` (Ligne ~103)

**REMPLACER** :
```typescript
async function loadMedia() {
  try {
    const { data, error } = await supabase
      .from('playout_media_library')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    setMedia(data || []);
  } catch (error: any) {
    toast.error('Erreur lors du chargement des médias');
    console.error(error);
  } finally {
    setLoading(false);
  }
}
```

**PAR** :
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

---

### CHANGEMENT 2 : Fonction `formatDuration()` (Ligne ~320)

**REMPLACER** :
```typescript
function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
```

**PAR** :
```typescript
function formatDuration(durationMs: number): string {
  const totalSeconds = Math.round(durationMs / 1000);
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
```

---

### CHANGEMENT 3 : Affichage dans le JSX (Ligne ~479)

**REMPLACER** :
```typescript
<span>{formatDuration(item.duration_seconds)}</span>
```

**PAR** :
```typescript
<span>{formatDuration(item.duration_ms || 0)}</span>
```

---

### CHANGEMENT 4 : Type `MediaFormData` (Ligne ~57)

**AJOUTER** `duration_ms?: number;` dans l'interface :

```typescript
type MediaFormData = {
  title: string;
  type: MediaType;
  category: string;
  description: string;
  media_url: string;
  thumbnail_url: string;
  duration_seconds: number;
  duration_ms?: number;  // ← AJOUTER CETTE LIGNE
  file_size_mb: number;
  tags: string;
  is_active: boolean;
};
```

---

### CHANGEMENT 5 : Fonction `resetForm()` (Ligne ~304)

**AJOUTER** `duration_ms: 0,` :

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
    duration_ms: 0,  // ← AJOUTER CETTE LIGNE
    file_size_mb: 0,
    tags: '',
    is_active: true,
  });
}
```

---

### CHANGEMENT 6 : Fonction `openEditDialog()` (Ligne ~290)

**AJOUTER** `duration_ms` dans le setFormData :

```typescript
function openEditDialog(item: Media) {
  setEditingId(item.id);
  setFormData({
    title: item.title,
    type: item.type,
    category: item.category,
    description: item.description,
    media_url: item.media_url,
    thumbnail_url: item.thumbnail_url,
    duration_seconds: item.duration_seconds,
    duration_ms: item.duration_ms || item.duration_seconds * 1000,  // ← AJOUTER CETTE LIGNE
    file_size_mb: item.file_size_mb,
    tags: Array.isArray(item.tags) ? item.tags.join(', ') : '',
    is_active: item.is_active,
  });
  setIsDialogOpen(true);
}
```

---

### CHANGEMENT 7 : Input durée dans formulaire (Ligne ~692)

**REMPLACER** :
```typescript
<Input
  type="number"
  min="0"
  value={formData.duration_seconds}
  onChange={(e) => setFormData({ ...formData, duration_seconds: parseInt(e.target.value) })}
  required
  className="bg-slate-800 border-slate-700"
/>
```

**PAR** :
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
      duration_ms: seconds * 1000,
    });
  }}
  required
  className="bg-slate-800 border-slate-700"
/>
```

---

### CHANGEMENT 8 : Fonction `handleFetchMediaInfo()` (Ligne ~159)

**REMPLACER** :
```typescript
if (data.success) {
  setFormData({
    ...formData,
    title: formData.title || data.title || '',
    duration_seconds: 0,
    thumbnail_url: data.thumbnail || '',
    media_url: data.embedUrl || formData.media_url,
  });
  toast.success('Informations YouTube récupérées avec succès');
}
```

**PAR** :
```typescript
if (data.success) {
  const durationMs = data.durationMs || 0;
  const durationSeconds = durationMs > 0 ? Math.round(durationMs / 1000) : 0;

  setFormData({
    ...formData,
    title: formData.title || data.title || '',
    duration_seconds: durationSeconds,
    duration_ms: durationMs,
    thumbnail_url: data.thumbnail || '',
    media_url: data.embedUrl || formData.media_url,
  });
  toast.success('Informations YouTube récupérées avec succès');
}
```

---

## 🚀 APRÈS AVOIR APPLIQUÉ CES CHANGEMENTS

1. **Commit et push** vers ton repo Git
2. **Attendre le déploiement Vercel** (2-3 min)
3. **Recharger** `altess-final.vercel.app/playout/library`
4. **Ouvrir F12** et vérifier les logs
5. **Les durées doivent afficher** : `02:05:23` au lieu de `00:00:00`

---

## ⚡ ALTERNATIVE RAPIDE

**Tu veux que je crée le fichier complet pour copier-coller ?**

Dis-moi et je te donne le contenu entier de `app/playout/library/page.tsx` prêt à remplacer.
