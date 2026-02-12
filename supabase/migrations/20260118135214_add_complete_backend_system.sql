/*
  # Complete Backend System for Orientale Musique

  ## 1. New Tables & Columns
  
  ### Updates to `orchestras` table
  - Add `provider_id` (uuid, references profiles)
  - Add `rating` (numeric)
  - Add `total_reviews` (int)
  - Add `is_verified` (boolean)
  - Add `is_active` (boolean)
  - Add `updated_at` (timestamptz)

  ### New `profiles` table
  - `id` (uuid, primary key, references auth.users)
  - `email` (text)
  - `full_name` (text)
  - `phone` (text)
  - `role` (text) - 'client', 'provider', 'admin'
  - `avatar_url` (text)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### New `bookings` table
  - Complete booking management system

  ### New `availability` table
  - Provider availability tracking

  ### New `reviews` table
  - Customer reviews and ratings

  ### New `messages` table
  - Internal messaging system

  ### New `payment_metadata` table
  - Payment tracking

  ## 2. Security
  - Enable RLS on all tables
  - Role-based access control
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  phone text,
  role text NOT NULL DEFAULT 'client' CHECK (role IN ('client', 'provider', 'admin')),
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Add missing columns to orchestras table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orchestras' AND column_name = 'provider_id'
  ) THEN
    ALTER TABLE orchestras ADD COLUMN provider_id uuid REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orchestras' AND column_name = 'rating'
  ) THEN
    ALTER TABLE orchestras ADD COLUMN rating numeric DEFAULT 0 CHECK (rating >= 0 AND rating <= 5);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orchestras' AND column_name = 'total_reviews'
  ) THEN
    ALTER TABLE orchestras ADD COLUMN total_reviews int DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orchestras' AND column_name = 'is_verified'
  ) THEN
    ALTER TABLE orchestras ADD COLUMN is_verified boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orchestras' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE orchestras ADD COLUMN is_active boolean DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orchestras' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE orchestras ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Update orchestras RLS policies
DROP POLICY IF EXISTS "Anyone can view orchestras" ON orchestras;
DROP POLICY IF EXISTS "Enable read access for all users" ON orchestras;

CREATE POLICY "Anyone can view active orchestras"
  ON orchestras FOR SELECT
  TO authenticated
  USING (is_active = true OR provider_id = auth.uid());

CREATE POLICY "Providers can insert own orchestras"
  ON orchestras FOR INSERT
  TO authenticated
  WITH CHECK (
    provider_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('provider', 'admin')
    )
  );

CREATE POLICY "Providers can update own orchestras"
  ON orchestras FOR UPDATE
  TO authenticated
  USING (provider_id = auth.uid())
  WITH CHECK (provider_id = auth.uid());

CREATE POLICY "Admins can manage all orchestras"
  ON orchestras FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  orchestra_id uuid NOT NULL REFERENCES orchestras(id) ON DELETE CASCADE,
  event_date date NOT NULL,
  event_time time,
  event_type text NOT NULL CHECK (event_type IN ('wedding', 'corporate', 'family', 'concert', 'other')),
  event_location text NOT NULL,
  guest_count int,
  duration_hours int DEFAULT 4,
  price_agreed numeric,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  special_requests text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Bookings policies
CREATE POLICY "Clients can view own bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (client_id = auth.uid());

CREATE POLICY "Providers can view their orchestra bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orchestras
      WHERE orchestras.id = bookings.orchestra_id
      AND orchestras.provider_id = auth.uid()
    )
  );

CREATE POLICY "Clients can create bookings"
  ON bookings FOR INSERT
  TO authenticated
  WITH CHECK (client_id = auth.uid());

CREATE POLICY "Clients can update own bookings"
  ON bookings FOR UPDATE
  TO authenticated
  USING (client_id = auth.uid())
  WITH CHECK (client_id = auth.uid());

CREATE POLICY "Providers can update their orchestra bookings"
  ON bookings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orchestras
      WHERE orchestras.id = bookings.orchestra_id
      AND orchestras.provider_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all bookings"
  ON bookings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create availability table
CREATE TABLE IF NOT EXISTS availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  orchestra_id uuid NOT NULL REFERENCES orchestras(id) ON DELETE CASCADE,
  date date NOT NULL,
  is_available boolean DEFAULT true,
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(orchestra_id, date)
);

ALTER TABLE availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view availability"
  ON availability FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Providers can manage own orchestra availability"
  ON availability FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orchestras
      WHERE orchestras.id = availability.orchestra_id
      AND orchestras.provider_id = auth.uid()
    )
  );

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  orchestra_id uuid NOT NULL REFERENCES orchestras(id) ON DELETE CASCADE,
  rating int NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(booking_id)
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reviews"
  ON reviews FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Clients can create reviews for their bookings"
  ON reviews FOR INSERT
  TO authenticated
  WITH CHECK (
    client_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = reviews.booking_id
      AND bookings.client_id = auth.uid()
      AND bookings.status = 'completed'
    )
  );

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages they sent or received"
  ON messages FOR SELECT
  TO authenticated
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (sender_id = auth.uid());

-- Create payment_metadata table
CREATE TABLE IF NOT EXISTS payment_metadata (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'completed')),
  payment_method text,
  transaction_date timestamptz,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE payment_metadata ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can view own payment metadata"
  ON payment_metadata FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = payment_metadata.booking_id
      AND bookings.client_id = auth.uid()
    )
  );

CREATE POLICY "Providers can view their orchestra payment metadata"
  ON payment_metadata FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bookings
      JOIN orchestras ON orchestras.id = bookings.orchestra_id
      WHERE bookings.id = payment_metadata.booking_id
      AND orchestras.provider_id = auth.uid()
    )
  );

-- Create function to update orchestra rating
CREATE OR REPLACE FUNCTION update_orchestra_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE orchestras
  SET 
    rating = (
      SELECT COALESCE(AVG(rating)::numeric(3,2), 0)
      FROM reviews
      WHERE orchestra_id = NEW.orchestra_id
    ),
    total_reviews = (
      SELECT COUNT(*)
      FROM reviews
      WHERE orchestra_id = NEW.orchestra_id
    )
  WHERE id = NEW.orchestra_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for updating orchestra rating
DROP TRIGGER IF EXISTS update_orchestra_rating_trigger ON reviews;
CREATE TRIGGER update_orchestra_rating_trigger
  AFTER INSERT OR UPDATE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_orchestra_rating();

-- Create function to automatically create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'client')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orchestras_provider_id ON orchestras(provider_id);
CREATE INDEX IF NOT EXISTS idx_orchestras_is_active ON orchestras(is_active);
CREATE INDEX IF NOT EXISTS idx_bookings_client_id ON bookings(client_id);
CREATE INDEX IF NOT EXISTS idx_bookings_orchestra_id ON bookings(orchestra_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_event_date ON bookings(event_date);
CREATE INDEX IF NOT EXISTS idx_availability_orchestra_date ON availability(orchestra_id, date);
CREATE INDEX IF NOT EXISTS idx_reviews_orchestra_id ON reviews(orchestra_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_receiver ON messages(sender_id, receiver_id);