CREATE TABLE public.blocked_days (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  block_date date NOT NULL,
  area text,
  reason text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.blocked_days TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.blocked_days TO authenticated;
GRANT ALL ON public.blocked_days TO service_role;
ALTER TABLE public.blocked_days ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read blocked_days" ON public.blocked_days FOR SELECT USING (true);
CREATE POLICY "Admin manage blocked_days" ON public.blocked_days FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

INSERT INTO public.blocked_days (block_date, area, reason) VALUES (DATE '2026-12-12', NULL, 'Geschlossene Veranstaltung');

CREATE OR REPLACE FUNCTION public.block_reservation_date()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.blocked_days b
    WHERE b.block_date = NEW.reservation_date
      AND (b.area IS NULL OR b.area = NEW.zone)
  ) THEN
    RAISE EXCEPTION 'date_blocked' USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
$$;