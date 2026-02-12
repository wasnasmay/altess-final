/*
  # Ajouter l'accès public en lecture pour le playout

  1. Modifications
    - Ajouter une politique permettant à tout le monde (même anonyme) de lire les programmes planifiés
    - Ajouter une politique permettant à tout le monde de lire la médiathèque
    
  2. Sécurité
    - Lecture seule pour le public
    - Les modifications restent réservées aux admins authentifiés
*/

-- Permettre à tout le monde de voir les programmes planifiés
CREATE POLICY "Anyone can view scheduled programs"
  ON playout_schedule
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Permettre à tout le monde de voir la médiathèque
CREATE POLICY "Anyone can view media library"
  ON media_library
  FOR SELECT
  TO anon, authenticated
  USING (true);
