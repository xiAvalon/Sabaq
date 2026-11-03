import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext.jsx';
import { PLAYER_COLORS } from '../engine/config.js';
import { useOnline } from '../hooks/useOnline.js';
import { Wordmark } from './brand.jsx';
import { Icon } from './icons.jsx';
import { Avatar, Dialog } from './ui.jsx';

export function ProfileDialog({ onClose }) {
  const { profile, updateProfile } = useSettings();
  const [name, setName] = useState(profile.name);
  const [color, setColor] = useState(profile.color);
  const save = () => {
    updateProfile({ name: name.trim() || 'لاعب', color });
    onClose();
  };
  return (
    <Dialog
      title="ملفك كضيف"
      onClose={onClose}
      actions={
        <>
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            إلغاء
          </button>
          <button type="button" className="btn btn--primary" onClick={save}>
            حفظ
          </button>
        </>
      }
    >
      <p>يظهر اسمك كأول لاعب في الألعاب المحلية وفي الغرف أونلاين. لا تحتاج إلى حساب.</p>
      <label className="field-stack" htmlFor="profile-name">
        <span className="field__label">الاسم</span>
        <input id="profile-name" type="text" maxLength={18} value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      <div className="field-stack">
        <span className="field__label">اللون</span>
        <div className="swatches" role="radiogroup" aria-label="لون الملف">
          {PLAYER_COLORS.map((c, i) => (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={i === color}
              aria-label={`لون ${i + 1}`}
              className={`swatch${i === color ? ' is-active' : ''}`}
              style={{ '--swatch': c }}
              onClick={() => setColor(i)}
            />
          ))}
        </div>
      </div>
    </Dialog>
  );
}

export default function TopBar() {
  const { profile } = useSettings();
  const online = useOnline();
  const [editing, setEditing] = useState(false);
  return (
    <header className="topbar">
      <Link to="/" className="topbar__brand" aria-label="سباق العقول، الصفحة الرئيسية">
        <Wordmark size="sm" />
      </Link>
      <div className="topbar__end">
        {!online && (
          <span className="net-pill" role="status">
            <Icon name="wifi-off" size={16} /> بدون اتصال
          </span>
        )}
        <button type="button" className="profile-chip" onClick={() => setEditing(true)} aria-label={`الملف: ${profile.name}. تعديل`}>
          <Avatar name={profile.name} color={profile.color} size={30} />
          <span className="profile-chip__name">{profile.name}</span>
        </button>
      </div>
      {editing && <ProfileDialog onClose={() => setEditing(false)} />}
    </header>
  );
}
