/*
  # Create Academy System

  ## New Tables

  ### `academy_courses`
  - Course management for music academy
  - Public courses visible to all, admin-managed

  ### `course_purchases`
  - Track user course purchases
  - Payment status tracking

  ### `academy_lessons`
  - Individual lessons within courses
  - Access controlled by purchases

  ### `dynamic_form_fields`
  - Configurable form fields for quotes/orders
  - Admin-managed

  ## Security
  - RLS enabled on all tables
  - Proper access control policies
*/

-- Academy Courses Table
CREATE TABLE IF NOT EXISTS academy_courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  instructor text,
  instrument text NOT NULL,
  price numeric NOT NULL DEFAULT 0,
  vimeo_url text,
  demo_video_url text,
  thumbnail_url text,
  duration_hours integer DEFAULT 0,
  level text DEFAULT 'beginner',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE academy_courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active courses"
  ON academy_courses FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Admins can manage courses"
  ON academy_courses FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Course Purchases Table
CREATE TABLE IF NOT EXISTS course_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  course_id uuid REFERENCES academy_courses(id) ON DELETE CASCADE NOT NULL,
  purchase_date timestamptz DEFAULT now(),
  price_paid numeric NOT NULL,
  payment_status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE course_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own purchases"
  ON course_purchases FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create purchases"
  ON course_purchases FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all purchases"
  ON course_purchases FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update purchases"
  ON course_purchases FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Academy Lessons Table
CREATE TABLE IF NOT EXISTS academy_lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES academy_courses(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  vimeo_url text NOT NULL,
  duration_minutes integer DEFAULT 0,
  order_position integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE academy_lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view lessons of purchased courses"
  ON academy_lessons FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM course_purchases
      WHERE course_purchases.course_id = academy_lessons.course_id
      AND course_purchases.user_id = auth.uid()
      AND course_purchases.payment_status = 'completed'
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage lessons"
  ON academy_lessons FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Dynamic Form Fields Table
CREATE TABLE IF NOT EXISTS dynamic_form_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_type text NOT NULL,
  field_name text NOT NULL,
  field_label text NOT NULL,
  field_type text NOT NULL,
  field_options jsonb DEFAULT '[]'::jsonb,
  is_required boolean DEFAULT false,
  order_position integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE dynamic_form_fields ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active form fields"
  ON dynamic_form_fields FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Admins can manage form fields"
  ON dynamic_form_fields FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_course_purchases_user_id ON course_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_course_purchases_course_id ON course_purchases(course_id);
CREATE INDEX IF NOT EXISTS idx_academy_lessons_course_id ON academy_lessons(course_id);
CREATE INDEX IF NOT EXISTS idx_dynamic_form_fields_form_type ON dynamic_form_fields(form_type);

-- Insert sample courses
INSERT INTO academy_courses (title, description, instructor, instrument, price, level, demo_video_url, thumbnail_url) VALUES
  (
    'Oud - Niveau Débutant',
    'Apprenez les bases du oud avec notre méthode complète. Ce cours couvre les techniques fondamentales, la posture, et les premiers morceaux traditionnels.',
    'Maître Ahmed El-Oud',
    'Oud',
    299.00,
    'beginner',
    'https://player.vimeo.com/video/123456789',
    'https://images.pexels.com/photos/7520697/pexels-photo-7520697.jpeg'
  ),
  (
    'Violon Oriental - Intermédiaire',
    'Perfectionnez votre technique du violon oriental avec des exercices avancés et des morceaux traditionnels.',
    'Professeur Sarah Benali',
    'Violon',
    349.00,
    'intermediate',
    'https://player.vimeo.com/video/123456790',
    'https://images.pexels.com/photos/7520698/pexels-photo-7520698.jpeg'
  ),
  (
    'Derbouka - Techniques Avancées',
    'Maîtrisez les rythmes complexes et les techniques professionnelles de la derbouka.',
    'Maître Karim Percussion',
    'Derbouka',
    199.00,
    'advanced',
    'https://player.vimeo.com/video/123456791',
    'https://images.pexels.com/photos/7520699/pexels-photo-7520699.jpeg'
  );
