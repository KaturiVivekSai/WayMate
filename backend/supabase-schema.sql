-- WAYMATE — Supabase/PostgreSQL schema
-- Intentionally mirrors the supplied database diagram exactly.
-- Do not add application-specific tables here without updating the agreed schema.

create extension if not exists "pgcrypto";

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null unique,
  college text,
  avatar_url text,
  trust_score numeric,
  credits integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  user_code text unique
);

create table if not exists vehicles (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id) on delete cascade,
  vehicle_type text not null,
  brand text,
  model text,
  registration_number text unique,
  seats integer not null default 1,
  is_available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists ride_offers (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid not null references profiles(id) on delete cascade,
  vehicle_id uuid references vehicles(id) on delete set null,
  from_location text not null,
  to_location text not null,
  departure_time timestamptz not null,
  available_seats integer not null check (available_seats >= 0),
  credits_per_seat integer not null default 0 check (credits_per_seat >= 0),
  notes text,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create table if not exists ride_requests (
  id uuid primary key default gen_random_uuid(),
  ride_offer_id uuid references ride_offers(id) on delete cascade,
  requester_id uuid not null references profiles(id) on delete cascade,
  driver_id uuid references profiles(id) on delete set null,
  seats_requested integer not null default 1 check (seats_requested > 0),
  message text,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  responded_at timestamptz
);

create table if not exists bike_requests (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid references vehicles(id) on delete cascade,
  requester_id uuid not null references profiles(id) on delete cascade,
  owner_id uuid references profiles(id) on delete set null,
  start_time timestamptz not null,
  end_time timestamptz not null,
  message text,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  responded_at timestamptz
);

create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  ride_offer_id uuid references ride_offers(id) on delete set null,
  vehicle_id uuid references vehicles(id) on delete set null,
  ride_request_id uuid references ride_requests(id) on delete set null,
  bike_request_id uuid references bike_requests(id) on delete set null,
  start_time timestamptz not null,
  end_time timestamptz,
  credits_paid integer not null default 0,
  status text not null default 'upcoming',
  created_at timestamptz not null default now()
);

create table if not exists credit_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  amount integer not null,
  transaction_type text not null,
  description text not null,
  ride_request_id uuid references ride_requests(id) on delete set null,
  bike_request_id uuid references bike_requests(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references profiles(id) on delete cascade,
  sender_id uuid references profiles(id) on delete set null,
  type text not null,
  title text not null,
  message text not null,
  ride_request_id uuid references ride_requests(id) on delete cascade,
  bike_request_id uuid references bike_requests(id) on delete cascade,
  booking_id uuid references bookings(id) on delete cascade,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists ride_offers_route_idx on ride_offers(from_location, to_location);
create index if not exists ride_offers_departure_idx on ride_offers(departure_time);
create index if not exists ride_requests_offer_idx on ride_requests(ride_offer_id);
create index if not exists ride_requests_created_idx on ride_requests(created_at);
create index if not exists bookings_ride_idx on bookings(ride_offer_id);
create index if not exists bookings_created_idx on bookings(created_at);
create index if not exists vehicles_owner_idx on vehicles(owner_id);
create index if not exists credit_transactions_user_idx on credit_transactions(user_id);
create index if not exists notifications_recipient_idx on notifications(recipient_id, is_read);

-- Supplied diagram has no events table. Upcoming event cards therefore remain a
-- presentation/seed layer until an agreed schema extension is approved.
