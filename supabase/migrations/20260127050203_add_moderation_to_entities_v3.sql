/*
  # Add Moderation Status to Entities

  1. Extensions
    - Add `approval_status` to public_events ('pending', 'approved', 'rejected')
    - Add `approval_status` to partners
    - Add `approval_status` to good_addresses
    - Add `expires_at` to partners if not exists
    - Add `approved_at` and `approved_by` fields for tracking
    - Add `owner_id` to good_addresses for tracking submissions

  2. Important Notes
    - Default status is 'pending' for new entries
    - Only admins can approve/reject
    - Track who approved and when
*/

-- =====================================================
-- ADD MODERATION TO public_events
-- =====================================================

DO $$
BEGIN
  -- approval_status
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'public_events' AND column_name = 'approval_status'
  ) THEN
    ALTER TABLE public_events ADD COLUMN approval_status text DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected'));
  END IF;

  -- approved_at
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'public_events' AND column_name = 'approved_at'
  ) THEN
    ALTER TABLE public_events ADD COLUMN approved_at timestamptz;
  END IF;

  -- approved_by
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'public_events' AND column_name = 'approved_by'
  ) THEN
    ALTER TABLE public_events ADD COLUMN approved_by uuid REFERENCES profiles(id);
  END IF;

  -- rejection_reason
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'public_events' AND column_name = 'rejection_reason'
  ) THEN
    ALTER TABLE public_events ADD COLUMN rejection_reason text;
  END IF;
END $$;

-- =====================================================
-- ADD MODERATION TO partners
-- =====================================================

DO $$
BEGIN
  -- approval_status
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'partners' AND column_name = 'approval_status'
  ) THEN
    ALTER TABLE partners ADD COLUMN approval_status text DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected'));
  END IF;

  -- expires_at
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'partners' AND column_name = 'expires_at'
  ) THEN
    ALTER TABLE partners ADD COLUMN expires_at timestamptz DEFAULT (NOW() + INTERVAL '12 months');
  END IF;

  -- approved_at
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'partners' AND column_name = 'approved_at'
  ) THEN
    ALTER TABLE partners ADD COLUMN approved_at timestamptz;
  END IF;

  -- approved_by
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'partners' AND column_name = 'approved_by'
  ) THEN
    ALTER TABLE partners ADD COLUMN approved_by uuid REFERENCES profiles(id);
  END IF;

  -- renewal_stripe_link
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'partners' AND column_name = 'renewal_stripe_link'
  ) THEN
    ALTER TABLE partners ADD COLUMN renewal_stripe_link text;
  END IF;

  -- payment_transferred
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'partners' AND column_name = 'payment_transferred'
  ) THEN
    ALTER TABLE partners ADD COLUMN payment_transferred boolean DEFAULT false;
  END IF;
END $$;

-- =====================================================
-- ADD MODERATION TO good_addresses
-- =====================================================

DO $$
BEGIN
  -- owner_id for tracking submissions
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'good_addresses' AND column_name = 'owner_id'
  ) THEN
    ALTER TABLE good_addresses ADD COLUMN owner_id uuid REFERENCES profiles(id);
  END IF;

  -- approval_status
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'good_addresses' AND column_name = 'approval_status'
  ) THEN
    ALTER TABLE good_addresses ADD COLUMN approval_status text DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected'));
  END IF;

  -- approved_at
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'good_addresses' AND column_name = 'approved_at'
  ) THEN
    ALTER TABLE good_addresses ADD COLUMN approved_at timestamptz;
  END IF;

  -- approved_by
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'good_addresses' AND column_name = 'approved_by'
  ) THEN
    ALTER TABLE good_addresses ADD COLUMN approved_by uuid REFERENCES profiles(id);
  END IF;

  -- payment_transferred (already exists from previous migration, but ensure it)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'good_addresses' AND column_name = 'payment_transferred'
  ) THEN
    ALTER TABLE good_addresses ADD COLUMN payment_transferred boolean DEFAULT false;
  END IF;
END $$;

-- =====================================================
-- UPDATE RLS POLICIES: public_events
-- =====================================================

DROP POLICY IF EXISTS "Public can read active events" ON public_events;
DROP POLICY IF EXISTS "Public can read approved active events" ON public_events;
DROP POLICY IF EXISTS "Users can read own events" ON public_events;
DROP POLICY IF EXISTS "Admins can create events" ON public_events;
DROP POLICY IF EXISTS "Partners can create events" ON public_events;
DROP POLICY IF EXISTS "Partners can update own pending events" ON public_events;
DROP POLICY IF EXISTS "Admins can update all events" ON public_events;
DROP POLICY IF EXISTS "Admins can update events" ON public_events;
DROP POLICY IF EXISTS "Admins can delete events" ON public_events;

CREATE POLICY "Public can read approved active events"
  ON public_events FOR SELECT
  TO public
  USING (is_active = true AND approval_status = 'approved');

CREATE POLICY "Users can read own events"
  ON public_events FOR SELECT
  TO authenticated
  USING (organizer_id = auth.uid() OR created_by = auth.uid());

CREATE POLICY "Partners can create events"
  ON public_events FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('partner', 'admin')
    )
  );

CREATE POLICY "Partners can update own pending events"
  ON public_events FOR UPDATE
  TO authenticated
  USING (
    (organizer_id = auth.uid() OR created_by = auth.uid())
    AND approval_status = 'pending'
  )
  WITH CHECK (
    (organizer_id = auth.uid() OR created_by = auth.uid())
    AND approval_status = 'pending'
  );

CREATE POLICY "Admins can update all events"
  ON public_events FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete events"
  ON public_events FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- =====================================================
-- UPDATE RLS POLICIES: partners
-- =====================================================

DROP POLICY IF EXISTS "Partners are viewable by everyone" ON partners;
DROP POLICY IF EXISTS "Approved partners are viewable by everyone" ON partners;

CREATE POLICY "Approved partners are viewable by everyone"
  ON partners FOR SELECT
  TO public
  USING (approval_status = 'approved' AND (expires_at IS NULL OR expires_at > NOW()));

-- =====================================================
-- UPDATE RLS POLICIES: good_addresses
-- =====================================================

DROP POLICY IF EXISTS "Good addresses are viewable by everyone" ON good_addresses;
DROP POLICY IF EXISTS "Approved addresses are viewable by everyone" ON good_addresses;
DROP POLICY IF EXISTS "Users can read own addresses" ON good_addresses;

CREATE POLICY "Approved addresses are viewable by everyone"
  ON good_addresses FOR SELECT
  TO public
  USING (approval_status = 'approved' AND (expires_at IS NULL OR expires_at > NOW()));

CREATE POLICY "Users can read own addresses"
  ON good_addresses FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());