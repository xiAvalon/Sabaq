// Question type registry. A type describes how a question is answered and validated;
// how it is drawn lives in the UI registry (components/question/registry.js).
import { DIFFICULTIES } from './config.js';
import { matchesText, parseNumber } from './normalize.js';

const registry = new Map();

const hasOptions = (q) => Array.isArray(q.options) && q.options.length > 0;
const choiceOrText = (q) => (hasOptions(q) ? 'choice' : 'text');

export function registerQuestionType(def) {
  registry.set(def.id, def);
}

export function getQuestionType(id) {
  const t = registry.get(id);
  if (!t) throw new Error(`Unknown question type: ${id}`);
  return t;
}

export const listQuestionTypes = () => [...registry.values()];

registerQuestionType({
  id: 'mcq',
  label: 'اختيار من متعدد',
  defaultTime: 15,
  speedFriendly: true,
  inputKind: () => 'choice',
  validate: (q) => hasOptions(q) || 'mcq needs options',
});
registerQuestionType({
  id: 'truefalse',
  label: 'صح أم خطأ',
  defaultTime: 10,
  speedFriendly: true,
  inputKind: () => 'boolean',
  validate: (q) => typeof q.answer === 'boolean' || 'truefalse answer must be boolean',
});
registerQuestionType({
  id: 'open',
  label: 'إجابة مفتوحة',
  defaultTime: 25,
  speedFriendly: false,
  inputKind: () => 'text',
  validate: (q) => typeof q.answer === 'string' || 'open answer must be text',
});
registerQuestionType({
  id: 'number',
  label: 'خمّن الرقم',
  defaultTime: 20,
  speedFriendly: true,
  inputKind: () => 'number',
  validate: (q) => typeof q.answer === 'number' || 'number answer must be numeric',
});
registerQuestionType({
  id: 'complete',
  label: 'أكمل العبارة',
  defaultTime: 20,
  speedFriendly: true,
  inputKind: choiceOrText,
  validate: (q) => q.prompt.includes('____') || 'complete prompt needs a ____ blank',
});
registerQuestionType({
  id: 'whoami',
  label: 'من أنا؟',
  defaultTime: 30,
  speedFriendly: false,
  inputKind: choiceOrText,
  validate: (q) => (Array.isArray(q.clues) && q.clues.length >= 2) || 'whoami needs 2+ clues',
});
registerQuestionType({
  id: 'sequence',
  label: 'ما التالي؟',
  defaultTime: 20,
  speedFriendly: true,
  inputKind: choiceOrText,
  validate: (q) => (Array.isArray(q.sequence) && q.sequence.length >= 2) || 'sequence needs items',
});
registerQuestionType({
  id: 'image',
  label: 'سؤال الصورة',
  defaultTime: 15,
  speedFriendly: true,
  inputKind: (q) => (hasOptions(q) ? 'choice' : typeof q.answer === 'number' ? 'number' : 'text'),
  validate: (q) => Boolean(q.media?.kind) || 'image question needs media',
});

export const getInputKind = (q) => getQuestionType(q.type).inputKind(q);

export function checkAnswer(q, given) {
  if (given === null || given === undefined || given === '') return false;
  switch (getInputKind(q)) {
    case 'choice':
    case 'boolean':
      return given === q.answer;
    case 'number': {
      const v = parseNumber(given);
      return v !== null && Math.abs(v - q.answer) <= (q.tolerance ?? 0);
    }
    default:
      return matchesText(given, [q.answer, ...(q.accept ?? [])]);
  }
}

export function formatAnswer(q) {
  const kind = getInputKind(q);
  if (kind === 'boolean') return q.answer ? 'صح' : 'خطأ';
  if (kind === 'number') {
    const base = q.answer.toLocaleString('en-US');
    return `${base}${q.unit ? ` ${q.unit}` : ''}`;
  }
  return String(q.answer);
}

export const canUseFiftyFifty = (q) => getInputKind(q) === 'choice' && q.options.length >= 4;

export function defaultTimeSeconds(q) {
  return q.timeLimit ?? getQuestionType(q.type).defaultTime + (DIFFICULTIES[q.difficulty]?.timeBonus ?? 0);
}

export const defaultPoints = (q) => q.points ?? DIFFICULTIES[q.difficulty].points;

export function validateQuestion(q, categoryIds = null) {
  const errors = [];
  if (!q.id) errors.push('missing id');
  if (!registry.has(q.type)) return [...errors, `unknown type ${q.type}`];
  if (categoryIds && !categoryIds.includes(q.category)) errors.push(`unknown category ${q.category}`);
  if (!DIFFICULTIES[q.difficulty]) errors.push(`bad difficulty ${q.difficulty}`);
  if (typeof q.prompt !== 'string' || !q.prompt) errors.push('missing prompt');
  if (q.answer === undefined || q.answer === null || q.answer === '') errors.push('missing answer');
  const typeCheck = getQuestionType(q.type).validate(q);
  if (typeCheck !== true && typeCheck) {
    if (typeof typeCheck === 'string') errors.push(typeCheck);
  }
  if (hasOptions(q)) {
    if (!q.options.includes(q.answer)) errors.push('answer not among options');
    if (new Set(q.options).size !== q.options.length) errors.push('duplicate options');
  }
  return errors;
}
