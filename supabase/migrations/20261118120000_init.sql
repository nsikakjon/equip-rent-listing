-- EquipRent: initial schema
-- Money is stored in kobo (bigint) to avoid floating point errors. ₦1 = 100 kobo.

create extension if not exists "pgcrypto";

-- Equipment categories. commission_rate is the owner commission for third-party listings.
create table public.categories (
  slug            text primary key,
  name            text not null,
  kind            text not null check (kind in ('heavy_plant', 'small_tools')),
  commission_rate numeric(5,4) not null check (commission_rate >= 0 and commission_rate < 0.5),
  sort_order      int not null default 0
);

-- Owners: yards and individuals who list equipment.
create table public.owners (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  business_name text,
  phone         text not null,
  email         text,
  verified      boolean not null default false,
  created_at    timestamptz not null default now()
);

-- Listings. owner_id null + is_own_inventory = our own stock (no commission).
create table public.listings (
  id                   bigint generated always as identity primary key,
  owner_id             uuid references public.owners(id) on delete set null,
  is_own_inventory     boolean not null default false,
  category_slug        text not null references public.categories(slug),
  title                text not null,
  description          text not null default '',
  area                 text not null,
  daily_rate_kobo      bigint not null check (daily_rate_kobo > 0),
  equipment_value_kobo bigint not null default 0 check (equipment_value_kobo >= 0),
  operator_available   boolean not null default false,
  operator_daily_kobo  bigint not null default 0 check (operator_daily_kobo >= 0),
  delivery_available   boolean not null default true,
  image_url            text,
  status               text not null default 'pending' check (status in ('pending', 'active', 'paused')),
  created_at           timestamptz not null default now()
);
create index listings_category_idx on public.listings (category_slug) where status = 'active';

-- Bookings. Every amount is frozen at quote time so later fee changes never alter a booking.
create table public.bookings (
  id                  uuid primary key default gen_random_uuid(),
  reference           text not null unique,
  listing_id          bigint not null references public.listings(id),
  channel             text not null check (channel in ('web', 'whatsapp')),
  renter_name         text not null,
  renter_phone        text not null,
  renter_email        text,
  site_address        text not null default '',
  start_date          date not null,
  days                int not null check (days between 1 and 365),
  with_operator       boolean not null default false,
  wants_delivery      boolean not null default false,
  damage_waiver       boolean not null default true,
  rental_kobo         bigint not null,
  operator_kobo       bigint not null default 0,
  service_fee_kobo    bigint not null,
  waiver_kobo         bigint not null default 0,
  deposit_kobo        bigint not null default 0,
  delivery_kobo       bigint,              -- null until ops quotes haulage
  commission_kobo     bigint not null,
  owner_payout_kobo   bigint not null,
  total_due_kobo      bigint not null,     -- what the renter pays now (excludes delivery until quoted)
  status              text not null default 'requested' check (status in (
                        'requested', 'confirmed', 'paid', 'on_hire', 'returned', 'payout_released', 'cancelled')),
  payment_provider    text check (payment_provider in ('paystack', 'flutterwave')),
  payment_reference   text,
  paid_at             timestamptz,
  created_at          timestamptz not null default now()
);
create index bookings_renter_phone_idx on public.bookings (renter_phone, created_at desc);

-- WhatsApp conversation state, keyed by the sender's phone (E.164 without +).
create table public.whatsapp_sessions (
  phone      text primary key,
  state      jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Row level security: the public (anon key) may only read categories and active listings.
-- All writes go through the server with the service role key.
alter table public.categories        enable row level security;
alter table public.owners            enable row level security;
alter table public.listings          enable row level security;
alter table public.bookings          enable row level security;
alter table public.whatsapp_sessions enable row level security;

create policy "categories are public" on public.categories for select using (true);
create policy "active listings are public" on public.listings for select using (status = 'active');
