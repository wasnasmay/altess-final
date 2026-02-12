/*
  # Correction des Quotas et Génération de Données de Vente Fictives

  ## 1. Corrections des Valeurs NULL (Fix NaN)

  Mise à jour de tous les événements pour s'assurer que les valeurs numériques
  ne sont jamais NULL, ce qui cause des affichages "NaN" dans l'interface.

  ### Champs Corrigés:
  - `tickets_sold` - Défaut: 0
  - `total_quota` - Défaut: 0
  - `total_revenue` - Défaut: 0.00

  ## 2. Génération de Données de Vente Fictives

  Création de 30 tickets de test (1 par jour sur les 30 derniers jours)
  pour remplir le graphique "Aperçu des ventes" avec une courbe réaliste.

  ### Données Générées:
  - 30 achats de billets sur les 30 derniers jours
  - Montants variables entre 25€ et 150€
  - Courbe avec montées et descentes naturelles
  - Liées à l'organisateur de test

  ## 3. Initialisation des Valeurs par Défaut

  Ajout de contraintes DEFAULT pour éviter les NULL à l'avenir.
*/

-- =====================================================
-- CORRECTION DES VALEURS NULL EXISTANTES
-- =====================================================

-- Mettre à jour tous les événements avec tickets_sold NULL
UPDATE public_events
SET tickets_sold = 0
WHERE tickets_sold IS NULL;

-- Mettre à jour tous les événements avec total_quota NULL
UPDATE public_events
SET total_quota = 0
WHERE total_quota IS NULL;

-- Mettre à jour tous les événements avec total_revenue NULL
UPDATE public_events
SET total_revenue = 0
WHERE total_revenue IS NULL;

-- =====================================================
-- AJOUT DE VALEURS PAR DÉFAUT
-- =====================================================

-- Ajouter DEFAULT 0 pour tickets_sold
ALTER TABLE public_events
ALTER COLUMN tickets_sold SET DEFAULT 0;

-- Ajouter DEFAULT 0 pour total_quota
ALTER TABLE public_events
ALTER COLUMN total_quota SET DEFAULT 0;

-- Ajouter DEFAULT 0 pour total_revenue
ALTER TABLE public_events
ALTER COLUMN total_revenue SET DEFAULT 0;

-- =====================================================
-- GÉNÉRATION DE DONNÉES DE VENTE FICTIVES
-- =====================================================

-- Créer des achats de billets sur les 30 derniers jours
DO $$
DECLARE
  test_organizer_id uuid;
  test_event_id uuid;
  current_date_iter timestamptz;
  ticket_counter int := 1;
  base_amount numeric;
  variation numeric;
  final_price numeric;
BEGIN
  -- Trouver le premier organisateur (pour les tests)
  SELECT id INTO test_organizer_id
  FROM event_organizers
  ORDER BY created_at DESC
  LIMIT 1;

  -- Trouver le premier événement de cet organisateur
  SELECT pe.id INTO test_event_id
  FROM public_events pe
  JOIN event_organizers eo ON pe.organizer_id = eo.user_id
  WHERE eo.id = test_organizer_id
  ORDER BY pe.created_at DESC
  LIMIT 1;

  -- Si on a un organisateur et un événement, générer les données
  IF test_organizer_id IS NOT NULL AND test_event_id IS NOT NULL THEN
    -- Générer 30 jours de données de vente
    FOR i IN 0..29 LOOP
      current_date_iter := NOW() - (INTERVAL '1 day' * (29 - i));
      
      -- Créer une courbe avec variations
      -- Base de 60€, variations entre -35€ et +90€
      base_amount := 60;
      
      -- Créer des pics et des creux naturels
      IF i % 7 = 0 OR i % 7 = 6 THEN
        -- Week-ends: plus de ventes
        variation := 50 + (RANDOM() * 40);
      ELSIF i % 10 = 5 THEN
        -- Pics de promotion
        variation := 70 + (RANDOM() * 50);
      ELSIF i % 13 = 3 THEN
        -- Jours creux
        variation := -20 - (RANDOM() * 15);
      ELSE
        -- Jours normaux
        variation := -10 + (RANDOM() * 30);
      END IF;

      final_price := GREATEST(25, base_amount + variation);

      -- Insérer l'achat fictif
      INSERT INTO ticket_purchases (
        id,
        organizer_id,
        event_id,
        customer_first_name,
        customer_last_name,
        customer_email,
        customer_phone,
        ticket_type,
        ticket_tier_name,
        quantity,
        unit_price,
        total_price,
        final_amount,
        ticket_number,
        qr_code_data,
        payment_status,
        created_at
      ) VALUES (
        gen_random_uuid(),
        test_organizer_id,
        test_event_id,
        'Client',
        'Test ' || ticket_counter,
        'test' || ticket_counter || '@example.com',
        '+33600000000',
        'standard',
        'Standard',
        CASE 
          WHEN final_price > 100 THEN 2
          ELSE 1
        END,
        base_amount,
        final_price,
        final_price,
        'TICKET-TEST-' || LPAD(ticket_counter::text, 6, '0'),
        'QR-' || gen_random_uuid()::text,
        'paid',
        current_date_iter
      );

      ticket_counter := ticket_counter + 1;
    END LOOP;

    RAISE NOTICE 'Generated 30 test ticket purchases for graphing';
  ELSE
    RAISE NOTICE 'No organizer or event found, skipping test data generation';
  END IF;
END $$;

-- =====================================================
-- METTRE À JOUR LES TOTAUX DES ÉVÉNEMENTS
-- =====================================================

-- Recalculer tickets_sold pour tous les événements
UPDATE public_events pe
SET tickets_sold = COALESCE((
  SELECT SUM(tp.quantity)
  FROM ticket_purchases tp
  WHERE tp.event_id = pe.id
  AND tp.payment_status = 'paid'
), 0);

-- Recalculer total_revenue pour tous les événements
UPDATE public_events pe
SET total_revenue = COALESCE((
  SELECT SUM(tp.final_amount)
  FROM ticket_purchases tp
  WHERE tp.event_id = pe.id
  AND tp.payment_status = 'paid'
), 0);

-- =====================================================
-- VÉRIFICATION
-- =====================================================

-- Vérifier qu'il n'y a plus de NULL
DO $$
DECLARE
  null_count int;
BEGIN
  SELECT COUNT(*) INTO null_count
  FROM public_events
  WHERE tickets_sold IS NULL
     OR total_quota IS NULL
     OR total_revenue IS NULL;

  IF null_count > 0 THEN
    RAISE WARNING 'Still % events with NULL values', null_count;
  ELSE
    RAISE NOTICE 'All events have valid numeric values (no more NaN issues)';
  END IF;
END $$;
