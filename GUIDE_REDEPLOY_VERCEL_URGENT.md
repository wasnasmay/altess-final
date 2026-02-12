# 🔥 GUIDE URGENT - FORCER REDEPLOY VERCEL

**PROBLÈME** : Changements visibles en développement mais PAS sur Vercel

**CAUSE** : Vercel utilise un ancien build en cache

**SOLUTION** : Forcer un redeploy SANS cache

---

## 🚨 IMPORTANT

Vercel a un système de cache qui peut empêcher les nouveaux changements d'être déployés. Vous devez **MANUELLEMENT** forcer un nouveau déploiement **SANS CACHE**.

---

## 📋 MÉTHODE 1 : Redeploy Manuel (RECOMMANDÉ)

### Étape 1 : Ouvrir Vercel Dashboard

1. Allez sur **https://vercel.com**
2. Cliquez sur **"Log in"** si pas connecté
3. Entrez vos identifiants

### Étape 2 : Trouver votre projet

1. Vous verrez la liste de vos projets
2. Cherchez **"altess-final"** (ou le nom de votre projet)
3. **CLIQUEZ** sur le projet

### Étape 3 : Aller dans Deployments

```
┌─────────────────────────────────────────┐
│  altess-final                           │
├─────────────────────────────────────────┤
│  [Overview] [Deployments] [Settings]   │  ← CLIQUEZ ICI
│             ^^^^^^^^^^^^                │
└─────────────────────────────────────────┘
```

1. En haut de la page, vous verrez des onglets
2. Cliquez sur **"Deployments"**

### Étape 4 : Ouvrir le dernier deployment

1. Vous verrez une liste de déploiements
2. Le **PREMIER** de la liste est le plus récent
3. Il ressemble à ça :

```
┌───────────────────────────────────────────────┐
│ ✓ Production: main@abc1234                   │
│   2 minutes ago                               │  ← CLIQUEZ ICI
│   https://altess-final.vercel.app            │
└───────────────────────────────────────────────┘
```

4. **CLIQUEZ** sur cette ligne

### Étape 5 : Ouvrir le menu

1. En haut à droite, vous verrez **3 points verticaux** : **⋮**

```
┌─────────────────────────────────────────┐
│  Deployment Details              [⋮]   │  ← CLIQUEZ ICI
└─────────────────────────────────────────┘
```

2. **CLIQUEZ** sur les 3 points **⋮**

### Étape 6 : Cliquer sur Redeploy

Un menu s'ouvre :

```
┌──────────────────────┐
│ View Function Logs   │
│ View Source          │
│ Redeploy             │  ← CLIQUEZ ICI
│ Instant Rollback     │
└──────────────────────┘
```

3. **CLIQUEZ** sur **"Redeploy"**

### Étape 7 : DÉCOCHER le cache (CRITIQUE)

Une popup s'ouvre :

```
┌─────────────────────────────────────────────┐
│  Redeploy to Production                     │
├─────────────────────────────────────────────┤
│                                              │
│  ☐ Use existing Build Cache                 │  ← DÉCOCHEZ CETTE CASE
│                                              │
│  This will redeploy the deployment          │
│                                              │
│  [Cancel]              [Redeploy]           │  ← PUIS CLIQUEZ ICI
└─────────────────────────────────────────────┘
```

**IMPORTANT** :
1. **DÉCOCHEZ** la case "Use existing Build Cache"
2. La case doit être **VIDE** ☐ (pas cochée ☑)
3. Puis cliquez sur le bouton **"Redeploy"** (bouton bleu)

### Étape 8 : Attendre le build

1. Vercel va commencer à rebuilder
2. Vous verrez :

```
┌─────────────────────────────────────────┐
│  ⏳ Building...                         │
│                                          │
│  [████████████░░░░░░] 65%               │
└─────────────────────────────────────────┘
```

3. **ATTENDEZ** 2-5 minutes
4. Quand c'est terminé, vous verrez :

```
┌─────────────────────────────────────────┐
│  ✓ Ready                                │
│                                          │
│  Production: main@abc1234               │
└─────────────────────────────────────────┘
```

### Étape 9 : Vider le cache de votre navigateur

**Option A - Rafraîchissement forcé** :
- Windows/Linux : **Ctrl + Shift + R**
- Mac : **Cmd + Shift + R**

**Option B - Vider complètement le cache** :
1. Ouvrez votre navigateur
2. Appuyez sur **Ctrl + Shift + Delete** (Windows/Linux) ou **Cmd + Shift + Delete** (Mac)
3. Sélectionnez **"Images et fichiers en cache"**
4. Période : **"Toutes les périodes"**
5. Cliquez **"Effacer les données"**

### Étape 10 : Tester votre site

1. Allez sur **https://altess-final.vercel.app/playout/schedule**
2. Vous devriez maintenant voir les changements
3. Vous devriez voir 2 programmes de test :
   - Programme 1 à 14:00 (The Soul of Blues Live)
   - Programme 2 à 16:30 (Tamally Maak)

---

## 📋 MÉTHODE 2 : Via Git Push (Alternative)

Si la méthode 1 ne marche pas, vous pouvez forcer un nouveau commit :

### Via Terminal

```bash
# 1. Créer un petit changement
echo "# Force rebuild $(date)" >> vercel-force-rebuild.txt

# 2. Commit
git add .
git commit -m "Force rebuild - Apply playout fixes"

# 3. Push
git push origin main
```

Vercel va automatiquement détecter le nouveau commit et rebuilder.

---

## 📋 MÉTHODE 3 : Invalidate Cache (Si méthode 1 et 2 ne marchent pas)

### Dans Vercel Dashboard

1. Projet **"altess-final"**
2. Onglet **"Settings"**
3. Dans le menu de gauche : **"General"**
4. Cherchez **"Build & Development Settings"**
5. Cliquez **"Edit"**
6. Changez **Node.js Version** (par exemple de 18.x à 20.x, puis refaites un déploiement, puis remettez 18.x)
7. Cliquez **"Save"**
8. Retournez dans **"Deployments"**
9. Faites un **Redeploy** (comme méthode 1)

---

## 🔍 VÉRIFICATION QUE ÇA A MARCHÉ

### Test 1 : Voir les logs de build Vercel

1. Dans Vercel Dashboard → Deployments
2. Cliquez sur le dernier deployment
3. Cliquez sur **"Building"** ou **"View Function Logs"**
4. Cherchez dans les logs :

```
✓ Compiled successfully
✓ Collecting page data
✓ Generating static pages
```

Si vous voyez ça = ✅ Build réussi

### Test 2 : Console du navigateur

1. Ouvrez votre site : https://altess-final.vercel.app/playout/schedule
2. Appuyez sur **F12** (ouvre les DevTools)
3. Onglet **"Console"**
4. Cherchez des erreurs rouges
5. S'il y a l'erreur "column channel_id does not exist" = ❌ Cache pas vidé
6. S'il n'y a pas cette erreur = ✅ Nouveau build chargé

### Test 3 : Vérifier les programmes

1. Allez sur **/playout/schedule**
2. Sélectionnez la date **6 février 2026**
3. Vous devriez voir **2 programmes** :

```
╔═══════════════════════════════════════╗
║ #1  14:00 → 16:05 (02:05:23)         ║
║     The Soul of Blues Live 🎈         ║
╠═══════════════════════════════════════╣
║ #2  16:30 → 16:33 (00:03:05)         ║
║     Tamally Maak                      ║
╚═══════════════════════════════════════╝
```

Si vous les voyez = ✅ Tout marche !

### Test 4 : Ajouter un programme

1. Cliquez sur **"Ajouter"**
2. Sélectionnez une vidéo
3. Vérifiez que la durée s'affiche correctement (ex: 00:03:37, PAS 00:00:00)
4. Cliquez **"Ajouter au planning"**
5. Si vous voyez le toast "✅ Média ajouté au planning avec succès!" = ✅ Tout marche !

---

## ⚠️ PROBLÈMES COURANTS

### Problème 1 : Je ne vois pas le bouton "Redeploy"

**Solution** : Vous n'avez peut-être pas les droits. Vérifiez que vous êtes le propriétaire du projet Vercel.

### Problème 2 : Le build échoue sur Vercel

**Solution** :
1. Regardez les logs de build
2. Cherchez l'erreur exacte
3. Si c'est une erreur de mémoire, augmentez les ressources du projet dans Settings

### Problème 3 : Le site affiche toujours l'ancien code

**Solutions** :
1. Videz COMPLÈTEMENT le cache navigateur (Ctrl+Shift+Delete)
2. Essayez en navigation privée
3. Essayez avec un autre navigateur
4. Vérifiez l'URL : assurez-vous que c'est bien le bon domaine Vercel

### Problème 4 : Erreur "column channel_id does not exist" persiste

**Solutions** :
1. Vérifiez que la migration SQL a été appliquée dans Supabase :
   - Allez sur https://supabase.com
   - Ouvrez votre projet
   - SQL Editor
   - Exécutez : `SELECT column_name FROM information_schema.columns WHERE table_name = 'playout_schedules' AND column_name = 'channel_id';`
   - Si le résultat est vide = La migration n'a pas été appliquée
   - Si le résultat affiche "channel_id" = La colonne existe, c'est un problème de cache

2. Si la colonne n'existe pas dans Supabase, appliquez manuellement la migration :
   - Allez dans SQL Editor
   - Copiez le contenu de `supabase/migrations/20260206060800_fix_playout_schedules_complete_structure.sql`
   - Collez et exécutez

---

## 📱 RÉSUMÉ EN 10 ÉTAPES

```
1. ✅ Vercel.com → Log in
2. ✅ Projet "altess-final"
3. ✅ Onglet "Deployments"
4. ✅ Cliquez sur le dernier deployment
5. ✅ Menu ⋮ → "Redeploy"
6. ✅ DÉCOCHEZ "Use existing Build Cache"
7. ✅ Cliquez "Redeploy"
8. ✅ ATTENDRE 2-5 minutes
9. ✅ Vider cache navigateur (Ctrl+Shift+R)
10. ✅ Tester /playout/schedule
```

---

## 🆘 BESOIN D'AIDE ?

Si après toutes ces étapes le problème persiste :

1. **Capture d'écran** de la page Vercel Deployments
2. **Capture d'écran** de l'erreur dans la console (F12)
3. **Capture d'écran** de la page /playout/schedule
4. **Logs du build Vercel** (copier/coller le texte)

Envoyez-moi ces éléments et je pourrai vous aider davantage.

---

**Date** : 6 Février 2026 07:45 UTC
**Statut** : 🔥 ACTION URGENTE REQUISE
**Priorité** : CRITIQUE

**RAPPEL** : L'étape CRITIQUE est de **DÉCOCHER** "Use existing Build Cache" lors du redeploy !
