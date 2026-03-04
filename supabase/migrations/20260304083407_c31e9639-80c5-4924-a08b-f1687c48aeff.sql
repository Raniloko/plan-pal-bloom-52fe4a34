ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS username text;
CREATE UNIQUE INDEX IF NOT EXISTS user_roles_username_unique ON public.user_roles (username) WHERE username IS NOT NULL;
UPDATE public.user_roles SET username = 'admin' WHERE role = 'admin'::app_role AND username IS NULL;