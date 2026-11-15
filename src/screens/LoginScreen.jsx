import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthShell from '../components/auth/AuthShell.jsx';
import { Checkbox, ComingSoonResult, PasswordField, TextField } from '../components/auth/fields.jsx';
import { Icon } from '../components/icons.jsx';
import { Dialog, Spinner } from '../components/ui.jsx';
import { validateLogin } from '../services/authValidation.js';

export default function LoginScreen() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', remember: true });
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState(false);
  const [forgot, setForgot] = useState(false);
  const errors = validateLogin(form);
  const show = (k) => (submitted || touched[k]) && errors[k];
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const blur = (k) => () => setTouched((t) => ({ ...t, [k]: true }));

  const submit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setResult(false);
    if (Object.keys(errors).length) return;
    // No request is made: show a short check, then say plainly that sign-in is not live yet.
    setChecking(true);
    window.setTimeout(() => {
      setChecking(false);
      setResult(true);
      setForm((f) => ({ ...f, password: '' }));
      setSubmitted(false);
    }, 700);
  };

  return (
    <AuthShell
      title="أهلًا بعودتك"
      subtitle="سجّل دخولك لتكمل سباقك من أي جهاز."
      footer={
        <>
          <p>
            ليس لديك حساب؟{' '}
            <Link to="/signup" className="text-link">
              أنشئ حسابًا
            </Link>
          </p>
        </>
      }
    >
      {result && <ComingSoonResult kind="login" onClose={() => setResult(false)} />}
      <form className="auth__form" onSubmit={submit} noValidate>
        <TextField
          id="login-email"
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
          id="login-password"
          label="كلمة المرور"
          autoComplete="current-password"
          placeholder="••••••••"
          value={form.password}
          onChange={set('password')}
          onBlur={blur('password')}
          error={show('password')}
        />
        <div className="auth__row">
          <Checkbox id="login-remember" checked={form.remember} onChange={(v) => setForm((f) => ({ ...f, remember: v }))}>
            تذكّرني على هذا الجهاز
          </Checkbox>
          <button type="button" className="link-btn" onClick={() => setForgot(true)}>
            نسيت كلمة المرور؟
          </button>
        </div>
        <button type="submit" className="btn btn--primary btn--lg btn--block" disabled={checking}>
          {checking ? <Spinner label="جارٍ التحقق" /> : 'تسجيل الدخول'}
        </button>
      </form>
      <div className="auth__divider">
        <span>أو</span>
      </div>
      <button type="button" className="btn btn--ghost btn--lg btn--block" onClick={() => navigate('/')}>
        <Icon name="user" size={18} /> المتابعة كضيف
      </button>
      {forgot && (
        <Dialog
          title="استعادة كلمة المرور"
          onClose={() => setForgot(false)}
          actions={
            <button type="button" className="btn btn--primary" onClick={() => setForgot(false)} autoFocus>
              حسنًا
            </button>
          }
        >
          <p>استعادة كلمة المرور ستتوفر مع إطلاق الحسابات. لا توجد حسابات مسجّلة بعد، لذا لا شيء تحتاج إلى استعادته الآن.</p>
        </Dialog>
      )}
    </AuthShell>
  );
}
