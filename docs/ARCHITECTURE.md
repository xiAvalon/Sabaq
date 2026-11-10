# Sabaq — architecture

## Phase 1 audit (state before the redesign, commit 3951b7b)

**Stack.** React 18 + Vite 5, plain JavaScript, global CSS split by area, React Router 6
(`BrowserRouter` with `basename = import.meta.env.BASE_URL`, base `/Sabaq/`), Vitest.
GitHub Actions builds `dist/`, copies `index.html` to `404.html` and deploys to Pages.

**Engine (`src/engine/`, no React).**
- `gameReducer.js`: the whole match as a pure reducer. Each action carries `now` and `seed`, so
  time and randomness are injected. Phases: `intro`, `board`, `risk`, `wager`, `question`,
  `feedback`, `finished`.
- `modes.js`: a mode is a list of segments. Segment types: `clock` (per-player countdown),
  `board` (category × value grid), `turns` (alternating turns with steals and bonus rounds) and
  `wager` (final bet).
- `questionTypes.js`: registry of 8 types (mcq, truefalse, open, number, complete, whoami,
  sequence, image) with input kind, validation and answer checking.
- `normalize.js`: Arabic answer normalisation (diacritics, hamza forms, ة/ه, ى/ي, «ال»,
  Arabic-Indic digits) plus Levenshtein typo tolerance.
- `scoring.js`, `pool.js` (no repeats in a match), `setup.js`, `stats.js`, `config.js`.

**Modes.** سباق الساعة (clock), تحدي الفئات (board), وجهًا لوجه (turns, 2 players),
التحدي الشامل (board → 30 s clock → wager). All local pass-and-play.

**Questions.** 162 across 18 categories (8–10 each), plain objects in
`src/data/questions/<category>.js`, loaded through `services/questionRepository.js`.

**UI.** Screens: Home, Setup (all options on one page), Game, Results, Settings, How to play,
Stats. Components: HUD, intro card, board, risk/wager panels, question stage, answer inputs,
power-up bar, feedback, timer ring.

**Persistence.** `services/storage.js` (localStorage, guarded): settings, last setup, stats,
leaderboard.

**Tests.** `tests/engine.test.js`, 17 tests: bank validity, matching, scoring, pool, and a
full run of every mode.

**Gaps against the new brief.** No offline/online split, no PWA, no online play, no
achievements or profile, 18 categories instead of 11, ~9 questions per category, setup is a
single long form, category picker is a plain grid.

## After the redesign

- **Identity and UI:** design tokens in `src/styles/tokens.css`; shared pieces in
  `components/ui.jsx`, `icons.jsx`, `brand.jsx`, `CategoryPicker.jsx`, `ModeCard.jsx`,
  `TimerRing.jsx`.
- **Routes:** `/` (offline/online choice), `/offline`, `/offline/:mode` (3-step setup), `/play`,
  `/results`, `/online`, `/room/:code`, `/stats`, `/settings`, `/how-to-play`.
- **Engine additions:** `achievements.js`; question rotation (`recentIds` soft-avoided by
  `pool.js`); risk/wager recorded in history.
- **Data:** 11 categories, 1,120 questions in `src/data/questions/*.js` (legacy builders plus
  the compact format in `compact.js`).
- **Offline:** build-time service worker (`vite.config.js`), manifest and icons in `public/`.
- **Online:** see `docs/ONLINE.md`.

## UI polish (v1.1)

- **Typography:** one family, `IBM Plex Sans Arabic`, self-hosted in `src/assets/fonts`
  (`fonts.css`, Arabic and Latin subsets via `unicode-range`, `font-display: swap`). All sizes,
  weights (400/500/600/700 only) and line heights come from tokens in `tokens.css`
  (`--fs-*`, `--fw-*`, `--lh-*`). No letter-spacing on Arabic; digits use tabular figures.
- **Themes:** `<html data-theme="dark|light">`. Both themes define the same token names in
  `tokens.css`; accents have `-ink` variants for text. `theme-light.css` darkens bright
  player/category colours used as text. An inline script in `index.html` sets the attribute from
  `localStorage['sabaq:theme']` before first paint; `services/theme.js` applies and saves changes.
- **Feedback:** `components/feedback.jsx` (toasts via `useToast()`, `SoonBadge`, `Skeleton`,
  `PreviewNote`) and `data-tip` tooltips in `feedback.css`.
- **New routes:** `/login`, `/signup` (UI only: `services/authValidation.js`, no network, no
  storage), `/profile` (guest profile; `engine/progression.js` derives level and rank from saved
  stats), `/community` (labelled previews; the invite action is real).
- **Achievements:** each has a `target` and `progress(ctx)`; stats now also track per-category
  correct answers, fast answers and win streaks.

