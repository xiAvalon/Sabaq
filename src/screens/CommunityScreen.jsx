import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PreviewNote, SoonBadge, useToast } from '../components/feedback.jsx';
import { Icon } from '../components/icons.jsx';
import { Avatar, PageHeader } from '../components/ui.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import { loadLeaderboard } from '../services/storage.js';

// Illustrative rows for the design preview only. These are not real players or scores.
const SAMPLE_BOARD = [
  { name: 'لاعب أ', color: 2, icon: 'crown', score: 4820, level: 14 },
  { name: 'لاعب ب', color: 1, icon: 'bolt', score: 4410, level: 12 },
  { name: 'لاعب ج', color: 3, icon: 'star', score: 3975, level: 11 },
  { name: 'لاعب د', color: 4, icon: 'compass', score: 3540, level: 9 },
  { name: 'لاعب هـ', color: 5, icon: 'book', score: 3120, level: 8 },
];
const SAMPLE_FRIENDS = [
  { name: 'صديق 1', color: 1, icon: 'flame', note: 'آخر مباراة: تحدي الفئات' },
  { name: 'صديق 2', color: 3, icon: 'trophy', note: 'آخر مباراة: وجهًا لوجه' },
];

const fmt = (n) => Number(n).toLocaleString('en-US');

export default function CommunityScreen() {
  const { profile } = useSettings();
  const toast = useToast();
  // Real names from games on this device (people you played with locally), excluding yourself.
  const [opponents] = useState(() =>
    [...new Set(loadLeaderboard().map((e) => e.name))].filter((n) => n !== profile.name && !/^(اللاعب|الفريق)\s+\d+$/.test(n)).slice(0, 6),
  );

  const copyLink = async () => {
    const url = new URL(import.meta.env.BASE_URL, window.location.origin).href;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'سباق العقول', text: 'تعال نتحدى بعض في سباق العقول!', url });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast.show({ text: 'نُسخ رابط اللعبة. أرسله لأصدقائك.', tone: 'success' });
    } catch (e) {
      if (e?.name !== 'AbortError') toast.show({ text: `تعذّر النسخ. الرابط: ${url}`, tone: 'warning', duration: 6000 });
    }
  };

  return (
    <div className="screen community">
      <PageHeader title="المجتمع" subtitle="لوحة صدارة عالمية وأصدقاء، تصل مع الحسابات." />

      <div className="community__grid">
        <section className="card">
          <div className="card__head">
            <h2>
              <Icon name="trophy" size={20} /> لوحة الصدارة العالمية
            </h2>
            <SoonBadge />
          </div>
          <PreviewNote>معاينة للتصميم ببيانات توضيحية. هذه ليست أسماء أو نتائج لاعبين حقيقيين.</PreviewNote>
          <ol className="global-board is-sample" aria-label="معاينة لوحة الصدارة ببيانات توضيحية">
            {SAMPLE_BOARD.map((r, i) => (
              <li key={r.name} className="global-board__row">
                <span className={`global-board__rank rank-${i + 1}`}>{i + 1}</span>
                <Avatar name={r.name} color={r.color} icon={r.icon} size={36} />
                <span className="global-board__name">
                  {r.name}
                  <small>المستوى {r.level}</small>
                </span>
                <span className="global-board__score num-ltr">{fmt(r.score)}</span>
              </li>
            ))}
          </ol>
          <Link to="/stats" className="text-link">
            لوحة الصدارة على هذا الجهاز متاحة الآن <Icon name="back" size={14} />
          </Link>
        </section>

        <div className="community__side">
          <section className="card">
            <div className="card__head">
              <h2>
                <Icon name="users" size={20} /> الأصدقاء
              </h2>
              <SoonBadge />
            </div>
            <PreviewNote>شكل قائمة الأصدقاء القادمة. الأسماء أدناه أمثلة فقط.</PreviewNote>
            <ul className="friends is-sample">
              {SAMPLE_FRIENDS.map((f) => (
                <li key={f.name} className="friends__row">
                  <Avatar name={f.name} color={f.color} icon={f.icon} size={36} />
                  <span className="friends__name">
                    {f.name} <span className="sample-tag">مثال</span>
                    <small>{f.note}</small>
                  </span>
                  <button type="button" className="btn btn--ghost btn--sm" disabled data-tip="تتوفر مع الحسابات">
                    تحدٍّ
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section className="card invite-card">
            <div className="card__head">
              <h2>
                <Icon name="share" size={20} /> ادعُ أصدقاءك الآن
              </h2>
            </div>
            <p className="muted">لا تحتاج إلى حساب: افتح غرفة أونلاين وشارك رمزها، أو أرسل رابط اللعبة.</p>
            <div className="invite-card__actions">
              <Link to="/online" className="btn btn--primary">
                <Icon name="online" size={18} /> افتح غرفة
              </Link>
              <button type="button" className="btn btn--ghost" onClick={copyLink}>
                <Icon name="link" size={18} /> مشاركة الرابط
              </button>
            </div>
          </section>

          <section className="card">
            <div className="card__head">
              <h2>
                <Icon name="swords" size={20} /> لعبت معهم مؤخرًا
              </h2>
              <span className="card__hint">من هذا الجهاز</span>
            </div>
            {opponents.length ? (
              <ul className="chips-list">
                {opponents.map((n) => (
                  <li key={n} className="name-chip">
                    <Avatar name={n} color={n.length % 6} size={26} />
                    {n}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted">ستظهر هنا أسماء من لعبت معهم على هذا الجهاز.</p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
