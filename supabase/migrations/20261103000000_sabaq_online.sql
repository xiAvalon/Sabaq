-- Sabaq online multiplayer: private rooms, lobby, synchronized rounds.
--
-- Security model
-- * Players are Supabase anonymous users (auth.uid()); no registration.
-- * Clients may only SELECT rows of rooms they belong to (RLS). Every write goes through the
--   SECURITY DEFINER functions below, which validate the caller, the game phase and the clock.
-- * Correct answers live in public.questions, which no client role can read. Answers are checked
--   on the server; the correct answer is returned only to the player who just answered, or in the
--   reveal step of a turn.
-- * All times come from the database clock (now()); clients only display deadlines.

create schema if not exists extensions;
create extension if not exists fuzzystrmatch with schema extensions;

-- ---------------------------------------------------------------- tables

create table if not exists public.questions (
  id text primary key,
  category text not null,
  difficulty smallint not null check (difficulty between 1 and 3),
  type text not null,
  kind text not null check (kind in ('choice', 'boolean', 'number', 'text')),
  answer jsonb not null,
  accept jsonb not null default '[]'::jsonb,
  tolerance numeric not null default 0,
  speed boolean not null default true
);

create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[A-HJ-NP-Z2-9]{6}$'),
  host_id uuid not null,
  status text not null default 'lobby' check (status in ('lobby', 'playing', 'finished', 'closed')),
  settings jsonb not null default '{}'::jsonb,
  max_players int not null default 8 check (max_players between 2 and 12),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '3 hours'
);

create table if not exists public.room_players (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms (id) on delete cascade,
  user_id uuid not null,
  display_name text not null check (char_length(display_name) between 1 and 18),
  color smallint not null default 0 check (color between 0 and 5),
  is_host boolean not null default false,
  is_ready boolean not null default false,
  score int not null default 0,
  streak int not null default 0,
  best_streak int not null default 0,
  correct int not null default 0,
  answered int not null default 0,
  last_seen timestamptz not null default now(),
  joined_at timestamptz not null default now(),
  left_at timestamptz,
  unique (room_id, user_id)
);
create index if not exists room_players_room_idx on public.room_players (room_id);

create table if not exists public.game_sessions (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms (id) on delete cascade,
  mode text not null check (mode in ('rush', 'turns')),
  status text not null default 'running' check (status in ('running', 'finished')),
  phase text not null check (phase in ('question', 'steal', 'reveal', 'round_end', 'finished')),
  round int not null default 1,
  total_rounds int not null,
  turn int not null default 0,
  total_turns int not null default 0,
  question_ids text[] not null default '{}',
  used_ids text[] not null default '{}',
  q_index int not null default 0,
  turn_order uuid[] not null default '{}',
  current_player_id uuid,
  phase_started_at timestamptz not null default now(),
  deadline timestamptz,
  reveal jsonb,
  settings jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists game_sessions_one_running on public.game_sessions (room_id) where status = 'running';

create table if not exists public.answers (
  id bigint generated always as identity primary key,
  session_id uuid not null references public.game_sessions (id) on delete cascade,
  player_id uuid not null references public.room_players (id) on delete cascade,
  round int not null,
  q_index int not null,
  question_id text not null,
  submitted jsonb,
  is_correct boolean not null,
  points int not null,
  response_ms int not null,
  created_at timestamptz not null default now(),
  unique (session_id, player_id, round, q_index)
);

-- ---------------------------------------------------------------- answer checking

create or replace function public.sabaq_normalize(t text)
returns text
language plpgsql
immutable
set search_path = public
as $$
declare
  s text := lower(coalesce(t, ''));
  w text;
  out_words text[] := '{}';
begin
  s := translate(s, '٠١٢٣٤٥٦٧٨٩۰۱۲۳۴۵۶۷۸۹', '01234567890123456789');
  s := regexp_replace(s, '[ً-ٰٟـ]', '', 'g');
  s := translate(s, 'أإآٱةىؤئ', 'ااااهيوي');
  s := regexp_replace(s, '[[:punct:]،؛؟«»]', ' ', 'g');
  s := btrim(regexp_replace(s, '\s+', ' ', 'g'));
  if s = '' then return ''; end if;
  foreach w in array string_to_array(s, ' ') loop
    if char_length(w) > 3 and left(w, 2) = 'ال' then
      w := substr(w, 3);
    end if;
    out_words := out_words || w;
  end loop;
  return array_to_string(out_words, ' ');
end;
$$;

create or replace function public.sabaq_check(q public.questions, given jsonb)
returns boolean
language plpgsql
immutable
set search_path = public, extensions
as $$
declare
  g text;
  num numeric;
  cand text;
  target text;
  compact_g text;
  allowed int;
begin
  if given is null or given = 'null'::jsonb then return false; end if;

  if q.kind = 'choice' then
    return given #>> '{}' = q.answer #>> '{}';
  elsif q.kind = 'boolean' then
    return jsonb_typeof(given) = 'boolean' and given = q.answer;
  elsif q.kind = 'number' then
    g := translate(given #>> '{}', '٠١٢٣٤٥٦٧٨٩۰۱۲۳۴۵۶۷۸۹٫', '01234567890123456789.');
    g := regexp_replace(g, '[\s,٬]', '', 'g');
    if g !~ '^-?[0-9]*\.?[0-9]+$' then return false; end if;
    num := g::numeric;
    return abs(num - (q.answer #>> '{}')::numeric) <= q.tolerance;
  end if;

  -- typed text answer
  g := sabaq_normalize(given #>> '{}');
  if g = '' then return false; end if;
  compact_g := replace(g, ' ', '');
  for cand in select jsonb_array_elements_text(jsonb_build_array(q.answer #>> '{}') || q.accept) loop
    target := sabaq_normalize(cand);
    if target = '' then continue; end if;
    if g = target or compact_g = replace(target, ' ', '') then return true; end if;
    allowed := case when char_length(replace(target, ' ', '')) >= 8 then 2
                    when char_length(replace(target, ' ', '')) >= 4 then 1
                    else 0 end;
    if extensions.levenshtein(compact_g, replace(target, ' ', '')) <= allowed then return true; end if;
  end loop;
  return false;
end;
$$;

-- ---------------------------------------------------------------- helpers

create or replace function public.is_room_member(p_room uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.room_players
    where room_id = p_room and user_id = auth.uid()
  );
$$;

create or replace function public._me(p_room uuid)
returns public.room_players
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  me public.room_players;
begin
  if auth.uid() is null then raise exception 'not_signed_in'; end if;
  select * into me from public.room_players where room_id = p_room and user_id = auth.uid();
  if not found or me.left_at is not null then raise exception 'not_in_room'; end if;
  return me;
end;
$$;

create or replace function public._gen_code()
returns text
language plpgsql
volatile
as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- no O/0, I/1
  s text := '';
begin
  for i in 1..6 loop
    s := s || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
  end loop;
  return s;
end;
$$;

create or replace function public._clean_settings(p jsonb)
returns jsonb
language plpgsql
immutable
as $$
declare
  mode text := coalesce(p ->> 'mode', 'rush');
  cats jsonb := coalesce(p -> 'categories', '[]'::jsonb);
  allowed constant text[] := array['general','history','geography','science','technology','literature','sports','football','math','animals','space'];
  clean_cats text[];
  diff text := coalesce(p ->> 'difficulty', 'mixed');
begin
  if mode not in ('rush', 'turns') then mode := 'rush'; end if;
  select coalesce(array_agg(distinct c), '{}') into clean_cats
  from jsonb_array_elements_text(cats) c where c = any(allowed);
  if coalesce(array_length(clean_cats, 1), 0) = 0 then clean_cats := allowed; end if;
  if diff not in ('mixed', '1', '2', '3') then diff := 'mixed'; end if;
  return jsonb_build_object(
    'mode', mode,
    'categories', to_jsonb(clean_cats),
    'difficulty', diff,
    'rounds', greatest(1, least(coalesce((p ->> 'rounds')::int, case when mode = 'rush' then 3 else 4 end), 10)),
    'duration', case when coalesce((p ->> 'duration')::int, 30) in (30, 45, 60) then coalesce((p ->> 'duration')::int, 30) else 30 end,
    'question_time', greatest(10, least(coalesce((p ->> 'question_time')::int, 20), 30))
  );
end;
$$;

-- Picks n unused question ids. Rush rounds are ordered easy → hard and use quick question types.
create or replace function public._pick_questions(p_settings jsonb, p_used text[], p_n int, p_rush boolean)
returns text[]
language plpgsql
volatile
set search_path = public
as $$
declare
  cats text[] := array(select jsonb_array_elements_text(p_settings -> 'categories'));
  diff text := p_settings ->> 'difficulty';
  picked text[];
begin
  select coalesce(array_agg(id order by ord_diff, rnd), '{}') into picked
  from (
    select id, case when p_rush and diff = 'mixed' then difficulty else 0 end as ord_diff, random() as rnd
    from public.questions
    where category = any(cats)
      and not (id = any(p_used))
      and (not p_rush or speed)
      and (diff = 'mixed' or difficulty = diff::smallint)
    order by random()
    limit p_n
  ) s;

  if coalesce(array_length(picked, 1), 0) < p_n then
    -- Not enough fresh questions: allow other difficulties, then repeats from earlier rounds.
    picked := picked || array(
      select id from public.questions
      where category = any(cats) and not (id = any(picked)) and not (id = any(p_used))
      order by random() limit p_n - coalesce(array_length(picked, 1), 0)
    );
  end if;
  if coalesce(array_length(picked, 1), 0) < p_n then
    picked := picked || array(
      select id from public.questions
      where category = any(cats) and not (id = any(picked))
      order by random() limit p_n - coalesce(array_length(picked, 1), 0)
    );
  end if;
  return picked;
end;
$$;

create or replace function public._active_players(p_room uuid)
returns setof public.room_players
language sql
stable
set search_path = public
as $$
  select * from public.room_players where room_id = p_room and left_at is null order by joined_at;
$$;

-- ---------------------------------------------------------------- room lifecycle

create or replace function public.server_time()
returns timestamptz
language sql
stable
as $$ select now(); $$;

create or replace function public.create_room(p_name text, p_color int default 0, p_settings jsonb default '{}'::jsonb)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  r public.rooms;
  tries int := 0;
begin
  if auth.uid() is null then raise exception 'not_signed_in'; end if;
  if char_length(btrim(coalesce(p_name, ''))) = 0 then raise exception 'name_required'; end if;

  delete from public.rooms where expires_at < now() - interval '1 day';

  loop
    begin
      insert into public.rooms (code, host_id, settings)
      values (_gen_code(), auth.uid(), _clean_settings(p_settings))
      returning * into r;
      exit;
    exception when unique_violation then
      tries := tries + 1;
      if tries > 8 then raise; end if;
    end;
  end loop;

  insert into public.room_players (room_id, user_id, display_name, color, is_host, is_ready)
  values (r.id, auth.uid(), left(btrim(p_name), 18), greatest(0, least(coalesce(p_color, 0), 5)), true, true);

  return jsonb_build_object('room_id', r.id, 'code', r.code);
end;
$$;

create or replace function public.join_room(p_code text, p_name text, p_color int default 0)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  r public.rooms;
  existing public.room_players;
  active int;
begin
  if auth.uid() is null then raise exception 'not_signed_in'; end if;
  if char_length(btrim(coalesce(p_name, ''))) = 0 then raise exception 'name_required'; end if;

  select * into r from public.rooms where code = upper(btrim(p_code)) for update;
  if not found then raise exception 'room_not_found'; end if;
  if r.status = 'closed' or r.expires_at < now() then raise exception 'room_expired'; end if;

  select * into existing from public.room_players where room_id = r.id and user_id = auth.uid();
  if found then
    -- Rejoin after a refresh or a lost connection: keep score and seat.
    update public.room_players
      set left_at = null, last_seen = now(), display_name = left(btrim(p_name), 18), color = greatest(0, least(coalesce(p_color, 0), 5))
      where id = existing.id;
    return jsonb_build_object('room_id', r.id, 'code', r.code, 'rejoined', true);
  end if;

  if r.status <> 'lobby' then raise exception 'game_started'; end if;
  select count(*) into active from public.room_players where room_id = r.id and left_at is null;
  if active >= r.max_players then raise exception 'room_full'; end if;

  insert into public.room_players (room_id, user_id, display_name, color)
  values (r.id, auth.uid(), left(btrim(p_name), 18), greatest(0, least(coalesce(p_color, 0), 5)));
  return jsonb_build_object('room_id', r.id, 'code', r.code, 'rejoined', false);
end;
$$;

create or replace function public._transfer_host(p_room uuid, p_to uuid default null)
returns void
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  next_host public.room_players;
begin
  if p_to is not null then
    select * into next_host from public.room_players where id = p_to;
  else
    select * into next_host from public.room_players
    where room_id = p_room and left_at is null
    order by (last_seen > now() - interval '30 seconds') desc, joined_at
    limit 1;
  end if;
  if not found or next_host.id is null then
    update public.rooms set status = 'closed' where id = p_room;
    return;
  end if;
  update public.room_players set is_host = (id = next_host.id) where room_id = p_room;
  update public.room_players set is_ready = true where id = next_host.id;
  update public.rooms set host_id = next_host.user_id where id = p_room;
end;
$$;

create or replace function public.leave_room(p_room uuid)
returns void
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  me public.room_players := _me(p_room);
begin
  update public.room_players set left_at = now(), is_ready = false, is_host = false where id = me.id;
  if me.is_host then perform _transfer_host(p_room); end if;
  if not exists (select 1 from public.room_players where room_id = p_room and left_at is null) then
    update public.rooms set status = 'closed' where id = p_room;
  end if;
end;
$$;

create or replace function public.set_ready(p_room uuid, p_ready boolean)
returns void
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  me public.room_players := _me(p_room);
begin
  update public.room_players set is_ready = coalesce(p_ready, false) or me.is_host, last_seen = now() where id = me.id;
end;
$$;

create or replace function public.update_settings(p_room uuid, p_settings jsonb)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  me public.room_players := _me(p_room);
  clean jsonb := _clean_settings(p_settings);
begin
  if not me.is_host then raise exception 'host_only'; end if;
  if (select status from public.rooms where id = p_room) <> 'lobby' then raise exception 'game_started'; end if;
  update public.rooms set settings = clean where id = p_room;
  -- Changed rules: everyone confirms again.
  update public.room_players set is_ready = is_host where room_id = p_room;
  return clean;
end;
$$;

-- Keeps the connection status fresh and hands the room to someone else if the host disappeared.
create or replace function public.heartbeat(p_room uuid)
returns timestamptz
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  me public.room_players := _me(p_room);
  host public.room_players;
begin
  update public.room_players set last_seen = now() where id = me.id;
  select * into host from public.room_players where room_id = p_room and is_host;
  if host.id is null or host.left_at is not null or host.last_seen < now() - interval '45 seconds' then
    perform _transfer_host(p_room, me.id);
  end if;
  return now();
end;
$$;

-- ---------------------------------------------------------------- game

create or replace function public.start_game(p_room uuid)
returns uuid
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  me public.room_players := _me(p_room);
  r public.rooms;
  s jsonb;
  players uuid[];
  n int;
  sess uuid;
  first_q text[];
  ready_count int;
begin
  if not me.is_host then raise exception 'host_only'; end if;
  select * into r from public.rooms where id = p_room for update;
  if r.status <> 'lobby' then raise exception 'game_started'; end if;

  select array_agg(id order by joined_at), count(*) filter (where is_ready or is_host)
    into players, ready_count
  from public.room_players where room_id = p_room and left_at is null;
  n := coalesce(array_length(players, 1), 0);
  if n < 2 then raise exception 'need_two_players'; end if;
  if ready_count < n then raise exception 'players_not_ready'; end if;

  s := _clean_settings(r.settings);
  update public.room_players
    set score = 0, streak = 0, best_streak = 0, correct = 0, answered = 0
    where room_id = p_room;

  if s ->> 'mode' = 'rush' then
    first_q := _pick_questions(s, '{}', 40, true);
    insert into public.game_sessions (room_id, mode, phase, round, total_rounds, question_ids, used_ids,
                                      turn_order, phase_started_at, deadline, settings)
    values (p_room, 'rush', 'question', 1, (s ->> 'rounds')::int, first_q, first_q, players,
            now() + interval '4 seconds', now() + interval '4 seconds' + make_interval(secs => (s ->> 'duration')::int), s)
    returning id into sess;
  else
    first_q := _pick_questions(s, '{}', (s ->> 'rounds')::int * n + 4, false);
    insert into public.game_sessions (room_id, mode, phase, round, total_rounds, turn, total_turns, question_ids, used_ids,
                                      turn_order, current_player_id, phase_started_at, deadline, settings)
    values (p_room, 'turns', 'question', 1, (s ->> 'rounds')::int, 0, (s ->> 'rounds')::int * n, first_q, first_q,
            players, players[1], now() + interval '3 seconds',
            now() + interval '3 seconds' + make_interval(secs => (s ->> 'question_time')::int), s)
    returning id into sess;
  end if;

  update public.rooms set status = 'playing', settings = s, expires_at = now() + interval '3 hours' where id = p_room;
  return sess;
end;
$$;

create or replace function public._base_points(p_difficulty smallint)
returns int language sql immutable as $$ select p_difficulty * 100; $$;

-- Next seated player after p_from in turn order, skipping players who left.
create or replace function public._next_player(g public.game_sessions, p_from uuid)
returns uuid
language plpgsql
stable
set search_path = public
as $$
declare
  n int := array_length(g.turn_order, 1);
  start_pos int := coalesce(array_position(g.turn_order, p_from), 0);
  cand uuid;
begin
  for i in 1..n loop
    cand := g.turn_order[((start_pos - 1 + i) % n) + 1];
    if exists (select 1 from public.room_players where id = cand and left_at is null) and cand <> p_from then
      return cand;
    end if;
  end loop;
  return null;
end;
$$;

create or replace function public._finish(g public.game_sessions)
returns void
language plpgsql
volatile
set search_path = public
as $$
begin
  update public.game_sessions set phase = 'finished', status = 'finished', deadline = null, updated_at = now() where id = g.id;
  update public.rooms set status = 'finished' where id = g.room_id;
end;
$$;

-- Records a turn answer (or timeout) and moves to the reveal step.
create or replace function public._resolve_turn(g public.game_sessions, p_player uuid, p_answer jsonb, p_timeout boolean)
returns jsonb
language plpgsql
volatile
set search_path = public
as $$
declare
  q public.questions;
  ok boolean;
  pts int := 0;
  bonus boolean := (g.round % 3 = 0);
  steal_next uuid;
  pl public.room_players;
begin
  select * into q from public.questions where id = g.question_ids[g.q_index + 1];
  ok := not p_timeout and sabaq_check(q, p_answer);
  if ok then pts := _base_points(q.difficulty) * (case when bonus then 2 else 1 end); end if;

  insert into public.answers (session_id, player_id, round, q_index, question_id, submitted, is_correct, points, response_ms)
  values (g.id, p_player, g.round, g.q_index, q.id, p_answer, ok, pts,
          greatest(0, (extract(epoch from (now() - g.phase_started_at)) * 1000)::int));

  update public.room_players
    set score = score + pts, correct = correct + ok::int, answered = answered + 1,
        streak = case when ok then streak + 1 else 0 end,
        best_streak = greatest(best_streak, case when ok then streak + 1 else 0 end)
    where id = p_player
    returning * into pl;

  -- A wrong answer or timeout opens one steal, except on true/false answered wrongly.
  if not ok and g.phase = 'question' and (q.kind <> 'boolean' or p_timeout) then
    steal_next := _next_player(g, p_player);
  end if;

  update public.game_sessions
    set phase = 'reveal',
        deadline = now() + interval '3 seconds',
        phase_started_at = now(),
        reveal = jsonb_build_object(
          'question_id', q.id,
          'player_id', p_player,
          'correct', ok,
          'timeout', p_timeout,
          'given', p_answer,
          'points', pts,
          'steal_next', steal_next,
          'answer', case when steal_next is null then q.answer else null end
        ),
        updated_at = now()
    where id = g.id;

  return jsonb_build_object('correct', ok, 'points', pts, 'answer', case when steal_next is null then q.answer else null end, 'score', pl.score);
end;
$$;

create or replace function public.submit_answer(p_session uuid, p_q_index int, p_answer jsonb)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  g public.game_sessions;
  me public.room_players;
  q public.questions;
  expected int;
  ok boolean;
  pts int := 0;
  pl public.room_players;
begin
  select * into g from public.game_sessions where id = p_session for update;
  if not found then raise exception 'session_not_found'; end if;
  me := _me(g.room_id);
  if g.status <> 'running' then raise exception 'game_over'; end if;
  if now() < g.phase_started_at then raise exception 'too_early'; end if;
  if g.deadline is not null and now() > g.deadline + interval '1.5 seconds' then raise exception 'too_late'; end if;

  if g.mode = 'rush' then
    if g.phase <> 'question' then raise exception 'too_late'; end if;
    select count(*) into expected from public.answers where session_id = g.id and player_id = me.id and round = g.round;
    if p_q_index <> expected then raise exception 'stale_question'; end if;
    if expected >= coalesce(array_length(g.question_ids, 1), 0) then raise exception 'no_more_questions'; end if;

    select * into q from public.questions where id = g.question_ids[expected + 1];
    ok := sabaq_check(q, p_answer);
    if ok then
      pts := round(_base_points(q.difficulty) * (1 + least(me.streak * 0.1, 0.5)) / 10.0) * 10;
    end if;

    begin
      insert into public.answers (session_id, player_id, round, q_index, question_id, submitted, is_correct, points, response_ms)
      values (g.id, me.id, g.round, expected, q.id, p_answer, ok, pts, 0);
    exception when unique_violation then
      raise exception 'already_answered';
    end;

    update public.room_players
      set score = score + pts, correct = correct + ok::int, answered = answered + 1,
          streak = case when ok then streak + 1 else 0 end,
          best_streak = greatest(best_streak, case when ok then streak + 1 else 0 end),
          last_seen = now()
      where id = me.id
      returning * into pl;

    return jsonb_build_object('correct', ok, 'points', pts, 'answer', q.answer, 'score', pl.score, 'streak', pl.streak, 'next_index', expected + 1);
  end if;

  -- turns
  if g.phase not in ('question', 'steal') then raise exception 'too_late'; end if;
  if g.current_player_id <> me.id then raise exception 'not_your_turn'; end if;
  if p_q_index <> g.q_index then raise exception 'stale_question'; end if;
  if exists (select 1 from public.answers where session_id = g.id and player_id = me.id and round = g.round and q_index = g.q_index) then
    raise exception 'already_answered';
  end if;
  return _resolve_turn(g, me.id, p_answer, false);
end;
$$;

-- Moves the game forward once the current deadline has passed. Any player may call it; the
-- row lock and the deadline check make repeated or simultaneous calls harmless.
create or replace function public.advance_session(p_session uuid)
returns text
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  g public.game_sessions;
  s jsonb;
  next_q text[];
  next_player uuid;
  n int;
begin
  select * into g from public.game_sessions where id = p_session for update;
  if not found then raise exception 'session_not_found'; end if;
  perform _me(g.room_id);
  if g.status <> 'running' then return g.phase; end if;
  if g.deadline is not null and now() < g.deadline then return g.phase; end if;
  s := g.settings;

  if g.mode = 'rush' then
    if g.phase = 'question' then
      if g.round >= g.total_rounds then
        perform _finish(g);
        return 'finished';
      end if;
      update public.game_sessions set phase = 'round_end', phase_started_at = now(), deadline = now() + interval '8 seconds', updated_at = now()
        where id = g.id;
      return 'round_end';
    elsif g.phase = 'round_end' then
      next_q := _pick_questions(s, g.used_ids, 40, true);
      update public.room_players set streak = 0 where room_id = g.room_id;
      update public.game_sessions
        set phase = 'question', round = g.round + 1, question_ids = next_q, used_ids = g.used_ids || next_q,
            phase_started_at = now() + interval '4 seconds',
            deadline = now() + interval '4 seconds' + make_interval(secs => (s ->> 'duration')::int),
            updated_at = now()
        where id = g.id;
      return 'question';
    end if;
    return g.phase;
  end if;

  -- turns
  if g.phase in ('question', 'steal') then
    perform _resolve_turn(g, g.current_player_id, null, true);
    return 'reveal';
  end if;

  if g.phase = 'reveal' then
    next_player := nullif(g.reveal ->> 'steal_next', '')::uuid;
    if next_player is not null and g.phase = 'reveal' and (g.reveal ->> 'player_id')::uuid = g.current_player_id
       and not exists (select 1 from public.answers where session_id = g.id and player_id = next_player and round = g.round and q_index = g.q_index) then
      update public.game_sessions
        set phase = 'steal', current_player_id = next_player, reveal = null,
            phase_started_at = now() + interval '1.5 seconds',
            deadline = now() + interval '1.5 seconds' + make_interval(secs => greatest(8, ceil((s ->> 'question_time')::int * 0.6)::int)),
            updated_at = now()
        where id = g.id;
      return 'steal';
    end if;

    if g.turn + 1 >= g.total_turns then
      perform _finish(g);
      return 'finished';
    end if;

    n := array_length(g.turn_order, 1);
    next_player := g.turn_order[((g.turn + 1) % n) + 1];
    if not exists (select 1 from public.room_players where id = next_player and left_at is null) then
      next_player := _next_player(g, next_player);
    end if;
    if next_player is null then
      perform _finish(g);
      return 'finished';
    end if;
    update public.game_sessions
      set phase = 'question', turn = g.turn + 1, round = ((g.turn + 1) / n) + 1, q_index = g.q_index + 1,
          current_player_id = next_player, reveal = null,
          phase_started_at = now() + interval '2 seconds',
          deadline = now() + interval '2 seconds' + make_interval(secs => (s ->> 'question_time')::int),
          updated_at = now()
      where id = g.id;
    return 'question';
  end if;

  return g.phase;
end;
$$;

-- Host sends everyone back to the lobby after a match.
create or replace function public.reset_room(p_room uuid)
returns void
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  me public.room_players := _me(p_room);
begin
  if not me.is_host then raise exception 'host_only'; end if;
  update public.game_sessions set status = 'finished', phase = 'finished' where room_id = p_room and status = 'running';
  update public.rooms set status = 'lobby', expires_at = now() + interval '3 hours' where id = p_room;
  update public.room_players set is_ready = is_host where room_id = p_room;
end;
$$;

-- ---------------------------------------------------------------- row level security

alter table public.questions enable row level security;
alter table public.rooms enable row level security;
alter table public.room_players enable row level security;
alter table public.game_sessions enable row level security;
alter table public.answers enable row level security;

drop policy if exists "members read room" on public.rooms;
create policy "members read room" on public.rooms for select to authenticated using (public.is_room_member(id));

drop policy if exists "members read players" on public.room_players;
create policy "members read players" on public.room_players for select to authenticated using (public.is_room_member(room_id));

drop policy if exists "members read session" on public.game_sessions;
create policy "members read session" on public.game_sessions for select to authenticated using (public.is_room_member(room_id));

drop policy if exists "players read own answers" on public.answers;
create policy "players read own answers" on public.answers for select to authenticated
  using (exists (select 1 from public.room_players p where p.id = answers.player_id and p.user_id = auth.uid()));
-- questions: no policy at all, so clients cannot read correct answers.

revoke all on public.questions from anon, authenticated;
revoke insert, update, delete on public.rooms, public.room_players, public.game_sessions, public.answers from anon, authenticated;
revoke all on public.rooms, public.room_players, public.game_sessions, public.answers from anon;
grant select on public.rooms, public.room_players, public.game_sessions, public.answers to authenticated;

revoke execute on all functions in schema public from public, anon, authenticated;
grant execute on function
  public.server_time(),
  public.create_room(text, int, jsonb),
  public.join_room(text, text, int),
  public.leave_room(uuid),
  public.set_ready(uuid, boolean),
  public.update_settings(uuid, jsonb),
  public.heartbeat(uuid),
  public.start_game(uuid),
  public.submit_answer(uuid, int, jsonb),
  public.advance_session(uuid),
  public.reset_room(uuid),
  public.is_room_member(uuid)
to authenticated;

-- ---------------------------------------------------------------- realtime

do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
  begin alter publication supabase_realtime add table public.rooms; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.room_players; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.game_sessions; exception when duplicate_object then null; end;
end;
$$;

alter table public.rooms replica identity full;
alter table public.room_players replica identity full;
alter table public.game_sessions replica identity full;
