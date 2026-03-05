
-- 1. Create units table
CREATE TABLE IF NOT EXISTS public.units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  area text NOT NULL,
  name text NOT NULL,
  capacity integer DEFAULT 4,
  status text DEFAULT 'free',
  occupied_until timestamptz,
  position_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read units" ON public.units FOR SELECT USING (true);
CREATE POLICY "Admin update units" ON public.units FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin insert units" ON public.units FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin delete units" ON public.units FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

INSERT INTO public.units (area, name, capacity, position_index) VALUES
  ('billard', 'Tisch 1', 4, 1), ('billard', 'Tisch 2', 4, 2),
  ('billard', 'Tisch 3', 4, 3), ('billard', 'Tisch 4', 4, 4),
  ('billard', 'Tisch 5', 4, 5), ('billard', 'Tisch 6', 4, 6),
  ('billard', 'Tisch 7', 4, 7), ('billard', 'Tisch 8', 4, 8),
  ('kicker', 'Kicker 1', 4, 1), ('kicker', 'Kicker 2', 4, 2),
  ('dart', 'Dart 1', 4, 1), ('dart', 'Dart 2', 4, 2);

-- 2. Extend reservations
ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS cancellation_token uuid DEFAULT gen_random_uuid();
ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS unit_id uuid REFERENCES public.units(id);
ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS cancellation_reason text;

DROP POLICY IF EXISTS "Validated reservations can be created" ON public.reservations;
CREATE POLICY "Validated reservations can be created" ON public.reservations
FOR INSERT WITH CHECK (
  (honeypot = ''::text) AND
  (guest_count >= 1) AND (guest_count <= 50) AND
  (customer_name <> ''::text) AND
  (customer_email <> ''::text) AND
  (customer_phone <> ''::text) AND
  (zone = ANY (ARRAY['hauptbereich', 'billard', 'vip', 'podest', 'fenster', 'kicker', 'dart', 'restaurant'])) AND
  (occasion = ANY (ARRAY['sport', 'feier', 'essen', 'billard', 'sonstiges', 'kicker', 'dart', 'vip']))
);

-- 3. Email logs
CREATE TABLE IF NOT EXISTS public.email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id uuid REFERENCES public.reservations(id) ON DELETE SET NULL,
  recipient_email text NOT NULL,
  recipient_name text,
  email_type text NOT NULL,
  status text DEFAULT 'sent',
  sent_at timestamptz DEFAULT now()
);
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin read email_logs" ON public.email_logs FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin insert email_logs" ON public.email_logs FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 4. Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text NOT NULL,
  type text DEFAULT 'info',
  read boolean DEFAULT false,
  reservation_id uuid REFERENCES public.reservations(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin manage notifications" ON public.notifications FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 5. Settings
CREATE TABLE IF NOT EXISTS public.settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL,
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin manage settings" ON public.settings FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

INSERT INTO public.settings (key, value) VALUES
  ('opening_hours', '{"monday":{"open":"16:00","close":"01:00"},"tuesday":{"open":"16:00","close":"01:00"},"wednesday":{"open":"16:00","close":"01:00"},"thursday":{"open":"16:00","close":"01:00"},"friday":{"open":"16:00","close":"03:00"},"saturday":{"open":"14:00","close":"03:00"},"sunday":{"open":"14:00","close":"01:00"}}'::jsonb),
  ('areas_enabled', '{"billard":true,"kicker":true,"dart":true,"restaurant":true,"vip":true}'::jsonb),
  ('booking_rules', '{"min_lead_time_hours":2,"max_duration_minutes":{"billard":120,"kicker":60,"dart":60,"restaurant":180,"vip":300}}'::jsonb),
  ('email_sender', '{"name":"Rondo Sportsbar","email":"info@dev-lab24.de"}'::jsonb),
  ('notifications_enabled', '{"new_reservation":true,"cancellation":true}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- 6. Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.units;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
