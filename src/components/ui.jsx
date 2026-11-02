import { Link } from 'react-router-dom';
import { getCategory } from '../data/categories.js';

export function PageHeader({ title, back = '/', backLabel = 'الرئيسية', children }) {
  return (
    <header className="page-header">
      <Link to={back} className="back-link">
        <span aria-hidden="true">→</span> {backLabel}
      </Link>
      <h1 className="page-title">{title}</h1>
      {children}
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
    <div className="stepper" id={id} aria-label={label}>
      <button type="button" className="stepper__btn" onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max} aria-label="زيادة">
        +
      </button>
      <output className="stepper__value">{format(value)}</output>
      <button type="button" className="stepper__btn" onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min} aria-label="إنقاص">
        −
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
      <span className="cat-tag__glyph" aria-hidden="true">
        {c.glyph}
      </span>
      {c.name}
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

export const formatSeconds = (s) => `${s.toFixed(1)} ث`;
