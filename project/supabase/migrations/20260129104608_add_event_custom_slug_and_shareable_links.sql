/*
  # Système de Liens Partageables pour Événements

  ## 1. Modifications de la Table public_events

  Ajout du champ `custom_slug` pour permettre aux organisateurs de personnaliser
  l'URL de leurs événements.

  ### Nouveau Champ:
  - `custom_slug` (text, unique) - Slug personnalisé pour l'URL courte (ex: chaabi26)
    - Permet des URLs du type: altess.fr/e/chaabi26
    - Généré automatiquement depuis le titre de l'événement
    - Modifiable par l'organisateur
    - Unique dans toute la plateforme

  ## 2. Données de Test

  Mise à jour des événements de test avec des slugs propres et courts :
  - altess.fr/e/raimodern
  - altess.fr/e/danse-orientale
  - altess.fr/e/mediterranee
  - altess.fr/e/festival-chaabi
  - altess.fr/e/nuit-andalouse

  ## 3. Sécurité
  - Les slugs doivent être uniques
  - Seul l'organisateur propriétaire peut modifier le slug
  - Les slugs sont en lecture publique pour affichage
*/

-- =====================================================
-- AJOUT DU CHAMP custom_slug
-- =====================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'public_events' AND column_name = 'custom_slug'
  ) THEN
    ALTER TABLE public_events ADD COLUMN custom_slug text;
  END IF;
END $$;

-- Créer un index unique sur custom_slug
CREATE UNIQUE INDEX IF NOT EXISTS public_events_custom_slug_unique
ON public_events(custom_slug)
WHERE custom_slug IS NOT NULL;

-- =====================================================
-- FONCTION: Générer un slug depuis un titre
-- =====================================================

CREATE OR REPLACE FUNCTION generate_slug_from_title(title text)
RETURNS text AS $$
DECLARE
  result_slug text;
  counter int := 0;
  base_slug text;
BEGIN
  -- Convertir en minuscules et remplacer les espaces par des tirets
  base_slug := lower(regexp_replace(title, '[^a-zA-Z0-9\s-]', '', 'g'));
  base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
  base_slug := regexp_replace(base_slug, '-+', '-', 'g');
  base_slug := trim(both '-' from base_slug);

  -- Limiter à 50 caractères
  base_slug := substring(base_slug from 1 for 50);
  result_slug := base_slug;

  -- Vérifier l'unicité et ajouter un compteur si nécessaire
  WHILE EXISTS (SELECT 1 FROM public_events WHERE public_events.custom_slug = result_slug) LOOP
    counter := counter + 1;
    result_slug := base_slug || '-' || counter;
  END LOOP;

  RETURN result_slug;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- MISE À JOUR DES ÉVÉNEMENTS DE TEST
-- =====================================================

-- Mettre à jour les événements existants avec des slugs propres
UPDATE public_events SET custom_slug = 'raimodern'
WHERE title ILIKE '%raï%' AND custom_slug IS NULL;

UPDATE public_events SET custom_slug = 'danse-orientale'
WHERE title ILIKE '%danse oriental%' AND custom_slug IS NULL;

UPDATE public_events SET custom_slug = 'mediterranee'
WHERE (title ILIKE '%méditerranéen%' OR title ILIKE '%mediterraneen%') AND custom_slug IS NULL;

UPDATE public_events SET custom_slug = 'festival-chaabi'
WHERE title ILIKE '%chaabi%' AND custom_slug IS NULL;

UPDATE public_events SET custom_slug = 'nuit-andalouse'
WHERE title ILIKE '%andalous%' AND custom_slug IS NULL;

-- Pour tous les autres événements sans slug, en générer un automatiquement
UPDATE public_events
SET custom_slug = generate_slug_from_title(title)
WHERE custom_slug IS NULL;

-- =====================================================
-- TRIGGER: Auto-génération du slug
-- =====================================================

CREATE OR REPLACE FUNCTION auto_generate_event_slug()
RETURNS TRIGGER AS $$
BEGIN
  -- Si aucun slug n'est fourni, en générer un depuis le titre
  IF NEW.custom_slug IS NULL OR NEW.custom_slug = '' THEN
    NEW.custom_slug := generate_slug_from_title(NEW.title);
  ELSE
    -- Nettoyer le slug fourni
    NEW.custom_slug := lower(regexp_replace(NEW.custom_slug, '[^a-zA-Z0-9-]', '', 'g'));
    NEW.custom_slug := regexp_replace(NEW.custom_slug, '-+', '-', 'g');
    NEW.custom_slug := trim(both '-' from NEW.custom_slug);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger
DROP TRIGGER IF EXISTS trigger_auto_generate_event_slug ON public_events;
CREATE TRIGGER trigger_auto_generate_event_slug
  BEFORE INSERT OR UPDATE OF custom_slug, title
  ON public_events
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_event_slug();

-- =====================================================
-- POLITIQUE RLS: Lecture publique des slugs
-- =====================================================

-- Les slugs sont publics pour permettre l'affichage des événements
-- Mais seul l'organisateur peut les modifier (déjà géré par les policies existantes)

COMMENT ON COLUMN public_events.custom_slug IS 'Slug personnalisé pour l''URL courte de l''événement (ex: altess.fr/e/chaabi26)';
