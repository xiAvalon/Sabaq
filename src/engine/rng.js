// Small seeded RNG so the reducer stays pure: callers pass a random seed with each action.
export function mulberry32(seed) {
  let a = Math.floor((seed ?? Math.random()) * 2 ** 32) >>> 0 || 1;
  return function rng() {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const pickRandom = (arr, rng = Math.random) => arr[Math.floor(rng() * arr.length)];

export function shuffle(arr, rng = Math.random) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
