import { useState } from 'react';
import { Icon } from '../components/icons.jsx';
import { EmptyState, PageHeader, Segmented } from '../components/ui.jsx';
import { ACHIEVEMENTS } from '../engine/achievements.js';
import { MODES, getMode } from '../engine/modes.js';
import { CATEGORY_IDS } from '../data/categories.js';
import { loadAchievements, loadLeaderboard, loadStats } from '../services/storage.js';

const dateFmt = (iso) => {
  try {
    return new Intl.DateTimeFormat('ar-SA-u-nu-latn-ca-gregory', { day: 'numeric', month: 'short' }).format(new Date(iso));
  } catch {
    return iso.slice(0, 10);
  }
};

export default function StatsScreen() {
  const [stats] = useState(loadStats);
  const [board] = useState(loadLeaderboard);
  const [unlocked] = useState(loadAchievements);
  const [filter, setFilter] = useState('all');
  const rows = board.filter((e) => filter === 'all' || e.mode === filter).slice(0, 10);
  const accuracy = stats.questions ? Math.round((stats.correct / stats.questions) * 100) : 0;

  return (
    <div className="screen">
      <PageHeader title="الإحصائيات والإنجازات" subtitle="أرقامك وإنجازاتك من المباريات على هذا الجهاز، وتُحفظ عليه فقط." />
      <dl className="tiles">
        <div className="tile">
          <dt>مباريات</dt>
          <dd>{stats.games}</dd>
        </div>
        <div className="tile">
          <dt>أسئلة مجابة</dt>
          <dd>{stats.questions}</dd>
        </div>
        <div className="tile">
          <dt>الدقة</dt>
          <dd>{accuracy}٪</dd>
        </div>
        <div className="tile">
          <dt>أفضل 30 ثانية</dt>
          <dd>{stats.rushBestCorrect ?? 0}</dd>
        </div>
        <div className="tile tile--gold">
          <dt>أعلى نتيجة</dt>
          <dd>{stats.bestScore}</dd>
        </div>
      </dl>

      <section className="card">
        <div className="card__head">
          <h2>الإنجازات</h2>
          <span className="card__hint">
            {unlocked.length} من {ACHIEVEMENTS.length}
          </span>
        </div>
        <ul className="achievements">
          {ACHIEVEMENTS.map((a) => {
            const on = unlocked.includes(a.id);
            const done = on ? a.target : Math.min(a.target, a.progress({ stats, categoryIds: CATEGORY_IDS }));
            return (
              <li key={a.id} className={`achievement${on ? ' is-unlocked' : ''}`}>
                <span className="achievement__icon">
                  <Icon name={on ? a.icon : 'lock'} />
                </span>
                <span className="achievement__body">
                  <span className="achievement__title">{a.title}</span>
                  <span className="achievement__desc">{a.desc}</span>
                  {a.target > 1 && (
                    <span className="achievement__progress">
                      <span
                        className="achievement__bar"
                        role="progressbar"
                        aria-label={`تقدم ${a.title}`}
                        aria-valuemin={0}
                        aria-valuemax={a.target}
                        aria-valuenow={done}
                      >
                        <span style={{ width: `${(done / a.target) * 100}%` }} />
                      </span>
                      <span className="achievement__count num-ltr">
                        {done}/{a.target}
                      </span>
                    </span>
                  )}
                  {on && <span className="achievement__state">مفتوح</span>}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="card">
        <div className="card__head">
          <h2>لوحة الصدارة</h2>
          <Segmented
            id="board-filter"
            label="تصفية حسب النمط"
            value={filter}
            onChange={setFilter}
            options={[{ value: 'all', label: 'الكل' }, ...MODES.map((m) => ({ value: m.id, label: m.name }))]}
          />
        </div>
        {rows.length ? (
          <div className="table-wrap">
            <table className="leaderboard">
              <thead>
                <tr>
                  <th scope="col">#</th>
                  <th scope="col">الاسم</th>
                  <th scope="col">النمط</th>
                  <th scope="col">الدقة</th>
                  <th scope="col">التاريخ</th>
                  <th scope="col">النقاط</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((e, i) => (
                  <tr key={`${e.date}-${e.name}-${i}`}>
                    <td>{i + 1}</td>
                    <td>{e.name}</td>
                    <td>{getMode(e.mode)?.name ?? e.mode}</td>
                    <td>{e.accuracy}٪</td>
                    <td>{dateFmt(e.date)}</td>
                    <td className="leaderboard__score">{e.score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState icon="trophy" title="لا نتائج بعد">
            أنهِ مباراة لتظهر نتيجتك هنا.
          </EmptyState>
        )}
      </section>
    </div>
  );
}
