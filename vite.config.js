import { createHash } from 'node:crypto';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'node:fs';

const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

const BASE = '/Sabaq/';

/**
 * Emits sw.js after the bundle is built, with the exact list of files to precache, so the
 * app reopens offline after the first visit. No extra dependency needed.
 */
function serviceWorker() {
  return {
    name: 'sabaq-service-worker',
    apply: 'build',
    generateBundle(_, bundle) {
      const files = Object.keys(bundle).filter((f) => !f.endsWith('.map'));
      const statics = ['', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/maskable-512.png', 'icons/apple-touch-icon.png', 'favicon.svg'];
      const precache = [...new Set([...statics, ...files])];
      const version = createHash('sha1').update(precache.join('|')).digest('hex').slice(0, 10);
      const source = `// Generated at build time. Precaches the app shell and question bank.
const BASE = ${JSON.stringify(BASE)};
const CACHE = 'sabaq-${version}';
const FONT_CACHE = 'sabaq-fonts';
const PRECACHE = ${JSON.stringify(precache)}.map((p) => BASE + p);

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('sabaq-') && k !== CACHE && k !== FONT_CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Online multiplayer always goes to the network.
  if (url.hostname.endsWith('supabase.co') || url.hostname.endsWith('supabase.in')) return;

  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(
      caches.open(FONT_CACHE).then(async (cache) => {
        const hit = await cache.match(req);
        const fresh = fetch(req).then((res) => { if (res.ok || res.type === 'opaque') cache.put(req, res.clone()); return res; }).catch(() => hit);
        return hit || fresh;
      }),
    );
    return;
  }

  if (url.origin !== self.location.origin || !url.pathname.startsWith(BASE)) return;

  // Pages: network first so updates arrive, cached app shell when offline.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(BASE, copy)); return res; })
        .catch(() => caches.match(BASE)),
    );
    return;
  }

  // Built assets are content-hashed: cache first.
  event.respondWith(
    caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
      return res;
    })),
  );
});
`;
      this.emitFile({ type: 'asset', fileName: 'sw.js', source });
    },
  };
}

export default defineConfig({
  base: BASE,
  plugins: [react(), serviceWorker()],
  define: { __ROUTER__: JSON.stringify('browser'), __APP_VERSION__: JSON.stringify(version) },
  test: { environment: 'node' },
});
