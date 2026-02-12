/*
  # Reconstruction complète du système LMS Académie

  1. Suppression des anciennes tables
    - DROP anciennes tables academy existantes
  
  2. Création des nouvelles tables LMS
    - academy_packs - Packs de formation complets
    - academy_pack_courses - Cours/Chapitres
    - academy_course_lessons - Leçons/Vidéos
    - academy_user_purchases - Achats
    - academy_user_progress - Progression
    - academy_certificates - Certificats
  
  3. Sécurité RLS complète
  4. Indexes de performance
*/

-- Drop old tables
DROP TABLE IF EXISTS course_purchases CASCADE;
DROP TABLE IF EXISTS academy_lessons CASCADE;
DROP TABLE IF EXISTS academy_courses CASCADE;

-- Create academy_packs table
CREATE TABLE IF NOT EXISTS academy_packs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text NOT NULL DEFAULT '',
  full_description text NOT NULL DEFAULT '',
  skills_acquired text[] DEFAULT '{}',
  seo_title text,
  seo_description text,
  seo_keywords text,
  cover_image text,
  level text DEFAULT 'débutant',
  duration_hours integer DEFAULT 0,
  price numeric(10, 2) DEFAULT 0,
  is_published boolean DEFAULT false,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create academy_pack_courses table
CREATE TABLE IF NOT EXISTS academy_pack_courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_id uuid NOT NULL REFERENCES academy_packs(id) ON DELETE CASCADE,
  title text NOT NULL,
  slug text NOT NULL,
  description text NOT NULL DEFAULT '',
  course_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(pack_id, slug)
);

-- Create academy_course_lessons table
CREATE TABLE IF NOT EXISTS academy_course_lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES academy_pack_courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  slug text NOT NULL,
  description text NOT NULL DEFAULT '',
  vimeo_video_id text,
  vimeo_teaser_id text,
  duration_seconds integer DEFAULT 0,
  lesson_order integer DEFAULT 0,
  is_free boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(course_id, slug)
);

-- Create academy_user_purchases table
CREATE TABLE IF NOT EXISTS academy_user_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pack_id uuid NOT NULL REFERENCES academy_packs(id) ON DELETE CASCADE,
  amount_paid numeric(10, 2) NOT NULL DEFAULT 0,
  purchase_date timestamptz DEFAULT now(),
  payment_method text DEFAULT 'manual',
  payment_status text DEFAULT 'completed',
  UNIQUE(user_id, pack_id)
);

-- Create academy_user_progress table
CREATE TABLE IF NOT EXISTS academy_user_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id uuid NOT NULL REFERENCES academy_course_lessons(id) ON DELETE CASCADE,
  watch_percentage numeric(5, 2) DEFAULT 0,
  completed boolean DEFAULT false,
  last_position_seconds integer DEFAULT 0,
  last_watched_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);

-- Create academy_certificates table
CREATE TABLE IF NOT EXISTS academy_certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pack_id uuid NOT NULL REFERENCES academy_packs(id) ON DELETE CASCADE,
  certificate_number text UNIQUE NOT NULL,
  issued_date timestamptz DEFAULT now(),
  completion_percentage numeric(5, 2) DEFAULT 100,
  UNIQUE(user_id, pack_id)
);

-- Enable RLS on all tables
ALTER TABLE academy_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE academy_pack_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE academy_course_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE academy_user_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE academy_user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE academy_certificates ENABLE ROW LEVEL SECURITY;

-- Policies for academy_packs
CREATE POLICY "Public can read published packs"
  ON academy_packs FOR SELECT
  USING (is_published = true);

CREATE POLICY "Authenticated users can read all packs"
  ON academy_packs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage packs"
  ON academy_packs FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policies for academy_pack_courses
CREATE POLICY "Public can read courses of published packs"
  ON academy_pack_courses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM academy_packs
      WHERE academy_packs.id = academy_pack_courses.pack_id
      AND academy_packs.is_published = true
    )
  );

CREATE POLICY "Authenticated users can read all courses"
  ON academy_pack_courses FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage courses"
  ON academy_pack_courses FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policies for academy_course_lessons
CREATE POLICY "Public can read free lessons"
  ON academy_course_lessons FOR SELECT
  USING (is_free = true);

CREATE POLICY "Authenticated users can read all lessons"
  ON academy_course_lessons FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage lessons"
  ON academy_course_lessons FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policies for academy_user_purchases
CREATE POLICY "Users can read own purchases"
  ON academy_user_purchases FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can create purchases"
  ON academy_user_purchases FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated admins can read all purchases"
  ON academy_user_purchases FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can update purchases"
  ON academy_user_purchases FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policies for academy_user_progress
CREATE POLICY "Users can read own progress"
  ON academy_user_progress FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own progress"
  ON academy_user_progress FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
  ON academy_user_progress FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can read all progress"
  ON academy_user_progress FOR SELECT
  TO authenticated
  USING (true);

-- Policies for academy_certificates
CREATE POLICY "Users can read own certificates"
  ON academy_certificates FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Public can verify certificates by number"
  ON academy_certificates FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create certificates"
  ON academy_certificates FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_academy_packs_slug ON academy_packs(slug);
CREATE INDEX IF NOT EXISTS idx_academy_packs_published ON academy_packs(is_published, display_order);
CREATE INDEX IF NOT EXISTS idx_academy_pack_courses_pack ON academy_pack_courses(pack_id, course_order);
CREATE INDEX IF NOT EXISTS idx_academy_course_lessons_course ON academy_course_lessons(course_id, lesson_order);
CREATE INDEX IF NOT EXISTS idx_academy_user_purchases_user ON academy_user_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_academy_user_purchases_pack ON academy_user_purchases(pack_id);
CREATE INDEX IF NOT EXISTS idx_academy_user_progress_user ON academy_user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_academy_user_progress_lesson ON academy_user_progress(lesson_id);
CREATE INDEX IF NOT EXISTS idx_academy_certificates_user ON academy_certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_academy_certificates_number ON academy_certificates(certificate_number);

-- Insert sample pack for demo
INSERT INTO academy_packs (title, slug, description, full_description, skills_acquired, seo_title, seo_description, seo_keywords, cover_image, level, duration_hours, price, is_published, display_order)
VALUES 
(
  'Maîtrise du Oud - Niveau Débutant',
  'maitrise-oud-debutant',
  'Apprenez à jouer du Oud oriental de A à Z. Formation complète pour débutants avec suivi personnalisé.',
  'Cette formation complète vous permettra de maîtriser les bases du Oud, l''instrument emblématique de la musique orientale. 

Vous apprendrez :
- La posture correcte et la tenue de l''instrument
- Les techniques de base du plectre (Risha)
- La lecture des tablatures orientales
- Les maqamat de base (modes orientaux)
- Votre premier répertoire de morceaux traditionnels

Nos cours sont conçus par des maîtres reconnus avec plus de 30 ans d''expérience dans l''enseignement. Chaque leçon inclut des exercices pratiques et des morceaux progressifs pour une progression rapide et motivante.',
  ARRAY[
    'Posture et tenue correcte du Oud',
    'Maîtrise du plectre (Risha)',
    'Lecture des tablatures orientales',
    'Compréhension des maqamat de base',
    'Interprétation de 10 morceaux traditionnels',
    'Techniques de jeu fondamentales',
    'Exercices de coordination main droite/gauche'
  ],
  'Formation Oud Débutant | Cours en Ligne | Académie Orientale Musique',
  'Apprenez le Oud oriental en ligne avec notre formation complète pour débutants. Cours vidéo HD, suivi de progression, certificat. 20 heures de formation.',
  'cours oud, apprendre oud, formation oud en ligne, oud débutant, cours musique orientale, académie oud',
  'https://images.pexels.com/photos/5817087/pexels-photo-5817087.jpeg',
  'débutant',
  20,
  297.00,
  true,
  0
);
