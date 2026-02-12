/*
  # Fix User Profile Creation

  ## Changes
  
  1. Ensure trigger for automatic profile creation is properly set up
  2. Add function to handle new user signup
  3. Make sure RLS policies allow profile creation
  
  ## Security
  
  - Users can create their own profile during signup
  - Profile is automatically created when user signs up
*/

-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

-- Create function to automatically create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'client')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Ensure RLS policies allow profile insertion
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Also allow during signup (when user is not yet authenticated)
DROP POLICY IF EXISTS "Enable insert for authentication" ON profiles;

CREATE POLICY "Enable insert for authentication"
  ON profiles FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
