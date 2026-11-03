import { useNavigate } from 'react-router-dom';
import { getCategory } from '../data/categories.js';
import { PLAYER_COLORS } from '../engine/config.js';
import { Icon } from './icons.jsx';

export function PageHeader({ title, subtitle, back = '/', backLabel = 'رجوع', children }) {
  const navigate = useNavigate();
  return (
    <header className="page-header">
      {back !== false && (
        <button type="button" className="icon-btn" onClick={() => (back === -1 ? navigate(-1) : navigate(back))} aria-label={backLabel}>
          <Icon name="forward" />
        </button>
      )}
      <div className="page-header__text">
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
        {children}
      </div>
    </header>
  );
}

export function Segmented({ id, value, options, onChange, label }) {
  return (
    <div className="segmented" role="radiogroup" aria-label={label} id={id}>
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          className={`segmented__item${o.value === value ? ' is-active' : ''}`}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Stepper({ id, value, min, max, onChange, label, format = (v) => v }) {
  return (
    <div className="stepper" id={id} role="group" aria-label={label}>
      <button type="button" className="stepper__btn" onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max} aria-label="زيادة">
        <Icon name="plus" size={18} />
      </button>
      <output className="stepper__value">{format(value)}</output>
      <button type="button" className="stepper__btn" onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min} aria-label="إنقاص">
        <Icon name="minus" size={18} />
      </button>
    </div>
  );
}

export function Toggle({ id, checked, onChange, label, hint }) {
  return (
    <label className="toggle" htmlFor={id}>
      <span className="toggle__text">
        <span className="toggle__label">{label}</span>
        {hint && <span className="toggle__hint">{hint}</span>}
      </span>
      <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="toggle__track" aria-hidden="true">
        <span className="toggle__thumb" />
      </span>
    </label>
  );
}

export function CategoryTag({ id, size = 'md' }) {
  const c = getCategory(id);
  return (
    <span className={`cat-tag cat-tag--${size}`} style={{ '--cat': c.color }}>
      <Icon name={c.icon ?? c.id} size={size === 'sm' ? 14 : 16} />
      {c.name}
    </span>
  );
}

export function Avatar({ name, color, size = 36 }) {
  const c = typeof color === 'number' ? PLAYER_COLORS[color % PLAYER_COLORS.length] : color;
  const clean = (name ?? '').trim();
  // "اللاعب 2" / "الفريق 3" read better as their number than as «ا».
  const numbered = clean.match(/^(?:اللاعب|الفريق)\s+(\d+)$/);
  const initial = numbered ? numbered[1] : clean.charAt(0) || '؟';
  return (
    <span className="avatar" style={{ '--avatar': c, width: size, height: size, fontSize: size * 0.45 }} aria-hidden="true">
      {initial}
    </span>
  );
}

export function Dialog({ title, children, actions, onClose }) {
  return (
    <div className="dialog-backdrop" role="presentation" onClick={onClose}>
      <div className="dialog" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <h2 className="dialog__title">{title}</h2>
        <div className="dialog__body">{children}</div>
        <div className="dialog__actions">{actions}</div>
      </div>
    </div>
  );
}

export function EmptyState({ icon = 'sparkles', title, children }) {
  return (
    <div className="empty">
      <span className="empty__icon">
        <Icon name={icon} size={28} />
      </span>
      <p className="empty__title">{title}</p>
      {children && <p className="empty__text">{children}</p>}
    </div>
  );
}

export function Spinner({ label = 'جارٍ التحميل' }) {
  return (
    <span className="spinner" role="status" aria-label={label}>
      <span className="spinner__ring" />
    </span>
  );
}

export const formatSeconds = (s) => `${s.toFixed(1)} ث`;
