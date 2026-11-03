// localStorage wrapper: every read/write is guarded so the game works when storage is blocked.
import { evaluateAchievements, foldGameIntoStats } from '../engine/achievements.js';

const PREFIX = 'sabaq:';

function readObj(key, fallback) {
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback;
  } catch {
    return fallback;
  }
}

function readList(key) {
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(key, value) {
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    /* storage unavailable: keep playing without saving */
  }
}

export const DEFAULT_SETTINGS = {
  sound: true,
  volume: 0.7,
  questionTime: 'auto',
  showExplanations: true,
  reduceMotion: false,
};

export const loadSettings = () => readObj('settings', DEFAULT_SETTINGS);
export const saveSettings = (s) => write('settings', s);

export const DEFAULT_PROFILE = { name: 'لاعب', color: 0 };
export const loadProfile = () => readObj('profile', DEFAULT_PROFILE);
export const saveProfile = (p) => write('profile', p);

export const loadLastSetup = () => readObj('lastSetup', {});
export const saveLastSetup = (s) => write('lastSetup', s);

export const EMPTY_STATS = {
  games: 0,
  questions: 0,
  correct: 0,
  bestStreak: 0,
  bestScore: 0,
  rushBestCorrect: 0,
  steals: 0,
  riskWins: 0,
  wins: 0,
  categories: [],
  modes: [],
};
export const loadStats = () => readObj('stats', EMPTY_STATS);
export const loadLeaderboard = () => readList('leaderboard');
export const loadAchievements = () => readList('achievements');

// Recently asked questions, so new matches prefer questions the group has not seen yet.
const SEEN_LIMIT = 600;
export const loadSeenQuestions = () => readList('seen');

/**
 * Records a finished game once: totals, leaderboard, seen questions and achievements.
 * Returns the ids of achievements unlocked by this game.
 */
export function recordGame(game, { myName, categoryIds }) {
  const recorded = readList('recordedGames');
  if (recorded.includes(game.id)) return readList(`unlockedBy:${game.id}`);

  const stats = foldGameIntoStats(loadStats(), game, myName);
  write('stats', stats);

  const date = new Date(game.finishedAt ?? Date.now()).toISOString();
  const entries = game.players.map((p) => {
    const attempts = p.correct + p.wrong + p.timeouts;
    return { name: p.name, score: p.score, mode: game.modeId, accuracy: attempts ? Math.round((p.correct / attempts) * 100) : 0, date };
  });
  write('leaderboard', [...loadLeaderboard(), ...entries].sort((a, b) => b.score - a.score).slice(0, 100));

  const seen = [...new Set([...game.usedIds, ...loadSeenQuestions()])].slice(0, SEEN_LIMIT);
  write('seen', seen);

  const unlocked = loadAchievements();
  const fresh = evaluateAchievements({ stats, unlocked, categoryIds });
  write('achievements', [...unlocked, ...fresh]);
  write(`unlockedBy:${game.id}`, fresh);
  write('recordedGames', [...recorded, game.id].slice(-30));
  return fresh;
}

export function resetProgress() {
  try {
    Object.keys(window.localStorage)
      .filter((k) => k.startsWith(PREFIX) && !['settings', 'profile', 'lastSetup'].some((keep) => k === PREFIX + keep))
      .forEach((k) => window.localStorage.removeItem(k));
  } catch {
    /* ignore */
  }
}
