-- 1. Remove PII-containing tables from Realtime publication
ALTER PUBLICATION supabase_realtime DROP TABLE public.reservations;
ALTER PUBLICATION supabase_realtime DROP TABLE public.waitlist;
ALTER PUBLICATION supabase_realtime DROP TABLE public.notifications;

-- Keep only units (no PII) in realtime
-- units is already there and contains no sensitive data

-- 2. Defense-in-depth: Explicitly deny non-admin INSERT on user_roles
CREATE POLICY "Deny non-admin insert on user_roles"
  ON public.user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));