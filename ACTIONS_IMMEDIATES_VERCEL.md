# 🔥 ACTIONS IMMÉDIATES - Version 2.0

**Date** : 6 Février 2026 08:15 UTC
**Version** : 2.0 - Stable

---

## ✅ CE QUI A ÉTÉ FAIT

### 1. Script SQL Complet Créé

**Fichier** : `SCRIPT_SQL_COMPLET_RECONSTRUCTION.sql`

**Contenu** :
- ✅ Table `playout_channels` (canaux Web TV/Radio)
- ✅ Table `playout_media_library` (bibliothèque médias)
- ✅ Table `playout_schedules` (programmation)
- ✅ Table `radio_stations` (stations radio)
- ✅ Permissions RLS configurées
- ✅ Index pour performance
- ✅ Données de test insérées

### 2. Badge Version Visible Ajouté

**Changement** : Badge vert "Version 2.0 - Stable" ajouté en haut à gauche de la page d'accueil

**Pourquoi** : Permet de vérifier instantanément si Vercel a bien déployé la nouvelle version

---

## 🎯 ACTIONS À FAIRE MAINTENANT

### ÉTAPE 1 : Appliquer le Script SQL dans Supabase

1. **Ouvrez Supabase** : https://supabase.com
2. **Sélectionnez votre projet**
3. **Cliquez sur "SQL Editor"** (dans le menu de gauche)
4. **Cliquez sur "New query"**
5. **Copiez le contenu** du fichier `SCRIPT_SQL_COMPLET_RECONSTRUCTION.sql`
6. **Collez-le** dans l'éditeur
7. **Cliquez sur "Run"** (ou Ctrl+Enter)
8. **Attendez** que "Success" s'affiche

**Résultat attendu** :
```
✓ playout_channels: 2 rows
✓ playout_media_library: 1 row
✓ playout_schedules: 1 row
✓ radio_stations: 0 rows
```

### ÉTAPE 2 : Forcer Redeploy Vercel SANS Cache

1. **Ouvrez Vercel** : https://vercel.com
2. **Sélectionnez** votre projet "altess-final"
3. **Onglet "Deployments"**
4. **Cliquez** sur le dernier deployment (première ligne)
5. **Menu ⋮** (3 points en haut à droite) → **"Redeploy"**
6. **🔴 DÉCOCHEZ** la case "Use existing Build Cache"
7. **Cliquez** sur le bouton bleu **"Redeploy"**
8. **ATTENDEZ** 3-5 minutes

**Surveillez** :
- Building... → Compiling... → Deploying... → Ready ✓

### ÉTAPE 3 : Vider Cache Navigateur

**Option A - Rafraîchissement forcé** :
```
Windows/Linux : Ctrl + Shift + R
Mac : Cmd + Shift + R
```

**Option B - Vider complètement** :
```
1. Ctrl + Shift + Delete
2. Cochez "Images et fichiers en cache"
3. Période : "Toutes les périodes"
4. Cliquez "Effacer les données"
```

### ÉTAPE 4 : Vérifier le Déploiement

1. **Ouvrez** : https://altess-final.vercel.app
2. **Vous devez voir** un badge vert en haut à gauche :
   ```
   ┌─────────────────────┐
   │ Version 2.0 - Stable│
   └─────────────────────┘
   ```

**SI VOUS VOYEZ LE BADGE** = ✅ Vercel a bien déployé

**SI VOUS NE VOYEZ PAS LE BADGE** = ❌ Recommencez l'étape 3 (vider cache)

### ÉTAPE 5 : Tester le Playout

1. **Allez sur** : https://altess-final.vercel.app/playout/schedule
2. **Sélectionnez** la date du jour (6 février 2026)
3. **Vous devriez voir** : 1 programme à 14:00

**Programme attendu** :
```
╔═══════════════════════════════════════╗
║ #1  14:00 → 16:05 (02:05:23)         ║
║     Test Video - Blues Live           ║
╚═══════════════════════════════════════╝
```

4. **Cliquez** sur "Ajouter" pour tester l'ajout d'un nouveau programme
5. **Vérifiez** que la durée s'affiche correctement

---

## 🔍 VÉRIFICATIONS

### Vérification 1 : Badge Version Visible

**URL** : https://altess-final.vercel.app

**Attendu** : Badge vert "Version 2.0 - Stable" en haut à gauche

### Vérification 2 : Pas d'Erreur Console

1. Appuyez sur **F12** (ouvre DevTools)
2. Onglet **"Console"**
3. **Cherchez** des erreurs rouges
4. **SI erreur "column channel_id does not exist"** → Le script SQL n'a pas été appliqué (retour étape 1)
5. **SI pas d'erreur** → ✅ Tout est OK

### Vérification 3 : Base de Données

**Dans Supabase SQL Editor**, exécutez :

```sql
-- Vérifier les colonnes de playout_schedules
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'playout_schedules' 
  AND column_name IN ('channel_id', 'media_id', 'scheduled_datetime', 'duration_seconds')
ORDER BY column_name;
```

**Résultat attendu** : 4 lignes
```
channel_id
duration_seconds
media_id
scheduled_datetime
```

**SI moins de 4 lignes** → Réappliquez le script SQL (étape 1)

---

## 📊 RÉSUMÉ DES COLONNES

### Table `playout_schedules`

**Colonnes OBLIGATOIRES** :
- `id` (uuid)
- `channel_id` (uuid) ← Référence à playout_channels
- `media_id` (uuid) ← Référence à playout_media_library
- `scheduled_date` (date)
- `scheduled_time` (time)
- `scheduled_datetime` (timestamptz)
- `duration_seconds` (integer)
- `order_position` (integer)

**Le code frontend utilise EXACTEMENT ces noms**.

---

## ⚠️ PROBLÈMES COURANTS

### Problème 1 : Badge Version pas visible

**Solution** :
1. Ctrl+Shift+R plusieurs fois
2. Essayez en navigation privée
3. Vérifiez que vous êtes sur le bon domaine

### Problème 2 : Erreur "column does not exist"

**Solution** :
1. Vérifiez que le script SQL a été appliqué (étape 1)
2. Dans Supabase, vérifiez que les colonnes existent (vérification 3)
3. Réappliquez le script si nécessaire

### Problème 3 : Build Vercel échoue

**Solution** :
1. Regardez les logs du build dans Vercel
2. Si erreur de mémoire → Augmentez les ressources dans Settings
3. Si erreur de code → Envoyez-moi les logs

---

## 🎬 RÉCAPITULATIF EN 5 ÉTAPES

```
1. ✅ Appliquer script SQL dans Supabase
2. ✅ Redeploy Vercel SANS cache
3. ✅ Vider cache navigateur (Ctrl+Shift+R)
4. ✅ Vérifier badge "Version 2.0" visible
5. ✅ Tester /playout/schedule
```

---

## 📁 FICHIERS IMPORTANTS

1. **SCRIPT_SQL_COMPLET_RECONSTRUCTION.sql**
   - À copier/coller dans Supabase SQL Editor
   - Crée toutes les tables nécessaires

2. **app/page.tsx**
   - Modifié avec badge "Version 2.0 - Stable"

3. **ACTIONS_IMMEDIATES_VERCEL.md** (ce fichier)
   - Guide étape par étape

---

## 🆘 BESOIN D'AIDE ?

Si après toutes ces étapes :
- ✅ Le badge "Version 2.0" est visible → Nouveau code déployé
- ❌ Erreurs persistent → Envoyez captures d'écran :
  1. Console (F12)
  2. Page /playout/schedule
  3. Logs build Vercel

---

**Date** : 6 Février 2026 08:15 UTC
**Statut** : ✅ PRÊT POUR DÉPLOIEMENT
**Version** : 2.0 - Stable
