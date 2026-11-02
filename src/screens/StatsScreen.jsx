import { useState } from 'react';
import { PageHeader, Segmented } from '../components/ui.jsx';
import { MODES, getMode } from '../engine/modes.js';
import { loadLeaderboard, loadStats } from '../services/storage.js';

const dateFmt = (iso) => {
  try {
    return new Intl.DateTimeFormat('ar-SA-u-nu-latn', { day: 'numeric', month: 'short' }).format(new Date(iso));
  } catch {
    return iso.slice(0, 10);
  }
};

export default function StatsScreen() {
  const [stats] = useState(loadStats);
  const [board] = useState(loadLeaderboard);
  const [filter, setFilter] = useState('all');
  const rows = board.filter((e) => filter === 'all' || e.mode === filter).slice(0, 10);
  const accuracy = stats.questions ? Math.round((stats.correct / stats.questions) * 100) : 0;

  return (
    <div className="stats">
      <PageHeader title="الإحصائيات" />
      <dl className="tiles">
        <div className="tile">
          <dt>ألعاب منتهية</dt>
          <dd>{stats.games}</dd>
        </div>
        <div className="tile">
          <dt>أسئلة مجابة</dt>
          <dd>{stats.questions}</dd>
        </div>
        <div className="tile">
          <dt>دقة الإجابات</dt>
          <dd>{accuracy}٪</dd>
        </div>
        <div className="tile">
          <dt>أطول سلسلة</dt>
          <dd>{stats.bestStreak}</dd>
        </div>
        <div className="tile tile--gold">
          <dt>أعلى نتيجة</dt>
          <dd>{stats.bestScore}</dd>
        </div>
      </dl>

      <section className="panel">
        <div className="panel__head">
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
          <p className="muted">لا توجد نتائج بعد. أنهِ لعبة لتظهر هنا.</p>
        )}
      </section>
    </div>
  );
}
