// Random question selection without repeats in a session.
import { pickRandom } from './rng.js';

/**
 * Picks an unused question. Preference order:
 * selected categories → (unless strict) any category; exact difficulty → nearest difficulty.
 * Returns null when nothing unused is left.
 */
export function pickQuestion(bank, usedIds, criteria = {}, rng = Math.random) {
  const used = usedIds instanceof Set ? usedIds : new Set(usedIds);
  const { categories, difficulty, types, strictCategory = false, excludeIds = [], avoidIds = null } = criteria;
  const fresh = bank.filter((q) => !used.has(q.id) && !excludeIds.includes(q.id) && (!types || types.includes(q.type)));
  const inCategories = categories?.length ? fresh.filter((q) => categories.includes(q.category)) : fresh;
  const tiers = strictCategory ? [inCategories] : [inCategories, fresh];

  const avoid = avoidIds ? (avoidIds instanceof Set ? avoidIds : new Set(avoidIds)) : null;
  // Prefer questions not seen in recent matches; fall back to seen ones before giving up.
  const pick = (list) => {
    if (avoid) {
      const unseen = list.filter((q) => !avoid.has(q.id));
      if (unseen.length) return pickRandom(unseen, rng);
    }
    return pickRandom(list, rng);
  };

  for (const list of tiers) {
    if (!list.length) continue;
    if (difficulty === null || difficulty === undefined || difficulty === 'mixed') return pick(list);
    for (const distance of [0, 1, 2]) {
      const near = list.filter((q) => Math.abs(q.difficulty - difficulty) === distance);
      if (near.length) return pick(near);
    }
  }
  return null;
}
