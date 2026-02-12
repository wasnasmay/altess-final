# 🔧 Guide de Résolution - Bandeau Défilant WebTV

## 🎯 Problème Rencontré
La page `/admin/webtv-ticker` affiche "Configuration non trouvée"

## ✅ Solution Appliquée

### 1. Vérification de la Base de Données
La configuration existe bien dans la table `webtv_ticker_settings`:
```
ID: 00000000-0000-0000-0000-000000000001
Texte: "En direct - WebTV Orientale Musique - Programmation continue 24h/24"
Vitesse: medium
Couleur: amber
Activé: ✅
```

### 2. Corrections Apportées au Code

**Changements dans `/app/admin/webtv-ticker/page.tsx`:**

✅ Remplacement de `.maybeSingle()` par `.select('*')` pour plus de robustesse
✅ Ajout de logs détaillés pour le debugging
✅ Meilleure gestion des erreurs avec messages explicites
✅ Bouton "Recharger la Page" si la configuration ne charge pas
✅ Affichage du message d'erreur spécifique

---

## 🚀 Comment Tester

### Étape 1: Ouvrir la Console du Navigateur
1. Appuyez sur **F12** (ou Cmd+Option+I sur Mac)
2. Allez dans l'onglet **Console**
3. Gardez cette console ouverte

### Étape 2: Accéder à la Page
1. Allez sur `http://localhost:3000/admin/webtv-ticker`
2. **Rechargez la page** (Ctrl+R ou Cmd+R)
3. Observez les logs dans la console

### Étape 3: Analyser les Logs
Vous devriez voir ces messages dans la console:
```
🔍 [WebTV Ticker] Début du chargement...
📡 [WebTV Ticker] URL Supabase: [votre URL]
📊 [WebTV Ticker] Résultat de la requête: {...}
✅ [WebTV Ticker] Configuration chargée: {...}
```

---

## 🔍 Diagnostic des Erreurs

### Si vous voyez une Erreur Supabase:
```
❌ [WebTV Ticker] Erreur Supabase: {...}
```

**Solutions possibles:**
1. Vérifiez que vous êtes connecté
2. Vérifiez les variables d'environnement dans `.env`
3. Vérifiez que Supabase est accessible

### Si vous voyez "Aucune configuration trouvée":
```
⚠️ [WebTV Ticker] Aucune configuration trouvée
```

**Solution:**
Exécutez cette requête SQL dans Supabase:
```sql
INSERT INTO webtv_ticker_settings (
  id,
  text,
  speed,
  color,
  is_enabled,
  live_video_id,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  '📺 Bienvenue sur WebTV Altess • En direct 24h/24',
  'medium',
  'amber',
  true,
  null,
  now()
) ON CONFLICT (id) DO NOTHING;
```

---

## 🎨 Utilisation de la Page

Une fois la configuration chargée, vous pouvez:

### 1. Activer/Désactiver le Bandeau
- Utilisez le switch en haut de la page
- Le bandeau apparaîtra/disparaîtra sur le site

### 2. Modifier le Texte
- Tapez votre message dans le champ "Texte du Bandeau"
- Le texte défilera automatiquement

### 3. Choisir la Vitesse
- **Lent** (35s) - Pour des messages longs
- **Moyen** (25s) - Vitesse standard
- **Rapide** (15s) - Pour des annonces urgentes

### 4. Choisir la Couleur
- Ambre (par défaut)
- Rouge (urgent)
- Bleu (info)
- Vert (succès)
- Violet (spécial)
- Blanc (neutre)

### 5. Diffusion Live YouTube
- Collez l'ID d'une vidéo YouTube Live dans "ID de la vidéo YouTube Live"
- Le player WebTV basculera automatiquement en mode Live
- Effacez ce champ pour revenir à la programmation normale

### 6. Aperçu en Direct
- Visualisez le rendu final avant de sauvegarder
- L'aperçu montre exactement comment le bandeau apparaîtra

### 7. Sauvegarder
- Cliquez sur "Sauvegarder les Modifications"
- Un message de confirmation apparaîtra
- Les changements sont appliqués immédiatement

---

## 🔐 Permissions Requises

Pour utiliser cette page, vous devez:
- ✅ Être connecté avec un compte administrateur
- ✅ Avoir le rôle `admin` dans la table `profiles`
- ✅ L'email `imed.labidi@gmail.com` a déjà ce rôle

---

## 📝 Variables d'Environnement

Vérifiez que ces variables sont bien configurées dans `.env`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://[votre-projet].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[votre-clé-anonyme]
```

---

## 🆘 En Cas de Problème Persistant

### Option 1: Bouton de Rechargement
Sur la page d'erreur, cliquez sur le bouton **"Recharger la Page"**

### Option 2: Effacer le Cache
```bash
# Arrêter le serveur
# Puis:
rm -rf .next
npm run dev
```

### Option 3: Vérifier Supabase
1. Ouvrez le Dashboard Supabase
2. Allez dans "Table Editor"
3. Ouvrez la table `webtv_ticker_settings`
4. Vérifiez qu'une ligne existe

### Option 4: Vérifier les Policies RLS
Dans Supabase SQL Editor:
```sql
-- Vérifier les policies
SELECT * FROM pg_policies
WHERE tablename = 'webtv_ticker_settings';
```

Vous devriez voir:
- ✅ Policy SELECT pour `public`
- ✅ Policy UPDATE pour `authenticated` (admins)
- ✅ Policy INSERT pour `authenticated` (admins)
- ✅ Policy DELETE pour `authenticated` (admins)

---

## ✅ Statut Actuel

- ✅ Serveur de développement démarré sur `http://localhost:3000`
- ✅ Configuration existe dans la base de données
- ✅ Code corrigé avec logs de debugging
- ✅ Permissions RLS configurées
- ✅ Profile admin créé pour `imed.labidi@gmail.com`

---

## 🎯 Prochaines Étapes

1. **Rechargez la page** `/admin/webtv-ticker`
2. **Ouvrez la console** (F12)
3. **Observez les logs** pour identifier le problème
4. **Partagez les logs** si le problème persiste

---

**Date:** 2026-02-04
**Version:** 1.0
**Statut:** Prêt pour test
