/*
  # Add Public Read Policy for Newly Created Tickets

  1. Changes
    - Add a SELECT policy for public role to read tickets created in the last 10 minutes
    - This allows the checkout flow to work for non-authenticated users
    - Security: Only tickets created within the last 10 minutes can be read
  
  2. Security
    - Time-limited access (10 minutes)
    - Prevents long-term public access to ticket data
*/

-- Drop existing restrictive policies if they conflict
-- (They won't, but let's be safe)

-- Add SELECT policy for public to read recently created tickets
CREATE POLICY "Public can view recently created tickets"
  ON ticket_purchases
  FOR SELECT
  TO public
  USING (
    created_at >= (now() - interval '10 minutes')
  );
