// Online modes reuse the offline mode identities but run on the server.
export const ONLINE_MODES = [
  {
    id: 'rush',
    name: 'سباق الـ30 ثانية',
    icon: 'timer',
    tagline: 'الجميع يجيب في الوقت نفسه على الأسئلة نفسها. الأسرع يجمع أكثر.',
    roundsRange: { min: 1, max: 5 },
  },
  {
    id: 'turns',
    name: 'وجهًا لوجه بالدور',
    icon: 'swords',
    tagline: 'لكل لاعب دوره ووقته، والخطأ يفتح فرصة سرقة للاعب التالي.',
    roundsRange: { min: 1, max: 10 },
  },
];

export const DEFAULT_ONLINE_SETTINGS = {
  mode: 'rush',
  categories: ['general', 'history', 'geography', 'science', 'technology', 'literature', 'sports', 'football', 'math', 'animals', 'space'],
  difficulty: 'mixed',
  rounds: 3,
  duration: 30,
  question_time: 20,
};

export const getOnlineMode = (id) => ONLINE_MODES.find((m) => m.id === id) ?? ONLINE_MODES[0];

export const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const cleanCode = (raw) =>
  String(raw ?? '')
    .toUpperCase()
    .split('')
    .filter((ch) => ROOM_CODE_ALPHABET.includes(ch))
    .join('')
    .slice(0, 6);

export const inviteLink = (code) => `${window.location.origin}${import.meta.env.BASE_URL}room/${code}`;
