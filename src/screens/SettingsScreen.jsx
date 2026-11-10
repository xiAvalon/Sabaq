import { useState } from 'react';
import { Link } from 'react-router-dom';
import { SoonBadge, useToast } from '../components/feedback.jsx';
import { Icon } from '../components/icons.jsx';
import { AboutDialog, PrivacyDialog, TermsDialog } from '../components/LegalDialogs.jsx';
import { Avatar, PageHeader, Segmented, Toggle } from '../components/ui.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import { DIFFICULTY_CHOICES, QUESTION_TIME_CHOICES } from '../engine/config.js';
import { resetProgress } from '../services/storage.js';
import { sound } from '../services/sound.js';

// Read-only preview of the palette; the accent itself is not customisable yet.
const ACCENTS = [
  { name: 'نيلي', token: '--indigo' },
  { name: 'سماوي', token: '--cyan' },
  { name: 'ذهبي', token: '--gold' },
  { name: 'أخضر', token: '--good' },
  { name: 'وردي', token: '--bad' },
];

function Section({ icon, title, children, aside }) {
  return (
    <section className="card settings-section">
      <div className="card__head">
        <h2>
          <Icon name={icon} size={20} /> {title}
        </h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

function RowLink({ to, onClick, icon, children, hint }) {
  const body = (
    <>
      <span className="row-link__icon">
        <Icon name={icon} size={18} />
      </span>
      <span className="row-link__text">
        {children}
        {hint && <small>{hint}</small>}
      </span>
      <Icon name="back" size={16} className="row-link__chev" />
    </>
  );
  return to ? (
    <Link to={to} className="row-link">
      {body}
    </Link>
  ) : (
    <button type="button" className="row-link" onClick={onClick}>
      {body}
    </button>
  );
}

export default function SettingsScreen() {
  const { settings, update, profile, theme, setTheme } = useSettings();
  const toast = useToast();
  const [confirmReset, setConfirmReset] = useState(false);
  const [dialog, setDialog] = useState(null);

  return (
    <div className="screen narrow settings">
      <PageHeader title="الإعدادات" />

      <Section icon="palette" title="المظهر">
        <div className="field">
          <span className="field__label">السمة</span>
          <Segmented
            id="theme"
            label="السمة"
            value={theme}
            onChange={setTheme}
            options={[
              {
                value: 'dark',
                label: (
                  <>
                    <Icon name="moon" size={16} /> داكن
                  </>
                ),
              },
              {
                value: 'light',
                label: (
                  <>
                    <Icon name="sun" size={16} /> فاتح
                  </>
                ),
              },
            ]}
          />
        </div>
        <div className="field">
          <span className="field__label">
            ألوان اللعبة <SoonBadge label="تخصيصها قريبًا" />
          </span>
          <div className="accent-preview" aria-label="معاينة ألوان اللعبة">
            {ACCENTS.map((a) => (
              <span key={a.token} className="accent-preview__dot" style={{ background: `var(${a.token})` }} data-tip={a.name} />
            ))}
          </div>
        </div>
      </Section>

      <Section icon="play" title="اللعب">
        <Toggle
          id="sound"
          label="المؤثرات الصوتية"
          hint="الإجابة الصحيحة والخاطئة ودقات العداد"
          checked={settings.sound}
          onChange={(v) => update({ sound: v })}
        />
        <div className="field">
          <label className="field__label" htmlFor="volume">
            مستوى الصوت
          </label>
          <div className="volume">
            <input
              id="volume"
              type="range"
              min={0}
              max={1}
              step={0.1}
              value={settings.volume}
              onChange={(e) => update({ volume: Number(e.target.value) })}
              disabled={!settings.sound}
              dir="ltr"
            />
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              disabled={!settings.sound}
              onClick={() => {
                sound.configure(settings);
                sound.unlock();
                sound.play('correct');
              }}
            >
              <Icon name="volume" size={16} /> تجربة
            </button>
          </div>
        </div>
        <div className="toggle is-disabled" aria-disabled="true">
          <span className="toggle__text">
            <span className="toggle__label">
              الموسيقى الخلفية <SoonBadge />
            </span>
            <span className="toggle__hint">مقطوعات هادئة أثناء اللعب، في تحديث قادم.</span>
          </span>
          <span className="toggle__track" aria-hidden="true">
            <span className="toggle__thumb" />
          </span>
        </div>
        <div className="field-stack">
          <span className="field__label">الصعوبة الافتراضية</span>
          <Segmented
            id="default-difficulty"
            label="الصعوبة الافتراضية"
            value={settings.difficulty ?? 'mixed'}
            onChange={(v) => update({ difficulty: v })}
            options={DIFFICULTY_CHOICES.map((d) => ({ value: d.id, label: d.label }))}
          />
          <p className="field__hint">تُختار تلقائيًا عند إعداد لعبة جديدة، ويمكنك تغييرها لكل لعبة.</p>
        </div>
        <div className="field-stack">
          <span className="field__label">وقت السؤال الافتراضي</span>
          <Segmented
            id="default-time"
            label="وقت السؤال الافتراضي"
            value={settings.questionTime}
            onChange={(v) => update({ questionTime: v })}
            options={QUESTION_TIME_CHOICES.map((t) => ({ value: t, label: t === 'auto' ? 'تلقائي' : `${t} ث` }))}
          />
          <p className="field__hint">«تلقائي» يعطي وقتًا حسب نوع السؤال وصعوبته، من 10 إلى 35 ثانية.</p>
        </div>
        <Toggle
          id="explanations"
          label="عرض الشرح بعد الإجابة"
          hint="عندما يكون للسؤال شرح"
          checked={settings.showExplanations}
          onChange={(v) => update({ showExplanations: v })}
        />
        <Toggle id="motion" label="تقليل الحركة" hint="يوقف الحركات والوميض" checked={settings.reduceMotion} onChange={(v) => update({ reduceMotion: v })} />
      </Section>

      <Section icon="user" title="الحساب">
        <Link to="/profile" className="account-card">
          <Avatar name={profile.name} color={profile.color} icon={profile.avatar} size={44} />
          <span className="account-card__text">
            <strong>{profile.name}</strong>
            <small>ملف ضيف محفوظ على هذا الجهاز</small>
          </span>
          <span className="btn btn--ghost btn--sm">
            <Icon name="edit" size={16} /> الملف
          </span>
        </Link>
        <div className="settings__auth">
          <Link to="/login" className="btn btn--ghost">
            <Icon name="log-in" size={18} /> تسجيل الدخول
          </Link>
          <Link to="/signup" className="btn btn--primary">
            <Icon name="user-plus" size={18} /> إنشاء حساب
          </Link>
        </div>
        <p className="field__hint">
          <SoonBadge label="الحسابات قريبًا" /> يمكنك تصفح صفحتي الدخول والتسجيل الآن، لكن الحسابات لم تُفعّل بعد.
        </p>
      </Section>

      <Section icon="chart" title="البيانات">
        <p className="muted">الإحصائيات والإنجازات ولوحة الصدارة محفوظة على هذا الجهاز فقط.</p>
        {confirmReset ? (
          <div className="inline-confirm">
            <span>حذف كل الإحصائيات والإنجازات؟ لا يمكن التراجع.</span>
            <button
              type="button"
              className="btn btn--danger btn--sm"
              onClick={() => {
                resetProgress();
                setConfirmReset(false);
                toast.show({ text: 'حُذفت الإحصائيات والإنجازات ولوحة الصدارة.', tone: 'success' });
              }}
            >
              احذف
            </button>
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => setConfirmReset(false)}>
              إلغاء
            </button>
          </div>
        ) : (
          <button type="button" className="btn btn--ghost" onClick={() => setConfirmReset(true)}>
            مسح الإحصائيات
          </button>
        )}
      </Section>

      <Section icon="info" title="معلومات">
        <div className="row-links">
          <RowLink to="/how-to-play" icon="help">
            طريقة اللعب
          </RowLink>
          <RowLink onClick={() => setDialog('about')} icon="sparkles">
            عن سباق العقول
          </RowLink>
          <RowLink onClick={() => setDialog('privacy')} icon="shield" hint="مسودة">
            سياسة الخصوصية
          </RowLink>
          <RowLink onClick={() => setDialog('terms')} icon="book" hint="مسودة">
            الشروط والأحكام
          </RowLink>
        </div>
        {/* eslint-disable-next-line no-undef */}
        <p className="settings__version">الإصدار {typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '—'}</p>
      </Section>

      {dialog === 'about' && <AboutDialog onClose={() => setDialog(null)} />}
      {dialog === 'privacy' && <PrivacyDialog onClose={() => setDialog(null)} />}
      {dialog === 'terms' && <TermsDialog onClose={() => setDialog(null)} />}
    </div>
  );
}
