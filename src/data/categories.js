// The 11 Sabaq categories. Add a category here and a matching file in ./questions —
// no engine changes needed.
export const CATEGORIES = [
  { id: 'general', name: 'معلومات عامة', icon: 'general', color: '#FFC857' },
  { id: 'history', name: 'تاريخ', icon: 'history', color: '#E8A66B' },
  { id: 'geography', name: 'جغرافيا', icon: 'geography', color: '#32C5D2' },
  { id: 'science', name: 'علوم وطبيعة', icon: 'science', color: '#5BE3A6' },
  { id: 'technology', name: 'تقنية', icon: 'technology', color: '#8C84FF' },
  { id: 'literature', name: 'أدب وكتب', icon: 'literature', color: '#F29CB8' },
  { id: 'sports', name: 'رياضة', icon: 'sports', color: '#FF9E57' },
  { id: 'football', name: 'كرة القدم', icon: 'football', color: '#8EDB6F' },
  { id: 'math', name: 'رياضيات', icon: 'math', color: '#5FA8FF' },
  { id: 'animals', name: 'حيوانات', icon: 'animals', color: '#D9C25B' },
  { id: 'space', name: 'فضاء وفلك', icon: 'space', color: '#B48CFF' },
];

export const CATEGORY_IDS = CATEGORIES.map((c) => c.id);
export const getCategory = (id) => CATEGORIES.find((c) => c.id === id) ?? { id, name: id, icon: 'sparkles', color: '#999' };
