/*
  # Désactiver la vérification d'email

  1. Confirmer automatiquement tous les utilisateurs existants non confirmés
  2. Créer un trigger pour confirmer automatiquement les nouveaux utilisateurs
  
  ## Changements
  - Confirme tous les emails non confirmés
  - Ajoute un trigger pour auto-confirmer les nouveaux utilisateurs
  
  ## Sécurité
  - Cette migration permet à tous les utilisateurs de se connecter immédiatement
  - Utilisez uniquement en développement ou si vous avez un autre mécanisme de vérification
*/

-- Confirmer tous les utilisateurs existants qui ne sont pas confirmés
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;

-- Créer une fonction pour auto-confirmer les nouveaux utilisateurs
CREATE OR REPLACE FUNCTION public.auto_confirm_email()
RETURNS TRIGGER AS $$
BEGIN
  -- Si l'email n'est pas confirmé, le confirmer automatiquement
  IF NEW.email_confirmed_at IS NULL THEN
    NEW.email_confirmed_at := NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer le trigger sur auth.users
DROP TRIGGER IF EXISTS on_auth_user_created_auto_confirm ON auth.users;
CREATE TRIGGER on_auth_user_created_auto_confirm
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_confirm_email();