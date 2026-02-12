/*
  # Désactiver DÉFINITIVEMENT la confirmation d'email

  1. Confirmer TOUS les utilisateurs existants
  2. Créer un trigger qui confirme AUTOMATIQUEMENT tous les nouveaux utilisateurs
  3. Empêcher Supabase de demander la confirmation d'email
  
  ## Changements
  - Confirme tous les emails non confirmés
  - Trigger auto-confirmation pour nouveaux utilisateurs
  - Configuration pour désactiver la vérification email
  
  ## Sécurité
  - Permet à tous les utilisateurs de se connecter immédiatement
  - Plus besoin de cliquer sur un lien de confirmation
*/

-- 1. Confirmer TOUS les utilisateurs existants qui ne sont pas confirmés
UPDATE auth.users
SET email_confirmed_at = COALESCE(email_confirmed_at, NOW())
WHERE email_confirmed_at IS NULL;

-- 2. Recréer la fonction d'auto-confirmation (au cas où)
CREATE OR REPLACE FUNCTION public.auto_confirm_all_emails()
RETURNS TRIGGER AS $$
BEGIN
  -- Forcer la confirmation de l'email immédiatement
  IF NEW.email_confirmed_at IS NULL THEN
    NEW.email_confirmed_at := NOW();
  END IF;
  
  -- S'assurer que raw_user_meta_data contient la confirmation
  IF NEW.raw_user_meta_data IS NULL THEN
    NEW.raw_user_meta_data := '{"email_confirmed": true}'::jsonb;
  ELSE
    NEW.raw_user_meta_data := NEW.raw_user_meta_data || '{"email_confirmed": true}'::jsonb;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Supprimer l'ancien trigger s'il existe
DROP TRIGGER IF EXISTS trigger_auto_confirm_email ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_auto_confirm ON auth.users;

-- 4. Créer le nouveau trigger
CREATE TRIGGER trigger_auto_confirm_email
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_confirm_all_emails();

-- 5. Mettre à jour les métadonnées de tous les utilisateurs existants
UPDATE auth.users
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"email_confirmed": true}'::jsonb
WHERE raw_user_meta_data IS NULL 
   OR NOT (raw_user_meta_data ? 'email_confirmed');

-- 6. Confirmer spécifiquement le compte imed.labidi@gmail.com
UPDATE auth.users
SET 
  email_confirmed_at = NOW(),
  raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"email_confirmed": true}'::jsonb
WHERE email = 'imed.labidi@gmail.com';
