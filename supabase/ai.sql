-- Recipe Reader: extra database pieces for the AI features.
-- Run once in Supabase: SQL Editor → New query → paste → Run  (after schema.sql).

-- Shop section for each grocery item (Produce, Dairy & eggs, …), filled in by "Tidy my list".
alter table public.grocery_items add column if not exists section text;

-- Daily AI usage per person, so the bill can't run away.
create table if not exists public.ai_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  day     date not null default current_date,
  count   integer not null default 0,
  primary key (user_id, day)
);
alter table public.ai_usage enable row level security;
-- No policies: nobody reads or writes this table directly; only the function below touches it.

-- Adds one to today's count for the signed-in user and says whether they are still under the limit.
create or replace function public.use_ai_quota(daily_limit integer)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare n integer;
begin
  if auth.uid() is null then return false; end if;
  insert into public.ai_usage (user_id, day, count) values (auth.uid(), current_date, 1)
  on conflict (user_id, day) do update set count = public.ai_usage.count + 1
  returning count into n;
  return n <= daily_limit;
end $$;

revoke all on function public.use_ai_quota(integer) from public, anon;
grant execute on function public.use_ai_quota(integer) to authenticated;

notify pgrst, 'reload schema';
