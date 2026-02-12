/*
  # Add Admin Role for imed.labidi@gmail.com
  
  ## Changes
  
  1. Update handle_new_user function to automatically assign 'admin' role to imed.labidi@gmail.com
  2. Update existing profile if it exists
  
  ## Security
  
  - Only imed.labidi@gmail.com gets admin role automatically
  - All other users get 'client' role by default
*/

-- Update existing profile if it exists
UPDATE profiles 
SET role = 'admin', updated_at = now()
WHERE email = 'imed.labidi@gmail.com';

-- Drop and recreate the handle_new_user function with admin check
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if this is the admin email
  IF NEW.email = 'imed.labidi@gmail.com' THEN
    INSERT INTO public.profiles (id, email, role)
    VALUES (NEW.id, NEW.email, 'admin')
    ON CONFLICT (id) DO UPDATE SET role = 'admin';
  ELSE
    INSERT INTO public.profiles (id, email, role)
    VALUES (NEW.id, NEW.email, 'client')
    ON CONFLICT (id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
