# سباق العقول — Arabic trivia party game

A game-show style trivia game (React + Vite, plain JavaScript, CSS) inspired by
«تحدي الثلاثين» and *Beat the Clock*. Fully Arabic and right-to-left. Play solo or
pass one device around a group.

```bash
npm install
npm run dev          # http://localhost:5173
npm test             # engine + question-bank tests (Vitest)
npm run build        # production build in dist/
npm run build:single # one self-contained HTML file in dist-single/
```

## Game modes

| Mode | Segments | Notes |
| --- | --- | --- |
| سباق الساعة (Beat the Clock) | `clock` per player | One clock per player, difficulty ramps with correct answers |
| تحدي الفئات (Category Challenge) | `board` | 3–6 categories × 100/200/300 cells, limited picks per player |
| وجهًا لوجه (Head-to-Head) | `turns` | 2 players/teams, steals on wrong answers or timeouts, every 3rd round ×2 |
| التحدي الشامل (Mixed) | `board` → `clock` → `wager` | Hidden golden cells, risk-or-safe choice, 30s speed round, final wager |

A mode is just a recipe of segments (`src/engine/modes.js`). To add a mode, add an entry
with `buildSegments(config)`; the engine already runs `clock`, `board`, `turns` and `wager`.

## Project layout

```
src/
  engine/            pure game logic, no React
    gameReducer.js   the whole game as a reducer (actions carry now + seed)
    modes.js         mode recipes
    questionTypes.js type registry: input kind, validation, answer checking
    normalize.js     Arabic-aware answer matching (hamza, taa marbuta, "ال", typos, Arabic digits)
    scoring.js       streak bonus, multipliers, risk, wagers, clue penalty
    pool.js          random selection with no repeats in a session
    config.js        all tuning numbers (points, timers, power-ups)
    setup.js         setup form → engine config, quick play, randomiser
    stats.js         ranking and per-player summaries
  data/
    categories.js    18 categories (add one here + a file in questions/)
    questions/       one file per category; plain objects built with builders.js
    illustrations.js SVGs used by image questions
  services/
    questionRepository.js  the only place questions are loaded (swap for an API later)
    storage.js       localStorage settings, stats, leaderboard (all guarded)
    sound.js         Web Audio sound effects, no audio files
  components/        React UI (question bodies have their own registry)
  screens/           routed pages
  styles/            tokens, base, components, game, screens
tests/engine.test.js
```

## Question format

```js
{
  id: 'geo-002',
  category: 'geography',
  type: 'mcq' | 'truefalse' | 'open' | 'number' | 'complete' | 'whoami' | 'sequence' | 'image',
  difficulty: 1 | 2 | 3,
  prompt: 'علم أي دولة هذا؟',
  options: ['اليابان', 'بنغلاديش', 'كوريا الجنوبية', 'الصين'], // choice questions (shuffled at runtime)
  answer: 'اليابان',            // string, boolean (truefalse) or number (number)
  accept: ['...'],              // extra accepted spellings for typed answers
  tolerance: 0,                 // number questions
  clues: ['...'],               // whoami
  sequence: ['...'],            // sequence
  media: { kind: 'svg' | 'emoji' | 'url', svg | char | src, alt },
  explanation: '...',           // optional
  timeLimit: 20,                // optional override, seconds
  points: 250,                  // optional override
}
```

New question types: call `registerQuestionType()` in `engine/questionTypes.js` and, if it
needs custom drawing, add a body in `components/question/QuestionBodies.jsx`.
