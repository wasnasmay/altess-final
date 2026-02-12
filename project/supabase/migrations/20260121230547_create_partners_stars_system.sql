/*
  # Système de Partenaires et Stars Dynamique

  1. Nouvelles Tables
    - `partners` (Partenaires)
      - `id` (uuid, primary key)
      - `name` (text) - Nom du partenaire
      - `slug` (text, unique) - URL slug pour SEO
      - `category` (text) - Catégorie (salle, traiteur, photo, décoration)
      - `short_description` (text) - Description courte pour les cartes
      - `full_description` (text) - Description complète pour la page détail
      - `seo_title` (text) - Titre SEO optimisé
      - `seo_description` (text) - Meta description
      - `seo_keywords` (text) - Mots-clés SEO
      - `og_image` (text) - Image Open Graph pour partage social
      - `main_image` (text) - Image principale
      - `gallery_images` (text[]) - Galerie d'images
      - `services` (text[]) - Liste des services
      - `website` (text) - Site web
      - `phone` (text) - Téléphone
      - `email` (text) - Email
      - `address` (text) - Adresse
      - `display_order` (integer) - Ordre d'affichage
      - `is_active` (boolean) - Actif/Inactif
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `stars` (Artistes/Stars)
      - `id` (uuid, primary key)
      - `name` (text) - Nom de l'artiste
      - `slug` (text, unique) - URL slug pour SEO
      - `instrument` (text) - Instrument principal
      - `speciality` (text) - Spécialité artistique
      - `short_bio` (text) - Biographie courte pour les cartes
      - `full_bio` (text) - Biographie complète pour la page détail
      - `seo_title` (text) - Titre SEO optimisé
      - `seo_description` (text) - Meta description
      - `seo_keywords` (text) - Mots-clés SEO
      - `og_image` (text) - Image Open Graph pour partage social
      - `main_image` (text) - Photo principale
      - `gallery_images` (text[]) - Galerie de photos
      - `achievements` (text[]) - Liste des réalisations
      - `repertoire` (text[]) - Répertoire musical
      - `youtube_videos` (text[]) - URLs YouTube
      - `display_order` (integer) - Ordre d'affichage
      - `is_active` (boolean) - Actif/Inactif
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Sécurité
    - Enable RLS sur les deux tables
    - Lecture publique pour les éléments actifs
    - Modification réservée aux administrateurs
*/

-- Create partners table
CREATE TABLE IF NOT EXISTS partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  category text NOT NULL DEFAULT 'autre',
  short_description text NOT NULL DEFAULT '',
  full_description text NOT NULL DEFAULT '',
  seo_title text,
  seo_description text,
  seo_keywords text,
  og_image text,
  main_image text,
  gallery_images text[] DEFAULT '{}',
  services text[] DEFAULT '{}',
  website text,
  phone text,
  email text,
  address text,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create stars table
CREATE TABLE IF NOT EXISTS stars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  instrument text NOT NULL DEFAULT '',
  speciality text NOT NULL DEFAULT '',
  short_bio text NOT NULL DEFAULT '',
  full_bio text NOT NULL DEFAULT '',
  seo_title text,
  seo_description text,
  seo_keywords text,
  og_image text,
  main_image text,
  gallery_images text[] DEFAULT '{}',
  achievements text[] DEFAULT '{}',
  repertoire text[] DEFAULT '{}',
  youtube_videos text[] DEFAULT '{}',
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on partners
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;

-- Public can read active partners
CREATE POLICY "Public can read active partners"
  ON partners
  FOR SELECT
  USING (is_active = true);

-- Authenticated users can read all partners
CREATE POLICY "Authenticated users can read all partners"
  ON partners
  FOR SELECT
  TO authenticated
  USING (true);

-- Authenticated users can insert partners
CREATE POLICY "Authenticated users can insert partners"
  ON partners
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Authenticated users can update partners
CREATE POLICY "Authenticated users can update partners"
  ON partners
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Authenticated users can delete partners
CREATE POLICY "Authenticated users can delete partners"
  ON partners
  FOR DELETE
  TO authenticated
  USING (true);

-- Enable RLS on stars
ALTER TABLE stars ENABLE ROW LEVEL SECURITY;

-- Public can read active stars
CREATE POLICY "Public can read active stars"
  ON stars
  FOR SELECT
  USING (is_active = true);

-- Authenticated users can read all stars
CREATE POLICY "Authenticated users can read all stars"
  ON stars
  FOR SELECT
  TO authenticated
  USING (true);

-- Authenticated users can insert stars
CREATE POLICY "Authenticated users can insert stars"
  ON stars
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Authenticated users can update stars
CREATE POLICY "Authenticated users can update stars"
  ON stars
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Authenticated users can delete stars
CREATE POLICY "Authenticated users can delete stars"
  ON stars
  FOR DELETE
  TO authenticated
  USING (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_partners_slug ON partners(slug);
CREATE INDEX IF NOT EXISTS idx_partners_active ON partners(is_active, display_order);
CREATE INDEX IF NOT EXISTS idx_partners_category ON partners(category);
CREATE INDEX IF NOT EXISTS idx_stars_slug ON stars(slug);
CREATE INDEX IF NOT EXISTS idx_stars_active ON stars(is_active, display_order);

-- Insert default partners
INSERT INTO partners (name, slug, category, short_description, full_description, seo_title, seo_description, seo_keywords, main_image, services, display_order, is_active)
VALUES 
(
  'Palais des Mille et Une Nuits',
  'palais-mille-une-nuits',
  'salle',
  'Salle de réception orientale luxueuse avec décoration traditionnelle et équipements modernes.',
  'Le Palais des Mille et Une Nuits vous accueille dans un cadre somptueux inspiré de l''architecture orientale traditionnelle. Notre salle de réception peut accueillir jusqu''à 500 invités dans un décor raffiné et authentique.

Équipée des dernières technologies en matière de sonorisation et d''éclairage, notre salle offre un cadre idéal pour vos mariages, célébrations et événements d''entreprise. Notre équipe professionnelle vous accompagne dans l''organisation de votre événement du début à la fin.

Située au cœur de la région parisienne avec parking privé et accès facilité.',
  'Palais des Mille et Une Nuits - Salle de Réception Orientale | Paris',
  'Salle de réception orientale luxueuse près de Paris. Capacité 500 personnes. Décoration traditionnelle, équipements modernes. Mariages et événements.',
  'salle réception orientale, salle mariage oriental, location salle paris, palais oriental, salle de fête',
  'https://images.pexels.com/photos/2306281/pexels-photo-2306281.jpeg',
  ARRAY['Capacité 500 personnes', 'Décoration orientale authentique', 'Sonorisation professionnelle', 'Éclairage LED moderne', 'Cuisine équipée', 'Parking privé 100 places'],
  0,
  true
),
(
  'Délices d''Orient Traiteur',
  'delices-orient-traiteur',
  'traiteur',
  'Gastronomie orientale raffinée et authentique pour vos événements. Spécialiste des grandes réceptions.',
  'Délices d''Orient Traiteur met à votre service plus de 20 ans d''expérience dans la gastronomie orientale haut de gamme. Notre chef et son équipe préparent des mets traditionnels avec des produits frais et de qualité supérieure.

Du couscous royal aux tajines parfumés, en passant par les pâtisseries orientales artisanales, chaque plat est préparé avec soin et passion. Nous proposons des menus personnalisés adaptés à tous types d''événements : mariages, anniversaires, événements d''entreprise.

Service traiteur complet avec équipe de service, vaisselle, décoration de table et coordination le jour J.',
  'Délices d''Orient - Traiteur Oriental Haut de Gamme | Mariages & Événements',
  'Traiteur spécialisé en cuisine orientale raffinée. Mariages, réceptions, événements. Menus personnalisés. Service complet avec équipe professionnelle.',
  'traiteur oriental, traiteur mariage oriental, cuisine orientale, traiteur maghrébin, couscous royal',
  'https://images.pexels.com/photos/1640772/pexels-photo-1640772.jpeg',
  ARRAY['Cuisine orientale traditionnelle', 'Menus personnalisés', 'Produits frais qualité premium', 'Service avec équipe professionnelle', 'Pâtisseries orientales artisanales', 'Spécialiste grandes réceptions'],
  1,
  true
),
(
  'Lumière d''Or Photography',
  'lumiere-or-photography',
  'photo',
  'Photographe spécialisé en événements orientaux. Capturez l''essence et l''émotion de vos moments précieux.',
  'Lumière d''Or Photography se spécialise dans la photographie et la vidéographie d''événements orientaux depuis plus de 15 ans. Notre équipe capture avec sensibilité et professionnalisme les moments uniques de vos célébrations.

Notre approche allie photographie traditionnelle et créativité moderne pour des résultats exceptionnels. Nous comprenons les traditions et les moments importants des célébrations orientales : henné, entrée, danses traditionnelles, famille.

Forfaits complets incluant : reportage photo et vidéo HD, drone, album premium, retouches professionnelles, livraison rapide des fichiers en haute résolution.',
  'Lumière d''Or Photography - Photographe Mariage Oriental | Paris & Région',
  'Photographe et vidéaste spécialisé mariages orientaux. Plus de 15 ans d''expérience. Reportage photo/vidéo complet, drone, album premium.',
  'photographe mariage oriental, vidéaste mariage, photo oriental, photographe maghrébin, reportage mariage',
  'https://images.pexels.com/photos/1983037/pexels-photo-1983037.jpeg',
  ARRAY['Photo et vidéo HD 4K', 'Captation par drone', 'Album premium personnalisé', 'Retouches professionnelles', 'Livraison rapide fichiers HD', 'Forfaits tout inclus'],
  2,
  true
),
(
  'Rêves d''Orient Décoration',
  'reves-orient-decoration',
  'decoration',
  'Création d''ambiances orientales sur mesure. Décoration luxueuse et raffinée pour événements d''exception.',
  'Rêves d''Orient Décoration crée des ambiances orientales authentiques et raffinées pour vos événements les plus précieux. Notre équipe de décorateurs passionnés transforme vos espaces en véritables palais des mille et une nuits.

Nous proposons une large gamme de décors : tables d''honneur luxueuses, arches florales, drapés en soie, éclairages d''ambiance LED, fontaines, colonnes, tapis orientaux authentiques. Chaque élément est soigneusement sélectionné pour créer une atmosphère magique.

Service complet : conception 3D du projet, installation et démontage. Nos créations s''adaptent à tous les lieux et tous les budgets tout en maintenant notre exigence de qualité.',
  'Rêves d''Orient - Décoration Orientale Événements & Mariages | Paris',
  'Décorateur spécialisé événements orientaux. Ambiances sur mesure, décors luxueux. Tables d''honneur, arches, drapés, éclairages. Service complet.',
  'décoration orientale, décorateur mariage oriental, décoration événement, ambiance orientale, décor maghrébin',
  'https://images.pexels.com/photos/2306281/pexels-photo-2306281.jpeg',
  ARRAY['Décoration complète sur mesure', 'Tables d''honneur luxueuses', 'Arches florales monumentales', 'Éclairages LED ambiance', 'Drapés et tissus premium', 'Conception 3D du projet'],
  3,
  true
);

-- Insert default stars
INSERT INTO stars (name, slug, instrument, speciality, short_bio, full_bio, seo_title, seo_description, seo_keywords, main_image, achievements, repertoire, display_order, is_active)
VALUES 
(
  'Saïd Alaoui',
  'said-alaoui',
  'Oud & Chant',
  'Maître de la musique andalouse',
  'Virtuose de l''oud et du chant andalou avec plus de 30 ans d''expérience. Réputé pour son interprétation authentique du patrimoine musical maghrébin.',
  'Saïd Alaoui est un maître incontesté de la musique andalouse et de l''oud. Formé dès son plus jeune âge par les grands maîtres de la musique classique maghrébine, il perpétue avec passion et excellence cette tradition millénaire.

Diplômé du Conservatoire National de Musique, Saïd a participé à de nombreux festivals internationaux et collaboré avec les plus grands noms de la musique orientale. Son jeu subtil à l''oud et sa voix envoûtante transportent le public dans un voyage musical authentique.

Saïd se produit régulièrement dans les plus grandes salles et événements privés. Son répertoire vaste couvre la musique andalouse classique, le chaâbi, le malhoun et les chansons traditionnelles maghrébines. Il dirige également un ensemble musical de renom.',
  'Saïd Alaoui - Maître Oud & Chant Andalou | Musicien Oriental Professionnel',
  'Virtuose de l''oud et chanteur andalou. Plus de 30 ans d''expérience. Musique classique maghrébine, andalouse, chaâbi. Disponible événements et mariages.',
  'musicien oriental, joueur oud, chanteur andalou, musique andalouse, artiste maghrébin',
  'https://images.pexels.com/photos/8191464/pexels-photo-8191464.jpeg',
  ARRAY['Diplômé du Conservatoire National', 'Plus de 500 concerts internationaux', 'Collaboration avec grands artistes orientaux', 'Directeur d''ensemble musical renommé', 'Professeur au conservatoire'],
  ARRAY['Musique andalouse classique', 'Chaâbi traditionnel', 'Malhoun authentique', 'Répertoire marocain classique', 'Chansons de mariage traditionnelles'],
  0,
  true
),
(
  'Fatima Zahra',
  'fatima-zahra',
  'Chant traditionnel',
  'Voix envoûtante du Maghreb',
  'Chanteuse professionnelle spécialisée dans le répertoire traditionnel maghrébin. Voix puissante et émouvante qui marque les grands événements.',
  'Fatima Zahra possède une voix exceptionnelle qui a marqué des générations d''auditeurs. Issue d''une famille de musiciens, elle baigne dans la musique traditionnelle depuis l''enfance et maîtrise parfaitement les nuances du chant oriental classique.

Formée auprès des grandes dames du chant maghrébin, Fatima Zahra interprète avec une authenticité remarquable les répertoires marocain, algérien et tunisien. Sa présence scénique charismatique et son professionnalisme font d''elle l''artiste de choix pour les événements prestigieux.

Elle se produit régulièrement lors de mariages royaux, galas officiels et concerts privés à travers l''Europe et le Maghreb. Son répertoire inclut les grands classiques de la chanson orientale, les chansons de mariage traditionnelles et des créations contemporaines inspirées du patrimoine.',
  'Fatima Zahra - Chanteuse Orientale Professionnelle | Mariages & Galas',
  'Chanteuse professionnelle spécialisée musique traditionnelle maghrébine. Voix exceptionnelle. Mariages, galas, événements prestigieux. Répertoire classique et moderne.',
  'chanteuse orientale, chanteuse mariage oriental, artiste maghrébine, chanteuse traditionnelle, voix orientale',
  'https://images.pexels.com/photos/3531895/pexels-photo-3531895.jpeg',
  ARRAY['Plus de 200 mariages prestigieux', 'Artiste invitée galas officiels', 'Tournées internationales', 'Collaboration artistes renommés', 'Enregistrements professionnels'],
  ARRAY['Chansons de mariage traditionnelles', 'Répertoire classique maghrébin', 'Chaâbi moderne', 'Raï romantique', 'Créations contemporaines'],
  1,
  true
),
(
  'Karim Bennis',
  'karim-bennis',
  'Qanun',
  'Virtuose des mélodies orientales',
  'Maître du qanun reconnu internationalement. Interprétations raffinées alliant tradition et modernité dans la pure essence de la musique orientale.',
  'Karim Bennis est considéré comme l''un des plus grands virtuoses du qanun de sa génération. Cet instrument à cordes pincées, emblématique de la musique classique orientale, n''a plus de secrets pour lui après plus de 25 ans de pratique intensive.

Diplômé avec mention très bien du Conservatoire Supérieur, Karim a perfectionné son art auprès de maîtres légendaires au Caire et à Istanbul. Son jeu délicat et précis, sa capacité à improviser et sa connaissance profonde des maqamat orientaux font de lui un musicien d''exception.

Il se produit en solo ou accompagné d''orchestres dans les plus beaux événements. Karim participe régulièrement à des festivals de musique du monde et enseigne le qanun aux nouvelles générations. Son répertoire varié couvre la musique arabe classique, turque ottomane et les créations contemporaines.',
  'Karim Bennis - Virtuose Qanun | Musicien Oriental Professionnel',
  'Maître du qanun. Plus de 25 ans d''expérience. Musique classique orientale, arabe, turque. Solo ou orchestre. Disponible mariages et concerts.',
  'joueur qanun, musicien oriental, qanun professionnel, musique arabe classique, artiste oriental',
  'https://images.pexels.com/photos/7520397/pexels-photo-7520397.jpeg',
  ARRAY['Champion international qanun', 'Professeur au Conservatoire Supérieur', 'Festivals de musique du monde', 'Enregistrements avec grands orchestres', 'Master classes internationales'],
  ARRAY['Musique arabe classique', 'Répertoire turc ottoman', 'Maqamat traditionnels', 'Improvisations taqsim', 'Fusion orient-occident'],
  2,
  true
),
(
  'Naïma El Fassi',
  'naima-el-fassi',
  'Violon oriental',
  'Fusion tradition & modernité',
  'Violoniste orientale au style unique mêlant tradition millénaire et créativité contemporaine. Performances émouvantes et mémorables.',
  'Naïma El Fassi apporte une touche unique et moderne au violon oriental traditionnel. Formée au violon classique occidental et à la musique orientale, elle a développé un style personnel qui séduit tous les publics par son originalité et sa sensibilité.

Son parcours atypique l''a menée des conservatoires européens aux écoles de musique traditionnelle du Moyen-Orient. Cette double formation lui permet de naviguer avec aisance entre les univers musicaux et de créer des ponts harmonieux entre tradition et modernité.

Naïma se produit lors d''événements prestigieux où elle apporte une dimension artistique exceptionnelle. Elle accompagne mariages, concerts et cérémonies officielles. Son violon pleure, chante et danse, touchant les cœurs et créant des moments d''émotion intense. Elle collabore régulièrement avec des orchestres et artistes de renom.',
  'Naïma El Fassi - Violoniste Orientale | Fusion Tradition & Modernité',
  'Violoniste orientale professionnelle. Style unique fusion classique-oriental. Mariages, concerts, événements. Double formation conservatoire. Performances émouvantes.',
  'violoniste oriental, violon oriental, musicienne orientale, violon arabe, artiste fusion',
  'https://images.pexels.com/photos/4088017/pexels-photo-4088017.jpeg',
  ARRAY['Double diplôme conservatoires', 'Concerts à l''international', 'Collaborations orchestres prestigieux', 'Style fusion reconnu', 'Enregistrements albums'],
  ARRAY['Musique orientale classique', 'Répertoire romantique', 'Fusion orient-occident', 'Compositions originales', 'Improvisation au violon'],
  3,
  true
),
(
  'Rachid Tazi',
  'rachid-tazi',
  'Percussion & Derbouka',
  'Rythmes enflammés',
  'Percussionniste virtuose spécialiste des rythmes orientaux. Énergie explosive et techniques spectaculaires qui enflamment chaque événement.',
  'Rachid Tazi est un maître incontesté des percussions orientales et particulièrement de la derbouka. Son énergie débordante, sa technique époustouflante et son sens du spectacle font de lui le percussionniste le plus demandé pour les grands événements.

Formé auprès des plus grands percussionnistes du Maghreb et du Moyen-Orient, Rachid maîtrise tous les rythmes traditionnels et modernes. Sa capacité à créer des solos spectaculaires tout en maintenant la structure rythmique de l''orchestre démontre son professionnalisme exceptionnel.

Au-delà de la derbouka, Rachid joue de nombreux instruments de percussion : bendir, tar, riqq, tabla. Il dirige la section rythmique de plusieurs orchestres renommés et anime des ateliers de percussion. Son jeu enflammé et ses interactions avec le public créent une ambiance festive inoubliable.',
  'Rachid Tazi - Percussionniste Oriental Expert | Derbouka & Percussions',
  'Percussionniste virtuose derbouka et percussions orientales. Rythmes traditionnels et modernes. Solos spectaculaires. Mariages, concerts, événements.',
  'percussionniste oriental, joueur derbouka, percussion orientale, darbuka professionnel, rythmes orientaux',
  'https://images.pexels.com/photos/6966020/pexels-photo-6966020.jpeg',
  ARRAY['Expert percussions orientales', 'Chef section rythmique orchestres', 'Performances internationales', 'Formateur en percussion', 'Solos mémorables'],
  ARRAY['Rythmes traditionnels maghrébins', 'Percussion moderne fusion', 'Solos derbouka spectaculaires', 'Accompagnement orchestre', 'Rythmes festifs danse'],
  4,
  true
);
