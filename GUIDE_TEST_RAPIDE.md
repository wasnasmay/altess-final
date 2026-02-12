# 🧪 Guide de test rapide

## Après déploiement sur Vercel

---

## ✅ Test 1: Vérifier que le site fonctionne

1. Ouvrez votre site déployé: `https://votre-app.vercel.app`
2. ✅ La page d'accueil s'affiche
3. ✅ La TV/Radio fonctionne (pas de modifications)
4. ✅ Le chatbot orange n'apparaît pas (caché)
5. ✅ Le bouton WhatsApp vert est visible en bas à gauche

---

## ✅ Test 2: Accéder aux paramètres du site

1. **Connectez-vous en tant qu'admin**
   - Allez sur `/login`
   - Entrez vos identifiants admin

2. **Accédez au dashboard admin**
   - Cliquez sur votre profil ou allez directement sur `/admin`

3. **Ouvrez les paramètres du site**
   - Dans le menu de gauche, cherchez l'icône "Settings" (engrenage)
   - Cliquez sur "Paramètres Site"
   - URL directe: `https://votre-app.vercel.app/admin/site-settings`

4. **Vérifiez l'interface**
   - ✅ Vous voyez deux sections: "Paramètres de contact" et "Paramètres généraux"
   - ✅ Le numéro WhatsApp par défaut est: `33123456789`
   - ✅ L'email est: `contact@altess.fr`
   - ✅ Le téléphone est: `01 23 45 67 89`

---

## ✅ Test 3: Modifier le numéro WhatsApp

1. **Dans Paramètres Site:**
   - Trouvez le champ "Numéro WhatsApp général"
   - Changez la valeur, par exemple: `33612345678`
   - Cliquez sur le bouton orange "Enregistrer" en haut à droite

2. **Vérifiez la sauvegarde:**
   - ✅ Un message de succès apparaît: "Paramètres enregistrés"
   - ✅ Le bouton affiche brièvement "Enregistrement..."

3. **Testez le changement:**
   - Retournez sur la page d'accueil du site
   - Cliquez sur le bouton WhatsApp vert en bas à gauche
   - ✅ WhatsApp s'ouvre avec le **nouveau** numéro que vous avez configuré

---

## ✅ Test 4: Tester le webhook Stripe

**Prérequis:** Stripe configuré avec le webhook

1. **Allez sur une page d'événement avec billetterie**
   - Exemple: `/e/nom-evenement`

2. **Achetez un billet en mode test**
   - Cliquez sur "Acheter un billet"
   - Remplissez le formulaire
   - Utilisez la carte de test: `4242 4242 4242 4242`
   - Date: `12/34`
   - CVC: `123`

3. **Vérifiez:**
   - ✅ Redirection vers Stripe Checkout
   - ✅ Paiement réussi
   - ✅ Redirection vers la page de confirmation
   - ✅ QR code du billet affiché

4. **Dans Stripe Dashboard:**
   - Allez dans Developers → Webhooks
   - Cliquez sur votre endpoint
   - Onglet "Attempts"
   - ✅ Status: `200 OK`
   - ✅ Événement: `checkout.session.completed`

---

## ✅ Test 5: Vérifier les logs Vercel

1. **Vercel Dashboard:**
   - Allez dans votre projet
   - Onglet "Deployments"
   - Cliquez sur votre dernier déploiement

2. **Functions Logs:**
   - Cliquez sur "Functions"
   - Recherchez `[WEBHOOK]` dans les logs
   - ✅ Vous devriez voir les logs du webhook Stripe

3. **Runtime Logs:**
   - Vérifiez qu'il n'y a pas d'erreurs critiques
   - ✅ Pas d'erreurs 500
   - ✅ Pas d'erreurs de connexion Supabase

---

## ✅ Test 6: Vérifier la base de données

1. **Supabase Dashboard:**
   - Allez sur votre projet Supabase
   - Table Editor

2. **Vérifiez la table site_settings:**
   - Cherchez la table `site_settings`
   - ✅ Elle existe avec 5 paramètres
   - ✅ Les valeurs correspondent à ce que vous avez configuré

3. **Testez la fonction SQL:**
   ```sql
   SELECT get_setting('whatsapp_number');
   ```
   - ✅ Retourne le numéro WhatsApp configuré

---

## 🔧 Dépannage rapide

### Le bouton WhatsApp n'utilise pas le nouveau numéro

**Solution:**
1. Videz le cache de votre navigateur (Ctrl+Shift+R)
2. Vérifiez dans Supabase que la valeur est bien enregistrée
3. Vérifiez que `is_public = true` pour le paramètre WhatsApp

### La page Paramètres Site affiche "Accès refusé"

**Solution:**
1. Vérifiez que vous êtes connecté
2. Vérifiez que votre profil a le rôle `admin`
3. Dans Supabase, table `profiles`:
   ```sql
   UPDATE profiles
   SET role = 'admin'
   WHERE email = 'votre-email@example.com';
   ```

### Les modifications ne sont pas sauvegardées

**Solution:**
1. Ouvrez la console du navigateur (F12)
2. Regardez s'il y a des erreurs
3. Vérifiez les politiques RLS dans Supabase
4. Testez manuellement:
   ```sql
   UPDATE site_settings
   SET setting_value = '33612345678'
   WHERE setting_key = 'whatsapp_number';
   ```

### Le webhook Stripe renvoie une erreur

**Solution:**
1. Vérifiez que `STRIPE_WEBHOOK_SECRET` est configuré dans Vercel
2. Vérifiez que l'URL du webhook est correcte dans Stripe Dashboard
3. Regardez les logs Vercel pour plus de détails
4. Testez avec Stripe CLI:
   ```bash
   stripe listen --forward-to https://votre-app.vercel.app/api/webhooks/stripe
   ```

---

## 📊 Checklist de test complet

### Fonctionnalités de base:
- [ ] Page d'accueil s'affiche
- [ ] WebTV fonctionne
- [ ] Radio fonctionne
- [ ] Navigation fonctionne
- [ ] Footer s'affiche

### Nouveau système:
- [ ] Page Paramètres Site accessible
- [ ] Paramètres s'affichent correctement
- [ ] Modification du numéro WhatsApp fonctionne
- [ ] Sauvegarde réussie avec message de confirmation
- [ ] Bouton WhatsApp utilise le nouveau numéro

### Chatbot:
- [ ] Chatbot orange **non visible** sur le site
- [ ] Bouton WhatsApp vert visible en bas à gauche
- [ ] Clic sur WhatsApp ouvre la bonne conversation

### Paiements:
- [ ] Checkout Stripe fonctionne
- [ ] Webhook reçoit les événements (200 OK)
- [ ] Billets créés en base de données
- [ ] Confirmation affichée à l'utilisateur

### Admin:
- [ ] Dashboard admin accessible
- [ ] Sidebar affiche "Paramètres Site"
- [ ] Toutes les pages admin fonctionnent
- [ ] Pas d'erreurs de permissions

---

## 🎯 Résultat attendu

**Si tous les tests passent:**
- ✅ Votre site est 100% opérationnel
- ✅ Le système de paramètres fonctionne parfaitement
- ✅ Vous pouvez modifier le WhatsApp sans toucher au code
- ✅ Les paiements Stripe fonctionnent
- ✅ La TV et la Radio sont intactes

**Félicitations! Votre déploiement est un succès!** 🎉

---

## 📞 Support

Si un test échoue:
1. Consultez la section "Dépannage rapide" ci-dessus
2. Vérifiez les logs Vercel
3. Vérifiez les logs Supabase
4. Consultez `BUILD_FIXES.md` pour les détails techniques

---

**Date:** 1er février 2026
**Version:** 1.0
**Status:** ✅ Prêt pour tests
