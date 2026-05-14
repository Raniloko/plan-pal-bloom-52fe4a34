-- 1) Detach reservations from F-units (no FK, but clear unit_id to keep history clean)
UPDATE public.reservations
SET unit_id = NULL
WHERE unit_id IN (SELECT id FROM public.units WHERE area = 'fenster' AND name LIKE 'Tisch F%');

-- 2) Delete the non-existing fenster tables
DELETE FROM public.units WHERE area = 'fenster' AND name LIKE 'Tisch F%';

-- 3) Move Tisch 55, 56, 57 from hauptbereich to fenster
UPDATE public.units SET area = 'fenster' WHERE name IN ('Tisch 55', 'Tisch 56', 'Tisch 57');

-- 4) Add recurring group column for Stammkunden batch reservations
ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS recurring_group_id uuid;
CREATE INDEX IF NOT EXISTS idx_reservations_recurring_group ON public.reservations(recurring_group_id);