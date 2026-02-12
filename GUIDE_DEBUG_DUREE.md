# 🔍 GUIDE DE DEBUG - PROBLÈME DURÉE 00:00:00

## 🎯 Objectif

Comprendre pourquoi certaines vidéos s'affichent avec `00:00:00` au lieu de leur durée réelle.

---

## ✅ ÉTAPE 1 : Vérifier la page de diagnostic

1. **Allez sur** : https://altess-final-48g76jrga-wasnasmays-projects.vercel.app/admin/diagnostic-media

2. **Vérifiez** :
   - La couleur des bordures (🟢 vert = OK, 🔴 rouge = problème)
   - Les valeurs `duration_seconds` et `duration_ms` dans la base de données
   - L'affichage prévu

3. **Prenez un screenshot** et partagez-le

---

## ✅ ÉTAPE 2 : Vérifier les logs dans la console

1. **Ouvrez** : https://altess-final-48g76jrga-wasnasmays-projects.vercel.app/playout/library

2. **Ouvrez la Console** (F12 → Onglet Console)

3. **Recherchez** les logs suivants :
   ```
   [Playout Library] VIDEO: "TITRE_DE_LA_VIDEO"
   [Playout Library] duration_seconds (DB): ...
   [Playout Library] duration_ms (DB): ...
   [Playout Library] finalDurationMs (calculé): ...
   [Playout Library] Affichage prévu: 02:05:23
   ```

4. **Copiez** tous ces logs et partagez-les

---

## ✅ ÉTAPE 3 : Cliquer sur "Actualiser"

1. Dans `/playout/library`, cliquez sur le bouton **"Actualiser"** (icône 🔄)

2. **Vérifiez** si les durées s'affichent correctement après actualisation

3. **Regardez la console** pour voir les nouveaux logs

---

## ✅ ÉTAPE 4 : Tester un nouvel upload

1. **Uploadez** une nouvelle vidéo courte (< 5 minutes)

2. **Avant de cliquer "Enregistrer"**, vérifiez que :
   - Le champ "Durée (secondes)" est bien rempli
   - Il n'affiche PAS 0

3. **Dans la console**, cherchez :
   ```
   [Playout Library] ⏳ Calcul de la durée en cours...
   [Playout Library] ✅ Durée trouvée: XXXXX ms
   [Playout Library] 📊 Durée garantie AVANT upload: XXXXX ms
   ```

4. **Si vous voyez** `Durée trouvée: 0 ms` → Le problème est dans l'extraction de la durée côté navigateur

5. **Si vous voyez** une durée > 0 mais que l'affichage montre 00:00:00 → Le problème est dans la base de données ou l'affichage

---

## 🔍 DIAGNOSTIC POSSIBLE

### Cas 1 : `duration_ms` dans la DB = NULL ou 0

**Symptômes** :
- La console montre `duration_ms (DB): null` ou `0`
- Mais `duration_seconds (DB)` a une valeur

**Solution** :
```sql
-- Exécuter cette requête SQL dans Supabase
UPDATE playout_media_library
SET duration_ms = duration_seconds * 1000
WHERE duration_ms IS NULL OR duration_ms = 0;
```

### Cas 2 : Les anciennes vidéos ont des durées incorrectes

**Symptômes** :
- Nouvelles vidéos OK
- Anciennes vidéos KO

**Solution** :
- Supprimer et re-uploader les anciennes vidéos
- OU exécuter le script SQL ci-dessus

### Cas 3 : Cache navigateur

**Symptômes** :
- Les données sont OK dans la DB
- Mais l'affichage est KO

**Solution** :
1. Vider le cache du navigateur (Ctrl+Shift+Delete)
2. Rafraîchir avec Ctrl+F5
3. Cliquer sur "Actualiser"

### Cas 4 : Environnement de base de données différent

**Symptômes** :
- Certaines vidéos apparaissent mais pas d'autres
- Les données dans la page diagnostic sont différentes de l'affichage

**Solution** :
- Vérifier que `NEXT_PUBLIC_SUPABASE_URL` dans `.env` correspond bien à votre projet
- Vérifier dans la page diagnostic l'URL de connexion affichée

---

## 📊 INFORMATIONS À PARTAGER

Pour vous aider, j'ai besoin de :

1. **Screenshot** de `/admin/diagnostic-media`
2. **Logs de la console** (tous les logs `[Playout Library]`)
3. **Confirmation** : est-ce que le bouton "Actualiser" résout le problème ?
4. **Confirmation** : est-ce que les NOUVELLES vidéos uploadées ont le problème ou seulement les anciennes ?

---

## 🚀 SOLUTION RAPIDE

Si vous voulez réparer TOUTES les vidéos immédiatement :

1. Allez dans **Supabase Dashboard** → SQL Editor

2. Exécutez :
   ```sql
   -- Afficher toutes les vidéos avec problème
   SELECT id, title, duration_seconds, duration_ms
   FROM playout_media_library
   WHERE duration_ms IS NULL OR duration_ms = 0 OR duration_ms != duration_seconds * 1000;

   -- Réparer automatiquement
   UPDATE playout_media_library
   SET duration_ms = duration_seconds * 1000
   WHERE duration_ms IS NULL
      OR duration_ms = 0
      OR duration_ms != duration_seconds * 1000;
   ```

3. Retournez sur `/playout/library` et cliquez sur **"Actualiser"**

---

## ✅ VÉRIFICATION FINALE

Une fois tout fait, vous devriez voir :
- ✅ Toutes les vidéos avec une durée correcte (HH:MM:SS)
- ✅ Aucune vidéo avec 00:00:00
- ✅ Les logs montrent `finalDurationMs > 0` pour toutes les vidéos
