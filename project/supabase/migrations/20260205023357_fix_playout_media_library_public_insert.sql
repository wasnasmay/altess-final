/*
  # Fix - Autoriser insertion publique temporaire dans playout_media_library
  
  1. Problème
    - Les policies RLS actuelles n'autorisent que les utilisateurs authentifiés
    - L'API /api/playout/media/save utilise ANON_KEY (public)
    - Résultat: Erreur 400 lors de l'insertion
  
  2. Solution temporaire
    - Ajouter une policy permissive pour le rôle public
    - Permet l'insertion via l'API Route
    
  3. Sécurité
    - Cette policy est pour le développement/test
    - En production, utilisez SERVICE_ROLE_KEY dans l'API
*/

-- Supprimer l'ancienne policy restrictive si elle existe
DROP POLICY IF EXISTS "temp_allow_public_insert_media" ON playout_media_library;

-- Créer une policy permissive pour public
CREATE POLICY "temp_allow_public_insert_media"
  ON playout_media_library
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Rafraîchir le cache
NOTIFY pgrst, 'reload schema';
