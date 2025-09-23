-- Neon Postgres schema for portfolio

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  summary text,
  tags text[] default '{}',
  repo_url text,
  live_url text,
  hero_image text,
  created_at timestamptz not null default now()
);

create table if not exists labs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  summary text,
  stack text[] default '{}',
  writeup_md text,
  created_at timestamptz not null default now()
);

create table if not exists writeups (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  summary text,
  tags text[] default '{}',
  published_at timestamptz,
  md_path text
);

create table if not exists reading (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  author text,
  year int,
  status text check (status in ('reading','finished','wishlist','reference','completed','in_progress')) not null default 'reading',
  notes text,
  added_at timestamptz not null default now()
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  subject text,
  body text not null,
  ip_hash text,
  created_at timestamptz not null default now()
);
