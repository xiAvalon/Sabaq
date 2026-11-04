// Runs the Supabase migration in a real Postgres (PGlite) and plays rooms through the RPCs,
// acting as different anonymous users. Covers RLS, validation, timing and both online modes.
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import { fuzzystrmatch } from '@electric-sql/pglite/contrib/fuzzystrmatch';
import { beforeAll, describe, expect, it } from 'vitest';

const A = '00000000-0000-4000-8000-00000000000a';
const B = '00000000-0000-4000-8000-00000000000b';
const C = '00000000-0000-4000-8000-00000000000c';
const D = '00000000-0000-4000-8000-00000000000d';

let db;

async function as(user, sql, params = []) {
  await db.query(`select set_config('request.jwt.claim.sub', $1, false)`, [user ?? '']);
  await db.exec('set role authenticated');
  try {
    const res = await db.query(sql, params);
    return res.rows;
  } finally {
    await db.exec('reset role');
  }
}

async function fails(user, sql, params, message) {
  await expect(as(user, sql, params)).rejects.toThrow(message);
}

const su = async (sql, params = []) => (await db.query(sql, params)).rows;
const JSON_ARGS = ['p_answer', 'p_settings'];
const rpc = async (user, fn, args) => {
  const keys = Object.keys(args);
  const sql = `select public.${fn}(${keys.map((k, i) => `${k} => $${i + 1}${JSON_ARGS.includes(k) ? '::jsonb' : ''}`).join(', ')}) as r`;
  const values = keys.map((k) => (JSON_ARGS.includes(k) ? JSON.stringify(args[k]) : args[k]));
  const rows = await as(user, sql, values);
  return rows[0].r;
};

// Opens the current question for answers (skips the get-ready delay).
const openNow = (session) => su(`update public.game_sessions set phase_started_at = now() - interval '1 second' where id = $1`, [session]);
const expire = (session) => su(`update public.game_sessions set deadline = now() - interval '2 seconds' where id = $1`, [session]);
const answerFor = async (qid) => (await su(`select answer, kind from public.questions where id = $1`, [qid]))[0];

beforeAll(async () => {
  db = new PGlite({ extensions: { fuzzystrmatch } });
  await db.exec(`
    create role anon nologin;
    create role authenticated nologin;
    create schema auth;
    create function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    grant usage on schema auth to anon, authenticated;
    grant usage on schema public to anon, authenticated;
    grant execute on function auth.uid() to anon, authenticated;
  `);
  await db.exec(readFileSync('supabase/migrations/20261103000000_sabaq_online.sql', 'utf8'));
  await db.exec(readFileSync('supabase/seed_questions.sql', 'utf8'));
}, 60000);

describe('answer checking in SQL matches the app', () => {
  it('normalises Arabic and accepts typos', async () => {
    const r = await su(`select public.sabaq_normalize('الخَلِيّة') = public.sabaq_normalize('خليه') as same`);
    expect(r[0].same).toBe(true);
    const q = (await su(`select * from public.questions where kind = 'text' and answer = '"ثاني أكسيد الكربون"'::jsonb limit 1`))[0];
    expect(q).toBeTruthy();
    const check = async (given) => (await su(`select public.sabaq_check(q, $1::jsonb) as ok from public.questions q where id = $2`, [JSON.stringify(given), q.id]))[0].ok;
    expect(await check('ثاني اكسيد الكربون')).toBe(true);
    expect(await check('ثانى أكسيد الكربوون')).toBe(true);
    expect(await check('co2')).toBe(true);
    expect(await check('الأكسجين')).toBe(false);
  });

  it('checks numbers with tolerance and Arabic digits', async () => {
    const q = (await su(`select id, tolerance from public.questions where kind = 'number' and tolerance > 0 limit 1`))[0];
    const ans = Number((await answerFor(q.id)).answer);
    const ok = async (v) => (await su(`select public.sabaq_check(q, $1::jsonb) as ok from public.questions q where id = $2`, [JSON.stringify(v), q.id]))[0].ok;
    expect(await ok(String(ans))).toBe(true);
    expect(await ok(String(ans + Number(q.tolerance) * 3 + 1))).toBe(false);
    const digits = String(Math.round(ans)).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[d]);
    expect(await ok(digits)).toBe(Math.abs(Math.round(ans) - ans) <= Number(q.tolerance));
  });
});

describe('rooms', () => {
  let room;
  let code;

  it('creates a room with a readable 6-character code', async () => {
    const res = await rpc(A, 'create_room', { p_name: 'سارة', p_color: 0, p_settings: { mode: 'rush', rounds: 2, duration: 30, categories: ['history', 'science'] } });
    room = res.room_id;
    code = res.code;
    expect(code).toMatch(/^[A-HJ-NP-Z2-9]{6}$/);
    const players = await as(A, 'select display_name, is_host, is_ready from public.room_players where room_id = $1', [room]);
    expect(players).toEqual([{ display_name: 'سارة', is_host: true, is_ready: true }]);
  });

  it('rejects unknown codes and anonymous calls', async () => {
    await fails(B, `select public.join_room('ZZZZZZ', 'فهد', 1)`, [], 'room_not_found');
    await fails(null, `select public.create_room('x', 0, '{}'::jsonb)`, [], 'not_signed_in');
  });

  it('lets players join by code, case-insensitively', async () => {
    const res = await rpc(B, 'join_room', { p_code: code.toLowerCase(), p_name: 'فهد', p_color: 1 });
    expect(res.room_id).toBe(room);
    expect(res.rejoined).toBe(false);
  });

  it('hides rooms from non-members and answers from everyone', async () => {
    expect(await as(C, 'select * from public.rooms where id = $1', [room])).toEqual([]);
    expect((await as(B, 'select * from public.rooms where id = $1', [room])).length).toBe(1);
    await fails(B, 'select * from public.questions limit 1', [], 'permission denied');
    await fails(B, `insert into public.rooms (code, host_id) values ('ABCDEF', $1)`, [B], 'permission denied');
    await fails(B, `update public.room_players set score = 9999 where room_id = $1`, [room], 'permission denied');
    await fails(B, `select public._transfer_host($1, null)`, [room], 'permission denied');
  });

  it('only the host changes settings, and changes reset readiness', async () => {
    await rpc(B, 'set_ready', { p_room: room, p_ready: true });
    await fails(B, `select public.update_settings($1, '{}'::jsonb)`, [room], 'host_only');
    const clean = await rpc(A, 'update_settings', { p_room: room, p_settings: { mode: 'rush', rounds: 99, duration: 7, categories: ['history', 'nope'] } });
    expect(clean.rounds).toBe(10);
    expect(clean.duration).toBe(30);
    expect(clean.categories).toEqual(['history']);
    const b = await as(B, `select is_ready from public.room_players where user_id = $1`, [B]);
    expect(b[0].is_ready).toBe(false);
    await rpc(A, 'update_settings', { p_room: room, p_settings: { mode: 'rush', rounds: 2, duration: 30, categories: ['history', 'science'] } });
  });

  it('cannot start until everyone is ready', async () => {
    await fails(A, `select public.start_game($1)`, [room], 'players_not_ready');
    await rpc(B, 'set_ready', { p_room: room, p_ready: true });
    await fails(B, `select public.start_game($1)`, [room], 'host_only');
  });

  describe('30-second rush', () => {
    let session;
    it('starts a shared, server-timed round', async () => {
      session = await rpc(A, 'start_game', { p_room: room });
      const g = (await as(B, 'select * from public.game_sessions where id = $1', [session]))[0];
      expect(g.mode).toBe('rush');
      expect(g.question_ids.length).toBe(40);
      expect(new Date(g.phase_started_at) > new Date()).toBe(true);
      await fails(C, `select public.join_room($1, 'متأخر', 2)`, [code], 'game_started');
      await fails(B, `select public.submit_answer($1, 0, '"x"'::jsonb)`, [session], 'too_early');
    });

    it('scores answers on the server with streaks and blocks duplicates', async () => {
      await openNow(session);
      const g = (await su('select * from public.game_sessions where id = $1', [session]))[0];
      const a0 = await answerFor(g.question_ids[0]);
      const r0 = await rpc(B, 'submit_answer', { p_session: session, p_q_index: 0, p_answer: a0.answer });
      expect(r0.correct).toBe(true);
      expect(r0.points).toBeGreaterThan(0);
      await fails(B, `select public.submit_answer($1, 0, $2::jsonb)`, [session, JSON.stringify(a0.answer)], 'stale_question');
      const a1 = await answerFor(g.question_ids[1]);
      const r1 = await rpc(B, 'submit_answer', { p_session: session, p_q_index: 1, p_answer: a1.answer });
      expect(r1.streak).toBe(2);
      const r2 = await rpc(B, 'submit_answer', { p_session: session, p_q_index: 2, p_answer: 'إجابة خاطئة تمامًا 123' });
      expect(r2.correct).toBe(false);
      expect(r2.points).toBe(0);
      expect(r2.streak).toBe(0);
      const mine = await as(B, 'select count(*)::int as n from public.answers');
      expect(mine[0].n).toBe(3);
      const theirs = await as(A, 'select count(*)::int as n from public.answers');
      expect(theirs[0].n).toBe(0);
    });

    it('rejects late answers and advances only after the deadline', async () => {
      expect(await rpc(A, 'advance_session', { p_session: session })).toBe('question');
      await expire(session);
      await fails(A, `select public.submit_answer($1, 0, '"x"'::jsonb)`, [session], 'too_late');
      expect(await rpc(A, 'advance_session', { p_session: session })).toBe('round_end');
      expect(await rpc(B, 'advance_session', { p_session: session })).toBe('round_end');
      await expire(session);
      expect(await rpc(B, 'advance_session', { p_session: session })).toBe('question');
      const g = (await su('select * from public.game_sessions where id = $1', [session]))[0];
      expect(g.round).toBe(2);
      expect(g.used_ids.length).toBe(80);
      await expire(session);
      expect(await rpc(A, 'advance_session', { p_session: session })).toBe('finished');
      expect((await su('select status from public.rooms where id = $1', [room]))[0].status).toBe('finished');
    });
  });

  it('host can send everyone back to the lobby', async () => {
    await rpc(A, 'reset_room', { p_room: room });
    expect((await su('select status from public.rooms where id = $1', [room]))[0].status).toBe('lobby');
  });

  it('rejoining after a refresh keeps the seat', async () => {
    const res = await rpc(B, 'join_room', { p_code: code, p_name: 'فهد', p_color: 1 });
    expect(res.rejoined).toBe(true);
  });

  it('hands the room to another player when the host leaves', async () => {
    await rpc(A, 'leave_room', { p_room: room });
    const host = await su('select user_id from public.room_players where room_id = $1 and is_host', [room]);
    expect(host[0].user_id).toBe(B);
    await fails(A, `select public.set_ready($1, true)`, [room], 'not_in_room');
  });

  it('a stale host is replaced on heartbeat', async () => {
    await rpc(C, 'join_room', { p_code: code, p_name: 'نورة', p_color: 2 });
    await su(`update public.room_players set last_seen = now() - interval '2 minutes' where room_id = $1 and user_id = $2`, [room, B]);
    await rpc(C, 'heartbeat', { p_room: room });
    const host = await su('select user_id from public.room_players where room_id = $1 and is_host', [room]);
    expect(host[0].user_id).toBe(C);
  });

  it('enforces room capacity', async () => {
    await su('update public.rooms set max_players = 3 where id = $1', [room]);
    await rpc(A, 'join_room', { p_code: code, p_name: 'سارة', p_color: 0 }); // returning member is fine
    await fails(D, `select public.join_room($1, 'خالد', 3)`, [code], 'room_full');
  });
});

describe('head-to-head turns online', () => {
  let room;
  let session;
  it('alternates turns with a steal after a wrong answer', async () => {
    const res = await rpc(A, 'create_room', { p_name: 'سارة', p_color: 0, p_settings: { mode: 'turns', rounds: 1, question_time: 15, categories: ['geography'] } });
    room = res.room_id;
    await rpc(B, 'join_room', { p_code: res.code, p_name: 'فهد', p_color: 1 });
    await rpc(B, 'set_ready', { p_room: room, p_ready: true });
    session = await rpc(A, 'start_game', { p_room: room });
    await openNow(session);
    let g = (await su('select * from public.game_sessions where id = $1', [session]))[0];
    const playerA = (await su('select id from public.room_players where room_id = $1 and user_id = $2', [room, A]))[0].id;
    const playerB = (await su('select id from public.room_players where room_id = $1 and user_id = $2', [room, B]))[0].id;
    expect(g.current_player_id).toBe(playerA);
    expect(g.total_turns).toBe(2);
    await fails(B, `select public.submit_answer($1, 0, '"x"'::jsonb)`, [session], 'not_your_turn');

    // Force a non-boolean question so a wrong answer opens a steal.
    const qid = (await su(`select id from public.questions where category = 'geography' and kind = 'choice' limit 1`))[0].id;
    await su('update public.game_sessions set question_ids[1] = $2 where id = $1', [session, qid]);
    const wrong = await rpc(A, 'submit_answer', { p_session: session, p_q_index: 0, p_answer: 'خيار غير موجود' });
    expect(wrong.correct).toBe(false);
    expect(wrong.answer).toBe(null); // not revealed yet: a steal is coming
    g = (await su('select * from public.game_sessions where id = $1', [session]))[0];
    expect(g.phase).toBe('reveal');
    expect(g.reveal.steal_next).toBe(playerB);

    expect(await rpc(B, 'advance_session', { p_session: session })).toBe('reveal');
    await expire(session);
    expect(await rpc(B, 'advance_session', { p_session: session })).toBe('steal');
    await openNow(session);
    const right = await answerFor(qid);
    const steal = await rpc(B, 'submit_answer', { p_session: session, p_q_index: 0, p_answer: right.answer });
    expect(steal.correct).toBe(true);
    expect(steal.points).toBeGreaterThan(0);

    await expire(session);
    expect(await rpc(A, 'advance_session', { p_session: session })).toBe('question');
    g = (await su('select * from public.game_sessions where id = $1', [session]))[0];
    expect(g.current_player_id).toBe(playerB);
    expect(g.q_index).toBe(1);
  });

  it('a timeout counts as a miss and the match finishes after the last turn', async () => {
    await expire(session);
    expect(await rpc(A, 'advance_session', { p_session: session })).toBe('reveal');
    let g = (await su('select * from public.game_sessions where id = $1', [session]))[0];
    expect(g.reveal.timeout).toBe(true);
    // Play out whatever steal follows, then the match ends.
    for (let i = 0; i < 4 && g.status === 'running'; i++) {
      await expire(session);
      await rpc(A, 'advance_session', { p_session: session });
      g = (await su('select * from public.game_sessions where id = $1', [session]))[0];
    }
    expect(g.status).toBe('finished');
    const scores = await as(A, 'select display_name, score from public.room_players where room_id = $1 order by score desc', [room]);
    expect(scores[0].display_name).toBe('فهد');
  });
});
