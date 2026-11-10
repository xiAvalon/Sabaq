# سباق العقول | Sabaq

An Arabic, right-to-left general-knowledge game show for friends: a signature 30-second rush,
category boards, head-to-head turns with steals, and private online rooms. React + Vite, plain
JavaScript and CSS, deployed to GitHub Pages at `/Sabaq/`.

```bash
npm install
npm run dev              # http://localhost:5173/Sabaq/
npm test                 # engine, question bank and online SQL tests (Vitest + PGlite)
npm run build            # production build with service worker in dist/
npm run seed:questions   # regenerate supabase/seed_questions.sql after editing questions
```

## What is in the box

- **Play offline:** pass-and-play on one device, 1–6 players or teams, works with no internet
  after the first visit (PWA, cached app and question bank).
- **Play online:** private rooms with a 6-character code, invite link and QR code, lobby with
  ready states, synchronized server-timed rounds. Needs a Supabase project, see
  [docs/ONLINE.md](docs/ONLINE.md).
- **Modes:** سباق الـ30 ثانية (30-second rush), تحدي الفئات (category board), وجهًا لوجه
  (head-to-head with steals and golden rounds), التحدي الشامل (board with golden and risk
  questions → 30-second round → final wager).
- **11 categories, 1,120 questions,** about 40% easy / 40% medium / 20% hard, in 8 question
  types (multiple choice, true/false, typed answer, number, complete the phrase, who am I,
  what comes next, image).
- Streak bonuses, power-ups (50:50, +10 s, ×2, swap), achievements with progress, statistics,
  local leaderboard, guest profile with avatar, level and rank (computed from local stats only),
  question rotation across matches.
- **Dark and light themes** (dark by default, remembered per device), one self-hosted typeface
  (IBM Plex Sans Arabic).
- **Accounts preview:** `/login` and `/signup` are front-end only. They validate input and then
  say plainly that accounts are not live yet: no request is sent and nothing is stored.
  Global leaderboard and friends on `/community` are clearly labelled previews with sample data.

## Layout

```
src/engine/       pure game logic (reducer, modes, scoring, pool, achievements, setup)
src/data/         categories, questions (one file per category), compact authoring helpers, SVG art
src/online/       Supabase client, RPC wrappers, useRoom hook
src/components/   UI (design-system pieces, question views, online lobby and game)
src/screens/      routed screens
src/styles/       fonts, tokens (both themes), base, ui, layout, screens, game, feedback, auth, extras, theme-light
src/assets/fonts/ self-hosted IBM Plex Sans Arabic (OFL)
supabase/         migration (tables, RLS, functions) and generated question seed
docs/             ARCHITECTURE.md, ONLINE.md
```

Questions use a compact format (`src/data/compact.js`): the first listed option is the correct
one and options are shuffled at runtime; ids are a hash of the question text and double as
duplicate detection. To add a category, add it to `src/data/categories.js` and create a
question file; nothing in the engine changes.
