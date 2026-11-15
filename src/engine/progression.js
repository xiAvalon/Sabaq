// Local level and rank, computed only from the player's real saved statistics.

const RANKS = [
  { from: 1, title: 'مبتدئ' },
  { from: 3, title: 'مثابر' },
  { from: 5, title: 'متمكّن' },
  { from: 8, title: 'خبير' },
  { from: 12, title: 'أسطورة سباق' },
];

export const xpOf = (stats) => (stats.correct ?? 0) * 10 + (stats.games ?? 0) * 25 + (stats.wins ?? 0) * 50;

/** XP needed to reach a level: 0, 300, 900, 1800, … (each level asks 300 more than the last). */
export const xpForLevel = (level) => (300 * (level - 1) * level) / 2;

export function progression(stats) {
  const xp = xpOf(stats);
  let level = 1;
  while (xp >= xpForLevel(level + 1)) level += 1;
  const floor = xpForLevel(level);
  const next = xpForLevel(level + 1);
  const rank = [...RANKS].reverse().find((r) => level >= r.from).title;
  const nextRank = RANKS.find((r) => r.from > level) ?? null;
  return { xp, level, rank, nextRank, into: xp - floor, span: next - floor, toNext: next - xp };
}
