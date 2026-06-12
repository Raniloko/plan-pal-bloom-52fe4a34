CREATE TABLE public.unit_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  start_date date NOT NULL,
  end_date date NOT NULL,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX unit_blocks_unit_date_idx ON public.unit_blocks(unit_id, start_date, end_date);
GRANT SELECT ON public.unit_blocks TO authenticated;
GRANT ALL ON public.unit_blocks TO service_role;
ALTER TABLE public.unit_blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read unit_blocks" ON public.unit_blocks FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));