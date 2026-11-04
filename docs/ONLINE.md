# Online multiplayer: setup and architecture

Online play uses **Supabase** (Postgres, Realtime and anonymous auth). The frontend stays on
GitHub Pages. Without the two environment variables below, the site builds as offline-only and
the online screen says that online play is not enabled.

## One-time setup (about 10 minutes)

1. **Create a project** at supabase.com (the free tier is enough).
2. **Allow guest players:** Authentication → Sign In / Providers → turn on **Allow anonymous
   sign-ins**. Supabase recommends turning on CAPTCHA protection for anonymous sign-ins on a
   public site.
3. **Create the database:** SQL Editor → paste and run
   `supabase/migrations/20261103000000_sabaq_online.sql`.
4. **Load the questions:** SQL Editor → paste and run `supabase/seed_questions.sql`
   (1,120 questions). The server checks answers against this table.
5. **Check Realtime:** Database → Publications → `supabase_realtime` should list `rooms`,
   `room_players` and `game_sessions` (the migration adds them).
6. **Connect the site:** Project Settings → API → copy the **Project URL** and the
   **anon public** key. In GitHub: repository → Settings → Secrets and variables → Actions →
   **Variables** → add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Re-run the
   "Deploy to GitHub Pages" workflow.
   Never use the `service_role` key in the frontend.
7. **Local development:** copy `.env.example` to `.env` and fill in the same two values.

With the Supabase CLI you can do steps 3–4 with `supabase db push` and then run the seed file.

### When you edit questions

Run `npm run seed:questions` to regenerate `supabase/seed_questions.sql`, commit it, and run it
again in the SQL Editor. Questions are matched by id, so the app and the server must use the
same bank.

## How it works

| Piece | Where |
| --- | --- |
| Tables, RLS, game functions | `supabase/migrations/…_sabaq_online.sql` |
| Question seed (generated) | `supabase/seed_questions.sql`, `scripts/build-question-seed.mjs` |
| RPC wrappers, error messages | `src/online/api.js` |
| Room state, clock, heartbeat, auto-advance | `src/online/useRoom.js` |
| Screens | `src/screens/OnlineScreen.jsx`, `src/screens/RoomScreen.jsx`, `src/components/online/*` |
| Database tests (real Postgres via PGlite) | `tests/online-sql.test.js` |

**Tables:** `rooms` (code, host, status, settings, expiry), `room_players` (name, host, ready,
last seen, score, streaks), `game_sessions` (mode, phase, round, question ids, current player,
server deadlines, reveal), `answers` (one row per player per question, unique), `questions`
(correct answers, unreadable by clients).

**Functions (all `SECURITY DEFINER`, validated server-side):** `create_room`, `join_room`
(also rejoins after a refresh), `leave_room`, `set_ready`, `update_settings` (host),
`start_game` (host, everyone ready, 2+ players), `submit_answer`, `advance_session`,
`reset_room` (host), `heartbeat`, `server_time`.

**Modes online**
- *30-second rush:* everyone gets the same ordered question list per round (easy → hard) and
  answers at their own pace until the shared server deadline. Points by difficulty with the
  streak bonus.
- *Head-to-head turns (2–8 players):* one player answers per turn within the question time; a
  wrong answer or timeout gives the next player one steal. Every third round counts double.

**Timing:** every deadline is set by the database clock. Clients measure their offset with
`server_time()` and only display countdowns. When a deadline passes, any client calls
`advance_session`; the row lock and deadline check make duplicate calls harmless. Answers get
1.5 s of grace for network latency; later ones are rejected (`too_late`).

**Reliability:** refreshing rejoins the same seat (same anonymous session) and the countdown
continues from the server deadline. `heartbeat` every 15 s marks players connected; if the host
is gone for 45 s, the room passes to another player. Players who leave are skipped in turn
order. If the realtime socket drops, the room polls every 2 s until it is back. Rooms expire
3 hours after creation or the last start; full rooms (8) and started games refuse new players.

**Security:** RLS lets players read only rooms they belong to, and only their own answers.
Clients cannot insert or update any table directly; all writes go through the functions,
which check membership, host rights, phase, turn, deadlines and duplicate answers. Scores are
computed in the database.

## Known limitations

- The offline question bank (with answers) ships inside the app so offline play works. A
  determined player could look answers up in the bundle during an online match. The server
  still decides correctness and timing, but it cannot stop that kind of lookup.
- Power-ups, golden questions, risk and wagers are offline-only for now. The category board
  and mixed modes are offline-only.
- Online play was tested end to end in two browsers against the same SQL running locally,
  without the real Supabase realtime socket (the polling fallback carried updates). Run a
  quick two-device match after setup to confirm realtime on your project.
