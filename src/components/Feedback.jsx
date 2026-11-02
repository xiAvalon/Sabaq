import { useEffect } from 'react';
import { TIMING } from '../engine/config.js';
import { formatAnswer } from '../engine/questionTypes.js';
import { useKey } from '../hooks/useKey.js';

export default function Feedback({ game, showExplanations, onNext }) {
  const { current, players, seg } = game;
  const { result, question } = current;
  const stealPending = result.stealTo !== null && result.stealTo !== undefined;
  const autoAdvance = seg.type === 'clock' && !result.clockEnded;

  useEffect(() => {
    if (!autoAdvance) return undefined;
    const id = window.setTimeout(onNext, TIMING.clockFeedbackMs);
    return () => window.clearTimeout(id);
  }, [autoAdvance, onNext, current.token]);

  useKey(['Enter'], (e) => {
    e.preventDefault();
    onNext();
  }, { allowInputs: true });

  let tone = 'bad';
  let title = 'إجابة خاطئة';
  if (result.clockEnded) {
    tone = 'info';
    title = 'انتهى الوقت!';
  } else if (result.correct) {
    tone = 'good';
    title = current.isSteal ? 'سرقة ناجحة!' : 'إجابة صحيحة!';
  } else if (result.timedOut) {
    title = 'انتهى وقت السؤال';
  }

  const b = result.breakdown ?? {};
  const chips = [];
  if (result.correct && b.streakRate > 0) chips.push(`سلسلة +${Math.round(b.streakRate * 100)}٪`);
  if (result.correct && b.multiplier > 1) chips.push(`×${b.multiplier}`);
  if (result.correct && b.clueFactor && b.clueFactor < 1) chips.push(`أدلة إضافية −${Math.round((1 - b.clueFactor) * 100)}٪`);

  const showAnswer = !result.correct && !stealPending && !result.clockEnded;
  const nextLabel = stealPending ? `فرصة السرقة لـ ${players[result.stealTo].name}` : result.clockEnded ? 'متابعة' : 'التالي';

  return (
    <div className={`feedback feedback--${tone}`} role="status" aria-live="assertive">
      <div className="feedback__main">
        <strong className="feedback__title">{title}</strong>
        {!result.clockEnded && result.points !== 0 && (
          <span className={`feedback__points${result.points < 0 ? ' is-neg' : ''}`}>
            {result.points > 0 ? `+${result.points}` : result.points}
          </span>
        )}
      </div>
      {result.clockEnded && <p className="feedback__text">أجاب {players[current.playerIdx].name} عن {seg.correctInRun} أسئلة بشكل صحيح في هذه الجولة.</p>}
      {chips.length > 0 && (
        <div className="feedback__chips">
          {chips.map((c) => (
            <span key={c} className="chip chip--static">
              {c}
            </span>
          ))}
        </div>
      )}
      {showAnswer && (
        <p className="feedback__text">
          الإجابة الصحيحة: <strong>{formatAnswer(question)}</strong>
        </p>
      )}
      {showExplanations && question.explanation && !stealPending && !result.clockEnded && <p className="feedback__explain">{question.explanation}</p>}
      {!autoAdvance && (
        <button type="button" className="btn btn--primary" onClick={onNext} autoFocus>
          {nextLabel}
        </button>
      )}
    </div>
  );
}
