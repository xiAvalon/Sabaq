import { getMode } from '../engine/modes.js';
import { maxWager } from '../engine/gameReducer.js';
import { useKey } from '../hooks/useKey.js';
import { CategoryTag } from './ui.jsx';

export default function IntroCard({ game, onContinue }) {
  const { intro, seg, players } = game;
  const player = players[intro.playerIdx];
  useKey(['Enter', ' '], (e) => {
    e.preventDefault();
    onContinue();
  });

  let eyebrow = seg.title;
  let heading = player.name;
  let body = null;
  let cta = 'ابدأ';

  if (intro.kind === 'clock') {
    eyebrow = seg.title;
    body = <p>لديك {seg.duration} ثانية. أجب عن أكبر عدد ممكن من الأسئلة، وتصعب الأسئلة كلما أصبت.</p>;
    cta = 'ابدأ العداد';
  } else if (intro.kind === 'segment') {
    const mode = getMode(game.modeId);
    heading = 'لوحة الأسئلة';
    body = (
      <>
        <ul className="intro__rules">
          {seg.type === 'board' && seg.golden > 0 && <li>في اللوحة {seg.golden === 2 ? 'سؤالان ذهبيان مخفيان' : `${seg.golden} أسئلة ذهبية مخفية`} بنقاط مضاعفة.</li>}
          {seg.risk && <li>قبل كل سؤال: العب بأمان، أو خاطر لتضاعف النقاط مقابل خسارة القيمة إن أخطأت.</li>}
          {seg.steal && <li>الإجابة الخاطئة تمنح اللاعب التالي فرصة لسرقة النقاط.</li>}
          {mode.id === 'category' && mode.rules.map((r) => <li key={r}>{r}</li>)}
          <li>
            لكل لاعب {seg.totalPicks / players.length >= 1 ? Math.floor(seg.totalPicks / players.length) : 1} اختيارات. يبدأ {player.name}.
          </li>
        </ul>
      </>
    );
    cta = 'اعرض اللوحة';
  } else if (intro.kind === 'turn') {
    eyebrow = `الجولة ${intro.round} من ${intro.rounds}`;
    body = (
      <div className="intro__meta">
        {intro.isBonus && <span className="badge badge--gold">جولة ذهبية · النقاط ×2</span>}
        <span>
          الفئة: <CategoryTag id={intro.categoryId} />
        </span>
      </div>
    );
    cta = 'جاهز';
  } else if (intro.kind === 'steal') {
    eyebrow = 'فرصة سرقة';
    body = (
      <p>
        لم ينجح {players[intro.fromIdx].name} في الإجابة. أجب الآن لتأخذ النقاط، ووقتك أقصر هذه المرة.
      </p>
    );
    cta = 'أجب الآن';
  } else if (intro.kind === 'wager') {
    eyebrow = seg.title;
    body = (
      <>
        <p>
          سؤال صعب في فئة <CategoryTag id={intro.categoryId} />. راهن بما تريد من نقاطك: تكسب المبلغ إن أصبت، وتخسره إن أخطأت.
        </p>
        <p className="intro__note">
          نقاطك الآن {player.score}، وأقصى رهان {maxWager(player)}.
        </p>
      </>
    );
    cta = 'ضع رهانك';
  }

  return (
    <section className={`intro intro--${intro.kind}`} style={{ '--player': player.color }} aria-live="polite">
      <p className="intro__eyebrow">{eyebrow}</p>
      <h2 className="intro__heading">{heading}</h2>
      {intro.kind !== 'segment' && <p className="intro__pass">مرّر الجهاز إلى {player.name}</p>}
      <div className="intro__body">{body}</div>
      <button type="button" className="btn btn--primary btn--lg" onClick={onContinue} autoFocus>
        {cta}
      </button>
    </section>
  );
}
