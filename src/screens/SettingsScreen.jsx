import { useState } from 'react';
import { PageHeader, Segmented, Toggle } from '../components/ui.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import { QUESTION_TIME_CHOICES } from '../engine/config.js';
import { resetProgress } from '../services/storage.js';
import { sound } from '../services/sound.js';

export default function SettingsScreen() {
  const { settings, update } = useSettings();
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  return (
    <div className="settings">
      <PageHeader title="الإعدادات" />
      <section className="panel">
        <div className="panel__head">
          <h2>الصوت</h2>
        </div>
        <Toggle id="sound" label="المؤثرات الصوتية" hint="إجابة صحيحة، خاطئة، دقات العداد" checked={settings.sound} onChange={(v) => update({ sound: v })} />
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
                sound.configure({ ...settings });
                sound.unlock();
                sound.play('correct');
              }}
            >
              تجربة
            </button>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel__head">
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
        <Toggle id="explanations" label="عرض الشرح بعد الإجابة" hint="يظهر عندما يكون للسؤال شرح" checked={settings.showExplanations} onChange={(v) => update({ showExplanations: v })} />
        <Toggle id="motion" label="تقليل الحركة" hint="يوقف الحركات والوميض" checked={settings.reduceMotion} onChange={(v) => update({ reduceMotion: v })} />
      </section>

      <section className="panel">
        <div className="panel__head">
          <h2>البيانات</h2>
        </div>
        <p className="muted">تُحفظ الإحصائيات ولوحة الصدارة على هذا الجهاز فقط.</p>
        {resetDone ? (
          <p className="notice">حُذفت الإحصائيات ولوحة الصدارة.</p>
        ) : confirmReset ? (
          <div className="inline-confirm">
            <span>حذف كل الإحصائيات ولوحة الصدارة؟</span>
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
    </div>
  );
}
