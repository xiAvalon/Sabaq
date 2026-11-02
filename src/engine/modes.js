// Game modes are recipes of segments. A new mode = a new entry here; the engine already
// knows how to run each segment type: clock, board, turns, wager.

export const MODES = [
  {
    id: 'clock',
    name: 'سباق الساعة',
    tagline: 'أكبر عدد من الإجابات الصحيحة قبل أن يصل العداد إلى الصفر',
    glyph: '⏱',
    players: { min: 1, max: 6 },
    options: ['clockSeconds', 'difficulty'],
    categoryRange: { min: 1, max: null },
    defaults: { clockSeconds: 60, difficulty: 'mixed' },
    rules: [
      'لكل لاعب عداد واحد للجولة كلها، ويلعب اللاعبون بالتناوب.',
      'الإجابة الصحيحة تمنح نقاطًا حسب الصعوبة، والخاطئة لا تمنح شيئًا.',
      'تزداد الصعوبة كلما أجبت بشكل صحيح في الوضع المتدرّج.',
    ],
    buildSegments: (cfg) => [{ type: 'clock', title: 'سباق الساعة', duration: cfg.clockSeconds }],
  },
  {
    id: 'category',
    name: 'تحدي الفئات',
    tagline: 'اختر الفئة والقيمة: سؤال سهل بنقاط قليلة أم صعب بنقاط كثيرة؟',
    glyph: '▦',
    players: { min: 1, max: 6 },
    options: ['rounds', 'questionTime'],
    categoryRange: { min: 3, max: 6 },
    defaults: { rounds: 4 },
    roundsLabel: 'اختيارات لكل لاعب',
    rules: [
      'لوحة من الفئات المختارة، وفي كل فئة ثلاثة أسئلة: 100 و200 و300 نقطة.',
      'لكل لاعب عدد محدود من الاختيارات، فاختر بذكاء.',
      'الإجابة الخاطئة لا تخصم شيئًا.',
    ],
    buildSegments: (cfg) => [
      { type: 'board', title: 'لوحة الفئات', picksPerPlayer: cfg.rounds, golden: 0, risk: false, steal: false },
    ],
  },
  {
    id: 'h2h',
    name: 'وجهًا لوجه',
    tagline: 'لاعبان أو فريقان بالتناوب، مع فرص السرقة والجولات الذهبية',
    glyph: '⚔',
    players: { min: 2, max: 2 },
    options: ['rounds', 'questionTime', 'difficulty'],
    categoryRange: { min: 1, max: null },
    defaults: { rounds: 6, difficulty: 'mixed' },
    roundsLabel: 'عدد الجولات',
    rules: [
      'يتناوب الطرفان على الأسئلة، ولكل سؤال وقت محدد.',
      'إذا أخطأ أحدهما أو نفد وقته، يحصل الآخر على فرصة لسرقة النقاط.',
      'كل جولة ثالثة جولة ذهبية: النقاط مضاعفة.',
    ],
    buildSegments: (cfg) => [{ type: 'turns', title: 'المواجهة', rounds: cfg.rounds, bonusEvery: 3, steal: true }],
  },
  {
    id: 'mixed',
    name: 'التحدي الشامل',
    tagline: 'لوحة بأسئلة ذهبية ومخاطرة، ثم جولة سرعة، ثم رهان أخير',
    glyph: '★',
    players: { min: 1, max: 6 },
    options: ['rounds', 'questionTime'],
    categoryRange: { min: 3, max: 6 },
    defaults: { rounds: 3 },
    roundsLabel: 'اختيارات اللوحة لكل لاعب',
    rules: [
      'الجولة الأولى لوحة فئات فيها سؤالان ذهبيان مخفيان بنقاط مضاعفة.',
      'قبل كل سؤال يمكنك المخاطرة: ضعف النقاط إن أصبت، وخسارة القيمة إن أخطأت.',
      'الجولة الثانية 30 ثانية سرعة لكل لاعب، والأخيرة رهان على سؤال صعب.',
    ],
    buildSegments: (cfg) => [
      {
        type: 'board',
        title: 'الجولة الأولى: اللوحة',
        picksPerPlayer: cfg.rounds,
        golden: 2,
        risk: true,
        steal: cfg.players.length > 1,
      },
      { type: 'clock', title: 'الجولة الثانية: السرعة', duration: 30 },
      { type: 'wager', title: 'الجولة الأخيرة: الرهان' },
    ],
  },
];

export const getMode = (id) => MODES.find((m) => m.id === id) ?? null;
