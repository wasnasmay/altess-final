/*
  # Réinitialisation du mot de passe admin

  1. Actions
    - Mise à jour du mot de passe pour l'admin Imed
    - Force un nouveau mot de passe: Admin2026!
  
  Note: Ce mot de passe doit être changé après la première connexion
*/

-- Le mot de passe sera: Admin2026!
-- Hash bcrypt pour "Admin2026!" 
UPDATE auth.users
SET 
  encrypted_password = crypt('Admin2026!', gen_salt('bf')),
  email_confirmed_at = COALESCE(email_confirmed_at, now()),
  updated_at = now()
WHERE email = 'imed.labidi@gmail.com';

-- S'assurer que le profil est bien configuré
UPDATE profiles
SET 
  role = 'admin',
  updated_at = now()
WHERE email = 'imed.labidi@gmail.com';
