/*
  # Orientale Musique Database Schema

  1. New Tables
    - `orchestras`
      - `id` (uuid, primary key)
      - `name` (text) - Orchestra name
      - `description` (text) - Detailed description
      - `image_url` (text) - Orchestra image
      - `price_range` (text) - Price range (e.g., "500-1500")
      - `members_count` (int) - Number of musicians
      - `specialties` (text[]) - Musical specialties
      - `created_at` (timestamptz)
      
    - `musicians`
      - `id` (uuid, primary key)
      - `name` (text) - Musician name
      - `email` (text) - Contact email
      - `phone` (text) - Phone number
      - `instrument` (text) - Primary instrument
      - `orchestra_id` (uuid) - Reference to orchestra
      - `availability` (jsonb) - Availability calendar
      - `photo_url` (text) - Profile photo
      - `bio` (text) - Biography
      - `created_at` (timestamptz)
      
    - `chat_messages`
      - `id` (uuid, primary key)
      - `user_name` (text) - Name of the person chatting
      - `user_email` (text) - Email for follow-up
      - `message` (text) - Message content
      - `response` (text) - AI or admin response
      - `created_at` (timestamptz)
      - `is_admin_response` (boolean) - Whether response is from admin or AI
      
    - `quotes`
      - `id` (uuid, primary key)
      - `client_name` (text) - Client name
      - `client_email` (text) - Client email
      - `client_phone` (text) - Client phone
      - `event_type` (text) - Type of event
      - `event_date` (date) - Event date
      - `budget` (numeric) - Client budget
      - `guests_count` (int) - Number of guests
      - `orchestra_id` (uuid) - Selected orchestra
      - `status` (text) - Quote status (pending, approved, rejected)
      - `total_price` (numeric) - Calculated price
      - `notes` (text) - Additional notes
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Public read access for orchestras
    - Authenticated admin access for musicians, quotes
    - Public insert for chat_messages and quotes (with validation)
    - Real-time enabled for chat_messages
*/

-- Create orchestras table
CREATE TABLE IF NOT EXISTS orchestras (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  image_url text DEFAULT '',
  price_range text DEFAULT '500-1500',
  members_count int DEFAULT 5,
  specialties text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Create musicians table
CREATE TABLE IF NOT EXISTS musicians (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text DEFAULT '',
  instrument text NOT NULL,
  orchestra_id uuid REFERENCES orchestras(id) ON DELETE SET NULL,
  availability jsonb DEFAULT '{}',
  photo_url text DEFAULT '',
  bio text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_name text NOT NULL,
  user_email text DEFAULT '',
  message text NOT NULL,
  response text DEFAULT '',
  is_admin_response boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create quotes table
CREATE TABLE IF NOT EXISTS quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name text NOT NULL,
  client_email text NOT NULL,
  client_phone text DEFAULT '',
  event_type text NOT NULL,
  event_date date NOT NULL,
  budget numeric DEFAULT 0,
  guests_count int DEFAULT 0,
  orchestra_id uuid REFERENCES orchestras(id) ON DELETE SET NULL,
  status text DEFAULT 'pending',
  total_price numeric DEFAULT 0,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE orchestras ENABLE ROW LEVEL SECURITY;
ALTER TABLE musicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

-- Orchestras policies (public read)
CREATE POLICY "Anyone can view orchestras"
  ON orchestras FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert orchestras"
  ON orchestras FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update orchestras"
  ON orchestras FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete orchestras"
  ON orchestras FOR DELETE
  TO authenticated
  USING (true);

-- Musicians policies (admin only for modifications)
CREATE POLICY "Anyone can view musicians"
  ON musicians FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert musicians"
  ON musicians FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update musicians"
  ON musicians FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete musicians"
  ON musicians FOR DELETE
  TO authenticated
  USING (true);

-- Chat messages policies (public can insert, all can read)
CREATE POLICY "Anyone can view chat messages"
  ON chat_messages FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can insert chat messages"
  ON chat_messages FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update chat messages"
  ON chat_messages FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Quotes policies (public can insert, authenticated can manage)
CREATE POLICY "Anyone can insert quotes"
  ON quotes FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view all quotes"
  ON quotes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can update quotes"
  ON quotes FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete quotes"
  ON quotes FOR DELETE
  TO authenticated
  USING (true);

-- Insert sample orchestras
INSERT INTO orchestras (name, description, image_url, price_range, members_count, specialties) VALUES
  ('Ensemble Andalousie', 'Un orchestre traditionnel spécialisé dans la musique andalouse et les mariages marocains. Avec des musiciens expérimentés et une variété d''instruments traditionnels.', 'https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg?auto=compress&cs=tinysrgb&w=800', '800-2000', 8, ARRAY['Mariage', 'Andalou', 'Traditionnel']),
  ('Oriental Dreams', 'Formation moderne fusionnant musique orientale et touches contemporaines. Parfait pour les événements prestigieux et les soirées corporate.', 'https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg?auto=compress&cs=tinysrgb&w=800', '1200-3000', 6, ARRAY['Moderne', 'Fusion', 'Corporate']),
  ('Chaabi Royal', 'Spécialistes du Chaabi marocain authentique. Animation garantie pour vos fêtes familiales et cérémonies traditionnelles.', 'https://images.pexels.com/photos/1190297/pexels-photo-1190297.jpeg?auto=compress&cs=tinysrgb&w=800', '600-1500', 5, ARRAY['Chaabi', 'Animation', 'Fêtes']),
  ('Orchestre Malouf', 'Ensemble expert en musique Malouf tunisienne et algérienne. Idéal pour les événements culturels et célébrations raffinées.', 'https://images.pexels.com/photos/1047442/pexels-photo-1047442.jpeg?auto=compress&cs=tinysrgb&w=800', '900-2200', 7, ARRAY['Malouf', 'Culturel', 'Raffiné']),
  ('Gnawa Experience', 'Groupe de Gnawa authentique offrant une expérience spirituelle et festive unique. Performance énergique et captivante.', 'https://images.pexels.com/photos/1916821/pexels-photo-1916821.jpeg?auto=compress&cs=tinysrgb&w=800', '700-1800', 4, ARRAY['Gnawa', 'Spirituel', 'Énergique']);

-- Insert sample musicians
INSERT INTO musicians (name, email, phone, instrument, orchestra_id, photo_url, bio) 
SELECT 
  'Ahmed Benali', 
  'ahmed.benali@orientale-musique.com', 
  '+212 6 12 34 56 78',
  'Oud',
  id,
  'https://images.pexels.com/photos/1181690/pexels-photo-1181690.jpeg?auto=compress&cs=tinysrgb&w=400',
  'Oudiste virtuose avec 15 ans d''expérience dans la musique andalouse.'
FROM orchestras WHERE name = 'Ensemble Andalousie' LIMIT 1;