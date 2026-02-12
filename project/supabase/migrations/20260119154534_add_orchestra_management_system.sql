/*
  # Orchestra Management System

  1. New Tables
    - `orchestra_formulas`
      - `id` (uuid, primary key)
      - `name` (text) - Formula name
      - `description` (text) - Description
      - `price_from` (numeric) - Starting price
      - `image_url` (text) - Formula image
      - `features` (jsonb) - Array of features
      - `display_order` (integer) - Display order
      - `is_active` (boolean) - Active status
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `demo_videos`
      - `id` (uuid, primary key)
      - `title` (text) - Video title
      - `description` (text) - Video description
      - `video_url` (text) - YouTube/Vimeo URL
      - `thumbnail_url` (text) - Thumbnail image
      - `display_order` (integer) - Display order
      - `is_active` (boolean) - Active status
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `instruments`
      - `id` (uuid, primary key)
      - `name` (text) - Instrument name
      - `description` (text) - Description
      - `price_per_hour` (numeric) - Hourly rate
      - `image_url` (text) - Instrument image
      - `category` (text) - Category (string, percussion, wind, etc.)
      - `is_available` (boolean) - Availability
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `custom_orders`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `customer_name` (text) - Customer name
      - `customer_email` (text) - Customer email
      - `customer_phone` (text) - Customer phone
      - `event_date` (date) - Event date
      - `event_location` (text) - Event location
      - `event_type` (text) - Type of event
      - `duration_hours` (integer) - Duration in hours
      - `total_price` (numeric) - Total calculated price
      - `status` (text) - Status: draft, pending, confirmed, paid, completed, cancelled
      - `notes` (text) - Additional notes
      - `payment_intent_id` (text) - Stripe payment intent ID
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `order_items`
      - `id` (uuid, primary key)
      - `order_id` (uuid, references custom_orders)
      - `instrument_id` (uuid, references instruments)
      - `quantity` (integer) - Number of musicians
      - `price_per_hour` (numeric) - Price at time of order
      - `subtotal` (numeric) - Calculated subtotal
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Admin users can manage formulas, videos, and instruments
    - Authenticated users can create orders
    - Users can only view their own orders
    - Public can view active formulas, videos, and available instruments
*/

-- Create orchestra_formulas table
CREATE TABLE IF NOT EXISTS orchestra_formulas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  price_from numeric NOT NULL,
  image_url text NOT NULL,
  features jsonb DEFAULT '[]'::jsonb,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create demo_videos table
CREATE TABLE IF NOT EXISTS demo_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  video_url text NOT NULL,
  thumbnail_url text NOT NULL,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create instruments table
CREATE TABLE IF NOT EXISTS instruments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  price_per_hour numeric NOT NULL,
  image_url text NOT NULL,
  category text NOT NULL,
  is_available boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create custom_orders table
CREATE TABLE IF NOT EXISTS custom_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  customer_phone text,
  event_date date NOT NULL,
  event_location text NOT NULL,
  event_type text NOT NULL,
  duration_hours integer NOT NULL DEFAULT 2,
  total_price numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft',
  notes text,
  payment_intent_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES custom_orders(id) ON DELETE CASCADE,
  instrument_id uuid NOT NULL REFERENCES instruments(id),
  quantity integer NOT NULL DEFAULT 1,
  price_per_hour numeric NOT NULL,
  subtotal numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE orchestra_formulas ENABLE ROW LEVEL SECURITY;
ALTER TABLE demo_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE instruments ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for orchestra_formulas
CREATE POLICY "Anyone can view active formulas"
  ON orchestra_formulas FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage formulas"
  ON orchestra_formulas FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- RLS Policies for demo_videos
CREATE POLICY "Anyone can view active demo videos"
  ON demo_videos FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage demo videos"
  ON demo_videos FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- RLS Policies for instruments
CREATE POLICY "Anyone can view available instruments"
  ON instruments FOR SELECT
  USING (is_available = true);

CREATE POLICY "Admins can manage instruments"
  ON instruments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- RLS Policies for custom_orders
CREATE POLICY "Users can view own orders"
  ON custom_orders FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create orders"
  ON custom_orders FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own draft orders"
  ON custom_orders FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() AND status = 'draft')
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all orders"
  ON custom_orders FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update all orders"
  ON custom_orders FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- RLS Policies for order_items
CREATE POLICY "Users can view own order items"
  ON order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM custom_orders
      WHERE custom_orders.id = order_items.order_id
      AND custom_orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage items in own draft orders"
  ON order_items FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM custom_orders
      WHERE custom_orders.id = order_items.order_id
      AND custom_orders.user_id = auth.uid()
      AND custom_orders.status = 'draft'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM custom_orders
      WHERE custom_orders.id = order_items.order_id
      AND custom_orders.user_id = auth.uid()
      AND custom_orders.status = 'draft'
    )
  );

CREATE POLICY "Admins can view all order items"
  ON order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_orchestra_formulas_active ON orchestra_formulas(is_active, display_order);
CREATE INDEX IF NOT EXISTS idx_demo_videos_active ON demo_videos(is_active, display_order);
CREATE INDEX IF NOT EXISTS idx_instruments_available ON instruments(is_available, category);
CREATE INDEX IF NOT EXISTS idx_custom_orders_user ON custom_orders(user_id, status);
CREATE INDEX IF NOT EXISTS idx_custom_orders_status ON custom_orders(status, created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

-- Insert default instruments
INSERT INTO instruments (name, description, price_per_hour, image_url, category) VALUES
  ('Oud', 'Luth oriental traditionnel, instrument central de la musique arabe', 150, 'https://images.pexels.com/photos/7520385/pexels-photo-7520385.jpeg?auto=compress&cs=tinysrgb&w=800', 'Cordes'),
  ('Qanun', 'Cithare sur table à 78 cordes, son cristallin et mélodique', 150, 'https://images.pexels.com/photos/8191603/pexels-photo-8191603.jpeg?auto=compress&cs=tinysrgb&w=800', 'Cordes'),
  ('Violon Oriental', 'Violon adapté aux maqams orientaux', 120, 'https://images.pexels.com/photos/1407322/pexels-photo-1407322.jpeg?auto=compress&cs=tinysrgb&w=800', 'Cordes'),
  ('Nay', 'Flûte en roseau, son aérien et mystique', 100, 'https://images.pexels.com/photos/8191371/pexels-photo-8191371.jpeg?auto=compress&cs=tinysrgb&w=800', 'Vents'),
  ('Derbouka', 'Percussion principale, rythmes entraînants', 80, 'https://images.pexels.com/photos/4088011/pexels-photo-4088011.jpeg?auto=compress&cs=tinysrgb&w=800', 'Percussions'),
  ('Riqq', 'Tambourin oriental avec cymbalettes', 70, 'https://images.pexels.com/photos/7520349/pexels-photo-7520349.jpeg?auto=compress&cs=tinysrgb&w=800', 'Percussions'),
  ('Tabla', 'Paire de tambours pour accompagnement rythmique', 80, 'https://images.pexels.com/photos/5211028/pexels-photo-5211028.jpeg?auto=compress&cs=tinysrgb&w=800', 'Percussions'),
  ('Chanteur Principal', 'Voix principale, répertoire classique et moderne', 200, 'https://images.pexels.com/photos/6958547/pexels-photo-6958547.jpeg?auto=compress&cs=tinysrgb&w=800', 'Voix'),
  ('Chanteuse Principale', 'Voix féminine, répertoire oriental et moderne', 200, 'https://images.pexels.com/photos/7520376/pexels-photo-7520376.jpeg?auto=compress&cs=tinysrgb&w=800', 'Voix'),
  ('Accordéon Oriental', 'Accordéon chromatique pour musique orientale', 130, 'https://images.pexels.com/photos/2102934/pexels-photo-2102934.jpeg?auto=compress&cs=tinysrgb&w=800', 'Vents'),
  ('Buzuq', 'Luth à manche long, son puissant et caractéristique', 140, 'https://images.pexels.com/photos/8191612/pexels-photo-8191612.jpeg?auto=compress&cs=tinysrgb&w=800', 'Cordes')
ON CONFLICT DO NOTHING;