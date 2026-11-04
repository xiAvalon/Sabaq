// Pure game engine. Every action carries `now` (ms) and `seed` (0..1) so the reducer never
// reads the clock or Math.random itself. The UI only dispatches actions and renders state.
import { DIFFICULTIES, POWERUP_IDS, PLAYER_COLORS, SCORING, TIMING, BOARD_MAX_CATEGORIES } from './config.js';
import { getMode } from './modes.js';
import { pickQuestion } from './pool.js';
import { mulberry32, pickRandom, shuffle } from './rng.js';
import { scoreAnswer } from './scoring.js';
import {
  canUseFiftyFifty,
  checkAnswer,
  defaultPoints,
  defaultTimeSeconds,
  getInputKind,
  listQuestionTypes,
} from './questionTypes.js';

const SPEED_TYPES = () => listQuestionTypes().filter((t) => t.speedFriendly).map((t) => t.id);

// ---------- helpers ----------

export function questionTimeMs(config, q) {
  const seconds = config.questionTime === 'auto' || !config.questionTime ? defaultTimeSeconds(q) : config.questionTime;
  return seconds * 1000;
}

export const maxWager = (player) => Math.max(player.score, SCORING.minWagerCap);

const updatePlayer = (players, idx, patch) => players.map((p, i) => (i === idx ? { ...p, ...patch } : p));

function draw(state, criteria, rng) {
  return pickQuestion(state.bank, state.usedIds, { avoidIds: state.recentIds, ...criteria }, rng);
}

function clockLevel(state) {
  const d = state.config.difficulty;
  if (d && d !== 'mixed') return d;
  const c = state.seg.correctInRun;
  return c < 3 ? 1 : c < 6 ? 2 : 3;
}

function turnsLevel(state, isBonus) {
  const d = state.config.difficulty;
  if (d && d !== 'mixed') return d;
  const progress = state.seg.turnNo / state.seg.totalTurns;
  const level = progress < 1 / 3 ? 1 : progress < 2 / 3 ? 2 : 3;
  return Math.min(3, level + (isBonus ? 1 : 0));
}

function startQuestion(state, q, opts) {
  const { playerIdx, now, rng, multiplier = 1, basePoints, cellId = null, risk = false, wager = null } = opts;
  const token = state.token + 1;
  const isClock = state.seg.type === 'clock';
  const limit = isClock ? null : questionTimeMs(state.config, q);
  return {
    ...state,
    token,
    phase: 'question',
    intro: null,
    usedIds: state.usedIds.includes(q.id) ? state.usedIds : [...state.usedIds, q.id],
    current: {
      token,
      question: q,
      options: q.options ? shuffle(q.options, rng) : null,
      playerIdx,
      startedAt: now,
      deadline: isClock ? state.seg.deadline : now + limit,
      timeLimitMs: limit,
      multiplier,
      basePoints: basePoints ?? defaultPoints(q),
      cellId,
      risk,
      wager,
      isSteal: false,
      allowPowerups: wager === null,
      eliminated: [],
      cluesShown: 1,
      doubled: opts.doubled ?? false,
      usedPowerups: opts.usedPowerups ?? [],
      result: null,
    },
  };
}

function finish(state, now) {
  return { ...state, phase: 'finished', current: null, intro: null, finishedAt: now };
}

// ---------- segments ----------

function enterSegment(state, index, rng, now) {
  if (index >= state.segments.length) return finish(state, now);
  const def = state.segments[index];
  const n = state.players.length;
  const base = { ...state, segIndex: index, current: null, phase: 'intro' };

  if (def.type === 'clock') {
    const seg = { ...def, order: state.players.map((_, i) => i), pos: 0, remaining: def.duration * 1000, deadline: null, correctInRun: 0 };
    return { ...base, seg, intro: { kind: 'clock', playerIdx: 0 } };
  }

  if (def.type === 'board') {
    const cats = state.config.categories.slice(0, BOARD_MAX_CATEGORIES);
    let cells = [];
    for (const categoryId of cats) {
      for (const d of [1, 2, 3]) {
        cells.push({ id: `${categoryId}-${d}`, categoryId, difficulty: d, value: DIFFICULTIES[d].points, used: false, golden: false, wonBy: null, outcome: null });
      }
    }
    const goldenIds = shuffle(cells.map((c) => c.id), rng).slice(0, def.golden ?? 0);
    cells = cells.map((c) => (goldenIds.includes(c.id) ? { ...c, golden: true } : c));
    const totalPicks = Math.min(cells.length, def.picksPerPlayer * n);
    const seg = { ...def, categories: cats, cells, totalPicks, picksMade: 0, turnPlayer: 0, pendingCell: null };
    return { ...base, seg, intro: { kind: 'segment', playerIdx: 0 } };
  }

  if (def.type === 'turns') {
    const seg = { ...def, totalTurns: def.rounds * n, turnNo: 0 };
    return { ...base, seg, intro: turnIntro({ ...base, seg }, rng) };
  }

  if (def.type === 'wager') {
    const order = state.players.map((p, i) => i).sort((a, b) => state.players[a].score - state.players[b].score);
    const seg = { ...def, order, pos: 0, categoryId: pickRandom(state.config.categories, rng) };
    return { ...base, seg, intro: { kind: 'wager', playerIdx: order[0], categoryId: seg.categoryId } };
  }

  throw new Error(`Unknown segment type ${def.type}`);
}

function turnIntro(state, rng) {
  const { seg, players } = state;
  const n = players.length;
  const round = Math.floor(seg.turnNo / n) + 1;
  const isBonus = seg.bonusEvery > 0 && round % seg.bonusEvery === 0;
  return {
    kind: 'turn',
    playerIdx: seg.turnNo % n,
    round,
    rounds: seg.rounds,
    isBonus,
    categoryId: pickRandom(state.config.categories, rng),
  };
}

function nextClockQuestion(state, rng, now) {
  const level = clockLevel(state);
  const criteria = { categories: state.config.categories, difficulty: level };
  const q = draw(state, { ...criteria, types: SPEED_TYPES() }, rng) ?? draw(state, criteria, rng);
  if (!q) return endClockRun(state, rng, now);
  const playerIdx = state.seg.order[state.seg.pos];
  return startQuestion(state, q, { playerIdx, now, rng });
}

function endClockRun(state, rng, now) {
  const pos = state.seg.pos + 1;
  if (pos < state.seg.order.length) {
    const seg = { ...state.seg, pos, remaining: state.seg.duration * 1000, deadline: null, correctInRun: 0 };
    return { ...state, seg, phase: 'intro', current: null, intro: { kind: 'clock', playerIdx: seg.order[pos] } };
  }
  return enterSegment(state, state.segIndex + 1, rng, now);
}

function advance(state, rng, now) {
  const { seg } = state;
  if (seg.type === 'clock') {
    if (state.current?.result?.clockEnded || seg.remaining <= 0) return endClockRun(state, rng, now);
    const resumed = { ...state, seg: { ...seg, deadline: now + seg.remaining } };
    return nextClockQuestion(resumed, rng, now);
  }
  if (seg.type === 'board') {
    const nextSeg = { ...seg, turnPlayer: (seg.turnPlayer + 1) % state.players.length, pendingCell: null };
    const remaining = nextSeg.cells.some((c) => !c.used);
    if (nextSeg.picksMade >= nextSeg.totalPicks || !remaining) {
      return enterSegment({ ...state, seg: nextSeg }, state.segIndex + 1, rng, now);
    }
    return { ...state, seg: nextSeg, phase: 'board', current: null };
  }
  if (seg.type === 'turns') {
    const nextSeg = { ...seg, turnNo: seg.turnNo + 1 };
    if (nextSeg.turnNo >= nextSeg.totalTurns) return enterSegment({ ...state, seg: nextSeg }, state.segIndex + 1, rng, now);
    const next = { ...state, seg: nextSeg, current: null, phase: 'intro' };
    return { ...next, intro: turnIntro(next, rng) };
  }
  if (seg.type === 'wager') {
    const pos = seg.pos + 1;
    if (pos >= seg.order.length) return enterSegment(state, state.segIndex + 1, rng, now);
    const nextSeg = { ...seg, pos };
    return { ...state, seg: nextSeg, phase: 'intro', current: null, intro: { kind: 'wager', playerIdx: seg.order[pos], categoryId: seg.categoryId } };
  }
  return state;
}

// ---------- answering ----------

function stealTarget(state, correct, timedOut) {
  const c = state.current;
  const n = state.players.length;
  if (!state.seg.steal || n < 2 || correct || c.isSteal || c.wager !== null) return null;
  // A wrong true/false answer gives the answer away, so only a timeout opens a steal.
  if (getInputKind(c.question) === 'boolean' && !timedOut) return null;
  const from = state.seg.type === 'board' ? state.seg.turnPlayer : c.playerIdx;
  return (from + 1) % n;
}

function resolve(state, { answer, timedOut, now }) {
  const c = state.current;
  const q = c.question;
  const p = state.players[c.playerIdx];
  const correct = !timedOut && checkAnswer(q, answer);
  const elapsed = Math.max(0, now - c.startedAt);
  const breakdown = scoreAnswer({
    base: c.basePoints,
    correct,
    streakBefore: c.isSteal || c.wager !== null ? 0 : p.streak,
    multiplier: c.multiplier * (c.doubled ? 2 : 1),
    risk: c.risk,
    extraClues: q.type === 'whoami' ? c.cluesShown - 1 : 0,
    wager: c.wager,
  });
  const streak = correct ? p.streak + 1 : 0;
  const players = updatePlayer(state.players, c.playerIdx, {
    score: p.score + breakdown.points,
    correct: p.correct + (correct ? 1 : 0),
    wrong: p.wrong + (!correct && !timedOut ? 1 : 0),
    timeouts: p.timeouts + (timedOut ? 1 : 0),
    streak,
    bestStreak: Math.max(p.bestStreak, streak),
    answerMs: p.answerMs + (timedOut ? 0 : elapsed),
    answered: p.answered + (timedOut ? 0 : 1),
  });

  let seg = state.seg;
  if (seg.type === 'clock') {
    seg = { ...seg, remaining: Math.max(0, seg.deadline - now), correctInRun: seg.correctInRun + (correct ? 1 : 0) };
  }
  if (seg.type === 'board' && c.cellId) {
    seg = {
      ...seg,
      cells: seg.cells.map((cell) =>
        cell.id === c.cellId
          ? { ...cell, wonBy: correct ? c.playerIdx : cell.wonBy, outcome: correct ? 'won' : cell.outcome ?? 'missed' }
          : cell,
      ),
    };
  }

  const stealTo = stealTarget({ ...state, seg }, correct, timedOut);
  const history = [
    ...state.history,
    {
      qid: q.id,
      prompt: q.prompt,
      category: q.category,
      difficulty: q.difficulty,
      type: q.type,
      answer: q.answer,
      given: answer ?? null,
      playerIdx: c.playerIdx,
      correct,
      timedOut,
      points: breakdown.points,
      ms: elapsed,
      steal: c.isSteal,
      risk: c.risk,
      wager: c.wager,
      segment: seg.type,
    },
  ];

  return {
    ...state,
    players,
    seg,
    history,
    phase: 'feedback',
    current: { ...c, result: { correct, timedOut, given: answer ?? null, points: breakdown.points, breakdown, stealTo } },
  };
}

function prepareSteal(state) {
  const c = state.current;
  const kind = getInputKind(c.question);
  const wrongPick = kind === 'choice' && c.result.given && c.result.given !== c.question.answer ? [c.result.given] : [];
  const fullLimit = c.timeLimitMs ?? questionTimeMs(state.config, c.question);
  const limit = Math.max(TIMING.stealMinMs, Math.round(fullLimit * TIMING.stealFactor));
  const token = state.token + 1;
  return {
    ...state,
    token,
    phase: 'intro',
    intro: { kind: 'steal', playerIdx: c.result.stealTo, fromIdx: c.playerIdx },
    current: {
      ...c,
      token,
      playerIdx: c.result.stealTo,
      isSteal: true,
      risk: false,
      doubled: false,
      allowPowerups: false,
      eliminated: [...new Set([...c.eliminated, ...wrongPick])],
      cluesShown: c.question.clues ? c.question.clues.length : 1,
      timeLimitMs: limit,
      result: null,
    },
  };
}

// ---------- power-ups ----------

function usePowerup(state, kind, rng, now) {
  const c = state.current;
  const p = state.players[c.playerIdx];
  if (!c.allowPowerups || !p.powerups[kind] || c.usedPowerups.includes(kind)) return state;
  const spend = (s) => ({
    ...s,
    players: updatePlayer(s.players, c.playerIdx, { powerups: { ...p.powerups, [kind]: p.powerups[kind] - 1 } }),
  });
  const mark = (cur) => ({ ...cur, usedPowerups: [...cur.usedPowerups, kind] });

  if (kind === 'fifty') {
    if (!canUseFiftyFifty(c.question)) return state;
    const wrong = c.options.filter((o) => o !== c.question.answer && !c.eliminated.includes(o));
    const removed = shuffle(wrong, rng).slice(0, 2);
    return spend({ ...state, current: mark({ ...c, eliminated: [...c.eliminated, ...removed] }) });
  }
  if (kind === 'time') {
    const extra = TIMING.extraTimeMs;
    const seg = state.seg.type === 'clock' ? { ...state.seg, deadline: state.seg.deadline + extra, bonusMs: (state.seg.bonusMs ?? 0) + extra } : state.seg;
    const current = mark({ ...c, deadline: c.deadline + extra, timeLimitMs: c.timeLimitMs === null ? null : c.timeLimitMs + extra });
    return spend({ ...state, seg, current });
  }
  if (kind === 'double') {
    return spend({ ...state, current: mark({ ...c, doubled: true }) });
  }
  if (kind === 'skip') {
    const q = c.question;
    const isClock = state.seg.type === 'clock';
    const criteria = isClock
      ? { categories: state.config.categories, difficulty: clockLevel(state) }
      : { categories: [q.category], difficulty: q.difficulty };
    const replacement = draw(state, { ...criteria, strictCategory: !isClock }, rng) ?? draw(state, criteria, rng);
    if (!replacement) return state;
    const skippedPlayer = { skipped: p.skipped + 1, powerups: { ...p.powerups, skip: p.powerups.skip - 1 } };
    const next = { ...state, players: updatePlayer(state.players, c.playerIdx, skippedPlayer) };
    const started = startQuestion(next, replacement, {
      playerIdx: c.playerIdx,
      now,
      rng,
      multiplier: c.multiplier,
      basePoints: c.cellId ? c.basePoints : undefined,
      cellId: c.cellId,
      risk: c.risk,
      doubled: c.doubled,
      usedPowerups: [...c.usedPowerups, 'skip'],
    });
    return started;
  }
  return state;
}

// ---------- public API ----------

export function createPlayers(names, powerupCount) {
  return names.map((name, i) => ({
    id: i,
    name,
    color: PLAYER_COLORS[i % PLAYER_COLORS.length],
    score: 0,
    correct: 0,
    wrong: 0,
    timeouts: 0,
    skipped: 0,
    streak: 0,
    bestStreak: 0,
    answerMs: 0,
    answered: 0,
    powerups: Object.fromEntries(POWERUP_IDS.map((k) => [k, powerupCount])),
  }));
}

export function createGame({ modeId, config, bank, recentIds = [], now = Date.now(), seed = Math.random() }) {
  const mode = getMode(modeId);
  if (!mode) throw new Error(`Unknown mode ${modeId}`);
  const rng = mulberry32(seed);
  const state = {
    id: `g${now}-${Math.floor(seed * 1e6)}`,
    modeId,
    config,
    bank,
    recentIds: new Set(recentIds),
    players: createPlayers(config.players, config.powerups ?? 1),
    segments: mode.buildSegments(config),
    segIndex: -1,
    seg: null,
    phase: 'intro',
    intro: null,
    current: null,
    usedIds: [],
    history: [],
    token: 0,
    startedAt: now,
    finishedAt: null,
  };
  return enterSegment(state, 0, rng, now);
}

export function gameReducer(state, action) {
  if (!state) return state;
  const now = action.now ?? Date.now();
  const rng = mulberry32(action.seed ?? Math.random());
  const { seg, current } = state;

  switch (action.type) {
    case 'CONTINUE': {
      if (state.phase !== 'intro') return state;
      const intro = state.intro;
      if (intro.kind === 'steal') {
        return {
          ...state,
          phase: 'question',
          intro: null,
          current: { ...current, startedAt: now, deadline: now + current.timeLimitMs },
        };
      }
      if (seg.type === 'clock') {
        return nextClockQuestion({ ...state, seg: { ...seg, deadline: now + seg.remaining } }, rng, now);
      }
      if (seg.type === 'board') return { ...state, phase: 'board', intro: null };
      if (seg.type === 'wager') return { ...state, phase: 'wager', intro: null };
      if (seg.type === 'turns') {
        const criteria = { categories: [intro.categoryId], difficulty: turnsLevel(state, intro.isBonus) };
        const q = draw(state, criteria, rng);
        if (!q) return finish(state, now);
        return startQuestion(state, q, {
          playerIdx: intro.playerIdx,
          now,
          rng,
          multiplier: intro.isBonus ? SCORING.bonusRoundMultiplier : 1,
        });
      }
      return state;
    }

    case 'PICK_CELL': {
      if (state.phase !== 'board') return state;
      const cell = seg.cells.find((c) => c.id === action.cellId);
      if (!cell || cell.used) return state;
      const nextSeg = {
        ...seg,
        picksMade: seg.picksMade + 1,
        cells: seg.cells.map((c) => (c.id === cell.id ? { ...c, used: true } : c)),
      };
      const next = { ...state, seg: nextSeg };
      if (seg.risk) return { ...next, phase: 'risk', seg: { ...nextSeg, pendingCell: cell.id } };
      return startCellQuestion(next, cell, false, rng, now);
    }

    case 'CHOOSE_RISK': {
      if (state.phase !== 'risk') return state;
      const cell = seg.cells.find((c) => c.id === seg.pendingCell);
      return startCellQuestion({ ...state, seg: { ...seg, pendingCell: null } }, cell, !!action.risk, rng, now);
    }

    case 'SET_WAGER': {
      if (state.phase !== 'wager') return state;
      const playerIdx = seg.order[seg.pos];
      const amount = Math.max(0, Math.min(maxWager(state.players[playerIdx]), Math.round(Number(action.amount) || 0)));
      const q = draw(state, { categories: [seg.categoryId], difficulty: 3 }, rng);
      if (!q) return advance(state, rng, now);
      return startQuestion(state, q, { playerIdx, now, rng, wager: amount, basePoints: amount });
    }

    case 'SUBMIT': {
      if (state.phase !== 'question' || action.token !== current.token) return state;
      if (seg.type === 'clock' && now >= seg.deadline) return clockExpired(state, now);
      return resolve(state, { answer: action.answer, timedOut: false, now });
    }

    case 'TIMEOUT': {
      if (state.phase !== 'question' || action.token !== current.token) return state;
      if (now < current.deadline) return state;
      if (seg.type === 'clock') return clockExpired(state, now);
      return resolve(state, { answer: null, timedOut: true, now });
    }

    case 'REVEAL_CLUE': {
      if (state.phase !== 'question' || current.question.type !== 'whoami') return state;
      if (current.cluesShown >= current.question.clues.length) return state;
      return { ...state, current: { ...current, cluesShown: current.cluesShown + 1 } };
    }

    case 'USE_POWERUP': {
      if (state.phase !== 'question') return state;
      return usePowerup(state, action.kind, rng, now);
    }

    case 'NEXT': {
      if (state.phase !== 'feedback') return state;
      if (current.result.stealTo !== null && current.result.stealTo !== undefined) return prepareSteal(state);
      return advance(state, rng, now);
    }

    default:
      return state;
  }
}

function startCellQuestion(state, cell, risk, rng, now) {
  const q =
    draw(state, { categories: [cell.categoryId], difficulty: cell.difficulty, strictCategory: true }, rng) ??
    draw(state, { difficulty: cell.difficulty }, rng);
  if (!q) return advance(state, rng, now);
  return startQuestion(state, q, {
    playerIdx: state.seg.turnPlayer,
    now,
    rng,
    basePoints: cell.value,
    multiplier: cell.golden ? SCORING.goldenMultiplier : 1,
    cellId: cell.id,
    risk,
  });
}

function clockExpired(state, now) {
  // The run's clock hit zero mid-question: the question is dropped, not counted as wrong.
  return {
    ...state,
    phase: 'feedback',
    seg: { ...state.seg, remaining: 0 },
    current: {
      ...state.current,
      result: { correct: false, timedOut: true, clockEnded: true, given: null, points: 0, breakdown: { points: 0 }, stealTo: null },
    },
  };
}
