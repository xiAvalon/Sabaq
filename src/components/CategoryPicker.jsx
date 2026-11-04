import { useMemo } from 'react';
import { CATEGORIES, CATEGORY_IDS } from '../data/categories.js';
import { shuffle } from '../engine/rng.js';
import { Icon } from './icons.jsx';

function breakdown(bank) {
  const out = {};
  for (const q of bank ?? []) {
    const row = (out[q.category] ??= { total: 0, 1: 0, 2: 0, 3: 0 });
    row.total += 1;
    row[q.difficulty] += 1;
  }
  return out;
}

/**
 * The category chooser used by local setup and the online lobby.
 * min/max come from the game mode (board modes need 3–6 categories).
 */
export default function CategoryPicker({ value, onChange, min = 1, max = null, bank, readOnly = false }) {
  const stats = useMemo(() => breakdown(bank), [bank]);
  const full = max !== null && value.length >= max;

  const toggle = (id) => {
    if (readOnly) return;
    if (value.includes(id)) onChange(value.filter((c) => c !== id));
    else if (!full) onChange([...value, id]);
  };
  const pickRandom = () => {
    const count = Math.min(max ?? 5, CATEGORY_IDS.length, Math.max(min, max ? max : 4));
    onChange(shuffle(CATEGORY_IDS).slice(0, Math.max(min, count)));
  };

  const hint = max ? `اختر من ${min} إلى ${max} فئات` : min > 1 ? `اختر ${min} فئات على الأقل` : 'اختر فئة واحدة أو أكثر';

  return (
    <div className="picker">
      {!readOnly && (
        <div className="picker__bar">
          <p className="picker__count" aria-live="polite">
            <strong>{value.length}</strong> من {CATEGORIES.length} فئة · <span>{hint}</span>
          </p>
          <div className="picker__actions">
            {!max && (
              <button type="button" className="chip" onClick={() => onChange([...CATEGORY_IDS])}>
                <Icon name="check" size={16} /> الكل
              </button>
            )}
            <button type="button" className="chip" onClick={pickRandom}>
              <Icon name="shuffle" size={16} /> عشوائي
            </button>
            <button type="button" className="chip" onClick={() => onChange([])} disabled={!value.length}>
              <Icon name="close" size={16} /> مسح
            </button>
          </div>
        </div>
      )}
      <ul className="picker__grid">
        {CATEGORIES.map((c, i) => {
          const on = value.includes(c.id);
          const s = stats[c.id] ?? { total: 0, 1: 0, 2: 0, 3: 0 };
          const blocked = !on && full;
          return (
            <li key={c.id} style={{ '--i': i }}>
              <button
                type="button"
                className={`cat-card${on ? ' is-on' : ''}${blocked ? ' is-blocked' : ''}`}
                style={{ '--cat': c.color }}
                aria-pressed={on}
                aria-disabled={blocked || readOnly}
                onClick={() => toggle(c.id)}
              >
                <span className="cat-card__icon">
                  <Icon name={c.icon} size={26} />
                </span>
                <span className="cat-card__check" aria-hidden="true">
                  <Icon name="check" size={14} />
                </span>
                <span className="cat-card__name">{c.name}</span>
                <span className="cat-card__meta">{s.total} سؤال</span>
                <span className="cat-card__diff" aria-label={`سهل ${s[1]}، متوسط ${s[2]}، صعب ${s[3]}`}>
                  <span style={{ flexGrow: s[1] || 0.01 }} className="d1" />
                  <span style={{ flexGrow: s[2] || 0.01 }} className="d2" />
                  <span style={{ flexGrow: s[3] || 0.01 }} className="d3" />
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {!readOnly && full && <p className="picker__note">وصلت إلى الحد الأقصى لهذا النمط. ألغِ فئة لتختار غيرها.</p>}
    </div>
  );
}
