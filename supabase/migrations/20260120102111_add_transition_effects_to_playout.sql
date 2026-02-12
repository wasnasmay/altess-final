/*
  # Ajout des effets de transition au système playout

  ## Modifications
  1. Ajout du champ `transition_effect` à la table `playout_schedules`
     - Type: text (nullable)
     - Valeurs possibles: 'none', 'fade', 'crossfade', 'cut'
     - Permet de définir l'effet de transition entre les clips

  2. Ajout du champ `transition_duration` à la table `playout_schedules`
     - Type: integer (nullable)
     - Durée de la transition en millisecondes (défaut: 1000ms)

  ## Notes
  - Les transitions s'appliquent entre le clip actuel et le suivant
  - 'none' = pas de transition
  - 'fade' = fondu enchaîné simple
  - 'crossfade' = fondu croisé avec chevauchement
  - 'cut' = coupure nette (défaut)
*/

-- Ajouter le champ transition_effect
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'playout_schedules' AND column_name = 'transition_effect'
  ) THEN
    ALTER TABLE playout_schedules ADD COLUMN transition_effect text DEFAULT 'cut' CHECK (transition_effect IN ('none', 'fade', 'crossfade', 'cut'));
  END IF;
END $$;

-- Ajouter le champ transition_duration
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'playout_schedules' AND column_name = 'transition_duration'
  ) THEN
    ALTER TABLE playout_schedules ADD COLUMN transition_duration integer DEFAULT 1000;
  END IF;
END $$;
