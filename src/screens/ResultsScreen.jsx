import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Icon } from '../components/icons.jsx';
import { Avatar, CategoryTag, formatSeconds } from '../components/ui.jsx';
import { useGame } from '../context/GameContext.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import { CATEGORY_IDS } from '../data/categories.js';
import { ACHIEVEMENTS } from '../engine/achievements.js';
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
  const { profile } = useSettings();
  const navigate = useNavigate();
  const [record] = useState(() => {
    if (game?.phase !== 'finished') return { unlocked: [], board: [] };
    const unlocked = recordGame(game, { myName: profile.name, categoryIds: CATEGORY_IDS });
    return { unlocked, board: loadLeaderboard() };
  });

  useEffect(() => {
    if (game?.phase === 'finished') sound.play('fanfare');
  }, [game?.id, game?.phase]);

  if (!game || game.phase !== 'finished') return <Navigate to="/" replace />;

  const mode = getMode(game.modeId);
  const ranked = rankPlayers(game.players);
  const top = winners(game.players);
  const solo = game.players.length === 1;
  const modeBoard = record.board.filter((e) => e.mode === game.modeId).slice(0, 5);
  const byId = Object.fromEntries(game.bank.map((q) => [q.id, q]));
  const unlocked = ACHIEVEMENTS.filter((a) => record.unlocked.includes(a.id));

  let headline;
  if (solo) headline = `${ranked[0].score} نقطة`;
  else if (top.length > 1) headline = 'تعادل!';
  else headline = `الفوز لـ ${top[0].name}`;
  const sub = solo
    ? `${ranked[0].correct} إجابات صحيحة بدقة ${ranked[0].accuracy}٪`
    : top.length > 1
      ? `${top.map((p) => p.name).join(' و')} بـ ${top[0].score} نقطة`
      : `بـ ${top[0].score} نقطة`;

  return (
    <div className="results screen">
      <header className="results__hero" style={{ '--player': solo ? 'var(--ink)' : ranked[0].color }}>
        <span className="results__trophy">
          <Icon name="trophy" size={36} />
        </span>
        <p className="eyebrow">{mode.name} · انتهت المباراة</p>
        <h1 className="results__headline">{headline}</h1>
        <p className="results__sub">{sub}</p>
      </header>

      <section className="standings" aria-label="الترتيب">
        {ranked.map((p) => (
          <article key={p.id} className={`standing${p.rank === 1 && !solo ? ' is-winner' : ''}`} style={{ '--player': p.color }}>
            <div className="standing__head">
              <span className="standing__rank">{p.rank}</span>
              <Avatar name={p.name} color={p.color} size={38} />
              <h2 className="standing__name">{p.name}</h2>
              <span className="standing__score">{p.score}</span>
            </div>
            <dl className="statgrid">
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
        <button type="button" className="btn btn--gold btn--lg" onClick={() => startGame(game.modeId, game.config) && navigate('/play')}>
          <Icon name="refresh" size={18} /> العب مجددًا
        </button>
        <Link to={`/offline/${game.modeId}`} className="btn btn--ghost btn--lg">
          غيّر الإعدادات
        </Link>
        <Link to="/" className="btn btn--ghost btn--lg" onClick={endGame}>
          <Icon name="home" size={18} /> الرئيسية
        </Link>
      </div>

      <div className="results__grid">
        <div>
          {unlocked.length > 0 && (
            <section className="card">
              <div className="card__head">
                <h2>إنجازات جديدة</h2>
              </div>
              <ul className="achievements unlocked">
                {unlocked.map((a) => (
                  <li key={a.id} className="achievement is-unlocked">
                    <span className="achievement__icon">
                      <Icon name={a.icon} />
                    </span>
                    <span>
                      <span className="achievement__title">{a.title}</span>
                      <br />
                      <span className="achievement__desc">{a.desc}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
          <section className="card">
            <div className="card__head">
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
              <p className="muted">لم تُحفظ نتائج على هذا الجهاز.</p>
            )}
          </section>
        </div>

        <section className="card">
          <div className="card__head">
            <h2>مراجعة الأسئلة</h2>
            <span className="card__hint">{game.history.length} سؤال</span>
          </div>
          <ol className="review">
            {game.history.map((h, i) => {
              const q = byId[h.qid];
              return (
                <li key={i} className={`review__item${h.correct ? '' : ' is-wrong'}`}>
                  <div className="review__top">
                    <CategoryTag id={h.category} size="sm" />
                    <span className="review__who" style={{ color: game.players[h.playerIdx].color }}>
                      {game.players[h.playerIdx].name}
                      {h.steal ? ' (سرقة)' : ''}
                    </span>
                    <span className={`review__pts${h.points < 0 ? ' is-neg' : ''}`}>{h.points > 0 ? `+${h.points}` : h.points}</span>
                  </div>
                  <p className="review__q">{q?.type === 'whoami' ? q.clues.join(' · ') : h.prompt.replace('____', '…')}</p>
                  <p className="review__a">
                    {!h.correct && <span>الإجابة: {givenLabel(h)} · </span>}
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
