-- =====================================================
-- Resort Manager Pro - Supabase Schema
-- Run this in Supabase SQL Editor
-- =====================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- =====================================================
-- USERS / AUTH TABLE
-- =====================================================
create table if not exists user_logins (
  id bigserial primary key,
  username text unique not null,
  password_hash text not null,
  role text not null default 'staff', -- owner | admin | staff
  display_name text,
  permissions text default 'all',
  created_at timestamptz default now()
);

-- =====================================================
-- RESORT PROFILE
-- =====================================================
create table if not exists resort_profile (
  id bigserial primary key,
  name text default 'My Resort',
  image_url text default '',
  updated_at timestamptz default now()
);
insert into resort_profile (name) values ('Resort Manager Pro') on conflict do nothing;

-- =====================================================
-- ROOMS
-- =====================================================
create table if not exists rooms (
  id bigserial primary key,
  name text not null,
  bathroom_type text default 'private', -- private | separate | shared
  price_per_night numeric default 0,
  max_guests integer default 2,
  description text default '',
  status text default 'available', -- available | maintenance | unavailable
  images jsonb default '[]',
  amenities text default '',
  extra_bed_price numeric default 0,
  room_label text default '',
  weekend_price_fri numeric default 0,
  weekend_price_sat numeric default 0,
  weekend_price_sun numeric default 0,
  holiday_price numeric default 0,
  extra_bed_adult_price numeric default 0,
  extra_bed_child_price numeric default 0,
  extra_bed_adult_holiday_price numeric default 0,
  extra_bed_child_holiday_price numeric default 0,
  created_at timestamptz default now()
);

-- =====================================================
-- BOOKINGS
-- =====================================================
create table if not exists bookings (
  id bigserial primary key,
  customer_name text not null,
  customer_phone text default '',
  customer_email text default '',
  customer_line text default '',
  room_id bigint references rooms(id) on delete set null,
  room_name text default '',
  check_in date not null,
  check_out date not null,
  guests integer default 1,
  nights integer default 1,
  total_price numeric default 0,
  status text default 'pending', -- pending | confirmed | checked_in | checked_out | cancelled
  payment_status text default 'unpaid', -- unpaid | deposit | paid
  notes text default '',
  created_at timestamptz default now(),
  created_by text default '',
  deposit_amount numeric default 0,
  deposit_paid_at timestamptz,
  remaining_balance numeric default 0,
  extra_beds integer default 0,
  extra_bed_total numeric default 0,
  extra_beds_adult integer default 0,
  extra_beds_child integer default 0,
  booking_source text default 'walkin'
);

-- =====================================================
-- TRANSACTIONS (Income/Expense)
-- =====================================================
create table if not exists transactions (
  id bigserial primary key,
  date date not null,
  category text not null,
  type text not null, -- income | expense
  amount numeric not null default 0,
  description text default '',
  created_by text default '',
  created_at timestamptz default now()
);

-- =====================================================
-- CATEGORIES
-- =====================================================
create table if not exists categories (
  id bigserial primary key,
  name text not null,
  type text not null, -- income | expense
  color text default '#4361ee',
  created_at timestamptz default now()
);

-- Default categories
insert into categories (name, type, color) values
  ('ค่าห้องพัก', 'income', '#10b981'),
  ('รายได้อื่นๆ', 'income', '#3b82f6'),
  ('ค่าอาหาร', 'expense', '#ef4444'),
  ('ค่าไฟฟ้า', 'expense', '#f59e0b'),
  ('ค่าน้ำ', 'expense', '#06b6d4'),
  ('ค่าซ่อมบำรุง', 'expense', '#8b5cf6'),
  ('ค่าแรงงาน', 'expense', '#ec4899'),
  ('ค่าใช้จ่ายอื่นๆ', 'expense', '#64748b')
on conflict do nothing;

-- =====================================================
-- BUDGETS
-- =====================================================
create table if not exists budgets (
  id bigserial primary key,
  month_year text not null, -- format: 2025-01
  category_name text not null,
  amount numeric default 0,
  created_at timestamptz default now(),
  unique(month_year, category_name)
);

-- =====================================================
-- PDF CONFIG (stored per user in browser localStorage is fine,
-- but for server-side persistence use this table)
-- =====================================================
create table if not exists pdf_config (
  id bigserial primary key,
  resort_name text default '',
  prefix text default 'RCI',
  address text default '',
  phone text default '',
  facebook text default '',
  email text default '',
  signer text default '',
  pay_method text default '',
  notes text default '',
  terms text default '',
  logo_url text default '',
  signature_url text default '',
  updated_at timestamptz default now()
);
insert into pdf_config (resort_name) values ('') on conflict do nothing;

-- =====================================================
-- ROW LEVEL SECURITY (Optional - disable for simplicity)
-- For production, enable and configure per your auth strategy
-- =====================================================
-- alter table rooms enable row level security;
-- alter table bookings enable row level security;
-- etc.

-- =====================================================
-- INDEXES for performance
-- =====================================================
create index if not exists idx_bookings_room_id on bookings(room_id);
create index if not exists idx_bookings_check_in on bookings(check_in);
create index if not exists idx_bookings_status on bookings(status);
create index if not exists idx_transactions_date on transactions(date);
create index if not exists idx_transactions_type on transactions(type);

-- =====================================================
-- INSERT DEFAULT OWNER (change password after setup!)
-- Password is stored as plaintext here for simplicity.
-- In production, use bcrypt hashing.
-- =====================================================
insert into user_logins (username, password_hash, role, display_name, permissions)
values ('admin', 'admin123', 'owner', 'Administrator', 'all')
on conflict (username) do nothing;
