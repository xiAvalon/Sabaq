// Turns the setup form ("draft") into an engine config, with validation and randomisers.
import { getMode, MODES } from './modes.js';
import { pickRandom, shuffle } from './rng.js';
import { CLOCK_CHOICES, DIFFICULTY_CHOICES, QUESTION_TIME_CHOICES } from './config.js';

export const ROUNDS_RANGE = {
  category: { min: 1, max: 6 },
  h2h: { min: 2, max: 10 },
  mixed: { min: 1, max: 5 },
};

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const randInt = (min, max, rng) => min + Math.floor(rng() * (max - min + 1));

export const defaultName = (playerMode, i) => (playerMode === 'teams' ? `الفريق ${i + 1}` : `اللاعب ${i + 1}`);

export function fitNames(names, count, playerMode) {
  return Array.from({ length: count }, (_, i) => names[i] ?? defaultName(playerMode, i));
}

export function makeDraft(modeId, { settings = {}, last = {}, categoryIds }) {
  const mode = getMode(modeId);
  const playerMode = last.playerMode ?? 'players';
  const playerCount = clamp(last.playerCount ?? mode.players.min, mode.players.min, mode.players.max);
  let categories = (last.categories?.length ? last.categories : categoryIds.slice(0, 6)).filter((id) => categoryIds.includes(id));
  if (mode.categoryRange.max) categories = categories.slice(0, mode.categoryRange.max);
  if (categories.length < mode.categoryRange.min) categories = categoryIds.slice(0, Math.max(mode.categoryRange.min, 4));
  return {
    modeId,
    playerMode,
    playerCount,
    names: fitNames(last.names ?? [], playerCount, playerMode),
    categories,
    difficulty: last.difficulty ?? mode.defaults.difficulty ?? 'mixed',
    questionTime: last.questionTime ?? settings.questionTime ?? 'auto',
    rounds: last.roundsByMode?.[modeId] ?? mode.defaults.rounds ?? 4,
    clockSeconds: last.clockSeconds ?? mode.defaults.clockSeconds ?? 60,
    powerups: last.powerups ?? 1,
  };
}

export function draftErrors(draft) {
  const mode = getMode(draft.modeId);
  const errors = [];
  const { min, max } = mode.categoryRange;
  if (draft.categories.length < min) errors.push(min === 1 ? 'اختر فئة واحدة على الأقل.' : `اختر ${min} فئات على الأقل.`);
  if (max && draft.categories.length > max) errors.push(`الحد الأقصى ${max} فئات لهذا النمط.`);
  const trimmed = draft.names.slice(0, draft.playerCount).map((n) => n.trim()).filter(Boolean);
  if (new Set(trimmed).size !== trimmed.length) errors.push('اجعل لكل لاعب اسمًا مختلفًا.');
  return errors;
}

export function draftToConfig(draft) {
  return {
    players: draft.names.slice(0, draft.playerCount).map((n, i) => n.trim() || defaultName(draft.playerMode, i)),
    categories: draft.categories,
    difficulty: draft.difficulty,
    questionTime: draft.questionTime,
    rounds: draft.rounds,
    clockSeconds: draft.clockSeconds,
    powerups: draft.powerups,
  };
}

export function draftToMemory(draft, previous = {}) {
  return {
    playerMode: draft.playerMode,
    playerCount: draft.playerCount,
    names: draft.names,
    categories: draft.categories,
    difficulty: draft.difficulty,
    questionTime: draft.questionTime,
    clockSeconds: draft.clockSeconds,
    powerups: draft.powerups,
    roundsByMode: { ...(previous.roundsByMode ?? {}), [draft.modeId]: draft.rounds },
  };
}

export function randomizeDraft(draft, categoryIds, rng = Math.random) {
  const mode = getMode(draft.modeId);
  const maxCats = Math.min(mode.categoryRange.max ?? 6, categoryIds.length);
  const minCats = Math.max(mode.categoryRange.min, 3);
  const range = ROUNDS_RANGE[draft.modeId];
  return {
    ...draft,
    categories: shuffle(categoryIds, rng).slice(0, randInt(minCats, maxCats, rng)),
    difficulty: pickRandom(DIFFICULTY_CHOICES, rng).id,
    questionTime: pickRandom(QUESTION_TIME_CHOICES.filter((t) => t === 'auto' || t >= 15), rng),
    rounds: range ? randInt(range.min, Math.min(range.max, range.min + 4), rng) : draft.rounds,
    clockSeconds: pickRandom(CLOCK_CHOICES.slice(0, 3), rng),
  };
}

export function quickPlay(categoryIds, settings = {}, rng = Math.random) {
  const mode = pickRandom(MODES, rng);
  const base = makeDraft(mode.id, { settings, last: { playerCount: mode.players.min }, categoryIds });
  const draft = randomizeDraft({ ...base, powerups: 1 }, categoryIds, rng);
  return { modeId: mode.id, config: draftToConfig(draft) };
}
