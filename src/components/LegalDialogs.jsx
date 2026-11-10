import { SoonBadge } from './feedback.jsx';
import { Dialog } from './ui.jsx';

const close = (onClose) => (
  <button type="button" className="btn btn--primary" onClick={onClose} autoFocus>
    حسنًا
  </button>
);

export function TermsDialog({ onClose }) {
  return (
    <Dialog title="الشروط والأحكام" onClose={onClose} actions={close(onClose)}>
      <p>
        <SoonBadge label="مسودة" /> تُنشر الشروط الكاملة مع إطلاق الحسابات. باختصار: سباق لعبة ترفيهية مجانية، والأسئلة للتسلية والتعلم، ونحتفظ بحق إيقاف أي
        غرفة تُستخدم للإساءة.
      </p>
    </Dialog>
  );
}

export function PrivacyDialog({ onClose }) {
  return (
    <Dialog title="سياسة الخصوصية" onClose={onClose} actions={close(onClose)}>
      <p>
        <SoonBadge label="مسودة" /> تُنشر السياسة الكاملة مع إطلاق الحسابات. ما يحدث اليوم:
      </p>
      <ul className="plain-list">
        <li>إعداداتك وملفك وإحصائياتك تُحفظ على جهازك فقط.</li>
        <li>اللعب أونلاين يرسل اسمك الظاهر وإجاباتك إلى خادم اللعبة أثناء المباراة فقط.</li>
        <li>لا نجمع بريدًا أو كلمات مرور، ولا نعرض إعلانات.</li>
      </ul>
    </Dialog>
  );
}

export function AboutDialog({ onClose }) {
  return (
    <Dialog title="عن سباق العقول" onClose={onClose} actions={close(onClose)}>
      <p>
        مسابقة معلومات عامة عربية للأصدقاء: 1,120 سؤالًا في 11 فئة، وتحدي الثلاثين ثانية، ومواجهات بالدور، وغرف أونلاين خاصة. تعمل دون اتصال بعد الزيارة الأولى.
      </p>
      {/* eslint-disable-next-line no-undef */}
      <p className="muted">الإصدار {typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '—'}</p>
    </Dialog>
  );
}
