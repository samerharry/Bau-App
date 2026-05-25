-- ══════════════════════════════════════════════════════════════════════════════
-- Bauabnahme App – Supabase SQL Schema
-- Ausführen in: Supabase Dashboard → SQL Editor → New Query → Run
-- ══════════════════════════════════════════════════════════════════════════════

create table if not exists projects (
  id              uuid default gen_random_uuid() primary key,
  user_id         uuid references auth.users not null,
  name            text not null,
  customer        text not null,
  address         text default '',
  inspection_date date,
  building_data   jsonb default '{}',
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create table if not exists checklist_items (
  id                uuid default gen_random_uuid() primary key,
  project_id        uuid references projects(id) on delete cascade not null,
  user_id           uuid references auth.users not null,
  category          text not null,
  title             text not null,
  description       text default '',
  is_checked        boolean default false,
  is_mandatory      boolean default true,
  is_not_applicable boolean default false,
  is_custom         boolean default false,
  notes             text default '',
  sort_order        integer default 0,
  created_at        timestamptz default now()
);

create table if not exists photos (
  id                uuid default gen_random_uuid() primary key,
  checklist_item_id uuid references checklist_items(id) on delete cascade not null,
  user_id           uuid references auth.users not null,
  data_url          text not null,
  description       text default '',
  taken_at          timestamptz default now()
);

create table if not exists floor_plans (
  id          uuid default gen_random_uuid() primary key,
  project_id  uuid references projects(id) on delete cascade not null,
  user_id     uuid references auth.users not null,
  name        text not null default 'Grundriss',
  data_url    text not null,
  created_at  timestamptz default now()
);

create table if not exists floor_plan_pins (
  id            uuid default gen_random_uuid() primary key,
  floor_plan_id uuid references floor_plans(id) on delete cascade not null,
  user_id       uuid references auth.users not null,
  label         text not null default '',
  x_pct         float not null,
  y_pct         float not null,
  description   text default '',
  created_at    timestamptz default now()
);

create table if not exists pin_photos (
  id            uuid default gen_random_uuid() primary key,
  pin_id        uuid references floor_plan_pins(id) on delete cascade not null,
  user_id       uuid references auth.users not null,
  data_url      text not null,
  description   text default '',
  taken_at      timestamptz default now()
);

-- Row Level Security (jeder Nutzer sieht nur seine eigenen Daten)
alter table projects        enable row level security;
alter table checklist_items enable row level security;
alter table photos          enable row level security;
alter table floor_plans     enable row level security;
alter table floor_plan_pins enable row level security;
alter table pin_photos      enable row level security;

drop policy if exists "own projects"    on projects;
drop policy if exists "own items"       on checklist_items;
drop policy if exists "own photos"      on photos;
drop policy if exists "own floor plans" on floor_plans;
drop policy if exists "own floor pins"  on floor_plan_pins;
drop policy if exists "own pin photos"  on pin_photos;

create policy "own projects"    on projects        for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own items"       on checklist_items for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own photos"      on photos          for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own floor plans" on floor_plans     for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own floor pins"  on floor_plan_pins for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own pin photos"  on pin_photos      for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
