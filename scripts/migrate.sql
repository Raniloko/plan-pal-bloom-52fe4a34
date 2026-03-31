-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enum: app_role
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'user');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Table: units
CREATE TABLE IF NOT EXISTS public.units (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT NOT NULL,
  area           TEXT NOT NULL,
  capacity       INTEGER,
  status         TEXT DEFAULT 'available',
  notes          TEXT,
  occupied_until TEXT,
  position_index INTEGER,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Table: reservations
CREATE TABLE IF NOT EXISTS public.reservations (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name       TEXT NOT NULL,
  customer_email      TEXT NOT NULL,
  customer_phone      TEXT NOT NULL,
  guest_count         INTEGER NOT NULL DEFAULT 1,
  reservation_date    TEXT NOT NULL,
  reservation_time    TEXT NOT NULL,
  zone                TEXT NOT NULL,
  occasion            TEXT NOT NULL,
  message             TEXT,
  status              TEXT NOT NULL DEFAULT 'pending',
  unit_id             UUID REFERENCES public.units(id),
  cancellation_token  TEXT,
  cancellation_reason TEXT,
  honeypot            TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title          TEXT NOT NULL,
  message        TEXT NOT NULL,
  type           TEXT DEFAULT 'info',
  read           BOOLEAN DEFAULT FALSE,
  reservation_id UUID REFERENCES public.reservations(id),
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Table: email_logs
CREATE TABLE IF NOT EXISTS public.email_logs (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_type     TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  recipient_name  TEXT,
  reservation_id  UUID REFERENCES public.reservations(id),
  status          TEXT DEFAULT 'sent',
  sent_at         TIMESTAMPTZ DEFAULT NOW()
);

-- Table: activity_log
CREATE TABLE IF NOT EXISTS public.activity_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action      TEXT NOT NULL,
  entity_type TEXT,
  entity_id   UUID,
  details     TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Table: login_attempts
CREATE TABLE IF NOT EXISTS public.login_attempts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email        TEXT NOT NULL,
  success      BOOLEAN NOT NULL DEFAULT FALSE,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: settings
CREATE TABLE IF NOT EXISTS public.settings (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key        TEXT NOT NULL UNIQUE,
  value      JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: waitlist
CREATE TABLE IF NOT EXISTS public.waitlist (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_name   TEXT NOT NULL,
  guest_email  TEXT NOT NULL,
  guest_phone  TEXT NOT NULL,
  area         TEXT NOT NULL,
  desired_date TEXT NOT NULL,
  desired_time TEXT NOT NULL,
  status       TEXT DEFAULT 'waiting',
  notified_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Table: user_roles
CREATE TABLE IF NOT EXISTS public.user_roles (
  id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id  UUID NOT NULL,
  role     public.app_role NOT NULL,
  username TEXT
);

-- Function: has_role
CREATE OR REPLACE FUNCTION public.has_role(_role public.app_role, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- RLS: Enable on all tables
ALTER TABLE public.units         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waitlist      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles    ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Allow public read/insert for reservations and waitlist
CREATE POLICY "Public can insert reservations"
  ON public.reservations FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Public can read reservations"
  ON public.reservations FOR SELECT TO anon USING (true);

CREATE POLICY "Public can insert waitlist"
  ON public.waitlist FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Public can read waitlist"
  ON public.waitlist FOR SELECT TO anon USING (true);

-- RLS Policies: Units public read
CREATE POLICY "Public can read units"
  ON public.units FOR SELECT TO anon USING (true);

-- RLS Policies: Full access for authenticated users on all tables
CREATE POLICY "Authenticated full access reservations"
  ON public.reservations FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated full access units"
  ON public.units FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated full access notifications"
  ON public.notifications FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated full access email_logs"
  ON public.email_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated full access activity_log"
  ON public.activity_log FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated full access login_attempts"
  ON public.login_attempts FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated full access settings"
  ON public.settings FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated full access user_roles"
  ON public.user_roles FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Seed: Default settings
INSERT INTO public.settings (key, value) VALUES
  ('restaurant_name', '"Rondo Sportsbar"'),
  ('opening_hours', '{"monday":"17:00-23:00","tuesday":"17:00-23:00","wednesday":"17:00-23:00","thursday":"17:00-23:00","friday":"17:00-00:00","saturday":"12:00-00:00","sunday":"12:00-23:00"}'),
  ('max_party_size', '20'),
  ('reservation_lead_time_hours', '2')
ON CONFLICT (key) DO NOTHING;

-- Seed: Default units (tables)
INSERT INTO public.units (name, area, capacity, status, position_index) VALUES
  ('Tisch 1', 'innen', 4, 'available', 1),
  ('Tisch 2', 'innen', 4, 'available', 2),
  ('Tisch 3', 'innen', 6, 'available', 3),
  ('Tisch 4', 'innen', 6, 'available', 4),
  ('Tisch 5', 'innen', 2, 'available', 5),
  ('Tisch 6', 'innen', 2, 'available', 6),
  ('Tisch 7', 'bar', 4, 'available', 7),
  ('Tisch 8', 'bar', 4, 'available', 8),
  ('Tisch 9', 'terrasse', 6, 'available', 9),
  ('Tisch 10', 'terrasse', 6, 'available', 10),
  ('Tisch 11', 'terrasse', 4, 'available', 11),
  ('VIP Tisch', 'vip', 10, 'available', 12)
ON CONFLICT DO NOTHING;
