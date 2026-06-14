CREATE OR REPLACE FUNCTION public.reserve_atomic(p_unit_id uuid, p_date date, p_time text, p_duration_min integer, p_payload jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  new_id uuid;
  conflict_count int;
  start_min int;
  end_min int;
  block_count int;
BEGIN
  -- Serialize all booking attempts for this date
  PERFORM pg_advisory_xact_lock(hashtextextended('reserve_day_' || p_date::text, 0));

  start_min := (split_part(p_time, ':', 1))::int * 60 + (split_part(p_time, ':', 2))::int;
  end_min := start_min + p_duration_min;

  IF p_unit_id IS NOT NULL THEN
    SELECT count(*) INTO block_count
    FROM public.unit_blocks b
    WHERE b.unit_id = p_unit_id
      AND b.start_date <= p_date
      AND b.end_date >= p_date;

    IF block_count > 0 THEN
      RAISE EXCEPTION 'unit_blocked' USING ERRCODE = 'P0001';
    END IF;

    SELECT count(*) INTO conflict_count
    FROM reservations r
    WHERE r.unit_id = p_unit_id
      AND r.reservation_date = p_date
      AND r.status NOT IN ('cancelled','checked_out')
      AND start_min < ((split_part(r.reservation_time, ':', 1))::int * 60
                       + (split_part(r.reservation_time, ':', 2))::int
                       + p_duration_min)
      AND end_min   > ((split_part(r.reservation_time, ':', 1))::int * 60
                       + (split_part(r.reservation_time, ':', 2))::int);

    IF conflict_count > 0 THEN
      RAISE EXCEPTION 'unit_conflict' USING ERRCODE = '23505';
    END IF;
  END IF;

  INSERT INTO reservations (
    customer_name, customer_email, customer_phone,
    reservation_date, reservation_time, guest_count,
    zone, occasion, unit_id, status, message, honeypot
  ) VALUES (
    p_payload->>'customer_name',
    p_payload->>'customer_email',
    p_payload->>'customer_phone',
    p_date,
    p_time,
    COALESCE((p_payload->>'guest_count')::int, 2),
    p_payload->>'zone',
    COALESCE(p_payload->>'occasion', 'Sonstiges'),
    p_unit_id,
    COALESCE(p_payload->>'status', 'confirmed'),
    COALESCE(p_payload->>'message', ''),
    ''
  )
  RETURNING id INTO new_id;

  RETURN new_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.reserve_billard_auto(p_date date, p_time text, p_duration_min integer, p_payload jsonb)
 RETURNS TABLE(reservation_id uuid, unit_id uuid)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  picked uuid;
  start_min int;
  end_min int;
  new_id uuid;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended('reserve_day_' || p_date::text, 0));

  start_min := (split_part(p_time, ':', 1))::int * 60 + (split_part(p_time, ':', 2))::int;
  end_min := start_min + p_duration_min;

  SELECT u.id INTO picked
  FROM units u
  WHERE u.area = 'billard'
    AND NOT EXISTS (
      SELECT 1 FROM public.unit_blocks b
      WHERE b.unit_id = u.id
        AND b.start_date <= p_date
        AND b.end_date >= p_date
    )
    AND NOT EXISTS (
      SELECT 1 FROM reservations r
      WHERE r.unit_id = u.id
        AND r.reservation_date = p_date
        AND r.status NOT IN ('cancelled','checked_out')
        AND start_min < ((split_part(r.reservation_time, ':', 1))::int * 60
                         + (split_part(r.reservation_time, ':', 2))::int
                         + p_duration_min)
        AND end_min   > ((split_part(r.reservation_time, ':', 1))::int * 60
                         + (split_part(r.reservation_time, ':', 2))::int)
    )
  ORDER BY NULLIF(regexp_replace(u.name, '\D', '', 'g'), '')::int NULLS LAST, u.name
  LIMIT 1;

  IF picked IS NULL THEN
    RAISE EXCEPTION 'no_free_billard' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO reservations (
    customer_name, customer_email, customer_phone,
    reservation_date, reservation_time, guest_count,
    zone, occasion, unit_id, status, message, honeypot
  ) VALUES (
    p_payload->>'customer_name',
    p_payload->>'customer_email',
    p_payload->>'customer_phone',
    p_date,
    p_time,
    COALESCE((p_payload->>'guest_count')::int, 2),
    'billard',
    COALESCE(p_payload->>'occasion', 'Warteliste'),
    picked,
    COALESCE(p_payload->>'status', 'confirmed'),
    COALESCE(p_payload->>'message', ''),
    ''
  )
  RETURNING id INTO new_id;

  RETURN QUERY SELECT new_id, picked;
END;
$function$;