CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), action text NOT NULL, details text,
  entity_type text, entity_id uuid, created_at timestamptz DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.activity_log TO authenticated;
GRANT ALL ON public.activity_log TO service_role;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.login_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), email text NOT NULL,
  success boolean NOT NULL DEFAULT false, attempted_at timestamptz NOT NULL DEFAULT now(),
  ip text NOT NULL DEFAULT 'unknown'
);
GRANT ALL ON public.login_attempts TO service_role;
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), key text NOT NULL UNIQUE,
  value jsonb NOT NULL, updated_at timestamptz DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.settings TO authenticated;
GRANT ALL ON public.settings TO service_role;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), area text NOT NULL, name text NOT NULL,
  capacity integer DEFAULT 4, status text DEFAULT 'free', occupied_until timestamptz,
  position_index integer DEFAULT 0, created_at timestamptz DEFAULT now(), notes text DEFAULT ''
);
GRANT SELECT ON public.units TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.units TO authenticated;
GRANT ALL ON public.units TO service_role;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), reservation_date date NOT NULL,
  reservation_time text NOT NULL, guest_count integer NOT NULL DEFAULT 2, zone text NOT NULL,
  occasion text NOT NULL, customer_name text NOT NULL, customer_email text NOT NULL,
  customer_phone text NOT NULL, message text DEFAULT '', status text NOT NULL DEFAULT 'confirmed',
  honeypot text DEFAULT '', created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(), cancellation_token uuid DEFAULT gen_random_uuid(),
  unit_id uuid REFERENCES public.units(id), cancellation_reason text, checked_in_at timestamptz,
  recurring_group_id uuid
);
GRANT INSERT ON public.reservations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reservations TO authenticated;
GRANT ALL ON public.reservations TO service_role;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), reservation_id uuid REFERENCES public.reservations(id) ON DELETE SET NULL,
  recipient_email text NOT NULL, recipient_name text, email_type text NOT NULL,
  status text DEFAULT 'sent', sent_at timestamptz DEFAULT now()
);
GRANT SELECT, INSERT ON public.email_logs TO authenticated;
GRANT ALL ON public.email_logs TO service_role;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), title text NOT NULL, message text NOT NULL,
  type text DEFAULT 'info', read boolean DEFAULT false,
  reservation_id uuid REFERENCES public.reservations(id) ON DELETE SET NULL, created_at timestamptz DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.unit_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), unit_id uuid NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  start_date date NOT NULL, end_date date NOT NULL, reason text, created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.unit_blocks TO authenticated;
GRANT ALL ON public.unit_blocks TO service_role;
ALTER TABLE public.unit_blocks ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL,
  role public.app_role NOT NULL, username text, UNIQUE (user_id, role)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), guest_name text NOT NULL, guest_email text NOT NULL,
  guest_phone text NOT NULL, desired_time text NOT NULL, area text NOT NULL, desired_date date NOT NULL,
  status text DEFAULT 'waiting', notified_at timestamptz, created_at timestamptz DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.waitlist TO authenticated;
GRANT ALL ON public.waitlist TO service_role;
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_login_attempts_email_time ON public.login_attempts(email, attempted_at DESC);
CREATE INDEX login_attempts_email_ip_idx ON public.login_attempts(email, ip, attempted_at DESC);
CREATE INDEX idx_reservations_recurring_group ON public.reservations(recurring_group_id);
CREATE INDEX unit_blocks_unit_date_idx ON public.unit_blocks(unit_id, start_date, end_date);
CREATE UNIQUE INDEX user_roles_username_unique ON public.user_roles(username) WHERE username IS NOT NULL;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
 SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Admin manage activity_log" ON public.activity_log FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Service role only" ON public.login_attempts FOR ALL USING (false);
CREATE POLICY "Admin manage settings" ON public.settings FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Public read units" ON public.units FOR SELECT USING (true);
CREATE POLICY "Admin manage units" ON public.units FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Validated reservations can be created" ON public.reservations FOR INSERT WITH CHECK (honeypot = '' AND guest_count BETWEEN 1 AND 50 AND customer_name <> '' AND customer_email <> '' AND customer_phone <> '' AND occasion <> '');
CREATE POLICY "Admins manage reservations" ON public.reservations FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin read email_logs" ON public.email_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin insert email_logs" ON public.email_logs FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin manage notifications" ON public.notifications FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins read unit_blocks" ON public.unit_blocks FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can view roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin manage waitlist" ON public.waitlist FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER update_reservations_updated_at BEFORE UPDATE ON public.reservations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.reserve_atomic(p_unit_id uuid, p_date date, p_time text, p_duration_min integer, p_payload jsonb)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE new_id uuid; conflict_count int; start_min int; end_min int; block_count int;
BEGIN
 PERFORM pg_advisory_xact_lock(hashtextextended('reserve_day_' || p_date::text, 0));
 start_min := split_part(p_time, ':', 1)::int * 60 + split_part(p_time, ':', 2)::int; end_min := start_min + p_duration_min;
 IF p_unit_id IS NOT NULL THEN
  SELECT count(*) INTO block_count FROM public.unit_blocks b WHERE b.unit_id=p_unit_id AND b.start_date<=p_date AND b.end_date>=p_date;
  IF block_count > 0 THEN RAISE EXCEPTION 'unit_blocked' USING ERRCODE='P0001'; END IF;
  SELECT count(*) INTO conflict_count FROM public.reservations r WHERE r.unit_id=p_unit_id AND r.reservation_date=p_date AND r.status NOT IN ('cancelled','checked_out') AND start_min < (split_part(r.reservation_time,':',1)::int*60+split_part(r.reservation_time,':',2)::int+p_duration_min) AND end_min > (split_part(r.reservation_time,':',1)::int*60+split_part(r.reservation_time,':',2)::int);
  IF conflict_count > 0 THEN RAISE EXCEPTION 'unit_conflict' USING ERRCODE='23505'; END IF;
 END IF;
 INSERT INTO public.reservations(customer_name,customer_email,customer_phone,reservation_date,reservation_time,guest_count,zone,occasion,unit_id,status,message,honeypot)
 VALUES(p_payload->>'customer_name',p_payload->>'customer_email',p_payload->>'customer_phone',p_date,p_time,COALESCE((p_payload->>'guest_count')::int,2),p_payload->>'zone',COALESCE(p_payload->>'occasion','Sonstiges'),p_unit_id,COALESCE(p_payload->>'status','confirmed'),COALESCE(p_payload->>'message',''),'') RETURNING id INTO new_id;
 RETURN new_id;
END; $$;

CREATE OR REPLACE FUNCTION public.reserve_billard_auto(p_date date, p_time text, p_duration_min integer, p_payload jsonb)
RETURNS TABLE(reservation_id uuid, unit_id uuid) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE picked uuid; start_min int; end_min int; new_id uuid;
BEGIN
 PERFORM pg_advisory_xact_lock(hashtextextended('reserve_day_' || p_date::text,0));
 start_min:=split_part(p_time,':',1)::int*60+split_part(p_time,':',2)::int; end_min:=start_min+p_duration_min;
 SELECT u.id INTO picked FROM public.units u WHERE u.area='billard'
 AND NOT EXISTS(SELECT 1 FROM public.unit_blocks b WHERE b.unit_id=u.id AND b.start_date<=p_date AND b.end_date>=p_date)
 AND NOT EXISTS(SELECT 1 FROM public.reservations r WHERE r.unit_id=u.id AND r.reservation_date=p_date AND r.status NOT IN ('cancelled','checked_out') AND start_min<(split_part(r.reservation_time,':',1)::int*60+split_part(r.reservation_time,':',2)::int+p_duration_min) AND end_min>(split_part(r.reservation_time,':',1)::int*60+split_part(r.reservation_time,':',2)::int))
 ORDER BY NULLIF(regexp_replace(u.name,'\D','','g'),'')::int NULLS LAST,u.name LIMIT 1;
 IF picked IS NULL THEN RAISE EXCEPTION 'no_free_billard' USING ERRCODE='P0001'; END IF;
 INSERT INTO public.reservations(customer_name,customer_email,customer_phone,reservation_date,reservation_time,guest_count,zone,occasion,unit_id,status,message,honeypot)
 VALUES(p_payload->>'customer_name',p_payload->>'customer_email',p_payload->>'customer_phone',p_date,p_time,COALESCE((p_payload->>'guest_count')::int,2),'billard',COALESCE(p_payload->>'occasion','Warteliste'),picked,COALESCE(p_payload->>'status','confirmed'),COALESCE(p_payload->>'message',''),'') RETURNING id INTO new_id;
 RETURN QUERY SELECT new_id,picked;
END; $$;
REVOKE EXECUTE ON FUNCTION public.reserve_atomic(uuid,date,text,integer,jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.reserve_billard_auto(date,text,integer,jsonb) FROM PUBLIC, anon, authenticated;
