begin;

-- 1) Keep completion logs even if a quest is deleted
-- Make quest_id nullable and change FK to ON DELETE SET NULL
alter table public.quest_completions
  alter column quest_id drop not null;

alter table public.quest_completions
  drop constraint if exists quest_completions_quest_id_fkey;

alter table public.quest_completions
  add constraint quest_completions_quest_id_fkey
  foreign key (quest_id)
  references public.quests(id)
  on delete set null;

-- 2) Store snapshots so history cannot be "rewritten" by editing/deleting quests
alter table public.quest_completions
  add column if not exists quest_title text,
  add column if not exists category text,
  add column if not exists difficulty text,
  add column if not exists kind text,
  add column if not exists completed_date date;

-- Backfill (safe even if table is empty)
update public.quest_completions c
set
  quest_title = coalesce(c.quest_title, q.title, 'Quest'),
  category = coalesce(c.category, q.category, 'intellect'),
  difficulty = coalesce(c.difficulty, q.difficulty, 'easy'),
  kind = coalesce(c.kind, q.kind, 'oneoff'),
  completed_date = coalesce(c.completed_date, (c.completed_at::date))
from public.quests q
where c.quest_id = q.id;

-- Enforce NOT NULL after backfill
alter table public.quest_completions
  alter column quest_title set not null,
  alter column category set not null,
  alter column difficulty set not null,
  alter column kind set not null,
  alter column completed_date set not null;

-- 3) Idempotency: enforce “no double completion”
-- One-off: only once ever
create unique index if not exists uq_completions_oneoff_once
on public.quest_completions(user_id, quest_id)
where kind = 'oneoff' and quest_id is not null;

-- Daily: only once per day
create unique index if not exists uq_completions_daily_once_per_day
on public.quest_completions(user_id, quest_id, completed_date)
where kind = 'daily' and quest_id is not null;

-- 4) Replace complete_quest RPC to write snapshots + rely on unique indexes
create or replace function public.complete_quest(p_quest_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_title text;
  v_category text;
  v_difficulty text;
  v_kind text;

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

  -- Fetch quest (owned)
  select q.title, q.category, q.difficulty, q.kind
    into v_title, v_category, v_difficulty, v_kind
  from public.quests q
  where q.id = p_quest_id
    and q.user_id = v_user
    and q.is_archived = false
  for update;

  if not found then
    raise exception 'Quest not found';
  end if;

  -- Rewards by difficulty
  if v_difficulty = 'easy' then
    v_xp := 15; v_gold := 5;
  elsif v_difficulty = 'medium' then
    v_xp := 35; v_gold := 12;
  else
    v_xp := 60; v_gold := 20;
  end if;

  -- Insert completion log with snapshot fields
  begin
    insert into public.quest_completions(
      user_id, quest_id, completed_at, completed_date,
      xp_earned, gold_earned,
      quest_title, category, difficulty, kind
    )
    values (
      v_user, p_quest_id, now(), v_today,
      v_xp, v_gold,
      v_title, v_category, v_difficulty, v_kind
    );
  exception
    when unique_violation then
      if v_kind = 'daily' then
        raise exception 'Daily habit already completed today';
      else
        raise exception 'Quest already completed';
      end if;
  end;

  -- Update streak + totals (server-authoritative)
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

  -- Attribute XP update
  if v_category = 'strength' then
    update public.attributes set strength_xp = strength_xp + v_xp where user_id = v_user;
  elsif v_category = 'intellect' then
    update public.attributes set intellect_xp = intellect_xp + v_xp where user_id = v_user;
  elsif v_category = 'focus' then
    update public.attributes set focus_xp = focus_xp + v_xp where user_id = v_user;
  elsif v_category = 'vitality' then
    update public.attributes set vitality_xp = vitality_xp + v_xp where user_id = v_user;
  end if;

  -- One-off auto-archive after completion (keeps board clean; completion still persists)
  if v_kind = 'oneoff' then
    update public.quests
    set is_archived = true
    where id = p_quest_id and user_id = v_user;
  end if;

  return jsonb_build_object(
    'xp_earned', v_xp,
    'gold_earned', v_gold,
    'old_level', v_old_level,
    'new_level', v_new_level,
    'leveled_up', v_leveled,
    'streak', v_streak,
    'kind', v_kind
  );
end;
$$;

grant execute on function public.complete_quest(uuid) to authenticated;

commit;