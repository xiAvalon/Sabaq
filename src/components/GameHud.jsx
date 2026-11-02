import { useCountdown } from '../hooks/useCountdown.js';

function progressOf(game) {
  const { seg, players } = game;
  const n = players.length;
  if (seg.type === 'clock') {
    return { text: n > 1 ? `اللاعب ${seg.pos + 1} من ${n}` : 'جولة واحدة', value: (seg.pos + (game.phase === 'intro' ? 0 : 0.5)) / n };
  }
  if (seg.type === 'board') return { text: `الاختيارات ${seg.picksMade} من ${seg.totalPicks}`, value: seg.picksMade / seg.totalPicks };
  if (seg.type === 'turns') {
    const round = Math.min(seg.rounds, Math.floor(seg.turnNo / n) + 1);
    return { text: `الجولة ${round} من ${seg.rounds}`, value: seg.turnNo / seg.totalTurns };
  }
  if (seg.type === 'wager') return { text: `الرهان ${seg.pos + 1} من ${n}`, value: seg.pos / n };
  return { text: '', value: 0 };
}

function ClockBar({ game }) {
  const { seg, phase } = game;
  const running = phase === 'question';
  const msLeft = useCountdown(seg.deadline, running);
  const shown = running ? msLeft : seg.remaining;
  const total = seg.duration * 1000 + (seg.bonusMs ?? 0);
  if (phase === 'intro') return null;
  return (
    <div className={`clockbar${shown <= 5000 && running ? ' is-urgent' : ''}`} aria-hidden="true">
      <span className="clockbar__fill" style={{ transform: `scaleX(${Math.min(1, shown / total)})` }} />
    </div>
  );
}

export default function GameHud({ game, onQuit }) {
  const { seg, players, segments, segIndex, current, phase } = game;
  const progress = progressOf(game);
  const activeIdx =
    phase === 'question' || phase === 'feedback'
      ? current?.playerIdx
      : phase === 'intro'
        ? game.intro?.playerIdx
        : seg.type === 'board'
          ? seg.turnPlayer
          : seg.type === 'wager'
            ? seg.order[seg.pos]
            : null;

  return (
    <header className="hud">
      <div className="hud__top">
        <div className="hud__title">
          {segments.length > 1 && (
            <span className="hud__stage">
              المرحلة {segIndex + 1}/{segments.length}
            </span>
          )}
          <strong>{seg.title}</strong>
          <span className="hud__progress-text">{progress.text}</span>
        </div>
        <button type="button" className="btn btn--ghost btn--sm" onClick={onQuit}>
          إنهاء
        </button>
      </div>
      <div className="hud__progress" aria-hidden="true">
        <span style={{ transform: `scaleX(${Math.min(1, progress.value)})` }} />
      </div>
      {seg.type === 'clock' && <ClockBar game={game} />}
      <ol className="scoreboard" aria-label="النقاط">
        {players.map((p, i) => (
          <li key={p.id} className={`score-chip${i === activeIdx ? ' is-active' : ''}`} style={{ '--player': p.color }}>
            <span className="score-chip__dot" aria-hidden="true" />
            <span className="score-chip__name">{p.name}</span>
            <span className="score-chip__score" key={p.score}>
              {p.score}
            </span>
            {p.streak >= 2 && <span className="score-chip__streak">×{p.streak}</span>}
          </li>
        ))}
      </ol>
    </header>
  );
}
