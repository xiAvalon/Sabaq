import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { CategoryTag, formatSeconds } from '../components/ui.jsx';
import { useGame } from '../context/GameContext.jsx';
import { getMode } from '../engine/modes.js';
import { formatAnswer } from '../engine/questionTypes.js';
import { rankPlayers, winners } from '../engine/stats.js';
import { loadLeaderboard, recordGame } from '../services/storage.js';
import { sound } from '../services/sound.js';

function givenLabel(entry) {
  if (entry.timedOut) return 'لم يُجب';
  if (typeof entry.given === 'boolean') return entry.given ? 'صح' : 'خطأ';
  return String(entry.given ?? '—');
}

export default function ResultsScreen() {
  const { game, startGame, endGame } = useGame();
  const navigate = useNavigate();
  const [board] = useState(() => {
    if (game?.phase === 'finished') recordGame(game);
    return loadLeaderboard();
  });

  useEffect(() => {
    if (game?.phase === 'finished') sound.play('fanfare');
  }, [game?.id, game?.phase]);

  if (!game || game.phase !== 'finished') return <Navigate to="/" replace />;

  const mode = getMode(game.modeId);
  const ranked = rankPlayers(game.players);
  const top = winners(game.players);
  const solo = game.players.length === 1;
  const modeBoard = board.filter((e) => e.mode === game.modeId).slice(0, 5);
  const byId = Object.fromEntries(game.bank.map((q) => [q.id, q]));

  let headline;
  if (solo) headline = `${ranked[0].score} نقطة`;
  else if (top.length > 1) headline = `تعادل بين ${top.map((p) => p.name).join(' و')}`;
  else headline = `الفوز لـ ${top[0].name}`;

  const playAgain = () => {
    if (startGame(game.modeId, game.config)) navigate('/play');
  };

  return (
    <div className="results">
      <header className="results__hero" style={{ '--player': ranked[0].color }}>
        <p className="results__eyebrow">{mode.name} · انتهت اللعبة</p>
        <h1 className="results__headline">{headline}</h1>
        {!solo && top.length === 1 && <p className="results__sub">بـ {top[0].score} نقطة</p>}
      </header>

      <section className="standings" aria-label="الترتيب">
        {ranked.map((p) => (
          <article key={p.id} className={`standing${p.rank === 1 ? ' is-winner' : ''}`} style={{ '--player': p.color }}>
            <div className="standing__head">
              <span className="standing__rank">{p.rank}</span>
              <h2 className="standing__name">{p.name}</h2>
              <span className="standing__score">{p.score}</span>
            </div>
            <dl className="standing__stats">
              <div>
                <dt>صحيحة</dt>
                <dd>{p.correct}</dd>
              </div>
              <div>
                <dt>خاطئة</dt>
                <dd>{p.wrong}</dd>
              </div>
              <div>
                <dt>نفد الوقت</dt>
                <dd>{p.timeouts}</dd>
              </div>
              <div>
                <dt>الدقة</dt>
                <dd>{p.accuracy}٪</dd>
              </div>
              <div>
                <dt>أطول سلسلة</dt>
                <dd>{p.bestStreak}</dd>
              </div>
              <div>
                <dt>متوسط الإجابة</dt>
                <dd>{p.answered ? formatSeconds(p.avgSeconds) : '—'}</dd>
              </div>
            </dl>
          </article>
        ))}
      </section>

      <div className="results__actions">
        <button type="button" className="btn btn--primary btn--lg" onClick={playAgain}>
          العب مجددًا
        </button>
        <Link to={`/setup/${game.modeId}`} className="btn btn--ghost btn--lg">
          غيّر الإعدادات
        </Link>
        <Link to="/" className="btn btn--ghost btn--lg" onClick={endGame}>
          القائمة الرئيسية
        </Link>
      </div>

      <div className="results__grid">
        <section className="panel">
          <div className="panel__head">
            <h2>أفضل نتائج «{mode.name}»</h2>
            <Link to="/stats" className="text-link">
              كل النتائج
            </Link>
          </div>
          {modeBoard.length ? (
            <ol className="mini-board">
              {modeBoard.map((e, i) => (
                <li key={`${e.date}-${e.name}-${i}`}>
                  <span className="mini-board__rank">{i + 1}</span>
                  <span className="mini-board__name">{e.name}</span>
                  <span className="mini-board__score">{e.score}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="muted">لم تُحفظ النتائج على هذا الجهاز.</p>
          )}
        </section>

        <section className="panel">
          <div className="panel__head">
            <h2>مراجعة الأسئلة</h2>
            <span className="panel__hint">{game.history.length} سؤال</span>
          </div>
          <ol className="review">
            {game.history.map((h, i) => {
              const q = byId[h.qid];
              return (
                <li key={i} className={`review__item${h.correct ? ' is-correct' : ' is-wrong'}`}>
                  <div className="review__top">
                    <CategoryTag id={h.category} size="sm" />
                    <span className="review__who" style={{ color: game.players[h.playerIdx].color }}>
                      {game.players[h.playerIdx].name}
                      {h.steal ? ' (سرقة)' : ''}
                    </span>
                    <span className={`review__pts${h.points < 0 ? ' is-neg' : ''}`}>{h.points > 0 ? `+${h.points}` : h.points}</span>
                  </div>
                  <p className="review__q">{q?.type === 'whoami' ? q.clues.join(' · ') : h.prompt}</p>
                  <p className="review__a">
                    {!h.correct && <span>إجابتك: {givenLabel(h)} · </span>}
                    الصحيحة: <strong>{q ? formatAnswer(q) : String(h.answer)}</strong>
                  </p>
                </li>
              );
            })}
          </ol>
        </section>
      </div>
    </div>
  );
}
