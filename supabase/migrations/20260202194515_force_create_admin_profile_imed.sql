/*
  # Forcer la création du profil admin pour imed.labidi@gmail.com

  1. Création/mise à jour du profil
  2. Attribution du rôle admin
  3. Configuration de toutes les métadonnées nécessaires
  
  ## Changements
  - Upsert du profil avec rôle admin
  - Mise à jour des métadonnées auth
  - Fonction de secours pour recréer le profil
  
  ## Sécurité
  - Profile accessible avec policy existante
  - Rôle admin assigné explicitement
*/

-- 1. Mettre à jour/créer le profil pour imed.labidi@gmail.com
INSERT INTO profiles (
  id,
  email,
  role,
  full_name,
  phone,
  created_at,
  updated_at
)
SELECT 
  u.id,
  u.email,
  'admin' as role,
  'Imed Labidi' as full_name,
  NULL as phone,
  u.created_at,
  NOW() as updated_at
FROM auth.users u
WHERE u.email = 'imed.labidi@gmail.com'
ON CONFLICT (id) 
DO UPDATE SET
  role = 'admin',
  full_name = 'Imed Labidi',
  updated_at = NOW();

-- 2. Créer une fonction pour forcer la création d'un profil admin
CREATE OR REPLACE FUNCTION force_create_admin_profile(user_email TEXT)
RETURNS void AS $$
DECLARE
  user_id UUID;
BEGIN
  -- Récupérer l'ID de l'utilisateur
  SELECT id INTO user_id
  FROM auth.users
  WHERE email = user_email;
  
  IF user_id IS NULL THEN
    RAISE EXCEPTION 'Utilisateur non trouvé: %', user_email;
  END IF;
  
  -- Insérer ou mettre à jour le profil
  INSERT INTO profiles (
    id,
    email,
    role,
    full_name,
    created_at,
    updated_at
  )
  VALUES (
    user_id,
    user_email,
    'admin',
    'Administrateur',
    NOW(),
    NOW()
  )
  ON CONFLICT (id)
  DO UPDATE SET
    role = 'admin',
    email = EXCLUDED.email,
    updated_at = NOW();
    
  -- Mettre à jour les métadonnées auth
  UPDATE auth.users
  SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb
  WHERE id = user_id;
  
  RAISE NOTICE 'Profil admin créé/mis à jour pour: %', user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Exécuter la fonction pour imed.labidi@gmail.com
SELECT force_create_admin_profile('imed.labidi@gmail.com');

-- 4. Vérification du profil
DO $$
DECLARE
  profile_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO profile_count
  FROM profiles
  WHERE email = 'imed.labidi@gmail.com' AND role = 'admin';
  
  IF profile_count = 0 THEN
    RAISE EXCEPTION 'Échec de création du profil admin';
  ELSE
    RAISE NOTICE 'Profil admin confirmé pour imed.labidi@gmail.com';
  END IF;
END $$;

-- 5. Ajouter une policy temporaire pour déboguer (lecture publique pour admin)
DROP POLICY IF EXISTS "Debug: Allow read for imed" ON profiles;
CREATE POLICY "Debug: Allow read for imed"
  ON profiles
  FOR SELECT
  USING (email = 'imed.labidi@gmail.com');
