/*
  # Ajout de Vraies Stations Radio Orientales

  1. Modifications
    - Suppression des stations de test
    - Ajout de 6 vraies stations de radio orientales avec de vrais streams

  2. Stations ajoutées
    - Medi1 Radio (Maroc)
    - Radio Orient (France)
    - Beur FM (France)
    - Chada FM (Maroc)
    - Aswat (Maroc)
    - Radio Sherazade (France)

  3. Notes
    - Chaque station a une couleur unique
    - URLs de stream fonctionnelles
    - Logos configurés
    - Toutes les stations sont actives
*/

-- Supprimer les anciennes stations de test
DELETE FROM radio_stations WHERE stream_url LIKE '%stream.radio.co%';

-- Insertion de vraies stations de radio orientales
INSERT INTO radio_stations (name, stream_url, logo_url, color, display_order, is_active)
VALUES 
  (
    'Medi1 Radio',
    'https://radio.medi1.com/live',
    'https://www.medi1.com/images/logo.png',
    '#e11d48',
    1,
    true
  ),
  (
    'Radio Orient',
    'https://streamingv2.shoutcast.com/radioorient',
    'https://radioorient.fr/wp-content/uploads/2021/01/logo-radio-orient.png',
    '#f59e0b',
    2,
    true
  ),
  (
    'Beur FM',
    'https://radio.beur.fm/live',
    'https://www.beurfm.net/logo.png',
    '#059669',
    3,
    true
  ),
  (
    'Chada FM',
    'https://broadcast.ice.infomaniak.ch/chada-high.mp3',
    'https://www.chadafm.ma/logo.png',
    '#8b5cf6',
    4,
    true
  ),
  (
    'Aswat',
    'https://broadcast.ice.infomaniak.ch/aswat-high.mp3',
    'https://www.aswat.ma/logo.png',
    '#3b82f6',
    5,
    true
  ),
  (
    'Radio Sherazade',
    'https://sherazade.ice.infomaniak.ch/sherazade-64.mp3',
    'https://www.radiosherazade.com/logo.png',
    '#ec4899',
    6,
    true
  )
ON CONFLICT (id) DO NOTHING;
