import { useState } from 'react';
import { Icon } from '../icons.jsx';

export function TextField({ id, label, error, hint, icon, dir, ...input }) {
  return (
    <div className={`fieldbox${error ? ' has-error' : ''}`}>
      <label className="fieldbox__label" htmlFor={id}>
        {label}
      </label>
      <div className="fieldbox__control">
        {icon && <Icon name={icon} size={18} className="fieldbox__icon" />}
        <input id={id} dir={dir} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined} {...input} />
      </div>
      {error ? (
        <p className="fieldbox__error" id={`${id}-error`}>
          {error}
        </p>
      ) : (
        hint && (
          <p className="fieldbox__hint" id={`${id}-hint`}>
            {hint}
          </p>
        )
      )}
    </div>
  );
}

export function PasswordField({ id, label, error, hint, children, ...input }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className={`fieldbox${error ? ' has-error' : ''}`}>
      <label className="fieldbox__label" htmlFor={id}>
        {label}
      </label>
      <div className="fieldbox__control">
        <Icon name="lock" size={18} className="fieldbox__icon" />
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          dir="ltr"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          {...input}
        />
        <button
          type="button"
          className="fieldbox__reveal"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
          aria-pressed={visible}
          data-tip={visible ? 'إخفاء' : 'إظهار'}
        >
          <Icon name={visible ? 'eye-off' : 'eye'} size={18} />
        </button>
      </div>
      {children}
      {error ? (
        <p className="fieldbox__error" id={`${id}-error`}>
          {error}
        </p>
      ) : (
        hint && <p className="fieldbox__hint">{hint}</p>
      )}
    </div>
  );
}

export function Checkbox({ id, checked, onChange, children, error }) {
  return (
    <div className={`checkbox${error ? ' has-error' : ''}`}>
      <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} aria-invalid={Boolean(error)} />
      <label htmlFor={id}>
        <span className="checkbox__box" aria-hidden="true">
          <Icon name="check" size={14} />
        </span>
        <span className="checkbox__text">{children}</span>
      </label>
      {error && <p className="fieldbox__error">{error}</p>}
    </div>
  );
}

/** Honest result after a valid submit: accounts are not live, nothing was created or stored. */
export function ComingSoonResult({ kind, onClose }) {
  return (
    <div className="auth-result" role="status">
      <span className="auth-result__icon">
        <Icon name="info" size={22} />
      </span>
      <div>
        <p className="auth-result__title">{kind === 'signup' ? 'إنشاء الحسابات غير متاح بعد' : 'تسجيل الدخول غير متاح بعد'}</p>
        <p className="auth-result__text">
          نجهّز حسابات سباق حاليًا. {kind === 'signup' ? 'لم يُنشأ أي حساب' : 'لم يُسجَّل دخولك'}، ولم تُرسل بياناتك أو تُحفظ في أي مكان. يمكنك اللعب كضيف الآن
          بكل الميزات.
        </p>
      </div>
      <button type="button" className="icon-btn" onClick={onClose} aria-label="إغلاق">
        <Icon name="close" size={16} />
      </button>
    </div>
  );
}
