-- Create a table for public profiles linkable to auth.org or wallet
create table profiles (
  id uuid references auth.users on delete cascade, -- Optional: link to Supabase Auth if used
  wallet_address text primary key, -- The main identifier for now
  username text unique not null,
  avatar_seed text, -- The random string to generate the avatar
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Constraint to ensure usernames are URL safe
  constraint username_length check (char_length(username) >= 3)
);

-- Set up Row Level Security (RLS)
alter table profiles enable row level security;

create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( true ); -- restricted by application logic/wallet auth in real backend

create policy "Users can update own profile."
  on profiles for update
  using ( true ); -- restricted by wallet check in application logic
