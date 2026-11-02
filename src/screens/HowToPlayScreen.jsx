import { Link } from 'react-router-dom';
import { PageHeader } from '../components/ui.jsx';
import { DIFFICULTIES, POWERUPS, SCORING } from '../engine/config.js';
import { MODES } from '../engine/modes.js';

const TYPE_HELP = [
  ['اختيار من متعدد', 'أربعة خيارات، واحد منها صحيح. يمكنك الضغط على الأرقام 1–4.'],
  ['صح أم خطأ', 'احكم على العبارة. لا تتاح فيها فرصة السرقة إلا عند نفاد الوقت.'],
  ['إجابة مفتوحة', 'اكتب الإجابة. نتجاهل التشكيل والهمزات و«ال» والأخطاء الإملائية البسيطة.'],
  ['خمّن الرقم', 'اكتب رقمًا. بعض الأسئلة تقبل هامشًا للتقريب يُذكر في السؤال.'],
  ['أكمل العبارة', 'املأ الفراغ في المثل أو المعلومة.'],
  ['من أنا؟', 'يظهر دليل واحد، ولك طلب أدلة إضافية مقابل خصم 15٪ من القيمة لكل دليل.'],
  ['ما التالي؟', 'اكتشف النمط واختر العنصر التالي في السلسلة.'],
  ['سؤال الصورة', 'تعرّف على العلم أو الشكل أو الشيء في الصورة.'],
];

export default function HowToPlayScreen() {
  return (
    <div className="howto">
      <PageHeader title="كيف ألعب؟" />

      <section className="panel">
        <div className="panel__head">
          <h2>أنماط اللعب</h2>
        </div>
        <div className="howto__modes">
          {MODES.map((m) => (
            <article key={m.id} className="howto__mode">
              <h3>
                <span aria-hidden="true">{m.glyph}</span> {m.name}
              </h3>
              <ul>
                {m.rules.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
              <Link to={`/setup/${m.id}`} className="text-link">
                جهّز لعبة «{m.name}»
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel__head">
          <h2>حساب النقاط</h2>
        </div>
        <ul className="howto__list">
          <li>
            قيمة السؤال حسب صعوبته: {DIFFICULTIES[1].label} {DIFFICULTIES[1].points}، {DIFFICULTIES[2].label} {DIFFICULTIES[2].points}، {DIFFICULTIES[3].label} {DIFFICULTIES[3].points}.
          </li>
          <li>
            السلسلة: كل إجابة صحيحة متتالية تضيف {SCORING.streakStep * 100}٪ إلى قيمة السؤال، حتى {SCORING.streakMax * 100}٪.
          </li>
          <li>الإجابة الخاطئة لا تخصم شيئًا، إلا إذا اخترت المخاطرة أو الرهان.</li>
          <li>السرقة تمنح قيمة السؤال كاملة لمن يجيب بعد خطأ منافسه.</li>
          <li>الأسئلة الذهبية والجولات الذهبية تضاعف النقاط.</li>
        </ul>
      </section>

      <section className="panel">
        <div className="panel__head">
          <h2>وسائل المساعدة</h2>
          <span className="panel__hint">عدد مرات كل وسيلة يُحدد قبل اللعب</span>
        </div>
        <dl className="howto__powerups">
          {Object.values(POWERUPS).map((p) => (
            <div key={p.id}>
              <dt>{p.label}</dt>
              <dd>{p.hint}</dd>
            </div>
          ))}
        </dl>
        <p className="muted">لا تُستخدم وسائل المساعدة في أسئلة السرقة والرهان.</p>
      </section>

      <section className="panel">
        <div className="panel__head">
          <h2>أنواع الأسئلة</h2>
        </div>
        <dl className="howto__types">
          {TYPE_HELP.map(([name, help]) => (
            <div key={name}>
              <dt>{name}</dt>
              <dd>{help}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
