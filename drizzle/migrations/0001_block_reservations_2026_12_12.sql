-- Sperrt alle neuen Reservierungen für den 12.12.2026 (Betrieb geschlossen).
CREATE OR REPLACE FUNCTION public.block_reservation_date()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.reservation_date = DATE '2026-12-12' THEN
    RAISE EXCEPTION 'date_blocked' USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER block_reservations_2026_12_12
  BEFORE INSERT ON public.reservations
  FOR EACH ROW
  EXECUTE FUNCTION public.block_reservation_date();