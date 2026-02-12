# Guide Complet - Dashboard Prestataire

## Modifications Apportées

Le système comprend maintenant:
1. **Dashboard prestataire complet** avec 3 onglets de gestion
2. **Gestion du carrousel médias** (images & vidéos) complètement personnalisable
3. **Calendrier de disponibilité** interactif avec 4 statuts
4. **Système de demandes de devis** avec pipeline de conversion
5. **Formulaire de contact enrichi** avec informations événement
6. **Affichage public** du carrousel et calendrier sur les pages partenaires

## Étapes pour accéder au dashboard prestataire

### Option 1: Via l'interface admin (Recommandé)

1. **Connectez-vous à l'admin**
   - Allez sur `/login`
   - Connectez-vous avec votre compte

2. **Créez un partenaire**
   - Allez sur `/admin/partners`
   - Cliquez sur "Nouveau Partenaire"
   - Remplissez le formulaire:
     - Nom: "Délices d'Orient Traiteur"
     - Slug: "delices-orient-traiteur"
     - Email: **UTILISEZ LE MÊME EMAIL QUE VOTRE COMPTE**
     - Téléphone: "+33 6 12 34 56 78"
     - Catégorie: "Gastronomie"
     - Description: "Gastronomie orientale raffinée..."
     - Actif: ✓

3. **Accédez au dashboard**
   - Allez sur `/partner-dashboard`
   - Le système va automatiquement créer le lien entre votre compte et le partenaire

### Option 2: Via SQL (si vous avez accès à Supabase)

```sql
-- 1. Créer un partenaire de test
INSERT INTO partners (name, slug, category, email, phone, description, is_active)
VALUES (
  'Délices d''Orient Traiteur',
  'delices-orient-traiteur',
  'Gastronomie',
  'VOTRE_EMAIL@exemple.com',  -- Remplacez par votre email de connexion
  '+33 6 12 34 56 78',
  'Gastronomie orientale raffinée et authentique pour vos événements',
  true
);

-- 2. Lier votre compte utilisateur au partenaire
-- (Le système le fait automatiquement lors de la première connexion au dashboard)
```

## Fonctionnalités du Dashboard

Une fois connecté sur `/partner-dashboard`, vous aurez accès à 3 onglets:

### 1. Carrousel Médias
- Ajoutez des images et vidéos
- Gérez l'ordre d'affichage
- Activez/Désactivez la visibilité
- Ajoutez titres et descriptions

### 2. Calendrier de Disponibilités
- Cliquez sur une date pour définir votre statut
- 4 statuts: Disponible, Partiellement disponible, Indisponible, Réservé
- Ajoutez des notes internes
- Visualisation colorée sur le calendrier

### 3. Demandes de Devis
- Recevez les demandes via le formulaire de contact
- Filtrez par statut (En attente, Contacté, Devis envoyé, Converti, Refusé)
- Cliquez pour voir les détails
- Changez le statut en un clic
- Actions rapides: Email et appel direct

## Statistiques affichées

- Vues du profil
- Clics site web
- Clics email
- Clics téléphone

## Affichage Public

Vos modifications sont automatiquement visibles sur votre page publique `/partenaires/votre-slug`:

### Carrousel Médias
- Les images et vidéos ajoutées dans le dashboard s'affichent automatiquement
- Seuls les médias actifs sont visibles
- Ordre d'affichage respecté
- Compteurs de photos/vidéos mis à jour

### Calendrier de Disponibilités
- Widget de disponibilités visible dans la sidebar
- Calendrier avec codes couleur (vert=disponible, rouge=indisponible, etc.)
- Statistiques par statut
- Mis à jour en temps réel

### Formulaire de Contact
- Nouveau formulaire enrichi avec:
  - Date de l'événement
  - Nombre d'invités
  - Type d'événement
  - Message détaillé
- Les demandes arrivent directement dans l'onglet "Demandes" du dashboard

## Test rapide

1. **Créez un partenaire** avec votre email via `/admin/partners`
2. **Connectez-vous au dashboard** sur `/partner-dashboard`
3. **Ajoutez des médias** dans l'onglet Carrousel:
   - Exemple image: `https://images.pexels.com/photos/1395964/pexels-photo-1395964.jpeg`
   - Donnez un titre et description
4. **Définissez des disponibilités** dans l'onglet Calendrier:
   - Cliquez sur plusieurs dates
   - Testez les différents statuts
5. **Visitez votre page publique** `/partenaires/votre-slug`:
   - Vérifiez que le carrousel s'affiche
   - Vérifiez que le calendrier est visible
6. **Testez le formulaire** sur la page publique:
   - Remplissez et envoyez une demande
7. **Retournez au dashboard** onglet "Demandes":
   - Votre demande test apparaît
   - Testez le changement de statut

## Dépannage

**"Aucun profil prestataire trouvé"**
- Vérifiez que vous avez créé un partenaire avec l'email exact de votre compte
- L'email du partenaire doit correspondre à l'email de connexion

**Le dashboard ne charge pas**
- Vérifiez que vous êtes bien connecté
- Vérifiez la console du navigateur pour les erreurs
- Assurez-vous que la migration a été appliquée

**Les composants ne s'affichent pas**
- Videz le cache du navigateur
- Rechargez la page avec Ctrl+Shift+R (ou Cmd+Shift+R sur Mac)
