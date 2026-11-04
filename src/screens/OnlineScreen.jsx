import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Icon } from '../components/icons.jsx';
import { EmptyState, PageHeader, Segmented, Spinner } from '../components/ui.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import { useOnline } from '../hooks/useOnline.js';
import { createRoom, ensureSession } from '../online/api.js';
import { isOnlineConfigured } from '../online/client.js';
import { cleanCode, DEFAULT_ONLINE_SETTINGS, ONLINE_MODES } from '../online/modes.js';

export function OnlineUnavailable() {
  return (
    <EmptyState icon="online" title="اللعب أونلاين غير مفعّل في هذه النسخة">
      تحتاج الغرف الخاصة إلى ربط التطبيق بخادم Supabase. يستطيع صاحب التطبيق تفعيلها باتباع ملف docs/ONLINE.md في المستودع. اللعب بدون إنترنت متاح بالكامل.
    </EmptyState>
  );
}

export default function OnlineScreen() {
  const { profile, updateProfile } = useSettings();
  const online = useOnline();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [name, setName] = useState(profile.name === 'لاعب' ? '' : profile.name);
  const [code, setCode] = useState(cleanCode(params.get('code')));
  const [mode, setMode] = useState('rush');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  if (!isOnlineConfigured) {
    return (
      <div className="screen narrow">
        <PageHeader title="العب أونلاين" />
        <OnlineUnavailable />
        <p style={{ marginTop: 16 }}>
          <Link to="/offline" className="text-link">
            العب بدون إنترنت
          </Link>
        </p>
      </div>
    );
  }

  const trimmed = name.trim();
  const saveName = () => updateProfile({ name: trimmed });

  const onCreate = async () => {
    if (!trimmed) return setError('اكتب اسمك أولًا.');
    setBusy(true);
    setError(null);
    try {
      saveName();
      await ensureSession();
      const res = await createRoom(trimmed, profile.color, { ...DEFAULT_ONLINE_SETTINGS, mode });
      navigate(`/room/${res.code}`);
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  };

  const onJoin = (e) => {
    e.preventDefault();
    if (!trimmed) return setError('اكتب اسمك أولًا.');
    if (code.length !== 6) return setError('رمز الغرفة من 6 خانات.');
    saveName();
    navigate(`/room/${code}`);
  };

  return (
    <div className="screen narrow online">
      <PageHeader title="العب أونلاين" subtitle="غرف خاصة برمز من 6 خانات. لا تحتاج إلى حساب." />
      {!online && (
        <p className="notice notice--bad">
          <Icon name="wifi-off" size={16} /> أنت غير متصل بالإنترنت الآن.
        </p>
      )}

      <section className="card">
        <label className="field-stack" htmlFor="online-name">
          <span className="field__label">اسمك في الغرفة</span>
          <input id="online-name" type="text" maxLength={18} value={name} placeholder="مثال: سارة" onChange={(e) => setName(e.target.value)} autoComplete="nickname" />
        </label>
      </section>

      <div className="online__choices">
        <section className="card online__create">
          <div className="card__head">
            <h2>
              <Icon name="plus" /> إنشاء غرفة
            </h2>
          </div>
          <p className="muted">أنت المضيف: تختار النمط والفئات وتبدأ المباراة.</p>
          <Segmented id="online-mode" label="نمط اللعب" value={mode} onChange={setMode} options={ONLINE_MODES.map((m) => ({ value: m.id, label: m.name }))} />
          <button type="button" className="btn btn--primary btn--lg btn--block" onClick={onCreate} disabled={busy || !online}>
            {busy ? <Spinner /> : 'إنشاء غرفة'}
          </button>
        </section>

        <form className="card online__join" onSubmit={onJoin}>
          <div className="card__head">
            <h2>
              <Icon name="link" /> الانضمام إلى غرفة
            </h2>
          </div>
          <label className="field-stack" htmlFor="room-code">
            <span className="field__label">رمز الغرفة</span>
            <input
              id="room-code"
              className="code-input"
              type="text"
              inputMode="text"
              autoCapitalize="characters"
              autoComplete="off"
              spellCheck={false}
              dir="ltr"
              placeholder="ABC234"
              value={code}
              onChange={(e) => setCode(cleanCode(e.target.value))}
            />
          </label>
          <button type="submit" className="btn btn--ghost btn--lg btn--block" disabled={code.length !== 6 || !online}>
            انضمام
          </button>
        </form>
      </div>

      {error && (
        <p className="notice notice--bad" role="alert">
          <Icon name="close" size={16} /> {error}
        </p>
      )}
    </div>
  );
}
