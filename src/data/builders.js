// Compact builders so question files stay readable. Each returns a plain question object
// in the shape the engine (and a future API) expects.

export const mcq = (id, difficulty, prompt, options, answer, extra = {}) => ({ id, type: 'mcq', difficulty, prompt, options, answer, ...extra });
export const tf = (id, difficulty, prompt, answer, extra = {}) => ({ id, type: 'truefalse', difficulty, prompt, answer, ...extra });
export const open = (id, difficulty, prompt, answer, accept = [], extra = {}) => ({ id, type: 'open', difficulty, prompt, answer, accept, ...extra });
export const num = (id, difficulty, prompt, answer, tolerance = 0, extra = {}) => ({ id, type: 'number', difficulty, prompt, answer, tolerance, ...extra });
export const complete = (id, difficulty, prompt, answer, extra = {}) => ({ id, type: 'complete', difficulty, prompt, answer, ...extra });
export const whoami = (id, difficulty, clues, answer, extra = {}) => ({ id, type: 'whoami', difficulty, prompt: extra.prompt ?? 'من أنا؟', clues, answer, ...extra });
export const seq = (id, difficulty, prompt, sequence, answer, extra = {}) => ({ id, type: 'sequence', difficulty, prompt, sequence, answer, ...extra });
export const img = (id, difficulty, prompt, media, answer, extra = {}) => ({ id, type: 'image', difficulty, prompt, media, answer, ...extra });

export const withCategory = (category, questions) => questions.map((q) => ({ ...q, category }));

export const svg = (markup) => ({ kind: 'svg', svg: markup });
export const emoji = (char, label) => ({ kind: 'emoji', char, label });
