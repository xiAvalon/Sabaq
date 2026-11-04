import { useState } from 'react';
import { Icon } from '../components/icons.jsx';
import { ProfileDialog } from '../components/TopBar.jsx';
import { Avatar, PageHeader, Segmented, Toggle } from '../components/ui.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import { QUESTION_TIME_CHOICES } from '../engine/config.js';
import { resetProgress } from '../services/storage.js';
import { sound } from '../services/sound.js';

export default function SettingsScreen() {
  const { settings, update, profile } = useSettings();
  const [editing, setEditing] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  return (
    <div className="screen narrow">
      <PageHeader title="الإعدادات" />

      <section className="card">
        <div className="card__head">
          <h2>ملفك</h2>
        </div>
        <div className="field">
          <span className="field" style={{ justifyContent: 'flex-start' }}>
            <Avatar name={profile.name} color={profile.color} size={44} />
            <span>
              <strong>{profile.name}</strong>
              <br />
              <span className="card__hint">ضيف، بدون حساب</span>
            </span>
          </span>
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => setEditing(true)}>
            <Icon name="edit" size={16} /> تعديل
          </button>
        </div>
      </section>

      <section className="card">
        <div className="card__head">
          <h2>الصوت</h2>
        </div>
        <Toggle id="sound" label="المؤثرات الصوتية" hint="الإجابة الصحيحة والخاطئة ودقات العداد" checked={settings.sound} onChange={(v) => update({ sound: v })} />
        <div className="field">
          <label className="field__label" htmlFor="volume">
            مستوى الصوت
          </label>
          <div className="volume">
            <input id="volume" type="range" min={0} max={1} step={0.1} value={settings.volume} onChange={(e) => update({ volume: Number(e.target.value) })} disabled={!settings.sound} dir="ltr" />
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
      </section>

      <section className="card">
        <div className="card__head">
          <h2>اللعب</h2>
        </div>
        <div className="field">
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
        <Toggle id="explanations" label="عرض الشرح بعد الإجابة" hint="عندما يكون للسؤال شرح" checked={settings.showExplanations} onChange={(v) => update({ showExplanations: v })} />
        <Toggle id="motion" label="تقليل الحركة" hint="يوقف الحركات والوميض" checked={settings.reduceMotion} onChange={(v) => update({ reduceMotion: v })} />
      </section>

      <section className="card">
        <div className="card__head">
          <h2>البيانات</h2>
        </div>
        <p className="muted">الإحصائيات والإنجازات ولوحة الصدارة محفوظة على هذا الجهاز فقط.</p>
        {resetDone ? (
          <p className="notice">
            <Icon name="check" size={16} /> حُذفت الإحصائيات والإنجازات ولوحة الصدارة.
          </p>
        ) : confirmReset ? (
          <div className="inline-confirm">
            <span>حذف كل الإحصائيات والإنجازات؟</span>
            <button
              type="button"
              className="btn btn--danger btn--sm"
              onClick={() => {
                resetProgress();
                setResetDone(true);
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
      </section>
      {editing && <ProfileDialog onClose={() => setEditing(false)} />}
    </div>
  );
}
