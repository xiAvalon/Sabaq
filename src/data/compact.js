// Compact authoring format for the question bank.
//
//   M(difficulty, prompt, 'correct|wrong|wrong|wrong', explanation?)   multiple choice
//   T(difficulty, statement, true|false, explanation?)                 true / false
//   O(difficulty, prompt, 'answer/accepted/accepted', explanation?)    typed answer
//   N(difficulty, prompt, number, tolerance = 0, explanation?)         guess the number
//   C(difficulty, 'text with ____', 'a|b|c|d' or 'answer/alt', ex?)    complete the statement
//   W(difficulty, [clue, clue, clue], 'a|b|c|d' or 'answer/alt', ex?)  who am I?
//   S(difficulty, prompt, [item, item, item], 'a|b|c|d', ex?)          what comes next?
//   I(difficulty, prompt, media, 'a|b|c|d' or answer, ex?)             image question
//
// In option lists the FIRST option is the correct one; options are shuffled at runtime.
// In typed answers the first value is shown as the answer and the rest are accepted spellings.
// Ids are a hash of the question text, so they stay stable and double as duplicate detection.

const split = (s) => s.split('|').map((x) => x.trim());
const alts = (s) => s.split('/').map((x) => x.trim()).filter(Boolean);

function answerOf(spec) {
  if (typeof spec !== 'string') return { answer: spec };
  if (spec.includes('|')) {
    const options = split(spec);
    return { answer: options[0], options };
  }
  const [answer, ...accept] = alts(spec);
  return { answer, accept };
}

const withEx = (q, explanation) => (explanation ? { ...q, explanation } : q);

export const M = (difficulty, prompt, spec, ex) => withEx({ type: 'mcq', difficulty, prompt, ...answerOf(spec) }, ex);
export const T = (difficulty, prompt, answer, ex) => withEx({ type: 'truefalse', difficulty, prompt, answer }, ex);
export const O = (difficulty, prompt, spec, ex) => withEx({ type: 'open', difficulty, prompt, ...answerOf(spec) }, ex);
export const N = (difficulty, prompt, answer, tolerance = 0, ex) => withEx({ type: 'number', difficulty, prompt, answer, tolerance }, ex);
export const C = (difficulty, prompt, spec, ex) => withEx({ type: 'complete', difficulty, prompt, ...answerOf(spec) }, ex);
export const W = (difficulty, clues, spec, ex) => withEx({ type: 'whoami', difficulty, prompt: 'من أنا؟', clues, ...answerOf(spec) }, ex);
export const S = (difficulty, prompt, sequence, spec, ex) => withEx({ type: 'sequence', difficulty, prompt, sequence, ...answerOf(spec) }, ex);
export const I = (difficulty, prompt, media, spec, ex) => withEx({ type: 'image', difficulty, prompt, media, ...answerOf(spec) }, ex);

export function hashId(text) {
  let h = 0x811c9dc5;
  for (const ch of text) {
    h ^= ch.codePointAt(0);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(36).padStart(7, '0');
}

/** Adds category and a stable id to each compact question. */
export function defineQuestions(category, prefix, rows) {
  return rows.map((q) => {
    const key = [q.prompt, q.clues?.join('،'), q.sequence?.join('،'), String(q.answer)].filter(Boolean).join('¦');
    return { id: `${prefix}-${hashId(key)}`, category, ...q };
  });
}

export const emoji = (char, alt) => ({ kind: 'emoji', char, alt });
export const svgMedia = (svg, alt) => ({ kind: 'svg', svg, alt });
