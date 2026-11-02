import { useCallback, useEffect, useRef } from 'react';
import { DIFFICULTIES } from '../engine/config.js';
import { getQuestionType } from '../engine/questionTypes.js';
import { clueFactor } from '../engine/scoring.js';
import { useCountdown } from '../hooks/useCountdown.js';
import { sound } from '../services/sound.js';
import AnswerInput from './answers/AnswerInput.jsx';
import Feedback from './Feedback.jsx';
import PowerUpBar from './PowerUpBar.jsx';
import { QuestionBody } from './question/QuestionBodies.jsx';
import TimerRing from './TimerRing.jsx';
import { CategoryTag } from './ui.jsx';

function valueLabel(current) {
  if (current.wager !== null) return `رهان ${current.wager}`;
  const extra = current.question.type === 'whoami' ? clueFactor(current.cluesShown - 1) : 1;
  const value = current.basePoints * current.multiplier * (current.doubled ? 2 : 1) * (current.risk ? 2 : 1) * extra;
  return `${Math.round(value / 10) * 10} نقطة`;
}

export default function QuestionStage({ game, dispatch, showExplanations }) {
  const { current, seg, players, phase } = game;
  const q = current.question;
  const player = players[current.playerIdx];
  const isClock = seg.type === 'clock';
  const answering = phase === 'question';
  const msLeft = useCountdown(current.deadline, answering);
  const totalMs = isClock ? seg.duration * 1000 + (seg.bonusMs ?? 0) : current.timeLimitMs;
  const shownMs = answering ? msLeft : isClock ? seg.remaining : msLeft;

  // Expire the question once the countdown reaches zero; the reducer re-checks the deadline.
  useEffect(() => {
    if (answering && msLeft <= 0) dispatch({ type: 'TIMEOUT', token: current.token });
  }, [answering, msLeft, current.token, dispatch]);

  // Ticks in the last five seconds.
  const lastTick = useRef(null);
  const secondsLeft = Math.ceil(msLeft / 1000);
  useEffect(() => {
    if (answering && secondsLeft > 0 && secondsLeft <= 5 && lastTick.current !== secondsLeft) {
      lastTick.current = secondsLeft;
      sound.play('tick');
    }
  }, [answering, secondsLeft]);

  // Result sounds.
  useEffect(() => {
    const r = current.result;
    if (!r) return;
    if (r.correct) sound.play('correct');
    else if (r.timedOut) sound.play('timeout');
    else sound.play('wrong');
    if (r.stealTo !== null && r.stealTo !== undefined) window.setTimeout(() => sound.play('steal'), 450);
  }, [current.result]);

  const next = useCallback(() => dispatch({ type: 'NEXT' }), [dispatch]);
  const submit = (answer) => dispatch({ type: 'SUBMIT', token: current.token, answer });
  const usePowerup = (kind) => {
    sound.play('power');
    dispatch({ type: 'USE_POWERUP', kind });
  };

  const badges = [];
  if (current.isSteal) badges.push({ label: 'سرقة', tone: 'flare' });
  if (current.multiplier > 1) badges.push({ label: seg.type === 'turns' ? 'جولة ذهبية ×2' : 'سؤال ذهبي ×2', tone: 'gold' });
  if (current.risk) badges.push({ label: 'مخاطرة ×2', tone: 'flare' });
  if (current.doubled) badges.push({ label: 'نقاط مضاعفة', tone: 'gold' });

  const revealCorrect = !(current.result && current.result.stealTo !== null && current.result.stealTo !== undefined);

  return (
    <section className={`qstage${current.result ? (current.result.correct ? ' is-correct' : ' is-wrong') : ''}`} style={{ '--player': player.color }}>
      <div className="qstage__top">
        <div className="qstage__meta">
          <p className="qstage__who">
            يجيب الآن: <span className="player-name">{player.name}</span>
          </p>
          <div className="qstage__tags">
            <CategoryTag id={q.category} size="sm" />
            <span className={`diff diff--${q.difficulty}`}>{DIFFICULTIES[q.difficulty].label}</span>
            <span className="qtype">{getQuestionType(q.type).label}</span>
            <span className="qvalue">{valueLabel(current)}</span>
            {badges.map((b) => (
              <span key={b.label} className={`badge badge--${b.tone}`}>
                {b.label}
              </span>
            ))}
          </div>
        </div>
        <TimerRing msLeft={shownMs} totalMs={totalMs} paused={!answering} label={isClock ? 'وقت الجولة' : 'وقت السؤال'} />
      </div>

      <div className="qcard" key={current.token}>
        <QuestionBody question={q} current={current} interactive={answering} onRevealClue={() => dispatch({ type: 'REVEAL_CLUE' })} />
      </div>

      <AnswerInput current={current} locked={!answering} revealCorrect={revealCorrect} onSubmit={submit} />

      {phase === 'feedback' ? (
        <Feedback game={game} showExplanations={showExplanations} onNext={next} />
      ) : (
        current.allowPowerups && <PowerUpBar player={player} current={current} onUse={usePowerup} disabled={!answering} />
      )}
    </section>
  );
}
