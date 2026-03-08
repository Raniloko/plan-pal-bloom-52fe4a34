DROP POLICY IF EXISTS "Validated reservations can be created" ON public.reservations;

CREATE POLICY "Validated reservations can be created"
ON public.reservations
FOR INSERT
WITH CHECK (
  (honeypot = ''::text) 
  AND (guest_count >= 1) 
  AND (guest_count <= 50) 
  AND (customer_name <> ''::text) 
  AND (customer_email <> ''::text) 
  AND (customer_phone <> ''::text) 
  AND (zone = ANY (ARRAY['hauptbereich','billard','vip','podest','fenster','kicker','dart','restaurant']))
  AND (occasion <> ''::text)
);