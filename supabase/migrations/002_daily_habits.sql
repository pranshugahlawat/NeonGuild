begin;

-- Add quest kind: oneoff vs daily
alter table public.quests
add column if not exists kind text not null default 'oneoff';

alter table public.quests
drop constraint if exists quests_kind_check;

alter table public.quests
add constraint quests_kind_check check (kind in ('oneoff','daily'));

create index if not exists quests_user_kind_idx on public.quests(user_id, kind);

-- Replace complete_quest with server-enforced rules:
-- oneoff: only once ever + auto-archive
-- daily: only once per day
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

  v_already_done boolean := false;
begin
  if v_user is null then
    raise exception 'Not authenticated';
  end if;

  -- Lock quest row
  select q.category, q.difficulty, q.kind
    into v_category, v_difficulty, v_kind
  from public.quests q
  where q.id = p_quest_id
    and q.user_id = v_user
    and q.is_archived = false
  for update;

  if not found then
    raise exception 'Quest not found';
  end if;

  -- Prevent farming
  if v_kind = 'oneoff' then
    select exists(
      select 1 from public.quest_completions c
      where c.user_id = v_user and c.quest_id = p_quest_id
    ) into v_already_done;

    if v_already_done then
      raise exception 'Quest already completed';
    end if;

  elsif v_kind = 'daily' then
    select exists(
      select 1 from public.quest_completions c
      where c.user_id = v_user
        and c.quest_id = p_quest_id
        and (c.completed_at::date = v_today)
    ) into v_already_done;

    if v_already_done then
      raise exception 'Daily habit already completed today';
    end if;
  end if;

  -- Rewards
  if v_difficulty = 'easy' then
    v_xp := 15; v_gold := 5;
  elsif v_difficulty = 'medium' then
    v_xp := 35; v_gold := 12;
  else
    v_xp := 60; v_gold := 20;
  end if;

  -- Log completion
  insert into public.quest_completions(user_id, quest_id, xp_earned, gold_earned)
  values (v_user, p_quest_id, v_xp, v_gold);

  -- Lock profile row and update streak + XP + level
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

  -- Update attribute XP
  if v_category = 'strength' then
    update public.attributes set strength_xp = strength_xp + v_xp where user_id = v_user;
  elsif v_category = 'intellect' then
    update public.attributes set intellect_xp = intellect_xp + v_xp where user_id = v_user;
  elsif v_category = 'focus' then
    update public.attributes set focus_xp = focus_xp + v_xp where user_id = v_user;
  elsif v_category = 'vitality' then
    update public.attributes set vitality_xp = vitality_xp + v_xp where user_id = v_user;
  end if;

  -- Auto-archive oneoff after completion
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