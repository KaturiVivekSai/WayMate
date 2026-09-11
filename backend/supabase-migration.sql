-- ============================================================================
-- WAYMATE — SUPABASE COMPLETE DATABASE MIGRATION & SEED SCRIPT
-- ============================================================================
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/vaugkjqdavjqbbgsdfzs/sql
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. BASE SCHEMA & ALTERATIONS
-- ----------------------------------------------------------------------------

-- Ensure profiles table has all required columns and default 50 credits
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null unique,
  college text default 'PVPSIT Campus',
  avatar_url text,
  trust_score numeric default 4.9,
  credits integer not null default 50, -- Reduced starting balance of 50 credits
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  user_code text unique
);

-- Alter existing columns if table already existed
alter table public.profiles alter column credits set default 50;
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists vehicle_number text;
alter table public.profiles add column if not exists vehicle_model text;
alter table public.profiles add column if not exists bike_colour text default 'Not specified';
alter table public.profiles add column if not exists is_ev boolean default false;
alter table public.profiles add column if not exists rides_completed integer default 0;
alter table public.profiles add column if not exists rides_shared integer default 0;
alter table public.profiles add column if not exists reliability_score text default '99%';
alter table public.profiles add column if not exists mutual_connections integer default 5;
alter table public.profiles add column if not exists role text default 'Student (Hostel & Commuter)';

-- Vehicles
create table if not exists public.vehicles (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  vehicle_type text not null default 'Motorcycle / Scooter',
  brand text,
  model text,
  registration_number text,
  seats integer not null default 1,
  is_available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Ride Offers
create table if not exists public.ride_offers (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid not null references public.profiles(id) on delete cascade,
  vehicle_id uuid references public.vehicles(id) on delete set null,
  from_location text not null,
  to_location text not null,
  departure_time timestamptz not null,
  available_seats integer not null check (available_seats >= 0),
  credits_per_seat integer not null default 15 check (credits_per_seat >= 0),
  notes text,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

-- Ride Requests
create table if not exists public.ride_requests (
  id uuid primary key default gen_random_uuid(),
  ride_offer_id uuid references public.ride_offers(id) on delete cascade,
  requester_id uuid not null references public.profiles(id) on delete cascade,
  driver_id uuid references public.profiles(id) on delete set null,
  seats_requested integer not null default 1 check (seats_requested > 0),
  message text,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  responded_at timestamptz
);

-- Bike Lending Requests
create table if not exists public.bike_requests (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid references public.vehicles(id) on delete cascade,
  requester_id uuid not null references public.profiles(id) on delete cascade,
  owner_id uuid references public.profiles(id) on delete set null,
  start_time timestamptz not null,
  end_time timestamptz not null,
  message text,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  responded_at timestamptz
);

-- Bookings
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  ride_offer_id uuid references public.ride_offers(id) on delete set null,
  vehicle_id uuid references public.vehicles(id) on delete set null,
  ride_request_id uuid references public.ride_requests(id) on delete set null,
  bike_request_id uuid references public.bike_requests(id) on delete set null,
  start_time timestamptz not null,
  end_time timestamptz,
  credits_paid integer not null default 0,
  status text not null default 'upcoming',
  created_at timestamptz not null default now()
);

-- Credit Transactions
create table if not exists public.credit_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  amount integer not null,
  transaction_type text not null,
  description text not null,
  ride_request_id uuid references public.ride_requests(id) on delete set null,
  bike_request_id uuid references public.bike_requests(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Notifications
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  sender_id uuid references public.profiles(id) on delete set null,
  type text not null,
  title text not null,
  message text not null,
  ride_request_id uuid references public.ride_requests(id) on delete cascade,
  bike_request_id uuid references public.bike_requests(id) on delete cascade,
  booking_id uuid references public.bookings(id) on delete cascade,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 2. ROW LEVEL SECURITY (RLS) POLICIES
-- ----------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.vehicles enable row level security;
alter table public.ride_offers enable row level security;
alter table public.ride_requests enable row level security;
alter table public.bike_requests enable row level security;
alter table public.bookings enable row level security;
alter table public.credit_transactions enable row level security;
alter table public.notifications enable row level security;

-- Drop old policies to avoid duplicates on re-run
drop policy if exists "Profiles are publicly readable" on public.profiles;
drop policy if exists "Users can insert their own profile" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;

drop policy if exists "Vehicles are viewable by everyone" on public.vehicles;
drop policy if exists "Users can manage own vehicles" on public.vehicles;

drop policy if exists "Ride offers are viewable by everyone" on public.ride_offers;
drop policy if exists "Drivers can manage ride offers" on public.ride_offers;

drop policy if exists "Ride requests are viewable by participants" on public.ride_requests;
drop policy if exists "Users can manage ride requests" on public.ride_requests;

drop policy if exists "Bike requests viewable by participants" on public.bike_requests;
drop policy if exists "Users can manage bike requests" on public.bike_requests;

drop policy if exists "Bookings viewable by participants" on public.bookings;
drop policy if exists "Users can manage bookings" on public.bookings;

drop policy if exists "Credit transactions viewable by owner" on public.credit_transactions;
drop policy if exists "Users can manage transactions" on public.credit_transactions;

drop policy if exists "Notifications viewable by recipient" on public.notifications;
drop policy if exists "Users can manage notifications" on public.notifications;

-- PROFILES
create policy "Profiles are publicly readable"
  on public.profiles for select using (true);

create policy "Users can insert their own profile"
  on public.profiles for insert with check (true);

create policy "Users can update their own profile"
  on public.profiles for update using (true);

-- VEHICLES
create policy "Vehicles are viewable by everyone"
  on public.vehicles for select using (true);

create policy "Users can manage own vehicles"
  on public.vehicles for all using (true);

-- RIDE OFFERS
create policy "Ride offers are viewable by everyone"
  on public.ride_offers for select using (true);

create policy "Drivers can manage ride offers"
  on public.ride_offers for all using (true);

-- RIDE REQUESTS
create policy "Ride requests are viewable by participants"
  on public.ride_requests for select using (true);

create policy "Users can manage ride requests"
  on public.ride_requests for all using (true);

-- BIKE REQUESTS
create policy "Bike requests viewable by participants"
  on public.bike_requests for select using (true);

create policy "Users can manage bike requests"
  on public.bike_requests for all using (true);

-- BOOKINGS
create policy "Bookings viewable by participants"
  on public.bookings for select using (true);

create policy "Users can manage bookings"
  on public.bookings for all using (true);

-- CREDIT TRANSACTIONS
create policy "Credit transactions viewable by owner"
  on public.credit_transactions for select using (true);

create policy "Users can manage transactions"
  on public.credit_transactions for all using (true);

-- NOTIFICATIONS
create policy "Notifications viewable by recipient"
  on public.notifications for select using (true);

create policy "Users can manage notifications"
  on public.notifications for all using (true);

-- ----------------------------------------------------------------------------
-- 3. NEW USER TRIGGER (AUTOMATIC PROFILE & 50 STARTING CREDITS)
-- ----------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger as $$
declare
  next_code text;
  count_users integer;
begin
  select count(*) into count_users from public.profiles;
  next_code := 'WM' || lpad((100001 + count_users)::text, 6, '0');

  insert into public.profiles (
    id,
    full_name,
    email,
    college,
    avatar_url,
    trust_score,
    credits,
    user_code,
    phone,
    vehicle_number
  ) values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'college', 'PVPSIT Campus'),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'avatar', 'https://api.dicebear.com/9.x/initials/svg?seed=' || encode(new.email::bytea, 'hex')),
    5.0,
    50, -- Starting balance of 50 credits
    coalesce(new.raw_user_meta_data->>'user_code', next_code),
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'bike_number'
  )
  on conflict (id) do update set
    full_name = excluded.full_name,
    email = excluded.email;

  -- If vehicle/bike number was provided, register in vehicles table
  if new.raw_user_meta_data->>'bike_number' is not null and length(trim(new.raw_user_meta_data->>'bike_number')) > 0 then
    insert into public.vehicles (
      owner_id,
      vehicle_type,
      registration_number,
      seats,
      is_available
    ) values (
      new.id,
      'Motorcycle / Scooter',
      upper(trim(new.raw_user_meta_data->>'bike_number')),
      1,
      true
    )
    on conflict do nothing;
  end if;

  -- Initial welcome bonus transaction
  insert into public.credit_transactions (
    user_id,
    amount,
    transaction_type,
    description
  ) values (
    new.id,
    50,
    'WELCOME_BONUS',
    'Welcome to WayMate Community Credits'
  )
  on conflict do nothing;

  return new;
end;
$$ language plpgsql security definer;

-- Recreate trigger on auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ----------------------------------------------------------------------------
-- 4. SEED USERS: Vivek Sai, Lokesh, Kousik, Rohit
-- Password for all seed users: Password@123
-- ----------------------------------------------------------------------------

do $$
declare
  u_vivek_id uuid := '11111111-1111-1111-1111-111111111111';
  u_lokesh_id uuid := '22222222-2222-2222-2222-222222222222';
  u_kousik_id uuid := '33333333-3333-3333-3333-333333333333';
  u_rohit_id  uuid := '44444444-4444-4444-4444-444444444444';
  hashed_pwd  text;
  v_id1 uuid;
  v_id2 uuid;
  v_id3 uuid;
  v_id4 uuid;
begin
  -- Generate bcrypt hash for Password@123
  hashed_pwd := crypt('Password@123', gen_salt('bf'));

  -- Insert Vivek Sai into auth.users
  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at
  ) values (
    u_vivek_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    'vivek@campus.edu', hashed_pwd, now(),
    '{"full_name":"Vivek Sai","username":"vivek","user_code":"WM100001","bike_number":"AP-16-EK-5521"}'::jsonb,
    now(), now()
  ) on conflict (id) do update set encrypted_password = excluded.encrypted_password, email_confirmed_at = now();

  -- Insert Lokesh into auth.users
  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at
  ) values (
    u_lokesh_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    'lokesh@campus.edu', hashed_pwd, now(),
    '{"full_name":"Lokesh","username":"lokesh","user_code":"WM100002","bike_number":"AP-16-AB-1234"}'::jsonb,
    now(), now()
  ) on conflict (id) do update set encrypted_password = excluded.encrypted_password, email_confirmed_at = now();

  -- Insert Kousik into auth.users
  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at
  ) values (
    u_kousik_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    'kousik@campus.edu', hashed_pwd, now(),
    '{"full_name":"Kousik","username":"kousik","user_code":"WM100003","bike_number":"AP-16-BC-7890"}'::jsonb,
    now(), now()
  ) on conflict (id) do update set encrypted_password = excluded.encrypted_password, email_confirmed_at = now();

  -- Insert Rohit into auth.users
  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at
  ) values (
    u_rohit_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    'rohit@campus.edu', hashed_pwd, now(),
    '{"full_name":"Rohit","username":"rohit","user_code":"WM100004","bike_number":"AP-16-XY-4321"}'::jsonb,
    now(), now()
  ) on conflict (id) do update set encrypted_password = excluded.encrypted_password, email_confirmed_at = now();

  -- Insert profiles
  insert into public.profiles (
    id, full_name, email, college, avatar_url, trust_score, credits, user_code, phone, vehicle_number, vehicle_model, bike_colour, rides_completed, rides_shared, reliability_score, mutual_connections
  ) values
  (u_vivek_id, 'Vivek Sai', 'vivek@campus.edu', 'PVPSIT Campus Circle', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', 4.9, 75, 'WM100001', '+91 98765 01001', 'AP-16-EK-5521', 'Royal Enfield Classic 350', 'Stealth Black', 18, 12, '99%', 14),
  (u_lokesh_id, 'Lokesh', 'lokesh@campus.edu', 'Green Residency PG', 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80', 4.8, 50, 'WM100002', '+91 98765 01002', 'AP-16-AB-1234', 'Yamaha FZ-S', 'Midnight Blue', 14, 8, '98%', 9),
  (u_kousik_id, 'Kousik', 'kousik@campus.edu', 'Central PG Corridor', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', 4.9, 65, 'WM100003', '+91 98765 01003', 'AP-16-BC-7890', 'Honda Activa 6G', 'Pearl White', 22, 15, '99%', 18),
  (u_rohit_id, 'Rohit', 'rohit@campus.edu', 'Lakeview Hostel Block', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80', 4.7, 50, 'WM100004', '+91 98765 01004', 'AP-16-XY-4321', 'TVS Jupiter', 'Matte Blue', 9, 5, '97%', 6)
  on conflict (id) do update set
    full_name = excluded.full_name,
    credits = excluded.credits,
    trust_score = excluded.trust_score,
    user_code = excluded.user_code;

  -- Insert vehicles
  insert into public.vehicles (owner_id, vehicle_type, brand, model, registration_number, seats, is_available)
  values (u_vivek_id, 'Motorcycle', 'Royal Enfield', 'Classic 350', 'AP-16-EK-5521', 1, true)
  returning id into v_id1;

  insert into public.vehicles (owner_id, vehicle_type, brand, model, registration_number, seats, is_available)
  values (u_lokesh_id, 'Motorcycle', 'Yamaha', 'FZ-S Fi', 'AP-16-AB-1234', 1, true)
  returning id into v_id2;

  insert into public.vehicles (owner_id, vehicle_type, brand, model, registration_number, seats, is_available)
  values (u_kousik_id, 'Scooter', 'Honda', 'Activa 6G', 'AP-16-BC-7890', 1, true)
  returning id into v_id3;

  insert into public.vehicles (owner_id, vehicle_type, brand, model, registration_number, seats, is_available)
  values (u_rohit_id, 'Scooter', 'TVS', 'Jupiter', 'AP-16-XY-4321', 1, true)
  returning id into v_id4;

  -- Seed Active Ride Offers
  insert into public.ride_offers (driver_id, vehicle_id, from_location, to_location, departure_time, available_seats, credits_per_seat, notes, status)
  values
  (u_lokesh_id, v_id2, 'PVPSIT Parking', 'Green Residency PG', now() + interval '45 minutes', 1, 14, 'Leaving after lab class. Helmet available.', 'active'),
  (u_kousik_id, v_id3, 'Central Library', 'Central PG', now() + interval '1 hour 15 minutes', 1, 12, 'Heading towards PG corridor via Food Street.', 'active'),
  (u_rohit_id, v_id4, 'Main Block / Admin', 'Lakeview Hostel', now() + interval '2 hours', 1, 10, 'Short campus ride. Regular commuter.', 'active'),
  (u_vivek_id, v_id1, 'PVPSIT Parking', 'Metro Station (Purple Line)', now() + interval '3 hours', 1, 18, 'Evening commute to purple line metro gate.', 'active');

  -- Seed Credit Transactions
  insert into public.credit_transactions (user_id, amount, transaction_type, description)
  values
  (u_vivek_id, 50, 'WELCOME_BONUS', 'Welcome to WayMate Community Credits'),
  (u_vivek_id, 25, 'RIDE_EARNED', 'Shared journey with peer to Green Residency'),
  (u_lokesh_id, 50, 'WELCOME_BONUS', 'Welcome to WayMate Community Credits'),
  (u_kousik_id, 50, 'WELCOME_BONUS', 'Welcome to WayMate Community Credits'),
  (u_kousik_id, 15, 'RIDE_EARNED', 'Shared seat to Metro Station'),
  (u_rohit_id, 50, 'WELCOME_BONUS', 'Welcome to WayMate Community Credits');

end $$;
