import { SCORING } from './config.js';

const round10 = (n) => Math.round(n / 10) * 10;

export function streakBonusRate(streakBefore) {
  // streakBefore = correct answers in a row before this one.
  return Math.min(streakBefore * SCORING.streakStep, SCORING.streakMax);
}

export function clueFactor(extraClues) {
  return Math.max(SCORING.clueFloor, 1 - extraClues * SCORING.cluePenalty);
}

/**
 * Points for one answer, with a breakdown the UI can show.
 * wager: final-round bet (win or lose exactly that amount).
 * risk: player chose to gamble (×2 on success, lose base value on failure).
 */
export function scoreAnswer({ base, correct, streakBefore = 0, multiplier = 1, risk = false, extraClues = 0, wager = null }) {
  if (wager !== null && wager !== undefined) {
    return { points: correct ? wager : -wager, wager, streakRate: 0, multiplier: 1 };
  }
  if (!correct) {
    return { points: risk ? -base : 0, streakRate: 0, multiplier: 1, risk };
  }
  const streakRate = streakBonusRate(streakBefore);
  const totalMultiplier = multiplier * (risk ? SCORING.riskMultiplier : 1);
  const value = base * clueFactor(extraClues);
  return {
    points: round10(value * (1 + streakRate) * totalMultiplier),
    streakRate,
    multiplier: totalMultiplier,
    clueFactor: clueFactor(extraClues),
    risk,
  };
}
