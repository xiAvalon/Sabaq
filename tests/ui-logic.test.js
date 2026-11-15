import { describe, expect, it } from 'vitest';
import { passwordStrength, validateLogin, validateSignup } from '../src/services/authValidation.js';
import { progression, xpForLevel, xpOf } from '../src/engine/progression.js';
import { ACHIEVEMENTS } from '../src/engine/achievements.js';
import { CATEGORY_IDS } from '../src/data/categories.js';
import { EMPTY_STATS } from '../src/services/storage.js';

describe('auth form validation (front end only)', () => {
  it('requires email and password on login', () => {
    expect(validateLogin({ email: '', password: '' })).toEqual({ email: expect.any(String), password: expect.any(String) });
  });
  it('checks email format and minimum length', () => {
    const e = validateLogin({ email: 'sara@', password: 'abc' });
    expect(e.email).toMatch(/صيغة/);
    expect(e.password).toMatch(/8/);
    expect(validateLogin({ email: ' sara@example.com ', password: 'abcdefgh' })).toEqual({});
  });
  it('checks matching passwords, name and terms on sign-up', () => {
    const base = { name: 'سارة', email: 'sara@example.com', password: 'Sabaq2026!', confirm: 'Sabaq2026!', terms: true };
    expect(validateSignup(base)).toEqual({});
    expect(validateSignup({ ...base, confirm: 'Sabaq2026?' }).confirm).toMatch(/متطابقتين/);
    expect(validateSignup({ ...base, terms: false }).terms).toBeTruthy();
    expect(validateSignup({ ...base, name: ' ' }).name).toBeTruthy();
    expect(validateSignup({ ...base, name: 'س' }).name).toMatch(/حرفان/);
  });
  it('scores password strength 0–4', () => {
    expect(passwordStrength('').score).toBe(0);
    expect(passwordStrength('abc').score).toBeLessThanOrEqual(1);
    expect(passwordStrength('abcdefgh').score).toBe(1);
    expect(passwordStrength('abcdefgh1').score).toBe(2);
    expect(passwordStrength('Abcdefgh1').score).toBe(3);
    expect(passwordStrength('Abcdefgh1234!').score).toBe(4);
    expect(passwordStrength('Abcdefgh1234!').tips).toEqual([]);
  });
});

describe('local progression', () => {
  it('starts at level 1 with no games', () => {
    const p = progression(EMPTY_STATS);
    expect(p).toMatchObject({ xp: 0, level: 1, rank: 'مبتدئ', into: 0, span: 300, toNext: 300 });
  });
  it('derives XP only from real stats', () => {
    expect(xpOf({ correct: 10, games: 2, wins: 1 })).toBe(100 + 50 + 50);
    expect(xpForLevel(2)).toBe(300);
    expect(xpForLevel(3)).toBe(900);
    const p = progression({ correct: 60, games: 6, wins: 3 }); // 600 + 150 + 150 = 900
    expect(p.level).toBe(3);
    expect(p.rank).toBe('مثابر');
    expect(p.into).toBe(0);
  });
  it('gives every achievement a target and bounded progress', () => {
    const stats = { ...EMPTY_STATS, games: 50, wins: 50, correct: 500, bestStreak: 30, categoryCorrect: { history: 99 }, categories: CATEGORY_IDS, modes: ['a', 'b', 'c', 'd'] };
    for (const a of ACHIEVEMENTS) {
      expect(a.target).toBeGreaterThan(0);
      expect(a.progress({ stats: EMPTY_STATS, categoryIds: CATEGORY_IDS })).toBe(0);
      expect(a.progress({ stats, categoryIds: CATEGORY_IDS })).toBeLessThanOrEqual(a.target);
    }
  });
});
