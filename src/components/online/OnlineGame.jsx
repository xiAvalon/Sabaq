import { useEffect, useMemo, useRef, useState } from 'react';
import { useGame } from '../../context/GameContext.jsx';
import { DIFFICULTIES, PLAYER_COLORS } from '../../engine/config.js';
import { formatAnswer, getQuestionType } from '../../engine/questionTypes.js';
import { hashId } from '../../data/compact.js';
import { mulberry32, shuffle } from '../../engine/rng.js';
import { useNow } from '../../hooks/useNow.js';
import { getOnlineMode } from '../../online/modes.js';
import { sound } from '../../services/sound.js';
import AnswerInput from '../answers/AnswerInput.jsx';
import { Icon } from '../icons.jsx';
import { QuestionBody } from '../question/QuestionBodies.jsx';
import TimerRing from '../TimerRing.jsx';
import { Avatar, CategoryTag } from '../ui.jsx';
import PlayerList from './PlayerList.jsx';

// Stable option order per question, so every refresh shows the same layout.
function viewOf(q, token, result = null) {
  if (!q) return null;
  const seed = parseInt(hashId(q.id), 36) / 2 ** 36;
  return {
    token,
    question: q,
    options: q.options ? shuffle(q.options, mulberry32(seed)) : null,
    eliminated: [],
    cluesShown: q.clues ? q.clues.length : 1,
    result,
  };
}

function QuestionMeta({ q, extra }) {
  return (
    <div className="qstage__tags">
      <CategoryTag id={q.category} size="sm" />
      <span className={`diff diff--${q.difficulty}`}>{DIFFICULTIES[q.difficulty].label}</span>
      <span className="qtype">{getQuestionType(q.type).label}</span>
      {extra}
    </div>
  );
}

function Missing({ onSkip }) {
  return (
    <div className="qcard">
      <p className="q-prompt q-prompt--sm">هذا السؤال غير موجود في نسختك من التطبيق. حدّث الصفحة أو تخطَّه.</p>
      {onSkip && (
        <button type="button" className="btn btn--ghost" onClick={onSkip}>
          تخطَّ
        </button>
      )}
    </div>
  );
}

function GetReady({ ms, title, subtitle }) {
  const s = Math.max(1, Math.ceil(ms / 1000));
  return (
    <section className="intro">
      <p className="intro__eyebrow">{title}</p>
      <span className="countdown__num countdown__num--inline" key={s}>
        {s}
      </span>
      {subtitle && <p className="intro__body">{subtitle}</p>}
    </section>
  );
}

function Standings({ players, me, online, title, note }) {
  return (
    <section className="card round-end">
      <div className="card__head">
        <h2>{title}</h2>
        {note && <span className="card__hint">{note}</span>}
      </div>
      <PlayerList players={players} me={me} online={online} showReady={false} showScore />
    </section>
  );
}

// ---------------------------------------------------------------- rush

function Rush({ session, players, me, answers, online, serverNow, actions, byId }) {
  const now = useNow(serverNow, 150);
  const start = new Date(session.phase_started_at).getTime();
  const deadline = session.deadline ? new Date(session.deadline).getTime() : 0;
  const total = (session.settings?.duration ?? 30) * 1000;
  const [local, setLocal] = useState({});
  const [feedback, setFeedback] = useState(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    setLocal({});
    setFeedback(null);
  }, [session.round, session.id]);

  const serverCount = answers.filter((a) => a.player_id === me?.id && a.round === session.round).length;
  const nextIndex = Math.max(serverCount, Object.keys(local).length);
  // While feedback is on screen, keep showing the question it belongs to.
  const index = feedback ? feedback.index : nextIndex;
  const qid = session.question_ids[index];
  const q = byId[qid];
  const mine = answers.filter((a) => a.player_id === me?.id && a.round === session.round);
  const roundCorrect = mine.filter((a) => a.is_correct).length;

  const lastTick = useRef(null);
  const secs = Math.ceil((deadline - now) / 1000);
  useEffect(() => {
    if (session.phase === 'question' && now >= start && secs > 0 && secs <= 5 && lastTick.current !== secs) {
      lastTick.current = secs;
      sound.play('tick');
    }
  }, [secs, now, start, session.phase]);

  if (session.phase === 'round_end') {
    const left = Math.max(0, Math.ceil((deadline - now) / 1000));
    return <Standings players={players} me={me} online={online} title={`نهاية الجولة ${session.round} من ${session.total_rounds}`} note={`الجولة التالية خلال ${left} ث`} />;
  }
  if (now < start) {
    return <GetReady ms={start - now} title={`الجولة ${session.round} من ${session.total_rounds}`} subtitle="الأسئلة نفسها للجميع. أجب بأسرع ما يمكن." />;
  }
  if (now > deadline) {
    return <Standings players={players} me={me} online={online} title="انتهى الوقت!" note={`أجبت عن ${roundCorrect} أسئلة بشكل صحيح`} />;
  }

  const submit = async (answer) => {
    if (busy || feedback) return;
    setBusy(true);
    try {
      const res = await actions.submit(index, answer);
      sound.play(res.correct ? 'correct' : 'wrong');
      setLocal((l) => ({ ...l, [index]: res }));
      setFeedback({ index, correct: res.correct, given: answer, points: res.points, answer: res.answer });
      window.setTimeout(() => setFeedback(null), res.correct ? 450 : 1100);
    } catch (e) {
      if (e.code === 'stale_question' || e.code === 'already_answered') actions.refresh();
    } finally {
      setBusy(false);
    }
  };

  const current = viewOf(q, `${session.round}-${index}`, feedback ? { correct: feedback.correct, given: feedback.given } : null);
  const myRow = players.find((p) => p.id === me?.id);

  return (
    <section className="qstage">
      <div className="qstage__top">
        <div className="qstage__meta">
          <p className="qstage__who">
            <Icon name="bolt" size={18} /> سلسلتك: {myRow?.streak ?? 0} · صحيحة هذه الجولة: {roundCorrect}
          </p>
          {q && <QuestionMeta q={q} extra={<span className="qvalue">{q.difficulty * 100} نقطة</span>} />}
        </div>
        <TimerRing msLeft={deadline - now} totalMs={total} size="lg" label="وقت الجولة" />
      </div>
      {q ? (
        <>
          <div className="qcard" key={current.token}>
            <QuestionBody question={q} current={current} interactive={false} />
          </div>
          <AnswerInput current={current} locked={busy || !!feedback} revealCorrect onSubmit={submit} />
          {feedback && (
            <div className={`feedback feedback--${feedback.correct ? 'good' : 'bad'}`} role="status">
              <div className="feedback__main">
                <strong className="feedback__title">{feedback.correct ? 'صحيح!' : 'خطأ'}</strong>
                {feedback.points > 0 && <span className="feedback__points">+{feedback.points}</span>}
              </div>
              {!feedback.correct && (
                <p className="feedback__text">
                  الإجابة الصحيحة: <strong>{formatAnswer({ ...q, answer: feedback.answer ?? q.answer })}</strong>
                </p>
              )}
            </div>
          )}
          {!feedback && (
            <button type="button" className="btn btn--ghost btn--sm skip-btn" onClick={() => submit(null)} disabled={busy}>
              تخطَّ هذا السؤال (لا نقاط)
            </button>
          )}
        </>
      ) : qid ? (
        <Missing onSkip={() => submit(null)} />
      ) : (
        <Standings players={players} me={me} online={online} title="أنهيت كل أسئلة الجولة!" note="بانتظار انتهاء الوقت" />
      )}
    </section>
  );
}

// ---------------------------------------------------------------- turns

function Turns({ session, players, me, online, serverNow, actions, byId }) {
  const now = useNow(serverNow, 150);
  const start = new Date(session.phase_started_at).getTime();
  const deadline = session.deadline ? new Date(session.deadline).getTime() : 0;
  const totalMs = deadline - start;
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(null);
  const q = byId[session.question_ids[session.q_index]];
  const turnKey = `${session.q_index}-${session.phase}-${session.current_player_id}`;
  useEffect(() => setSent(null), [turnKey]);
  const n = session.turn_order.length;
  const round = Math.floor(session.turn / n) + 1;
  const bonus = round % 3 === 0;
  const current = players.find((p) => p.id === session.current_player_id);
  const isMine = current && current.id === me?.id;
  const nameOf = (id) => players.find((p) => p.id === id)?.display_name ?? 'لاعب';

  const lastResult = useRef(null);
  useEffect(() => {
    if (session.phase === 'reveal' && session.reveal && lastResult.current !== turnKey) {
      lastResult.current = turnKey;
      sound.play(session.reveal.correct ? 'correct' : session.reveal.timeout ? 'timeout' : 'wrong');
    }
  }, [session.phase, session.reveal, turnKey]);

  const header = (
    <div className="turn-head">
      <span className="eyebrow">
        الدور {session.turn + 1} من {session.total_turns}
        {bonus && ' · جولة ذهبية ×2'}
      </span>
      {session.phase === 'steal' && <span className="tag tag--bad">فرصة سرقة</span>}
    </div>
  );

  if (session.phase === 'reveal' && session.reveal) {
    const r = session.reveal;
    const view = viewOf(q, turnKey, { correct: r.correct, given: r.given });
    return (
      <section className="qstage">
        {header}
        {q && (
          <div className="qcard">
            <QuestionBody question={q} current={view} interactive={false} />
          </div>
        )}
        {q && <AnswerInput current={view} locked revealCorrect={r.answer !== null} onSubmit={() => {}} />}
        <div className={`feedback feedback--${r.correct ? 'good' : 'bad'}`} role="status">
          <div className="feedback__main">
            <strong className="feedback__title">
              {r.correct ? `أصاب ${nameOf(r.player_id)}!` : r.timeout ? `انتهى وقت ${nameOf(r.player_id)}` : `أخطأ ${nameOf(r.player_id)}`}
            </strong>
            {r.points > 0 && <span className="feedback__points">+{r.points}</span>}
          </div>
          {r.answer !== null && q && !r.correct && (
            <p className="feedback__text">
              الإجابة الصحيحة: <strong>{formatAnswer({ ...q, answer: r.answer })}</strong>
            </p>
          )}
          {r.steal_next && <p className="feedback__text">فرصة سرقة لـ {nameOf(r.steal_next)}!</p>}
        </div>
      </section>
    );
  }

  if (now < start) {
    return (
      <>
        {header}
        <GetReady ms={start - now} title={session.phase === 'steal' ? 'فرصة سرقة' : 'الدور التالي'} subtitle={isMine ? 'دورك! استعد.' : `يجيب الآن: ${current?.display_name ?? ''}`} />
      </>
    );
  }

  const submit = async (answer) => {
    if (busy || sent) return;
    setBusy(true);
    setSent({ given: answer });
    try {
      await actions.submit(session.q_index, answer);
    } catch {
      setSent(null);
    } finally {
      setBusy(false);
    }
  };

  const view = viewOf(q, turnKey, null);
  return (
    <section className="qstage" style={{ '--player': current ? PLAYER_COLORS[current.color % PLAYER_COLORS.length] : undefined }}>
      {header}
      <div className="qstage__top">
        <div className="qstage__meta">
          <p className="qstage__who">
            {current && <Avatar name={current.display_name} color={current.color} size={28} />}
            <span>{isMine ? 'دورك الآن' : `يجيب الآن: ${current?.display_name ?? ''}`}</span>
          </p>
          {q && <QuestionMeta q={q} extra={<span className="qvalue">{q.difficulty * 100 * (bonus ? 2 : 1)} نقطة</span>} />}
        </div>
        <TimerRing msLeft={Math.max(0, deadline - now)} totalMs={totalMs} label="وقت السؤال" />
      </div>
      {q ? (
        <>
          <div className="qcard" key={view.token}>
            <QuestionBody question={q} current={view} interactive={false} />
          </div>
          {isMine ? (
            <AnswerInput current={view} locked={busy || !!sent || now > deadline} revealCorrect={false} onSubmit={submit} />
          ) : (
            <p className="watching">
              <Icon name="eye" size={18} /> تشاهد إجابة {current?.display_name}. فكّر في الإجابة، فقد تأتيك فرصة سرقة.
            </p>
          )}
        </>
      ) : (
        <Missing />
      )}
    </section>
  );
}

export default function OnlineGame({ session, room, players, me, answers, online, serverNow, actions }) {
  const { bank } = useGame();
  const byId = useMemo(() => Object.fromEntries((bank ?? []).map((q) => [q.id, q])), [bank]);
  const mode = getOnlineMode(session.mode);
  return (
    <div className="online-game">
      <header className="hud">
        <div className="hud__top">
          <div className="hud__title">
            <span className="hud__stage">غرفة {room.code}</span>
            <strong>{mode.name}</strong>
            {session.mode === 'rush' && (
              <span className="hud__progress-text">
                الجولة {session.round} من {session.total_rounds}
              </span>
            )}
          </div>
        </div>
        <ol className="scoreboard" aria-label="النقاط">
          {[...players]
            .filter((p) => !p.left_at)
            .sort((a, b) => b.score - a.score)
            .map((p) => (
              <li key={p.id} className={`score-chip${p.id === session.current_player_id ? ' is-active' : ''}`} style={{ '--player': PLAYER_COLORS[p.color % PLAYER_COLORS.length] }}>
                <Avatar name={p.display_name} color={p.color} size={28} />
                <span className="score-chip__name">{p.id === me?.id ? 'أنت' : p.display_name}</span>
                <span className="score-chip__score" key={p.score}>
                  {p.score}
                </span>
              </li>
            ))}
        </ol>
      </header>
      {session.mode === 'rush' ? (
        <Rush session={session} players={players} me={me} answers={answers} online={online} serverNow={serverNow} actions={actions} byId={byId} />
      ) : (
        <Turns session={session} players={players} me={me} online={online} serverNow={serverNow} actions={actions} byId={byId} />
      )}
    </div>
  );
}
