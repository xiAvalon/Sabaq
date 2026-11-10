import { useState } from 'react';
import { Link } from 'react-router-dom';
import { SoonBadge, useToast } from '../components/feedback.jsx';
import { Icon } from '../components/icons.jsx';
import { AVATAR_ICONS, Avatar, PageHeader } from '../components/ui.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import { ACHIEVEMENTS } from '../engine/achievements.js';
import { PLAYER_COLORS } from '../engine/config.js';
import { progression } from '../engine/progression.js';
import { loadAchievements, loadStats } from '../services/storage.js';

const fmt = (n) => Number(n ?? 0).toLocaleString('en-US');

export default function ProfileScreen() {
  const { profile, updateProfile } = useSettings();
  const toast = useToast();
  const [stats] = useState(loadStats);
  const [unlocked] = useState(loadAchievements);
  const [draft, setDraft] = useState({ name: profile.name, color: profile.color, avatar: profile.avatar ?? null });
  const p = progression(stats);
  const accuracy = stats.questions ? Math.round((stats.correct / stats.questions) * 100) : 0;
  const dirty = draft.name.trim() !== profile.name || draft.color !== profile.color || draft.avatar !== (profile.avatar ?? null);
  const nameError = draft.name.trim() ? '' : 'اكتب اسمًا يظهر للاعبين.';

  const save = () => {
    if (nameError) return;
    updateProfile({ name: draft.name.trim(), color: draft.color, avatar: draft.avatar });
    toast.show({ text: 'حُفظ ملفك على هذا الجهاز.', tone: 'success' });
  };

  const tiles = [
    { label: 'مباريات', value: fmt(stats.games), icon: 'flag' },
    { label: 'انتصارات', value: fmt(stats.wins), icon: 'trophy' },
    { label: 'أعلى نتيجة', value: fmt(stats.bestScore), icon: 'star', gold: true },
    { label: 'أطول سلسلة', value: fmt(stats.bestStreak), icon: 'flame' },
    { label: 'إجابات صحيحة', value: fmt(stats.correct), icon: 'check' },
    { label: 'الدقة', value: `${accuracy}٪`, icon: 'chart' },
  ];

  return (
    <div className="screen profile">
      <PageHeader title="ملفي" subtitle="ملف ضيف: كل ما هنا محفوظ على هذا الجهاز فقط." />

      <section className="card profile-hero">
        <div className="profile-hero__id">
          <Avatar name={draft.name || profile.name} color={draft.color} icon={draft.avatar} size={84} />
          <div className="profile-hero__text">
            <p className="profile-hero__name">{draft.name.trim() || profile.name}</p>
            <p className="profile-hero__rank">
              <span className="pill pill--indigo">المستوى {p.level}</span>
              <span className="pill">{p.rank}</span>
              <span className="pill pill--muted">
                <Icon name="user" size={14} /> ضيف
              </span>
            </p>
          </div>
        </div>
        <div className="xp">
          <div className="xp__head">
            <span>
              <strong className="num-ltr">{fmt(p.xp)}</strong> نقطة خبرة
            </span>
            <span className="xp__next">
              {fmt(p.toNext)} للمستوى {p.level + 1}
              {p.nextRank && ` · لقب «${p.nextRank.title}» في المستوى ${p.nextRank.from}`}
            </span>
          </div>
          <div className="xp__bar" role="progressbar" aria-label="التقدم إلى المستوى التالي" aria-valuemin={0} aria-valuemax={p.span} aria-valuenow={p.into}>
            <span style={{ width: `${Math.max(2, (p.into / p.span) * 100)}%` }} />
          </div>
          <p className="field__hint">تُحسب الخبرة من مبارياتك المحلية: 10 لكل إجابة صحيحة، و25 لكل مباراة، و50 لكل انتصار.</p>
        </div>
      </section>

      <dl className="tiles profile__tiles">
        {tiles.map((t) => (
          <div key={t.label} className={`tile${t.gold ? ' tile--gold' : ''}`}>
            <dt>
              <Icon name={t.icon} size={16} /> {t.label}
            </dt>
            <dd>{t.value}</dd>
          </div>
        ))}
      </dl>
      {stats.games === 0 && <p className="muted profile__empty">لم تلعب بعد على هذا الجهاز. أنهِ مباراة لتبدأ أرقامك بالظهور هنا.</p>}

      <div className="profile__grid">
        <section className="card">
          <div className="card__head">
            <h2>تخصيص الملف</h2>
          </div>
          <label className="field-stack" htmlFor="profile-name">
            <span className="field__label">الاسم الظاهر</span>
            <input
              id="profile-name"
              type="text"
              maxLength={18}
              value={draft.name}
              onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
              aria-invalid={Boolean(nameError)}
            />
            {nameError && <span className="fieldbox__error">{nameError}</span>}
          </label>
          <div className="field-stack">
            <span className="field__label">الصورة الرمزية</span>
            <div className="avatar-picker" role="radiogroup" aria-label="الصورة الرمزية">
              {[null, ...AVATAR_ICONS].map((icon) => (
                <button
                  key={icon ?? 'initial'}
                  type="button"
                  role="radio"
                  aria-checked={draft.avatar === icon}
                  aria-label={icon ? `رمز ${icon}` : 'الحرف الأول من اسمك'}
                  className={`avatar-picker__item${draft.avatar === icon ? ' is-active' : ''}`}
                  onClick={() => setDraft((d) => ({ ...d, avatar: icon }))}
                >
                  <Avatar name={draft.name || profile.name} color={draft.color} icon={icon} size={44} />
                </button>
              ))}
            </div>
          </div>
          <div className="field-stack">
            <span className="field__label">اللون</span>
            <div className="swatches" role="radiogroup" aria-label="لون الملف">
              {PLAYER_COLORS.map((c, i) => (
                <button
                  key={c}
                  type="button"
                  role="radio"
                  aria-checked={i === draft.color}
                  aria-label={`لون ${i + 1}`}
                  className={`swatch${i === draft.color ? ' is-active' : ''}`}
                  style={{ '--swatch': c }}
                  onClick={() => setDraft((d) => ({ ...d, color: i }))}
                />
              ))}
            </div>
          </div>
          <div className="profile__save">
            <button type="button" className="btn btn--primary" onClick={save} disabled={!dirty || Boolean(nameError)}>
              <Icon name="check" size={18} /> حفظ التغييرات
            </button>
            {dirty && (
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => setDraft({ name: profile.name, color: profile.color, avatar: profile.avatar ?? null })}
              >
                تراجع
              </button>
            )}
          </div>
        </section>

        <div className="profile__side">
          <Link to="/stats" className="card profile-ach">
            <div className="card__head">
              <h2>الإنجازات</h2>
              <span className="card__hint">
                {unlocked.length} من {ACHIEVEMENTS.length}
              </span>
            </div>
            <div className="profile-ach__icons">
              {ACHIEVEMENTS.slice(0, 7).map((a) => (
                <span key={a.id} className={`profile-ach__icon${unlocked.includes(a.id) ? ' is-on' : ''}`} data-tip={a.title}>
                  <Icon name={unlocked.includes(a.id) ? a.icon : 'lock'} size={18} />
                </span>
              ))}
            </div>
            <span className="text-link">
              كل الإنجازات والتقدم <Icon name="back" size={14} />
            </span>
          </Link>

          <section className="card profile-cta">
            <span className="profile-cta__icon">
              <Icon name="shield" size={22} />
            </span>
            <h2>
              احفظ تقدمك بحساب <SoonBadge />
            </h2>
            <p className="muted">ملف الضيف يبقى على هذا المتصفح، ويضيع إن مسحت بياناته. ستتيح الحسابات نقل تقدمك بين الأجهزة.</p>
            <Link to="/signup" className="btn btn--ghost btn--block">
              <Icon name="user-plus" size={18} /> معاينة إنشاء الحساب
            </Link>
          </section>
        </div>
      </div>
    </div>
  );
}
