# 🚀 GUIDE COMPLET - TEST ET DIAGNOSTIC SUR VERCEL

## 📋 TABLE DES MATIÈRES

1. [Variables d'Environnement](#1-variables-denvironnement)
2. [Désactivation Temporaire RLS](#2-désactivation-temporaire-rls)
3. [Logs Détaillés](#3-logs-détaillés)
4. [Tests des API Routes](#4-tests-des-api-routes)
5. [Diagnostic du Playout](#5-diagnostic-du-playout)
6. [Résolution des Problèmes](#6-résolution-des-problèmes)

---

## 1. VARIABLES D'ENVIRONNEMENT

### ✅ Liste Exacte à Copier dans Vercel

Allez sur **Vercel Dashboard** → **Settings** → **Environment Variables**

#### Variable 1 : SUPABASE_URL
```
Name: NEXT_PUBLIC_SUPABASE_URL
Value: https://cbqiebxitsvknnnqscbz.supabase.co
Environments: ✅ Production ✅ Preview ✅ Development
```

#### Variable 2 : SUPABASE_ANON_KEY
```
Name: NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNicWllYnhpdHN2a25ubnFzY2J6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzcxNzE0MDQsImV4cCI6MjA1Mjc0NzQwNH0.mC6HHg8JJ-gWwYWs-Kct7C6dV23bYFOAoq38MILt-kY
Environments: ✅ Production ✅ Preview ✅ Development
```

### ⚠️ IMPORTANT

- Les variables avec `NEXT_PUBLIC_` sont exposées au client
- Après avoir ajouté les variables, **REDÉPLOYEZ obligatoirement**
- Vérifiez que vous avez bien coché les 3 environnements

### 🧪 Tester les Variables

Après redéploiement, testez :

```bash
curl https://votre-domaine.vercel.app/api/diagnostic/health
```

**Réponse attendue** :
```json
{
  "overall_status": "healthy",
  "supabase_url": "https://cbqiebxitsvknnnqscbz.supabase.co",
  "anon_key_present": true
}
```

**Si erreur** : Variables manquantes ou mal configurées

---

## 2. DÉSACTIVATION TEMPORAIRE RLS

### 🎯 Objectif

Désactiver temporairement les RLS pour vérifier si le problème vient des permissions.

### 📝 Script SQL

Allez sur **Supabase Dashboard** → **SQL Editor** → **New Query**

```sql
-- OPTION A: Désactiver complètement RLS (plus rapide)
ALTER TABLE media_library DISABLE ROW LEVEL SECURITY;
ALTER TABLE playout_media_library DISABLE ROW LEVEL SECURITY;
ALTER TABLE radio_stations DISABLE ROW LEVEL SECURITY;
ALTER TABLE advertising_tickers DISABLE ROW LEVEL SECURITY;
NOTIFY pgrst, 'reload schema';
```

**OU** (recommandé)

```sql
-- OPTION B: Créer des policies permissives temporaires (plus sûr)
DROP POLICY IF EXISTS "temp_allow_all_read_playout_media" ON playout_media_library;
CREATE POLICY "temp_allow_all_read_playout_media"
  ON playout_media_library FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "temp_allow_all_read_media_library" ON media_library;
CREATE POLICY "temp_allow_all_read_media_library"
  ON media_library FOR SELECT
  TO public
  USING (true);

NOTIFY pgrst, 'reload schema';
```

### ⏱️ Attendre 10 Secondes

Le cache Supabase doit se rafraîchir.

### 🧪 Tester Immédiatement

```bash
curl https://votre-domaine.vercel.app/api/diagnostic/playout-media
```

### 📊 Analyser le Résultat

**Si ça marche maintenant** ✅
- Le problème était bien les RLS
- Gardez les policies permissives temporaires
- Contactez-moi pour créer des policies correctes

**Si ça ne marche toujours pas** ❌
- Le problème n'est PAS les RLS
- C'est soit les variables d'environnement, soit l'API Route
- Passez à la section Logs

### ⚠️ RÉACTIVER LA SÉCURITÉ APRÈS TEST

```sql
-- Si vous avez utilisé OPTION A
ALTER TABLE media_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE playout_media_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE radio_stations ENABLE ROW LEVEL SECURITY;
NOTIFY pgrst, 'reload schema';

-- Si vous avez utilisé OPTION B
DROP POLICY IF EXISTS "temp_allow_all_read_playout_media" ON playout_media_library;
DROP POLICY IF EXISTS "temp_allow_all_read_media_library" ON media_library;
NOTIFY pgrst, 'reload schema';
```

---

## 3. LOGS DÉTAILLÉS

### 📍 Où Voir les Logs

**Vercel Dashboard** → **Votre Projet** → **Deployments** → **Cliquez sur le dernier déploiement** → **Functions**

### 🔍 Logs Ajoutés

J'ai ajouté des logs détaillés dans **3 API Routes** :

#### 1. `/api/youtube/extract`
```
[YouTube Extract API] Request received
[YouTube Extract API] Request body: {...}
[YouTube Extract API] ✅ Video ID detected: ...
[YouTube Extract API] Fetching oEmbed data from: ...
[YouTube Extract API] ✅ Metadata retrieved successfully
[YouTube Extract API] ❌ FATAL ERROR (si erreur)
```

#### 2. `/api/diagnostic/playout-media`
```
[Playout Media Diagnostic] Starting diagnostic...
[Playout Media Diagnostic] Environment check:
  - SUPABASE_URL present: true/false
  - SUPABASE_KEY present: true/false
[Playout Media Diagnostic] Querying media_library...
  - Success: true/false
  - Count: X
  - Error: ...
[Playout Media Diagnostic] ✅ Diagnostic complete
```

#### 3. `/api/radio/validate`
```
[Radio Validator] Request received
[Radio Validator] Request body: {...}
[Radio Validator] Testing stream: ...
[Radio Validator] Stream is valid / not valid
[Radio Validator] ❌ FATAL ERROR (si erreur)
```

### 📝 Comment Lire les Logs

1. **Cherchez les sections délimitées** par `═══════════════`
2. **Repérez les symboles** : ✅ = succès, ❌ = erreur, ⚠️ = avertissement
3. **Notez l'erreur exacte** si présente
4. **Copiez tout le bloc d'erreur** pour diagnostic

---

## 4. TESTS DES API ROUTES

### 🎯 Test 1 : API YouTube Extract

```bash
curl -X POST https://votre-domaine.vercel.app/api/youtube/extract \
  -H "Content-Type: application/json" \
  -d '{"url":"https://youtu.be/dQw4w9WgXcQ"}'
```

**Réponse attendue** :
```json
{
  "success": true,
  "videoId": "dQw4w9WgXcQ",
  "title": "Rick Astley - Never Gonna Give You Up",
  "thumbnail": "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
  "embedUrl": "https://www.youtube.com/embed/dQw4w9WgXcQ"
}
```

**Si erreur** : Vérifiez les logs Vercel

### 🎯 Test 2 : API Diagnostic Playout

```bash
curl https://votre-domaine.vercel.app/api/diagnostic/playout-media
```

**Réponse attendue** :
```json
{
  "success": true,
  "summary": {
    "total": 5,
    "passed": 5,
    "failed": 0
  },
  "diagnostics": {
    "environment": {
      "supabase_url": "https://cbqiebxitsvknnnqscbz.supabase.co",
      "anon_key_length": 237
    },
    "tests": [...]
  }
}
```

**Si erreur** : Notez le message d'erreur exact

### 🎯 Test 3 : API Radio Validate

```bash
curl -X POST https://votre-domaine.vercel.app/api/radio/validate \
  -H "Content-Type: application/json" \
  -d '{"streamUrl":"https://stream.zenolive.com/rmnkgagzbg8uv"}'
```

**Réponse attendue** :
```json
{
  "success": true,
  "valid": true,
  "contentType": "audio/mpeg",
  "message": "Flux audio valide"
}
```

---

## 5. DIAGNOSTIC DU PLAYOUT

### 🎯 Test Complet du Playout

#### Étape 1 : Vérifier l'Accès à la Page

```
https://votre-domaine.vercel.app/playout/library
```

**Attendu** : La page charge sans erreur

**Si erreur 500** : Problème serveur (logs Vercel)
**Si page blanche** : Erreur JavaScript (console navigateur)

#### Étape 2 : Vérifier le Chargement des Médias

Ouvrez la **console du navigateur** (F12 → Console)

Vous devriez voir :
```
Chargement des médias depuis playout_media_library...
X médias trouvés
```

**Si "0 médias trouvés"** :
- Problème de permissions RLS
- Ou aucun média dans la base

#### Étape 3 : Tester l'Ajout d'une Vidéo

1. Cliquez **"Ajouter"**
2. Collez : `https://youtu.be/dQw4w9WgXcQ`
3. Cliquez le **bouton bleu** (téléchargement)

**Attendu** : Toast "Informations YouTube récupérées avec succès"

**Si erreur** :
- Ouvrez l'onglet **Network** (F12 → Network)
- Cherchez la requête `/api/youtube/extract`
- Cliquez dessus → **Preview** pour voir la réponse
- Notez l'erreur exacte

#### Étape 4 : Vérifier les Logs Vercel

1. Allez sur **Vercel Dashboard**
2. **Deployments** → Dernier déploiement
3. **Functions** → Cherchez `/api/youtube/extract`
4. Lisez les logs détaillés

---

## 6. RÉSOLUTION DES PROBLÈMES

### ❌ Problème : "Environment variables undefined"

**Cause** : Variables d'environnement manquantes

**Solution** :
1. Vérifiez que vous avez bien ajouté les 2 variables
2. Vérifiez l'orthographe exacte (avec `NEXT_PUBLIC_`)
3. Vérifiez que vous avez coché les 3 environnements
4. **REDÉPLOYEZ** obligatoirement

### ❌ Problème : "Failed to fetch" ou "CORS error"

**Cause** : API Route inaccessible

**Solution** :
1. Vérifiez que l'URL est correcte (pas de `/api/api/...`)
2. Testez avec curl depuis terminal
3. Vérifiez les logs Vercel pour l'erreur serveur

### ❌ Problème : "Permission denied" ou "RLS policy"

**Cause** : Policies RLS trop restrictives

**Solution** :
1. Exécutez le script SQL de désactivation RLS (Section 2)
2. Attendez 10 secondes
3. Réessayez
4. Si ça marche, le problème est bien les RLS

### ❌ Problème : "0 médias trouvés"

**Cause** : Soit RLS, soit table vide

**Solution** :
1. Testez `/api/diagnostic/playout-media` pour voir le count
2. Si count > 0 mais page affiche 0 → Problème RLS
3. Si count = 0 → Table vide, ajoutez des médias

### ❌ Problème : "Invalid YouTube URL"

**Cause** : Format d'URL non reconnu

**Solution** :
1. Testez avec l'URL de test : `https://youtu.be/dQw4w9WgXcQ`
2. Si ça marche, votre URL était mal formatée
3. Formats supportés :
   - `https://www.youtube.com/watch?v=...`
   - `https://youtu.be/...`
   - `https://www.youtube.com/embed/...`
   - ID direct (11 caractères)

---

## 📊 CHECKLIST COMPLÈTE

Cochez au fur et à mesure :

### Configuration Vercel
- [ ] Variable `NEXT_PUBLIC_SUPABASE_URL` ajoutée
- [ ] Variable `NEXT_PUBLIC_SUPABASE_ANON_KEY` ajoutée
- [ ] Les 3 environnements cochés pour chaque variable
- [ ] Redéploiement effectué après ajout des variables

### Tests API Routes
- [ ] `/api/diagnostic/health` retourne "healthy"
- [ ] `/api/youtube/extract` retourne un objet avec videoId
- [ ] `/api/diagnostic/playout-media` retourne les counts
- [ ] `/api/radio/validate` valide un flux de test

### Tests Playout
- [ ] Page `/playout/library` charge sans erreur
- [ ] Les statistiques affichent le bon nombre de médias
- [ ] Le bouton "Ajouter" ouvre le formulaire
- [ ] Le bouton de téléchargement YouTube fonctionne
- [ ] Un média peut être sauvegardé
- [ ] Le média apparaît dans la grille

### Logs Vercel
- [ ] Logs visibles dans Vercel Dashboard → Functions
- [ ] Logs détaillés présents pour `/api/youtube/extract`
- [ ] Logs détaillés présents pour `/api/diagnostic/playout-media`
- [ ] Aucune erreur fatale dans les logs

### RLS (Si Nécessaire)
- [ ] Script SQL de désactivation exécuté
- [ ] Attente de 10 secondes pour rafraîchissement cache
- [ ] Nouveau test effectué
- [ ] RLS réactivé après diagnostic

---

## 🆘 SI RIEN NE FONCTIONNE

### Collectez Ces Informations

1. **Screenshot de Vercel Environment Variables**
2. **Logs complets de Vercel** (copier-coller tout le bloc)
3. **Console navigateur** (F12 → Console → Screenshot)
4. **Network tab** (F12 → Network → Screenshot de la requête en erreur)
5. **Résultat du test** `/api/diagnostic/playout-media`

### Envoyez-Moi

```
PROBLÈME: [Description en 1 ligne]

TESTS EFFECTUÉS:
- [ ] Variables d'environnement vérifiées
- [ ] RLS désactivé temporairement
- [ ] Logs Vercel consultés

ERREUR EXACTE:
[Copiez-collez l'erreur complète]

LOGS VERCEL:
[Copiez-collez les logs de la fonction qui échoue]

RÉSULTAT /api/diagnostic/playout-media:
[Copiez-collez le JSON complet]
```

Avec ces informations, je pourrai identifier le problème en 30 secondes.

---

## ✅ RÉSUMÉ RAPIDE

### En 5 Minutes

1. **Ajoutez les 2 variables** dans Vercel (Section 1)
2. **Redéployez**
3. **Testez** `/api/diagnostic/playout-media`
4. **Si erreur RLS** → Exécutez le script SQL (Section 2)
5. **Si autre erreur** → Consultez les logs Vercel (Section 3)

### Ordre de Priorité

1. **Variables d'environnement** (99% des problèmes)
2. **Permissions RLS** (si variables OK)
3. **Code API Route** (rarement, sauf si erreur de syntaxe)

---

**Date** : 4 Février 2026
**Fichiers créés** : 3
**API Routes loggées** : 3
**Tests fournis** : 8
**Status** : ✅ Prêt pour diagnostic complet

**COMMENCEZ PAR LES VARIABLES D'ENVIRONNEMENT, C'EST PRESQUE TOUJOURS ÇA ! 🎯**
