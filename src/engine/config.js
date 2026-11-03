// Central tuning knobs for the game. Change values here, not inside components.

export const DIFFICULTIES = {
  1: { id: 1, label: 'سهل', points: 100, timeBonus: 0 },
  2: { id: 2, label: 'متوسط', points: 200, timeBonus: 5 },
  3: { id: 3, label: 'صعب', points: 300, timeBonus: 5 },
};

export const DIFFICULTY_CHOICES = [
  { id: 'mixed', label: 'متدرّج' },
  { id: 1, label: 'سهل' },
  { id: 2, label: 'متوسط' },
  { id: 3, label: 'صعب' },
];

export const SCORING = {
  streakStep: 0.1, // +10% per consecutive correct answer after the first
  streakMax: 0.5, // capped at +50%
  cluePenalty: 0.15, // each extra "Who am I?" clue removes 15% of the value
  clueFloor: 0.4, // value never drops below 40%
  riskMultiplier: 2,
  goldenMultiplier: 2,
  bonusRoundMultiplier: 2,
  minWagerCap: 300, // players with low scores may still wager up to this
};

export const TIMING = {
  extraTimeMs: 10000,
  stealFactor: 0.6,
  stealMinMs: 8000,
  clockFeedbackMs: 900,
};

export const POWERUPS = {
  fifty: { id: 'fifty', label: '50:50', hint: 'يحذف إجابتين خاطئتين' },
  time: { id: 'time', label: '+10 ث', hint: 'يضيف 10 ثوانٍ إلى العداد' },
  double: { id: 'double', label: '×2', hint: 'يضاعف نقاط هذا السؤال' },
  skip: { id: 'skip', label: 'تبديل', hint: 'يستبدل السؤال دون خسارة نقاط' },
};
export const POWERUP_IDS = Object.keys(POWERUPS);

export const PLAYER_COLORS = ['#FFC857', '#32C5D2', '#FF7A93', '#9D94FF', '#5BE3A6', '#FF9E57'];

export const QUESTION_TIME_CHOICES = ['auto', 10, 15, 20, 30];
export const CLOCK_CHOICES = [30, 45, 60];
export const POWERUP_COUNT_CHOICES = [0, 1, 2];
export const BOARD_MAX_CATEGORIES = 6;
export const BOARD_MIN_CATEGORIES = 3;
