-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Users Table (Public profile info linked to auth.users)
create table if not exists public.users (
  user_id uuid references auth.users(id) primary key,
  student_id text unique,
  first_name text,
  last_name text,
  email text
);

-- 2. Programs Table
create table if not exists public.programs (
  program_id uuid default uuid_generate_v4() primary key,
  program_name text unique,
  degree_type text
);

-- 3. Student Profiles Table
create table if not exists public.student_profiles (
  profile_id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(user_id),
  program_id uuid references public.programs(program_id),
  housing_type text,
  meal_plan text,
  dorm_room_type text,
  expected_graduation_date text,
  unique(user_id)
);

-- 4. Student Academic Status Table (for GPA)
-- NOTE: If this is a view in your existing DB, skip creating it as a table.
-- create table if not exists public.student_academic_status (
--    status_id uuid default uuid_generate_v4() primary key,
--    student_id text references public.users(student_id),
--    cumulative_gpa numeric default 0.0,
--    academic_standing text default 'Good Standing',
--    unique(student_id)
-- );

-- RLS Policies
alter table public.users enable row level security;
alter table public.programs enable row level security;
alter table public.student_profiles enable row level security;
-- alter table public.student_academic_status enable row level security;

-- Allow users to view/edit their own data
create policy "Users can view own profile" on public.users for select using (auth.uid() = user_id);
create policy "Users can insert own profile" on public.users for insert with check (auth.uid() = user_id);
create policy "Users can update own profile" on public.users for update using (auth.uid() = user_id);

-- Profiles
create policy "Users can view own student profile" on public.student_profiles for select using (auth.uid() = user_id);
create policy "Users can insert own student profile" on public.student_profiles for insert with check (auth.uid() = user_id);
create policy "Users can update own student profile" on public.student_profiles for update using (auth.uid() = user_id);

-- Programs (Readable by all, insertable by authenticated users for now)
create policy "Programs are viewable by everyone" on public.programs for select using (true);
create policy "Authenticated users can insert programs" on public.programs for insert with check (auth.role() = 'authenticated');

-- Academic Status
-- create policy "Users can view own academic status" on public.student_academic_status for select using (
--    student_id in (select student_id from public.users where user_id = auth.uid())
-- );
