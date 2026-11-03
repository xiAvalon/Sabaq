import { describe, expect, it } from 'vitest';
import { QUESTION_BANK } from '../src/data/questions/index.js';
import { CATEGORY_IDS } from '../src/data/categories.js';
import { validateQuestion, checkAnswer, getInputKind } from '../src/engine/questionTypes.js';
import { normalizeText, matchesText, parseNumber } from '../src/engine/normalize.js';
import { scoreAnswer } from '../src/engine/scoring.js';
import { pickQuestion } from '../src/engine/pool.js';
import { createGame, gameReducer, maxWager } from '../src/engine/gameReducer.js';
import { rankPlayers } from '../src/engine/stats.js';

const bank = QUESTION_BANK;

describe('question bank', () => {
  it('every question is valid', () => {
    const bad = bank.map((q) => [q.id, validateQuestion(q, CATEGORY_IDS)]).filter(([, e]) => e.length);
    expect(bad).toEqual([]);
  });
  it('ids are unique', () => {
    expect(new Set(bank.map((q) => q.id)).size).toBe(bank.length);
  });
  it('each category has every difficulty and enough questions', () => {
    for (const cat of CATEGORY_IDS) {
      const qs = bank.filter((q) => q.category === cat);
      expect(qs.length, cat).toBeGreaterThanOrEqual(8);
      for (const d of [1, 2, 3]) expect(qs.some((q) => q.difficulty === d), `${cat} d${d}`).toBe(true);
    }
  });
  it('covers all 8 question types', () => {
    expect(new Set(bank.map((q) => q.type)).size).toBe(8);
  });
  it('each question accepts its own answer', () => {
    for (const q of bank) expect(checkAnswer(q, q.answer), q.id).toBe(true);
  });
});

describe('answer matching', () => {
  it('normalises Arabic spelling variants', () => {
    expect(normalizeText('الخَلِيّة')).toBe(normalizeText('خليه'));
    expect(matchesText('أرامكو', ['ارامكو'])).toBe(true);
    expect(matchesText('افرست', ['إيفرست'])).toBe(true);
    expect(matchesText('باريس', ['لندن'])).toBe(false);
  });
  it('parses Arabic-Indic numbers', () => {
    expect(parseNumber('١٤٤٠')).toBe(1440);
    expect(parseNumber('42,195')).toBe(42195);
    expect(parseNumber('abc')).toBe(null);
  });
  it('number tolerance works', () => {
    const q = bank.find((x) => x.id === 'spo-005');
    expect(checkAnswer(q, '42000')).toBe(true);
    expect(checkAnswer(q, '41000')).toBe(false);
  });
});

describe('scoring', () => {
  it('applies streak, multipliers, risk and wagers', () => {
    expect(scoreAnswer({ base: 200, correct: true }).points).toBe(200);
    expect(scoreAnswer({ base: 200, correct: true, streakBefore: 2 }).points).toBe(240);
    expect(scoreAnswer({ base: 200, correct: true, streakBefore: 20 }).points).toBe(300);
    expect(scoreAnswer({ base: 100, correct: true, multiplier: 2, risk: true }).points).toBe(400);
    expect(scoreAnswer({ base: 300, correct: false, risk: true }).points).toBe(-300);
    expect(scoreAnswer({ base: 300, correct: false }).points).toBe(0);
    expect(scoreAnswer({ base: 0, correct: false, wager: 500 }).points).toBe(-500);
    expect(scoreAnswer({ base: 300, correct: true, extraClues: 2 }).points).toBe(210);
  });
});

describe('pool', () => {
  it('never repeats until exhausted', () => {
    const used = new Set();
    for (let i = 0; i < bank.length; i++) {
      const q = pickQuestion(bank, used, {});
      expect(used.has(q.id)).toBe(false);
      used.add(q.id);
    }
    expect(pickQuestion(bank, used, {})).toBe(null);
  });
});

// ---- engine flows ----
let t = 1_000_000;
const act = (state, action) => gameReducer(state, { now: (t += 1000), seed: 0.42, ...action });
const answerRight = (s) => act(s, { type: 'SUBMIT', token: s.current.token, answer: s.current.question.answer });
const answerWrong = (s) => {
  const q = s.current.question;
  const kind = getInputKind(q);
  const wrong = kind === 'boolean' ? !q.answer : kind === 'choice' ? s.current.options.find((o) => o !== q.answer) : kind === 'number' ? '-999999' : 'xxxxxxxx';
  return act(s, { type: 'SUBMIT', token: s.current.token, answer: wrong });
};
const baseConfig = (over = {}) => ({
  players: ['أحمد'],
  categories: ['general', 'history', 'science', 'space'],
  difficulty: 'mixed',
  questionTime: 'auto',
  rounds: 2,
  clockSeconds: 60,
  powerups: 1,
  ...over,
});

describe('beat the clock', () => {
  it('runs per-player clocks, ramps difficulty and ends', () => {
    let s = createGame({ modeId: 'clock', config: baseConfig({ players: ['أ', 'ب'] }), bank, now: t, seed: 0.1 });
    expect(s.phase).toBe('intro');
    s = act(s, { type: 'CONTINUE' });
    expect(s.phase).toBe('question');
    const levels = [];
    for (let i = 0; i < 8; i++) {
      levels.push(s.current.question.difficulty);
      s = answerRight(s);
      expect(s.phase).toBe('feedback');
      s = act(s, { type: 'NEXT' });
    }
    expect(levels.slice(0, 3).every((d) => d === 1)).toBe(true);
    expect(levels.at(-1)).toBe(3);
    // force the clock to run out
    s = gameReducer(s, { type: 'TIMEOUT', token: s.current.token, now: s.seg.deadline + 1, seed: 0.3 });
    expect(s.current.result.clockEnded).toBe(true);
    s = act(s, { type: 'NEXT' });
    expect(s.phase).toBe('intro');
    expect(s.intro.playerIdx).toBe(1);
    expect(s.players[0].correct).toBe(8);
    expect(s.players[0].timeouts).toBe(0);
  });

  it('ignores stale and double submissions', () => {
    let s = createGame({ modeId: 'clock', config: baseConfig(), bank, now: t, seed: 0.2 });
    s = act(s, { type: 'CONTINUE' });
    const token = s.current.token;
    s = answerRight(s);
    const score = s.players[0].score;
    s = act(s, { type: 'SUBMIT', token, answer: 'anything' });
    expect(s.players[0].score).toBe(score);
  });
});

describe('category challenge', () => {
  it('limits picks and scores by cell value', () => {
    let s = createGame({ modeId: 'category', config: baseConfig({ rounds: 2 }), bank, now: t, seed: 0.3 });
    s = act(s, { type: 'CONTINUE' });
    expect(s.phase).toBe('board');
    expect(s.seg.cells).toHaveLength(12);
    s = act(s, { type: 'PICK_CELL', cellId: 'history-3' });
    expect(s.current.basePoints).toBe(300);
    expect(s.current.question.category).toBe('history');
    s = answerRight(s);
    expect(s.players[0].score).toBe(300);
    s = act(s, { type: 'NEXT' });
    expect(s.phase).toBe('board');
    s = act(s, { type: 'PICK_CELL', cellId: 'history-3' }); // already used
    expect(s.phase).toBe('board');
    s = act(s, { type: 'PICK_CELL', cellId: 'space-1' });
    s = answerWrong(s);
    expect(s.players[0].score).toBe(330 - 30); // wrong answer gives 0
    s = act(s, { type: 'NEXT' });
    expect(s.phase).toBe('finished');
  });
});

describe('head to head', () => {
  it('alternates turns, opens steals and doubles bonus rounds', () => {
    let s = createGame({ modeId: 'h2h', config: baseConfig({ players: ['أ', 'ب'], rounds: 3 }), bank, now: t, seed: 0.5 });
    expect(s.intro.kind).toBe('turn');
    expect(s.intro.playerIdx).toBe(0);
    s = act(s, { type: 'CONTINUE' });
    // find a non-boolean question by skipping if needed
    while (getInputKind(s.current.question) === 'boolean') {
      s = act(s, { type: 'USE_POWERUP', kind: 'skip' });
      if (getInputKind(s.current.question) === 'boolean') {
        s = answerRight(s);
        s = act(s, { type: 'NEXT' });
        s = act(s, { type: 'CONTINUE' });
      }
    }
    const player = s.current.playerIdx;
    s = answerWrong(s);
    expect(s.current.result.stealTo).toBe(1 - player);
    s = act(s, { type: 'NEXT' });
    expect(s.intro.kind).toBe('steal');
    s = act(s, { type: 'CONTINUE' });
    expect(s.current.isSteal).toBe(true);
    expect(s.current.allowPowerups).toBe(false);
    const before = s.players[1 - player].score;
    s = answerRight(s);
    expect(s.players[1 - player].score).toBeGreaterThan(before);
    s = act(s, { type: 'NEXT' });
    expect(s.phase).toBe('intro');
    expect(s.intro.kind).toBe('turn');
    // play out remaining turns, check bonus round 3
    let sawBonus = false;
    while (s.phase !== 'finished') {
      if (s.phase === 'intro') {
        if (s.intro.kind === 'turn' && s.intro.isBonus) sawBonus = true;
        s = act(s, { type: 'CONTINUE' });
      } else if (s.phase === 'question') {
        if (s.current.multiplier === 2) expect(s.seg.turnNo).toBeGreaterThanOrEqual(4);
        s = answerRight(s);
      } else s = act(s, { type: 'NEXT' });
    }
    expect(sawBonus).toBe(true);
  });

  it('per-question timeout counts and opens steal', () => {
    let s = createGame({ modeId: 'h2h', config: baseConfig({ players: ['أ', 'ب'] }), bank, now: t, seed: 0.6 });
    s = act(s, { type: 'CONTINUE' });
    s = gameReducer(s, { type: 'TIMEOUT', token: s.current.token, now: s.current.deadline + 5, seed: 0.1 });
    expect(s.current.result.timedOut).toBe(true);
    expect(s.players[0].timeouts).toBe(1);
    expect(s.current.result.stealTo).toBe(1);
    // early timeout is ignored
    let s2 = createGame({ modeId: 'h2h', config: baseConfig({ players: ['أ', 'ب'] }), bank, now: t, seed: 0.6 });
    s2 = act(s2, { type: 'CONTINUE' });
    const same = gameReducer(s2, { type: 'TIMEOUT', token: s2.current.token, now: s2.current.startedAt + 10, seed: 0.1 });
    expect(same.phase).toBe('question');
  });
});

describe('power-ups', () => {
  it('fifty-fifty, extra time, double and skip are limited', () => {
    let s = createGame({ modeId: 'category', config: baseConfig({ rounds: 12 }), bank, now: t, seed: 0.7 });
    s = act(s, { type: 'CONTINUE' });
    s = act(s, { type: 'PICK_CELL', cellId: 'general-1' });
    while (getInputKind(s.current.question) !== 'choice' || s.current.options.length < 4) {
      s = answerRight(s);
      s = act(s, { type: 'NEXT' });
      const free = s.seg.cells.find((c) => !c.used);
      s = act(s, { type: 'PICK_CELL', cellId: free.id });
    }
    s = act(s, { type: 'USE_POWERUP', kind: 'fifty' });
    expect(s.current.eliminated).toHaveLength(2);
    expect(s.current.eliminated).not.toContain(s.current.question.answer);
    expect(s.players[0].powerups.fifty).toBe(0);
    const deadline = s.current.deadline;
    s = act(s, { type: 'USE_POWERUP', kind: 'time' });
    expect(s.current.deadline).toBe(deadline + 10000);
    s = act(s, { type: 'USE_POWERUP', kind: 'double' });
    const scoreBefore = s.players[0].score;
    s = answerRight(s);
    expect(s.players[0].score - scoreBefore).toBeGreaterThanOrEqual(s.current.basePoints * 2);
    s = act(s, { type: 'NEXT' });
    const free = s.seg.cells.find((c) => !c.used);
    s = act(s, { type: 'PICK_CELL', cellId: free.id });
    const firstId = s.current.question.id;
    s = act(s, { type: 'USE_POWERUP', kind: 'skip' });
    expect(s.current.question.id).not.toBe(firstId);
    expect(s.current.question.category).toBe(free.categoryId);
    s = act(s, { type: 'USE_POWERUP', kind: 'skip' }); // none left
    expect(s.players[0].powerups.skip).toBe(0);
  });
});

describe('mixed challenge', () => {
  it('runs board with risk, speed round and wager to the end', () => {
    let s = createGame({ modeId: 'mixed', config: baseConfig({ players: ['أ', 'ب'], rounds: 2 }), bank, now: t, seed: 0.8 });
    expect(s.seg.cells.filter((c) => c.golden)).toHaveLength(2);
    const seen = new Set();
    let guard = 0;
    let wagered = false;
    while (s.phase !== 'finished' && guard++ < 500) {
      seen.add(s.seg.type);
      if (s.phase === 'intro') s = act(s, { type: 'CONTINUE' });
      else if (s.phase === 'board') s = act(s, { type: 'PICK_CELL', cellId: s.seg.cells.find((c) => !c.used).id });
      else if (s.phase === 'risk') s = act(s, { type: 'CHOOSE_RISK', risk: true });
      else if (s.phase === 'wager') {
        const p = s.players[s.seg.order[s.seg.pos]];
        s = act(s, { type: 'SET_WAGER', amount: maxWager(p) + 1000 });
        expect(s.current.wager).toBe(maxWager(p));
        wagered = true;
      } else if (s.phase === 'question') {
        if (s.seg.type === 'clock' && s.current.token % 3 === 0) {
          s = gameReducer(s, { type: 'TIMEOUT', token: s.current.token, now: s.seg.deadline + 1, seed: 0.5 });
        } else s = s.current.token % 2 ? answerRight(s) : answerWrong(s);
      } else if (s.phase === 'feedback') s = act(s, { type: 'NEXT' });
    }
    expect(s.phase).toBe('finished');
    expect([...seen]).toEqual(['board', 'clock', 'wager']);
    expect(wagered).toBe(true);
    const ids = s.usedIds;
    expect(new Set(ids).size).toBe(ids.length);
    const ranked = rankPlayers(s.players);
    expect(ranked[0].score).toBeGreaterThanOrEqual(ranked[1].score);
  });
});

describe('categories', () => {
  it('has exactly the 11 Sabaq categories in order', async () => {
    const { CATEGORY_IDS, CATEGORIES } = await import('../src/data/categories.js');
    expect(CATEGORY_IDS).toEqual(['general', 'history', 'geography', 'science', 'technology', 'literature', 'sports', 'football', 'math', 'animals', 'space']);
    expect(CATEGORIES.map((c) => c.name)).toEqual([
      'معلومات عامة', 'تاريخ', 'جغرافيا', 'علوم وطبيعة', 'تقنية', 'أدب وكتب', 'رياضة', 'كرة القدم', 'رياضيات', 'حيوانات', 'فضاء وفلك',
    ]);
  });

  it('no removed category remains anywhere in the source', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const removed = ['أفلام ومسلسلات', 'طعام وطبخ', 'ألعاب فيديو', 'موسيقى', 'مشاهير', 'اقتصاد وأعمال', 'فن وثقافة'];
    const removedIds = ['movies', 'food', 'gaming', 'music', 'people', 'business', 'art'];
    const files = [];
    const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).forEach((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : files.push(path.join(dir, e.name))));
    walk('src');
    for (const f of files) {
      const text = fs.readFileSync(f, 'utf8');
      for (const name of removed) expect(text.includes(name), `${name} in ${f}`).toBe(false);
      for (const id of removedIds) expect(new RegExp(`['"]${id}['"]`).test(text), `${id} in ${f}`).toBe(false);
    }
    expect(bank.every((q) => CATEGORY_IDS.includes(q.category))).toBe(true);
  });
});
