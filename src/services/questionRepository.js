// Single entry point for questions. Swap the body of loadQuestions() for a fetch() to an
// API or database later; the rest of the app only depends on this function.
import { QUESTION_BANK } from '../data/questions/index.js';
import { CATEGORY_IDS } from '../data/categories.js';
import { validateQuestion } from '../engine/questionTypes.js';

let cache = null;

export async function loadQuestions() {
  if (cache) return cache;
  const valid = [];
  for (const q of QUESTION_BANK) {
    const errors = validateQuestion(q, CATEGORY_IDS);
    if (errors.length) console.warn(`Skipping question ${q.id}:`, errors.join(', '));
    else valid.push(q);
  }
  cache = valid;
  return cache;
}

export function countByCategory(bank) {
  return bank.reduce((acc, q) => ({ ...acc, [q.category]: (acc[q.category] ?? 0) + 1 }), {});
}
