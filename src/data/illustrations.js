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
