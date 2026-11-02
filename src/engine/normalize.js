// Arabic-aware answer normalisation and fuzzy matching for typed answers.

const DIACRITICS = /[ً-ٰٟـ]/g; // harakat, dagger alef, tatweel

export function toWesternDigits(value) {
  return String(value)
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));
}

export function normalizeText(value) {
  let t = toWesternDigits(value ?? '').toLowerCase().trim();
  t = t
    .replace(DIACRITICS, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  // Drop the definite article so "النحاس" and "نحاس" match.
  return t
    .split(' ')
    .map((w) => (w.length > 3 && w.startsWith('ال') ? w.slice(2) : w))
    .join(' ');
}

export function levenshtein(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[b.length];
}

function allowedTypos(length) {
  if (length >= 8) return 2;
  if (length >= 4) return 1;
  return 0;
}

export function matchesText(input, accepted) {
  const given = normalizeText(input);
  if (!given) return false;
  const compactGiven = given.replace(/\s/g, '');
  return accepted.some((candidate) => {
    const target = normalizeText(candidate);
    if (!target) return false;
    const compactTarget = target.replace(/\s/g, '');
    if (given === target || compactGiven === compactTarget) return true;
    return levenshtein(compactGiven, compactTarget) <= allowedTypos(compactTarget.length);
  });
}

export function parseNumber(input) {
  if (typeof input === 'number') return Number.isFinite(input) ? input : null;
  const cleaned = toWesternDigits(input ?? '')
    .replace(/[\s,٬]/g, '')
    .replace(/٫/g, '.')
    .trim();
  if (!cleaned || !/^-?\d*\.?\d+$/.test(cleaned)) return null;
  return Number(cleaned);
}
