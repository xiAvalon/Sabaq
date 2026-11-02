// Add a category here and a matching file in ./questions — no engine changes needed.
export const CATEGORIES = [
  { id: 'general', name: 'معلومات عامة', glyph: '✦', color: '#ffc23d' },
  { id: 'history', name: 'تاريخ', glyph: '⌛', color: '#d9a066' },
  { id: 'geography', name: 'جغرافيا', glyph: '◍', color: '#4cc9f0' },
  { id: 'science', name: 'علوم وطبيعة', glyph: '⚗', color: '#5ee0a0' },
  { id: 'technology', name: 'تقنية', glyph: '⌘', color: '#7aa2ff' },
  { id: 'movies', name: 'أفلام ومسلسلات', glyph: '▶', color: '#ff7a8a' },
  { id: 'music', name: 'موسيقى', glyph: '♫', color: '#c77dff' },
  { id: 'gaming', name: 'ألعاب فيديو', glyph: '◈', color: '#00d1b2' },
  { id: 'sports', name: 'رياضة', glyph: '◎', color: '#ff9f43' },
  { id: 'football', name: 'كرة القدم', glyph: '⬢', color: '#8bd450' },
  { id: 'food', name: 'طعام وطبخ', glyph: '◐', color: '#ff8f5a' },
  { id: 'literature', name: 'أدب وكتب', glyph: '❦', color: '#e7c9a9' },
  { id: 'math', name: 'رياضيات', glyph: '∑', color: '#5ad1ff' },
  { id: 'art', name: 'فن وثقافة', glyph: '◭', color: '#ff6fb5' },
  { id: 'business', name: 'اقتصاد وأعمال', glyph: '◆', color: '#ffd166' },
  { id: 'people', name: 'مشاهير', glyph: '☺', color: '#f4a3ff' },
  { id: 'animals', name: 'حيوانات', glyph: '❀', color: '#9ad97a' },
  { id: 'space', name: 'فضاء وفلك', glyph: '✧', color: '#a0a8ff' },
];

export const CATEGORY_IDS = CATEGORIES.map((c) => c.id);
export const getCategory = (id) => CATEGORIES.find((c) => c.id === id) ?? { id, name: id, glyph: '?', color: '#999' };
