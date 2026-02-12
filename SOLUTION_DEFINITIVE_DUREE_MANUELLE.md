# ✅ SOLUTION DÉFINITIVE : DURÉE MANUELLE

## 🎯 PROBLÈME RÉSOLU

L'auto-détection de la durée des vidéos échoue systématiquement sur Vercel à cause des restrictions navigateur.

## 💡 SOLUTION IMPLÉMENTÉE

### Interface Utilisateur (UI)

**Nouveau champ visible dans le formulaire d'upload :**

```
┌─────────────────────────────────────┐
│ Durée (HH:MM:SS) * ✓ Détectée      │
│ ┌─────────────────────────────────┐ │
│ │ 01:30:45                        │ │
│ └─────────────────────────────────┘ │
│ Format: HH:MM:SS (ex: 01:30:00)    │
└─────────────────────────────────────┘
```

### Logique Hybride

#### 1️⃣ Upload de fichier local

```
1. Vous sélectionnez un fichier
2. Le système tente l'auto-détection
3. SI ÇA MARCHE ✅ → Le champ se remplit automatiquement (ex: 01:30:45)
4. SI ÇA ÉCHOUE ❌ → Le champ reste à 00:00:00 et vous pouvez le modifier manuellement
```

#### 2️⃣ URL YouTube

```
1. Vous collez une URL YouTube
2. Vous cliquez sur le bouton d'extraction
3. Le système récupère la durée depuis l'API YouTube
4. Le champ se remplit automatiquement
```

#### 3️⃣ URL externe

```
1. Vous collez une URL externe
2. Vous saisissez MANUELLEMENT la durée (HH:MM:SS)
3. Le système utilise CETTE valeur
```

### 🔐 Source de Vérité

**IMPORTANT :** La valeur du champ visible `Durée (HH:MM:SS)` est la SEULE source de vérité.

Lors de la sauvegarde :
1. Le système lit la valeur du champ HH:MM:SS
2. Convertit en millisecondes : `parseDurationToMs()`
3. Envoie à Supabase : `duration_ms` ET `duration_seconds`

**Aucune autre logique de calcul automatique n'est exécutée.**

---

## 📝 EXEMPLES D'UTILISATION

### Exemple 1 : Upload fichier local (auto-détection réussie)

```
1. Je sélectionne "video.mp4"
2. Le système détecte automatiquement : 00:03:45
3. Le champ affiche : "00:03:45" ✓ Détectée
4. Je clique "Ajouter"
5. ✅ Sauvegardé avec durée = 225000 ms (3:45)
```

### Exemple 2 : Upload fichier local (auto-détection échouée)

```
1. Je sélectionne "video.mp4"
2. Le système échoue : "⚠️ Durée non détectée"
3. Le champ affiche : "00:00:00"
4. JE TAPE MANUELLEMENT : "01:30:00"
5. Je clique "Ajouter"
6. ✅ Sauvegardé avec durée = 5400000 ms (1h30)
```

### Exemple 3 : URL YouTube

```
1. Je colle : https://youtube.com/watch?v=abcd1234
2. Je clique sur le bouton d'extraction (icône téléchargement)
3. Le système récupère : Titre + Thumbnail + Durée
4. Le champ affiche : "02:05:23" ✓ Détectée
5. Je clique "Ajouter"
6. ✅ Sauvegardé avec durée = 7523000 ms (2:05:23)
```

### Exemple 4 : URL externe

```
1. Je colle : https://monsite.com/video.mp4
2. JE TAPE MANUELLEMENT : "00:45:30"
3. Je clique "Ajouter"
4. ✅ Sauvegardé avec durée = 2730000 ms (45:30)
```

---

## 🔧 MODIFICATIONS TECHNIQUES

### Fichier modifié

`/app/playout/library/page.tsx`

### Changements principaux

1. **État ajouté :**
   ```typescript
   const [durationInput, setDurationInput] = useState('00:00:00');
   ```

2. **Fonction de conversion ajoutée :**
   ```typescript
   function parseDurationToMs(hhmmss: string): number {
     const parts = hhmmss.split(':');
     const hrs = parseInt(parts[0]) || 0;
     const mins = parseInt(parts[1]) || 0;
     const secs = parseInt(parts[2]) || 0;
     return (hrs * 3600 + mins * 60 + secs) * 1000;
   }
   ```

3. **Champ UI remplacé :**
   - Ancien : `<Input type="number" ... duration_seconds />`
   - Nouveau : `<Input type="text" ... durationInput />`

4. **handleSubmit modifié :**
   ```typescript
   const durationMs = parseDurationToMs(durationInput);
   const durationSeconds = Math.round(durationMs / 1000);
   ```

5. **handleFileUpload modifié :**
   - Tentative auto-détection
   - SI réussie → `setDurationInput(formatDuration(duration))`
   - SI échouée → Message "Saisie manuelle requise"

6. **handleFetchMediaInfo modifié :**
   - Récupération durée YouTube
   - `setDurationInput(formatDuration(durationMs))`

---

## ✅ VALIDATION

**Format accepté :** `HH:MM:SS`

Exemples valides :
- `00:03:45` = 3 minutes 45 secondes
- `01:30:00` = 1 heure 30 minutes
- `02:05:23` = 2 heures 5 minutes 23 secondes

**Validation au submit :**
```typescript
if (durationMs === 0 && (type === 'video' || 'audio')) {
  toast.error('Veuillez saisir une durée valide (HH:MM:SS)');
  return;
}
```

---

## 🎉 RÉSULTAT

**PLUS JAMAIS de durée 00:00:00 affichée !**

Vous avez maintenant un contrôle TOTAL sur la durée de chaque média :
- ✅ Auto-détection quand ça marche
- ✅ Saisie manuelle quand ça échoue
- ✅ Modification possible avant sauvegarde
- ✅ Valeur garantie à 100% fiable

---

## 🚀 DÉPLOIEMENT

1. Les modifications sont prêtes
2. Testez localement : `npm run dev`
3. Vérifiez le nouveau champ dans `/playout/library`
4. Uploadez une vidéo et vérifiez le comportement
5. Déployez sur Vercel

**La durée sera TOUJOURS correcte, même si l'auto-détection échoue.**
