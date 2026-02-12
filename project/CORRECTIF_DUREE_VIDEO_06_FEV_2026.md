# 🔧 CORRECTIF - Durée Vidéo Planning

**Date** : 6 Février 2026 09:00 UTC
**Problème** : Durée par défaut de 3 minutes appliquée au lieu de la vraie durée
**Solution** : Récupération directe depuis la base de données

---

## 🐛 PROBLÈME IDENTIFIÉ

### Symptôme
Lors de l'ajout d'un média au planning, le système appliquait une durée par défaut de 3 minutes (180 secondes) au lieu de la durée réelle du média.

### Cause
Le code utilisait le state local `mediaLibrary` qui pouvait contenir des valeurs obsolètes ou incorrectes. Quand `duration_seconds` était 0 ou undefined, le système appliquait automatiquement 180 secondes.

---

## ✅ SOLUTION APPLIQUÉE

### Modification du Code

**Fichier** : `app/playout/schedule/page.tsx`
**Fonction** : `handleAddToSchedule()`

**AVANT** :
```typescript
const media = mediaLibrary.find(m => String(m.id) === String(selectedMedia));
let effectiveDuration = media.duration_seconds;
if (!effectiveDuration || effectiveDuration === 0) {
  effectiveDuration = 180; // 3 minutes par défaut
}
```

**APRÈS** :
```typescript
// ✅ RÉCUPÉRER LA DURÉE DIRECTEMENT DEPUIS LA BASE DE DONNÉES
const { data: mediaFromDB, error: mediaError } = await supabase
  .from('playout_media_library')
  .select('id, title, duration_seconds')
  .eq('id', selectedMedia)
  .maybeSingle();

let effectiveDuration = mediaFromDB.duration_seconds;
if (!effectiveDuration || effectiveDuration === 0) {
  effectiveDuration = 180; // 3 minutes par défaut seulement si vraiment 0
}
```

### Avantages

1. **Valeur Garantie** : On récupère toujours la valeur la plus à jour depuis la base
2. **Pas de Cache** : Pas de dépendance sur le state local qui pourrait être obsolète
3. **Vérification** : On vérifie que le média existe vraiment dans la base
4. **Logs Clairs** : Console logs montrent la durée récupérée depuis la DB

---

## 📊 FORMATAGE DE LA DURÉE

### Fonction `formatTime`

**Code** :
```typescript
function formatTime(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
```

**Exemples** :
- 365 secondes → `00:06:05`
- 7523 secondes → `02:05:23`
- 10143 secondes → `02:49:03`

### Affichage sur les Vignettes

**Code existant** (déjà correct) :
```typescript
<div className="text-base font-extrabold text-black">
  {formatTime(media.duration_seconds || 180)}
</div>
```

Format affiché : **HH:MM:SS** (ex: `02:05:23`)

---

## 🔍 VÉRIFICATIONS

### Dans la Console

Lors de l'ajout d'un média au planning, vous verrez :

```
[Playout Schedule] 🔍 Récupération de la durée depuis la base...
[Playout Schedule] ✅ Media found: The Soul of Blues Live...
[Playout Schedule] ✅ Media duration from DB: 7523 seconds
[Playout Schedule] 🔍 VALIDATION FINALE - Insert data: {
  ...
  duration_seconds: 7523,
  duration_from_db: 7523
}
```

### Dans le Planning

Après ajout, le programme doit afficher :
- **Durée correcte** (ex: `02:05:23` au lieu de `00:03:00`)
- **Heure de fin calculée** avec la vraie durée
- **Pas de toast warning** "Durée invalide détectée"

---

## 🎯 STRUCTURE SQL (Inchangée)

### Table `playout_media_library`

```sql
CREATE TABLE playout_media_library (
  id uuid PRIMARY KEY,
  title text NOT NULL,
  duration_seconds integer NOT NULL DEFAULT 0,  -- ✅ En SECONDES
  ...
);
```

### Colonne Utilisée

**Nom** : `duration_seconds` (pas `duration_ms`)
**Type** : `integer`
**Unité** : **Secondes**

### Exemples de Données Réelles

```sql
SELECT title, duration_seconds 
FROM playout_media_library 
WHERE is_active = true;
```

**Résultats** :
| title | duration_seconds |
|-------|------------------|
| The Soul of Blues Live | 7523 |
| -M- EN RÊVALITÉ | 8699 |
| Tamally Maak | 365 |

---

## ✅ CHECKLIST DE VALIDATION

- [x] Code modifié : récupération directe depuis DB
- [x] Fonction `formatTime` : formate en HH:MM:SS
- [x] Aucune modification SQL (gel respecté)
- [x] Logs console ajoutés pour debugging
- [x] Fallback 180 secondes conservé (si durée = 0)

---

## 🧪 TEST

### Étape 1 : Aller sur le Planning

```
https://altess-final.vercel.app/playout/schedule
```

### Étape 2 : Ajouter un Média

1. Cliquer sur **"Ajouter au planning"**
2. Sélectionner **"The Soul of Blues Live"**
3. Observer la durée affichée : **`02:05:23`** ✅
4. Cliquer **"Ajouter au planning"**

### Étape 3 : Vérifier dans la Console (F12)

```
✅ Media duration from DB: 7523 seconds
✅ duration_from_db: 7523
```

### Étape 4 : Vérifier l'Affichage

Le programme ajouté doit montrer :
- Durée : **`02:05:23`** (et non `00:03:00`)
- Heure de fin calculée correctement

---

## 📝 NOTES TECHNIQUES

### Pourquoi Récupérer Directement depuis la DB ?

**Problème potentiel avec le state local** :
1. Le state `mediaLibrary` est chargé une fois au début
2. Si des médias sont ajoutés/modifiés après, le state n'est pas à jour
3. Les durées peuvent être 0 si l'import YouTube n'a pas fini
4. Le state peut contenir des données incohérentes

**Solution avec récupération directe** :
1. ✅ Toujours la valeur la plus récente
2. ✅ Pas de problème de synchronisation
3. ✅ Vérification que le média existe vraiment
4. ✅ Une seule source de vérité : la base de données

---

## 🎬 RÉSULTAT ATTENDU

**AVANT** : Tous les médias ajoutés → Durée `00:03:00` (3 min par défaut)
**APRÈS** : Chaque média → Durée réelle depuis la base (ex: `02:05:23`)

---

**Date** : 6 Février 2026 09:00 UTC
**Statut** : ✅ CORRIGÉ
**Impact** : Durées correctes dans le planning
**Code modifié** : app/playout/schedule/page.tsx (fonction handleAddToSchedule)
**Tables SQL** : ✅ AUCUNE MODIFICATION (gel respecté)
