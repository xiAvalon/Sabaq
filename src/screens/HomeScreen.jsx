import { Link, useNavigate } from 'react-router-dom';
import Logo from '../components/Logo.jsx';
import { useGame } from '../context/GameContext.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import { CATEGORIES, CATEGORY_IDS } from '../data/categories.js';
import { MODES } from '../engine/modes.js';
import { quickPlay } from '../engine/setup.js';
import { listQuestionTypes } from '../engine/questionTypes.js';
import { loadStats } from '../services/storage.js';
import { sound } from '../services/sound.js';

export default function HomeScreen() {
  const { bank, startGame, game } = useGame();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const stats = loadStats();
  const resumable = game && game.phase !== 'finished';

  const onQuickPlay = () => {
    sound.unlock();
    sound.play('click');
    const { modeId, config } = quickPlay(CATEGORY_IDS, settings);
    if (startGame(modeId, config)) navigate('/play');
  };

  return (
    <div className="home">
      <section className="hero">
        <Logo />
        <p className="hero__lede">أسئلة في 18 فئة، عداد لا يرحم، ونقاط تُكسب وتُسرق. العب وحدك أو تحدَّ أصدقاءك على جهاز واحد.</p>
        <div className="hero__actions">
          {resumable && (
            <Link to="/play" className="btn btn--primary btn--lg">
              أكمل اللعبة الحالية
            </Link>
          )}
          <button type="button" className={`btn ${resumable ? 'btn--ghost' : 'btn--primary'} btn--lg`} onClick={onQuickPlay} disabled={!bank}>
            {bank ? 'لعب سريع' : 'جارٍ تحميل الأسئلة…'}
          </button>
          <Link to="/how-to-play" className="btn btn--ghost btn--lg">
            كيف ألعب؟
          </Link>
        </div>
        <dl className="hero__facts">
          <div>
            <dt>سؤال</dt>
            <dd>{bank ? bank.length : '…'}</dd>
          </div>
          <div>
            <dt>فئة</dt>
            <dd>{CATEGORIES.length}</dd>
          </div>
          <div>
            <dt>أنواع أسئلة</dt>
            <dd>{listQuestionTypes().length}</dd>
          </div>
        </dl>
      </section>

      <section className="modes" aria-labelledby="modes-title">
        <h2 id="modes-title" className="section-title">
          اختر نمط اللعب
        </h2>
        <div className="modes__grid">
          {MODES.map((m) => (
            <Link key={m.id} to={`/setup/${m.id}`} className={`mode-card mode-card--${m.id}`}>
              <span className="mode-card__glyph" aria-hidden="true">
                {m.glyph}
              </span>
              <span className="mode-card__name">{m.name}</span>
              <span className="mode-card__tagline">{m.tagline}</span>
              <span className="mode-card__players">
                {m.players.min === m.players.max ? 'لاعبان أو فريقان' : `من ${m.players.min} إلى ${m.players.max} لاعبين`}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <nav className="home__nav" aria-label="روابط">
        <Link to="/stats" className="home__link">
          <span>الإحصائيات ولوحة الصدارة</span>
          <span className="home__link-meta">{stats.games ? `${stats.games} لعبة · أعلى نتيجة ${stats.bestScore}` : 'لا توجد ألعاب بعد'}</span>
        </Link>
        <Link to="/settings" className="home__link">
          <span>الإعدادات</span>
          <span className="home__link-meta">الصوت، وقت السؤال، الحركة</span>
        </Link>
      </nav>
    </div>
  );
}
