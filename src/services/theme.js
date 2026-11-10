// Theme preference: 'dark' (default) or 'light'. Applied to <html data-theme>, saved locally.
// index.html applies the saved value before first paint; this module keeps it in sync afterwards.
const KEY = 'sabaq:theme';
const META = { dark: '#11172e', light: '#f5f6fc' };

export function readTheme() {
  if (typeof document === 'undefined') return 'dark';
  return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
}

export function applyTheme(theme, { animate = true } = {}) {
  const next = theme === 'light' ? 'light' : 'dark';
  const root = document.documentElement;
  const reduced = root.dataset.motion === 'reduced' || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (animate && !reduced) {
    root.classList.add('theme-switching');
    window.setTimeout(() => root.classList.remove('theme-switching'), 320);
  }
  root.setAttribute('data-theme', next);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', META[next]);
  try {
    window.localStorage.setItem(KEY, next);
  } catch {
    /* storage blocked: the theme still applies for this visit */
  }
  return next;
}
