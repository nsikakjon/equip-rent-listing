-- Categories and commission rates from the Lagos business model:
-- 10–15% for heavy plant (we default to 12%), 15–25% for small tools (we default to 20%).
insert into public.categories (slug, name, kind, commission_rate, sort_order) values
  ('excavators',   'Excavators',               'heavy_plant', 0.12, 1),
  ('cranes',       'Cranes',                   'heavy_plant', 0.12, 2),
  ('loaders',      'Loaders & backhoes',       'heavy_plant', 0.12, 3),
  ('tippers',      'Tippers & trucks',         'heavy_plant', 0.12, 4),
  ('scaffolding',  'Scaffolding & props',      'small_tools', 0.20, 5),
  ('formwork',     'Formwork panels',          'small_tools', 0.20, 6),
  ('mixers',       'Concrete mixers',          'small_tools', 0.20, 7),
  ('vibrators',    'Poker vibrators',          'small_tools', 0.20, 8),
  ('compactors',   'Plate compactors',         'small_tools', 0.20, 9),
  ('power',        'Generators & water pumps', 'small_tools', 0.20, 10)
on conflict (slug) do nothing;

-- Starter own-inventory listings (cheap, fast-moving site equipment). Prices are placeholders:
-- confirm with 3–5 Lagos yards before launch.
insert into public.listings
  (is_own_inventory, category_slug, title, description, area, daily_rate_kobo, equipment_value_kobo, status)
values
  (true, 'mixers',      'Half-bag diesel concrete mixer', 'Diesel, towable. Ideal for slabs and columns.', 'Lekki', 2500000, 120000000, 'active'),
  (true, 'vibrators',   'Petrol poker vibrator, 6 m hose', 'Honda engine with 45 mm needle.', 'Lekki', 1200000, 45000000, 'active'),
  (true, 'compactors',  'Plate compactor, 90 kg',         'For interlocking, sub-base and trenches.', 'Ikeja', 1800000, 95000000, 'active'),
  (true, 'scaffolding', 'H-frame scaffolding set (20 frames)', 'Frames, braces, base jacks and planks.', 'Ajah', 3000000, 250000000, 'active'),
  (true, 'formwork',    'Steel formwork panels (50 m²)',  'Raft and slab work. Ties included.', 'Ajah', 4500000, 400000000, 'active'),
  (true, 'power',       '20 kVA soundproof generator',    'Diesel. Fuel not included.', 'Ikeja', 3500000, 650000000, 'active');
