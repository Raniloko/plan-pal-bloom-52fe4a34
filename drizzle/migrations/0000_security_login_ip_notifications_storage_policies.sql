-- 1) Track source IP of login attempts so lockouts can be scoped per IP
ALTER TABLE public.login_attempts ADD COLUMN IF NOT EXISTS ip text NOT NULL DEFAULT 'unknown';
CREATE INDEX IF NOT EXISTS login_attempts_email_ip_idx ON public.login_attempts (email, ip, attempted_at DESC);

-- 2) Explicit admin-only SELECT policy on notifications
DROP POLICY IF EXISTS "Admins can read notifications" ON public.notifications;
CREATE POLICY "Admins can read notifications"
ON public.notifications
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 3) Admin-only object policies for the private backup bucket
DROP POLICY IF EXISTS "Admins read database export objects" ON storage.objects;
CREATE POLICY "Admins read database export objects"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'database_export_18_09_26' AND public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins insert database export objects" ON storage.objects;
CREATE POLICY "Admins insert database export objects"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'database_export_18_09_26' AND public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins update database export objects" ON storage.objects;
CREATE POLICY "Admins update database export objects"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'database_export_18_09_26' AND public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (bucket_id = 'database_export_18_09_26' AND public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins delete database export objects" ON storage.objects;
CREATE POLICY "Admins delete database export objects"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'database_export_18_09_26' AND public.has_role(auth.uid(), 'admin'::app_role));