# GUIDE SYNCHRONISATION GITHUB ↔ VERCEL

## 🔴 PROBLÈME ACTUEL

Le déploiement Vercel ne reçoit pas les mises à jour. Le site est vide (pas de menu).

## ✅ SOLUTION APPLIQUÉE

J'ai restauré **TOUTES** les versions complètes et fonctionnelles :

### Fichiers Restaurés (v0.1.7)

1. **components/Header.tsx** - Menu complet avec navigation dynamique
2. **components/PlayoutMediaLibrary.tsx** - Bibliothèque avec détection auto de durée
3. **package.json** - Version 0.1.7
4. **SYNC_STATUS.md** - Nouveau fichier pour forcer la détection Git

## 📋 ÉTAPES POUR SYNCHRONISER

### Option 1: Via Terminal Local (Recommandée)

```bash
# 1. Récupérer les changements de Bolt
git pull origin main

# 2. Vérifier les fichiers modifiés
git status

# 3. Commit et push
git add .
git commit -m "fix: restauration complète menu + bibliothèque v0.1.7"
git push origin main
```

### Option 2: Via GitHub Desktop

1. Ouvrir GitHub Desktop
2. Cliquer sur "Fetch origin" en haut
3. Vérifier que les changements apparaissent
4. Cliquer sur "Commit to main"
5. Cliquer sur "Push origin"

### Option 3: Forcer le Redéploiement Vercel

Si le push ne déclenche pas le build :

1. Aller sur **vercel.com**
2. Sélectionner votre projet **altess-final**
3. Onglet **Deployments**
4. Cliquer sur **"Redeploy"** sur le dernier déploiement
5. Cocher **"Use existing Build Cache"** = NON (décocher)
6. Cliquer sur **"Redeploy"**

## 🔍 VÉRIFICATION APRÈS DÉPLOIEMENT

Une fois le déploiement Vercel terminé (3-5 min) :

1. ✅ **Menu ALTESS visible** en haut
2. ✅ **Navigation dynamique** chargée
3. ✅ **Bibliothèque média** fonctionnelle avec détection durée
4. ✅ **Design Netflix** (fond noir + doré)

## ⚠️ SI LE MENU N'APPARAÎT TOUJOURS PAS

Vérifiez dans Vercel :

### 1. Variables d'environnement
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 2. Build Logs
- Rechercher "error" ou "failed"
- Vérifier que `components/Header.tsx` est bien utilisé

### 3. Clear Cache Vercel
```bash
# Dans le terminal local
vercel --prod --force
```

## 🎯 CE QUI A ÉTÉ RESTAURÉ

### Header Complet
- Logo ALTESS SVG animé
- Menu dynamique depuis `navigation_items`
- Bouton connexion/inscription
- Dropdown utilisateur connecté
- Menu mobile responsive
- Bouton retour WebTV

### Bibliothèque Média
- Détection automatique de durée (fichiers uploadés)
- Import automatique YouTube (titre + miniature + durée)
- Champ durée toujours visible
- Support YouTube, Vimeo, URL directe, Upload
- Design premium doré
- Badges de type et durée
- Suppression de médias

### Design
- Fond noir Netflix
- Dégradés dorés (gold-gradient)
- Animations fluides
- Hover effects premium
- Responsive mobile/tablette/desktop

## 📞 BESOIN D'AIDE ?

Si après ces étapes le menu n'apparaît toujours pas :
1. Vérifiez les logs de build Vercel
2. Assurez-vous que la table `navigation_items` existe dans Supabase
3. Vérifiez que les variables d'environnement sont correctes
