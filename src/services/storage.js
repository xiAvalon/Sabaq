// localStorage wrapper: every read/write is guarded so the game works when storage is blocked.
const PREFIX = 'sabaq:';

function read(key, fallback) {
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

export const loadSettings = () => read('settings', DEFAULT_SETTINGS);
export const saveSettings = (s) => write('settings', s);

export const loadLastSetup = () => read('lastSetup', {});
export const saveLastSetup = (s) => write('lastSetup', s);

const EMPTY_STATS = { games: 0, questions: 0, correct: 0, bestStreak: 0, bestScore: 0 };
export const loadStats = () => read('stats', EMPTY_STATS);
export const loadLeaderboard = () => readList('leaderboard');

/** Records a finished game once: updates totals and adds every player to the leaderboard. */
export function recordGame(game) {
  const seen = readList('recordedGames');
  if (seen.includes(game.id)) return;
  const stats = loadStats();
  const next = { ...stats, games: stats.games + 1 };
  for (const p of game.players) {
    next.questions += p.correct + p.wrong + p.timeouts;
    next.correct += p.correct;
    next.bestStreak = Math.max(next.bestStreak, p.bestStreak);
    next.bestScore = Math.max(next.bestScore, p.score);
  }
  write('stats', next);

  const date = new Date(game.finishedAt ?? Date.now()).toISOString();
  const entries = game.players.map((p) => {
    const attempts = p.correct + p.wrong + p.timeouts;
    return {
      name: p.name,
      score: p.score,
      mode: game.modeId,
      accuracy: attempts ? Math.round((p.correct / attempts) * 100) : 0,
      date,
    };
  });
  const board = [...loadLeaderboard(), ...entries].sort((a, b) => b.score - a.score).slice(0, 100);
  write('leaderboard', board);
  write('recordedGames', [...seen, game.id].slice(-50));
}

export function resetProgress() {
  try {
    ['stats', 'leaderboard', 'recordedGames'].forEach((k) => window.localStorage.removeItem(PREFIX + k));
  } catch {
    /* ignore */
  }
}
