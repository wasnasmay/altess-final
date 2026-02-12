# Configuration du Domaine votre-altesse.fr

## ✅ Modifications Effectuées

### 1. Identité de Marque
- **Ancien nom** : ALTESS / Altess-Imed
- **Nouveau nom** : Votre Altesse
- **Nouvelle baseline** : L'Excellence au Service du Partage

### 2. Logo & Identité Visuelle
- ✅ Création du composant `VotreAltesseLogo.tsx`
- ✅ Conservation du symbole iconique (arche dorée)
- ✅ Ajout d'une couronne pour symboliser l'excellence
- ✅ Design luxueux et prestigieux maintenu

### 3. Métadonnées SEO
- ✅ Titre : "Votre Altesse - L'Excellence au Service du Partage"
- ✅ Description optimisée pour le SEO
- ✅ Open Graph et Twitter Cards mis à jour
- ✅ URL de base : `votre-altesse.fr`

## 🌐 Configuration DNS Requise

### Étape 1 : Configuration chez votre registrar de domaine

Pour que votre-altesse.fr pointe vers votre site, configurez les enregistrements DNS suivants :

#### Si déploiement sur Vercel :
```
Type: A
Nom: @
Valeur: 76.76.21.21

Type: CNAME
Nom: www
Valeur: cname.vercel-dns.com
```

#### Si déploiement sur Netlify :
```
Type: A
Nom: @
Valeur: 75.2.60.5

Type: CNAME
Nom: www
Valeur: [votre-site].netlify.app
```

### Étape 2 : Configuration de la Plateforme

#### Pour Vercel :
1. Aller dans Settings > Domains
2. Ajouter `votre-altesse.fr`
3. Ajouter `www.votre-altesse.fr`
4. Vercel vérifiera automatiquement la configuration DNS

#### Pour Netlify :
1. Aller dans Domain settings
2. Ajouter custom domain : `votre-altesse.fr`
3. Configurer les DNS selon les instructions

### Étape 3 : Variables d'Environnement

Mettre à jour la variable d'environnement suivante :

```bash
NEXT_PUBLIC_SITE_URL=https://votre-altesse.fr
```

## 📧 Configuration Email

### Emails à mettre à jour :
- `contact@votre-altesse.fr` - Contact général
- `billetterie@votre-altesse.fr` - Système de billetterie
- `notifications@votre-altesse.fr` - Notifications automatiques

### Configuration SMTP recommandée :
- Utiliser un service comme SendGrid, Mailgun ou Brevo
- Configurer SPF, DKIM et DMARC pour la délivrabilité

## 🔄 Redirections (Optionnel)

Si vous souhaitez conserver l'ancien domaine et rediriger :

### Depuis altess.fr vers votre-altesse.fr :
```nginx
# Configuration Vercel (vercel.json)
{
  "redirects": [
    {
      "source": "/:path*",
      "destination": "https://votre-altesse.fr/:path*",
      "permanent": true
    }
  ]
}
```

## 🎨 Branding Complet

### Fichiers Modifiés :
1. ✅ `/components/VotreAltesseLogo.tsx` - Nouveau logo
2. ✅ `/components/Header.tsx` - Header principal
3. ✅ `/components/Navigation.tsx` - Navigation
4. ✅ `/components/Footer.tsx` - Footer
5. ✅ `/components/GlobalPlayer.tsx` - Player TV
6. ✅ `/app/layout.tsx` - Métadonnées SEO
7. ✅ `/app/page.tsx` - Page d'accueil
8. ✅ `/app/radio/page.tsx` - Page radio
9. ✅ `/hooks/use-site-settings.ts` - Paramètres par défaut

### Base de Données :
- ✅ Migration SQL créée : `20260212_rebrand_votre_altesse.sql`
- Cette migration met à jour tous les paramètres du site

## 🚀 Déploiement

### Checklist avant mise en production :

1. ✅ Code mis à jour avec "Votre Altesse"
2. ✅ Logo créé et intégré
3. ✅ SEO mis à jour
4. ✅ Migration SQL prête
5. ⏳ Configurer DNS chez le registrar
6. ⏳ Ajouter le domaine sur la plateforme de déploiement
7. ⏳ Mettre à jour NEXT_PUBLIC_SITE_URL
8. ⏳ Configurer les emails @votre-altesse.fr
9. ⏳ Exécuter la migration SQL en production
10. ⏳ Tester le site sur le nouveau domaine

## 📱 Tests à Effectuer

Après déploiement, vérifier :
- [ ] Le site s'affiche correctement sur votre-altesse.fr
- [ ] Le logo "Votre Altesse" apparaît partout
- [ ] Les titres de pages sont corrects
- [ ] Les emails utilisent @votre-altesse.fr
- [ ] Le certificat SSL est valide
- [ ] www.votre-altesse.fr redirige vers votre-altesse.fr
- [ ] Les partages sociaux affichent le bon titre/description

## 🎯 Notes Importantes

1. **Délai de propagation DNS** : 24-48h maximum
2. **SSL automatique** : Vercel/Netlify le génèrent automatiquement
3. **Ancien domaine** : Peut rester actif ou être redirigé
4. **Emails** : Configurer avant le lancement pour éviter les bounces

## 🆘 Support

En cas de problème :
- Vérifier la configuration DNS avec `dig votre-altesse.fr`
- Vérifier le certificat SSL avec `openssl s_client -connect votre-altesse.fr:443`
- Consulter les logs de la plateforme de déploiement
