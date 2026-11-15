import { Link } from 'react-router-dom';
import { LogoMark } from '../brand.jsx';
import { SoonBadge } from '../feedback.jsx';
import { Icon } from '../icons.jsx';
import ThemeToggle from '../ThemeToggle.jsx';

const PERKS = [
  { icon: 'trophy', text: 'احفظ إنجازاتك ونقاطك على كل أجهزتك' },
  { icon: 'users', text: 'أضف أصدقاءك وتحدَّهم مباشرة' },
  { icon: 'chart', text: 'نافس في لوحة الصدارة العالمية' },
];

/** Shared frame for the login and sign-up pages: brand panel + form card. */
export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="auth screen">
      <header className="auth__bar">
        <Link to="/" className="btn btn--ghost btn--sm">
          <Icon name="forward" size={16} /> الرئيسية
        </Link>
        <ThemeToggle />
      </header>
      <div className="auth__grid">
        <aside className="auth__brand" aria-hidden="true">
          <div className="auth__rings">
            <span />
            <span />
            <span />
          </div>
          <LogoMark size={64} />
          <p className="auth__brand-title">سباق العقول</p>
          <p className="auth__brand-text">ثلاثون ثانية تكشف الأسرع بينكم.</p>
          <ul className="auth__perks">
            {PERKS.map((p) => (
              <li key={p.text}>
                <Icon name={p.icon} size={18} />
                <span>{p.text}</span>
              </li>
            ))}
          </ul>
          <SoonBadge label="الحسابات قريبًا" />
        </aside>
        <section className="auth__card">
          <div className="auth__logo">
            <LogoMark size={52} />
          </div>
          <h1 className="auth__title">{title}</h1>
          <p className="auth__subtitle">{subtitle}</p>
          {children}
          {footer && <div className="auth__footer">{footer}</div>}
        </section>
      </div>
    </div>
  );
}
