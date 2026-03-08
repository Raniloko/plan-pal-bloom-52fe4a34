
-- Move billard Tisch 1-3 to hauptbereich as "Billard 1/2/3"
UPDATE public.units SET area = 'hauptbereich', name = 'Billard 1' WHERE id = '62d6743a-695b-4817-bc90-aebb770155ec';
UPDATE public.units SET area = 'hauptbereich', name = 'Billard 2' WHERE id = '4fd4f79b-8f48-4a40-92eb-a6e7706f0050';
UPDATE public.units SET area = 'hauptbereich', name = 'Billard 3' WHERE id = '2ac5c33c-91bf-4e8c-94b6-430055d38d6c';

-- Rename billard Tisch 4-8 to "Billard 4-8"
UPDATE public.units SET name = 'Billard 4' WHERE id = '0d9cfaec-7449-4e29-9690-17f62d42b2ef';
UPDATE public.units SET name = 'Billard 5' WHERE id = '63b5f540-f4aa-4060-8be7-1c072031db21';
UPDATE public.units SET name = 'Billard 6' WHERE id = '578cef72-d38b-4086-bbb6-f978b49bddbc';
UPDATE public.units SET name = 'Billard 7' WHERE id = 'a7daa13d-e3ea-44b1-9664-6db971558e4b';
UPDATE public.units SET name = 'Billard 8' WHERE id = 'afb349b4-ec28-4be4-9745-de6c312f89d3';

-- Add hauptbereich restaurant tables
INSERT INTO public.units (name, area, capacity, position_index, status) VALUES
  ('Tisch 10', 'hauptbereich', 4, 10, 'free'),
  ('Tisch 30', 'hauptbereich', 4, 30, 'free'),
  ('Tisch 50', 'hauptbereich', 6, 50, 'free'),
  ('Tisch 52', 'hauptbereich', 6, 52, 'free'),
  ('Tisch 53', 'hauptbereich', 6, 53, 'free'),
  ('Tisch 54', 'hauptbereich', 10, 54, 'free'),
  ('Tisch 59', 'hauptbereich', 4, 59, 'free'),
  ('Tisch 60', 'hauptbereich', 4, 60, 'free'),
  ('Tisch 61', 'hauptbereich', 4, 61, 'free'),
  ('Tisch 62', 'hauptbereich', 4, 62, 'free'),
  ('Tisch 63', 'hauptbereich', 4, 63, 'free'),
  ('Tisch 64', 'hauptbereich', 4, 64, 'free'),
  ('Tisch 65', 'hauptbereich', 4, 65, 'free'),
  ('Tisch 66', 'hauptbereich', 4, 66, 'free'),
  ('Tisch 67', 'hauptbereich', 4, 67, 'free');

-- Add fenster tables
INSERT INTO public.units (name, area, capacity, position_index, status) VALUES
  ('Tisch F1', 'fenster', 4, 1, 'free'),
  ('Tisch F2', 'fenster', 4, 2, 'free'),
  ('Tisch F3', 'fenster', 4, 3, 'free'),
  ('Tisch F4', 'fenster', 4, 4, 'free'),
  ('Tisch F5', 'fenster', 6, 5, 'free'),
  ('Tisch F6', 'fenster', 6, 6, 'free'),
  ('Tisch F7', 'fenster', 6, 7, 'free'),
  ('Tisch F8', 'fenster', 10, 8, 'free');
