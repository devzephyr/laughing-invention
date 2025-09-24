-- Minimal schema for the portfolio (Neon Postgres)

create table if not exists messages (
  id bigserial primary key,
  name text not null,
  email text not null,
  subject text,
  body text not null,
  ip_hash text,
  user_agent text,
  created_at timestamptz not null default now()
);
create index if not exists idx_messages_created_at on messages (created_at desc);
create index if not exists idx_messages_ip_created_at on messages (ip_hash, created_at desc);

create table if not exists projects (
  id bigserial primary key,
  title text not null,
  slug text not null unique,
  summary text,
  tags text[],
  repo_url text,
  live_url text,
  hero_image text,
  created_at timestamptz not null default now()
);
create index if not exists idx_projects_created_at on projects (created_at desc);

create table if not exists labs (
  id bigserial primary key,
  title text not null,
  slug text not null unique,
  summary text,
  stack text[],
  writeup_md text,
  created_at timestamptz not null default now()
);
create index if not exists idx_labs_created_at on labs (created_at desc);

create table if not exists writeups (
  id bigserial primary key,
  title text not null,
  slug text not null unique,
  summary text,
  published_at timestamptz,
  md_path text
);
create index if not exists idx_writeups_pub on writeups (coalesce(published_at, now()) desc);

create table if not exists reading (
  id bigserial primary key,
  title text not null,
  author text,
  year int,
  status text not null,
  notes text,
  added_at timestamptz not null default now()
);
create index if not exists idx_reading_added_at on reading (added_at desc);

