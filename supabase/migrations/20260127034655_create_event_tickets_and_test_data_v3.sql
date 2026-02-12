/*
  # Système de Tickets avec QR Code et Données de Test

  ## 1. Nouvelle Table: event_tickets
  
  Table pour les tickets individuels générés avec QR codes scannables.
  
  ### Colonnes:
  - `id` (uuid, PK) - Identifiant unique du ticket
  - `booking_id` (uuid, FK) - Lien vers la réservation
  - `event_id` (uuid, FK) - Lien vers l'événement
  - `customer_id` (uuid, FK) - Propriétaire du ticket
  - `customer_name` (text) - Nom du client
  - `customer_email` (text) - Email du client
  - `ticket_category` (text) - Catégorie du billet (VIP, Standard, etc.)
  - `ticket_number` (text) - Numéro unique du ticket
  - `qr_code_data` (text) - Données encodées dans le QR code
  - `price` (numeric) - Prix du ticket
  - `is_scanned` (boolean) - Ticket scanné/utilisé
  - `scanned_at` (timestamptz) - Date et heure du scan
  - `scanned_by` (uuid, FK) - Utilisateur qui a scanné
  - `created_at` (timestamptz)

  ## 2. Données de Test
  
  Création de 3 événements de démonstration :
  1. Concert de Oud Oriental - Soirée musicale traditionnelle
  2. Stage de Danse Orientale - Workshop intensif
  3. Dîner-Spectacle Méditerranéen - Soirée gastronomique

  Chaque événement inclut :
  - Catégories de billets (VIP et Standard)
  - Quotas et prix
  - Images et descriptions
  - Plans de salle simplifiés
  - Dates futures

  ## 3. Sécurité RLS
  - Clients peuvent voir leurs propres tickets
  - Organisateurs peuvent voir et scanner les tickets de leurs événements
  - Admins ont accès complet
*/

-- =====================================================
-- TABLE: event_tickets
-- =====================================================

CREATE TABLE IF NOT EXISTS event_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Références
  booking_id uuid REFERENCES event_bookings(id) ON DELETE CASCADE,
  event_id uuid REFERENCES public_events(id) ON DELETE CASCADE NOT NULL,
  customer_id uuid REFERENCES auth.users(id),
  
  -- Informations client
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  
  -- Détails du ticket
  ticket_category text NOT NULL,
  ticket_number text UNIQUE NOT NULL,
  qr_code_data text UNIQUE NOT NULL,
  price numeric(10,2) NOT NULL,
  
  -- Statut de scan
  is_scanned boolean DEFAULT false,
  scanned_at timestamptz,
  scanned_by uuid REFERENCES auth.users(id),
  
  -- Metadata
  created_at timestamptz DEFAULT now()
);

-- Indexes pour performance
CREATE INDEX IF NOT EXISTS idx_event_tickets_event ON event_tickets(event_id);
CREATE INDEX IF NOT EXISTS idx_event_tickets_booking ON event_tickets(booking_id);
CREATE INDEX IF NOT EXISTS idx_event_tickets_customer ON event_tickets(customer_id);
CREATE INDEX IF NOT EXISTS idx_event_tickets_qr ON event_tickets(qr_code_data);
CREATE INDEX IF NOT EXISTS idx_event_tickets_number ON event_tickets(ticket_number);
CREATE INDEX IF NOT EXISTS idx_event_tickets_scanned ON event_tickets(is_scanned);

-- RLS
ALTER TABLE event_tickets ENABLE ROW LEVEL SECURITY;

-- Clients peuvent voir leurs propres tickets
CREATE POLICY "Users can read own tickets"
  ON event_tickets FOR SELECT
  TO authenticated
  USING (customer_id = auth.uid());

-- Organisateurs peuvent voir les tickets de leurs événements
CREATE POLICY "Organizers can read event tickets"
  ON event_tickets FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public_events 
      WHERE id = event_tickets.event_id 
      AND (organizer_id = auth.uid() OR created_by = auth.uid())
    )
  );

-- Organisateurs peuvent scanner (update) les tickets de leurs événements
CREATE POLICY "Organizers can scan event tickets"
  ON event_tickets FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public_events 
      WHERE id = event_tickets.event_id 
      AND (organizer_id = auth.uid() OR created_by = auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public_events 
      WHERE id = event_tickets.event_id 
      AND (organizer_id = auth.uid() OR created_by = auth.uid())
    )
  );

-- Admins peuvent tout faire
CREATE POLICY "Admins can manage all tickets"
  ON event_tickets FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Système peut créer des tickets
CREATE POLICY "Authenticated users can create tickets"
  ON event_tickets FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- =====================================================
-- FUNCTION: Générer un numéro de ticket unique
-- =====================================================

CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS text AS $$
DECLARE
  ticket_num text;
  exists boolean;
BEGIN
  LOOP
    ticket_num := 'TK-' || upper(substring(md5(random()::text) from 1 for 10));
    SELECT EXISTS(SELECT 1 FROM event_tickets WHERE ticket_number = ticket_num) INTO exists;
    EXIT WHEN NOT exists;
  END LOOP;
  RETURN ticket_num;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- DONNÉES DE TEST: 3 Événements de Démonstration
-- =====================================================

-- Événement 1: Concert de Oud Oriental
INSERT INTO public_events (
  title,
  slug,
  event_type,
  short_description,
  full_description,
  event_date,
  event_time,
  venue_name,
  venue_address,
  city,
  main_image,
  seating_plan_image,
  ticket_categories,
  total_quota,
  tickets_sold,
  price_info,
  is_featured,
  is_active,
  status,
  min_tickets_per_order,
  max_tickets_per_order,
  is_auto_accept,
  cancellation_policy,
  is_free,
  tags
) VALUES (
  'Concert de Oud Oriental - Soirée Traditionnelle',
  'concert-oud-oriental',
  'concert',
  'Soirée musicale traditionnelle avec un maître du Oud. Ambiance intimiste et authentique.',
  'Plongez dans l''univers envoûtant de la musique orientale avec notre concert de Oud exceptionnel. Un virtuose reconnu internationalement vous transportera à travers les mélodies traditionnelles du Moyen-Orient et du Maghreb. Une soirée inoubliable dans une ambiance intimiste et chaleureuse.

Programme:
- Ouverture avec des compositions classiques
- Improvisations sur des thèmes traditionnels
- Intermède avec thé à la menthe et pâtisseries orientales
- Suite du concert avec des pièces modernes

La soirée se déroulera dans notre salle de concert acoustique de 200 places, offrant une expérience sonore optimale. Un bar à boissons orientales sera disponible.',
  (NOW() + INTERVAL '45 days')::date,
  '20:30:00',
  'Salle de Concert Al-Andalus',
  '25 Rue des Arts, 75008 Paris',
  'Paris',
  'https://images.pexels.com/photos/7520391/pexels-photo-7520391.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/2747449/pexels-photo-2747449.jpeg?auto=compress&cs=tinysrgb&w=600',
  '[
    {"name": "VIP", "price": 45, "quota": 50, "sold": 12, "description": "Places aux premiers rangs + rencontre avec l''artiste + boissons incluses"},
    {"name": "Standard", "price": 25, "quota": 150, "sold": 38, "description": "Places assises numérotées"}
  ]'::jsonb,
  200,
  50,
  'À partir de 25€',
  true,
  true,
  'upcoming',
  1,
  8,
  true,
  'Remboursement intégral jusqu''à 7 jours avant l''événement. Après ce délai, les billets ne sont ni remboursables ni échangeables.',
  false,
  ARRAY['musique', 'concert', 'oud', 'oriental', 'tradition']
)
ON CONFLICT (slug) DO NOTHING;

-- Événement 2: Stage de Danse Orientale
INSERT INTO public_events (
  title,
  slug,
  event_type,
  short_description,
  full_description,
  event_date,
  event_time,
  venue_name,
  venue_address,
  city,
  main_image,
  seating_plan_image,
  ticket_categories,
  total_quota,
  tickets_sold,
  price_info,
  is_featured,
  is_active,
  status,
  min_tickets_per_order,
  max_tickets_per_order,
  is_auto_accept,
  cancellation_policy,
  is_free,
  tags
) VALUES (
  'Stage Intensif de Danse Orientale - Weekend Complet',
  'stage-danse-orientale',
  'atelier',
  'Workshop intensif de danse orientale sur 2 jours avec une professionnelle. Tous niveaux.',
  'Rejoignez-nous pour un weekend intensif de danse orientale avec une danseuse professionnelle reconnue. Ce stage s''adresse à tous les niveaux, du débutant au confirmé.

Programme du Weekend:
Samedi:
- 10h-12h: Échauffement et techniques de base
- 12h-13h: Pause déjeuner (repas oriental offert pour VIP)
- 13h-15h: Chorégraphie niveau débutant
- 15h30-17h30: Chorégraphie niveau intermédiaire/avancé

Dimanche:
- 10h-12h: Travail du voile et accessoires
- 12h-13h: Pause déjeuner
- 13h-15h: Improvisation et expression corporelle
- 15h30-17h: Spectacle final et remise des certificats

Inclus:
- Cours et ateliers
- Support vidéo des chorégraphies
- Certificat de participation
- Rafraîchissements tout au long de la journée

Places limitées pour garantir un suivi personnalisé!',
  (NOW() + INTERVAL '30 days')::date,
  '10:00:00',
  'Studio de Danse Sheherazade',
  '12 Avenue de la Danse, 69003 Lyon',
  'Lyon',
  'https://images.pexels.com/photos/3807386/pexels-photo-3807386.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/6339656/pexels-photo-6339656.jpeg?auto=compress&cs=tinysrgb&w=600',
  '[
    {"name": "VIP", "price": 180, "quota": 15, "sold": 8, "description": "Groupe restreint de 15 personnes + déjeuners inclus + séance photo professionnelle + rencontre privée"},
    {"name": "Standard", "price": 120, "quota": 35, "sold": 22, "description": "Accès complet au stage"}
  ]'::jsonb,
  50,
  30,
  'À partir de 120€',
  true,
  true,
  'upcoming',
  1,
  3,
  true,
  'Remboursement à 50% jusqu''à 14 jours avant l''événement. Aucun remboursement après ce délai, mais possibilité de céder sa place.',
  false,
  ARRAY['danse', 'workshop', 'oriental', 'formation', 'stage']
)
ON CONFLICT (slug) DO NOTHING;

-- Événement 3: Dîner-Spectacle Méditerranéen
INSERT INTO public_events (
  title,
  slug,
  event_type,
  short_description,
  full_description,
  event_date,
  event_time,
  venue_name,
  venue_address,
  city,
  main_image,
  seating_plan_image,
  ticket_categories,
  total_quota,
  tickets_sold,
  price_info,
  is_featured,
  is_active,
  status,
  min_tickets_per_order,
  max_tickets_per_order,
  is_auto_accept,
  cancellation_policy,
  is_free,
  tags
) VALUES (
  'Dîner-Spectacle Méditerranéen - Voyage Culinaire et Musical',
  'diner-spectacle-mediterraneen',
  'spectacle',
  'Soirée gastronomique avec spectacles vivants. Cuisine méditerranéenne et ambiance festive.',
  'Embarquez pour un voyage sensoriel unique alliant gastronomie méditerranéenne et spectacles vivants. Une soirée d''exception où se mêlent saveurs, musiques et danses des pays du pourtour méditerranéen.

Au Programme de la Soirée:

19h30: Accueil avec cocktail de bienvenue
- Sélection de mezze chauds et froids
- Boissons de bienvenue (avec ou sans alcool)

20h30: Début du dîner-spectacle
Entrée: Assortiment de spécialités méditerranéennes
Spectacle: Ensemble musical traditionnel (Oud, Qanun, Darbouka)

21h15: Plat principal
Au choix: Couscous royal, Tajine d''agneau aux pruneaux, ou option végétarienne
Spectacle: Danseuse orientale et troupe de danse folklorique

22h30: Dessert
Pâtisseries orientales et thé à la menthe
Spectacle: Démonstration de derviches tourneurs

23h00: Soirée dansante
DJ avec musiques orientales et méditerranéennes

Formules:
VIP: Table réservée proche de la scène, menu gastronomique avec boissons premium incluses
Standard: Menu complet avec boissons de base incluses

Dress code: Tenue élégante souhaitée',
  (NOW() + INTERVAL '60 days')::date,
  '19:30:00',
  'Restaurant Dar el Maghreb',
  '45 Boulevard des Saveurs, 13008 Marseille',
  'Marseille',
  'https://images.pexels.com/photos/3171815/pexels-photo-3171815.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/1395964/pexels-photo-1395964.jpeg?auto=compress&cs=tinysrgb&w=600',
  '[
    {"name": "VIP", "price": 95, "quota": 40, "sold": 18, "description": "Table réservée proche scène + menu gastronomique + boissons premium incluses + cadeau souvenir"},
    {"name": "Standard", "price": 65, "quota": 80, "sold": 45, "description": "Menu complet + 2 boissons incluses"}
  ]'::jsonb,
  120,
  63,
  'À partir de 65€',
  true,
  true,
  'upcoming',
  2,
  10,
  true,
  'Remboursement intégral jusqu''à 10 jours avant l''événement. Entre 10 et 3 jours: remboursement à 50%. Moins de 3 jours: aucun remboursement.',
  false,
  ARRAY['gastronomie', 'spectacle', 'méditerranéen', 'dîner', 'musique', 'danse']
)
ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- COMMENTAIRES
-- =====================================================

COMMENT ON TABLE event_tickets IS 'Tickets individuels générés avec QR codes scannables pour la validation à l''entrée';
COMMENT ON COLUMN event_tickets.qr_code_data IS 'Données encodées dans le QR code (format: event_id|ticket_number|hash)';
COMMENT ON COLUMN event_tickets.is_scanned IS 'Indique si le ticket a été scanné et utilisé';
