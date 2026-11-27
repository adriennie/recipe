-- Recipe Reader: tables for syncing recipes and the grocery list.
-- Run once in Supabase: Dashboard → SQL Editor → New query → paste → Run.
-- Every row belongs to the signed-in user, and row level security makes sure
-- people can only ever see and change their own rows.

create table if not exists public.recipes (
  id          uuid primary key,
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title       text not null default '',
  category    text not null default 'Other',
  ingredients text[] not null default '{}',
  steps       text[] not null default '{}',
  raw_text    text not null default '',
  favorite    boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.grocery_items (
  id          uuid primary key,
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  text        text not null,
  key         text not null,
  count       integer not null default 1,
  checked     boolean not null default false,
  sources     text[] not null default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists recipes_user_idx on public.recipes (user_id);
create index if not exists grocery_items_user_idx on public.grocery_items (user_id);

alter table public.recipes enable row level security;
alter table public.grocery_items enable row level security;

-- Recipes: owner only
drop policy if exists "recipes: owner can read" on public.recipes;
drop policy if exists "recipes: owner can insert" on public.recipes;
drop policy if exists "recipes: owner can update" on public.recipes;
drop policy if exists "recipes: owner can delete" on public.recipes;
create policy "recipes: owner can read"   on public.recipes for select to authenticated using ((select auth.uid()) = user_id);
create policy "recipes: owner can insert" on public.recipes for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "recipes: owner can update" on public.recipes for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "recipes: owner can delete" on public.recipes for delete to authenticated using ((select auth.uid()) = user_id);

-- Grocery list: owner only
drop policy if exists "grocery: owner can read" on public.grocery_items;
drop policy if exists "grocery: owner can insert" on public.grocery_items;
drop policy if exists "grocery: owner can update" on public.grocery_items;
drop policy if exists "grocery: owner can delete" on public.grocery_items;
create policy "grocery: owner can read"   on public.grocery_items for select to authenticated using ((select auth.uid()) = user_id);
create policy "grocery: owner can insert" on public.grocery_items for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "grocery: owner can update" on public.grocery_items for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "grocery: owner can delete" on public.grocery_items for delete to authenticated using ((select auth.uid()) = user_id);
