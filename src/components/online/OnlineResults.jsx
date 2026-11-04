import { useEffect } from 'react';
import { PLAYER_COLORS } from '../../engine/config.js';
import { sound } from '../../services/sound.js';
import { Icon } from '../icons.jsx';
import { Avatar } from '../ui.jsx';

export default function OnlineResults({ players, me, answers, actions }) {
  const ranked = players.filter((p) => !p.left_at || p.score > 0).sort((a, b) => b.score - a.score);
  const top = ranked[0]?.score ?? 0;
  const winners = ranked.filter((p) => p.score === top);
  const mine = answers.filter((a) => a.player_id === me?.id);
  useEffect(() => sound.play('fanfare'), []);

  return (
    <div className="results">
      <header className="results__hero" style={{ '--player': winners.length === 1 ? PLAYER_COLORS[winners[0].color % PLAYER_COLORS.length] : 'var(--ink)' }}>
        <span className="results__trophy">
          <Icon name="trophy" size={36} />
        </span>
        <p className="eyebrow">انتهت المباراة</p>
        <h1 className="results__headline">{winners.length > 1 ? 'تعادل!' : winners[0]?.id === me?.id ? 'فزت!' : `الفوز لـ ${winners[0]?.display_name ?? ''}`}</h1>
        <p className="results__sub">
          أجبت عن {mine.filter((a) => a.is_correct).length} من {mine.length} أسئلة بشكل صحيح
        </p>
      </header>
      <section className="standings">
        {ranked.map((p, i) => (
          <article key={p.id} className={`standing${p.score === top ? ' is-winner' : ''}`} style={{ '--player': PLAYER_COLORS[p.color % PLAYER_COLORS.length] }}>
            <div className="standing__head">
              <span className="standing__rank">{i + 1}</span>
              <Avatar name={p.display_name} color={p.color} size={38} />
              <h2 className="standing__name">
                {p.display_name}
                {p.id === me?.id ? ' (أنت)' : ''}
              </h2>
              <span className="standing__score">{p.score}</span>
            </div>
            <dl className="statgrid">
              <div>
                <dt>صحيحة</dt>
                <dd>{p.correct}</dd>
              </div>
              <div>
                <dt>أجاب عن</dt>
                <dd>{p.answered}</dd>
              </div>
              <div>
                <dt>أطول سلسلة</dt>
                <dd>{p.best_streak}</dd>
              </div>
            </dl>
          </article>
        ))}
      </section>
      <div className="results__actions">
        {me?.is_host ? (
          <button type="button" className="btn btn--gold btn--lg" onClick={() => actions.reset().catch(() => {})}>
            <Icon name="refresh" size={18} /> مباراة جديدة في الغرفة نفسها
          </button>
        ) : (
          <p className="muted">ينتظر الجميع المضيف لبدء مباراة جديدة.</p>
        )}
        <button type="button" className="btn btn--ghost btn--lg" onClick={() => actions.leave().catch(() => {})}>
          <Icon name="leave" size={18} /> مغادرة الغرفة
        </button>
      </div>
    </div>
  );
}
