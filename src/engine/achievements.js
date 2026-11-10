// Achievements are pure checks over the saved totals (`stats`), each with a progress value.
// "Me" is the player whose name matches the local profile (player 1 by default).

const count = (target, read) => ({
  target,
  progress: (ctx) => Math.min(target, read(ctx)),
  test: (ctx) => read(ctx) >= target,
});

export const ACHIEVEMENTS = [
  { id: 'first-game', icon: 'flag', title: 'أول سباق', desc: 'أنهِ مباراتك الأولى.', ...count(1, ({ stats }) => stats.games) },
  { id: 'winner', icon: 'trophy', title: 'أول انتصار', desc: 'افز في مباراة ضد لاعب آخر.', ...count(1, ({ stats }) => stats.wins) },
  {
    id: 'rush-10',
    icon: 'timer',
    title: 'ثلاثون ثانية من نار',
    desc: 'أجب عن 10 أسئلة صحيحة في جولة سباق واحدة.',
    ...count(10, ({ stats }) => stats.rushBestCorrect ?? 0),
  },
  {
    id: 'quick-thinker',
    icon: 'bolt',
    title: 'سريع البديهة',
    desc: 'أجب إجابة صحيحة في أقل من 3 ثوانٍ، 20 مرة.',
    ...count(20, ({ stats }) => stats.fastCorrect ?? 0),
  },
  { id: 'streak-5', icon: 'flame', title: 'سلسلة ذهبية', desc: 'أجب عن 5 أسئلة صحيحة متتالية.', ...count(5, ({ stats }) => stats.bestStreak) },
  { id: 'streak-10', icon: 'flame', title: 'لا يُوقَف', desc: 'أجب عن 10 أسئلة صحيحة متتالية.', ...count(10, ({ stats }) => stats.bestStreak) },
  {
    id: 'win-streak',
    icon: 'medal',
    title: 'سلسلة انتصارات',
    desc: 'افز في 3 مباريات متتالية ضد آخرين.',
    ...count(3, ({ stats }) => stats.bestWinStreak ?? 0),
  },
  { id: 'champion', icon: 'crown', title: 'بطل التحديات', desc: 'افز في 10 مباريات ضد آخرين.', ...count(10, ({ stats }) => stats.wins) },
  { id: 'correct-100', icon: 'book', title: 'عقل موسوعي', desc: 'اجمع 100 إجابة صحيحة.', ...count(100, ({ stats }) => stats.correct) },
  {
    id: 'history-expert',
    icon: 'history',
    title: 'خبير التاريخ',
    desc: 'أجب عن 25 سؤالًا صحيحًا في التاريخ.',
    ...count(25, ({ stats }) => stats.categoryCorrect?.history ?? 0),
  },
  {
    id: 'all-categories',
    icon: 'compass',
    title: 'رحّالة المعرفة',
    desc: 'العب في كل الفئات.',
    target: 11,
    progress: ({ stats, categoryIds }) => categoryIds.filter((id) => (stats.categories ?? []).includes(id)).length,
    test: ({ stats, categoryIds }) => categoryIds.every((id) => (stats.categories ?? []).includes(id)),
  },
  { id: 'all-modes', icon: 'star', title: 'متعدد المواهب', desc: 'جرّب أنماط اللعب الأربعة.', ...count(4, ({ stats }) => stats.modes?.length ?? 0) },
  { id: 'thief', icon: 'hand', title: 'سارق محترف', desc: 'اسرق نقاط منافسك بإجابة صحيحة.', ...count(1, ({ stats }) => stats.steals) },
  { id: 'risk', icon: 'dice', title: 'قلب أسد', desc: 'اربح سؤال مخاطرة أو رهانًا أخيرًا.', ...count(1, ({ stats }) => stats.riskWins) },
];

export function evaluateAchievements({ stats, unlocked = [], categoryIds }) {
  const have = new Set(unlocked);
  return ACHIEVEMENTS.filter((a) => !have.has(a.id) && a.test({ stats, categoryIds })).map((a) => a.id);
}

export const FAST_ANSWER_MS = 3000;

/** Folds one finished match into the saved totals. */
export function foldGameIntoStats(stats, game, myName) {
  const next = {
    ...stats,
    categories: [...(stats.categories ?? [])],
    modes: [...(stats.modes ?? [])],
    categoryCorrect: { ...(stats.categoryCorrect ?? {}) },
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
    if (h.correct) {
      next.categoryCorrect[h.category] = (next.categoryCorrect[h.category] ?? 0) + 1;
      if (h.ms > 0 && h.ms < FAST_ANSWER_MS) next.fastCorrect = (next.fastCorrect ?? 0) + 1;
    }
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
    const iWon = winners.length === 1 && winners[0].name === myName;
    if (iWon) next.wins += 1;
    next.winStreak = iWon ? (next.winStreak ?? 0) + 1 : 0;
    next.bestWinStreak = Math.max(next.bestWinStreak ?? 0, next.winStreak);
  }
  return next;
}
