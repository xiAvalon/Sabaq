import { Link } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext.jsx';
import { useOnline } from '../hooks/useOnline.js';
import { Wordmark } from './brand.jsx';
import { Icon } from './icons.jsx';
import ThemeToggle from './ThemeToggle.jsx';
import { Avatar } from './ui.jsx';

export default function TopBar() {
  const { profile } = useSettings();
  const online = useOnline();
  return (
    <header className="topbar">
      <Link to="/" className="topbar__brand" aria-label="سباق العقول، الصفحة الرئيسية">
        <Wordmark size="sm" />
      </Link>
      <nav className="topbar__end" aria-label="الحساب والمظهر">
        {!online && (
          <span className="net-pill" role="status">
            <Icon name="wifi-off" size={16} /> بدون اتصال
          </span>
        )}
        <ThemeToggle />
        <Link to="/login" className="btn btn--ghost btn--sm topbar__login" aria-label="تسجيل الدخول">
          <Icon name="log-in" size={16} />
          <span>تسجيل الدخول</span>
        </Link>
        <Link to="/profile" className="profile-chip" aria-label={`ملفك: ${profile.name} (ضيف)`}>
          <Avatar name={profile.name} color={profile.color} icon={profile.avatar} size={30} />
          <span className="profile-chip__name">{profile.name}</span>
        </Link>
      </nav>
    </header>
  );
}
