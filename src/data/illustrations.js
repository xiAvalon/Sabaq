// Hand-drawn SVG illustrations for image questions (no external assets needed).
const wrap = (body, vb = '0 0 300 200') => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}">${body}</svg>`;

export const FLAG_JAPAN = wrap('<rect width="300" height="200" fill="#ffffff"/><circle cx="150" cy="100" r="60" fill="#bc002d"/>');

export const FLAG_GERMANY = wrap(
  '<rect width="300" height="67" fill="#000000"/><rect y="67" width="300" height="66" fill="#dd0000"/><rect y="133" width="300" height="67" fill="#ffce00"/>',
);

export const FLAG_ITALY = wrap(
  '<rect width="100" height="200" fill="#009246"/><rect x="100" width="100" height="200" fill="#ffffff"/><rect x="200" width="100" height="200" fill="#ce2b37"/>',
);

export const SATURN = wrap(
  '<rect width="300" height="200" fill="#0b1026"/>' +
    '<circle cx="40" cy="30" r="1.6" fill="#fff"/><circle cx="260" cy="40" r="1.2" fill="#fff"/><circle cx="230" cy="170" r="1.5" fill="#fff"/><circle cx="70" cy="160" r="1.1" fill="#fff"/>' +
    '<g transform="rotate(-16 150 100)">' +
    '<ellipse cx="150" cy="100" rx="120" ry="26" fill="none" stroke="#e8cf9a" stroke-width="10"/>' +
    '<circle cx="150" cy="100" r="52" fill="#e3b46b"/>' +
    '<path d="M102 86 Q150 78 198 86" stroke="#c99550" stroke-width="7" fill="none"/><path d="M99 110 Q150 102 201 110" stroke="#c99550" stroke-width="6" fill="none"/>' +
    '<path d="M30 100 A120 26 0 0 0 270 100" fill="none" stroke="#e8cf9a" stroke-width="10"/>' +
    '</g>',
);

export const WATER_MOLECULE = wrap(
  '<rect width="300" height="200" fill="#10183a"/>' +
    '<line x1="150" y1="90" x2="90" y2="140" stroke="#cfd6ff" stroke-width="10"/><line x1="150" y1="90" x2="210" y2="140" stroke="#cfd6ff" stroke-width="10"/>' +
    '<circle cx="150" cy="88" r="42" fill="#ff4d5e"/><circle cx="88" cy="142" r="24" fill="#f4f1ff"/><circle cx="212" cy="142" r="24" fill="#f4f1ff"/>',
);

export const HEXAGON = wrap(
  '<rect width="300" height="200" fill="#10183a"/><polygon points="150,30 211,65 211,135 150,170 89,135 89,65" fill="#4cc9f0" stroke="#f4f1ff" stroke-width="5"/>',
);

export const CLOCK_THREE = wrap(
  '<rect width="300" height="200" fill="#10183a"/><circle cx="150" cy="100" r="80" fill="#f4f1ff"/><circle cx="150" cy="100" r="80" fill="none" stroke="#ffc23d" stroke-width="8"/>' +
    Array.from({ length: 12 }, (_, i) => {
      const a = (i * Math.PI) / 6;
      const x1 = 150 + Math.sin(a) * 64, y1 = 100 - Math.cos(a) * 64;
      const x2 = 150 + Math.sin(a) * 72, y2 = 100 - Math.cos(a) * 72;
      return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="#10183a" stroke-width="${i % 3 === 0 ? 5 : 2.5}"/>`;
    }).join('') +
    '<line x1="150" y1="100" x2="195" y2="100" stroke="#10183a" stroke-width="8" stroke-linecap="round"/>' +
    '<line x1="150" y1="100" x2="150" y2="40" stroke="#ff4d5e" stroke-width="5" stroke-linecap="round"/><circle cx="150" cy="100" r="6" fill="#10183a"/>',
);

export const COLOR_MIX = wrap(
  '<rect width="300" height="200" fill="#10183a"/><circle cx="110" cy="100" r="62" fill="#1e5bff"/><circle cx="190" cy="100" r="62" fill="#ffd400"/>' +
    '<text x="150" y="115" font-size="44" font-family="sans-serif" font-weight="700" fill="#10183a" text-anchor="middle">+</text>',
);

export const CHESSBOARD = wrap(
  '<rect width="300" height="200" fill="#10183a"/>' +
    Array.from({ length: 64 }, (_, i) => {
      const r = Math.floor(i / 8), c = i % 8;
      return `<rect x="${70 + c * 20}" y="${20 + r * 20}" width="20" height="20" fill="${(r + c) % 2 ? '#8a5a35' : '#f0d9b5'}"/>`;
    }).join('') +
    '<rect x="70" y="20" width="160" height="160" fill="none" stroke="#ffc23d" stroke-width="3"/>',
);

// ---- simple flags (geometric only) ----
const vbar = (a, b, c) => wrap(`<rect width="100" height="200" fill="${a}"/><rect x="100" width="100" height="200" fill="${b}"/><rect x="200" width="100" height="200" fill="${c}"/>`);
const hbar = (a, b, c) => wrap(`<rect width="300" height="67" fill="${a}"/><rect y="67" width="300" height="66" fill="${b}"/><rect y="133" width="300" height="67" fill="${c}"/>`);
const h2 = (a, b) => wrap(`<rect width="300" height="100" fill="${a}"/><rect y="100" width="300" height="100" fill="${b}"/>`);

export const FLAG_FRANCE = vbar('#002654', '#ffffff', '#ce1126');
export const FLAG_IRELAND = vbar('#169b62', '#ffffff', '#ff883e');
export const FLAG_NIGERIA = vbar('#008751', '#ffffff', '#008751');
export const FLAG_BELGIUM = vbar('#000000', '#fdda24', '#ef3340');
export const FLAG_NETHERLANDS = hbar('#ae1c28', '#ffffff', '#21468b');
export const FLAG_RUSSIA = hbar('#ffffff', '#0039a6', '#d52b1e');
export const FLAG_AUSTRIA = hbar('#ed2939', '#ffffff', '#ed2939');
export const FLAG_INDONESIA = h2('#ce1126', '#ffffff');
export const FLAG_POLAND = h2('#ffffff', '#dc143c');
export const FLAG_UKRAINE = h2('#0057b7', '#ffd700');
export const FLAG_BANGLADESH = wrap('<rect width="300" height="200" fill="#006a4e"/><circle cx="135" cy="100" r="60" fill="#f42a41"/>');
export const FLAG_SWITZERLAND = wrap('<rect width="300" height="200" fill="#d52b1e"/><rect x="130" y="40" width="40" height="120" fill="#ffffff"/><rect x="90" y="80" width="120" height="40" fill="#ffffff"/>');
export const FLAG_SWEDEN = wrap('<rect width="300" height="200" fill="#006aa7"/><rect x="90" width="36" height="200" fill="#fecc00"/><rect y="82" width="300" height="36" fill="#fecc00"/>');
export const FLAG_DENMARK = wrap('<rect width="300" height="200" fill="#c8102e"/><rect x="90" width="30" height="200" fill="#ffffff"/><rect y="85" width="300" height="30" fill="#ffffff"/>');
export const FLAG_FINLAND = wrap('<rect width="300" height="200" fill="#ffffff"/><rect x="85" width="50" height="200" fill="#002f6c"/><rect y="75" width="300" height="50" fill="#002f6c"/>');

// ---- shapes and diagrams ----
const panel = (body) => wrap(`<rect width="300" height="200" fill="#10183a"/>${body}`);
export const TRIANGLE = panel('<polygon points="150,30 240,170 60,170" fill="#ffc857" stroke="#f5f6fa" stroke-width="5"/>');
export const PENTAGON = panel('<polygon points="150,25 228,82 198,172 102,172 72,82" fill="#5be3a6" stroke="#f5f6fa" stroke-width="5"/>');
export const OCTAGON = panel('<polygon points="118,25 182,25 228,71 228,129 182,175 118,175 72,129 72,71" fill="#ff5c7a" stroke="#f5f6fa" stroke-width="5"/>');
export const RIGHT_ANGLE = panel('<polyline points="80,40 80,160 220,160" fill="none" stroke="#32c5d2" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/><rect x="80" y="135" width="25" height="25" fill="none" stroke="#ffc857" stroke-width="4"/>');
export const CRESCENT_MOON = panel('<circle cx="150" cy="100" r="62" fill="#f5f6fa"/><circle cx="178" cy="88" r="56" fill="#10183a"/><circle cx="60" cy="40" r="2" fill="#fff"/><circle cx="250" cy="150" r="2" fill="#fff"/>');
export const FULL_MOON = panel('<circle cx="150" cy="100" r="62" fill="#e9e6d8"/><circle cx="128" cy="82" r="12" fill="#cfcab4"/><circle cx="170" cy="115" r="16" fill="#cfcab4"/><circle cx="150" cy="70" r="7" fill="#cfcab4"/>');
export const EARTH_DAY_NIGHT = panel('<circle cx="150" cy="100" r="64" fill="#2a6fdb"/><path d="M150 36 A64 64 0 0 1 150 164 Z" fill="#0b1022" opacity="0.7"/><path d="M120 70 q15 -12 30 0 q8 18 -8 26 q-20 4 -22 -26z" fill="#5be3a6"/><circle cx="40" cy="100" r="22" fill="#ffc857"/>');
export const BAR_MAGNET = panel('<rect x="60" y="80" width="90" height="44" fill="#ff5c7a"/><rect x="150" y="80" width="90" height="44" fill="#5fa8ff"/><text x="105" y="110" font-family="sans-serif" font-size="26" font-weight="700" fill="#fff" text-anchor="middle">N</text><text x="195" y="110" font-family="sans-serif" font-size="26" font-weight="700" fill="#fff" text-anchor="middle">S</text>');
export const NUMBER_LINE = panel('<line x1="30" y1="110" x2="270" y2="110" stroke="#f5f6fa" stroke-width="4"/>' + [0, 1, 2, 3, 4, 5, 6].map((i) => `<line x1="${45 + i * 35}" y1="98" x2="${45 + i * 35}" y2="122" stroke="#f5f6fa" stroke-width="3"/>`).join('') + '<circle cx="185" cy="110" r="10" fill="#ffc857"/><text x="45" y="150" font-family="sans-serif" font-size="20" fill="#b3b8d6" text-anchor="middle">0</text><text x="255" y="150" font-family="sans-serif" font-size="20" fill="#b3b8d6" text-anchor="middle">6</text>');
export const PIE_QUARTER = panel('<circle cx="150" cy="100" r="70" fill="#283056"/><path d="M150 100 L150 30 A70 70 0 0 1 220 100 Z" fill="#32c5d2"/><circle cx="150" cy="100" r="70" fill="none" stroke="#f5f6fa" stroke-width="3"/>');
