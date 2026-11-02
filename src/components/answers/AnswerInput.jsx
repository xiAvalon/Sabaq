import { useEffect, useRef, useState } from 'react';
import { getInputKind } from '../../engine/questionTypes.js';
import { useKey } from '../../hooks/useKey.js';

const LETTERS = ['أ', 'ب', 'ج', 'د', 'هـ', 'و'];

function ChoiceAnswer({ options, eliminated, locked, result, revealCorrect, correctAnswer, onSubmit }) {
  useKey(['1', '2', '3', '4'], (e) => {
    const option = options[Number(e.key) - 1];
    if (option && !eliminated.includes(option)) onSubmit(option);
  }, { enabled: !locked });

  return (
    <div className="choices">
      {options.map((option, i) => {
        const isOut = eliminated.includes(option);
        const isPicked = result && result.given === option;
        const isRight = result && revealCorrect && option === correctAnswer;
        const cls = ['choice', isOut && 'is-out', isPicked && !result.correct && 'is-wrong', (isRight || (isPicked && result.correct)) && 'is-correct']
          .filter(Boolean)
          .join(' ');
        return (
          <button key={option} type="button" className={cls} disabled={locked || isOut} onClick={() => onSubmit(option)}>
            <span className="choice__letter" aria-hidden="true">
              {LETTERS[i]}
            </span>
            <span className="choice__text">{option}</span>
          </button>
        );
      })}
    </div>
  );
}

function BooleanAnswer({ locked, result, revealCorrect, correctAnswer, onSubmit }) {
  const items = [
    { value: true, label: 'صح', key: '1' },
    { value: false, label: 'خطأ', key: '2' },
  ];
  useKey(['1', '2'], (e) => onSubmit(e.key === '1'), { enabled: !locked });
  return (
    <div className="choices choices--bool">
      {items.map((item) => {
        const isPicked = result && result.given === item.value;
        const isRight = result && revealCorrect && item.value === correctAnswer;
        const cls = ['choice choice--bool', isPicked && !result.correct && 'is-wrong', (isRight || (isPicked && result.correct)) && 'is-correct']
          .filter(Boolean)
          .join(' ');
        return (
          <button key={item.label} type="button" className={cls} disabled={locked} onClick={() => onSubmit(item.value)}>
            <span className="choice__text">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function TypedAnswer({ kind, locked, result, onSubmit, token }) {
  const [value, setValue] = useState('');
  const ref = useRef(null);
  useEffect(() => {
    setValue('');
    if (!locked) ref.current?.focus({ preventScroll: true });
  }, [token, locked]);
  const submit = (e) => {
    e.preventDefault();
    if (!locked && value.trim()) onSubmit(value.trim());
  };
  const state = result ? (result.correct ? ' is-correct' : ' is-wrong') : '';
  return (
    <form className={`typed${state}`} onSubmit={submit}>
      <input
        id="answer-input"
        ref={ref}
        className="typed__input"
        type="text"
        inputMode={kind === 'number' ? 'decimal' : 'text'}
        dir={kind === 'number' ? 'ltr' : 'rtl'}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        placeholder={kind === 'number' ? 'اكتب رقمًا' : 'اكتب إجابتك'}
        value={result ? String(result.given ?? '') : value}
        onChange={(e) => setValue(e.target.value)}
        disabled={locked}
        aria-label="إجابتك"
      />
      <button type="submit" className="btn btn--primary" disabled={locked || !value.trim()}>
        أجب
      </button>
    </form>
  );
}

export default function AnswerInput({ current, locked, revealCorrect, onSubmit }) {
  const q = current.question;
  const kind = getInputKind(q);
  const shared = { locked, result: current.result, revealCorrect, correctAnswer: q.answer, onSubmit };
  if (kind === 'choice') return <ChoiceAnswer {...shared} options={current.options} eliminated={current.eliminated} />;
  if (kind === 'boolean') return <BooleanAnswer {...shared} />;
  return <TypedAnswer {...shared} kind={kind} token={current.token} />;
}
