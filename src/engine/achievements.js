// Achievements are pure checks over the saved totals (`stats`) and the match that just ended.
// "Me" is the player whose name matches the local profile (player 1 by default).

export const ACHIEVEMENTS = [
  { id: 'first-game', icon: 'flag', title: 'أول سباق', desc: 'أنهِ مباراتك الأولى.', test: ({ stats }) => stats.games >= 1 },
  { id: 'rush-10', icon: 'timer', title: 'ثلاثون ثانية من نار', desc: 'أجب عن 10 أسئلة صحيحة في جولة سباق واحدة.', test: ({ stats }) => stats.rushBestCorrect >= 10 },
  { id: 'streak-5', icon: 'bolt', title: 'سلسلة ذهبية', desc: 'أجب عن 5 أسئلة صحيحة متتالية.', test: ({ stats }) => stats.bestStreak >= 5 },
  { id: 'streak-10', icon: 'flame', title: 'لا يُوقَف', desc: 'أجب عن 10 أسئلة صحيحة متتالية.', test: ({ stats }) => stats.bestStreak >= 10 },
  { id: 'correct-100', icon: 'book', title: 'موسوعة متنقلة', desc: 'اجمع 100 إجابة صحيحة.', test: ({ stats }) => stats.correct >= 100 },
  { id: 'all-categories', icon: 'compass', title: 'رحّالة المعرفة', desc: 'العب في كل الفئات.', test: ({ stats, categoryCount }) => (stats.categories?.length ?? 0) >= categoryCount },
  { id: 'all-modes', icon: 'star', title: 'متعدد المواهب', desc: 'جرّب أنماط اللعب الأربعة.', test: ({ stats }) => (stats.modes?.length ?? 0) >= 4 },
  { id: 'thief', icon: 'hand', title: 'سارق محترف', desc: 'اسرق نقاط منافسك بإجابة صحيحة.', test: ({ stats }) => stats.steals >= 1 },
  { id: 'risk', icon: 'dice', title: 'قلب أسد', desc: 'اربح سؤال مخاطرة أو رهانًا أخيرًا.', test: ({ stats }) => stats.riskWins >= 1 },
  { id: 'winner', icon: 'trophy', title: 'بطل الطاولة', desc: 'افز في مباراة ضد لاعب آخر.', test: ({ stats }) => stats.wins >= 1 },
];

export function evaluateAchievements({ stats, unlocked = [], categoryCount }) {
  const have = new Set(unlocked);
  return ACHIEVEMENTS.filter((a) => !have.has(a.id) && a.test({ stats, categoryCount })).map((a) => a.id);
}

/** Folds one finished match into the saved totals. */
export function foldGameIntoStats(stats, game, myName) {
  const next = {
    ...stats,
    categories: [...(stats.categories ?? [])],
    modes: [...(stats.modes ?? [])],
  };
  next.games += 1;
  for (const p of game.players) {
    next.questions += p.correct + p.wrong + p.timeouts;
    next.correct += p.correct;
    next.bestStreak = Math.max(next.bestStreak, p.bestStreak);
    next.bestScore = Math.max(next.bestScore, p.score);
  }
  for (const h of game.history) {
    if (!next.categories.includes(h.category)) next.categories.push(h.category);
    if (h.steal && h.correct) next.steals += 1;
    if ((h.risk || (h.wager ?? 0) > 0) && h.correct) next.riskWins += 1;
  }
  if (!next.modes.includes(game.modeId)) next.modes.push(game.modeId);

  // Best single 30-second run: correct answers per player inside clock segments.
  const perRun = {};
  for (const h of game.history) {
    if (h.segment !== 'clock' || !h.correct) continue;
    perRun[h.playerIdx] = (perRun[h.playerIdx] ?? 0) + 1;
  }
  next.rushBestCorrect = Math.max(next.rushBestCorrect ?? 0, ...Object.values(perRun), 0);

  if (game.players.length > 1) {
    const top = Math.max(...game.players.map((p) => p.score));
    const winners = game.players.filter((p) => p.score === top);
    if (winners.length === 1 && winners[0].name === myName) next.wins += 1;
  }
  return next;
}
