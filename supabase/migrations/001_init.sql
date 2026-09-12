begin;

create extension if not exists pgcrypto;

-- Profiles (progression totals are server-authoritative; users can read only)
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),

  level int not null default 1 check (level >= 1),
  xp int not null default 0 check (xp >= 0),
  gold int not null default 0 check (gold >= 0),

  streak_count int not null default 0 check (streak_count >= 0),
  last_active_date date,

  display_name text,
  theme text not null default 'neon',
  equipped_badge text
);

-- Attributes (read-only to user; updated by RPC)
create table if not exists public.attributes (
  user_id uuid primary key references auth.users(id) on delete cascade,
  strength_xp int not null default 0 check (strength_xp >= 0),
  intellect_xp int not null default 0 check (intellect_xp >= 0),
  focus_xp int not null default 0 check (focus_xp >= 0),
  vitality_xp int not null default 0 check (vitality_xp >= 0)
);

-- Quests
-- IMPORTANT: user_id defaults to auth.uid() so client inserts work with RLS.
create table if not exists public.quests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),

  title text not null,
  notes text,
  category text not null,
  difficulty text not null,
  is_archived boolean not null default false,

  constraint quests_title_len check (char_length(title) between 1 and 120),
  constraint quests_notes_len check (notes is null or char_length(notes) <= 240),
  constraint quests_category_check check (category in ('strength','intellect','focus','vitality')),
  constraint quests_difficulty_check check (difficulty in ('easy','medium','hard'))
);

create index if not exists quests_user_id_idx on public.quests(user_id);

-- Completion log (immutable to the client)
create table if not exists public.quest_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  quest_id uuid not null references public.quests(id) on delete cascade,
  completed_at timestamptz not null default now(),
  xp_earned int not null check (xp_earned >= 0),
  gold_earned int not null check (gold_earned >= 0)
);

create index if not exists completions_user_time_idx on public.quest_completions(user_id, completed_at desc);

-- Shop items
create table if not exists public.shop_items (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  type text not null,
  price int not null check (price >= 0),
  metadata jsonb not null default '{}'::jsonb,
  constraint shop_items_type_check check (type in ('theme','badge')),
  constraint shop_items_name_unique unique (name)
);

-- Inventory
create table if not exists public.inventory (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  item_id uuid not null references public.shop_items(id) on delete cascade,
  acquired_at timestamptz not null default now(),
  primary key (user_id, item_id)
);

-- Seed shop items
insert into public.shop_items (name, type, price, metadata)
values
  ('Neon Pulse Theme', 'theme', 40, '{"theme":"neon_pulse"}'),
  ('Chrome Sigil Badge', 'badge', 25, '{"badge":"chrome_sigil"}'),
  ('Void Runner Badge', 'badge', 60, '{"badge":"void_runner"}')
on conflict (name) do nothing;

-- Create profile + attributes on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles(user_id, display_name)
  values (new.id, split_part(new.email, '@', 1))
  on conflict (user_id) do nothing;

  insert into public.attributes(user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.attributes enable row level security;
alter table public.quests enable row level security;
alter table public.quest_completions enable row level security;
alter table public.shop_items enable row level security;
alter table public.inventory enable row level security;

-- Policies
create policy "profiles_select_own"
on public.profiles for select
using (auth.uid() = user_id);

create policy "profiles_no_direct_update"
on public.profiles for update
using (false);

create policy "attributes_select_own"
on public.attributes for select
using (auth.uid() = user_id);

create policy "attributes_no_direct_update"
on public.attributes for update
using (false);

create policy "quests_select_own"
on public.quests for select
using (auth.uid() = user_id);

create policy "quests_insert_own"
on public.quests for insert
with check (auth.uid() = user_id);

create policy "quests_update_own"
on public.quests for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "quests_delete_own"
on public.quests for delete
using (auth.uid() = user_id);

create policy "completions_select_own"
on public.quest_completions for select
using (auth.uid() = user_id);

create policy "completions_no_insert"
on public.quest_completions for insert
with check (false);

create policy "shop_items_select_all"
on public.shop_items for select
using (true);

create policy "inventory_select_own"
on public.inventory for select
using (auth.uid() = user_id);

create policy "inventory_no_insert"
on public.inventory for insert
with check (false);

-- Grants
grant usage on schema public to anon, authenticated;

grant select on public.profiles to authenticated;
grant select on public.attributes to authenticated;

grant select, insert, update, delete on public.quests to authenticated;
grant select on public.quest_completions to authenticated;

grant select on public.shop_items to authenticated;
grant select on public.inventory to authenticated;

-- XP curve helper
create or replace function public.total_xp_for_level(p_level int)
returns int
language sql
immutable
as $$
  select floor(75 * power(p_level - 1, 2) + 100 * (p_level - 1))::int;
$$;

-- Settings update (optional; not used by UI yet)
create or replace function public.update_settings(p_display_name text, p_theme text, p_equipped_badge text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set
    display_name = nullif(trim(p_display_name), ''),
    theme = coalesce(nullif(trim(p_theme), ''), theme),
    equipped_badge = nullif(trim(p_equipped_badge), '')
  where user_id = auth.uid();
end;
$$;

-- Initial complete_quest (will be replaced by 002 for daily habits)
create or replace function public.complete_quest(p_quest_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_category text;
  v_difficulty text;
  v_xp int;
  v_gold int;

  v_old_level int;
  v_new_level int;
  v_new_xp int;
  v_leveled boolean := false;

  v_last date;
  v_streak int;
  v_today date := current_date;
begin
  if v_user is null then
    raise exception 'Not authenticated';
  end if;

  select q.category, q.difficulty
    into v_category, v_difficulty
  from public.quests q
  where q.id = p_quest_id and q.user_id = v_user and q.is_archived = false;

  if not found then
    raise exception 'Quest not found';
  end if;

  if v_difficulty = 'easy' then
    v_xp := 15; v_gold := 5;
  elsif v_difficulty = 'medium' then
    v_xp := 35; v_gold := 12;
  else
    v_xp := 60; v_gold := 20;
  end if;

  insert into public.quest_completions(user_id, quest_id, xp_earned, gold_earned)
  values (v_user, p_quest_id, v_xp, v_gold);

  select last_active_date, streak_count, level, xp
    into v_last, v_streak, v_old_level, v_new_xp
  from public.profiles
  where user_id = v_user
  for update;

  if v_last = v_today then
    v_streak := v_streak;
  elsif v_last = (v_today - 1) then
    v_streak := v_streak + 1;
  else
    v_streak := 1;
  end if;

  v_new_xp := v_new_xp + v_xp;

  v_new_level := v_old_level;
  while v_new_xp >= public.total_xp_for_level(v_new_level + 1) loop
    v_new_level := v_new_level + 1;
    v_leveled := true;
  end loop;

  update public.profiles
  set
    xp = v_new_xp,
    gold = gold + v_gold,
    level = v_new_level,
    last_active_date = v_today,
    streak_count = v_streak
  where user_id = v_user;

  if v_category = 'strength' then
    update public.attributes set strength_xp = strength_xp + v_xp where user_id = v_user;
  elsif v_category = 'intellect' then
    update public.attributes set intellect_xp = intellect_xp + v_xp where user_id = v_user;
  elsif v_category = 'focus' then
    update public.attributes set focus_xp = focus_xp + v_xp where user_id = v_user;
  elsif v_category = 'vitality' then
    update public.attributes set vitality_xp = vitality_xp + v_xp where user_id = v_user;
  end if;

  return jsonb_build_object(
    'xp_earned', v_xp,
    'gold_earned', v_gold,
    'old_level', v_old_level,
    'new_level', v_new_level,
    'leveled_up', v_leveled,
    'streak', v_streak
  );
end;
$$;

-- Economy
create or replace function public.buy_item(p_item_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_price int;
  v_gold int;
begin
  if v_user is null then
    raise exception 'Not authenticated';
  end if;

  select price into v_price
  from public.shop_items
  where id = p_item_id;

  if not found then
    raise exception 'Item not found';
  end if;

  select gold into v_gold
  from public.profiles
  where user_id = v_user
  for update;

  if v_gold < v_price then
    raise exception 'Not enough gold';
  end if;

  insert into public.inventory(user_id, item_id)
  values (v_user, p_item_id)
  on conflict (user_id, item_id) do nothing;

  if found then
    update public.profiles set gold = gold - v_price where user_id = v_user;
  end if;
end;
$$;

grant execute on function public.complete_quest(uuid) to authenticated;
grant execute on function public.buy_item(uuid) to authenticated;
grant execute on function public.update_settings(text, text, text) to authenticated;
grant execute on function public.total_xp_for_level(int) to authenticated;

commit;