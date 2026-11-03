import { useState } from 'react';
import { getMode } from '../engine/modes.js';
import { maxWager } from '../engine/gameReducer.js';
import { useKey } from '../hooks/useKey.js';
import Countdown from './Countdown.jsx';
import { Icon } from './icons.jsx';
import TimerRing from './TimerRing.jsx';
import { Avatar, CategoryTag } from './ui.jsx';

export default function IntroCard({ game, onContinue }) {
  const { intro, seg, players } = game;
  const player = players[intro.playerIdx];
  const [counting, setCounting] = useState(false);
  const go = () => (intro.kind === 'clock' ? setCounting(true) : onContinue());
  useKey(['Enter', ' '], (e) => {
    e.preventDefault();
    if (!counting) go();
  });

  let eyebrow = seg.title;
  let heading = player.name;
  let body = null;
  let cta = 'ابدأ';

  if (intro.kind === 'clock') {
    body = (
      <>
        <TimerRing msLeft={seg.duration * 1000} totalMs={seg.duration * 1000} paused size="lg" />
        <p>أجب عن أكبر عدد ممكن قبل أن يصل العداد إلى الصفر. كل إجابة صحيحة متتالية ترفع مكافأة السلسلة.</p>
      </>
    );
    cta = 'ابدأ العد';
  } else if (intro.kind === 'segment') {
    const mode = getMode(game.modeId);
    heading = 'لوحة الأسئلة';
    body = (
      <ul className="intro__rules">
        {seg.golden > 0 && <li>في اللوحة سؤالان ذهبيان مخفيان بنقاط مضاعفة.</li>}
        {seg.risk && <li>قبل كل سؤال: العب بأمان، أو خاطر لتضاعف النقاط مقابل خسارة القيمة إن أخطأت.</li>}
        {seg.steal && <li>الإجابة الخاطئة تمنح اللاعب التالي فرصة لسرقة النقاط.</li>}
        {mode.id === 'category' && <li>كل فئة فيها ثلاثة أسئلة: 100 و200 و300 نقطة. الخطأ لا يخصم شيئًا.</li>}
        <li>
          لكل لاعب {Math.max(1, Math.floor(seg.totalPicks / players.length))} اختيارات. يبدأ {player.name}.
        </li>
      </ul>
    );
    cta = 'اعرض اللوحة';
  } else if (intro.kind === 'turn') {
    eyebrow = `الجولة ${intro.round} من ${intro.rounds}`;
    body = (
      <div className="intro__meta">
        {intro.isBonus && (
          <span className="golden-burst">
            <Icon name="star" size={16} /> جولة ذهبية · النقاط ×2
          </span>
        )}
        <CategoryTag id={intro.categoryId} />
      </div>
    );
    cta = 'جاهز';
  } else if (intro.kind === 'steal') {
    eyebrow = 'فرصة سرقة';
    body = <p>لم ينجح {players[intro.fromIdx].name} في الإجابة. أجب الآن لتأخذ النقاط، ووقتك أقصر هذه المرة.</p>;
    cta = 'أجب الآن';
  } else if (intro.kind === 'wager') {
    body = (
      <>
        <p>
          سؤال صعب في فئة <CategoryTag id={intro.categoryId} />. راهن بما تريد: تكسب المبلغ إن أصبت، وتخسره إن أخطأت.
        </p>
        <p className="muted">
          نقاطك {player.score}، وأقصى رهان {maxWager(player)}.
        </p>
      </>
    );
    cta = 'ضع رهانك';
  }

  return (
    <section className={`intro intro--${intro.kind}`} style={{ '--player': player.color }} aria-live="polite">
      <p className="intro__eyebrow">{eyebrow}</p>
      {intro.kind !== 'segment' && <Avatar name={player.name} color={player.color} size={64} />}
      <h2 className="intro__heading">{heading}</h2>
      {intro.kind !== 'segment' && players.length > 1 && (
        <p className="intro__pass">
          <Icon name="offline" size={16} /> مرّر الجهاز إلى {player.name}
        </p>
      )}
      <div className="intro__body">{body}</div>
      <button type="button" className={`btn ${intro.kind === 'clock' ? 'btn--gold' : 'btn--primary'} btn--lg`} onClick={go} autoFocus disabled={counting}>
        {cta}
      </button>
      {counting && <Countdown onDone={onContinue} />}
    </section>
  );
}
