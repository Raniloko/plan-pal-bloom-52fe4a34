
-- Tighten the INSERT policy: only allow if honeypot is empty (basic spam check at DB level too)
DROP POLICY "Anyone can create reservations" ON public.reservations;

CREATE POLICY "Validated reservations can be created"
  ON public.reservations FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    honeypot = '' 
    AND guest_count >= 1 
    AND guest_count <= 50
    AND customer_name != ''
    AND customer_email != ''
    AND customer_phone != ''
    AND zone IN ('hauptbereich', 'billard', 'vip', 'podest', 'fenster')
    AND occasion IN ('sport', 'feier', 'essen', 'billard', 'sonstiges')
  );
