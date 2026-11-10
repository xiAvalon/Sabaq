import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthShell from '../components/auth/AuthShell.jsx';
import { Checkbox, ComingSoonResult, PasswordField, TextField } from '../components/auth/fields.jsx';
import { Icon } from '../components/icons.jsx';
import { TermsDialog } from '../components/LegalDialogs.jsx';
import { Spinner } from '../components/ui.jsx';
import { passwordStrength, validateSignup } from '../services/authValidation.js';

const EMPTY = { name: '', email: '', password: '', confirm: '', terms: false };

export default function SignupScreen() {
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState(false);
  const [terms, setTerms] = useState(false);
  const errors = validateSignup(form);
  const strength = passwordStrength(form.password);
  const show = (k) => (submitted || touched[k]) && errors[k];
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const blur = (k) => () => setTouched((t) => ({ ...t, [k]: true }));

  const submit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setResult(false);
    if (Object.keys(errors).length) return;
    setChecking(true);
    window.setTimeout(() => {
      setChecking(false);
      setResult(true);
      setForm((f) => ({ ...f, password: '', confirm: '' }));
      setTouched({});
      setSubmitted(false);
    }, 700);
  };

  return (
    <AuthShell
      title="أنشئ حسابك"
      subtitle="حساب واحد لحفظ نقاطك وإنجازاتك ومنافسة أصدقائك."
      footer={
        <p>
          لديك حساب بالفعل؟{' '}
          <Link to="/login" className="text-link">
            سجّل الدخول
          </Link>
        </p>
      }
    >
      {result && <ComingSoonResult kind="signup" onClose={() => setResult(false)} />}
      <form className="auth__form" onSubmit={submit} noValidate>
        <TextField
          id="signup-name"
          label="الاسم الظاهر"
          icon="user"
          autoComplete="nickname"
          maxLength={18}
          placeholder="مثال: سارة"
          value={form.name}
          onChange={set('name')}
          onBlur={blur('name')}
          error={show('name')}
        />
        <TextField
          id="signup-email"
          label="البريد الإلكتروني"
          icon="mail"
          type="email"
          dir="ltr"
          inputMode="email"
          autoComplete="email"
          placeholder="name@example.com"
          value={form.email}
          onChange={set('email')}
          onBlur={blur('email')}
          error={show('email')}
        />
        <PasswordField
          id="signup-password"
          label="كلمة المرور"
          autoComplete="new-password"
          placeholder="ثمانية أحرف على الأقل"
          value={form.password}
          onChange={set('password')}
          onBlur={blur('password')}
          error={show('password')}
        >
          {form.password && (
            <div className={`strength strength--${strength.score}`} aria-live="polite">
              <div className="strength__bars" aria-hidden="true">
                {[1, 2, 3, 4].map((i) => (
                  <span key={i} className={i <= strength.score ? 'is-on' : ''} />
                ))}
              </div>
              <p className="strength__text">
                قوة كلمة المرور: <strong>{strength.label}</strong>
                {strength.tips.length > 0 && <span> · {strength.tips.join('، ')}</span>}
              </p>
            </div>
          )}
        </PasswordField>
        <PasswordField
          id="signup-confirm"
          label="تأكيد كلمة المرور"
          autoComplete="new-password"
          placeholder="أعد كتابة كلمة المرور"
          value={form.confirm}
          onChange={set('confirm')}
          onBlur={blur('confirm')}
          error={show('confirm')}
        />
        <Checkbox id="signup-terms" checked={form.terms} onChange={(v) => setForm((f) => ({ ...f, terms: v }))} error={submitted && errors.terms}>
          أوافق على{' '}
          <button type="button" className="link-btn" onClick={() => setTerms(true)}>
            الشروط والأحكام
          </button>
        </Checkbox>
        <button type="submit" className="btn btn--primary btn--lg btn--block" disabled={checking}>
          {checking ? <Spinner label="جارٍ التحقق" /> : 'إنشاء الحساب'}
        </button>
      </form>
      <div className="auth__divider">
        <span>أو</span>
      </div>
      <button type="button" className="btn btn--ghost btn--lg btn--block" onClick={() => navigate('/')}>
        <Icon name="user" size={18} /> المتابعة كضيف
      </button>
      {terms && <TermsDialog onClose={() => setTerms(false)} />}
    </AuthShell>
  );
}
