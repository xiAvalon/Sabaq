import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SoonBadge } from '../components/feedback.jsx';
import { Icon } from '../components/icons.jsx';
import { CategoryTag } from '../components/ui.jsx';
import { useGame } from '../context/GameContext.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import { CATEGORIES, CATEGORY_IDS } from '../data/categories.js';
import { ACHIEVEMENTS } from '../engine/achievements.js';
import { useOnline } from '../hooks/useOnline.js';
import { loadAchievements, loadStats } from '../services/storage.js';
import { sound } from '../services/sound.js';

function Dial() {
  const ticks = Array.from({ length: 30 }, (_, i) => {
    const a = (i / 30) * Math.PI * 2;
    const r1 = i % 5 === 0 ? 68 : 72;
    return (
      <line
        key={i}
        x1={100 + Math.sin(a) * r1}
        y1={100 - Math.cos(a) * r1}
        x2={100 + Math.sin(a) * 76}
        y2={100 - Math.cos(a) * 76}
      />
    );
  });
  return (
    <div className="dial" aria-hidden="true">
      <svg viewBox="0 0 200 200">
        <circle className="dial__track" cx="100" cy="100" r="85" />
        <g className="dial__ticks">{ticks}</g>
        <circle className="dial__arc" cx="100" cy="100" r="85" transform="rotate(-90 100 100)" />
      </svg>
      <span className="dial__label">
        <span className="dial__num">30</span>
        <span className="dial__unit">ثانية</span>
      </span>
    </div>
  );
}

export default function HomeScreen() {
  const { bank, startGame, game } = useGame();
  const { profile } = useSettings();
  const online = useOnline();
  const navigate = useNavigate();
  const [stats] = useState(loadStats);
  const [unlocked] = useState(loadAchievements);
  const resumable = game && game.phase !== 'finished';

  const rush = (categories, difficulty) => {
    if (!bank) return;
    sound.unlock();
    const config = {
      players: [profile.name],
      categories,
      difficulty,
      questionTime: 'auto',
      rounds: 1,
      clockSeconds: 30,
      powerups: 1,
    };
    if (startGame('clock', config)) navigate('/play');
  };
  const quickRush = () => rush(CATEGORY_IDS, 'mixed');

  return (
    <div className="home screen">
      <section className="hero">
        <div className="hero__text">
          <p className="eyebrow">مسابقة معلومات عامة للأصدقاء</p>
          <h1 className="hero__title">
            ثلاثون ثانية تكشف <mark>الأسرع</mark> بينكم
          </h1>
          <p className="hero__lede">
            {bank ? bank.length.toLocaleString('en-US') : '…'} سؤال في {CATEGORIES.length} فئة، من التاريخ إلى الفضاء. العبوا على جهاز واحد، أو افتحوا غرفة وادعوا أصحابكم.
          </p>
        </div>
        <Dial />
      </section>

      {resumable && (
        <Link to="/play" className="notice">
          <Icon name="play" size={18} /> لديك لعبة لم تنتهِ. اضغط هنا للعودة إليها.
        </Link>
      )}

      <section className="play-choices" aria-label="طريقة اللعب">
        <Link to="/offline" className="play-card play-card--offline">
          <span className="play-card__icon">
            <Icon name="offline" size={28} />
          </span>
          <span className="play-card__en">PLAY OFFLINE</span>
          <span className="play-card__title">العب بدون إنترنت</span>
          <span className="play-card__desc">جهاز واحد للجميع. اختاروا النمط والفئات، ومرّروا الجهاز بالدور.</span>
          <span className="play-card__cta">
            ابدأ لعبة محلية <Icon name="back" size={18} />
          </span>
        </Link>
        {online ? (
          <Link to="/online" className="play-card play-card--online">
            <span className="play-card__icon">
              <Icon name="online" size={28} />
            </span>
            <span className="play-card__en">PLAY ONLINE</span>
            <span className="play-card__title">العب أونلاين</span>
            <span className="play-card__desc">أنشئ غرفة خاصة وشارك رمزها، أو انضم إلى غرفة صديقك من جهازك.</span>
            <span className="play-card__cta">
              إنشاء غرفة أو انضمام <Icon name="back" size={18} />
            </span>
          </Link>
        ) : (
          <div className="play-card play-card--online is-disabled" aria-disabled="true">
            <span className="play-card__icon">
              <Icon name="wifi-off" size={28} />
            </span>
            <span className="play-card__en">PLAY ONLINE</span>
            <span className="play-card__title">العب أونلاين</span>
            <span className="play-card__desc">أنت غير متصل بالإنترنت الآن. اللعب المحلي متاح بالكامل.</span>
          </div>
        )}
      </section>

      <section className="daily card" aria-labelledby="daily-title">
        <div className="daily__main">
          <div className="daily__head">
            <span className="daily__icon">
              <Icon name="calendar" size={22} />
            </span>
            <div>
              <p className="eyebrow">التحدي اليومي · نموذج</p>
              <h2 id="daily-title" className="daily__title">
                جولة الجغرافيا السريعة
              </h2>
            </div>
          </div>
          <ul className="daily__meta" aria-label="تفاصيل التحدي">
            <li>
              <CategoryTag id="geography" size="sm" />
            </li>
            <li className="pill">متوسط</li>
            <li className="pill">
              <Icon name="timer" size={14} /> 30 ثانية
            </li>
          </ul>
          <p className="daily__note">
            <Icon name="gift" size={16} /> مكافآت التحدي وتجدده كل يوم <SoonBadge />
          </p>
        </div>
        <button type="button" className="btn btn--gold btn--lg daily__cta" onClick={() => rush(['geography'], 2)} disabled={!bank}>
          <Icon name="play" size={18} /> ابدأ التحدي
        </button>
      </section>

      <nav className="home__secondary" aria-label="المزيد">
        <button type="button" className="mini-link" onClick={quickRush} disabled={!bank}>
          <span className="mini-link__icon">
            <Icon name="timer" />
          </span>
          <span className="mini-link__text">
            <span className="mini-link__title">تحدٍّ سريع</span>
            <span className="mini-link__meta">30 ثانية، كل الفئات</span>
          </span>
        </button>
        <Link to="/stats" className="mini-link">
          <span className="mini-link__icon">
            <Icon name="trophy" />
          </span>
          <span className="mini-link__text">
            <span className="mini-link__title">الإحصائيات</span>
            <span className="mini-link__meta">
              {unlocked.length}/{ACHIEVEMENTS.length} إنجاز · {stats.games} مباراة
            </span>
          </span>
        </Link>
        <Link to="/community" className="mini-link">
          <span className="mini-link__icon">
            <Icon name="users" />
          </span>
          <span className="mini-link__text">
            <span className="mini-link__title">المجتمع</span>
            <span className="mini-link__meta">الأصدقاء والصدارة</span>
          </span>
        </Link>
        <Link to="/how-to-play" className="mini-link">
          <span className="mini-link__icon">
            <Icon name="help" />
          </span>
          <span className="mini-link__text">
            <span className="mini-link__title">طريقة اللعب</span>
            <span className="mini-link__meta">الأنماط والنقاط</span>
          </span>
        </Link>
        <Link to="/settings" className="mini-link">
          <span className="mini-link__icon">
            <Icon name="settings" />
          </span>
          <span className="mini-link__text">
            <span className="mini-link__title">الإعدادات</span>
            <span className="mini-link__meta">المظهر والصوت</span>
          </span>
        </Link>
      </nav>
    </div>
  );
}
