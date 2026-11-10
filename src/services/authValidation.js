// Front-end validation for the login and sign-up forms. Nothing here talks to a server or
// stores what the player types.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const MIN_PASSWORD = 8;

export function validateLogin({ email, password }) {
  const errors = {};
  if (!email.trim()) errors.email = 'اكتب بريدك الإلكتروني.';
  else if (!EMAIL_RE.test(email.trim())) errors.email = 'صيغة البريد غير صحيحة، مثل name@example.com';
  if (!password) errors.password = 'اكتب كلمة المرور.';
  else if (password.length < MIN_PASSWORD) errors.password = `كلمة المرور ${MIN_PASSWORD} أحرف على الأقل.`;
  return errors;
}

export function validateSignup({ name, email, password, confirm, terms }) {
  const errors = validateLogin({ email, password });
  const n = name.trim();
  if (!n) errors.name = 'اكتب اسمك كما سيظهر للاعبين.';
  else if (n.length < 2) errors.name = 'الاسم حرفان على الأقل.';
  else if (n.length > 18) errors.name = 'الاسم 18 حرفًا على الأكثر.';
  if (!confirm) errors.confirm = 'أعد كتابة كلمة المرور.';
  else if (confirm !== password) errors.confirm = 'كلمتا المرور غير متطابقتين.';
  if (!terms) errors.terms = 'يلزم الموافقة على الشروط للمتابعة.';
  return errors;
}

const LEVELS = ['ضعيفة جدًا', 'ضعيفة', 'متوسطة', 'جيدة', 'قوية'];

/** 0–4 score with an Arabic label and the checks that are still missing. */
export function passwordStrength(password) {
  if (!password) return { score: 0, label: '', tips: [] };
  const checks = {
    length: password.length >= MIN_PASSWORD,
    long: password.length >= 12,
    mixed: /[a-z]/.test(password) && /[A-Z]/.test(password),
    digit: /\d/.test(password),
    symbol: /[^A-Za-z0-9\s]/.test(password),
  };
  let score = 0;
  if (checks.length) score += 1;
  if (checks.long) score += 1;
  if (checks.digit) score += 1;
  if (checks.mixed || checks.symbol) score += 1;
  if (!checks.length) score = Math.min(score, 1);
  const tips = [];
  if (!checks.length) tips.push(`${MIN_PASSWORD} أحرف على الأقل`);
  if (!checks.digit) tips.push('أضف رقمًا');
  if (!checks.mixed && !checks.symbol) tips.push('أضف رمزًا أو حرفًا كبيرًا');
  return { score, label: LEVELS[score], tips };
}
