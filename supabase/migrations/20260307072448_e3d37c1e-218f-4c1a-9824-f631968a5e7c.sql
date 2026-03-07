
-- Add notes column to units
ALTER TABLE public.units ADD COLUMN IF NOT EXISTS notes text DEFAULT '';

-- Add unique constraint to settings key if not exists
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'settings_key_unique') THEN
    ALTER TABLE public.settings ADD CONSTRAINT settings_key_unique UNIQUE (key);
  END IF;
END $$;

-- Create waitlist table
CREATE TABLE IF NOT EXISTS public.waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_name text NOT NULL,
  guest_email text NOT NULL,
  guest_phone text NOT NULL,
  desired_time text NOT NULL,
  area text NOT NULL,
  desired_date date NOT NULL,
  status text DEFAULT 'waiting',
  notified_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin manage waitlist" ON public.waitlist FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create activity_log table
CREATE TABLE IF NOT EXISTS public.activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL,
  details text,
  entity_type text,
  entity_id uuid,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin manage activity_log" ON public.activity_log FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Enable realtime for waitlist
ALTER PUBLICATION supabase_realtime ADD TABLE public.waitlist;

-- Seed booking_rules setting
INSERT INTO public.settings (key, value) VALUES 
  ('booking_rules', '{"min_lead_time_hours": 2, "max_duration_minutes": {"billard": 120, "kicker": 60, "dart": 60, "restaurant": 180, "vip": 300}}'::jsonb)
ON CONFLICT (key) DO NOTHING;
